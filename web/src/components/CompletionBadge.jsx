/**
 * CompletionBadge Component
 * 
 * Consistent completion indicator used throughout the application.
 * Shows a green checkmark badge when a module/step is completed.
 * 
 * Props:
 * - completed: Boolean indicating if the item is completed
 * - size: 'sm' | 'md' | 'lg' (default: 'md')
 * - showLabel: Boolean to show "Completed" text (default: true)
 * - className: Additional CSS classes
 * 
 * Usage:
 * <CompletionBadge completed={true} size="lg" />
 */

import { CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CompletionBadge({
    completed,
    size = 'md',
    showLabel = true,
    className = ''
}) {
    if (!completed) return null;

    const sizeConfig = {
        sm: {
            icon: 'w-4 h-4',
            circle: 'w-6 h-6',
            text: 'text-xs',
            padding: 'px-2 py-0.5',
        },
        md: {
            icon: 'w-5 h-5',
            circle: 'w-8 h-8',
            text: 'text-sm',
            padding: 'px-2 py-1',
        },
        lg: {
            icon: 'w-6 h-6',
            circle: 'w-10 h-10',
            text: 'text-base',
            padding: 'px-3 py-1',
        },
    };

    const config = sizeConfig[size] || sizeConfig.md;

    return (
        <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className={`flex items-center gap-2 ${className}`}
        >
            <div className={`${config.circle} rounded-full bg-green-500 flex items-center justify-center shadow-md shadow-green-500/30`}>
                <CheckCircle className={`${config.icon} text-white`} />
            </div>
            {showLabel && (
                <span className={`${config.text} ${config.padding} bg-green-200 text-green-800 rounded-full font-medium`}>
                    Completed ✓
                </span>
            )}
        </motion.div>
    );
}
