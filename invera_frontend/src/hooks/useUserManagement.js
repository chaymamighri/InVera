// src/hooks/useUserManagement.js
import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { userService } from '../services/userService';

const parseActive = (val) => {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'number') return val === 1;
  if (typeof val === 'string') {
    const v = val.trim().toLowerCase();
    if (v === 'true' || v === 't' || v === '1' || v === 'yes') return true;
    if (v === 'false' || v === 'f' || v === '0' || v === 'no') return false;
  }
  return false;
};

export const useUserManagement = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const users = await userService.getAllUsers();

      return (users || []).map((u) => {
        const rawActive =
          u.active !== undefined ? u.active :
          u.isActive !== undefined ? u.isActive :
          u.enabled !== undefined ? u.enabled :
          u.status !== undefined ? u.status :
          false;

        return {
          id: u.id,
          name: `${u.nom} ${u.prenom}`.trim(),
          email: u.email,
          role:
            u.role === 'COMMERCIAL' ? 'sales' :
            u.role === 'RESPONSABLE_ACHAT' ? 'procurement' :
            u.role === 'ADMIN' ? 'admin' :
            String(u.role || '').toLowerCase(),
          active: parseActive(rawActive),
        };
      });
    } catch (err) {
      const message = typeof err === 'string' ? err : err.message || 'Erreur lors du chargement';
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
      const nameParts = user.name.trim().split(' ');
      const prenom = nameParts.pop() || '';
      const nom = nameParts.join(' ') || prenom;

      const payload = {
        username: user.email.split('@')[0],
        email: user.email,
        nom,
        prenom,
        role:
          user.role === 'sales' ? 'COMMERCIAL' :
          user.role === 'procurement' ? 'RESPONSABLE_ACHAT' :
          'COMMERCIAL',
      };

      await userService.createUser(payload);
      toast.success('Utilisateur créé. Email de création envoyé.');
    } catch (err) {
      const msg = err?.message || err?.toString?.() || "Erreur lors de l'ajout";
      toast.error(msg);
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUser = useCallback(async (id, updatedData) => {
    setLoading(true);
    setError(null);
    try {
      const nameParts = updatedData.name.trim().split(' ');
      const prenom = nameParts.pop() || '';
      const nom = nameParts.join(' ') || prenom;

      const payload = {
        username: updatedData.email.split('@')[0],
        email: updatedData.email,
        nom,
        prenom,
        role:
          updatedData.role === 'sales' ? 'COMMERCIAL' :
          updatedData.role === 'procurement' ? 'RESPONSABLE_ACHAT' :
          'COMMERCIAL',
      };

      await userService.updateUser(updatedData.email, payload);
      toast.success('Utilisateur mis à jour.');
    } catch (err) {
      const msg = err?.message || err?.toString?.() || 'Erreur lors de la mise à jour';
      toast.error(msg);
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const setUserActiveStatus = useCallback(async (email, active) => {
    setLoading(true);
    setError(null);
    try {
      await userService.setUserActiveStatus(email, active);
      toast.success(active ? 'Utilisateur activé.' : 'Utilisateur désactivé.');
    } catch (err) {
      const msg = err?.message || err?.toString?.() || 'Erreur lors du changement de statut';
      toast.error(msg);
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteUserByEmail = useCallback(async (email) => {
    setLoading(true);
    setError(null);
    try {
      await userService.deleteUser(email);
      toast.success('Utilisateur supprimé.');
    } catch (err) {
      const msg = err?.message || err?.toString?.() || 'Erreur lors de la suppression';
      toast.error(msg);
      setError(msg);
      throw new Error(msg);
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
