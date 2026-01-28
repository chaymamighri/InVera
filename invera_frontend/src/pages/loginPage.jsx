import React from 'react';
import LoginForm from '../components/LoginForm';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (credentials) => {
    const result = await login(credentials);
    if (result.success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <LoginForm onSubmit={handleSubmit} />
      
      {/* Section marketing simple */}
      <div className="hidden lg:block ml-12 max-w-md">
        <div className="bg-gradient-to-br from-blue-900 to-blue-800 text-white p-8 rounded-2xl">
          <h2 className="text-2xl font-bold mb-4">InVera ERP Cloud</h2>
          <ul className="space-y-3">
            <li className="flex items-center">
              <span className="mr-2">✓</span>
              Gestion complète de l'entreprise
            </li>
            <li className="flex items-center">
              <span className="mr-2">✓</span>
              Données en temps réel
            </li>
            <li className="flex items-center">
              <span className="mr-2">✓</span>
              Sécurité de niveau entreprise
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;