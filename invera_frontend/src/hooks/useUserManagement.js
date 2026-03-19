import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { userService } from '../services/userService';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const parseActive = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', 't', '1', 'yes'].includes(normalized)) return true;
    if (['false', 'f', '0', 'no'].includes(normalized)) return false;
  }

  return false;
};

const splitFullName = (fullName = '') => {
  const parts = String(fullName).trim().split(/\s+/).filter(Boolean);
  const prenom = parts.pop() || '';
  const nom = parts.join(' ') || prenom;

  return { nom, prenom };
};

const mapFrontendRoleToBackend = (role) => {
  switch (role) {
    case 'procurement':
      return 'RESPONSABLE_ACHAT';
    case 'sales':
    default:
      return 'COMMERCIAL';
  }
};

const extractErrorMessage = (error, fallbackMessage) => {
  const backendMessage =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    (typeof error?.response?.data === 'string' ? error.response.data : '');

  if (typeof backendMessage === 'string' && backendMessage.trim()) {
    return backendMessage.trim();
  }

  if (typeof error === 'string' && error.trim()) {
    return error.trim();
  }

  if (typeof error?.message === 'string' && error.message.trim()) {
    return error.message.trim();
  }

  return fallbackMessage;
};

export const useUserManagement = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const users = await userService.getAllUsers();

      return (users || []).map((user) => {
        const rawActive =
          user.active !== undefined ? user.active :
          user.isActive !== undefined ? user.isActive :
          user.enabled !== undefined ? user.enabled :
          user.status !== undefined ? user.status :
          false;

        return {
          id: user.id,
          name: `${user.nom || ''} ${user.prenom || ''}`.trim(),
          email: user.email || '',
          role:
            user.role === 'COMMERCIAL' ? 'sales' :
            user.role === 'RESPONSABLE_ACHAT' ? 'procurement' :
            user.role === 'ADMIN' ? 'admin' :
            String(user.role || '').toLowerCase(),
          active: parseActive(rawActive),
        };
      });
    } catch (err) {
      const message = extractErrorMessage(err, 'Erreur lors du chargement');
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const addUser = useCallback(async (user) => {
    setLoading(true);
    setError(null);

    try {
      const email = String(user?.email || '').trim().toLowerCase();
      const name = String(user?.name || '').trim();

      if (!name) {
        throw new Error("Le nom de l'utilisateur est requis.");
      }

      if (!EMAIL_REGEX.test(email)) {
        throw new Error("L'adresse email n'est pas valide.");
      }

      if (user?.role === 'admin') {
        throw new Error("Vous pouvez creer uniquement des comptes Commercial ou Responsable Achat.");
      }

      const { nom, prenom } = splitFullName(name);
      const payload = {
        username: email.split('@')[0],
        email,
        nom,
        prenom,
        role: mapFrontendRoleToBackend(user?.role),
      };

      return await userService.createUser(payload);
    } catch (err) {
      const message = extractErrorMessage(err, "Erreur lors de l'ajout");
      toast.error(message);
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUser = useCallback(async (id, updatedData) => {
    setLoading(true);
    setError(null);

    try {
      const email = String(updatedData?.email || '').trim().toLowerCase();
      const name = String(updatedData?.name || '').trim();

      if (!name) {
        throw new Error("Le nom de l'utilisateur est requis.");
      }

      if (!EMAIL_REGEX.test(email)) {
        throw new Error("L'adresse email n'est pas valide.");
      }

      if (updatedData?.role === 'admin') {
        throw new Error("Le role Administrateur n'est pas modifiable depuis cette interface.");
      }

      const { nom, prenom } = splitFullName(name);
      const payload = {
        username: email.split('@')[0],
        email,
        nom,
        prenom,
        role: mapFrontendRoleToBackend(updatedData?.role),
      };

      return await userService.updateUser(email, payload);
    } catch (err) {
      const message = extractErrorMessage(err, 'Erreur lors de la mise a jour');
      toast.error(message);
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const setUserActiveStatus = useCallback(async (email, active) => {
    setLoading(true);
    setError(null);

    try {
      return await userService.setUserActiveStatus(email, active);
    } catch (err) {
      const message = extractErrorMessage(err, 'Erreur lors du changement de statut');
      toast.error(message);
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteUserByEmail = useCallback(async (email) => {
    setLoading(true);
    setError(null);

    try {
      return await userService.deleteUser(email);
    } catch (err) {
      const message = extractErrorMessage(err, 'Erreur lors de la suppression');
      toast.error(message);
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    getUsers,
    addUser,
    updateUser,
    setUserActiveStatus,
    deleteUserByEmail
  };
};
