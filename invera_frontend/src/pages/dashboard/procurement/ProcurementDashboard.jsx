// ProcurementDashboard.jsx
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  CubeIcon,
  ShoppingCartIcon,
  TruckIcon,
  TagIcon,
  ChartBarIcon,
  DocumentTextIcon,
  InboxIcon,
  ArrowPathIcon, 
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { useSidebar } from '../../../context/SidebarContext';
import Footer from '../../../components/Footer';

// ========== IMPORT DES PAGES ==========
import Produits from './produits/Produits';
//import Commandes from './commandes/Commandes';
//import Fournisseurs from './fournisseurs/Fournisseurs';
//import Statistiques from './statistiques/StatistiquesAchats';
//import Categories from './categories/Categories';
//import Demandes from './demandes/DemandesApprovisionnement';
//import Receptions from './receptions/ReceptionsMarchandises';
//import Stocks from './stocks/NiveauxStock';

// ========== MÉMOÏSATION DES COMPOSANTS ==========
// Optimisation des performances en évitant les re-rendus inutiles
const MemoizedProduits = React.memo(Produits);
/*const MemoizedStatistiques = React.memo(Statistiques);
const MemoizedCommandes = React.memo(Commandes);
const MemoizedFournisseurs = React.memo(Fournisseurs);
const MemoizedCategories = React.memo(Categories);
const MemoizedDemandes = React.memo(Demandes);
const MemoizedReceptions = React.memo(Receptions);
const MemoizedStocks = React.memo(Stocks);*/

const ProcurementDashboard = () => {
  // ========== HOOKS ==========
  const { getCurrentUser } = useAuth(); 
  const admin = getCurrentUser(); 
  const navigate = useNavigate(); 
  const { collapsed, toggleSidebar } = useSidebar(); 

  // ========== ÉTATS LOCAUX ==========
  const [activePage, setActivePage] = useState('stats'); 
  const [user, setUser] = useState({ name: '', role: '', email: '', initials: '' }); // Infos utilisateur pour l'affichage

  // ========== EFFET POUR CHARGER LES INFOS UTILISATEUR ==========
  useEffect(() => {
    // Récupère les infos depuis l'objet admin ou localStorage en fallback
    const userName = admin?.nom || localStorage.getItem('userName') || 'Responsable Achats';
    const userEmail = admin?.email || localStorage.getItem('userEmail') || 'achats@invera.com';
    const userRole = admin?.role || localStorage.getItem('userRole') || 'Responsable Achats';
    
    // Crée les initiales (ex: "Chayma Mighri" -> "CM")
    const initials = userName
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
    
    setUser({ name: userName, role: userRole, email: userEmail, initials });
  }, [admin]); // Se déclenche quand admin change

  // ========== FONCTIONS UTILITAIRES ==========
  // Extrait le prénom d'un nom complet
  const getFirstName = (fullName) => fullName.split(' ')[0];

  // ========== STRUCTURE DE NAVIGATION ==========
  // Organisée en sections pour une meilleure lisibilité
  const sections = [
    {
      title: 'TABLEAU DE BORD', // Titre de section visible quand sidebar ouverte
      items: [
        { id: 'stats', label: 'Statistiques', icon: ChartBarIcon },
      ]
    },
    {
      title: 'GESTION DES PRODUITS',
      items: [
        { id: 'produits', label: 'Catalogue produits', icon: CubeIcon },
       // { id: 'categories', label: 'Catégories', icon: TagIcon },
       // { id: 'stocks', label: 'Niveaux de stock', icon: InboxIcon },
      ]
    },
    /*{
      title: 'APPROVISIONNEMENT',
      items: [
        { id: 'commandes', label: 'Commandes fournisseurs', icon: ShoppingCartIcon },
        { id: 'demandes', label: "Demandes d'approvisionnement", icon: DocumentTextIcon },
        { id: 'fournisseurs', label: 'Fournisseurs', icon: TruckIcon },
      ]
    },
    {
      title: 'RÉCEPTION',
      items: [
        { id: 'receptions', label: 'Réceptions', icon: ArrowPathIcon },
      ]
    }*/
  ];

  // ========== GESTIONNAIRE DE CHANGEMENT DE PAGE ==========
  // useCallback pour éviter de recréer la fonction à chaque rendu
  const handleSetActivePage = useCallback((pageId) => {
    setActivePage(pageId);
  }, []);

  // ========== RENDU CONDITIONNEL DES PAGES ==========
  // useMemo pour éviter de re-rendre inutilement
  const renderPage = useMemo(() => {
    switch (activePage) {
      //case 'stats': return <MemoizedStatistiques />;
      case 'produits': return <MemoizedProduits />;
      /*case 'categories': return <MemoizedCategories />;
      case 'stocks': return <MemoizedStocks />;
      case 'commandes': return <MemoizedCommandes />;
      case 'demandes': return <MemoizedDemandes />;
      case 'fournisseurs': return <MemoizedFournisseurs />;
      case 'receptions': return <MemoizedReceptions />;
      default: return <MemoizedStatistiques />;*/
    }
  }, [activePage]);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* ========== SIDEBAR ========== */}
      {/* Largeur dynamique selon l'état collapsed (réduit: 80px, ouvert: 256px) */}
      <div className={`fixed top-0 left-0 h-full bg-white border-r shadow-xl transition-all duration-300 z-30 ${
        collapsed ? 'w-20' : 'w-64'
      }`}>
        
        {/* ========== EN-TÊTE DE LA SIDEBAR ========== */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            {/* Logo et titre - visible seulement quand sidebar ouverte */}
            {!collapsed && (
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                  Tableau de Bord Gestion Achats
                </h1>
                <p className="text-xs text-gray-400 mt-1">
                  Stocks et commandes
                </p>
              </div>
            )}
            {/* Bouton pour réduire/agrandir la sidebar */}
            <button
              onClick={toggleSidebar}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label={collapsed ? "Développer le menu" : "Réduire le menu"}
            >
              {collapsed ? '→' : '←'}
            </button>
          </div>
        </div>

        {/* ========== NAVIGATION ========== */}
        <nav className="p-4 flex flex-col h-[calc(100vh-140px)]">
          <ul className="space-y-1 flex-1 overflow-y-auto">
            {/* Parcours des sections de navigation */}
            {sections.map((section) => (
              <li key={section.title}>
                {/* Titre de section - visible seulement quand sidebar ouverte */}
                {!collapsed && (
                  <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    {section.title}
                  </h3>
                )}
                <ul className="space-y-1">
                  {/* Parcours des items de chaque section */}
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activePage === item.id;

                    return (
                      <li key={item.id}>
                        <button
                          onClick={() => handleSetActivePage(item.id)}
                          className={`w-full flex items-center ${
                            collapsed ? 'justify-center px-3 py-3' : 'px-4 py-3'
                          } rounded-lg transition-all duration-200 relative group ${
                            isActive
                              ? 'bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 font-semibold border-l-3 border-blue-500'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                          title={collapsed ? item.label : ''} // Tooltip quand sidebar réduite
                        >
                          {/* Icône du menu */}
                          <Icon className={`w-5 h-5 flex-shrink-0 ${
                            isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'
                          }`} />
                          
                          {/* Label du menu - visible seulement quand sidebar ouverte */}
                          {!collapsed && (
                            <span className="ml-3 flex-1 text-left text-sm">{item.label}</span>
                          )}
                          
                          {/* Tooltip personnalisé pour la version réduite */}
                          {collapsed && (
                            <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-lg">
                              {item.label}
                            </div>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>

          {/* ========== PROFIL UTILISATEUR ========== */}
          <div className={`border-t pt-4 ${collapsed ? 'px-3' : 'px-4'} mt-auto`}>
            <div className={`flex items-center ${collapsed ? 'justify-center' : 'space-x-3'}`}>
              {/* Avatar avec initiales */}
              <div
                className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => navigate('/profile')}
                title="Voir mon profil"
              >
                {user.initials}
              </div>
              
              {/* Infos utilisateur - visible seulement quand sidebar ouverte */}
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {getFirstName(user.name)}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user.role}</p>
                  <p className="text-xs text-gray-400 truncate">{user.email}</p>
                </div>
              )}
              
              {/* Tooltip pour les infos utilisateur en mode réduit */}
              {collapsed && (
                <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-lg">
                  <div className="font-medium">{user.name}</div>
                  <div className="text-gray-300 text-xs">{user.role}</div>
                  <div className="text-gray-400 text-xs">{user.email}</div>
                </div>
              )}
            </div>
          </div>
        </nav>
      </div>

      {/* ========== CONTENU PRINCIPAL ========== */}
      {/* Marge gauche ajustée selon l'état de la sidebar */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${
        collapsed ? 'ml-20' : 'ml-64'
      }`}>
        
        {/* ESPACE POUR LE HEADER FIXE (du Layout global) */}
        <div className="h-16"></div>

        {/* ========== BARRE DE TITRE STICKY ========== */}
        {/* Reste en haut lors du défilement */}
        <div className="sticky top-16 z-20 bg-white/90 backdrop-blur-sm border-b shadow-sm">
          <div className="px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                {/* Titre dynamique selon la page active */}
                <h1 className="text-2xl font-bold text-gray-800">
                  {activePage === 'stats' && 'Statistiques Achats'}
                  {activePage === 'produits' && 'Gestion des Produits'}
                  {activePage === 'categories' && 'Gestion des Catégories'}
                  {activePage === 'stocks' && 'Niveaux de Stock'}
                  {activePage === 'commandes' && 'Commandes Fournisseurs'}
                  {activePage === 'demandes' && "Demandes d'Approvisionnement"}
                  {activePage === 'fournisseurs' && 'Gestion des Fournisseurs'}
                  {activePage === 'receptions' && 'Réceptions de Marchandises'}
                </h1>
                {/* Description dynamique selon la page active */}
                <p className="text-sm text-gray-500 mt-1">
                  {activePage === 'stats' && "Indicateurs de performance achats"}
                  {activePage === 'produits' && "Gérez votre catalogue produits"}
                  {activePage === 'categories' && "Organisez vos produits par catégories"}
                  {activePage === 'stocks' && "Consultez l'état de vos stocks"}
                  {activePage === 'commandes' && "Suivez vos commandes fournisseurs"}
                  {activePage === 'demandes' && "Gérez vos demandes d'approvisionnement"}
                  {activePage === 'fournisseurs' && "Gérez vos fournisseurs"}
                  {activePage === 'receptions' && "Enregistrez les réceptions de marchandises"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ========== CONTENU DE LA PAGE ========== */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto">
          {renderPage}
        </div>

        {/* ========== FOOTER ========== */}
        <Footer />
      </div>
    </div>
  );
};

export default ProcurementDashboard;