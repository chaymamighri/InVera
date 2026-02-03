// Service d'authentification mocké pour le développement
export const login = async (credentials) => {
  // Simule un délai API
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Validation basique
  if (!credentials.email || !credentials.password) {
    throw new Error('Email et mot de passe requis');
  }

  // Mock d'une réponse réussie
  return {
    success: true,
    data: {
      user: {
        id: 1,
        email: credentials.email,
        name: 'Utilisateur Test'
      },
      token: 'mock-jwt-token-123456'
    }
  };
};

export const logout = async () => {
  return { success: true };
};

export const forgotPassword = async (email) => {
  await new Promise(resolve => setTimeout(resolve, 800));
  return { success: true, message: 'Email envoyé' };
};