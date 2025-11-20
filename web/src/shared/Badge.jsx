/**
 * Badge Component
 * 
 * A small badge component for displaying achievements, status, or labels.
 * Used throughout the app for gamification elements.
 * 
 * Props:
 * - children: Badge text or content
 * - variant: Color variant ("primary", "success", "warning", "danger", "info")
 * - size: Size variant ("sm", "md", "lg")
 * - className: Additional CSS classes
 * 
 * Customization:
 * - Add new variants in the variantClasses object
 * - Modify sizes in the sizeClasses object
 */

export default function Badge({ children, variant = 'primary', size = 'md', className = '' }) {
  const variantClasses = {
    primary: 'bg-indigo-100 text-indigo-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
  };
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2',
  };
  
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}>
      {children}
    </span>
  );
}

