// src/pages/admin/users/gestionUsers.jsx
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XCircleIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import { useUserManagement } from '../../../../hooks/useUserManagement';

const Modal = ({ open, onClose, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition"
        >
          <XCircleIcon className="w-6 h-6" />
        </button>
        {children}
      </div>
    </div>
  );
};

const ConfirmModal = ({ open, onCancel, onConfirm, title, message, confirmText = "Confirmer" }) => {
  if (!open) return null;
  return (
    <Modal open={open} onClose={onCancel}>
      <h2 className="text-xl font-bold text-gray-900 mb-2">{title}</h2>
      <p className="text-sm text-gray-600 mb-6">{message}</p>
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
        >
          Annuler
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  );
};

const InputField = ({ label, value, onChange, placeholder, type = "text" }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-white"
    />
  </div>
);

const SelectField = ({ label, value, onChange, options }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-white"
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
);

const ToggleSwitch = ({ checked, onChange, disabled }) => (
  <button
    onClick={() => onChange(!checked)}
    disabled={disabled}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
      checked ? 'bg-emerald-500' : 'bg-gray-200'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
      checked ? 'translate-x-6' : 'translate-x-1'
    }`} />
  </button>
);

const roleLabel = (role) => {
  if (role === 'sales') return 'Commercial';
  if (role === 'procurement') return 'Achat';
  if (role === 'admin') return 'Admin';
  return role;
};

const getRoleColor = (role) => {
  switch(role) {
    case 'sales':
      return 'bg-emerald-100 text-emerald-700';
    case 'procurement':
      return 'bg-blue-100 text-blue-700';
    case 'admin':
      return 'bg-violet-100 text-violet-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

const GestionUsers = () => {
  const {
    loading,
    getUsers,
    addUser,
    updateUser,
    setUserActiveStatus,
    deleteUserByEmail
  } = useUserManagement();

  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'sales' });
  const [editingUser, setEditingUser] = useState(null);
  const [localError, setLocalError] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
      setLocalError(null);
    } catch (err) {
      setLocalError(err.message);
    }
  };

  const handleAddUser = async () => {
    if (!newUser.name.trim() || !newUser.email.trim()) {
      toast.error("Veuillez remplir le nom et l'email.");
      return;
    }
    try {
      await addUser(newUser);
      await fetchUsers();
      setNewUser({ name: '', email: '', role: 'sales' });
      setAddModalOpen(false);
      toast.success("Utilisateur ajouté avec succès");
    } catch {
      // toast handled in hook
    }
  };

  const handleEditUser = async () => {
    if (!editingUser?.name?.trim() || !editingUser?.email?.trim()) {
      toast.error("Nom et email requis.");
      return;
    }
    try {
      await updateUser(editingUser.id, editingUser);
      await fetchUsers();
      setEditingUser(null);
      setEditModalOpen(false);
      toast.success("Utilisateur modifié avec succès");
    } catch {
      // toast handled
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      const newActive = !user.active;
      await setUserActiveStatus(user.email, newActive);
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, active: newActive } : u));
      toast.success(`Utilisateur ${newActive ? 'activé' : 'désactivé'}`);
    } catch {
      await fetchUsers();
    }
  };

  const askDeleteUser = (user) => {
    setPendingDelete(user);
    setConfirmOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!pendingDelete) return;
    try {
      await deleteUserByEmail(pendingDelete.email);
      await fetchUsers();
      toast.success("Utilisateur supprimé");
    } finally {
      setConfirmOpen(false);
      setPendingDelete(null);
    }
  };

  const filteredUsers = users.filter(user => {
    const t = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !t ||
      user.name.toLowerCase().includes(t) ||
      user.email.toLowerCase().includes(t) ||
      roleLabel(user.role).toLowerCase().includes(t);
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const clearSearch = () => {
    setSearchTerm('');
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ConfirmModal
        open={confirmOpen}
        onCancel={() => { setConfirmOpen(false); setPendingDelete(null); }}
        onConfirm={confirmDeleteUser}
        title="Supprimer utilisateur"
        message={pendingDelete ? `Voulez-vous vraiment supprimer ${pendingDelete.name} ? Cette action est irréversible.` : ''}
        confirmText="Supprimer"
      />

      {/* Header avec bouton Ajouter à droite */}
      <div className="flex justify-end">
        <button
          onClick={() => setAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition shadow-sm"
        >
          <PlusIcon className="w-5 h-5" />
          Nouvel utilisateur
        </button>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="rounded-xl shadow-md p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher un utilisateur..."
              className="w-full pl-9 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all bg-white"
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-gray-600"
              >
                <XCircleIcon className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-white"
            >
              <option value="all">Tous</option>
              <option value="sales">Commercial</option>
              <option value="procurement">Achat</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="text-sm text-emerald-600 font-medium">
            {filteredUsers.length} utilisateur(s)
          </div>
        </div>
      </div>

      {/* Messages d'erreur */}
      {localError && (
        <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-lg">
          <p className="text-sm text-red-700">{localError}</p>
        </div>
      )}

=      {/* Tableau des utilisateurs */}
<div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead className="bg-gray-100">
        <tr>
          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Nom</th>
          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>
          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Rôle</th>
          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Statut</th>
          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
        </tr>
      </thead>
  
            <tbody className="divide-y divide-emerald-100">
              {filteredUsers.map((user, index) => (
                <tr
                  key={user.id}
                  className={`hover:bg-gradient-to-r hover:from-emerald-50 hover:to-blue-50 transition-colors ${
                    index % 2 === 0 ? 'bg-white' : 'bg-emerald-50/30'
                  }`}
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-r from-emerald-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-gray-900">{user.name}</span>
                    </div>
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <EnvelopeIcon className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{user.email}</span>
                    </div>
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
                      {roleLabel(user.role)}
                    </span>
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    <ToggleSwitch
                      checked={user.active}
                      onChange={() => handleToggleStatus(user)}
                      disabled={loading}
                    />
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setEditingUser(user); setEditModalOpen(true); }}
                        className="p-1.5 text-blue-600 hover:text-white bg-blue-50 hover:bg-blue-600 rounded-md transition-colors"
                        disabled={loading}
                        title="Modifier"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => askDeleteUser(user)}
                        className="p-1.5 text-red-600 hover:text-white bg-red-50 hover:bg-red-600 rounded-md transition-colors"
                        disabled={loading}
                        title="Supprimer"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-gray-500">
                    Aucun utilisateur trouvé
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Ajout */}
      <Modal open={addModalOpen} onClose={() => setAddModalOpen(false)}>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Nouvel utilisateur</h2>
        <div className="space-y-4">
          <InputField
            label="Nom complet"
            value={newUser.name}
            onChange={val => setNewUser({ ...newUser, name: val })}
            placeholder="Jean Dupont"
          />
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="relative">
              <EnvelopeIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="email@example.com"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-white"
              />
            </div>
          </div>
          <SelectField
            label="Rôle"
            value={newUser.role}
            onChange={val => setNewUser({ ...newUser, role: val })}
            options={[
              { label: 'Commercial', value: 'sales' },
              { label: 'Responsable Achat', value: 'procurement' },
              { label: 'Administrateur', value: 'admin' }
            ]}
          />
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleAddUser}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              Ajouter
            </button>
            <button
              onClick={() => setAddModalOpen(false)}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Modification */}
      <Modal open={editModalOpen} onClose={() => setEditModalOpen(false)}>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Modifier l'utilisateur</h2>
        {editingUser && (
          <div className="space-y-4">
            <InputField
              label="Nom complet"
              value={editingUser.name}
              onChange={val => setEditingUser({ ...editingUser, name: val })}
            />
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <EnvelopeIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-white"
                />
              </div>
            </div>
            <SelectField
              label="Rôle"
              value={editingUser.role}
              onChange={val => setEditingUser({ ...editingUser, role: val })}
              options={[
                { label: 'Commercial', value: 'sales' },
                { label: 'Responsable Achat', value: 'procurement' },
                { label: 'Administrateur', value: 'admin' }
              ]}
            />
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleEditUser}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                Sauvegarder
              </button>
              <button
                onClick={() => setEditModalOpen(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default GestionUsers;