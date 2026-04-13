const normalizeValue = (value) => String(value || '').trim().toUpperCase();

export const getNotificationAction = (notification) => {
  const entityType = normalizeValue(notification?.entityType);
  const entityId = notification?.entityId;

  if (entityType === 'COMMANDE_FOURNISSEUR' && entityId !== null && entityId !== undefined) {
    const notificationType = normalizeValue(notification?.type) === 'PROCUREMENT_REQUEST_RESUBMITTED'
      ? 'resent'
      : 'created';

    return {
      actionLabel: 'Voir la demande',
      actionHint: notificationType === 'resent'
        ? 'Cette demande a ete renvoyee apres correction et attend une nouvelle validation.'
        : 'Cette demande attend la validation de l administrateur.',
      actionPath:
        `/dashboard/admin/validation-commandes?focusCommande=${encodeURIComponent(entityId)}` +
        `&notificationType=${encodeURIComponent(notificationType)}`,
    };
  }

  return null;
};

export const decorateNotification = (notification) => {
  const type = normalizeValue(notification?.type);
  const action = getNotificationAction(notification);

  const defaults = {};

  if (type === 'PROCUREMENT_REQUEST_CREATED') {
    defaults.title = 'Demande approvisionnement';
    defaults.badgeLabel = 'Nouvelle';
  } else if (type === 'PROCUREMENT_REQUEST_RESUBMITTED') {
    defaults.title = 'Demande approvisionnement';
    defaults.badgeLabel = 'Renvoyee';
  }

  return {
    ...notification,
    ...defaults,
    ...(action || {}),
  };
};
