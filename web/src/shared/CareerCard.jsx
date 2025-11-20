/**
 * CareerCard Component
 * 
 * A reusable card component for displaying career paths.
 * Used on the LandingPage to show different career options.
 * 
 * Props:
 * - title: Career title (e.g., "Full Stack Developer")
 * - description: Brief description of the career path
 * - icon: Icon component from lucide-react (optional)
 * - onClick: Click handler function
 * - color: Tailwind color class for accent (default: "indigo")
 * 
 * Customization:
 * - Change colors by passing different color prop
 * - Modify card size via className prop
 */

import { motion } from 'framer-motion';

export default function CareerCard({ title, description, icon: Icon, onClick, color = 'indigo' }) {
  const colorMap = {
    indigo: { border: 'border-indigo-500', bg: 'bg-indigo-100', text: 'text-indigo-600' },
    blue: { border: 'border-blue-500', bg: 'bg-blue-100', text: 'text-blue-600' },
    green: { border: 'border-green-500', bg: 'bg-green-100', text: 'text-green-600' },
    purple: { border: 'border-purple-500', bg: 'bg-purple-100', text: 'text-purple-600' },
    red: { border: 'border-red-500', bg: 'bg-red-100', text: 'text-red-600' },
    yellow: { border: 'border-yellow-500', bg: 'bg-yellow-100', text: 'text-yellow-600' },
  };
  
  const colorClasses = colorMap[color] || colorMap.indigo;
  
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`card cursor-pointer border-l-4 ${colorClasses.border} hover:shadow-lg transition-shadow`}
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        {Icon && (
          <div className={`p-3 rounded-lg ${colorClasses.bg}`}>
            <Icon className={`w-6 h-6 ${colorClasses.text}`} />
          </div>
        )}
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-600">{description}</p>
        </div>
      </div>
    </motion.div>
  );
}

