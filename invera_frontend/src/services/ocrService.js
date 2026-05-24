// src/services/ocrService.js
import api from './api';

export const validateDocumentWithOcr = async (file, type) => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    let endpoint = '';
    switch (type) {
      case 'CIN':
      case 'GERANT_CIN':
        endpoint = '/public/ocr/validate-cin';  // ← CHANGÉ
        break;
      case 'PATENTE':
        endpoint = '/public/ocr/validate-patente';  // ← CHANGÉ
        break;
      case 'RNE':
        endpoint = '/public/ocr/validate-rne';  // ← CHANGÉ
        break;
      default:
        return { valid: false, message: 'Type de document non supporté' };
    }

    console.log('📤 Appel OCR:', endpoint);

    const response = await api.post(endpoint, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    return {
      valid: response.data.valid,
      message: response.data.message,
      extractedData: response.data.extractedValue
    };
  } catch (error) {
    console.error(`Erreur validation OCR:`, error);
    return {
      valid: false,
      message: error.response?.data?.message || 'Erreur lors de la validation du document'
    };
  }
};