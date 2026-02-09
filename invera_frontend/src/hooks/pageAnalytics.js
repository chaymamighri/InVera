import { useState } from 'react';

export const useStatistiques = () => {
  const [statistiques] = useState({
    // 🔹 Totaux globaux
    totals: {
      ventes: 78000,
      achats: 46500,
    },

    // 🔹 Comparaison mensuelle globale
    monthlyComparison: [
      { month: 'Jan', ventes: 21000, achats: 13000 },
      { month: 'Feb', ventes: 26000, achats: 15000 },
      { month: 'Mar', ventes: 31000, achats: 18500 },
    ],

    // 🔹 Responsables + rapports
    responsables: [
      {
        name: 'Responsable Vente 1',
        type: 'vente',

        daily: [
          { day: 'Mon', amount: 1200 },
          { day: 'Tue', amount: 1500 },
          { day: 'Wed', amount: 1800 },
          { day: 'Thu', amount: 1600 },
          { day: 'Fri', amount: 2000 },
        ],

        weekly: [
          { week: 'Week 1', amount: 8200 },
          { week: 'Week 2', amount: 9400 },
          { week: 'Week 3', amount: 11000 },
        ],
      },

      {
        name: 'Responsable Vente 2',
        type: 'vente',

        daily: [
          { day: 'Mon', amount: 900 },
          { day: 'Tue', amount: 1200 },
          { day: 'Wed', amount: 1400 },
          { day: 'Thu', amount: 1300 },
          { day: 'Fri', amount: 1700 },
        ],

        weekly: [
          { week: 'Week 1', amount: 6700 },
          { week: 'Week 2', amount: 7800 },
          { week: 'Week 3', amount: 9200 },
        ],
      },

      {
        name: 'Responsable Achat',
        type: 'achat',

        daily: [
          { day: 'Mon', amount: 800 },
          { day: 'Tue', amount: 950 },
          { day: 'Wed', amount: 1100 },
          { day: 'Thu', amount: 1000 },
          { day: 'Fri', amount: 1300 },
        ],

        weekly: [
          { week: 'Week 1', amount: 5200 },
          { week: 'Week 2', amount: 6100 },
          { week: 'Week 3', amount: 7000 },
        ],
      },
    ],
  });

  return { statistiques };
};
