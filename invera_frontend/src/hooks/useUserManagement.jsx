import { useState } from "react";

export const useUserManagement = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const STORAGE_KEY = "users-management";

  const defaultUsers = [
    { id: 1, name: "Amal ben salah", email: "commercial@invera.com", role: "sales", active: true },
    { id: 2, name: "Jean Leroy", email: "procurement@invera.com", role: "procurement", active: true },
  ];

  const initUsers = () => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultUsers));
    }
  };

  const getUsers = () => {
    initUsers();
    return JSON.parse(localStorage.getItem(STORAGE_KEY));
  };

  const saveUsers = (users) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  };

  // ➕ Add user
  const addUser = async (user) => {
    setLoading(true);
    setError(null);
    try {
      await new Promise((r) => setTimeout(r, 300));
      const users = getUsers();
      if (users.find((u) => u.email === user.email)) {
        throw new Error("Utilisateur déjà existant");
      }
      const newUser = { ...user, id: Date.now(), active: true };
      saveUsers([...users, newUser]);
      return newUser;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 🔄 Update user completely
  const updateUser = async (id, updatedData) => {
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 300));
      const users = getUsers().map((u) =>
        u.id === id ? { ...u, ...updatedData } : u
      );
      saveUsers(users);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 🔄 Change role
  const updateUserRole = async (id, role) => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 300));
    const users = getUsers().map((u) => (u.id === id ? { ...u, role } : u));
    saveUsers(users);
    setLoading(false);
  };

  // ✅ Enable / Disable
  const toggleUserStatus = async (id) => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 300));
    const users = getUsers().map((u) =>
      u.id === id ? { ...u, active: !u.active } : u
    );
    saveUsers(users);
    setLoading(false);
  };

  // 🗑 Delete
  const deleteUser = async (id) => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 300));
    const users = getUsers().filter((u) => u.id !== id);
    saveUsers(users);
    setLoading(false);
  };

  return {
    loading,
    error,
    getUsers,
    addUser,
    updateUserRole,
    toggleUserStatus,
    deleteUser,
    updateUser,
  };
};
