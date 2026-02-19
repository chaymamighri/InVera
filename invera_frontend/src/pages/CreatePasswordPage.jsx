import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../services/authService';
import Button from '../components/Button';

const CreatePasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!token || !email) {
      setError("Lien invalide : paramètres manquants. Veuillez vérifier l'email reçu.");
    }
  }, [token, email]);

  const validatePassword = (pwd) => {
    if (pwd.length < 8) return 'Le mot de passe doit contenir au moins 8 caractères.';
    if (!/(?=.*[A-Z])/.test(pwd)) return 'Ajoutez au moins une lettre majuscule (A-Z).';
    if (!/(?=.*\d)/.test(pwd)) return 'Ajoutez au moins un chiffre (0-9).';
    if (!/(?=.*[!@#$%^&*()_\-+=\[\]{};:'",.<>/?\\|`~])/.test(pwd)) {
      return "Ajoutez au moins un caractère spécial مثل: ! @ # $ % ^ & * ( ) - _ +";
    }
    return '';
  };

  const clearAuthStorage = () => {
    ['token', 'userRole', 'userName', 'userEmail', 'userDashboard'].forEach((k) =>
      localStorage.removeItem(k)
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!password || !confirmPassword) {
      setError('Veuillez remplir les deux champs.');
      return;
    }

    const pwdError = validatePassword(password);
    if (pwdError) {
      setError(pwdError);
      return;
    }

    if (password !== confirmPassword) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      await authService.createPassword(token, email, password);

      clearAuthStorage();
      setSuccess(true);

      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 1200);
    } catch (err) {
      const backendMessage = err?.response?.data?.message;
      setError(
        backendMessage ||
          err.message ||
          "Une erreur est survenue. Veuillez réessayer ou demander un nouveau lien."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!token || !email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="text-center">
            <div className="text-red-600 mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Lien invalide</h2>
            <p className="text-gray-600 mb-6">
              Le lien utilisé est incomplet ou invalide. Veuillez vérifier l'email reçu.
            </p>
            <button onClick={() => navigate('/login')} className="text-blue-600 hover:text-blue-500">
              Retour à la connexion
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Définir votre mot de passe
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Pour activer votre compte, choisissez un mot de passe sécurisé.
          </p>
          <p className="mt-1 text-center text-xs text-gray-500">
            Compte : {email}
          </p>
        </div>

        {success ? (
          <div className="rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">✅</div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  Mot de passe créé avec succès !
                </p>
                <p className="text-sm text-green-700 mt-1">
                  Redirection vers la page de connexion...
                </p>
              </div>
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Nouveau mot de passe
                </label>
                <div className="mt-1 relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm"
                  >
                    {showPassword ? 'Masquer' : 'Afficher'}
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Caractères spéciaux (exemples) : <b>! @ # $ % ^ & * ( ) - _ +</b>
                </p>
              </div>

              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                  Confirmer le mot de passe
                </label>
                <div className="mt-1 relative">
                  <input
                    id="confirm-password"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm"
                  >
                    {showConfirmPassword ? 'Masquer' : 'Afficher'}
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm font-medium text-red-800">⚠️ {error}</p>
              </div>
            )}

            <div>
              <Button type="submit" loading={loading} fullWidth variant="primary" size="lg">
                {loading ? 'Création...' : 'Valider'}
              </Button>
            </div>

            <div className="text-center">
              <button type="button" onClick={() => navigate('/login')} className="text-sm text-blue-600 hover:text-blue-500">
                Retour à la connexion
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CreatePasswordPage;
