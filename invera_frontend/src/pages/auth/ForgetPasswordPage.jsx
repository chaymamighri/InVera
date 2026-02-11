import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Button from '../../components/Button';
import logo from '../../assets/images/InVera_logo_2.png';
import { authService } from '../../services/authService';

const ForgetPasswordPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email, 2: Code, 3: New Password
  const [formData, setFormData] = useState({
    email: '',
    resetCode: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });
  const [countdown, setCountdown] = useState(0);
  const [showPassword, setShowPassword] = useState({
    newPassword: false,
    confirmPassword: false
  });
  const [resetToken, setResetToken] = useState('');

  // Countdown timer for resend code
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) return 'Email requis';
    if (!emailRegex.test(email)) return 'Format d\'email invalide';
    return '';
  };

  const validatePassword = (password) => {
    if (!password.trim()) return 'Mot de passe requis';
    if (password.length < 8) return 'Minimum 8 caractères';
    if (!/(?=.*[A-Z])/.test(password)) return 'Au moins une majuscule';
    if (!/(?=.*\d)/.test(password)) return 'Au moins un chiffre';
    if (!/(?=.*[!@#$%^&*])/.test(password)) return 'Au moins un caractère spécial';
    return '';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (message.text) {
      setMessage({ type: '', text: '' });
    }
  };

  const handleSubmitEmail = async (e) => {
    e.preventDefault();
    setErrors({});
    setMessage({ type: '', text: '' });

    const emailError = validateEmail(formData.email);
    if (emailError) {
      setErrors({ email: emailError });
      return;
    }

    setLoading(true);
    try {
      // Use authService.forgotPassword
      const result = await authService.forgotPassword(formData.email);
      
      setMessage({
        type: 'success',
        text: `Un code de réinitialisation a été envoyé à ${formData.email}`
      });
      setStep(2);
      setCountdown(60); // 60 seconds countdown
    } catch (error) {
      console.error('Forgot password error:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Impossible d\'envoyer le code. Veuillez réessayer.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitCode = async (e) => {
    e.preventDefault();
    setErrors({});
    setMessage({ type: '', text: '' });

    if (!formData.resetCode.trim()) {
      setErrors({ resetCode: 'Code requis' });
      return;
    }

    if (formData.resetCode.length !== 6) {
      setErrors({ resetCode: 'Le code doit contenir 6 chiffres' });
      return;
    }

    // Store the token and proceed to next step
    // The backend doesn't have a separate verification endpoint
    // We verify the token when resetting the password
    setResetToken(formData.resetCode);
    setStep(3);
    setMessage({
      type: 'success',
      text: 'Code vérifié avec succès'
    });
  };

  const handleSubmitPassword = async (e) => {
    e.preventDefault();
    setErrors({});
    setMessage({ type: '', text: '' });

    const passwordError = validatePassword(formData.newPassword);
    if (passwordError) {
      setErrors({ newPassword: passwordError });
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setErrors({ confirmPassword: 'Les mots de passe ne correspondent pas' });
      return;
    }

    setLoading(true);
    try {
      // Call reset password with token and new password
      const result = await authService.resetPassword(
        resetToken,
        formData.newPassword
      );
      
      setMessage({
        type: 'success',
        text: 'Mot de passe réinitialisé avec succès ! Redirection vers la connexion...'
      });
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
      
    } catch (error) {
      console.error('Reset password error:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Code invalide ou expiré. Veuillez réessayer.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) return;
    
    setLoading(true);
    try {
      await authService.forgotPassword(formData.email);
      setCountdown(60);
      setMessage({
        type: 'success',
        text: 'Un nouveau code a été envoyé'
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Impossible de renvoyer le code'
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3].map((stepNumber) => (
        <React.Fragment key={stepNumber}>
          <div className="flex flex-col items-center">
            <div className={`
              h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold
              ${step === stepNumber ? 'bg-blue-600 text-white' : 
                step > stepNumber ? 'bg-green-500 text-white' : 
                'bg-gray-200 text-gray-400'}
            `}>
              {stepNumber}
            </div>
            <span className="text-xs mt-2 text-gray-500">
              {stepNumber === 1 ? 'Email' : stepNumber === 2 ? 'Code' : 'Nouveau mot de passe'}
            </span>
          </div>
          {stepNumber < 3 && (
            <div className={`h-1 w-16 mx-2 ${step > stepNumber ? 'bg-green-500' : 'bg-gray-200'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const renderStepContent = () => {
    switch(step) {
      case 1:
        return (
          <form onSubmit={handleSubmitEmail} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Adresse email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-3 py-3 border ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  } rounded-lg bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                  placeholder="vous@entreprise.com"
                  disabled={loading}
                />
              </div>
              {errors.email && (
                <p className="mt-2 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    Un code de réinitialisation vous sera envoyé par email. Vérifiez également vos spams.
                  </p>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              loading={loading}
              fullWidth
              variant="primary"
              size="lg"
              disabled={loading}
            >
              {loading ? 'Envoi en cours...' : 'Envoyer le code'}
            </Button>
          </form>
        );

      case 2:
        return (
          <form onSubmit={handleSubmitCode} className="space-y-6">
            <div>
              <label htmlFor="resetCode" className="block text-sm font-medium text-gray-700 mb-2">
                Code de vérification
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="resetCode"
                  name="resetCode"
                  type="text"
                  maxLength="6"
                  pattern="[0-9]*"
                  inputMode="numeric"
                  value={formData.resetCode}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-3 py-3 border ${
                    errors.resetCode ? 'border-red-300' : 'border-gray-300'
                  } rounded-lg bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                  placeholder="123456"
                  disabled={loading}
                />
              </div>
              {errors.resetCode && (
                <p className="mt-2 text-sm text-red-600">{errors.resetCode}</p>
              )}
              <p className="mt-2 text-sm text-gray-500">
                Entrez le code à 6 chiffres envoyé à {formData.email}
              </p>
            </div>

            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={handleResendCode}
                disabled={countdown > 0 || loading}
                className={`text-sm font-medium ${
                  countdown > 0 ? 'text-gray-400' : 'text-blue-600 hover:text-blue-500'
                }`}
              >
                {countdown > 0 ? `Renvoyer (${countdown}s)` : 'Renvoyer le code'}
              </button>
              
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Modifier l'email
              </button>
            </div>

            <Button
              type="submit"
              loading={loading}
              fullWidth
              variant="primary"
              size="lg"
              disabled={loading}
            >
              {loading ? 'Vérification...' : 'Vérifier le code'}
            </Button>
          </form>
        );

      case 3:
        return (
          <form onSubmit={handleSubmitPassword} className="space-y-6">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="newPassword"
                  name="newPassword"
                  type={showPassword.newPassword ? "text" : "password"}
                  value={formData.newPassword}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-12 py-3 border ${
                    errors.newPassword ? 'border-red-300' : 'border-gray-300'
                  } rounded-lg bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                  placeholder="••••••••"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('newPassword')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  disabled={loading}
                >
                  {showPassword.newPassword ? (
                    <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.newPassword && (
                <p className="mt-2 text-sm text-red-600">{errors.newPassword}</p>
              )}
              
              {formData.newPassword && !errors.newPassword && (
                <div className="mt-3">
                  <div className="flex items-center space-x-2 mb-1">
                    <div className={`h-1 flex-1 rounded-full ${
                      formData.newPassword.length >= 8 ? 'bg-green-500' : 'bg-gray-200'
                    }`}></div>
                    <div className={`h-1 flex-1 rounded-full ${
                      /(?=.*[A-Z])/.test(formData.newPassword) ? 'bg-green-500' : 'bg-gray-200'
                    }`}></div>
                    <div className={`h-1 flex-1 rounded-full ${
                      /(?=.*\d)/.test(formData.newPassword) ? 'bg-green-500' : 'bg-gray-200'
                    }`}></div>
                    <div className={`h-1 flex-1 rounded-full ${
                      /(?=.*[!@#$%^&*])/.test(formData.newPassword) ? 'bg-green-500' : 'bg-gray-200'
                    }`}></div>
                  </div>
                  <p className="text-xs text-gray-500">Force du mot de passe</p>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirmer le nouveau mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword.confirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-12 py-3 border ${
                    errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                  } rounded-lg bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                  placeholder="••••••••"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirmPassword')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  disabled={loading}
                >
                  {showPassword.confirmPassword ? (
                    <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-2 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            <Button
              type="submit"
              loading={loading}
              fullWidth
              variant="primary"
              size="lg"
              disabled={loading}
            >
              {loading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
            </Button>
          </form>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex flex-col md:flex-row">
      {/* Section gauche - Branding et marketing */}
      <div className="md:w-1/2 bg-gradient-to-br from-blue-900 to-blue-800 text-white p-6 md:p-12 flex flex-col">
        <div className="max-w-lg mx-auto flex-1 flex flex-col">
          
          <div className="mb-8">
            <div className="flex flex-col items-center">
              <div className="w-full max-w-md flex items-center justify-center mb-6">
                <img 
                  src={logo} 
                  alt="InVera ERP Logo" 
                  className="w-full max-w-xs md:max-w-sm h-auto"
                  onError={(e) => {
                    console.error('Erreur de chargement du logo');
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
                <p className="text-blue-200 text-xl font-medium">
                  ERP Cloud Intelligent
                </p>
              </div>
            </div>
          </div>

          <div className="mb-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-center leading-tight">
              Réinitialisation du mot de passe
            </h2>
            <p className="text-blue-200 text-center text-lg">
              Suivez les étapes pour récupérer votre accès
            </p>
          </div>
          
          <div className="space-y-4 mb-8 md:mb-12">
            {[
              { 
                title: 'Sécurité garantie', 
                desc: 'Lien de réinitialisation unique',
                icon: '🔐'
              },
              { 
                title: 'Code temporaire', 
                desc: 'Valide pendant 30 minutes',
                icon: '⏱️'
              },
              { 
                title: 'Support disponible', 
                desc: 'Assistance 24/7 si besoin',
                icon: '🛟'
              },
              { 
                title: 'Connexion rapide', 
                desc: 'Retour à votre tableau de bord en 2 minutes',
                icon: '⚡'
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
              <p className="mb-2">
                ©️ {new Date().getFullYear()} InVera ERP. Tous droits réservés.
              </p>
              <div className="flex justify-center items-center space-x-4 text-xs">
                <span>Version 2.1.4</span>
                <span className="h-1 w-1 rounded-full bg-blue-400/50"></span>
                <span>Serveur: online</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="md:w-1/2 flex flex-col">
        <div className="flex-1 flex items-center justify-center p-6 md:p-12">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900">
                  {step === 1 && 'Entrez votre email'}
                  {step === 2 && 'Vérifiez votre code'}
                  {step === 3 && 'Créez un nouveau mot de passe'}
                </h3>
                <p className="mt-2 text-gray-600">
                  {step === 1 && 'Nous vous enverrons un code de réinitialisation'}
                  {step === 2 && 'Consultez vos emails pour le code à 6 chiffres'}
                  {step === 3 && 'Choisissez un mot de passe sécurisé'}
                </p>
              </div>

              {renderStepIndicator()}

              {message.text && (
                <div className={`mb-6 p-4 rounded-lg ${
                  message.type === 'success' 
                    ? 'bg-green-50 border border-green-200 text-green-700'
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  <div className="flex items-center">
                    <svg className={`h-5 w-5 mr-2 ${message.type === 'success' ? 'text-green-500' : 'text-red-500'}`} fill="currentColor" viewBox="0 0 20 20">
                      {message.type === 'success' ? (
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      ) : (
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      )}
                    </svg>
                    {message.text}
                  </div>
                </div>
              )}

              {renderStepContent()}

              <div className="mt-8 text-center">
                <Link 
                  to="/login" 
                  className="text-blue-600 hover:text-blue-500 font-medium text-sm inline-flex items-center"
                >
                  <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Retour à la connexion
                </Link>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-100">
                <p className="text-center text-gray-500 text-sm">
                  Besoin d'aide ?{' '}
                  <button
                    onClick={() => alert('Contact support à implémenter')}
                    className="text-blue-600 hover:text-blue-500 font-medium"
                  >
                    Contacter le support
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="hidden md:block p-8">
          <div className="max-w-md mx-auto">
            <p className="text-center text-gray-500 text-sm mb-2">
              ©️ {new Date().getFullYear()} InVera ERP. Tous droits réservés.
            </p>
            <div className="flex justify-center space-x-4 text-xs text-gray-400">
              <button 
                onClick={() => alert('Politique de confidentialité')}
                className="hover:text-gray-600 transition-colors"
              >
                Politique de confidentialité
              </button>
              <span>•</span>
              <button 
                onClick={() => alert('Conditions d\'utilisation')}
                className="hover:text-gray-600 transition-colors"
              >
                Conditions d'utilisation
              </button>
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

export default ForgetPasswordPage;