/**
 * StatBox Component
 * 
 * A stat display box component for showing metrics like progress, streaks, etc.
 * Used in Dashboard and EnhancedDashboard components.
 * 
 * Props:
 * - label: Stat label (e.g., "Days Streak")
 * - value: Stat value (number or string)
 * - icon: Icon component from lucide-react (optional)
 * - color: Tailwind color class for accent (default: "indigo")
 * - className: Additional CSS classes
 * 
 * Customization:
 * - Change icon sizes or colors via props
 * - Modify layout by adjusting className
 */

import { motion } from 'framer-motion';

export default function StatBox({ label, value, icon: Icon, color = 'indigo', className = '' }) {
  const colorMap = {
    indigo: { text: 'text-indigo-600', bg: 'bg-indigo-100' },
    blue: { text: 'text-blue-600', bg: 'bg-blue-100' },
    green: { text: 'text-green-600', bg: 'bg-green-100' },
    purple: { text: 'text-purple-600', bg: 'bg-purple-100' },
    red: { text: 'text-red-600', bg: 'bg-red-100' },
    yellow: { text: 'text-yellow-600', bg: 'bg-yellow-100' },
  };
  
  const colorClasses = colorMap[color] || colorMap.indigo;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`card ${className}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{label}</p>
          <p className={`text-3xl font-bold ${colorClasses.text}`}>{value}</p>
        </div>
        {Icon && (
          <div className={`p-3 rounded-lg ${colorClasses.bg}`}>
            <Icon className={`w-6 h-6 ${colorClasses.text}`} />
          </div>
        )}
      </div>
    </motion.div>
  );
}

