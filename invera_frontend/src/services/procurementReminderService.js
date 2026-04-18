const STORAGE_KEY = 'procurement-commande-reminders-v1';
const REMINDER_EVENT = 'procurement-reminders-updated';
const REMINDER_ID_PREFIX = 'procurement-reminder';
const REMINDER_DELAY_MS = 24 * 60 * 60 * 1000;
const DISMISSED_META_KEY = '__dismissedReminderKeys__';

const safeParse = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const normalizeRole = (value) => String(value || '').trim().toUpperCase().replace(/^ROLE_/, '');
const normalizeStatus = (value) => String(value || '').trim().toUpperCase();

const getCurrentUserKey = () => {
  const role = normalizeRole(localStorage.getItem('userRole'));
  const email = String(localStorage.getItem('userEmail') || '').trim().toLowerCase();
  const name = String(localStorage.getItem('userName') || '').trim().toLowerCase();

  return `${role || 'USER'}:${email || name || 'anonymous'}`;
};

const readState = () => safeParse(localStorage.getItem(STORAGE_KEY), {});

const emitUpdate = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(REMINDER_EVENT));
  }
};

const writeState = (state) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  emitUpdate();
};

const getBucketForUser = (state, userKey) => safeParse(JSON.stringify(state?.[userKey] || {}), {});

const getDismissedMap = (state) => safeParse(JSON.stringify(state?.[DISMISSED_META_KEY] || {}), {});

const getDismissedKeysForUser = (state, userKey) => new Set(getDismissedMap(state)?.[userKey] || []);

const setBucketForUser = (state, userKey, bucket) => {
  const nextState = { ...state };

  if (Object.keys(bucket).length > 0) {
    nextState[userKey] = bucket;
  } else {
    delete nextState[userKey];
  }

  return nextState;
};

const setDismissedKeysForUser = (state, userKey, dismissedKeys) => {
  const nextState = { ...state };
  const dismissedMap = getDismissedMap(state);
  const values = Array.from(dismissedKeys || []);

  if (values.length > 0) {
    nextState[DISMISSED_META_KEY] = {
      ...dismissedMap,
      [userKey]: values,
    };
  } else if (Object.keys(dismissedMap).length > 0) {
    const nextDismissedMap = { ...dismissedMap };
    delete nextDismissedMap[userKey];

    if (Object.keys(nextDismissedMap).length > 0) {
      nextState[DISMISSED_META_KEY] = nextDismissedMap;
    } else {
      delete nextState[DISMISSED_META_KEY];
    }
  } else {
    delete nextState[DISMISSED_META_KEY];
  }

  return nextState;
};

const getCommandeId = (commande) => {
  const rawId = commande?.idCommandeFournisseur ?? commande?.id ?? null;
  return rawId === null || rawId === undefined ? '' : String(rawId);
};

const getReminderKey = (commandeId, status) => `${REMINDER_ID_PREFIX}:${commandeId}:${status}`;

const getReminderCopy = (status) => {
  if (status === 'VALIDEE') {
    return {
      title: 'Commande a envoyer',
      message: 'Commande validee depuis plus de 24 heures.',
      badge: 'A envoyer',
      actionHint: 'Envoyez-la au fournisseur.',
    };
  }

  return {
    title: 'Commande a confirmer',
    message: 'Cette commande est en brouillon depuis plus de 24 heures et attend toujours votre validation.',
    badge: 'A confirmer',
    actionHint: 'Validez-la ou mettez-la a jour.',
  };
};

const mapEntryToReminder = (entry) => {
  const copy = getReminderCopy(entry.status);
  const reminderPath = `/dashboard/procurement/commandes?focusCommande=${encodeURIComponent(
    entry.commandeId
  )}&reminderStage=${encodeURIComponent(entry.status)}`;

  return {
    id: entry.id,
    read: Boolean(entry.read),
    createdAt: entry.createdAt,
    source: 'procurement-reminder',
    title: copy.title,
    badgeLabel: copy.badge,
    message: `${copy.message} Commande ${entry.numeroCommande || `#${entry.commandeId}`}.`,
    actionLabel: 'Voir la commande',
    actionHint: copy.actionHint,
    commandeId: entry.commandeId,
    numeroCommande: entry.numeroCommande || `#${entry.commandeId}`,
    fournisseurNom: entry.fournisseurNom || '',
    reminderStage: entry.status,
    reminderPath,
  };
};

const getStoredEntriesForCurrentUser = () => {
  const state = readState();
  const bucket = state[getCurrentUserKey()] || {};

  return Object.values(bucket)
    .filter((entry) => !entry.dismissed)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

const mutateCurrentUserState = (mutator) => {
  const state = readState();
  const userKey = getCurrentUserKey();
  const bucket = getBucketForUser(state, userKey);
  const dismissedKeys = getDismissedKeysForUser(state, userKey);
  const result = mutator({
    bucket,
    dismissedKeys,
  }) || {};
  const nextBucket = result.bucket || bucket;
  const nextDismissedKeys = result.dismissedKeys || dismissedKeys;
  let nextState = setBucketForUser(state, userKey, nextBucket);
  nextState = setDismissedKeysForUser(nextState, userKey, nextDismissedKeys);
  writeState(nextState);
  return {
    bucket: nextBucket,
    dismissedKeys: nextDismissedKeys,
  };
};

const shouldCreateReminder = (commande, now) => {
  const status = normalizeStatus(commande?.statut);
  if (status !== 'VALIDEE') {
    return false;
  }

  const baseDate = commande?.dateCommande || commande?.createdAt;
  const createdAtMs = new Date(baseDate).getTime();

  if (!Number.isFinite(createdAtMs)) {
    return false;
  }

  return createdAtMs + REMINDER_DELAY_MS <= now;
};

const procurementReminderService = {
  REMINDER_EVENT,

  isReminderId(id) {
    return String(id || '').startsWith(`${REMINDER_ID_PREFIX}:`);
  },

  syncCommandes(commandes = []) {
    const now = Date.now();
    const state = readState();
    const userKey = getCurrentUserKey();
    const currentBucket = getBucketForUser(state, userKey);
    const dismissedKeys = getDismissedKeysForUser(state, userKey);
    const nextBucket = {};

    commandes.forEach((commande) => {
      if (!shouldCreateReminder(commande, now)) {
        return;
      }

      const commandeId = getCommandeId(commande);
      const status = normalizeStatus(commande?.statut);
      const createdAtMs = new Date(commande?.dateCommande || commande?.createdAt).getTime();
      const reminderKey = getReminderKey(commandeId, status);
      const existing = currentBucket[reminderKey] || {};
      const isDismissed = Boolean(existing.dismissed) || dismissedKeys.has(reminderKey);

      nextBucket[reminderKey] = {
        id: reminderKey,
        commandeId,
        status,
        numeroCommande: commande?.numeroCommande || `#${commandeId}`,
        fournisseurNom: commande?.fournisseur?.nomFournisseur || '',
        dateCommande: commande?.dateCommande || commande?.createdAt || null,
        createdAt: existing.createdAt || new Date(createdAtMs + REMINDER_DELAY_MS).toISOString(),
        read: Boolean(existing.read),
        dismissed: isDismissed,
        readAt: existing.readAt || null,
        dismissedAt: existing.dismissedAt || (isDismissed ? new Date().toISOString() : null),
      };
    });

    // Preserve dismissed reminder ids even if a sync runs before commandes finish loading.
    const nextDismissedKeys = new Set(dismissedKeys);
    Object.keys(nextBucket).forEach((key) => {
      if (nextBucket[key]?.dismissed) {
        nextDismissedKeys.add(key);
      }
    });
    let nextState = setBucketForUser(state, userKey, nextBucket);
    nextState = setDismissedKeysForUser(nextState, userKey, nextDismissedKeys);
    writeState(nextState);

    return Object.values(nextBucket)
      .filter((entry) => !entry.dismissed)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map(mapEntryToReminder);
  },

  getStoredReminders() {
    return getStoredEntriesForCurrentUser().map(mapEntryToReminder);
  },

  markRead(id) {
    if (!this.isReminderId(id)) {
      return;
    }

    mutateCurrentUserState(({ bucket, dismissedKeys }) => {
      if (!bucket[id]) {
        return { bucket, dismissedKeys };
      }

      return {
        bucket: {
          ...bucket,
          [id]: {
            ...bucket[id],
            read: true,
            readAt: new Date().toISOString(),
          },
        },
        dismissedKeys,
      };
    });
  },

  markReadByCommande(commandeId, status) {
    const normalizedStatus = normalizeStatus(status);
    if (!commandeId || normalizedStatus !== 'VALIDEE') {
      return;
    }

    this.markRead(getReminderKey(String(commandeId), normalizedStatus));
  },

  markAllRead() {
    mutateCurrentUserState(({ bucket, dismissedKeys }) => {
      const readAt = new Date().toISOString();
      const nextBucket = {};

      Object.entries(bucket).forEach(([key, entry]) => {
        nextBucket[key] = {
          ...entry,
          read: true,
          readAt,
        };
      });

      return {
        bucket: nextBucket,
        dismissedKeys,
      };
    });
  },

  dismiss(id) {
    if (!this.isReminderId(id)) {
      return 0;
    }

    let deleted = 0;

    mutateCurrentUserState(({ bucket, dismissedKeys }) => {
      if (!bucket[id]) {
        return { bucket, dismissedKeys };
      }

      deleted = 1;
      const nextDismissedKeys = new Set(dismissedKeys);
      nextDismissedKeys.add(id);

      return {
        bucket: {
          ...bucket,
          [id]: {
            ...bucket[id],
            dismissed: true,
            dismissedAt: new Date().toISOString(),
          },
        },
        dismissedKeys: nextDismissedKeys,
      };
    });

    return deleted;
  },

  dismissAll() {
    let deleted = 0;

    mutateCurrentUserState(({ bucket, dismissedKeys }) => {
      const dismissedAt = new Date().toISOString();
      const nextBucket = {};
      const nextDismissedKeys = new Set(dismissedKeys);

      Object.entries(bucket).forEach(([key, entry]) => {
        nextDismissedKeys.add(key);
        nextBucket[key] = {
          ...entry,
          dismissed: true,
          dismissedAt,
        };
        deleted += 1;
      });

      return {
        bucket: nextBucket,
        dismissedKeys: nextDismissedKeys,
      };
    });

    return deleted;
  },

  dismissMonth(monthValue) {
    let deleted = 0;

    mutateCurrentUserState(({ bucket, dismissedKeys }) => {
      const dismissedAt = new Date().toISOString();
      const nextBucket = {};
      const nextDismissedKeys = new Set(dismissedKeys);

      Object.entries(bucket).forEach(([key, entry]) => {
        const entryMonth = new Date(entry.createdAt);
        const value = Number.isFinite(entryMonth.getTime())
          ? `${entryMonth.getFullYear()}-${String(entryMonth.getMonth() + 1).padStart(2, '0')}`
          : '';

        if (value === monthValue) {
          nextDismissedKeys.add(key);
          nextBucket[key] = {
            ...entry,
            dismissed: true,
            dismissedAt,
          };
          deleted += 1;
          return;
        }

        nextBucket[key] = entry;
      });

      return {
        bucket: nextBucket,
        dismissedKeys: nextDismissedKeys,
      };
    });

    return deleted;
  },

  dismissRange(range) {
    const now = Date.now();
    const days = range === 'week' ? 7 : range === 'month' ? 30 : 0;

    if (!days) {
      return 0;
    }

    let deleted = 0;

    mutateCurrentUserState(({ bucket, dismissedKeys }) => {
      const dismissedAt = new Date().toISOString();
      const nextBucket = {};
      const nextDismissedKeys = new Set(dismissedKeys);

      Object.entries(bucket).forEach(([key, entry]) => {
        const entryMs = new Date(entry.createdAt).getTime();
        const diffDays = Number.isFinite(entryMs) ? (now - entryMs) / (24 * 60 * 60 * 1000) : Infinity;

        if (diffDays <= days) {
          nextDismissedKeys.add(key);
          nextBucket[key] = {
            ...entry,
            dismissed: true,
            dismissedAt,
          };
          deleted += 1;
          return;
        }

        nextBucket[key] = entry;
      });

      return {
        bucket: nextBucket,
        dismissedKeys: nextDismissedKeys,
      };
    });

    return deleted;
  },
};

export default procurementReminderService;
