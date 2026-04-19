import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../services/authService';
import Button from '../components/Button';

const SPECIAL_CHARACTER_REGEX = /(?=.*[!@#$%^&*()_\-+=[\]{};:'",.<>/?\\|`~])/;

const CreatePasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = (searchParams.get('token') || '').trim();

  const [activationInfo, setActivationInfo] = useState(null);
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    let ignore = false;

    const loadActivationLink = async () => {
      if (!token) {
        setErrors({ submit: "Lien d'activation manquant ou invalide." });
        setInitializing(false);
        return;
      }

      try {
        const data = await authService.getActivationLinkInfo(token);
        if (!ignore) {
          setActivationInfo(data);
          setErrors({});
        }
      } catch (error) {
        if (!ignore) {
          setErrors({
            submit:
              error?.response?.data?.message ||
              error?.message ||
              "Ce lien d'activation est invalide ou expiré."
          });
        }
      } finally {
        if (!ignore) {
          setInitializing(false);
        }
      }
    };

    loadActivationLink();

    return () => {
      ignore = true;
    };
  }, [token]);

  const validatePassword = (password) => {
    if (!password) return 'Veuillez saisir un mot de passe.';
    if (password.length < 8) return 'Le mot de passe doit contenir au moins 8 caractères.';
    if (!/(?=.*[A-Z])/.test(password)) return 'Ajoutez au moins une lettre majuscule.';
    if (!/(?=.*\d)/.test(password)) return 'Ajoutez au moins un chiffre.';
    if (!SPECIAL_CHARACTER_REGEX.test(password)) return 'Ajoutez au moins un caractère spécial.';
    return '';
  };

  const clearAuthStorage = () => {
    ['token', 'userRole', 'userName', 'userEmail', 'userDashboard'].forEach((key) => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
  };

  const handleChange = ({ target: { name, value } }) => {
    setFormData((current) => ({
      ...current,
      [name]: value
    }));

    setErrors((current) => {
      if (!current[name] && !current.submit) return current;
      const nextErrors = { ...current };
      delete nextErrors[name];
      delete nextErrors.submit;
      return nextErrors;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = {};
    const passwordError = validatePassword(formData.password);

    if (passwordError) nextErrors.password = passwordError;

    if (!formData.confirmPassword) {
      nextErrors.confirmPassword = 'Veuillez confirmer votre mot de passe.';
    } else if (formData.password !== formData.confirmPassword) {
      nextErrors.confirmPassword = 'Les mots de passe ne correspondent pas.';
    }

    if (!token) {
      nextErrors.submit = "Lien d'activation manquant ou invalide.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      await authService.activateAccount(token, formData.password);
      clearAuthStorage();
      setSuccess(true);

      window.setTimeout(() => {
        navigate('/login', { replace: true });
      }, 1500);
    } catch (error) {
      setErrors({
        submit:
          error?.response?.data?.message ||
          error?.message ||
          "Impossible d'activer le compte avec ce lien."
      });
    } finally {
      setLoading(false);
    }
  };

  const accountLabel = [activationInfo?.prenom, activationInfo?.nom].filter(Boolean).join(' ').trim();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-xl sm:p-10">
        <div className="space-y-3 text-center">
          <h1 className="text-3xl font-extrabold text-gray-900">Activer votre compte</h1>
          <p className="text-sm text-gray-600">
            Ouvrez le lien reçu par email, puis choisissez votre mot de passe pour finaliser l'activation.
          </p>
        </div>

        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
          <p className="font-semibold">Lien d'activation</p>
          <p className="mt-1">
            Le lien envoyé par email est valable 24 heures et ouvre directement cette interface.
          </p>
        </div>

        {initializing ? (
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
            Vérification du lien d'activation...
          </div>
        ) : success ? (
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            <p className="font-semibold">Compte activé avec succès.</p>
            <p className="mt-1">Redirection vers la page de connexion...</p>
          </div>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit}>
            {activationInfo && (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                <p className="font-semibold text-gray-900">
                  {accountLabel || activationInfo.email}
                </p>
                <p className="mt-1">{activationInfo.email}</p>
              </div>
            )}

            <div>
              <label htmlFor="activation-email" className="mb-2 block text-sm font-medium text-gray-700">
                Adresse email
              </label>
              <input
                id="activation-email"
                type="email"
                value={activationInfo?.email || ''}
                disabled
                className="block w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-3 text-sm text-gray-500 shadow-sm outline-none"
                placeholder="vous@entreprise.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-700">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  className={`block w-full rounded-lg border px-3 py-3 pr-20 text-sm shadow-sm outline-none transition-all ${
                    errors.password ? 'border-red-300 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'
                  } focus:border-transparent focus:ring-2`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute inset-y-0 right-0 px-4 text-sm text-gray-500"
                >
                  {showPassword ? 'Masquer' : 'Afficher'}
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                8 caractères minimum, avec une majuscule, un chiffre et un caractère spécial.
              </p>
              {errors.password && <p className="mt-2 text-sm text-red-600">{errors.password}</p>}
            </div>

            <div>
              <label htmlFor="confirm-password" className="mb-2 block text-sm font-medium text-gray-700">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <input
                  id="confirm-password"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={loading}
                  className={`block w-full rounded-lg border px-3 py-3 pr-20 text-sm shadow-sm outline-none transition-all ${
                    errors.confirmPassword
                      ? 'border-red-300 focus:ring-red-200'
                      : 'border-gray-300 focus:ring-blue-200'
                  } focus:border-transparent focus:ring-2`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((current) => !current)}
                  className="absolute inset-y-0 right-0 px-4 text-sm text-gray-500"
                >
                  {showConfirmPassword ? 'Masquer' : 'Afficher'}
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-2 text-sm text-red-600">{errors.confirmPassword}</p>}
            </div>

            {errors.submit && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {errors.submit}
              </div>
            )}

            <Button type="submit" loading={loading} fullWidth variant="primary" size="lg" disabled={!activationInfo}>
              {loading ? 'Activation...' : 'Activer mon compte'}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-sm font-medium text-blue-600 transition-colors hover:text-blue-500"
              >
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
