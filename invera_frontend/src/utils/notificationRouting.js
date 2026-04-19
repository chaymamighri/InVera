const normalizeValue = (value) => String(value || '').trim().toUpperCase();

export const getNotificationAction = (notification) => {
  const entityType = normalizeValue(notification?.entityType);
  const entityId = notification?.entityId;
  const type = normalizeValue(notification?.type);

  if (entityType === 'COMMANDE_FOURNISSEUR' && entityId !== null && entityId !== undefined) {
    if (type === 'PROCUREMENT_REQUEST_APPROVED' || type === 'PROCUREMENT_REQUEST_REJECTED') {
      const notificationType = type === 'PROCUREMENT_REQUEST_REJECTED' ? 'rejected' : 'approved';

      return {
        actionLabel: 'Voir la commande',
        actionHint: notificationType === 'rejected'
          ? 'Consultez la commande pour voir le motif du rejet et la corriger.'
          : 'Consultez la commande validee pour l envoyer au fournisseur.',
        actionPath:
          `/dashboard/procurement/commandes?focusCommande=${encodeURIComponent(entityId)}` +
          `&notificationType=${encodeURIComponent(notificationType)}`,
      };
    }

    const notificationType = type === 'PROCUREMENT_REQUEST_RESUBMITTED'
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
  } else if (type === 'PROCUREMENT_REQUEST_APPROVED') {
    defaults.title = 'Decision admin';
    defaults.badgeLabel = 'Confirmee';
  } else if (type === 'PROCUREMENT_REQUEST_REJECTED') {
    defaults.title = 'Decision admin';
    defaults.badgeLabel = 'Rejetee';
  }

  return {
    ...notification,
    ...defaults,
    ...(action || {}),
  };
};
