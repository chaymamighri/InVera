import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Linkedin, Mail, MapPin, Phone } from 'lucide-react';

import logo from '../assets/images/logo.png';
import { useLanguage } from '../context/LanguageContext';

const footerCopy = {
  fr: {
    description:
      'InVera centralise les ventes, les achats, la facturation et le pilotage dans une plateforme ERP claire et evolutive.',
    product: 'Produit',
    company: 'Entreprise',
    legal: 'Legal',
    features: 'Fonctionnalites',
    subscriptions: 'Abonnements',
    moreInformation: "Plus d'informations",
    contact: 'Contact',
    login: 'Se connecter',
    register: "S'inscrire",
    conditions: "Conditions d'utilisation",
    privacy: 'Politique de confidentialite',
    rights: 'Tous droits reserves.',
  },
  en: {
    description:
      'InVera brings sales, procurement, invoicing, and oversight into one clear and scalable ERP platform.',
    product: 'Product',
    company: 'Company',
    legal: 'Legal',
    features: 'Features',
    subscriptions: 'Subscriptions',
    moreInformation: 'More information',
    contact: 'Contact',
    login: 'Log in',
    register: 'Register',
    conditions: 'Terms of use',
    privacy: 'Privacy policy',
    rights: 'All rights reserved.',
  },
  ar: {
    description:
      'تجمع InVera المبيعات والمشتريات والفوترة والمتابعة داخل منصة ERP واضحة وقابلة للتطور.',
    product: 'المنتج',
    company: 'الشركة',
    legal: 'القانوني',
    features: 'الوظائف',
    subscriptions: 'الاشتراكات',
    moreInformation: 'مزيد من المعلومات',
    contact: 'اتصل بنا',
    login: 'تسجيل الدخول',
    register: 'التسجيل',
    conditions: 'شروط الاستخدام',
    privacy: 'سياسة الخصوصية',
    rights: 'جميع الحقوق محفوظة.',
  },
};

const PublicFooter = ({ onNavigateSection }) => {
  const { language, isArabic } = useLanguage();
  const copy = footerCopy[language] || footerCopy.fr;

  const handleSection = (sectionId) => {
    if (onNavigateSection) {
      onNavigateSection(sectionId);
      return;
    }

    document.getElementById(sectionId)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  return (
    <footer
      dir={isArabic ? 'rtl' : 'ltr'}
      className="mt-24 bg-[#111b31] px-6 py-16 text-white lg:px-10 xl:px-12"
    >
      <div className="w-full">
        <div className={`grid gap-12 lg:grid-cols-[1.25fr_0.7fr_0.7fr_0.8fr] ${isArabic ? 'text-right' : ''}`}>
          <div>
            <div className={`flex items-center gap-4 ${isArabic ? 'justify-start lg:justify-end' : ''}`}>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white p-2">
                <img
                  src={logo}
                  alt="InVera logo"
                  className="max-h-full max-w-full object-contain"
                />
              </div>

              <div>
                <p className="text-3xl font-semibold tracking-tight text-white">
                  InVera
                </p>
              </div>
            </div>

            <p className="mt-8 max-w-xl text-lg leading-9 text-slate-300">
              {copy.description}
            </p>

            <div className="mt-8 space-y-4 text-base text-slate-200">
              <a href="mailto:contact@invera.tn" className="flex items-start gap-3 hover:text-white">
                <Mail className="mt-1 h-5 w-5 flex-none" />
                <span>contact@invera.tn</span>
              </a>

              <div className="flex items-start gap-3">
                <MapPin className="mt-1 h-5 w-5 flex-none" />
                <span>Tunis, Tunisie</span>
              </div>

              <a href="tel:+21624244269" className="flex items-start gap-3 hover:text-white">
                <Phone className="mt-1 h-5 w-5 flex-none" />
                <span>+216 24 244 269</span>
              </a>
            </div>

            <div className={`mt-8 flex flex-wrap gap-4 ${isArabic ? 'lg:justify-end' : ''}`}>
              <Link
                to="/login"
                className="rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/5"
              >
                {copy.login}
              </Link>

              <Link
                to="/register"
                className="rounded-xl bg-[#2563eb] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1d4ed8]"
              >
                {copy.register}
              </Link>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white">
              {copy.product}
            </h3>

            <div className="mt-6 space-y-4 text-lg text-slate-300">
              <button
                type="button"
                onClick={() => handleSection('more-information')}
                className="block transition hover:text-white"
              >
                {copy.features}
              </button>

              <button
                type="button"
                onClick={() => handleSection('subscriptions')}
                className="block transition hover:text-white"
              >
                {copy.subscriptions}
              </button>

              <button
                type="button"
                onClick={() => handleSection('more-information')}
                className="block transition hover:text-white"
              >
                {copy.moreInformation}
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white">
              {copy.company}
            </h3>

            <div className="mt-6 space-y-4 text-lg text-slate-300">
              <Link to="/contact" className="block transition hover:text-white">
                {copy.contact}
              </Link>

              <Link to="/welcome" className="block transition hover:text-white">
                InVera
              </Link>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white">
              {copy.legal}
            </h3>

            <div className="mt-6 space-y-4 text-lg text-slate-300">
              <Link to="/conditions-invera" className="block transition hover:text-white">
                {copy.conditions}
              </Link>

              <Link to="/conditions-invera" className="block transition hover:text-white">
                {copy.privacy}
              </Link>
            </div>
          </div>
        </div>

        <div className={`mt-14 flex flex-col gap-6 border-t border-white/10 pt-8 text-sm text-slate-400 lg:flex-row lg:items-center lg:justify-between ${isArabic ? 'lg:flex-row-reverse' : ''}`}>
          <p>
            © {new Date().getFullYear()} InVera ERP. {copy.rights}
          </p>

          <div className={`flex items-center gap-4 ${isArabic ? 'lg:flex-row-reverse' : ''}`}>
            <a href="#" aria-label="LinkedIn" className="transition hover:text-white">
              <Linkedin className="h-6 w-6" />
            </a>
            <a href="#" aria-label="Facebook" className="transition hover:text-white">
              <Facebook className="h-6 w-6" />
            </a>
            <a href="#" aria-label="Instagram" className="transition hover:text-white">
              <Instagram className="h-6 w-6" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default PublicFooter;
