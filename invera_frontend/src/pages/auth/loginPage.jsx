import React, { useState } from 'react';
import LoginForm from '../../components/LoginForm';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/images/logo6.png';

const LoginPage = () => {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState('admin');

  const handleSubmit = async (credentials) => {
    // Sauvegarder le rôle dans localStorage pour la démo
    localStorage.setItem('userRole', selectedRole);
    localStorage.setItem('userName', 
      selectedRole === 'admin' ? 'Alexandre Martin' :
      selectedRole === 'sales' ? 'Marie Dubois' : 
      selectedRole === 'procurement' ? 'Jean Leroy' : 'Utilisateur'
    );
    
    const result = await login(credentials);
    if (result && result.success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex flex-col md:flex-row">
      {/* Section gauche - Branding et marketing */}
      <div className="md:w-1/2 bg-gradient-to-br from-blue-900 to-blue-800 text-white p-6 md:p-12 flex flex-col">
        <div className="max-w-lg mx-auto flex-1 flex flex-col">
          
          {/* Logo - Version agrandie avec effet shadow */}
          {/* Logo - Version agrandie sans shadow */}
<div className="mb-12">
  <div className="flex justify-center mb-8">
    <div className="w-full max-w-sm flex items-center justify-center">
      {/* Conteneur simple sans effet shadow */}
      <div className="relative p-2 bg-white/5 rounded-2xl">
        <img 
          src={logo} 
          alt="InVera ERP Logo" 
          className="w-full h-auto max-h-40 object-contain"
          onError={(e) => {
            // Fallback si l'image ne se charge pas
            console.error('Erreur de chargement du logo');
            e.target.style.display = 'none';
            const parent = e.target.parentNode;
            parent.innerHTML = `
              <div class="flex flex-col items-center justify-center p-6">
                <div class="h-32 w-32 bg-gradient-to-r from-blue-500 to-green-400 rounded-2xl flex items-center justify-center">
                  <span class="text-white font-bold text-4xl">IV</span>
                </div>
              </div>
            `;
          }}
        />
      </div>
    </div>
     </div>

            <div className="text-center mt-8">
              <p className="text-blue-200 text-xl font-medium tracking-wide drop-shadow-md">ERP Cloud Intelligent</p>
            </div>
          </div>

          {/* Titre principal */}
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center drop-shadow-md">
            Connectez-vous pour accéder à la gestion des ventes, achats, stocks et facturation via <span className="text-green-400 drop-shadow-lg">InVera</span>
          </h2>
          
          {/* Points clés */}
          <div className="space-y-5 mb-12">
            {[
              { 
                title: 'Gestion financière en temps réel', 
                desc: 'Suivez vos finances avec précision' 
              },
              { 
                title: 'Analytique avancée', 
                desc: 'Tableaux de bord prédictifs' 
              },
              { 
                title: 'Sécurité maximale', 
                desc: 'Données chiffrées, authentification multi-facteurs' 
              },
              { 
                title: 'Mobile & Accessible', 
                desc: 'Accès 24/7 depuis n\'importe quel appareil' 
              },
            ].map((feature, index) => (
              <div key={index} className="flex items-start space-x-4 p-4 bg-blue-800/30 rounded-xl hover:bg-blue-800/50 transition-all duration-200">
                <div className="h-7 w-7 bg-gradient-to-r from-blue-600 to-green-500 rounded-lg flex items-center justify-center mt-0.5 flex-shrink-0 shadow-md">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">{feature.title}</h3>
                  <p className="text-blue-200 text-sm">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
          

          {/* Copyright pour la section gauche (version mobile visible) */}
          <div className="mt-auto pt-8 border-t border-blue-700/30">
            <p className="text-center text-blue-300 text-sm">
              © {new Date().getFullYear()} InVera ERP. Tous droits réservés.
            </p>
          </div>
        </div>
      </div>

      {/* Section droite - Formulaire et footer */}
      <div className="md:w-1/2 flex flex-col">
        {/* Formulaire de connexion */}
        <div className="flex-1 flex items-start justify-center p-6 md:p-12 pt-8 md:pt-12">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 border border-gray-100">
              {/* Sélecteur de rôle caché (pour la logique interne) */}
              <div className="hidden">
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                >
                  <option value="admin">Administrateur</option>
                  <option value="sales">Responsable Ventes</option>
                  <option value="procurement">Responsable Achats</option>
                </select>
              </div>

              {/* Formulaire de connexion */}
              <LoginForm onSubmit={handleSubmit} loading={loading} />
            </div>
          </div>
        </div>

        {/* Footer avec copyright et liens - Visible sur desktop, caché sur mobile */}
        <div className="hidden md:block p-8">
          <div className="max-w-md mx-auto">
            <p className="text-center text-gray-500 text-sm">
              © {new Date().getFullYear()} InVera ERP. Tous droits réservés.
            </p>
            <div className="mt-2 flex justify-center space-x-4 text-xs text-gray-400">
              <a href="#" className="hover:text-gray-600 transition-colors">
                Politique de confidentialité
              </a>
              <span>•</span>
              <a href="#" className="hover:text-gray-600 transition-colors">
                Conditions d'utilisation
              </a>
              <span>•</span>
              <a href="mailto:support@invera-erp.com" className="hover:text-gray-600 transition-colors">
                Support
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;