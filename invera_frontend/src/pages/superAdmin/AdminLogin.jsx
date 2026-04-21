// pages/superAdmin/AdminLogin.jsx - Version complète corrigée

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { superAdminService } from '../../servicesPlatform/superAdminService';
import toast from 'react-hot-toast';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  Shield
} from 'lucide-react';

import logoInvera from '../../assets/images/logo.png';

const AdminLogin = () => {
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
    if (!trimmed) return 'Email requis';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return 'Email invalide';
    return null;
  };

  const validatePassword = (value) => {
    if (!value) return 'Mot de passe requis';
    if (value.length < 6) return 'Minimum 6 caractères';
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
      setErrors(prev => ({ ...prev, [field]: validateField(field, value) }));
    }
    if (errorMessage) setErrorMessage('');
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const val = field === 'email' ? email : password;
    setErrors(prev => ({ ...prev, [field]: validateField(field, val) }));
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
      
      console.log('📊 Réponse reçue:', response);
      
      // ✅ Vérification du token
      if (!response || !response.token) {
        throw new Error('Token manquant dans la réponse');
      }
      
      // ✅ Stockage aligne pour tous les ecrans super admin
      localStorage.clear(); // Nettoyer les anciennes données
      
      localStorage.setItem('token', response.token);
      localStorage.setItem('adminToken', response.token);
      localStorage.setItem('userRole', 'SUPER_ADMIN');
      localStorage.setItem('userName', response.nom);
      localStorage.setItem('userEmail', response.email);
      
      // Stockage spécifique pour Super Admin
      localStorage.setItem('adminInfo', JSON.stringify({
        id: response.id,
        nom: response.nom,
        email: response.email,
        role: 'SUPER_ADMIN'
      }));
      localStorage.setItem('superAdminInfo', JSON.stringify({
        id: response.id,
        nom: response.nom,
        email: response.email,
        role: 'SUPER_ADMIN'
      }));
      
      // ✅ Vérification du stockage
      console.log('✅ Stockage effectué:');
      console.log('  - token:', localStorage.getItem('token') ? 'Présent' : 'ABSENT');
      console.log('  - adminToken:', localStorage.getItem('adminToken') ? 'Présent' : 'ABSENT');
      console.log('  - userRole:', localStorage.getItem('userRole'));
      console.log('  - userName:', localStorage.getItem('userName'));
      console.log('  - userEmail:', localStorage.getItem('userEmail'));
      
      toast.success(`Bienvenue ${response.nom} !`);
      
      // ✅ Redirection vers /dashboard
      navigate('/super-admin/dashboard', { replace: true });
      
    } catch (error) {
      console.error('❌ Erreur login super admin:', error);
      
      const errorMsg = error.response?.data?.error || 
                       error.response?.data?.message || 
                       error.message ||
                       'Email ou mot de passe incorrect';
      
      setErrorMessage(errorMsg);
      toast.error('Échec de la connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-[500px]">

        {/* Card */}
        <div className="bg-white rounded-2xl border border-blue-100/50 overflow-hidden shadow-xl">
          
          {/* Header */}
          <div className="bg-white px-8 pt-8 pb-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              
              {/* Logo */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 backdrop-blur-sm flex items-center justify-center border border-blue-400/50 shadow-sm">
                  <img
                    src={logoInvera}
                    alt="InVera Logo"
                    className="w-7 h-7 object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-800">InVera ERP</h1>
                  <p className="text-[10px] text-gray-400">Plateforme de gestion</p>
                </div>
              </div>

              {/* Badge Super Admin */}
              <div className="flex items-center gap-2 bg-purple-500/20 backdrop-blur-sm rounded-full px-3 py-1.5 border border-purple-400/50 shadow-sm">
                <Shield className="w-3.5 h-3.5 text-purple-600" />
                <span className="text-[10px] font-medium text-purple-700 tracking-wide">SUPER ADMIN</span>
              </div>

            </div>
          </div>

          {/* Form body */}
          <div className="px-8 py-8">

            {/* Titre */}
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-800">Connexion Super Admin</h1>
              <p className="text-[13px] text-gray-500 mt-1">
                Accès à la plateforme d'administration
              </p>
            </div>

            {/* Error banner */}
            {errorMessage && (
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-6">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-[13px] font-semibold text-red-700">Connexion impossible</p>
                  <p className="text-[12px] text-red-600 mt-0.5">{errorMessage}</p>
                </div>
                <button
                  onClick={() => setErrorMessage('')}
                  className="text-red-400 hover:text-red-600 transition-colors"
                >
                  ✕
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>

              {/* Email */}
              <div className="mb-5">
                <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    onBlur={() => handleBlur('email')}
                    placeholder="admin@invera.com"
                    disabled={loading}
                    className={`w-full pl-9 pr-3 py-3 text-[15px] rounded-lg border bg-gray-50 focus:outline-none focus:bg-white focus:border-purple-400 transition-all placeholder:text-gray-300 disabled:opacity-50
                      ${touched.email && errors.email
                        ? 'border-red-300 focus:border-red-400 bg-red-50/30'
                        : 'border-gray-200 focus:border-purple-400'
                      }`}
                  />
                </div>
                {touched.email && errors.email && (
                  <p className="flex items-center gap-1 mt-2 text-[12px] text-red-500 ml-0.5">
                    <AlertCircle className="w-3 h-3" />
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="mb-7">
                <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type={obscurePassword ? 'password' : 'text'}
                    value={password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    onBlur={() => handleBlur('password')}
                    placeholder="••••••••"
                    disabled={loading}
                    className={`w-full pl-9 pr-10 py-3 text-[15px] rounded-lg border bg-gray-50 focus:outline-none focus:bg-white focus:border-purple-400 transition-all placeholder:text-gray-300 disabled:opacity-50
                      ${touched.password && errors.password
                        ? 'border-red-300 focus:border-red-400 bg-red-50/30'
                        : 'border-gray-200 focus:border-purple-400'
                      }`}
                  />
                  <button
                    type="button"
                    onClick={() => setObscurePassword(!obscurePassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {obscurePassword
                      ? <EyeOff className="w-4 h-4" />
                      : <Eye className="w-4 h-4" />
                    }
                  </button>
                </div>
                {touched.password && errors.password && (
                  <p className="flex items-center gap-1 mt-2 text-[12px] text-red-500 ml-0.5">
                    <AlertCircle className="w-3 h-3" />
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 active:scale-[0.98] text-white text-[15px] font-medium py-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.25" />
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    Connexion en cours…
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    Se connecter
                  </>
                )}
              </button>

            </form>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-gray-400 mt-5">
          © {new Date().getFullYear()} InVera ERP — Tous droits réservés
        </p>

      </div>
    </div>
  );
};

export default AdminLogin;
