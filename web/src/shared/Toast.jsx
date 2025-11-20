/**
 * Toast Component
 * 
 * A toast notification component for displaying success, error, or info messages.
 * Uses Framer Motion for smooth animations.
 * 
 * Props:
 * - message: Toast message text
 * - type: Toast type ("success", "error", "info", "warning")
 * - isVisible: Whether toast is visible
 * - onClose: Close handler function
 * - duration: Auto-close duration in ms (default: 3000)
 * 
 * Usage:
 * - Import and use in parent components
 * - Control visibility with isVisible prop
 * - Customize duration for different message types
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export default function Toast({ message, type = 'info', isVisible, onClose, duration = 3000 }) {
  const typeConfig = {
    success: { icon: CheckCircle, bg: 'bg-green-500', text: 'text-white' },
    error: { icon: AlertCircle, bg: 'bg-red-500', text: 'text-white' },
    info: { icon: Info, bg: 'bg-blue-500', text: 'text-white' },
    warning: { icon: AlertTriangle, bg: 'bg-yellow-500', text: 'text-white' },
  };
  
  const config = typeConfig[type] || typeConfig.info;
  const Icon = config.icon;
  
  React.useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);
  
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className={`fixed top-4 right-4 ${config.bg} ${config.text} px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 z-50 min-w-[300px]`}
        >
          <Icon className="w-5 h-5" />
          <span className="flex-1">{message}</span>
          <button
            onClick={onClose}
            className="hover:opacity-70 transition-opacity"
          >
            <X className="w-5 h-5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

