// frontend/src/hooks/useUserManagement.js
import { useState, useCallback } from 'react';
import { userService } from '../services/userService';

export const useUserManagement = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Récupère tous les utilisateurs depuis le backend.
   * Transforme les données au format attendu par le composant.
   */
  const getUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const users = await userService.getAllUsers();
      // Transformation : backend renvoie { id, username, email, nom, prenom, role, active? }
      // Si active n'est pas présent, on le définit par défaut à true (mais idéalement il est présent)
      return users.map(u => ({
        id: u.id,
        name: `${u.nom} ${u.prenom}`.trim(),
        email: u.email,
        role: u.role === 'COMMERCIAL' ? 'sales' : (u.role === 'RESPONSABLE_ACHAT' ? 'procurement' : u.role.toLowerCase()),
        active: u.active !== undefined ? u.active : true // si le backend ne renvoie pas active, mettre true par défaut
      }));
    } catch (err) {
      const message = typeof err === 'string' ? err : err.message || 'Erreur lors du chargement';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Ajoute un nouvel utilisateur.
   * @param {Object} user - { name, email, role } (role: 'sales' ou 'procurement')
   */
  const addUser = useCallback(async (user) => {
    setLoading(true);
    setError(null);
    try {
      // Séparer le nom complet en nom et prénom (simple)
      const nameParts = user.name.trim().split(' ');
      const prenom = nameParts.pop() || '';
      const nom = nameParts.join(' ') || prenom;

      const payload = {
        username: user.email.split('@')[0], // génération simple, à ajuster si besoin
        email: user.email,
        nom: nom,
        prenom: prenom,
        role: user.role === 'sales' ? 'COMMERCIAL' : 'RESPONSABLE_ACHAT'
      };
      await userService.createUser(payload);
    } catch (err) {
      const message = typeof err === 'string' ? err : err.message || "Erreur lors de l'ajout";
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Met à jour un utilisateur existant.
   * @param {number} id - ID utilisateur (non utilisé directement, on utilise l'email)
   * @param {Object} updatedData - { id, name, email, role, active? }
   */
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
        nom: nom,
        prenom: prenom,
        role: updatedData.role === 'sales' ? 'COMMERCIAL' : 'RESPONSABLE_ACHAT'
      };
      await userService.updateUser(updatedData.email, payload);
    } catch (err) {
      const message = typeof err === 'string' ? err : err.message || 'Erreur lors de la mise à jour';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Active ou désactive un utilisateur.
   * @param {string} email
   * @param {boolean} active
   */
  const setUserActiveStatus = useCallback(async (email, active) => {
    setLoading(true);
    setError(null);
    try {
      await userService.setUserActiveStatus(email, active);
    } catch (err) {
      const message = typeof err === 'string' ? err : err.message || 'Erreur lors du changement de statut';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Supprime un utilisateur par email.
   * @param {string} email
   */
  const deleteUserByEmail = useCallback(async (email) => {
    setLoading(true);
    setError(null);
    try {
      await userService.deleteUser(email);
    } catch (err) {
      const message = typeof err === 'string' ? err : err.message || 'Erreur lors de la suppression';
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