/*import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Lock, AlertCircle, CheckCircle, Loader2, Building, Package, Calendar, CreditCard, User } from 'lucide-react';

const PaymentPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const status = searchParams.get('status');

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [payment, setPayment] = useState(null);
  const [error, setError] = useState(null);

  const api = axios.create({
    baseURL: 'http://localhost:8081',
    headers: { 'Content-Type': 'application/json' },
  });

  // Étape 1 : Charger paiement
  useEffect(() => {
    if (!token) {
      setError('Lien de paiement invalide ou manquant.');
      setLoading(false);
      return;
    }

    const fetchPayment = async () => {
      try {
        const { data } = await api.get(`/paiement/checkout?token=${token}`);
        console.log('📦 Paiement chargé:', data);
        setPayment(data);
      } catch (err) {
        console.error('❌ Erreur chargement:', err);
        setError(err.response?.data?.message || 'Lien expiré ou invalide.');
      } finally {
        setLoading(false);
      }
    };

    fetchPayment();
  }, [token]);

  // Étape 2 : Retour paiement
  useEffect(() => {
    if (status === 'success') {
      setTimeout(() => navigate('/dashboard'), 2000);
    } else if (status === 'failure') {
      setError('Le paiement a échoué. Veuillez réessayer.');
    }
  }, [status, navigate]);

  // Étape 3 : Paiement
  const handlePay = async () => {
    if (!payment?.id || processing) return;

    console.log(' Payment ID:', payment.id);
    setProcessing(true);

    try {
      const { data } = await api.post(`/api/paiement/${payment.id}/konnect`);
      console.log(' Checkout URL:', data.checkout_url);
      window.location.href = data.checkout_url;
    } catch (err) {
      console.error('❌ Erreur paiement:', err);
      setError(err.response?.data?.message || 'Erreur lors du paiement.');
      setProcessing(false);
    }
  };

  // Chargement
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Erreur
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-6 rounded-lg shadow-lg text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Erreur</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  // Succès
  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-6 rounded-lg shadow-lg text-center max-w-md">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Paiement réussi !</h2>
          <p className="text-gray-600">Votre abonnement est activé.</p>
          <p className="text-gray-500 text-sm mt-3">Redirection vers votre espace...</p>
        </div>
      </div>
    );
  }

  // Données
  const offre = payment?.abonnement?.offreAbonnement;
  const montant = payment?.montant || offre?.prix || 0;
  const offreNom = offre?.nom || 'Abonnement';
  
  // ✅ CORRECTION : Récupérer nom et prénom du client
  const clientPrenom = payment?.abonnement?.client?.prenom || '';
  const clientNom = payment?.abonnement?.client?.nom || '';
  const clientNomComplet = clientPrenom && clientNom 
    ? `${clientPrenom} ${clientNom}` 
    : clientNom || clientPrenom || 'Client';
  
  const dureeMois = offre?.dureeMois || 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">*/

        {/* Header */}
       /* <div className="text-center mb-8">
          <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
            <CreditCard className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Finaliser votre abonnement</h1>
          <p className="text-gray-600 mt-1">Veuillez vérifier vos informations</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">*/

          {/* Résumé de la commande */}
        /* <div className="p-6 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              Détails de l'abonnement
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Client</p>
                  <p className="font-medium text-gray-800">{clientNomComplet}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Package className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Offre souscrite</p>
                  <p className="font-medium text-gray-800">{offreNom}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Durée d'engagement</p>
                  <p className="font-medium text-gray-800">{dureeMois} mois</p>
                </div>
              </div>
            </div>
          </div>*/

          {/* Montant total */}
         /*<div className="bg-gray-50 p-6 border-b border-gray-100">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Montant total TTC</span>
              <span className="text-2xl font-bold text-blue-600">
                {montant.toLocaleString()} TND
              </span>
            </div>
          </div>*/

          {/* Paiement */}
          /*<div className="p-6">
            <div className="bg-green-50 rounded-xl p-4 mb-6">
              <div className="flex gap-3">
                <Lock className="w-5 h-5 text-green-600 mt-1" />
                <div>
                  <p className="text-sm font-medium text-green-800">
                    Paiement 100% sécurisé
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    Toutes les cartes bancaires sont acceptées (CIB, Visa, Mastercard)
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handlePay}
              disabled={processing}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2 shadow-md"
            >
              {processing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Traitement en cours...
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  Payer {montant.toLocaleString()} TND
                </>
              )}
            </button>

            <div className="text-center mt-6">
              <p className="text-xs text-gray-500">
                Une fois le paiement validé, votre abonnement sera activé immédiatement.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;*/