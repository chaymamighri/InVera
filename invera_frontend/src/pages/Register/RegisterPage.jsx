import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendOtp, verifyOtp, register } from '../../services/registerService';
import PublicHeader from '../../components/PublicHeader';
import { useLanguage } from '../../context/LanguageContext';

const registerCopy = {
  fr: {
    otpTitle: 'Verification email',
    otpDescription: 'Saisissez votre email pour recevoir un code.',
    emailLabel: 'Email',
    emailPlaceholder: 'exemple@email.com',
    sendCode: 'Recevoir le code',
    sendingCode: 'Envoi en cours...',
    codeLabel: 'Code de verification',
    codePlaceholder: 'Code a 6 chiffres',
    codeSentTo: 'Un code a ete envoye a {{email}}',
    verifyCode: 'Verifier le code',
    verifyingCode: 'Verification...',
    editEmail: 'Modifier mon email',
    emailRequired: 'Veuillez saisir votre email.',
    codeRequired: 'Veuillez saisir le code recu.',
    invalidCode: 'Code invalide. Veuillez reessayer.',
    genericOtpError: "Erreur lors de l'envoi du code",
    pageTitle: 'Creer mon compte',
    pageDescription: '30 connexions offertes pour decouvrir la plateforme',
    emailVerified: 'Email verifie',
    accountType: 'Type de compte',
    individual: 'Particulier',
    company: 'Entreprise',
    registrationType: "Type d'inscription",
    trial: 'Essai gratuit',
    trialConnections: '30 connexions',
    subscription: 'Abonnement',
    subscriptionPrice: '29€/mois',
    lastName: 'Nom *',
    firstName: 'Prenom *',
    companyName: 'Raison sociale *',
    siret: 'SIRET (14 chiffres)',
    phone: 'Telephone *',
    password: 'Mot de passe *',
    mandatoryDocuments: 'Documents justificatifs obligatoires',
    nationalId: "Carte d'identite nationale",
    managerId: "Carte d'identite du gerant",
    patent: 'Patente',
    rne: 'Extrait RNE',
    acceptedFormats: 'JPG, PNG ou PDF',
    uploaded: 'Document charge',
    rneWarningTitle: 'Attention',
    rneWarning:
      "L'extrait RNE doit dater de moins de 3 mois. L'administrateur verifiera visuellement la date sur le document.",
    monthlySubscription: 'Abonnement mensuel - 29€ HT / mois',
    paymentInfo: 'Paiement a effectuer apres validation de votre dossier',
    submit: "S'inscrire",
    submitting: 'Inscription en cours...',
    terms: "En cliquant sur \"S'inscrire\", vous acceptez nos conditions generales d'utilisation.",
    successTrialTitle: 'Compte essai cree !',
    successTrialDescription: 'Vous pouvez des maintenant vous connecter.',
    successValidatedTitle: 'Inscription enregistree !',
    successValidatedDescription: "Votre dossier est en cours de validation par l'administrateur.",
    successValidatedHint: 'Vous serez notifie par email des que votre compte sera active.',
    loginNow: 'Se connecter',
    backToHome: "Retour a l'accueil",
  },
  en: {
    otpTitle: 'Email verification',
    otpDescription: 'Enter your email to receive a code.',
    emailLabel: 'Email',
    emailPlaceholder: 'example@email.com',
    sendCode: 'Receive code',
    sendingCode: 'Sending...',
    codeLabel: 'Verification code',
    codePlaceholder: '6-digit code',
    codeSentTo: 'A code was sent to {{email}}',
    verifyCode: 'Verify code',
    verifyingCode: 'Verifying...',
    editEmail: 'Edit my email',
    emailRequired: 'Please enter your email.',
    codeRequired: 'Please enter the code you received.',
    invalidCode: 'Invalid code. Please try again.',
    genericOtpError: 'Failed to send the code',
    pageTitle: 'Create my account',
    pageDescription: '30 free logins to discover the platform',
    emailVerified: 'Email verified',
    accountType: 'Account type',
    individual: 'Individual',
    company: 'Company',
    registrationType: 'Registration type',
    trial: 'Free trial',
    trialConnections: '30 logins',
    subscription: 'Subscription',
    subscriptionPrice: '29€/month',
    lastName: 'Last name *',
    firstName: 'First name *',
    companyName: 'Company name *',
    siret: 'SIRET (14 digits)',
    phone: 'Phone *',
    password: 'Password *',
    mandatoryDocuments: 'Required supporting documents',
    nationalId: 'National identity card',
    managerId: "Manager's identity card",
    patent: 'Patent certificate',
    rne: 'RNE extract',
    acceptedFormats: 'JPG, PNG, or PDF',
    uploaded: 'Document uploaded',
    rneWarningTitle: 'Warning',
    rneWarning:
      'The RNE extract must be less than 3 months old. The administrator will check the date visually on the document.',
    monthlySubscription: 'Monthly subscription - 29€ excl. tax / month',
    paymentInfo: 'Payment is required after your file is validated',
    submit: 'Register',
    submitting: 'Registering...',
    terms: 'By clicking "Register", you accept our general terms of use.',
    successTrialTitle: 'Trial account created!',
    successTrialDescription: 'You can now log in.',
    successValidatedTitle: 'Registration recorded!',
    successValidatedDescription: 'Your file is being reviewed by the administrator.',
    successValidatedHint: 'You will receive an email once your account is activated.',
    loginNow: 'Log in',
    backToHome: 'Back to home',
  },
  ar: {
    otpTitle: 'التحقق من البريد الإلكتروني',
    otpDescription: 'أدخل بريدك الإلكتروني للحصول على رمز.',
    emailLabel: 'البريد الإلكتروني',
    emailPlaceholder: 'example@email.com',
    sendCode: 'استلام الرمز',
    sendingCode: 'جاري الإرسال...',
    codeLabel: 'رمز التحقق',
    codePlaceholder: 'رمز من 6 أرقام',
    codeSentTo: 'تم إرسال رمز إلى {{email}}',
    verifyCode: 'التحقق من الرمز',
    verifyingCode: 'جاري التحقق...',
    editEmail: 'تعديل بريدي الإلكتروني',
    emailRequired: 'يرجى إدخال بريدك الإلكتروني.',
    codeRequired: 'يرجى إدخال الرمز الذي استلمته.',
    invalidCode: 'رمز غير صالح. حاول مرة أخرى.',
    genericOtpError: 'تعذر إرسال الرمز',
    pageTitle: 'إنشاء حسابي',
    pageDescription: '30 عملية دخول مجانية لاكتشاف المنصة',
    emailVerified: 'تم التحقق من البريد',
    accountType: 'نوع الحساب',
    individual: 'فردي',
    company: 'شركة',
    registrationType: 'نوع التسجيل',
    trial: 'تجربة مجانية',
    trialConnections: '30 عملية دخول',
    subscription: 'اشتراك',
    subscriptionPrice: '29€/شهريًا',
    lastName: 'اللقب *',
    firstName: 'الاسم *',
    companyName: 'الاسم التجاري *',
    siret: 'SIRET (14 رقمًا)',
    phone: 'الهاتف *',
    password: 'كلمة المرور *',
    mandatoryDocuments: 'الوثائق الإلزامية',
    nationalId: 'بطاقة الهوية الوطنية',
    managerId: 'بطاقة هوية المدير',
    patent: 'الباتيندة',
    rne: 'مستخرج السجل الوطني للمؤسسات',
    acceptedFormats: 'JPG أو PNG أو PDF',
    uploaded: 'تم رفع الوثيقة',
    rneWarningTitle: 'تنبيه',
    rneWarning:
      'يجب أن يكون مستخرج RNE أقل من 3 أشهر. سيقوم المسؤول بالتحقق من التاريخ بصريًا على الوثيقة.',
    monthlySubscription: 'اشتراك شهري - 29€ دون ضرائب / شهريًا',
    paymentInfo: 'يتم الدفع بعد التحقق من الملف',
    submit: 'تسجيل',
    submitting: 'جاري التسجيل...',
    terms: 'بالنقر على "تسجيل"، فإنك توافق على الشروط العامة للاستخدام.',
    successTrialTitle: 'تم إنشاء الحساب التجريبي!',
    successTrialDescription: 'يمكنك الآن تسجيل الدخول.',
    successValidatedTitle: 'تم تسجيل الطلب!',
    successValidatedDescription: 'ملفك قيد المراجعة من طرف المسؤول.',
    successValidatedHint: 'ستتلقى إشعارًا عبر البريد الإلكتروني بمجرد تفعيل الحساب.',
    loginNow: 'تسجيل الدخول',
    backToHome: 'العودة إلى الرئيسية',
  },
};

const cardBaseClass =
  'border-2 rounded-xl p-4 text-center transition hover:border-[#0b4ea2]';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { language, isArabic, t } = useLanguage();
  const copy = registerCopy[language] || registerCopy.fr;

  const [step, setStep] = useState('otp');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const [formData, setFormData] = useState({
    typeCompte: 'PARTICULIER',
    typeInscription: 'ESSAI',
    nom: '',
    prenom: '',
    raisonSociale: '',
    siret: '',
    telephone: '',
    motDePasse: '',
    email: '',
    documents: [],
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const isEssai = formData.typeInscription === 'ESSAI';
  const isParticulier = formData.typeCompte === 'PARTICULIER';

  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (field, file) => {
    if (!file) return;
    const currentDocs = formData.documents || [];
    const newDocs = [...currentDocs];
    const existingIndex = newDocs.findIndex((d) => d.type === field);

    if (existingIndex !== -1) {
      newDocs[existingIndex] = { type: field, file };
    } else {
      newDocs.push({ type: field, file });
    }
    updateFormData('documents', newDocs);
  };

  const hasDocument = (field) => formData.documents?.some((d) => d.type === field);

  const isValid = () => {
    const hasBasicInfo = formData.email && formData.telephone && formData.motDePasse;
    if (!hasBasicInfo) return false;

    if (isParticulier) {
      if (!formData.nom || !formData.prenom) return false;
    } else if (!formData.raisonSociale) {
      return false;
    }

    if (!isEssai) {
      if (isParticulier) {
        if (!hasDocument('CIN')) return false;
      } else if (!hasDocument('GERANT_CIN') || !hasDocument('PATENTE') || !hasDocument('RNE')) {
        return false;
      }
    }

    return true;
  };

  const handleSendOtp = async () => {
    if (!email) {
      setOtpError(copy.emailRequired);
      return;
    }

    setOtpLoading(true);
    setOtpError('');

    const result = await sendOtp(email);
    if (result.success) {
      setOtpSent(true);
    } else {
      setOtpError(result.message || copy.genericOtpError);
    }
    setOtpLoading(false);
  };

  const handleVerifyOtp = async () => {
    const cleanedCode = otpCode ? otpCode.toString().trim() : '';

    if (!cleanedCode) {
      setOtpError(copy.codeRequired);
      return;
    }

    setOtpLoading(true);
    setOtpError('');

    const isValidCode = await verifyOtp(email, cleanedCode);

    if (isValidCode) {
      setStep('form');
      setFormData((prev) => ({ ...prev, email }));
    } else {
      setOtpError(copy.invalidCode);
    }

    setOtpLoading(false);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    const registerData = {
      email: formData.email,
      telephone: formData.telephone,
      typeCompte: formData.typeCompte,
      typeInscription: formData.typeInscription,
      code: otpCode,
      motDePasse: formData.motDePasse,
      documents: formData.documents,
      nom: formData.nom || '',
      prenom: formData.prenom || '',
      raisonSociale: formData.raisonSociale || '',
      siret: formData.siret || '',
    };

    const result = await register(registerData);

    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  const pageActions = null;

  const renderOtpStep = () => (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-2xl border border-sky-100 p-8 shadow-sm">
        <div className={`text-center mb-8 ${isArabic ? 'text-right' : ''}`}>
          <h1 className="text-2xl font-bold text-slate-900">{copy.otpTitle}</h1>
          <p className="text-slate-500 mt-1">{copy.otpDescription}</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">{copy.emailLabel}</label>
            <input
              type="email"
              placeholder={copy.emailPlaceholder}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b4ea2] transition"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={otpSent}
            />
          </div>

          {!otpSent ? (
            <button
              onClick={handleSendOtp}
              disabled={otpLoading || !email}
              className="w-full bg-[#0b4ea2] text-white py-3 rounded-xl font-semibold hover:bg-[#0b3d82] transition disabled:bg-gray-400"
            >
              {otpLoading ? copy.sendingCode : copy.sendCode}
            </button>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{copy.codeLabel}</label>
                <input
                  type="text"
                  placeholder={copy.codePlaceholder}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b4ea2] transition"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-2">
                  {t('common.loading') && copy.codeSentTo.replace('{{email}}', email)}
                </p>
              </div>

              <button
                onClick={handleVerifyOtp}
                disabled={otpLoading || !otpCode}
                className="w-full bg-[#0b4ea2] text-white py-3 rounded-xl font-semibold hover:bg-[#0b3d82] transition disabled:bg-gray-400"
              >
                {otpLoading ? copy.verifyingCode : copy.verifyCode}
              </button>

              <button
                onClick={() => {
                  setOtpSent(false);
                  setOtpError('');
                  setOtpCode('');
                }}
                className="w-full text-[#0b4ea2] py-2 text-sm hover:underline transition"
              >
                ← {copy.editEmail}
              </button>
            </>
          )}

          {otpError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
              {otpError}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderSuccess = () => (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-2xl border border-sky-100 p-8 shadow-sm text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          {isEssai ? copy.successTrialTitle : copy.successValidatedTitle}
        </h2>
        {isEssai ? (
          <>
            <p className="text-gray-600 mb-4">{copy.successTrialDescription}</p>
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-[#0b4ea2] text-white py-3 rounded-xl font-semibold hover:bg-[#0b3d82] transition"
            >
              {copy.loginNow}
            </button>
          </>
        ) : (
          <>
            <p className="text-gray-600 mb-4">{copy.successValidatedDescription}</p>
            <p className="text-sm text-gray-500 mb-4">{copy.successValidatedHint}</p>
            <button
              onClick={() => navigate('/welcome')}
              className="w-full bg-[#0b4ea2] text-white py-3 rounded-xl font-semibold hover:bg-[#0b3d82] transition"
            >
              {copy.backToHome}
            </button>
          </>
        )}
      </div>
    </div>
  );

  const renderUploadCard = (id, icon, title, field) => (
    <div className={`${cardBaseClass} border-dashed border-gray-300`}>
      <input
        type="file"
        id={id}
        className="hidden"
        accept="image/jpeg,image/png,application/pdf"
        onChange={(e) => handleFileUpload(field, e.target.files[0])}
      />
      <label htmlFor={id} className="cursor-pointer block">
        <div className="text-3xl mb-2">{icon}</div>
        <div className="font-medium text-[#0b4ea2]">{title}</div>
        <div className="text-xs text-gray-400 mt-1">{copy.acceptedFormats}</div>
      </label>
      {hasDocument(field) && (
        <div className="mt-2 text-sm text-green-600">✓ {copy.uploaded}</div>
      )}
    </div>
  );

  const renderForm = () => (
    <div className="max-w-3xl mx-auto">
      <div className={`text-center mb-8 ${isArabic ? 'text-right' : ''}`}>
        <h1 className="text-3xl font-bold text-slate-900">{copy.pageTitle}</h1>
        <p className="text-slate-500 mt-2">{copy.pageDescription}</p>
        <div className="inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-600 mt-2">
          ✓ {copy.emailVerified}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-sky-100 p-8 shadow-sm">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">{copy.accountType}</label>
            <div className="flex gap-4">
              <button
                type="button"
                className={`flex-1 py-3 rounded-xl font-semibold transition ${
                  formData.typeCompte === 'PARTICULIER' ? 'bg-[#0b4ea2] text-white' : 'bg-white border-2 border-gray-200 hover:border-[#0b4ea2]'
                }`}
                onClick={() => updateFormData('typeCompte', 'PARTICULIER')}
              >
                👤 {copy.individual}
              </button>
              <button
                type="button"
                className={`flex-1 py-3 rounded-xl font-semibold transition ${
                  formData.typeCompte === 'ENTREPRISE' ? 'bg-[#0b4ea2] text-white' : 'bg-white border-2 border-gray-200 hover:border-[#0b4ea2]'
                }`}
                onClick={() => updateFormData('typeCompte', 'ENTREPRISE')}
              >
                🏢 {copy.company}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">{copy.registrationType}</label>
            <div className="flex gap-4">
              <button
                type="button"
                className={`flex-1 py-3 rounded-xl font-semibold transition ${
                  formData.typeInscription === 'ESSAI' ? 'bg-green-500 text-white' : 'bg-white border-2 border-gray-200 hover:border-green-400'
                }`}
                onClick={() => updateFormData('typeInscription', 'ESSAI')}
              >
                🎁 {copy.trial}
                <span className="block text-xs">{copy.trialConnections}</span>
              </button>
              <button
                type="button"
                className={`flex-1 py-3 rounded-xl font-semibold transition ${
                  formData.typeInscription === 'DEFINITIF' ? 'bg-[#0b4ea2] text-white' : 'bg-white border-2 border-gray-200 hover:border-[#0b4ea2]'
                }`}
                onClick={() => updateFormData('typeInscription', 'DEFINITIF')}
              >
                💰 {copy.subscription}
                <span className="block text-xs">{copy.subscriptionPrice}</span>
              </button>
            </div>
          </div>

          {isParticulier ? (
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder={copy.lastName}
                className="px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b4ea2]"
                value={formData.nom}
                onChange={(e) => updateFormData('nom', e.target.value)}
              />
              <input
                type="text"
                placeholder={copy.firstName}
                className="px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b4ea2]"
                value={formData.prenom}
                onChange={(e) => updateFormData('prenom', e.target.value)}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <input
                type="text"
                placeholder={copy.companyName}
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b4ea2]"
                value={formData.raisonSociale}
                onChange={(e) => updateFormData('raisonSociale', e.target.value)}
              />
              <input
                type="text"
                placeholder={copy.siret}
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b4ea2]"
                value={formData.siret}
                onChange={(e) => updateFormData('siret', e.target.value)}
                maxLength="14"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <input
              type="email"
              placeholder={copy.emailLabel}
              className="px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b4ea2]"
              value={formData.email}
              onChange={(e) => updateFormData('email', e.target.value)}
            />
            <input
              type="tel"
              placeholder={copy.phone}
              className="px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b4ea2]"
              value={formData.telephone}
              onChange={(e) => updateFormData('telephone', e.target.value)}
            />
          </div>

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder={copy.password}
              className="w-full px-4 py-3 border rounded-xl pr-12 focus:outline-none focus:ring-2 focus:ring-[#0b4ea2]"
              value={formData.motDePasse}
              onChange={(e) => updateFormData('motDePasse', e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>

          {!isEssai && (
            <div className="border-t pt-4">
              <label className="block text-sm font-medium text-slate-700 mb-3">
                📎 {copy.mandatoryDocuments}
              </label>

              {isParticulier ? (
                renderUploadCard('cin', '🪪', copy.nationalId, 'CIN')
              ) : (
                <div className="space-y-4">
                  {renderUploadCard('cinGerant', '👤', copy.managerId, 'GERANT_CIN')}
                  {renderUploadCard('patente', '📜', copy.patent, 'PATENTE')}
                  {renderUploadCard('rne', '🏢', copy.rne, 'RNE')}

                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                    <p className="text-sm text-yellow-800">
                      ⚠️ <strong>{copy.rneWarningTitle}:</strong> {copy.rneWarning}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {!isEssai && (
            <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-100">
              <p className="font-bold text-[#0b4ea2]">📅 {copy.monthlySubscription}</p>
              <p className="text-xs text-gray-500 mt-1">{copy.paymentInfo}</p>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-100 border border-red-200 text-red-700 rounded-xl text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || !isValid()}
            className="w-full bg-[#0b4ea2] text-white py-3 rounded-xl font-semibold hover:bg-[#0b3d82] transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? copy.submitting : `📝 ${copy.submit}`}
          </button>

          <p className="text-center text-xs text-gray-400">{copy.terms}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen overflow-hidden bg-[#f6f9fc] text-slate-900" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="absolute inset-x-0 top-0 -z-10 h-[460px] bg-[linear-gradient(180deg,#eef6ff_0%,#f6f9fc_100%)]" />
      <div className="mx-auto max-w-7xl px-6 pb-24 pt-6 lg:px-8">
        <PublicHeader
          title={copy.pageTitle}
          subtitle={t('common.appName')}
          backTo="/welcome"
          backLabel={copy.backToHome}
          actions={pageActions}
        />

        <main className={`pt-14 ${isArabic ? 'text-right' : ''}`}>
          {step === 'otp' ? renderOtpStep() : success ? renderSuccess() : renderForm()}
        </main>
      </div>
    </div>
  );
};

export default RegisterPage;