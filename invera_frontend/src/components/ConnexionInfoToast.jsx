// src/components/ConnexionInfoToast.jsx
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

const ConnexionInfoToast = () => {
  const location = useLocation();
  const hasShownToast = useRef(false);

  useEffect(() => {
    // ✅ Vérifier d'abord si l'utilisateur est authentifié
    const token = localStorage.getItem('token');
    const justLoggedIn = sessionStorage.getItem('justLoggedIn');
    
    // ❌ NE PAS AFFICHER si pas de token (connexion échouée)
    if (!token) {
      console.log('🔴 ConnexionInfoToast: Pas de token, pas d\'affichage');
      sessionStorage.removeItem('justLoggedIn');
      return;
    }
    
    // ✅ Vérifier si c'est une nouvelle connexion réussie
    if (justLoggedIn === 'true' && !hasShownToast.current) {
      hasShownToast.current = true;
      
      const typeInscription = localStorage.getItem('typeInscription');
      const connexionsRestantes = localStorage.getItem('connexionsRestantes');
      const connexionsMax = localStorage.getItem('connexionsMax');
      const hasActiveSubscription = localStorage.getItem('hasActiveSubscription') === 'true';
      const statut = localStorage.getItem('clientStatut');
      
      // ✅ Vérifier que les données sont cohérentes
      // Si connexionsRestantes est 999999 mais pas d'abonnement actif, ne pas afficher
      if (connexionsRestantes === '999999' && !hasActiveSubscription) {
        console.log('⚠️ Données incohérentes: 999999 sans abonnement actif - pas d\'affichage');
        sessionStorage.removeItem('justLoggedIn');
        hasShownToast.current = false;
        return;
      }
      
      setTimeout(() => {
        showConnexionToast({
          typeInscription,
          connexionsRestantes,
          connexionsMax,
          hasActiveSubscription,
          statut
        });
        
        sessionStorage.removeItem('justLoggedIn');
      }, 500);
    }
    
    return () => {
      if (sessionStorage.getItem('justLoggedIn') !== 'true') {
        hasShownToast.current = false;
      }
    };
  }, [location.pathname]);

  const showConnexionToast = (data) => {
    const { typeInscription, connexionsRestantes, connexionsMax, hasActiveSubscription, statut } = data;
    
    const hasNoActiveSubscription = !hasActiveSubscription;
    
    // ✅ Pour les clients AVEC abonnement actif, afficher un message simple
    if (hasActiveSubscription) {
      toast.success('🎉 Bienvenue ! Votre abonnement est actif.', { duration: 3000 });
      return;
    }
    
    // ✅ Pour les clients SANS abonnement (période d'essai)
    if (hasNoActiveSubscription && connexionsRestantes !== null && connexionsRestantes !== undefined) {
      const restantes = parseInt(connexionsRestantes);
      const max = parseInt(connexionsMax) || 30;
      
      if (restantes === 0) {
        toast.error(
          (t) => (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-red-600 text-lg">❌</span>
                <span className="font-semibold">Période d'essai expirée</span>
              </div>
              <p className="text-sm text-gray-600">
                Vous avez utilisé toutes vos {max} connexions gratuites.
                {typeInscription === 'DEFINITIF' && " Veuillez finaliser votre dossier ou souscrire un abonnement."}
              </p>
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  if (typeInscription === 'DEFINITIF' && statut === 'EN_ATTENTE') {
                    window.location.href = '/documents';
                  } else {
                    window.location.href = '/subscriptions';
                  }
                }}
                className="mt-2 px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700"
              >
                {typeInscription === 'DEFINITIF' && statut === 'EN_ATTENTE' 
                  ? 'Compléter mon dossier' 
                  : 'Souscrire un abonnement'}
              </button>
            </div>
          ),
          { duration: 8000, position: 'top-right' }
        );
      } else if (restantes <= 5) {
        toast(
          (t) => (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-orange-500 text-lg">⚠️</span>
                <span className="font-semibold">Plus que {restantes} connexion{restantes > 1 ? 's' : ''}</span>
              </div>
              <p className="text-sm text-gray-600">
                Il vous reste {restantes} connexion{restantes > 1 ? 's' : ''} sur {max}.
                {typeInscription === 'DEFINITIF' && statut === 'EN_ATTENTE' 
                  ? " Profitez-en pour finaliser votre dossier en attendant la validation."
                  : " Pensez à souscrire un abonnement pour continuer."}
              </p>
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  if (typeInscription === 'DEFINITIF' && statut === 'EN_ATTENTE') {
                    window.location.href = '/documents';
                  } else {
                    window.location.href = '/subscriptions';
                  }
                }}
                className="mt-2 px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700"
              >
                {typeInscription === 'DEFINITIF' && statut === 'EN_ATTENTE' 
                  ? '📄 Compléter mon dossier' 
                  : ' Souscrire un abonnement'}
              </button>
            </div>
          ),
          { duration: 7000, icon: '⚠️', position: 'top-right' }
        );
      } else {
        // ✅ Message pour période d'essai normale (pas 999999)
        if (restantes !== 999999) {
          toast.success(
            (t) => (
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-500 text-lg">🎯</span>
                  <span className="font-semibold">
                    {typeInscription === 'ESSAI' ? "Période d'essai" : 'Bienvenue'}
                  </span>
                </div>
                <p className="text-sm">
                  Vous disposez de <strong>{restantes} connexions restantes</strong> sur {max}.
                  {typeInscription === 'DEFINITIF' && statut === 'EN_ATTENTE' && (
                    <span className="block text-blue-600 text-xs mt-1">
                      📋 N'oubliez pas de soumettre vos justificatifs pour finaliser votre inscription.
                    </span>
                  )}
                </p>
              </div>
            ),
            { duration: 5000, position: 'top-right' }
          );
        }
      }
    }
  };

  return null;
};

export default ConnexionInfoToast;