/**
 * COMPOSANT FOOTER - Pied de page de l'application
 * 
 * @description
 * Composant de pied de page simple et configurable utilisé dans l'interface principale.
 * Il s'affiche en bas de page et contient les mentions légales et droits d'auteur.
 * 
 * @usage
 * Utilisé dans :
 * - Layout principal de l'application
 * - Pages publiques (login, register, forgot password)
 * 
 * Le footer est automatiquement masqué dans deux cas :
 * 1. Lorsque la barre latérale est réduite (collapsed = true)
 * 2. Lorsque showFooter est explicitement désactivé
 * 
 * @example
 * // Utilisation standard
 * <Footer />
 * 
 */

import React from "react";

const Footer = ({
  collapsed = false,
  showFooter = true,
  companyName = "InVera ERP",
}) => {
  // Conditions de masquage :
  // - showFooter = false : masquage manuel
  // - collapsed = true : menu latéral réduit, on masque le footer pour optimiser l'espace
  if (!showFooter || collapsed) return null;

  return (
    <footer className="p-4 text-center text-gray-500">
      <p className="text-xs text-gray-500 text-center">
        © {new Date().getFullYear()} {companyName}. Tous droits réservés.
      </p>
    </footer>
  );
};

export default Footer;