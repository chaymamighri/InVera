// src/components/ConnexionInfoToast.jsx
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

const ConnexionInfoToast = () => {
  const location = useLocation();
  const hasShownToast = useRef(false);

  useEffect(() => {
    // Vérifier si c'est une nouvelle connexion
    const justLoggedIn = sessionStorage.getItem('justLoggedIn');
    
    console.log('🔍 ConnexionInfoToast - justLoggedIn:', justLoggedIn);
    console.log('🔍 ConnexionInfoToast - pathname:', location.pathname);
    
    if (justLoggedIn === 'true' && !hasShownToast.current) {
      // Marquer comme affiché pour éviter les doublons
      hasShownToast.current = true;
      
      // Récupérer les informations depuis localStorage
      const typeInscription = localStorage.getItem('typeInscription');
      const connexionsRestantes = localStorage.getItem('connexionsRestantes');
      const connexionsMax = localStorage.getItem('connexionsMax');
      const hasActiveSubscription = localStorage.getItem('hasActiveSubscription') === 'true';
      const statut = localStorage.getItem('clientStatut');
      
      console.log('📊 Données toast:', { typeInscription, connexionsRestantes, connexionsMax, hasActiveSubscription, statut });
      
      // Petit délai pour laisser le temps au dashboard de se charger
      setTimeout(() => {
        showConnexionToast({
          typeInscription,
          connexionsRestantes,
          connexionsMax,
          hasActiveSubscription,
          statut
        });
        
        // Supprimer le flag
        sessionStorage.removeItem('justLoggedIn');
      }, 500);
    }
    
    // Réinitialiser le flag quand on change de page (sauf si c'est une nouvelle connexion)
    return () => {
      if (sessionStorage.getItem('justLoggedIn') !== 'true') {
        hasShownToast.current = false;
      }
    };
  }, [location.pathname]);

  const showConnexionToast = (data) => {
    const { typeInscription, connexionsRestantes, connexionsMax, hasActiveSubscription, statut } = data;
    
    console.log('🎯 Affichage toast - type:', typeInscription, 'connexions:', connexionsRestantes);
    
    // Pour TOUS les clients sans abonnement actif
    const hasNoActiveSubscription = !hasActiveSubscription;
    
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
        toast.success(
          (t) => (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-emerald-500 text-lg">🎯</span>
                <span className="font-semibold">
                  {typeInscription === 'ESSAI' ? 'Période d\'essai' : 'Bienvenue'}
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
      return;
    }
    
    // Cas spécifiques DEFINITIF
    if (typeInscription === 'DEFINITIF' && hasActiveSubscription) {
      toast.success('🎉 Bienvenue ! Votre abonnement est actif.', { duration: 3000 });
    } else if (typeInscription === 'DEFINITIF' && statut === 'VALIDE_EN_ATTENTE_PAIEMENT') {
      toast.info(
        (t) => (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-blue-500 text-lg">✅</span>
              <span className="font-semibold">Dossier validé !</span>
            </div>
            <p className="text-sm">Procédez au paiement pour activer votre compte.</p>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                window.location.href = '/payment';
              }}
              className="mt-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
            >
              Procéder au paiement
            </button>
          </div>
        ),
        { duration: 7000, position: 'top-right' }
      );
    } else if (statut === 'REFUSE') {
      toast.error(
        (t) => (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-red-600 text-lg">⛔</span>
              <span className="font-semibold">Compte refusé</span>
            </div>
            <p className="text-sm">Votre dossier a été refusé. Vous n'avez plus accès.</p>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                localStorage.clear();
                sessionStorage.clear();
                window.location.href = '/login';
              }}
              className="mt-2 px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
            >
              Déconnexion
            </button>
          </div>
        ),
        { duration: 0, position: 'top-center' }
      );
    }
  };

  return null;
};

export default ConnexionInfoToast;