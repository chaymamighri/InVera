import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../services/authService';
import Button from '../components/Button';
import PublicHeader from '../components/PublicHeader';
import { useLanguage } from '../context/LanguageContext';

const SPECIAL_CHARACTER_REGEX = /(?=.*[!@#$%^&*()_\-+=[\]{};:'",.<>/?\\|`~])/;

const pageCopy = {
  fr: {
    title: 'Activer votre compte',
    heroDescription:
      "Ouvrez le lien recu par email, puis choisissez votre mot de passe pour finaliser l'activation.",
    activationCardTitle: "Lien d'activation",
    activationCardDescription:
      'Le lien envoye par email est valable 24 heures et ouvre directement cette interface.',
    missingLink: "Lien d'activation manquant ou invalide.",
    expiredLink: "Ce lien d'activation est invalide ou expire.",
    invalidActivation: "Impossible d'activer le compte avec ce lien.",
    loadingLink: "Verification du lien d'activation...",
    successTitle: 'Compte active avec succes.',
    successDescription: 'Redirection vers la page de connexion...',
    emailLabel: 'Adresse email',
    emailPlaceholder: 'vous@entreprise.com',
    passwordLabel: 'Nouveau mot de passe',
    passwordHint:
      '8 caracteres minimum, avec une majuscule, un chiffre et un caractere special.',
    confirmPasswordLabel: 'Confirmer le mot de passe',
    passwordRequired: 'Veuillez saisir un mot de passe.',
    passwordLength: 'Le mot de passe doit contenir au moins 8 caracteres.',
    passwordUppercase: 'Ajoutez au moins une lettre majuscule.',
    passwordDigit: 'Ajoutez au moins un chiffre.',
    passwordSpecial: 'Ajoutez au moins un caractere special.',
    confirmPasswordRequired: 'Veuillez confirmer votre mot de passe.',
    passwordMismatch: 'Les mots de passe ne correspondent pas.',
    activate: 'Activer mon compte',
    activating: 'Activation...',
    backToLogin: 'Retour a la connexion',
    hide: 'Masquer',
    show: 'Afficher',
  },
  en: {
    title: 'Activate your account',
    heroDescription:
      'Open the link received by email, then choose your password to complete the activation.',
    activationCardTitle: 'Activation link',
    activationCardDescription:
      'The link sent by email stays valid for 24 hours and opens this interface directly.',
    missingLink: 'Missing or invalid activation link.',
    expiredLink: 'This activation link is invalid or expired.',
    invalidActivation: 'Unable to activate the account with this link.',
    loadingLink: 'Checking activation link...',
    successTitle: 'Account activated successfully.',
    successDescription: 'Redirecting to the login page...',
    emailLabel: 'Email address',
    emailPlaceholder: 'you@company.com',
    passwordLabel: 'New password',
    passwordHint:
      'At least 8 characters, including one uppercase letter, one number, and one special character.',
    confirmPasswordLabel: 'Confirm password',
    passwordRequired: 'Please enter a password.',
    passwordLength: 'The password must contain at least 8 characters.',
    passwordUppercase: 'Add at least one uppercase letter.',
    passwordDigit: 'Add at least one number.',
    passwordSpecial: 'Add at least one special character.',
    confirmPasswordRequired: 'Please confirm your password.',
    passwordMismatch: 'Passwords do not match.',
    activate: 'Activate my account',
    activating: 'Activating...',
    backToLogin: 'Back to login',
    hide: 'Hide',
    show: 'Show',
  },
  ar: {
    title: 'تفعيل الحساب',
    heroDescription:
      'افتح الرابط الذي وصلك عبر البريد الإلكتروني ثم اختر كلمة المرور لإكمال التفعيل.',
    activationCardTitle: 'رابط التفعيل',
    activationCardDescription:
      'الرابط المرسل عبر البريد الإلكتروني صالح لمدة 24 ساعة ويفتح هذه الواجهة مباشرة.',
    missingLink: 'رابط التفعيل مفقود أو غير صالح.',
    expiredLink: 'رابط التفعيل غير صالح أو منتهي الصلاحية.',
    invalidActivation: 'تعذر تفعيل الحساب بهذا الرابط.',
    loadingLink: 'جاري التحقق من رابط التفعيل...',
    successTitle: 'تم تفعيل الحساب بنجاح.',
    successDescription: 'جاري التحويل إلى صفحة تسجيل الدخول...',
    emailLabel: 'البريد الإلكتروني',
    emailPlaceholder: 'you@company.com',
    passwordLabel: 'كلمة المرور الجديدة',
    passwordHint:
      'ثمانية أحرف على الأقل مع حرف كبير ورقم ورمز خاص.',
    confirmPasswordLabel: 'تأكيد كلمة المرور',
    passwordRequired: 'يرجى إدخال كلمة المرور.',
    passwordLength: 'يجب أن تحتوي كلمة المرور على 8 أحرف على الأقل.',
    passwordUppercase: 'أضف حرفًا كبيرًا واحدًا على الأقل.',
    passwordDigit: 'أضف رقمًا واحدًا على الأقل.',
    passwordSpecial: 'أضف رمزًا خاصًا واحدًا على الأقل.',
    confirmPasswordRequired: 'يرجى تأكيد كلمة المرور.',
    passwordMismatch: 'كلمتا المرور غير متطابقتين.',
    activate: 'تفعيل الحساب',
    activating: 'جاري التفعيل...',
    backToLogin: 'العودة إلى تسجيل الدخول',
    hide: 'إخفاء',
    show: 'إظهار',
  },
};

const CreatePasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { language, isArabic, t } = useLanguage();
  const copy = pageCopy[language] || pageCopy.fr;

  const token = (searchParams.get('token') || '').trim();

  const [activationInfo, setActivationInfo] = useState(null);
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
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
        setErrors({ submit: copy.missingLink });
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
            submit: error?.response?.data?.message || error?.message || copy.expiredLink,
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
  }, [token, copy.expiredLink, copy.missingLink]);

  const validatePassword = (password) => {
    if (!password) return copy.passwordRequired;
    if (password.length < 8) return copy.passwordLength;
    if (!/(?=.*[A-Z])/.test(password)) return copy.passwordUppercase;
    if (!/(?=.*\d)/.test(password)) return copy.passwordDigit;
    if (!SPECIAL_CHARACTER_REGEX.test(password)) return copy.passwordSpecial;
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
      [name]: value,
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
      nextErrors.confirmPassword = copy.confirmPasswordRequired;
    } else if (formData.password !== formData.confirmPassword) {
      nextErrors.confirmPassword = copy.passwordMismatch;
    }

    if (!token) {
      nextErrors.submit = copy.missingLink;
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
        submit: error?.response?.data?.message || error?.message || copy.invalidActivation,
      });
    } finally {
      setLoading(false);
    }
  };

  const accountLabel = useMemo(
    () => [activationInfo?.prenom, activationInfo?.nom].filter(Boolean).join(' ').trim(),
    [activationInfo]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <PublicHeader
          title={copy.title}
          subtitle={t('common.appName')}
          backTo="/login"
          backLabel={copy.backToLogin}
        />

        <div className="mx-auto mt-10 max-w-md">
          <div
            dir={isArabic ? 'rtl' : 'ltr'}
            className="space-y-8 rounded-2xl bg-white p-8 shadow-xl sm:p-10"
          >
            <div className={`space-y-3 text-center ${isArabic ? 'text-right' : ''}`}>
              <h1 className="text-3xl font-extrabold text-gray-900">{copy.title}</h1>
              <p className="text-sm text-gray-600">{copy.heroDescription}</p>
            </div>

            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
              <p className="font-semibold">{copy.activationCardTitle}</p>
              <p className="mt-1">{copy.activationCardDescription}</p>
            </div>

            {initializing ? (
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
                {copy.loadingLink}
              </div>
            ) : success ? (
              <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                <p className="font-semibold">{copy.successTitle}</p>
                <p className="mt-1">{copy.successDescription}</p>
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
                    {copy.emailLabel}
                  </label>
                  <input
                    id="activation-email"
                    type="email"
                    value={activationInfo?.email || ''}
                    disabled
                    className="block w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-900 shadow-sm outline-none cursor-not-allowed"
                    placeholder={copy.emailPlaceholder}
                  />
                </div>

                <div>
                  <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-700">
                    {copy.passwordLabel}
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
                      className={`block w-full rounded-lg border px-3 py-3 text-sm shadow-sm outline-none transition-all ${
                        isArabic ? 'pl-20 pr-3' : 'pr-20 pl-3'
                      } ${
                        errors.password ? 'border-red-300 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'
                      } focus:border-transparent focus:ring-2`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className={`absolute inset-y-0 px-4 text-sm text-gray-500 ${isArabic ? 'left-0' : 'right-0'}`}
                    >
                      {showPassword ? copy.hide : copy.show}
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">{copy.passwordHint}</p>
                  {errors.password && <p className="mt-2 text-sm text-red-600">{errors.password}</p>}
                </div>

                <div>
                  <label htmlFor="confirm-password" className="mb-2 block text-sm font-medium text-gray-700">
                    {copy.confirmPasswordLabel}
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
                      className={`block w-full rounded-lg border px-3 py-3 text-sm shadow-sm outline-none transition-all ${
                        isArabic ? 'pl-20 pr-3' : 'pr-20 pl-3'
                      } ${
                        errors.confirmPassword
                          ? 'border-red-300 focus:ring-red-200'
                          : 'border-gray-300 focus:ring-blue-200'
                      } focus:border-transparent focus:ring-2`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((current) => !current)}
                      className={`absolute inset-y-0 px-4 text-sm text-gray-500 ${isArabic ? 'left-0' : 'right-0'}`}
                    >
                      {showConfirmPassword ? copy.hide : copy.show}
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
                  {loading ? copy.activating : copy.activate}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePasswordPage;
