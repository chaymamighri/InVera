// src/pages/dashboard/sales/SalesPage.jsx
import React, { useState, useEffect } from 'react';
import {
  ShoppingCartIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

import SalesFilters from './components/SalesFilter';
import SalesTable from './components/SalesTable'; 
import CreateSalesModal from './components/CreateSalesModal';
import InvoiceModal from './components/InvoiceModal'; 

const SalesPage = () => {
  const [commandes, setCommandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    searchTerm: '',
    dateRange: { from: '', to: '' },
    sortBy: 'date_creation',
    sortOrder: 'desc'
  });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false); // <-- État pour le modal de facture
  const [selectedFacture, setSelectedFacture] = useState(null); // <-- État pour la facture

 // Données de démo 
const demoCommandes = [
  {
    id: 1,
    numeroCommande: 'CMD-2024-015',
    dateCreation: '2024-01-15T09:30:00',
    dateValidation: '2024-01-15T10:15:00',
    dateLivraisonPrevue: '2024-01-18',
    statut: 'validée',
    montantTotal: 6537.50,
    sousTotal: 7250,
    remiseTotal: 712.5,
    modeLivraison: 'Express',
    modePaiement: 'Virement bancaire',
    notes: 'Livraison à l\'adresse du siège social',
    
    produits: [
      {
        id: 101,
        reference: 'DLL-XPS13-256',
        nom: 'Ordinateur Portable Dell XPS 13',
        description: 'Intel Core i7, 16GB RAM, 512GB SSD',
        prixUnitaire: 3500.00,
        quantite: 2,
        remisePourcentage: 10,
        remiseMontant: 700.00,
        stockDisponible: 15,
        categorie: 'Informatique'
      },
      {
        id: 205,
        reference: 'LOG-MX3S',
        nom: 'Souris Sans Fil Logitech MX Master 3S',
        description: 'Souris ergonomique sans fil',
        prixUnitaire: 250.00,
        quantite: 1,
        remisePourcentage: 5,
        remiseMontant: 12.50,
        stockDisponible: 45,
        categorie: 'Accessoires'
      }
    ],
    
    client: {
      id: 1501,
      nomComplet: 'Mohamed Ali',
      entreprise: 'Tech Solutions SARL',
      type: 'Entreprise',
      telephone: '+216 71 123 456',
      email: 'mohamed.ali@techsolutions.tn',
      adresse: '15 Avenue Habib Bourguiba, 1002 Tunis'
    }
  },
  {
    id: 2,
    numeroCommande: 'CMD-2024-016',
    dateCreation: '2024-01-14T14:20:00',
    dateValidation: '2024-01-14T15:45:00',
    dateLivraisonPrevue: '2024-01-17',
    statut: 'validée',
    montantTotal: 4200.00,
    sousTotal: 4200,
    remiseTotal: 0,
    modeLivraison: 'Standard',
    modePaiement: 'Carte bancaire',
    notes: 'Client VIP - Priorité',
    
    produits: [
      {
        id: 302,
        reference: 'APL-MBP14-512',
        nom: 'MacBook Pro 14"',
        description: 'Apple M3 Pro, 18GB RAM, 512GB SSD',
        prixUnitaire: 4200.00,
        quantite: 1,
        remisePourcentage: 0,
        remiseMontant: 0,
        stockDisponible: 8,
        categorie: 'Informatique'
      }
    ],
    
    client: {
      id: 1502,
      nomComplet: 'Sarah Ben Ahmed',
      entreprise: 'Digital Agency',
      type: 'VIP',
      telephone: '+216 98 765 432',
      email: 'sarah.benahmed@digital-agency.tn',
      adresse: '25 Rue de la République, 2000 Sousse'
    }
  },
  {
    id: 3,
    numeroCommande: 'CMD-2024-017',
    dateCreation: '2024-01-13T11:10:00',
    dateValidation: '2024-01-13T12:30:00',
    dateLivraisonPrevue: '2024-01-16',
    statut: 'validée',
    montantTotal: 2850.00,
    sousTotal: 3000,
    remiseTotal: 150,
    modeLivraison: 'Express',
    modePaiement: 'Espèces',
    notes: 'Commande urgente',
    
    produits: [
      {
        id: 401,
        reference: 'SNY-WH1000XM5',
        nom: 'Casque Sony WH-1000XM5',
        description: 'Réduction de bruit active',
        prixUnitaire: 850.00,
        quantite: 2,
        remisePourcentage: 5,
        remiseMontant: 85.00,
        stockDisponible: 25,
        categorie: 'Audio'
      },
      {
        id: 501,
        reference: 'APL-AW-S8',
        nom: 'Apple Watch Series 8',
        description: 'GPS, 45mm, Midnight',
        prixUnitaire: 1300.00,
        quantite: 1,
        remisePourcentage: 5,
        remiseMontant: 65.00,
        stockDisponible: 12,
        categorie: 'Montres connectées'
      }
    ],
    
    client: {
      id: 1503,
      nomComplet: 'Karim Trabelsi',
      entreprise: 'Freelance',
      type: 'Professionnel',
      telephone: '+216 52 123 789',
      email: 'karim.trabelsi@example.com',
      adresse: '10 Rue Ibn Khaldoun, 3000 Sfax'
    }
  },
  {
    id: 4,
    numeroCommande: 'CMD-2024-018',
    dateCreation: '2024-01-12T16:45:00',
    dateValidation: '2024-01-12T17:20:00',
    dateLivraisonPrevue: '2024-01-15',
    statut: 'validée',
    montantTotal: 890.00,
    sousTotal: 950,
    remiseTotal: 60,
    modeLivraison: 'Standard',
    modePaiement: 'Chèque',
    notes: '',
    
    produits: [
      {
        id: 601,
        reference: 'STM-WS-01',
        nom: 'Webcam Streamer Pro 4K',
        description: 'Webcam 4K avec micro intégré',
        prixUnitaire: 320.00,
        quantite: 1,
        remisePourcentage: 5,
        remiseMontant: 16.00,
        stockDisponible: 30,
        categorie: 'Vidéo'
      },
      {
        id: 702,
        reference: 'TPL-AC1750',
        nom: 'Routeur TP-Link AC1750',
        description: 'Routeur Wi-Fi dual-band',
        prixUnitaire: 450.00,
        quantite: 1,
        remisePourcentage: 10,
        remiseMontant: 45.00,
        stockDisponible: 22,
        categorie: 'Réseau'
      },
      {
        id: 803,
        reference: 'SMS-CABLE-HDMI',
        nom: 'Cable HDMI 2.1 3m',
        description: 'Cable HDMI haute vitesse',
        prixUnitaire: 60.00,
        quantite: 3,
        remisePourcentage: 0,
        remiseMontant: 0,
        stockDisponible: 150,
        categorie: 'Câbles'
      }
    ],
    
    client: {
      id: 1504,
      nomComplet: 'Fatma Zaied',
      entreprise: 'École Primaire Les Pins',
      type: 'Éducation',
      telephone: '+216 73 456 123',
      email: 'fatma.zaied@ecolepins.tn',
      adresse: '45 Rue des Jasmins, 4000 Nabeul'
    }
  },
  
  {
    id: 6,
    numeroCommande: 'CMD-2024-020',
    dateCreation: '2024-01-10T13:30:00',
    dateValidation: '2024-01-10T14:15:00',
    dateLivraisonPrevue: '2024-01-13',
    statut: 'validée',
    montantTotal: 1740.00,
    sousTotal: 1800,
    remiseTotal: 60,
    modeLivraison: 'Standard',
    modePaiement: 'Carte bancaire',
    notes: 'Client fidèle - Remise spéciale',
    
    produits: [
      {
        id: 1001,
        reference: 'TBL-SMS-T8',
        nom: 'Tablette Samsung Galaxy Tab S8',
        description: '11", 256GB, 8GB RAM, S-Pen inclus',
        prixUnitaire: 1200.00,
        quantite: 1,
        remisePourcentage: 5,
        remiseMontant: 60.00,
        stockDisponible: 18,
        categorie: 'Tablettes'
      },
      {
        id: 1102,
        reference: 'CAS-SMS-BUDS2',
        nom: 'Samsung Galaxy Buds 2 Pro',
        description: 'Écouteurs sans fil avec ANC',
        prixUnitaire: 300.00,
        quantite: 2,
        remisePourcentage: 0,
        remiseMontant: 0,
        stockDisponible: 40,
        categorie: 'Audio'
      }
    ],
    
    client: {
      id: 1506,
      nomComplet: 'Leila Ben Mansour',
      entreprise: '',
      type: 'Fidèle',
      telephone: '+216 58 321 654',
      email: 'leila.benmansour@gmail.com',
      adresse: '8 Rue de la Paix, 3000 Sfax'
    }
  }
];


  useEffect(() => {
    setTimeout(() => {
      setCommandes(demoCommandes);
      setLoading(false);
    }, 1000);
  }, []);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleCreateSale = (newSale) => {
    const saleWithId = {
      ...newSale,
      id: commandes.length + 1,
      numeroCommande: `CMD-${new Date().getFullYear()}-${String(commandes.length + 1).padStart(3, '0')}`,
      dateCreation: new Date().toISOString(),
      statut: 'validée'
    };
    setCommandes(prev => [saleWithId, ...prev]);
    setIsCreateModalOpen(false);
  };

  const handleGenerateInvoice = (commandeId) => {
    const commande = commandes.find(c => c.id === commandeId);
    if (commande) {
      // Créer la facture à partir de la commande
      const nouvelleFacture = {
        id: Date.now(),
        numeroFacture: `FAC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
        dateFacture: new Date().toISOString().split('T')[0],
        commandeId: commande.id,
        client: commande.client,
        produits: commande.produits,
        sousTotal: commande.sousTotal || 0,
        remiseTotal: commande.remiseTotal || 0,
        tva: ((commande.sousTotal || 0) - (commande.remiseTotal || 0)) * 0.19,
        montantTotal: commande.montantTotal || commande.total || 0,
        statut: 'à payer',
        modePaiement: commande.modePaiement || 'Non spécifié'
      };
      
      // Sauvegarder la facture et ouvrir le modal
      setSelectedFacture(nouvelleFacture);
      setIsInvoiceModalOpen(true);
      
      console.log('Facture générée:', nouvelleFacture);
    }
  };

  // Filtrer uniquement les commandes validées
  const commandesValidees = commandes.filter(cmd => cmd.statut === 'validée');

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
              <ShoppingCartIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Commandes Validées</h1>
              <p className="text-gray-600">Gérez les commandes client prêtes pour facturation</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2.5 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Nouvelle Commande</span>
        </button>
      </div>
         
      {/* Filtres */}
      <SalesFilters filters={filters} onFilterChange={handleFilterChange} />

      {/* Table des commandes */}
      <SalesTable 
        commandes={commandesValidees} 
        loading={loading} 
        onGenerateInvoice={handleGenerateInvoice} // <-- Passez la fonction
      />

      {/* Modal de création */}
      <CreateSalesModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreateSale}
      />

      {/* Modal de facture - Géré uniquement ici */}
      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => {
          setIsInvoiceModalOpen(false);
          setSelectedFacture(null);
        }}
        facture={selectedFacture}
      />
    </div>
  );
};

export default SalesPage;