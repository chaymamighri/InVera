// src/pages/dashboard/sales/reports/components/ReportCard.jsx

/**
 * ReportCard - Carte des rapports
 * 
 * Affiche une carte cliquable pour accéder à un rapport.
 * 
 * @param {string} title - Titre du rapport
 * @param {string} description - Description
 * @param {string} icon - Emoji (💰, 📊, etc.)
 * @param {string} link - Lien de navigation
 * @param {string[]} formats - Formats (PDF, Excel)
 * @param {Object} stats - Statistique optionnelle
 * @param {string} color - Couleur (blue, green, purple, orange)
 */
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const ReportCard = ({ 
  title, 
  description, 
  icon, 
  link, 
  formats,
  stats = null,
  color = 'blue'
}) => {
  const navigate = useNavigate();

  const colorClasses = {
    blue: 'bg-blue-50 hover:bg-blue-100 border-blue-200',
    green: 'bg-green-50 hover:bg-green-100 border-green-200',
    purple: 'bg-purple-50 hover:bg-purple-100 border-purple-200',
    orange: 'bg-orange-50 hover:bg-orange-100 border-orange-200'
  };

  const iconColors = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    orange: 'text-orange-600'
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      className={`
        ${colorClasses[color]} p-6 rounded-xl shadow-sm border cursor-pointer
        transition-all duration-200
      `}
      onClick={() => navigate(link)}
    >
      <div className={`text-4xl mb-4 ${iconColors[color]}`}>{icon}</div>
      
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm text-gray-600 mb-4">{description}</p>
      
      {/* Statistiques optionnelles */}
      {stats && (
        <div className="mb-4 p-3 bg-white/50 rounded-lg">
          <p className="text-xs text-gray-500">{stats.label}</p>
          <p className="text-xl font-bold">{stats.value}</p>
        </div>
      )}
      
      {/* Formats disponibles */}
      <div className="flex gap-2">
        {formats.map(format => (
          <span 
            key={format} 
            className="text-xs bg-white/80 px-2 py-1 rounded-full shadow-sm"
          >
            {format === 'PDF' ? '📄' : '📊'} {format}
          </span>
        ))}
      </div>

      {/* Indicateur de navigation */}
      <div className="mt-4 text-right text-gray-400">
        <span className="text-sm">Voir plus →</span>
      </div>
    </motion.div>
  );
};

export default ReportCard;