/**
 * ProfilePage - Page de profil utilisateur
 * 
 * RÔLE : Afficher les informations personnelles et professionnelles de l'utilisateur
 * ROUTE : /profile
 * 
 * FONCTIONNALITÉS :
 * - Affichage avatar (initiales + couleur aléatoire)
 * - Infos personnelles (nom, email, téléphone)
 * - Infos professionnelles (rôle, date inscription)
 * - Statistiques (sessions, dernière connexion)
 * - Bouton modification → redirection /settings
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

import { authService } from '../../services/authService';
import Header from '../../components/Header';

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

/**
 * Formate une date en français (ex: 15 janvier 2024)
 * @param {string} dateString - Date ISO
 * @returns {string} Date formatée ou "Non renseigné"
 */
const formatDate = (dateString) => {
  if (!dateString) return 'Non renseigné';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Formate la dernière connexion en texte lisible
 * - Aujourd'hui / Hier / Date complète
 * @param {string} dateString - Date ISO
 * @returns {string} "Aujourd'hui", "Hier" ou date formatée
 */
const formatLastLogin = (dateString) => {
  if (!dateString) return 'Jamais';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Aujourd'hui";
  if (date.toDateString() === yesterday.toDateString()) return 'Hier';
  return date.toLocaleDateString('fr-FR');
};

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

const ProfilePage = () => {
  // État des données utilisateur
  const [userData, setUserData] = useState({
    nom: '',
    prenom: '',
    email: '',
    departement: 'Non renseigné',
    role: '',
    active: true,
    memberSince: null,      // Date d'inscription
    lastLogin: null,        // Dernière connexion
    sessionsThisWeek: 0     // Nombre de connexions cette semaine
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ============================================
  // CHARGEMENT DES DONNÉES
  // ============================================
  
  useEffect(() => {
    const loadMe = async () => {
      setLoading(true);
      setError('');

      try {
        // Appel API pour récupérer l'utilisateur courant
        const res = await authService.getCurrentUser();
        const me = res?.data;

        // Mise à jour du state
        setUserData({
          nom: me?.nom || me?.lastName || '',
          prenom: me?.prenom || me?.firstName || '',
          email: me?.email || '',
          role: me?.role || '',
          active: me?.active !== false,
          departement: localStorage.getItem('userDepartement') || 'Non renseigné',
          memberSince: me?.memberSince || null,
          lastLogin: me?.lastLogin || null,
          sessionsThisWeek: me?.sessionsThisWeek || 0
        });

        // Synchronisation localStorage pour les autres composants
        const fullName = `${me?.nom || ''} ${me?.prenom || ''}`.trim();
        if (me?.role) localStorage.setItem('userRole', me.role);
        if (fullName) localStorage.setItem('userName', fullName);
        if (me?.email) localStorage.setItem('userEmail', me.email);
        
      } catch (e) {
        setError(e?.message || "Impossible de charger votre profil.");
        
        // Fallback : données depuis localStorage
        setUserData({
          nom: localStorage.getItem('userNom') || '',
          prenom: localStorage.getItem('userPrenom') || '',
          email: localStorage.getItem('userEmail') || '',
          departement: localStorage.getItem('userDepartement') || 'Non renseigné',
          role: localStorage.getItem('userRole') || '',
          active: true,
          memberSince: null,
          lastLogin: null,
          sessionsThisWeek: 0
        });
      } finally {
        setLoading(false);
      }
    };

    loadMe();
  }, []);

  // ============================================
  // FONCTIONS D'AFFICHAGE
  // ============================================

  /**
   * Traduit le rôle technique en libellé français
   * @param {string} role - Rôle brut (ADMIN, COMMERCIAL, etc.)
   * @returns {string} Libellé français
   */
  const getRoleLabel = (role) => {
    const normalized = String(role || '').toUpperCase();
    const roles = {
      ADMIN: 'Administrateur',
      COMMERCIAL: 'Responsable Commercial',
      RESPONSABLE_ACHAT: 'Responsable Achats',
      SALES: 'Responsable Ventes',
      USER: 'Utilisateur'
    };
    return roles[normalized] || role || 'Utilisateur';
  };

  /**
   * Génère les initiales à partir du nom et prénom
   * @returns {string} 2 lettres majuscules
   */
  const getInitials = (nom, prenom) => {
    const firstInitial = prenom?.charAt(0)?.toUpperCase() || '';
    const lastInitial = nom?.charAt(0)?.toUpperCase() || '';
    return `${firstInitial}${lastInitial}`;
  };

  /**
   * Génère une couleur aléatoire mais cohérente pour l'avatar
   * Basée sur le hash du nom + prénom
   * @returns {string} Classe Tailwind CSS pour le dégradé
   */
  const getRandomColor = (str) => {
    // Calcul du hash
    let hash = 0;
    for (let i = 0; i < (str || '').length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Palette de couleurs disponibles
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
      'bg-gradient-to-br from-cyan-500 to-cyan-600'
    ];

    const colorIndex = Math.abs(hash) % colors.length;
    return colors[colorIndex];
  };

  // ============================================
  // AFFICHAGE CHARGEMENT
  // ============================================
  
  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 pt-16">
          <div className="flex items-center justify-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        </div>
      </>
    );
  }

  // Préparation des données pour l'affichage
  const initials = getInitials(userData.nom, userData.prenom);
  const avatarColor = getRandomColor(`${userData.nom}${userData.prenom}`);

  // Cartes statistiques à afficher
  const profileHighlights = [
    {
      label: 'Membre depuis',
      value: userData.memberSince ? formatDate(userData.memberSince) : 'Non renseigné',
      helper: userData.memberSince ? 'Date de création du compte' : 'Date non disponible',
      tone: 'blue'
    },
    {
      label: 'Sessions cette semaine',
      value: userData.sessionsThisWeek.toString(),
      helper: 'Activité récente sur les 7 derniers jours',
      tone: 'green'
    },
    {
      label: 'Dernière connexion',
      value: formatLastLogin(userData.lastLogin),
      helper: userData.lastLogin ? 'Dernière activité' : 'Aucune connexion enregistrée',
      tone: 'purple'
    }
  ];

  // ============================================
  // RENDU PRINCIPAL
  // ============================================
  
  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Lien retour */}
          <Link to="/dashboard" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 mb-6">
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Retour au tableau de bord
          </Link>

          {/* Message d'erreur (mode hors-ligne) */}
          {error && (
            <div className="mb-6 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-xl text-sm">
              <div className="flex items-start gap-2">
                <span>⚠️</span>
                <div>
                  <div className="font-semibold">Données affichées en mode hors-ligne</div>
                  <div className="mt-1">{error}</div>
                </div>
              </div>
            </div>
          )}

          {/* Carte principale du profil */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            
            {/* Bannière colorée + Avatar */}
            <div className="relative h-48 bg-gradient-to-r from-blue-600 to-cyan-500">
              <div className="absolute -bottom-16 left-8">
                {userData.photo ? (
                  <div className="h-32 w-32 rounded-full border-4 border-white shadow-lg overflow-hidden">
                    <img src={userData.photo} alt="Avatar" className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className={`h-32 w-32 rounded-full border-4 border-white shadow-lg flex items-center justify-center ${avatarColor}`}>
                    <span className="text-white text-4xl font-bold">{initials}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Corps du profil */}
            <div className="pt-20 px-8 pb-8">
              
              {/* En-tête avec nom et bouton modifier */}
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {userData.prenom} {userData.nom}
                  </h1>
                  <p className="text-lg text-gray-600 mt-1">{getRoleLabel(userData.role)}</p>

                  {userData.active === false && (
                    <p className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700">
                      Compte désactivé
                    </p>
                  )}
                </div>

                <Link to="/settings" className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all font-medium">
                  Modifier le profil
                </Link>
              </div>

              {/* Grille des informations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
                
                {/* Informations personnelles */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Informations personnelles</h2>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <div className="w-32 text-gray-500">Nom complet</div>
                      <div className="font-medium text-gray-800">{userData.prenom} {userData.nom}</div>
                    </div>
                    <div className="flex items-center">
                      <div className="w-32 text-gray-500">Email</div>
                      <div className="font-medium text-gray-800 flex items-center">
                        <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-400" />
                        {userData.email}
                      </div>
                </div>
                </div>
                </div>

                {/* Informations professionnelles */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Informations professionnelles</h2>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <div className="w-32 text-gray-500">Rôle</div>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        {getRoleLabel(userData.role)}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-32 text-gray-500">Membre depuis</div>
                      <div className="font-medium text-gray-800 flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                        {userData.memberSince ? formatDate(userData.memberSince) : '—'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cartes statistiques */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
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

// ============================================
// SOUS-COMPOSANT : Carte statistique
// ============================================

/**
 * Styles des cartes selon le thème (couleur)
 */
const highlightCardStyles = {
  blue: {
    wrapper: 'border-blue-100 bg-gradient-to-r from-blue-50 to-cyan-50',
    label: 'text-blue-600'
  },
  green: {
    wrapper: 'border-green-100 bg-gradient-to-r from-green-50 to-emerald-50',
    label: 'text-green-600'
  },
  purple: {
    wrapper: 'border-purple-100 bg-gradient-to-r from-purple-50 to-violet-50',
    label: 'text-purple-600'
  }
};

/**
 * ProfileHighlightCard - Carte d'affichage d'une statistique
 * 
 * @param {Object} props
 * @param {string} props.label - Titre de la carte (ex: "Membre depuis")
 * @param {string} props.value - Valeur à afficher (ex: "15 janvier 2024")
 * @param {string} props.helper - Texte d'aide (ex: "Date de création")
 * @param {string} props.tone - Thème couleur (blue, green, purple)
 */
const ProfileHighlightCard = ({ label, value, helper, tone = 'blue' }) => {
  const styles = highlightCardStyles[tone] || highlightCardStyles.blue;

  return (
    <div className={`rounded-xl border p-6 ${styles.wrapper}`}>
      <div className={`text-sm font-medium ${styles.label}`}>{label}</div>
      <div className="text-2xl font-bold text-gray-800 mt-2">{value}</div>
      <div className="text-sm text-gray-500 mt-2">{helper}</div>
    </div>
  );
};

export default ProfilePage;