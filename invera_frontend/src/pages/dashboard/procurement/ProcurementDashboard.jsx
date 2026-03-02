// ProcurementDashboard.jsx
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  CubeIcon,
  ShoppingCartIcon,
  TruckIcon,
  TagIcon,
  ChartBarIcon,
  DocumentTextIcon,  // Ajouté
  InboxIcon,          // Ajouté
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { useSidebar } from '../../../context/SidebarContext';
import Footer from '../../../components/Footer';

// Composants temporaires
const Produits = () => (
  <div className="bg-white rounded-xl p-6 shadow-sm">
    <h2 className="text-xl font-bold text-gray-800 mb-4">Gestion des Produits</h2>
    <p className="text-gray-600">Page des produits en cours de développement...</p>
  </div>
);

const Commandes = () => (
  <div className="bg-white rounded-xl p-6 shadow-sm">
    <h2 className="text-xl font-bold text-gray-800 mb-4">Commandes Fournisseurs</h2>
    <p className="text-gray-600">Page des commandes en cours de développement...</p>
  </div>
);

const Fournisseurs = () => (
  <div className="bg-white rounded-xl p-6 shadow-sm">
    <h2 className="text-xl font-bold text-gray-800 mb-4">Gestion des Fournisseurs</h2>
    <p className="text-gray-600">Page des fournisseurs en cours de développement...</p>
  </div>
);

const Statistiques = () => (
  <div className="bg-white rounded-xl p-6 shadow-sm">
    <h2 className="text-xl font-bold text-gray-800 mb-4">Statistiques Achats</h2>
    <p className="text-gray-600">Page des statistiques en cours de développement...</p>
  </div>
);

const Categories = () => (
  <div className="bg-white rounded-xl p-6 shadow-sm">
    <h2 className="text-xl font-bold text-gray-800 mb-4">Catégories des Produits</h2>
    <p className="text-gray-600">Page des catégories en cours de développement...</p>
  </div>
);

const Demandes = () => (
  <div className="bg-white rounded-xl p-6 shadow-sm">
    <h2 className="text-xl font-bold text-gray-800 mb-4">Demandes d'Approvisionnement</h2>
    <p className="text-gray-600">Page des demandes en cours de développement...</p>
  </div>
);

const Receptions = () => (
  <div className="bg-white rounded-xl p-6 shadow-sm">
    <h2 className="text-xl font-bold text-gray-800 mb-4">Réceptions de Marchandises</h2>
    <p className="text-gray-600">Page des réceptions en cours de développement...</p>
  </div>
);

const Stocks = () => (
  <div className="bg-white rounded-xl p-6 shadow-sm">
    <h2 className="text-xl font-bold text-gray-800 mb-4">Niveaux de Stock</h2>
    <p className="text-gray-600">Page des stocks en cours de développement...</p>
  </div>
);

// Memoization des composants
const MemoizedProduits = React.memo(Produits);
const MemoizedCommandes = React.memo(Commandes);
const MemoizedFournisseurs = React.memo(Fournisseurs);
const MemoizedStatistiques = React.memo(Statistiques);
const MemoizedCategories = React.memo(Categories);
const MemoizedDemandes = React.memo(Demandes);
const MemoizedReceptions = React.memo(Receptions);
const MemoizedStocks = React.memo(Stocks);

const ProcurementDashboard = () => {
  const { getCurrentUser } = useAuth();
  const admin = getCurrentUser();
  const navigate = useNavigate();
  const { collapsed, toggleSidebar } = useSidebar();

  const [activePage, setActivePage] = useState('stats');
  const [user, setUser] = useState({ name: '', role: '', email: '', initials: '' });

  useEffect(() => {
    const userName = admin?.nom || localStorage.getItem('userName') || 'Responsable Achats';
    const userEmail = admin?.email || localStorage.getItem('userEmail') || 'achats@invera.com';
    const userRole = admin?.role || localStorage.getItem('userRole') || 'Responsable Achats';
    const initials = userName
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
    
    setUser({ name: userName, role: userRole, email: userEmail, initials });
  }, [admin]);

  const getFirstName = (fullName) => fullName.split(' ')[0];

  // Sections de navigation
  const sections = [
    {
      title: 'TABLEAU DE BORD',
      items: [
        { id: 'stats', label: 'Statistiques', icon: ChartBarIcon },
      ]
    },
    {
      title: 'GESTION DES PRODUITS',
      items: [
        { id: 'produits', label: 'Catalogue produits', icon: CubeIcon },
       // { id: 'categories', label: 'Catégories', icon: TagIcon },
      ]
    },
  /*  {
      title: 'APPROVISIONNEMENT',
      items: [
        { id: 'commandes', label: 'Commandes fournisseurs', icon: ShoppingCartIcon },
        { id: 'demandes', label: "Demandes d'approvisionnement", icon: DocumentTextIcon },
        { id: 'fournisseurs', label: 'Fournisseurs', icon: TruckIcon },
      ]
    },
    {
      title: 'RÉCEPTION & STOCK',
      items: [
        { id: 'receptions', label: 'Réceptions', icon: InboxIcon },
        { id: 'stocks', label: 'Niveaux de stock', icon: ChartBarIcon },
      ]
    }*/
  ];

  const handleSetActivePage = useCallback((pageId) => {
    setActivePage(pageId);
  }, []);

  const renderPage = useMemo(() => {
    switch (activePage) {
      case 'stats': return <MemoizedStatistiques />;
      case 'produits': return <MemoizedProduits />;
      case 'categories': return <MemoizedCategories />;
      case 'commandes': return <MemoizedCommandes />;
      case 'demandes': return <MemoizedDemandes />;
      case 'fournisseurs': return <MemoizedFournisseurs />;
      case 'receptions': return <MemoizedReceptions />;
      case 'stocks': return <MemoizedStocks />;
      default: return <MemoizedStatistiques />;
    }
  }, [activePage]);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Sidebar */}
      <div className={`fixed top-0 left-0 h-full bg-white border-r shadow-xl transition-all duration-300 z-30 ${
        collapsed ? 'w-20' : 'w-64'
      }`}>
{/* En-tête */}
<div className="p-6 border-b">
  <div className="flex items-center justify-between">
    {!collapsed && ( // 👈 Texte visible seulement quand sidebar ouverte
      <div>
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
          Gestion Achats
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Stocks et commandes
        </p>
      </div>
    )}
    <button
      onClick={toggleSidebar}
      className={`p-2 hover:bg-gray-100 rounded-lg transition-colors ${
        collapsed ? 'mx-auto' : ''
      }`}
    >
      {collapsed ? '→' : '←'}
    </button>
  </div>
</div>

        {/* Navigation  */}
       <nav className="p-4 flex flex-col h-[calc(100vh-120px)]">
  <ul className="space-y-0.5 flex-1 overflow-y-auto">
    {sections.map((section) => (
      <li key={section.title}>
        {!collapsed && (
          <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
            {section.title}
          </h3>
        )}
        <ul className="space-y-0.5">
          {section.items.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;

            return (
              <li key={item.id}>
                <button
                  onClick={() => handleSetActivePage(item.id)}
                  className={`w-full flex items-center ${
                    collapsed ? 'justify-center px-3 py-2.5' : 'px-4 py-2.5'
                  } rounded-lg transition-all duration-200 relative group ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 font-semibold border-l-3 border-blue-500'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  title={collapsed ? item.label : ''}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${
                    isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'
                  }`} />
                  {!collapsed && (
                    <span className="ml-3 flex-1 text-left text-sm">{item.label}</span>
                  )}
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
          {/* Profil utilisateur  */}
          <div className={`border-t pt-4 ${collapsed ? 'px-3' : 'px-4'} mt-auto`}>
            <div className={`flex items-center ${collapsed ? 'justify-center' : 'space-x-3'}`}>
              <div
                className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => navigate('/profile')}
                title="Voir mon profil"
              >
                {user.initials}
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {getFirstName(user.name)}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user.role}</p>
                  <p className="text-xs text-gray-400 truncate">{user.email}</p>
                </div>
              )}
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

      {/* Contenu principal */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${
        collapsed ? 'ml-20' : 'ml-64'
      }`}>
        {/* ESPACE POUR LE HEADER FIXED */}
        <div className="h-16"></div>

        {/* Top Bar locale */}
        <div className="sticky top-16 z-20 bg-white/90 backdrop-blur-sm border-b shadow-sm">
          <div className="px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  {activePage === 'stats' && 'Statistiques Achats'}
                  {activePage === 'produits' && 'Gestion des Produits'}
                  {activePage === 'categories' && 'Gestion des Catégories'}
                 {/*  {activePage === 'commandes' && 'Commandes Fournisseurs'}
                  {activePage === 'demandes' && "Demandes d'Approvisionnement"}
                  {activePage === 'fournisseurs' && 'Gestion des Fournisseurs'}
                  {activePage === 'receptions' && 'Réceptions de Marchandises'}
                  {activePage === 'stocks' && 'Niveaux de Stock'} */}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  {activePage === 'stats' && "Indicateurs de performance achats"}
                  {activePage === 'produits' && "Gérez votre catalogue produits"}
                  {activePage === 'categories' && "Organisez vos produits par catégories"}
                  {/* {activePage === 'commandes' && "Suivez vos commandes fournisseurs"}
                  {activePage === 'demandes' && "Gérez vos demandes d'approvisionnement"}
                  {activePage === 'fournisseurs' && "Gérez vos fournisseurs"}
                  {activePage === 'receptions' && "Enregistrez les réceptions de marchandises"}
                  {activePage === 'stocks' && "Consultez l'état de vos stocks"} */}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contenu de la page */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto">
          {renderPage}
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};

export default ProcurementDashboard;