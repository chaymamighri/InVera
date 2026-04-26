import axios from 'axios';
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  SUPPORTED_LANGUAGES,
} from '../i18n/translations';

const LANGUAGE_API_BASE_URL = 'http://localhost:8081/api';

const getAuthToken = () => sessionStorage.getItem('token') || localStorage.getItem('token') || localStorage.getItem('adminToken');

const createLanguageRequestConfig = () => {
  const token = getAuthToken();
  const language = getStoredLanguage();

  return {
    baseURL: LANGUAGE_API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'Accept-Language': language,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
};

export const getStoredLanguage = () => {
  const value = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return SUPPORTED_LANGUAGES.includes(value) ? value : DEFAULT_LANGUAGE;
};

export const storeLanguage = (language) => {
  localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
};

export const applyLanguageToDocument = (language) => {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = language;
  document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
};

export const getLanguagePreference = async () => {
  const response = await axios.get(
    '/users/me/preferences/language',
    createLanguageRequestConfig()
  );
  return response.data;
};

export const updateLanguagePreference = async (language) => {
  const response = await axios.put(
    '/users/me/preferences/language',
    { language },
    createLanguageRequestConfig()
  );
  return response.data;
};
