/**
 * SidebarContext - Gère l'état du menu latéral (ouvert/fermé)
 * 
 * UTILISATION :
 * 
 * 1. Dans App.jsx, envelopper l'application :
 *    <SidebarProvider>
 *      <App />
 *    </SidebarProvider>
 * 
 * 2. Dans n'importe quel composant :
 *    const { collapsed, toggleSidebar } = useSidebar();
 * 
 *    - collapsed = true  → menu réduit
 *    - collapsed = false → menu ouvert
 *    - toggleSidebar()   → change l'état
 * 
 * 3. Pour adapter les styles selon l'état :
 *    className={collapsed ? 'w-20' : 'w-64'}
 */

import React, { createContext, useContext, useState } from 'react';

const SidebarContext = createContext();

// Hook à utiliser dans les composants
export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar doit être utilisé dans un SidebarProvider');
  }
  return context;
};

// Provider à mettre à la racine
export const SidebarProvider = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);

  const toggleSidebar = () => setCollapsed(prev => !prev);

  return (
    <SidebarContext.Provider value={{ collapsed, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
};