import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  EnvelopeIcon,
  CalendarIcon,
  ArrowLeftIcon,
  BuildingOfficeIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';

import { authService } from '../../services/authService';
import api from '../../services/api';
import Header from '../../components/Header';
import { useLanguage } from '../../context/LanguageContext';

const profileCopy = {
  fr: {
    unknown: 'Non renseigné',
    never: 'Jamais',
    today: "Aujourd'hui",
    yesterday: 'Hier',
    loadError: 'Impossible de charger votre profil.',
    offlineTitle: 'Données affichées en mode hors-ligne',
    backToDashboard: 'Retour au tableau de bord',
    disabledAccount: 'Compte désactivé',
    editProfile: 'Modifier le profil',
    personalInfo: 'Informations personnelles',
    professionalInfo: 'Informations professionnelles',
    companyInfo: "Informations de l'entreprise",
    fullName: 'Nom complet',
    email: 'Email',
    role: 'Rôle',
    memberSince: 'Membre depuis',
    lastLogin: 'Dernière connexion',
    memberSinceHelper: 'Date de création du compte',
    unavailableHelper: 'Date non disponible',
    lastLoginHelper: 'Dernière activité',
    noLoginHelper: 'Aucune connexion enregistrée',
    administrator: 'Administrateur',
    adminClient: 'Administrateur Client',
    salesManager: 'Responsable Commercial',
    procurementManager: 'Responsable Achats',
    salesLead: 'Responsable Ventes',
    user: 'Utilisateur',
    companyLogo: "Logo de l'entreprise",
    raisonSociale: 'Raison sociale',
    matriculeFiscal: 'Matricule fiscal',
    changeLogo: 'Changer le logo',
    addLogo: 'Ajouter un logo',
    logoUploadSuccess: 'Logo mis à jour avec succès',
    logoUploadError: 'Erreur lors de la mise à jour du logo',
    uploadLogo: 'Importer un logo',
  },
  en: {
    unknown: 'Not provided',
    never: 'Never',
    today: 'Today',
    yesterday: 'Yesterday',
    loadError: 'Unable to load your profile.',
    offlineTitle: 'Data shown in offline mode',
    backToDashboard: 'Back to dashboard',
    disabledAccount: 'Account disabled',
    editProfile: 'Edit profile',
    personalInfo: 'Personal information',
    professionalInfo: 'Professional information',
    companyInfo: 'Company information',
    fullName: 'Full name',
    email: 'Email',
    role: 'Role',
    memberSince: 'Member since',
    lastLogin: 'Last login',
    memberSinceHelper: 'Account creation date',
    unavailableHelper: 'Date not available',
    lastLoginHelper: 'Latest activity',
    noLoginHelper: 'No recorded login yet',
    administrator: 'Administrator',
    adminClient: 'Client Administrator',
    salesManager: 'Sales Manager',
    procurementManager: 'Procurement Manager',
    salesLead: 'Sales Lead',
    user: 'User',
    companyLogo: 'Company logo',
    raisonSociale: 'Company name',
    matriculeFiscal: 'Tax registration number',
    changeLogo: 'Change logo',
    addLogo: 'Add logo',
    logoUploadSuccess: 'Logo updated successfully',
    logoUploadError: 'Error updating logo',
    uploadLogo: 'Upload logo',
  },
  ar: {
    unknown: 'غير متوفر',
    never: 'أبداً',
    today: 'اليوم',
    yesterday: 'أمس',
    loadError: 'تعذر تحميل ملفك الشخصي.',
    offlineTitle: 'يتم عرض البيانات في وضع غير متصل',
    backToDashboard: 'العودة إلى لوحة التحكم',
    disabledAccount: 'الحساب معطل',
    editProfile: 'تعديل الملف الشخصي',
    personalInfo: 'المعلومات الشخصية',
    professionalInfo: 'المعلومات المهنية',
    companyInfo: 'معلومات الشركة',
    fullName: 'الاسم الكامل',
    email: 'البريد الإلكتروني',
    role: 'الدور',
    memberSince: 'عضو منذ',
    lastLogin: 'آخر تسجيل دخول',
    memberSinceHelper: 'تاريخ إنشاء الحساب',
    unavailableHelper: 'التاريخ غير متوفر',
    lastLoginHelper: 'آخر نشاط',
    noLoginHelper: 'لا توجد عملية دخول مسجلة',
    administrator: 'المدير',
    adminClient: 'مدير العملاء',
    salesManager: 'مسؤول المبيعات',
    procurementManager: 'مسؤول المشتريات',
    salesLead: 'مشرف المبيعات',
    user: 'مستخدم',
    companyLogo: 'شعار الشركة',
    raisonSociale: 'الاسم التجاري',
    matriculeFiscal: 'الرقم الضريبي',
    changeLogo: 'تغيير الشعار',
    addLogo: 'إضافة شعار',
    logoUploadSuccess: 'تم تحديث الشعار بنجاح',
    logoUploadError: 'خطأ في تحديث الشعار',
    uploadLogo: 'رفع شعار',
  },
};

const formatDate = (dateString, locale, fallback) => {
  if (!dateString) return fallback;
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatLastLogin = (dateString, locale, copy) => {
  if (!dateString) return copy.never;
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return copy.today;
  if (date.toDateString() === yesterday.toDateString()) return copy.yesterday;
  return date.toLocaleDateString(locale);
};

const highlightCardStyles = {
  blue: {
    wrapper: 'border-blue-100 bg-gradient-to-r from-blue-50 to-cyan-50',
    label: 'text-blue-600',
  },
  purple: {
    wrapper: 'border-purple-100 bg-gradient-to-r from-purple-50 to-violet-50',
    label: 'text-purple-600',
  },
};

const ProfileHighlightCard = ({ label, value, helper, tone = 'blue' }) => {
  const styles = highlightCardStyles[tone] || highlightCardStyles.blue;

  return (
    <div className={`rounded-xl border p-6 ${styles.wrapper}`}>
      <div className={`text-sm font-medium ${styles.label}`}>{label}</div>
      <div className="mt-2 text-2xl font-bold text-gray-800">{value}</div>
      <div className="mt-2 text-sm text-gray-500">{helper}</div>
    </div>
  );
};

const ProfilePage = () => {
  const { language, isArabic } = useLanguage();
  const locale = language === 'ar' ? 'ar' : language === 'en' ? 'en-US' : 'fr-FR';
  const copy = profileCopy[language] || profileCopy.fr;
  
  const fileInputRef = useRef(null);
  const [logoTimestamp, setLogoTimestamp] = useState(Date.now());
  const [logoError, setLogoError] = useState(false);
  const [logoUploadSuccess, setLogoUploadSuccess] = useState(false);

  const [userData, setUserData] = useState({
    id: null,
    clientId: null, 
    nom: '',
    prenom: '',
    email: '',
    role: '',
    active: true,
    memberSince: null,
    lastLogin: null,
    typeCompte: '',
    raisonSociale: '',
    matriculeFiscal: '',
    logoUrl: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const getLogoUrl = () => {
    const clientId = userData.clientId;  
    
    if (!clientId) {
      console.log('❌ Pas de clientId disponible');
      return null;
    }
    
    const baseURL = api.defaults.baseURL || 'http://localhost:8081/api';
    const url = `${baseURL}/platform/clients/public/logo/${clientId}?t=${logoTimestamp}`;
    
    console.log('🔍 Génération URL logo:', { 
      clientId, 
      timestamp: logoTimestamp, 
      url 
    });
    
    return url;
  };

  const hasValidLogo = useCallback(() => {
    const logo = userData.logoUrl || localStorage.getItem('logoUrl');
    return logo && logo !== 'null' && logo !== '' && !logoError;
  }, [userData.logoUrl, logoError]);

  const refreshLogo = () => {
    setLogoTimestamp(Date.now());
    setLogoError(false);
  };

  // Vérifier si l'utilisateur peut modifier le logo
  const canEditLogo = () => {
    const role = String(userData.role || '').toUpperCase();
    // Seuls ADMIN_CLIENT et ADMIN peuvent modifier le logo
    return role === 'ADMIN_CLIENT' || role === 'ADMIN';
  };

  useEffect(() => {
    const loadMe = async () => {
      setLoading(true);
      setError('');

      try {
        const res = await authService.getCurrentUser();
        const me = res?.data;
        console.log('🔍 DONNÉES COMPLÈTES DE /auth/me:', me);
        console.log('🔍 clientId dans la réponse:', me.clientId);
        console.log('🔍 id dans la réponse:', me.id);
        
        if (me && me.email) {
          let logoUrl = me.logoUrl;
          
          if (!logoUrl) {
            logoUrl = localStorage.getItem('logoUrl');
          }
          
          if (!logoUrl && me.clientId) {
            try {
              const clientRes = await api.get(`/platform/clients/${me.clientId}`);
              if (clientRes.data && clientRes.data.logoUrl) {
                logoUrl = clientRes.data.logoUrl;
                console.log('✅ Logo récupéré depuis API client:', logoUrl);
              }
            } catch (err) {
              console.warn('Impossible de récupérer le logo du client:', err);
            }
          }
          
          setUserData({
            id: me.id,
            clientId: me.clientId, 
            nom: me.nom || me?.lastName || '',
            prenom: me.prenom || me?.firstName || '',
            email: me.email || '',
            role: me.role || '',
            active: me.active !== false,
            memberSince: me.memberSince || me.createdAt || null,
            lastLogin: me.lastLogin || null,
            typeCompte: me.typeCompte || '',
            raisonSociale: me.raisonSociale || '',
            matriculeFiscal: me.matriculeFiscal || '',
            logoUrl: logoUrl || null,
          });

          if (me.nom) localStorage.setItem('userNom', me.nom);
          if (me.prenom) localStorage.setItem('userPrenom', me.prenom);
          if (me.email) localStorage.setItem('userEmail', me.email);
          if (me.role) localStorage.setItem('userRole', me.role);
          if (me.typeCompte) localStorage.setItem('typeCompte', me.typeCompte);
          if (me.raisonSociale) localStorage.setItem('raisonSociale', me.raisonSociale);
          if (me.matriculeFiscal) localStorage.setItem('matriculeFiscal', me.matriculeFiscal);
          if (logoUrl) localStorage.setItem('logoUrl', logoUrl);
          
          refreshLogo();
        } else {
          throw new Error('No data from API');
        }
      } catch (e) {
        console.warn('API /me not available, using localStorage');
        setError('');
        
        setUserData({
          id: null,
          clientId: localStorage.getItem('clientId') || null,
          nom: localStorage.getItem('userNom') || '',
          prenom: localStorage.getItem('userPrenom') || '',
          email: localStorage.getItem('userEmail') || '',
          role: localStorage.getItem('userRole') || '',
          active: true,
          memberSince: localStorage.getItem('memberSince') || new Date().toISOString(),
          lastLogin: localStorage.getItem('lastLogin') || new Date().toISOString(),
          typeCompte: localStorage.getItem('typeCompte') || '',
          raisonSociale: localStorage.getItem('raisonSociale') || '',
          matriculeFiscal: localStorage.getItem('matriculeFiscal') || '',
          logoUrl: localStorage.getItem('logoUrl') || null,
        });
      } finally {
        setLoading(false);
      }
    };

    loadMe();
  }, []);

  const getRoleLabel = (role) => {
    const normalized = String(role || '').toUpperCase();
    const roles = {
      ADMIN: copy.administrator,
      ADMIN_CLIENT: copy.adminClient,
      COMMERCIAL: copy.salesManager,
      RESPONSABLE_ACHAT: copy.procurementManager,
      SALES: copy.salesLead,
      USER: copy.user,
    };
    return roles[normalized] || role || copy.user;
  };

  const isCompany = () => {
    return userData.typeCompte === 'ENTREPRISE';
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Format non supporté. Utilisez JPG, PNG, SVG ou WEBP');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Le logo ne doit pas dépasser 2MB');
      return;
    }

    setUploadingLogo(true);
    setLogoUploadSuccess(false);
    try {
      const formData = new FormData();
      formData.append('logo', file);

      const response = await api.put('/platform/clients/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      console.log('📦 Réponse upload:', response.data);

      if (response.data.success && response.data.logoUrl) {
        const newLogoUrl = response.data.logoUrl;
        
        setUserData(prev => ({ 
          ...prev, 
          logoUrl: newLogoUrl 
        }));
        
        if (newLogoUrl) {
          localStorage.setItem('logoUrl', newLogoUrl);
        }
        
        refreshLogo();
        setLogoError(false);
        setLogoUploadSuccess(true);
        
        toast.success(copy.logoUploadSuccess);
        
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        toast.error('Réponse inattendue du serveur');
      }
    } catch (error) {
      console.error('Erreur upload logo:', error);
      toast.error(copy.logoUploadError);
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const initials = useMemo(() => {
    const firstInitial = userData.prenom?.charAt(0)?.toUpperCase() || '';
    const lastInitial = userData.nom?.charAt(0)?.toUpperCase() || '';
    return `${firstInitial}${lastInitial}` || 'U';
  }, [userData.nom, userData.prenom]);

  const avatarColor = useMemo(() => {
    const colors = [
      'bg-gradient-to-br from-blue-500 to-blue-600',
      'bg-gradient-to-br from-green-500 to-green-600',
      'bg-gradient-to-br from-purple-500 to-purple-600',
      'bg-gradient-to-br from-red-500 to-red-600',
      'bg-gradient-to-br from-yellow-500 to-yellow-600',
      'bg-gradient-to-br from-pink-500 to-pink-600',
      'bg-gradient-to-br from-indigo-500 to-indigo-600',
      'bg-gradient-to-br from-teal-500 to-teal-600',
      'bg-gradient-to-br from-orange-500 to-orange-600',
      'bg-gradient-to-br from-cyan-500 to-cyan-600',
    ];

    const seed = `${userData.nom}${userData.prenom}`;
    let hash = 0;
    for (let i = 0; i < seed.length; i += 1) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }, [userData.nom, userData.prenom]);

  const profileHighlights = [
    {
      label: copy.memberSince,
      value: formatDate(userData.memberSince, locale, copy.unknown),
      helper: userData.memberSince ? copy.memberSinceHelper : copy.unavailableHelper,
      tone: 'blue',
    },
    {
      label: copy.lastLogin,
      value: formatLastLogin(userData.lastLogin, locale, copy),
      helper: userData.lastLogin ? copy.lastLoginHelper : copy.noLoginHelper,
      tone: 'purple',
    },
  ];

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 pt-16">
          <div className="flex h-screen items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 pt-16" dir={isArabic ? 'rtl' : 'ltr'}>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Link
            to="/dashboard"
            className={`mb-6 inline-flex items-center text-sm text-blue-600 hover:text-blue-800 ${isArabic ? 'flex-row-reverse gap-2' : ''}`}
          >
            <ArrowLeftIcon className={`h-4 w-4 ${isArabic ? '' : 'mr-2'}`} />
            {copy.backToDashboard}
          </Link>

          {error && (
            <div className="mb-6 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
              <div className={`flex items-start gap-2 ${isArabic ? 'flex-row-reverse text-right' : ''}`}>
                <span>⚠️</span>
                <div>
                  <div className="font-semibold">{copy.offlineTitle}</div>
                  <div className="mt-1">{error}</div>
                </div>
              </div>
            </div>
          )}

          <div className="overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="relative h-48 bg-gradient-to-r from-blue-600 to-cyan-500">
              <div className={`absolute -bottom-16 ${isArabic ? 'right-8' : 'left-8'}`}>
                <div className="relative">
                  {/* Afficher le logo ou les initiales */}
                  {hasValidLogo() ? (
                    <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-white shadow-lg">
                      <img 
                        src={getLogoUrl()}
                        alt="Logo" 
                        className="max-h-full max-w-full object-contain p-2"
                        onError={() => {
                          console.log('❌ Erreur chargement logo');
                          setLogoError(true);
                        }}
                      />
                    </div>
                  ) : (
                    <div className={`flex h-32 w-32 items-center justify-center rounded-full border-4 border-white shadow-lg ${avatarColor}`}>
                      <span className="text-4xl font-bold text-white">{initials}</span>
                    </div>
                  )}
                  
                  {/* ✅ Bouton d'édition - TOUJOURS visible pour ADMIN_CLIENT */}
                  {canEditLogo() && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-2 -right-2 rounded-full bg-blue-600 p-1.5 text-white shadow-lg hover:bg-blue-700 transition-all"
                      disabled={uploadingLogo}
                      title={copy.changeLogo}
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/svg+xml,image/webp"
                className="hidden"
                onChange={handleLogoUpload}
              />
            </div>

            <div className="px-8 pb-8 pt-20">
              <div className={`flex items-start justify-between gap-6 ${isArabic ? 'flex-row-reverse text-right' : ''}`}>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {isCompany() && userData.raisonSociale 
                      ? userData.raisonSociale 
                      : `${userData.prenom} ${userData.nom}`}
                    {!userData.prenom && !userData.nom && !userData.raisonSociale && (userData.email || 'Utilisateur')}
                  </h1>
                  <p className="mt-1 text-lg text-gray-600">{getRoleLabel(userData.role)}</p>

                  {userData.active === false && (
                    <p className="mt-2 inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700">
                      {copy.disabledAccount}
                    </p>
                  )}
                </div>

                <Link
                  to="/settings"
                  className="rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2 font-medium text-white transition-all hover:from-blue-700 hover:to-blue-600"
                >
                  {copy.editProfile}
                </Link>
              </div>

              <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2">
                <div className="rounded-xl bg-gray-50 p-6">
                  <h2 className="mb-4 text-xl font-semibold text-gray-800">{copy.personalInfo}</h2>
                  <div className="space-y-4">
                    <div className={`flex items-center ${isArabic ? 'flex-row-reverse text-right' : ''}`}>
                      <div className="w-32 text-gray-500">{copy.fullName}</div>
                      <div className="font-medium text-gray-800">{`${userData.prenom} ${userData.nom}`}</div>
                    </div>
                    <div className={`flex items-center ${isArabic ? 'flex-row-reverse text-right' : ''}`}>
                      <div className="w-32 text-gray-500">{copy.email}</div>
                      <div className={`flex items-center font-medium text-gray-800 ${isArabic ? 'flex-row-reverse gap-2' : ''}`}>
                        <EnvelopeIcon className={`h-4 w-4 text-gray-400 ${isArabic ? '' : 'mr-2'}`} />
                        {userData.email}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-gray-50 p-6">
                  <h2 className="mb-4 text-xl font-semibold text-gray-800">{copy.professionalInfo}</h2>
                  <div className="space-y-4">
                    <div className={`flex items-center ${isArabic ? 'flex-row-reverse text-right' : ''}`}>
                      <div className="w-32 text-gray-500">{copy.role}</div>
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                        {getRoleLabel(userData.role)}
                      </span>
                    </div>
                    <div className={`flex items-center ${isArabic ? 'flex-row-reverse text-right' : ''}`}>
                      <div className="w-32 text-gray-500">{copy.memberSince}</div>
                      <div className={`flex items-center font-medium text-gray-800 ${isArabic ? 'flex-row-reverse gap-2' : ''}`}>
                        <CalendarIcon className={`h-4 w-4 text-gray-400 ${isArabic ? '' : 'mr-2'}`} />
                        {userData.memberSince ? formatDate(userData.memberSince, locale, copy.unknown) : '—'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {isCompany() && (
                <div className="mt-8 rounded-xl bg-gray-50 p-6">
                  <h2 className="mb-4 text-xl font-semibold text-gray-800">
                    <BuildingOfficeIcon className={`inline h-5 w-5 text-blue-600 ${isArabic ? 'ml-2' : 'mr-2'}`} />
                    {copy.companyInfo}
                  </h2>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className={`flex items-center ${isArabic ? 'flex-row-reverse text-right' : ''}`}>
                      <div className="w-40 text-gray-500">{copy.raisonSociale}</div>
                      <div className="font-medium text-gray-800">{userData.raisonSociale || '—'}</div>
                    </div>
                    <div className={`flex items-center ${isArabic ? 'flex-row-reverse text-right' : ''}`}>
                      <div className="w-40 text-gray-500">{copy.matriculeFiscal}</div>
                      <div className="font-medium text-gray-800">{userData.matriculeFiscal || '—'}</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
                {profileHighlights.map((item) => (
                  <ProfileHighlightCard
                    key={item.label}
                    label={item.label}
                    value={item.value}
                    helper={item.helper}
                    tone={item.tone}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfilePage;