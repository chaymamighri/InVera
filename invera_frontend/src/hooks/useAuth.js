/**
 * useAuth - Hook d'accès à l'authentification
 * 
 * Ce hook est un simple "passe-plat" vers useAuthContext.
 * Il existe pour éviter d'importer directement AuthContext partout.
 * 
 * UTILISATION :
 * const { user, login, logout, loading } = useAuth();
 * 
 * RETOURNE : Toutes les valeurs du contexte AuthContext
 * - user, loading, error, authenticated
 * - login(), logout(), refreshUser()
 * - forgotPassword(), resetPassword()
 * 
 * NOTE : Doit être utilisé dans un composant enfant de AuthProvider
 */

import { useAuthContext } from '../context/AuthContext';

export const useAuth = () => useAuthContext();

export default useAuth;