// src/pages/admin/users/gestionUsers.jsx

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XCircleIcon,
  EnvelopeIcon,
  ExclamationCircleIcon,
  ShieldExclamationIcon
} from '@heroicons/react/24/outline';
import { useUserManagement } from '../../../../hooks/useUserManagement';
import { useAuth } from '../../../../hooks/useAuth';

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

const InputField = ({ label, value, onChange, placeholder, type = "text", error, disabled = false }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-white ${
        disabled ? 'bg-gray-100 cursor-not-allowed' : ''
      } ${
        error ? 'border-red-500 bg-red-50' : 'border-gray-300'
      }`}
    />
    {error && (
      <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
        <ExclamationCircleIcon className="w-3 h-3" />
        {error}
      </p>
    )}
  </div>
);

const SelectField = ({ label, value, onChange, options, disabled = false }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-white ${
        disabled ? 'bg-gray-100 cursor-not-allowed' : ''
      }`}
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
);

const EmailField = ({ label, value, onChange, placeholder, error, onBlur, disabled = false, domainHint }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <div className="relative">
      <EnvelopeIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
      <input
        type="email"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        disabled={disabled}
        className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-white ${
          disabled ? 'bg-gray-100 cursor-not-allowed' : ''
        } ${
          error ? 'border-red-500 bg-red-50' : 'border-gray-300'
        }`}
      />
    </div>
   
    {error && (
      <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
        <ExclamationCircleIcon className="w-3 h-3" />
        {error}
      </p>
    )}
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

// ✅ Fonction pour déterminer si un rôle est affichable (uniquement Commercial et Achat)
const isDisplayableRole = (role) => {
  return role === 'sales' || role === 'procurement';
};

// ✅ Fonction pour vérifier si un rôle est modifiable
const isModifiableRole = (role) => {
  return role === 'sales' || role === 'procurement';
};

const roleLabel = (role) => {
  if (role === 'admin' || role === 'ADMIN_CLIENT') return 'Admin';
  if (role === 'sales' || role === 'COMMERCIAL') return 'Commercial';
  if (role === 'procurement' || role === 'RESPONSABLE_ACHAT') return 'Achat';
  return role;
};

const getRoleColor = (role) => {
  // Ne jamais afficher admin (mais si par erreur on en a un)
  if (role === 'admin' || role === 'ADMIN_CLIENT') {
    return 'bg-gray-100 text-gray-500';
  }
  switch(role) {
    case 'sales':
    case 'COMMERCIAL':
      return 'bg-emerald-100 text-emerald-700';
    case 'procurement':
    case 'RESPONSABLE_ACHAT':
      return 'bg-blue-100 text-blue-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

// ✅ Uniquement les rôles ajoutables (pas d'admin)
const ASSIGNABLE_ROLE_OPTIONS = [
  { label: 'Commercial', value: 'sales' },
  { label: 'Responsable Achat', value: 'procurement' }
];

// ✅ Fonction pour extraire le domaine d'un email
const extractEmailDomain = (email) => {
  if (!email || !email.includes('@')) return '';
  return email.substring(email.indexOf('@') + 1).toLowerCase();
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
  
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'sales' });
  const [editingUser, setEditingUser] = useState(null);
  const [localError, setLocalError] = useState(null);

  const [emailError, setEmailError] = useState('');
  const [editEmailError, setEditEmailError] = useState('');

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);

  // ✅ Récupérer le domaine de l'admin connecté
  const adminDomain = currentUser?.email ? extractEmailDomain(currentUser.email) : '';

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const data = await getUsers();
      console.log('📊 Utilisateurs reçus:', data);
      
      // ⭐⭐⭐ FILTRAGE STRICT: Exclure l'admin connecté ET les rôles admin/admin_client ⭐⭐⭐
      const filteredData = data.filter(user => {
        // 1. Exclure l'utilisateur connecté
        if (user.id === currentUser?.id) return false;
        
        // 2. ⭐ Exclure les utilisateurs avec rôle 'admin' ou 'ADMIN_CLIENT'
        const userRole = user.role?.toLowerCase();
        if (userRole === 'admin' || userRole === 'admin_client') return false;
        
        // 3. ⭐ Exclure si le rôle backend est ADMIN_CLIENT
        if (user.role === 'ADMIN_CLIENT') return false;
        
        return true;
      });
      
      setUsers(filteredData);
      setLocalError(null);
    } catch (err) {
      console.error('❌ Erreur fetchUsers:', err);
      setLocalError(err.message);
    }
  };

  const checkEmailExists = (email, excludeUserId = null) => {
    if (!email.trim()) return false;
    const emailLower = email.trim().toLowerCase();
    return users.some(user => 
      user.email.toLowerCase() === emailLower && user.id !== excludeUserId
    );
  };

  // ✅ Validation email avec domaine
  const validateEmailDomain = (email) => {
    if (!adminDomain) return true;
    const domain = extractEmailDomain(email);
    if (domain !== adminDomain) {
      return false;
    }
    return true;
  };

  const validateNewEmail = (email) => {
    if (!email.trim()) {
      setEmailError('');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Format d\'email invalide');
      return false;
    }
    
    // ✅ Vérification du domaine
    if (!validateEmailDomain(email)) {
      setEmailError(`L'email doit utiliser le domaine: @${adminDomain}`);
      return false;
    }
    
    if (checkEmailExists(email)) {
      setEmailError('Cet email est déjà utilisé par un autre utilisateur');
      return false;
    }
    
    setEmailError('');
    return true;
  };

  const validateEditEmail = (email, userId) => {
    if (!email.trim()) {
      setEditEmailError('');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEditEmailError('Format d\'email invalide');
      return false;
    }
    
    // ✅ Vérification du domaine
    if (!validateEmailDomain(email)) {
      setEditEmailError(`L'email doit utiliser le domaine: @${adminDomain}`);
      return false;
    }
    
    if (checkEmailExists(email, userId)) {
      setEditEmailError('Cet email est déjà utilisé par un autre utilisateur');
      return false;
    }
    
    setEditEmailError('');
    return true;
  };

  const handleAddUser = async () => {
    if (!newUser.name.trim()) {
      toast.error("Veuillez remplir le nom.");
      return;
    }
    
    if (!newUser.email.trim()) {
      toast.error("Veuillez remplir l'email.");
      return;
    }
    
    if (!validateNewEmail(newUser.email)) {
      toast.error("Email invalide ou déjà utilisé.");
      return;
    }
    
    try {
      await addUser(newUser);
      await fetchUsers();
      setNewUser({ name: '', email: '', role: 'sales' });
      setEmailError('');
      setAddModalOpen(false);
      toast.success("Utilisateur ajouté avec succès");
    } catch (err) {
      console.error('Erreur ajout:', err);
      const errorMessage = err.response?.data?.error || err.message;
      
      if (errorMessage?.includes('domaine') || errorMessage?.includes('@')) {
        setEmailError(`L'email doit utiliser le domaine: @${adminDomain}`);
        toast.error(`Email invalide: doit être sur @${adminDomain}`);
      } else if (errorMessage?.includes('email') || errorMessage?.includes('duplicate')) {
        setEmailError('Cet email est déjà utilisé par un autre utilisateur');
        toast.error('Email déjà utilisé');
      } else {
        toast.error(errorMessage || "Erreur lors de l'ajout");
      }
    }
  };

  const handleEditUser = async () => {
    if (!editingUser?.name?.trim()) {
      toast.error("Nom requis.");
      return;
    }
    
    if (!editingUser?.email?.trim()) {
      toast.error("Email requis.");
      return;
    }
    
    // ⭐ Vérifier que l'utilisateur n'est pas un admin (sécurité)
    if (editingUser.role === 'admin' || editingUser.role === 'ADMIN_CLIENT') {
      toast.error("Vous ne pouvez pas modifier un compte administrateur.");
      setEditModalOpen(false);
      return;
    }
    
    const isOwnAccount = editingUser.id === currentUser?.id;
    
    if (isOwnAccount) {
      toast.error("Vous ne pouvez pas modifier votre propre compte depuis cette interface.");
      return;
    }
    
    if (!validateEditEmail(editingUser.email, editingUser.id)) {
      toast.error("Email invalide ou déjà utilisé.");
      return;
    }
    
    try {
      await updateUser(editingUser.id, {
        name: editingUser.name,
        email: editingUser.email,
        role: editingUser.role,
        originalEmail: editingUser.originalEmail
      });
      
      await fetchUsers();
      setEditingUser(null);
      setEditEmailError('');
      setEditModalOpen(false);
      toast.success("Utilisateur modifié avec succès");
      
    } catch (err) {
      console.error('Erreur modification:', err);
      const errorMessage = err.response?.data?.error || err.message;
      const expectedDomain = err.response?.data?.expectedDomain;
      
      if (expectedDomain) {
        setEditEmailError(`L'email doit utiliser le domaine: @${expectedDomain}`);
        toast.error(`Email invalide: doit être sur @${expectedDomain}`);
      } else if (errorMessage?.includes('domaine') || errorMessage?.includes('@')) {
        setEditEmailError(`L'email doit utiliser le domaine: @${adminDomain}`);
        toast.error(`Email invalide: doit être sur @${adminDomain}`);
      } else if (errorMessage?.includes('email') || errorMessage?.includes('duplicate')) {
        setEditEmailError('Cet email est déjà utilisé par un autre utilisateur');
        toast.error('Email déjà utilisé');
      } else {
        toast.error(errorMessage || "Erreur lors de la modification");
      }
    }
  };

  const handleToggleStatus = async (user) => {
    // ⭐ Ne pas permettre la désactivation d'un admin
    if (user.role === 'admin' || user.role === 'ADMIN_CLIENT') {
      toast.error("Vous ne pouvez pas modifier le statut d'un compte administrateur.");
      return;
    }
    
    if (user.id === currentUser?.id) {
      toast.error("Vous ne pouvez pas désactiver votre propre compte.");
      return;
    }
    
    try {
      const newActive = !user.active;
      await setUserActiveStatus(user.email, newActive);
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, active: newActive } : u));
      toast.success(`Utilisateur ${newActive ? 'activé' : 'désactivé'}`);
    } catch (err) {
      console.error('Erreur changement statut:', err);
      const errorMessage = err.response?.data?.error || err.message;
      toast.error(errorMessage || "Erreur lors du changement de statut");
      await fetchUsers();
    }
  };

  const askDeleteUser = (user) => {
    // ⭐ Ne pas permettre la suppression d'un admin
    if (user.role === 'admin' || user.role === 'ADMIN_CLIENT') {
      toast.error("Vous ne pouvez pas supprimer un compte administrateur.");
      return;
    }
    
    if (user.id === currentUser?.id) {
      toast.error("Vous ne pouvez pas supprimer votre propre compte.");
      return;
    }
    setPendingDelete(user);
    setConfirmOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!pendingDelete) return;
    try {
      await deleteUserByEmail(pendingDelete.email);
      await fetchUsers();
      toast.success("Utilisateur supprimé");
    } catch (err) {
      console.error('Erreur suppression:', err);
      const errorMessage = err.response?.data?.error || err.message;
      toast.error(errorMessage || "Erreur lors de la suppression");
    } finally {
      setConfirmOpen(false);
      setPendingDelete(null);
    }
  };

  // ⭐ Filtrer les utilisateurs affichés (exclure admin et l'utilisateur connecté)
  const filteredUsers = users.filter(user => {
    // Exclure l'utilisateur connecté
    if (user.id === currentUser?.id) return false;
    
    // ⭐ Exclure les rôles admin et ADMIN_CLIENT de l'affichage
    const userRole = user.role?.toLowerCase();
    if (userRole === 'admin' || userRole === 'admin_client') return false;
    if (user.role === 'ADMIN_CLIENT') return false;
    
    const t = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !t ||
      (user.name && user.name.toLowerCase().includes(t)) ||
      (user.email && user.email.toLowerCase().includes(t)) ||
      (user.role && roleLabel(user.role).toLowerCase().includes(t));
    
    // ⭐ Filtrer par rôle (uniquement sales et procurement disponibles)
    const matchesRole = filterRole === 'all' || 
      (filterRole === 'sales' && (user.role === 'sales' || user.role === 'COMMERCIAL')) ||
      (filterRole === 'procurement' && (user.role === 'procurement' || user.role === 'RESPONSABLE_ACHAT'));
    
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
        message={pendingDelete ? `Voulez-vous vraiment supprimer ${pendingDelete.name || pendingDelete.email} ? Cette action est irréversible.` : ''}
        confirmText="Supprimer"
      />

      <div className="flex justify-end">
        <button
          onClick={() => setAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition shadow-sm"
        >
          <PlusIcon className="w-5 h-5" />
          Nouvel utilisateur
        </button>
      </div>

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
              <option value="all">Tous les rôles</option>
              <option value="sales">Commercial</option>
              <option value="procurement">Achat</option>
            </select>
          </div>

          <div className="text-sm text-emerald-600 font-medium">
            {filteredUsers.length} utilisateur(s)
          </div>
        </div>
      </div>

      {localError && (
        <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-lg">
          <p className="text-sm text-red-700">{localError}</p>
        </div>
      )}

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
                        {user.name && user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {user.name || user.email}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <EnvelopeIcon className="w-4 h-4 text-emerald-500" />
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
                        onClick={() => { 
                          setEditingUser({
                            ...user,
                            originalEmail: user.email
                          }); 
                          setEditModalOpen(true);
                        }}
                        className="p-1.5 text-blue-600 hover:text-white bg-blue-50 hover:bg-blue-600 rounded-md transition-colors"
                        disabled={loading || user.role === 'admin' || user.role === 'ADMIN_CLIENT'}
                        title="Modifier"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => askDeleteUser(user)}
                        className="p-1.5 text-red-600 hover:text-white bg-red-50 hover:bg-red-600 rounded-md transition-colors"
                        disabled={loading || user.role === 'admin' || user.role === 'ADMIN_CLIENT'}
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
      <Modal open={addModalOpen} onClose={() => { setAddModalOpen(false); setEmailError(''); }}>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Nouvel utilisateur</h2>
        <div className="space-y-4">
          <InputField
            label="Nom complet"
            value={newUser.name}
            onChange={val => setNewUser({ ...newUser, name: val })}
            placeholder="Jean Dupont"
          />
          <EmailField
            label="Email"
            value={newUser.email}
            onChange={(val) => {
              setNewUser({ ...newUser, email: val });
              if (emailError) validateNewEmail(val);
            }}
            onBlur={() => validateNewEmail(newUser.email)}
            placeholder="email@example.com"
            error={emailError}
            domainHint={adminDomain}
          />
          <SelectField
            label="Rôle"
            value={newUser.role}
            onChange={val => setNewUser({ ...newUser, role: val })}
            options={ASSIGNABLE_ROLE_OPTIONS}
          />
          <p className="text-xs text-gray-500">
            Créez des comptes Commercial ou Responsable Achat.
            {adminDomain && <span className="block mt-1 text-emerald-600">📧 Domaine autorisé: @{adminDomain}</span>}
          </p>
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleAddUser}
              disabled={loading || !!emailError}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              Ajouter
            </button>
            <button
              onClick={() => { setAddModalOpen(false); setEmailError(''); }}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Modification */}
      <Modal open={editModalOpen} onClose={() => { setEditModalOpen(false); setEditEmailError(''); }}>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Modifier l'utilisateur</h2>
        {editingUser && (
          <div className="space-y-4">
            <InputField
              label="Nom complet"
              value={editingUser.name || ''}
              onChange={val => setEditingUser({ ...editingUser, name: val })}
              disabled={false}
            />
            
            <EmailField
              label="Email"
              value={editingUser.email}
              onChange={(val) => {
                setEditingUser({ ...editingUser, email: val });
                if (editEmailError) validateEditEmail(val, editingUser.id);
              }}
              onBlur={() => validateEditEmail(editingUser.email, editingUser.id)}
              placeholder="email@example.com"
              error={editEmailError}
              disabled={false}
              domainHint={adminDomain}
            />
            
            <SelectField
              label="Rôle"
              value={editingUser.role}
              onChange={val => setEditingUser({ ...editingUser, role: val })}
              options={ASSIGNABLE_ROLE_OPTIONS}
              disabled={false}
            />
            
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleEditUser}
                disabled={loading || !!editEmailError}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                Sauvegarder
              </button>
              <button
                onClick={() => { setEditModalOpen(false); setEditEmailError(''); }}
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