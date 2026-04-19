/**
 * LoginPage - Page de connexion
 * 
 * DESCRIPTION :
 * Page d'accueil de l'application avec :
 * - Présentation du produit (colonne gauche)
 * - Formulaire de connexion (colonne droite)
 * - Gestion des erreurs d'essai expiré
 * 
 * REDIRECTIONS :
 * - ADMIN → /dashboard/admin
 * - COMMERCIAL → /dashboard/sales/dashboard  
 * - RESPONSABLE_ACHAT → /dashboard/procurement
 * - SUPER_ADMIN → /super-admin/dashboard
 * 
 * SOUS-COMPOSANTS :
 * - LoginForm (formulaire d'authentification)
 * 
 * GESTION DES ERREURS :
 * - Erreurs API (email/mot de passe incorrect)
 * - Erreurs interceptor (sessionStorage)
 * - Période d'essai expirée
 */

import React, { useState, useEffect } from 'react';
import LoginForm from '../../components/LoginForm';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/images/logo.png';

const LoginPage = () => {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [loginError, setLoginError] = useState(null);
  const [essaiExpire, setEssaiExpire] = useState(false);
  const [connexionsRestantes, setConnexionsRestantes] = useState(null);

  // Récupère les erreurs de l'interceptor et les infos d'essai
  useEffect(() => {
    const msg = sessionStorage.getItem('authError');
    if (msg) {
      setLoginError(msg);
      sessionStorage.removeItem('authError');
    }
    
    // ✅ Vérifier si la période d'essai est expirée
    const essaiMessage = sessionStorage.getItem('essaiExpire');
    if (essaiMessage) {
      setEssaiExpire(true);
      sessionStorage.removeItem('essaiExpire');
    }
    
    // ✅ Récupérer le nombre de connexions restantes
    const connexionsRest = sessionStorage.getItem('connexionsRestantes');
    if (connexionsRest !== null) {
      setConnexionsRestantes(parseInt(connexionsRest));
      sessionStorage.removeItem('connexionsRestantes');
    }
  }, []);

  // Connexion + redirection
  const handleSubmit = async (credentials) => {
    setLoginError(null);
    setEssaiExpire(false);

    try {
      const result = await login(credentials);

      if (result?.success) {
        const userRole = localStorage.getItem('userRole');

        let dashboardPath = '/dashboard';
        if (userRole === 'SUPER_ADMIN') dashboardPath = '/super-admin/dashboard';
        else if (userRole === 'ADMIN') dashboardPath = '/dashboard/admin';
        else if (userRole === 'COMMERCIAL') dashboardPath = '/dashboard/sales/dashboard';
        else if (userRole === 'RESPONSABLE_ACHAT') dashboardPath = '/dashboard/procurement';

        navigate(dashboardPath, { replace: true });
      }
    } catch (err) {
      const backendMessage = err?.response?.data?.message;
      const errorCode = err?.response?.data?.error;
      
      // ✅ Gestion spécifique pour essai expiré
      if (errorCode === 'ESSAI_EXPIRE' || backendMessage?.includes('période d\'essai')) {
        setEssaiExpire(true);
        setLoginError(
          "🔒 Votre période d'essai a expiré. Veuillez souscrire un abonnement pour continuer à utiliser la plateforme."
        );
      } else {
        setLoginError(
          backendMessage ||
            err.message ||
            "Impossible de se connecter. Vérifiez votre email et mot de passe."
        );
      }
    }
  };

  const getSavedEmail = () => localStorage.getItem('savedEmail') || '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex flex-col md:flex-row">
      <div className="md:w-1/2 bg-gradient-to-br from-blue-900 to-blue-900 text-white p-6 md:p-12 flex flex-col">
        <div className="max-w-lg mx-auto flex-1 flex flex-col">
          <div className="mb-8">
            <div className="flex flex-col items-center">
              <div className="w-full max-w-md flex items-center justify-center mb-6">
                <img
                  src={logo}
                  alt="InVera ERP Logo"
                  className="w-40 md:w-48 h-auto"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    const parent = e.target.parentNode;
                    parent.innerHTML = `
                      <div class="flex flex-col items-center justify-center">
                        <div class="text-5xl md:text-6xl font-bold text-white mb-2">InVera</div>
                        <div class="text-blue-200 text-lg">ERP Cloud Intelligent</div>
                      </div>
                    `;
                  }}
                />
              </div>
              <div className="text-center">
                <p className="text-blue-200 text-xl font-medium">ERP Cloud Intelligent</p>
              </div>
            </div>
          </div>
          
          {/* Titre principal */}
          <div className="mb-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-center leading-tight">
              Connectez-vous à votre espace de gestion
            </h2>
            <p className="text-blue-200 text-center text-lg">
              Accédez aux modules ventes, achats, stocks et facturation
            </p>
          </div>
          
          {/* Points clés */}
          <div className="space-y-4 mb-8 md:mb-12">
            {[
              { 
                title: 'Ventes & Facturation électronique', 
                desc: 'Gérez vos ventes et générez facilement des factures électroniques conformes',
                icon: '🧾'
              },
              { 
                title: 'Gestion de stock intelligente', 
                desc: 'Contrôlez vos niveaux de stock et évitez les ruptures',
                icon: '📦'
              },
              { 
                title: 'Achats fournisseurs simplifiés', 
                desc: 'Créez facilement vos commandes fournisseurs et gérez vos approvisionnements',
                icon: '🚚'
              },
              { 
                title: 'Analytique avancée & Assistant intelligent', 
                desc: 'Analysez vos ventes et votre stock grâce à des tableaux de bord intelligents',
                icon: '📊'
              },
            ].map((feature, index) => (
              <div key={index} className="flex items-start space-x-4 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all duration-300 backdrop-blur-sm border border-white/10">
                <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-green-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md text-lg">
                  {feature.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">{feature.title}</h3>
                  <p className="text-blue-200/80 text-sm">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-auto pt-6 border-t border-white/10">
            <div className="text-center text-blue-300/80 text-sm">
              <p className="mb-2">© {new Date().getFullYear()} InVera ERP. Tous droits réservés.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="md:w-1/2 flex flex-col">
        <div className="flex-1 flex items-center justify-center p-6 md:p-12">
          <div className="w-full max-w-lg">
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
              
              {/* ✅ BANNER ESSAI EXPIRE - S'IL Y EN A UN */}
              {essaiExpire && !loading && (
                <div className="mb-6 bg-orange-50 border-l-4 border-orange-500 rounded-lg p-4 animate-pulse">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <span className="text-2xl">⚠️</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-orange-800 text-lg mb-1">
                        Période d'essai terminée
                      </h3>
                      <p className="text-orange-700 text-sm mb-3">
                        Votre période d'essai gratuite est expirée. Pour continuer à utiliser 
                        InVera ERP, veuillez souscrire à l'un de nos abonnements.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3 mt-2">
                        <button 
                          onClick={() => window.location.href = '/abonnement'}
                          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          💳 Voir les offres d'abonnement
                        </button>
                        <button 
                          onClick={() => window.location.href = '/contact-commercial'}
                          className="border border-orange-500 text-orange-600 hover:bg-orange-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          📞 Contacter un commercial
                        </button>
                      </div>
                    </div>
                    <button 
                      onClick={() => setEssaiExpire(false)}
                      className="text-orange-400 hover:text-orange-600"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}

              {/* ✅ BANNER ALERTE CONNEXIONS RESTANTES */}
              {connexionsRestantes !== null && connexionsRestantes <= 5 && connexionsRestantes > 0 && !loading && (
                <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-500 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <span className="text-xl">⚠️</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-yellow-800">
                        Attention : Période d'essai bientôt terminée
                      </h3>
                      <p className="text-yellow-700 text-sm">
                        Il vous reste <span className="font-bold text-yellow-800">{connexionsRestantes}</span> connexion{connexionsRestantes > 1 ? 's' : ''} 
                        {' '}avant la fin de votre période d'essai.
                        {connexionsRestantes === 1 && " Après cette connexion, vous n'aurez plus accès à la plateforme."}
                      </p>
                      {connexionsRestantes <= 3 && (
                        <p className="text-yellow-600 text-xs mt-2">
                          💡 Pensez à souscrire un abonnement pour ne pas interrompre votre activité.
                        </p>
                      )}
                    </div>
                    <button 
                      onClick={() => setConnexionsRestantes(null)}
                      className="text-yellow-400 hover:text-yellow-600"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}
              
              <LoginForm onSubmit={handleSubmit} loading={loading} savedEmail={getSavedEmail()} />

              {loginError && !loading && !essaiExpire && (
                <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  <div className="flex items-start gap-2">
                    <span>⚠️</span>
                    <span>{loginError}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="hidden md:block p-8">
          <div className="max-w-md mx-auto">
            <p className="text-center text-gray-500 text-sm mb-2">
              © {new Date().getFullYear()} InVera ERP. Tous droits réservés.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;