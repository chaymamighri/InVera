import React, { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { useUserManagement } from '../../../../hooks/useUserManagement';

// Reusable Modal
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

// Reusable Input
const InputField = ({ label, value, onChange, placeholder, type = "text" }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
    />
  </div>
);

// Reusable Select
const SelectField = ({ label, value, onChange, options }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
);

// Toggle Switch
const ToggleSwitch = ({ checked, onChange }) => (
  <button
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-green-500' : 'bg-gray-200'}`}
  >
    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
  </button>
);

const GestionUsers = () => {
  const { getUsers, addUser, updateUser, toggleUserStatus, deleteUser } = useUserManagement();

  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'sales' });
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    setUsers(getUsers());
  }, []);

  const refreshUsers = () => setUsers(getUsers());

  // Add user
  const handleAddUser = async () => {
    try {
      await addUser(newUser);
      refreshUsers();
      setNewUser({ name: '', email: '', role: 'sales' });
      setAddModalOpen(false);
    } catch (err) {
      alert(err.message);
    }
  };

  // Edit user
  const handleEditUser = async () => {
    try {
      await updateUser(editingUser.id, editingUser);
      setEditingUser(null);
      setEditModalOpen(false);
      refreshUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  // Delete user
  const handleDeleteUser = async (userId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      await deleteUser(userId);
      refreshUsers();
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Utilisateurs</h1>
          <p className="text-sm text-gray-500 mt-1">Gérez vos utilisateurs commerciaux et achats</p>
        </div>
        <button
          onClick={() => setAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition"
        >
          <PlusIcon className="w-5 h-5" />
          Ajouter
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <FunnelIcon className="w-5 h-5 text-gray-400" />
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">Tous</option>
            <option value="sales">Commercial</option>
            <option value="procurement">Achat</option>
          </select>
        </div>

        <div className="text-sm text-gray-500">{filteredUsers.length} utilisateur(s)</div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full min-w-[600px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Nom</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Rôle</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Statut</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredUsers.map(user => (
              <tr key={user.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  {user.name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.role === 'sales' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                  }`}>
                    {user.role === 'sales' ? 'Commercial' : 'Achat'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <ToggleSwitch
                    checked={user.active}
                    onChange={async () => { await toggleUserStatus(user.id); refreshUsers(); }}
                  />
                </td>
                <td className="px-6 py-4 flex items-center gap-2">
                  <button
                    onClick={() => { setEditingUser(user); setEditModalOpen(true); }}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      <Modal open={addModalOpen} onClose={() => setAddModalOpen(false)}>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Nouveau Utilisateur</h2>
        <div className="space-y-4">
          <InputField label="Nom" value={newUser.name} onChange={val => setNewUser({ ...newUser, name: val })} placeholder="Nom complet" />
          <InputField label="Email" type="email" value={newUser.email} onChange={val => setNewUser({ ...newUser, email: val })} placeholder="email@example.com" />
          <SelectField label="Rôle" value={newUser.role} onChange={val => setNewUser({ ...newUser, role: val })} options={[{label:'Commercial',value:'sales'},{label:'Achat',value:'procurement'}]} />
          <div className="flex gap-3 mt-4">
            <button onClick={handleAddUser} className="flex-1 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600">Ajouter</button>
            <button onClick={() => setAddModalOpen(false)} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Annuler</button>
          </div>
        </div>
      </Modal>

      {/* Edit User Modal */}
      <Modal open={editModalOpen} onClose={() => setEditModalOpen(false)}>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Modifier Utilisateur</h2>
        {editingUser && (
          <div className="space-y-4">
            <InputField label="Nom" value={editingUser.name} onChange={val => setEditingUser({ ...editingUser, name: val })} />
            <InputField label="Email" type="email" value={editingUser.email} onChange={val => setEditingUser({ ...editingUser, email: val })} />
            <SelectField label="Rôle" value={editingUser.role} onChange={val => setEditingUser({ ...editingUser, role: val })} options={[{label:'Commercial',value:'sales'},{label:'Achat',value:'procurement'}]} />
            <div className="flex gap-3 mt-4">
              <button onClick={handleEditUser} className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">Sauvegarder</button>
              <button onClick={() => setEditModalOpen(false)} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Annuler</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default GestionUsers;
