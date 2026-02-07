// authHeader.js - AJOUTEZ DU LOGGING
export const authHeader = () => {
  const token = localStorage.getItem('token');

  if (!token) {
    console.warn('🔒 Non authentifié: pas de token');
    return {};
  }

  const cleanedToken = token.replace(/^"|"$/g, '').trim();
  const normalizedToken = cleanedToken.startsWith('Bearer ') ? cleanedToken.slice(7) : cleanedToken;
  
  console.log('🔑 Token envoyé dans authHeader:', normalizedToken.substring(0, 20) + '...');
  
  return {
    Authorization: `Bearer ${normalizedToken}`,
  };
};