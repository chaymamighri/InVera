import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  XCircleIcon,
  EnvelopeIcon,
  ExclamationCircleIcon,
  ShieldExclamationIcon,
} from '@heroicons/react/24/outline';
import { useLanguage } from '../../../../context/LanguageContext';
import { useUserManagement } from '../../../../hooks/useUserManagement';
import { useAuth } from '../../../../hooks/useAuth';


const copy = {
  fr: {
    title: 'Gestion des utilisateurs',
    description: 'Ajoutez, modifiez et gérez les comptes internes de votre entreprise.',
    confirm: 'Confirmer',
    cancel: 'Annuler',
    fullName: 'Nom complet',
    email: 'Email',
    role: 'Rôle',
    invalidEmail: "Format d'email invalide",
    emailExists: 'Cet email est déjà utilisé par un autre utilisateur',
    admin: 'Administrateur',
    sales: 'Responsable vente',
    procurement: 'Responsable achat et stock',
    loading: 'Chargement...',
    addUser: 'Nouvel utilisateur',
    search: 'Rechercher un utilisateur...',
    allRoles: 'Tous les rôles',
    usersCount: '{{count}} utilisateur(s)',
    noUser: 'Aucun utilisateur trouvé',
    status: 'Statut',
    actions: 'Actions',
    active: 'Actif',
    inactive: 'Inactif',
    save: 'Sauvegarder',
    add: 'Ajouter',
    createHint: 'Créez des comptes Responsable vente ou Responsable achat et stock.',
    editUser: "Modifier l'utilisateur",
    ownSecurity: 'Pour des raisons de sécurité, vous ne pouvez pas modifier votre propre compte.',
    requiredName: 'Veuillez remplir le nom.',
    requiredEmail: 'Veuillez remplir l\'email.',
    invalidOrUsedEmail: 'Email invalide ou déjà utilisé.',
    userAdded: 'Utilisateur ajouté avec succès',
    userUpdated: 'Utilisateur modifié avec succès',
    statusChanged: 'Utilisateur {{status}}',
    cannotModifySelf: 'Vous ne pouvez pas modifier votre propre compte.',
    nameRequired: 'Nom requis.',
    emailRequired: 'Email requis.',
    saveError: 'Erreur lors de la modification',
    addError: "Erreur lors de l'ajout",
    statusError: 'Erreur lors du changement de statut',
    you: 'Vous',
    editTitle: 'Modifier',
    namePlaceholder: 'Jean Dupont',
    emailPlaceholder: 'email@example.com',
    adminEditBlocked: 'Vous ne pouvez pas modifier un compte administrateur.',
    adminStatusBlocked: "Vous ne pouvez pas modifier le statut d'un compte administrateur.",
    activeTooltip: 'Utilisateur actif - Cliquez pour désactiver',
    inactiveTooltip: 'Utilisateur inactif - Cliquez pour activer',
  },
  en: {
    title: 'User Management',
    description: 'Add, edit, and manage your company\'s internal accounts.',
    confirm: 'Confirm',
    cancel: 'Cancel',
    fullName: 'Full name',
    email: 'Email',
    role: 'Role',
    invalidEmail: 'Invalid email format',
    emailExists: 'This email is already used by another user',
    admin: 'Administrator',
    sales: 'Sales Manager',
    procurement: 'Procurement & Stock Manager',
    loading: 'Loading...',
    addUser: 'New user',
    search: 'Search for a user...',
    allRoles: 'All roles',
    usersCount: '{{count}} user(s)',
    noUser: 'No user found',
    status: 'Status',
    actions: 'Actions',
    active: 'Active',
    inactive: 'Inactive',
    save: 'Save',
    add: 'Add',
    createHint: 'Create Sales Manager or Procurement & Stock Manager accounts.',
    editUser: 'Edit user',
    ownSecurity: 'For security reasons, you cannot edit your own account.',
    requiredName: 'Please fill in the name.',
    requiredEmail: 'Please fill in the email.',
    invalidOrUsedEmail: 'Invalid or already used email.',
    userAdded: 'User added successfully',
    userUpdated: 'User updated successfully',
    statusChanged: 'User {{status}}',
    cannotModifySelf: 'You cannot modify your own account.',
    nameRequired: 'Name required.',
    emailRequired: 'Email required.',
    saveError: 'Error while updating',
    addError: 'Error while adding',
    statusError: 'Error while changing status',
    you: 'You',
    editTitle: 'Edit',
    namePlaceholder: 'John Smith',
    emailPlaceholder: 'email@example.com',
    adminEditBlocked: 'You cannot edit an admin account.',
    adminStatusBlocked: 'You cannot change the status of an admin account.',
    activeTooltip: 'User active - Click to deactivate',
    inactiveTooltip: 'User inactive - Click to activate',
  },
  ar: {
    title: 'إدارة المستخدمين',
    description: 'أضف وعدّل وأدر الحسابات الداخلية لشركتك.',
    confirm: 'تأكيد',
    cancel: 'إلغاء',
    fullName: 'الاسم الكامل',
    email: 'البريد الإلكتروني',
    role: 'الدور',
    invalidEmail: 'صيغة البريد الإلكتروني غير صحيحة',
    emailExists: 'هذا البريد مستخدم بالفعل من قبل مستخدم آخر',
    admin: 'مدير',
    sales: 'مسؤول المبيعات',
    procurement: 'مسؤول المشتريات والمخزون',
    loading: 'جاري التحميل...',
    addUser: 'مستخدم جديد',
    search: 'ابحث عن مستخدم...',
    allRoles: 'جميع الأدوار',
    usersCount: '{{count}} مستخدم',
    noUser: 'لم يتم العثور على مستخدم',
    status: 'الحالة',
    actions: 'الإجراءات',
    active: 'نشط',
    inactive: 'غير نشط',
    save: 'حفظ',
    add: 'إضافة',
    createHint: 'أنشئ حسابات مسؤول مبيعات أو مسؤول مشتريات ومخزون.',
    editUser: 'تعديل المستخدم',
    ownSecurity: 'لأسباب أمنية، لا يمكنك تعديل حسابك الخاص.',
    requiredName: 'الرجاء إدخال الاسم.',
    requiredEmail: 'الرجاء إدخال البريد الإلكتروني.',
    invalidOrUsedEmail: 'البريد الإلكتروني غير صالح أو مستخدم بالفعل.',
    userAdded: 'تمت إضافة المستخدم بنجاح',
    userUpdated: 'تم تعديل المستخدم بنجاح',
    statusChanged: 'تم {{status}} المستخدم',
    cannotModifySelf: 'لا يمكنك تعديل حسابك الخاص.',
    nameRequired: 'الاسم مطلوب.',
    emailRequired: 'البريد الإلكتروني مطلوب.',
    saveError: 'خطأ أثناء التعديل',
    addError: 'خطأ أثناء الإضافة',
    statusError: 'خطأ أثناء تغيير الحالة',
    you: 'أنت',
    editTitle: 'تعديل',
    namePlaceholder: 'محمد علي',
    emailPlaceholder: 'email@example.com',
    adminEditBlocked: 'لا يمكنك تعديل حساب مدير.',
    adminStatusBlocked: 'لا يمكنك تغيير حالة حساب مدير.',
    activeTooltip: 'المستخدم نشط - انقر لتعطيل',
    inactiveTooltip: 'المستخدم غير نشط - انقر لتفعيل',
  },
};

import { createPortal } from 'react-dom';

const Modal = ({ open, onClose, children, isArabic = false }) => {
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div 
        className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
        dir={isArabic ? 'rtl' : 'ltr'}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className={`absolute top-4 text-gray-500 transition hover:text-gray-700 ${
            isArabic ? 'left-4' : 'right-4'
          }`}
        >
          <XCircleIcon className="h-6 w-6" />
        </button>
        {children}
      </div>
    </div>,
    document.body
  );
};

// Composant ToggleSwitch avec tooltip en bas
const ToggleSwitch = ({ checked, onChange, disabled, activeTooltip, inactiveTooltip }) => (
  <div className="relative inline-flex group">
    <button
      type="button"
      onClick={() => onChange(!checked)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? 'bg-emerald-500' : 'bg-gray-200'
      } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
    {!disabled && (
      <div className="absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded bg-white px-2 py-1 text-xs text-gray-700 shadow-md border border-gray-200 opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none z-10">
        {checked ? inactiveTooltip : activeTooltip}
      </div>
    )}
  </div>
);

const isAdminRole = (role) => {
  const normalizedRole = role?.toLowerCase();
  return normalizedRole === 'admin' || normalizedRole === 'admin_client';
};

// Mapping des rôles pour l'affichage
const getRoleLabel = (role) => {
  if (role === 'admin' || role === 'ADMIN_CLIENT') return 'Administrateur';
  if (role === 'sales' || role === 'COMMERCIAL') return 'Responsable vente';
  if (role === 'procurement' || role === 'RESPONSABLE_ACHAT') return 'Responsable Achat et stock';
  return role;
};

const getRoleColor = (role) => {
  if (role === 'admin' || role === 'ADMIN_CLIENT') {
    return 'bg-gray-100 text-gray-500';
  }
  if (role === 'sales' || role === 'COMMERCIAL') {
    return 'bg-emerald-100 text-emerald-700';
  }
  if (role === 'procurement' || role === 'RESPONSABLE_ACHAT') {
    return 'bg-blue-100 text-blue-700';
  }
  return 'bg-gray-100 text-gray-700';
};

const GestionUsers = () => {
  const { language, isArabic } = useLanguage();
  const text = useMemo(() => copy[language] || copy.fr, [language]);

  const { loading: loadingAPI, getUsers, addUser, updateUser, setUserActiveStatus } = useUserManagement();

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
  const [isLoading, setIsLoading] = useState(false); // Spinner local

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await getUsers();

      const filteredData = data.filter((user) => {
        if (user.id === currentUser?.id) return false;
        if (isAdminRole(user.role)) return false;
        return true;
      });

      setUsers(filteredData);
      setLocalError(null);
    } catch (error) {
      setLocalError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const checkEmailExists = (email, excludeUserId = null) => {
    if (!email.trim()) return false;
    const emailLower = email.trim().toLowerCase();
    return users.some(
      (user) => user.email.toLowerCase() === emailLower && user.id !== excludeUserId
    );
  };

  const validateNewEmail = (email) => {
    if (!email.trim()) {
      setEmailError('');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      setEmailError(text.invalidEmail);
      return false;
    }

    if (checkEmailExists(email)) {
      setEmailError(text.emailExists);
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
      setEditEmailError(text.invalidEmail);
      return false;
    }

    if (checkEmailExists(email, userId)) {
      setEditEmailError(text.emailExists);
      return false;
    }

    setEditEmailError('');
    return true;
  };

  const handleAddUser = async () => {
    if (!newUser.name.trim()) {
      toast.error(text.requiredName);
      return;
    }

    if (!newUser.email.trim()) {
      toast.error(text.requiredEmail);
      return;
    }

    if (!validateNewEmail(newUser.email)) {
      toast.error(text.invalidOrUsedEmail);
      return;
    }

    setIsLoading(true);
    try {
      await addUser(newUser);
      await fetchUsers();

      setNewUser({ name: '', email: '', role: 'sales' });
      setEmailError('');
      setAddModalOpen(false);

      toast.success(text.userAdded);
    } catch (error) {
      toast.error(error.response?.data?.error || error.message || text.addError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditUser = async () => {
    if (!editingUser?.name?.trim()) {
      toast.error(text.nameRequired);
      return;
    }

    if (!editingUser?.email?.trim()) {
      toast.error(text.emailRequired);
      return;
    }

    if (isAdminRole(editingUser.role)) {
      toast.error(text.adminEditBlocked);
      setEditModalOpen(false);
      return;
    }

    const isOwnAccount = editingUser.id === currentUser?.id;

    if (isOwnAccount) {
      toast.error(text.cannotModifySelf);
      return;
    }

    if (!validateEditEmail(editingUser.email, editingUser.id)) {
      toast.error(text.invalidOrUsedEmail);
      return;
    }

    setIsLoading(true);
    try {
      const nameParts = editingUser.name.trim().split(/\s+/);
      const prenom = nameParts.pop() || '';
      const nom = nameParts.join(' ') || prenom;

      await updateUser(editingUser.id, {
        name: editingUser.name,
        nom: nom,
        prenom: prenom,
        email: editingUser.email,
        role: editingUser.role,
        active: editingUser.active
      });

      await fetchUsers();

      setEditingUser(null);
      setEditEmailError('');
      setEditModalOpen(false);

      toast.success(text.userUpdated);
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message;

      if (errorMessage?.includes('email') || errorMessage?.includes('duplicate')) {
        setEditEmailError(text.emailExists);
        toast.error(text.emailExists);
      } else {
        toast.error(errorMessage || text.saveError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (user) => {
    if (isAdminRole(user.role)) {
      toast.error(text.adminStatusBlocked);
      return;
    }

    if (user.id === currentUser?.id) {
      toast.error(text.cannotModifySelf);
      return;
    }

    setIsLoading(true);
    try {
      const newActive = !user.active;

      await setUserActiveStatus(user.email, newActive);

      setUsers((previous) =>
        previous.map((item) => (item.id === user.id ? { ...item, active: newActive } : item))
      );

      toast.success(
        text.statusChanged.replace(
          '{{status}}',
          newActive ? text.active.toLowerCase() : text.inactive.toLowerCase()
        )
      );
    } catch (error) {
      toast.error(error.response?.data?.error || error.message || text.statusError);
      await fetchUsers();
    } finally {
      setIsLoading(false);
    }
  };

  // Recherche filtrée - CORRIGÉE avec les nouveaux libellés
  const filteredUsers = users.filter((user) => {
    const search = searchTerm.trim().toLowerCase();
    const roleLabel = getRoleLabel(user.role).toLowerCase();

    const matchesSearch =
      !search ||
      user.name?.toLowerCase().includes(search) ||
      user.email?.toLowerCase().includes(search) ||
      roleLabel.includes(search);

    const matchesRole =
      filterRole === 'all' ||
      (filterRole === 'sales' && (user.role === 'sales' || user.role === 'COMMERCIAL')) ||
      (filterRole === 'procurement' && (user.role === 'procurement' || user.role === 'RESPONSABLE_ACHAT'));

    return matchesSearch && matchesRole;
  });

  // Spinner global pendant les chargements
  if ((loadingAPI || isLoading) && users.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${isArabic ? 'text-right' : ''}`} dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className={`flex items-center justify-between gap-4 ${isArabic ? 'flex-row-reverse' : ''}`}>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{text.title}</h1>
          <p className="mt-1 text-sm text-gray-500">{text.description}</p>
        </div>
        <button
          onClick={() => setAddModalOpen(true)}
          disabled={isLoading}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
        >
          <PlusIcon className="h-5 w-5" />
          {text.addUser}
        </button>
      </div>

      {/* Filtres */}
      <div className="rounded-xl p-4 shadow-md">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative min-w-[200px] flex-1">
            <MagnifyingGlassIcon
              className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 ${
                isArabic ? 'right-3' : 'left-3'
              }`}
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={text.search}
              disabled={isLoading}
              className={`w-full rounded-lg border border-gray-300 bg-white py-2 text-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 ${
                isArabic ? 'pr-9 pl-8' : 'pl-9 pr-8'
              }`}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className={`absolute inset-y-0 flex items-center text-gray-400 hover:text-gray-600 ${
                  isArabic ? 'left-0 pl-2.5' : 'right-0 pr-2.5'
                }`}
              >
                <XCircleIcon className="h-4 w-4" />
              </button>
            )}
          </div>

          <select
            value={filterRole}
            onChange={(event) => setFilterRole(event.target.value)}
            disabled={isLoading}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50"
          >
            <option value="all">{text.allRoles}</option>
  <option value="COMMERCIAL">Responsable vente</option>       
  <option value="RESPONSABLE_ACHAT">Responsable Achat et stock</option>  
</select>

          <div className="text-sm font-medium text-emerald-600">
            {isLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"></div>
            ) : (
              text.usersCount.replace('{{count}}', String(filteredUsers.length))
            )}
          </div>
        </div>
      </div>

      {/* Tableau des utilisateurs */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className={`px-4 py-3 text-xs font-semibold uppercase text-gray-500 ${isArabic ? 'text-right' : 'text-left'}`}>
                  {text.fullName}
                </th>
                <th className={`px-4 py-3 text-xs font-semibold uppercase text-gray-500 ${isArabic ? 'text-right' : 'text-left'}`}>
                  {text.email}
                </th>
                <th className={`px-4 py-3 text-xs font-semibold uppercase text-gray-500 ${isArabic ? 'text-right' : 'text-left'}`}>
                  {text.role}
                </th>
                <th className={`px-4 py-3 text-xs font-semibold uppercase text-gray-500 ${isArabic ? 'text-right' : 'text-left'}`}>
                  {text.status}
                </th>
                <th className={`px-4 py-3 text-xs font-semibold uppercase text-gray-500 ${isArabic ? 'text-right' : 'text-left'}`}>
                  {text.actions}
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-emerald-100">
              {filteredUsers.map((user, index) => (
                <tr
                  key={user.id}
                  className={`transition-colors hover:bg-gradient-to-r hover:from-emerald-50 hover:to-blue-50 ${
                    index % 2 === 0 ? 'bg-white' : 'bg-emerald-50/30'
                  }`}
                >
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-blue-500 text-sm font-bold text-white shadow-sm">
                        {user.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-900">
                          {user.name || user.email}
                        </span>
                        {user.id === currentUser?.id && (
                          <span className="ml-2 text-xs text-gray-400">({text.you})</span>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex items-center gap-2">
                      <EnvelopeIcon className="h-4 w-4 text-emerald-500" />
                      <span className="text-sm text-gray-600">{user.email}</span>
                    </div>
                  </td>

                  <td className="whitespace-nowrap px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${getRoleColor(user.role)}`}>
                      {getRoleLabel(user.role)}
                    </span>
                  </td>

                  <td className="whitespace-nowrap px-4 py-3">
                    <ToggleSwitch
                      checked={user.active}
                      onChange={() => handleToggleStatus(user)}
                      disabled={isLoading || isAdminRole(user.role)}
                      activeTooltip={text.activeTooltip}
                      inactiveTooltip={text.inactiveTooltip}
                    />
                  </td>

                  <td className="whitespace-nowrap px-4 py-3">
                    <button
                      onClick={() => {
                        setEditingUser({ ...user, originalEmail: user.email });
                        setEditModalOpen(true);
                      }}
                      className="rounded-md bg-blue-50 p-1.5 text-blue-600 transition-colors hover:bg-blue-600 hover:text-white"
                      disabled={isLoading || isAdminRole(user.role) || user.id === currentUser?.id}
                      title={text.editTitle}
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}

              {filteredUsers.length === 0 && !isLoading && (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-gray-500">
                    {text.noUser}
                  </td>
                </tr>
              )}

              {filteredUsers.length === 0 && isLoading && (
                <tr>
                  <td colSpan="5" className="py-8 text-center">
                    <div className="flex justify-center">
                      <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-emerald-500"></div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals (inchangés) */}
      <Modal open={addModalOpen} isArabic={isArabic} onClose={() => {
        setAddModalOpen(false);
        setEmailError('');
      }}>
        <h2 className="mb-4 text-xl font-bold text-gray-900">{text.addUser}</h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{text.fullName}</label>
            <input
              value={newUser.name}
              onChange={(event) => setNewUser({ ...newUser, name: event.target.value })}
              placeholder={text.namePlaceholder}
              className="w-full rounded-lg border border-gray-300 px-4 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{text.email}</label>
            <div className="relative">
              <EnvelopeIcon
                className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 ${
                  isArabic ? 'right-3' : 'left-3'
                }`}
              />
              <input
                value={newUser.email}
                onChange={(event) => {
                  setNewUser({ ...newUser, email: event.target.value });
                  if (emailError) validateNewEmail(event.target.value);
                }}
                onBlur={() => validateNewEmail(newUser.email)}
                placeholder={text.emailPlaceholder}
                className={`w-full rounded-lg border px-4 py-2 ${
                  isArabic ? 'pr-10' : 'pl-10'
                } ${emailError ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
              />
            </div>
            {emailError && (
              <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                <ExclamationCircleIcon className="h-3 w-3" />
                {emailError}
              </p>
            )}
          </div>
          <div>
  <label className="mb-1 block text-sm font-medium text-gray-700">{text.role}</label>
  <select
    value={newUser.role}
    onChange={(event) => setNewUser({ ...newUser, role: event.target.value })}
    className="w-full rounded-lg border border-gray-300 px-4 py-2"
  >
    <option value="COMMERCIAL">Responsable vente</option>
    <option value="RESPONSABLE_ACHAT">Responsable Achat et stock</option>
  </select>
</div>
          <p className="text-xs text-gray-500">{text.createHint}</p>
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleAddUser}
              disabled={isLoading || !!emailError}
              className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
            >
              {text.add}
            </button>
            <button
              onClick={() => {
                setAddModalOpen(false);
                setEmailError('');
              }}
              className="flex-1 rounded-lg bg-gray-100 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-200"
            >
              {text.cancel}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={editModalOpen} isArabic={isArabic} onClose={() => {
        setEditModalOpen(false);
        setEditEmailError('');
      }}>
        <h2 className="mb-4 text-xl font-bold text-gray-900">{text.editUser}</h2>
        {editingUser && (
          <div className="space-y-4">
            {editingUser.id === currentUser?.id && (
              <div className="mb-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
                <div className="flex items-center gap-2 text-amber-700">
                  <ShieldExclamationIcon className="h-5 w-5" />
                  <span className="text-sm font-medium">{text.ownSecurity}</span>
                </div>
              </div>
            )}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{text.fullName}</label>
              <input
                value={editingUser.name || ''}
                onChange={(event) => setEditingUser({ ...editingUser, name: event.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{text.email}</label>
              <div className="relative">
                <EnvelopeIcon
                  className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 ${
                    isArabic ? 'right-3' : 'left-3'
                  }`}
                />
                <input
                  value={editingUser.email}
                  onChange={(event) => {
                    setEditingUser({ ...editingUser, email: event.target.value });
                    if (editEmailError) validateEditEmail(event.target.value, editingUser.id);
                  }}
                  onBlur={() => validateEditEmail(editingUser.email, editingUser.id)}
                  placeholder={text.emailPlaceholder}
                  className={`w-full rounded-lg border px-4 py-2 ${
                    isArabic ? 'pr-10' : 'pl-10'
                  } ${editEmailError ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                />
              </div>
              {editEmailError && (
                <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                  <ExclamationCircleIcon className="h-3 w-3" />
                  {editEmailError}
                </p>
              )}
            </div>
            <div>
  <label className="mb-1 block text-sm font-medium text-gray-700">{text.role}</label>
  <select
    value={editingUser.role}
    onChange={(event) => setEditingUser({ ...editingUser, role: event.target.value })}
    className="w-full rounded-lg border border-gray-300 px-4 py-2"
  >
    <option value="COMMERCIAL">Responsable vente</option>              {/* ← CHANGÉ */}
    <option value="RESPONSABLE_ACHAT">Responsable Achat et stock</option>   {/* ← CHANGÉ */}
  </select>
</div>
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleEditUser}
                disabled={isLoading || !!editEmailError}
                className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
              >
                {text.save}
              </button>
              <button
                onClick={() => {
                  setEditModalOpen(false);
                  setEditEmailError('');
                }}
                className="flex-1 rounded-lg bg-gray-100 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-200"
              >
                {text.cancel}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default GestionUsers;