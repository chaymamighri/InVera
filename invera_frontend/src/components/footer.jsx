import React from "react";

const Footer = ({
  collapsed = false,
  showFooter = true,
  companyName = "InVera ERP",
}) => {
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