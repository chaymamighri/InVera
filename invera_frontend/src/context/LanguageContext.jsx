import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_OPTIONS,
  SUPPORTED_LANGUAGES,
  translations,
} from '../i18n/translations';
import {
  applyLanguageToDocument,
  getLanguagePreference,
  getStoredLanguage,
  storeLanguage,
  updateLanguagePreference,
} from '../services/languagePreferenceService';
import { authService } from '../services/authService';

const interpolate = (value, params = {}) =>
  String(value).replace(/\{\{(.*?)\}\}/g, (_, key) => {
    const trimmedKey = key.trim();
    return params[trimmedKey] ?? '';
  });

const resolveTranslation = (language, key) => {
  const parts = key.split('.');
  let current = translations[language];

  for (const part of parts) {
    if (!current || typeof current !== 'object') {
      return null;
    }
    current = current[part];
  }

  return typeof current === 'string' ? current : null;
};

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(getStoredLanguage());
  const [ready, setReady] = useState(false);
  const initializedRef = useRef(false);

  const setLanguage = async (nextLanguage, { syncBackend = true } = {}) => {
    const normalized = SUPPORTED_LANGUAGES.includes(nextLanguage) ? nextLanguage : DEFAULT_LANGUAGE;
    setLanguageState(normalized);
    storeLanguage(normalized);
    applyLanguageToDocument(normalized);

    if (syncBackend && authService.isAuthenticated()) {
      try {
        await updateLanguagePreference(normalized);
      } catch (error) {
        console.error('Failed to persist language preference', error);
      }
    }
  };

  const syncAuthenticatedLanguage = async ({ preferStoredSelection = false } = {}) => {
    if (!authService.isAuthenticated()) {
      return getStoredLanguage();
    }

    try {
      if (preferStoredSelection) {
        const localLanguage = getStoredLanguage();
        await updateLanguagePreference(localLanguage);
        await setLanguage(localLanguage, { syncBackend: false });
        return localLanguage;
      }

      const preference = await getLanguagePreference();
      const backendLanguage = SUPPORTED_LANGUAGES.includes(preference?.language)
        ? preference.language
        : getStoredLanguage();

      await setLanguage(backendLanguage, { syncBackend: false });
      return backendLanguage;
    } catch (error) {
      console.error('Failed to sync authenticated language', error);
      const fallback = getStoredLanguage();
      await setLanguage(fallback, { syncBackend: false });
      return fallback;
    }
  };

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const bootstrap = async () => {
      const localLanguage = getStoredLanguage();
      setLanguageState(localLanguage);
      applyLanguageToDocument(localLanguage);

      if (authService.isAuthenticated()) {
        await syncAuthenticatedLanguage();
      }

      setReady(true);
    };

    bootstrap();
  }, []);

  const t = (key, params = {}) => {
    const value =
      resolveTranslation(language, key) ??
      resolveTranslation(DEFAULT_LANGUAGE, key) ??
      key;

    return interpolate(value, params);
  };

  const value = useMemo(
    () => ({
      language,
      isArabic: language === 'ar',
      ready,
      options: LANGUAGE_OPTIONS,
      t,
      setLanguage,
      syncAuthenticatedLanguage,
    }),
    [language, ready]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
