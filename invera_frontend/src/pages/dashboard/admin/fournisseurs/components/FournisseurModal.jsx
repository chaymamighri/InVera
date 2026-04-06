/**
 * FournisseurModal - Modal générique pour les fournisseurs
 * 
 * RÔLE : Afficher une fenêtre modale avec overlay pour la création/modification
 * 
 * FONCTIONNALITÉS :
 * - Overlay semi-transparent avec blur
 * - Fermeture au clic sur l'overlay
 * - Contenu dynamique (children)
 * - Centrage vertical/horizontal
 * - Largeur max: 512px (max-w-lg)
 * 
 * @param {boolean} isOpen - Ouvre/ferme le modal
 * @param {Function} onClose - Ferme le modal (clic overlay)
 * @param {ReactNode} children - Contenu du modal (formulaire)
 */

const FournisseurModal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">

        {/* Body */}
        <div className="px-6 py-6">
          {children}
        </div>

      </div>
    </div>
  );
};

export default FournisseurModal;