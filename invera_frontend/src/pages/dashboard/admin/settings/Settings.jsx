import React, { useState } from 'react';
import {
  UserIcon,
  BellIcon,
  PaintBrushIcon,
  LockClosedIcon,
  ArrowPathIcon,
  TrashIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';

const Settings = () => {
  const [expanded, setExpanded] = useState({
    account: true,
    notifications: false,
    display: false,
    security: false,
  });

  const [profile, setProfile] = useState({
    name: 'Admin',
    email: 'admin@imbusflow.com',
    role: 'Administrateur',
    phone: '+216 12 345 678',
  });

  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    weeklyReports: true,
    monthlyReports: true,
    theme: 'light',
    dateFormat: 'DD/MM/YYYY',
    twoFactorAuth: false,
    sessionTimeout: '30',
  });

  const toggleExpand = (section) => setExpanded((prev) => ({ ...prev, [section]: !prev[section] }));
  const updateProfile = (key, value) => setProfile((prev) => ({ ...prev, [key]: value }));
  const updateSetting = (key, value) => setSettings((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Parametres</h1>
      <p className="text-sm text-gray-500">Gerez vos preferences et parametres</p>

      <div className="space-y-4">
        <SettingsCard
          title="Compte"
          icon={<UserIcon className="w-6 h-6 text-blue-600" />}
          expanded={expanded.account}
          onToggle={() => toggleExpand('account')}
        >
          <div className="space-y-4">
            <InputField label="Nom" value={profile.name} onChange={(val) => updateProfile('name', val)} />
            <InputField label="Email" value={profile.email} onChange={(val) => updateProfile('email', val)} />
            <InputField label="Role" value={profile.role} disabled />
            <InputField label="Telephone" value={profile.phone} onChange={(val) => updateProfile('phone', val)} />
            <button className="mt-2 w-full px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600">
              Sauvegarder
            </button>
          </div>
        </SettingsCard>

        <SettingsCard
          title="Notifications"
          icon={<BellIcon className="w-6 h-6 text-purple-600" />}
          expanded={expanded.notifications}
          onToggle={() => toggleExpand('notifications')}
        >
          <ToggleSetting
            label="Email"
            checked={settings.emailNotifications}
            onChange={(val) => updateSetting('emailNotifications', val)}
          />
          <ToggleSetting
            label="Push"
            checked={settings.pushNotifications}
            onChange={(val) => updateSetting('pushNotifications', val)}
          />
          <ToggleSetting
            label="Rapports Hebdomadaires"
            checked={settings.weeklyReports}
            onChange={(val) => updateSetting('weeklyReports', val)}
          />
          <ToggleSetting
            label="Rapports Mensuels"
            checked={settings.monthlyReports}
            onChange={(val) => updateSetting('monthlyReports', val)}
          />
        </SettingsCard>

        <SettingsCard
          title="Affichage"
          icon={<PaintBrushIcon className="w-6 h-6 text-teal-600" />}
          expanded={expanded.display}
          onToggle={() => toggleExpand('display')}
        >
          <SelectField
            label="Theme"
            value={settings.theme}
            onChange={(val) => updateSetting('theme', val)}
            options={[
              { label: 'Clair', value: 'light' },
              { label: 'Sombre', value: 'dark' },
              { label: 'Auto', value: 'auto' },
            ]}
          />
          <SelectField
            label="Format de Date"
            value={settings.dateFormat}
            onChange={(val) => updateSetting('dateFormat', val)}
            options={[
              { label: 'DD/MM/YYYY', value: 'DD/MM/YYYY' },
              { label: 'MM/DD/YYYY', value: 'MM/DD/YYYY' },
              { label: 'YYYY-MM-DD', value: 'YYYY-MM-DD' },
            ]}
          />
        </SettingsCard>

        <SettingsCard
          title="Securite"
          icon={<LockClosedIcon className="w-6 h-6 text-red-600" />}
          expanded={expanded.security}
          onToggle={() => toggleExpand('security')}
        >
          <ToggleSetting
            label="Authentification a 2 facteurs"
            checked={settings.twoFactorAuth}
            onChange={(val) => updateSetting('twoFactorAuth', val)}
          />
          <SelectField
            label="Delai d'expiration de session"
            value={settings.sessionTimeout}
            onChange={(val) => updateSetting('sessionTimeout', val)}
            options={[
              { label: '15 min', value: '15' },
              { label: '30 min', value: '30' },
              { label: '1h', value: '60' },
              { label: 'Jamais', value: 'never' },
            ]}
          />
          <button className="mt-2 w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center justify-center gap-2">
            <ArrowPathIcon className="w-5 h-5" /> Changer le mot de passe
          </button>
          <button className="mt-2 w-full px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 flex items-center justify-center gap-2">
            <TrashIcon className="w-5 h-5" /> Supprimer le compte
          </button>
        </SettingsCard>
      </div>
    </div>
  );
};

const SettingsCard = ({ title, icon, expanded, onToggle, children }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-3 px-6 py-4 justify-between focus:outline-none hover:bg-gray-50 transition"
    >
      <div className="flex items-center gap-3">
        {icon}
        <span className="font-semibold text-gray-900">{title}</span>
      </div>
      <ChevronDownIcon
        className={`w-4 h-4 text-gray-500 transform transition-transform ${expanded ? 'rotate-180' : ''}`}
      />
    </button>
    {expanded && <div className="px-6 pb-6">{children}</div>}
  </div>
);

const InputField = ({ label, value, onChange, disabled }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
        disabled ? 'bg-gray-50 text-gray-500' : ''
      }`}
    />
  </div>
);

const ToggleSetting = ({ label, checked, onChange }) => (
  <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
    <p className="text-sm font-medium text-gray-900">{label}</p>
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? 'bg-teal-500' : 'bg-gray-200'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  </div>
);

const SelectField = ({ label, value, onChange, options }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);

export default Settings;
