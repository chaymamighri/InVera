import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  Shield,
} from 'lucide-react';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import { useLanguage } from '../../context/LanguageContext';
import { superAdminService } from '../../servicesPlatform/superAdminService';
import { getStoredLanguage, updateLanguagePreference } from '../../services/languagePreferenceService';
import logoInvera from '../../assets/images/logo.png';

const AdminLogin = () => {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [obscurePassword, setObscurePassword] = useState(true);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const validateEmail = (value) => {
    const trimmed = (value || '').trim();
    if (!trimmed) return t('adminLogin.emailRequired');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return t('adminLogin.invalidEmail');
    return null;
  };

  const validatePassword = (value) => {
    if (!value) return t('adminLogin.passwordRequired');
    if (value.length < 6) return t('adminLogin.passwordMin');
    return null;
  };

  const validateField = (field, value) => {
    if (field === 'email') return validateEmail(value);
    if (field === 'password') return validatePassword(value);
    return null;
  };

  const handleChange = (field, value) => {
    if (field === 'email') setEmail(value);
    if (field === 'password') setPassword(value);
    if (touched[field]) {
      setErrors((prev) => ({ ...prev, [field]: validateField(field, value) }));
    }
    if (errorMessage) setErrorMessage('');
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const val = field === 'email' ? email : password;
    setErrors((prev) => ({ ...prev, [field]: validateField(field, val) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    setErrors({ email: emailError, password: passwordError });
    setTouched({ email: true, password: true });

    if (emailError || passwordError) return;

    setLoading(true);
    setErrorMessage('');

    try {
      const response = await superAdminService.login(email, password);

      if (!response || !response.token) {
        throw new Error(t('adminLogin.sessionExpired'));
      }

      localStorage.clear();
      localStorage.setItem('token', response.token);
      localStorage.setItem('adminToken', response.token);
      localStorage.setItem('userRole', 'SUPER_ADMIN');
      localStorage.setItem('userName', response.nom);
      localStorage.setItem('userEmail', response.email);
      localStorage.setItem(
        'adminInfo',
        JSON.stringify({
          id: response.id,
          nom: response.nom,
          email: response.email,
          role: 'SUPER_ADMIN',
        })
      );
      localStorage.setItem(
        'superAdminInfo',
        JSON.stringify({
          id: response.id,
          nom: response.nom,
          email: response.email,
          role: 'SUPER_ADMIN',
        })
      );

      toast.success(t('adminLogin.welcome', { name: response.nom }));

      try {
        await updateLanguagePreference(getStoredLanguage());
      } catch (languageError) {
        console.error('Language sync failed after super admin login', languageError);
      }

      navigate('/super-admin/dashboard', { replace: true });
    } catch (error) {
      const errorMsg =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        t('adminLogin.incorrectCredentials');

      setErrorMessage(errorMsg);
      toast.error(t('adminLogin.loginImpossible'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-[500px]">
        <div className="overflow-hidden rounded-2xl border border-blue-100/50 bg-white shadow-xl">
          <div className="border-b border-gray-100 bg-white px-8 pb-4 pt-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-blue-400/50 bg-blue-500/20 shadow-sm backdrop-blur-sm">
                  <img
                    src={logoInvera}
                    alt="InVera Logo"
                    className="h-7 w-7 object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-800">{t('common.appName')}</h1>
                  <p className="text-[10px] text-gray-400">{t('adminLogin.platformLabel')}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-full border border-purple-400/50 bg-purple-500/20 px-3 py-1.5 shadow-sm backdrop-blur-sm">
                <Shield className="h-3.5 w-3.5 text-purple-600" />
                <span className="text-[10px] font-medium tracking-wide text-purple-700">
                  {t('adminLogin.superAdmin')}
                </span>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <LanguageSwitcher menuClassName="z-[100]" variant="light" />
            </div>
          </div>

          <div className="px-8 py-8">
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold text-gray-800">{t('adminLogin.title')}</h1>
              <p className="mt-1 text-[13px] text-gray-500">{t('adminLogin.subtitle')}</p>
            </div>

            {errorMessage && (
              <div className="mb-6 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
                <div className="flex-1">
                  <p className="text-[13px] font-semibold text-red-700">{t('adminLogin.loginImpossible')}</p>
                  <p className="mt-0.5 text-[12px] text-red-600">{errorMessage}</p>
                </div>
                <button
                  onClick={() => setErrorMessage('')}
                  className="text-red-400 transition-colors hover:text-red-600"
                >
                  ×
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <div className="mb-5">
                <label className="mb-2 block text-[12px] font-semibold uppercase tracking-wide text-gray-500">
                  {t('adminLogin.email')}
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    onBlur={() => handleBlur('email')}
                    placeholder="admin@invera.com"
                    disabled={loading}
                    className={`w-full rounded-lg border bg-gray-50 py-3 pl-9 pr-3 text-[15px] placeholder:text-gray-300 transition-all focus:border-purple-400 focus:bg-white focus:outline-none disabled:opacity-50 ${
                      touched.email && errors.email
                        ? 'border-red-300 bg-red-50/30 focus:border-red-400'
                        : 'border-gray-200'
                    }`}
                  />
                </div>
                {touched.email && errors.email && (
                  <p className="ml-0.5 mt-2 flex items-center gap-1 text-[12px] text-red-500">
                    <AlertCircle className="h-3 w-3" />
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="mb-7">
                <label className="mb-2 block text-[12px] font-semibold uppercase tracking-wide text-gray-500">
                  {t('adminLogin.password')}
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type={obscurePassword ? 'password' : 'text'}
                    value={password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    onBlur={() => handleBlur('password')}
                    placeholder="••••••••"
                    disabled={loading}
                    className={`w-full rounded-lg border bg-gray-50 py-3 pl-9 pr-10 text-[15px] placeholder:text-gray-300 transition-all focus:border-purple-400 focus:bg-white focus:outline-none disabled:opacity-50 ${
                      touched.password && errors.password
                        ? 'border-red-300 bg-red-50/30 focus:border-red-400'
                        : 'border-gray-200'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setObscurePassword(!obscurePassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
                    tabIndex={-1}
                  >
                    {obscurePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {touched.password && errors.password && (
                  <p className="ml-0.5 mt-2 flex items-center gap-1 text-[12px] text-red-500">
                    <AlertCircle className="h-3 w-3" />
                    {errors.password}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 py-3 text-[15px] font-medium text-white shadow-md transition-all duration-200 hover:from-purple-700 hover:to-indigo-700 hover:shadow-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.25" />
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    {t('adminLogin.connecting')}
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4" />
                    {t('adminLogin.connect')}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        <p className="mt-5 text-center text-[11px] text-gray-400">
          © {new Date().getFullYear()} {t('common.appName')} — {t('common.allRightsReserved')}
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
