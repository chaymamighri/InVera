import React, { useState, useEffect } from 'react';
import LoginForm from '../../components/LoginForm';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/images/logo.png';

const LoginPage = () => {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [loginError, setLoginError] = useState(null);

  useEffect(() => {
    // ✅ show message from interceptor
    const msg = sessionStorage.getItem('authError');
    if (msg) {
      setLoginError(msg);
      sessionStorage.removeItem('authError');
    }
  }, []);

  const handleSubmit = async (credentials) => {
    setLoginError(null);

    try {
      const result = await login(credentials);

      if (result?.success) {
        const userRole = localStorage.getItem('userRole');

        let dashboardPath = '/dashboard';
        if (userRole === 'ADMIN') dashboardPath = '/dashboard/admin';
        else if (userRole === 'COMMERCIAL') dashboardPath = '/dashboard/sales/dashboard';
        else if (userRole === 'RESPONSABLE_ACHAT') dashboardPath = '/dashboard/procurement';

        navigate(dashboardPath, { replace: true });
      }
    } catch (err) {
      const backendMessage = err?.response?.data?.message;
      setLoginError(
        backendMessage ||
          err.message ||
          "Impossible de se connecter. Vérifiez votre email et mot de passe."
      );
    }
  };

  const getSavedEmail = () => localStorage.getItem('savedEmail') || '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex flex-col md:flex-row">
      <div className="md:w-1/2 bg-gradient-to-br from-blue-900 to-blue-800 text-white p-6 md:p-12 flex flex-col">
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
                title: 'Gestion financière en temps réel', 
                desc: 'Suivez vos finances avec précision',
                icon: '💰'
              },
              { 
                title: 'Analytique avancée', 
                desc: 'Tableaux de bord prédictifs',
                icon: '📊'
              },
              { 
                title: 'Sécurité maximale', 
                desc: 'Données chiffrées, authentification MFA',
                icon: '🔒'
              },
              { 
                title: 'Mobile & Accessible', 
                desc: 'Accès 24/7 depuis n\'importe quel appareil',
                icon: '📱'
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
              <LoginForm onSubmit={handleSubmit} loading={loading} savedEmail={getSavedEmail()} />

              {loginError && !loading && (
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
