/**
 * SkillModal Component
 * 
 * Modal component for displaying skill details, resources, and prerequisites.
 * Used to show additional information about roadmap steps.
 * 
 * Props:
 * - isOpen: Boolean to control modal visibility
 * - onClose: Function to close the modal
 * - skill: Skill/step object with details
 * 
 * Customization:
 * - Modify resource link styling
 * - Add more resource types (videos, articles, courses)
 * - Change modal size and layout
 */

import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Book, Video, Link as LinkIcon } from 'lucide-react';

export default function SkillModal({ isOpen, onClose, skill }) {
  if (!isOpen || !skill) return null;

  // Mock resources (you can extend this to fetch from API)
  const resources = [
    { type: 'article', title: 'MDN Documentation', url: 'https://developer.mozilla.org' },
    { type: 'video', title: 'YouTube Tutorial', url: 'https://youtube.com' },
    { type: 'link', title: 'Official Docs', url: 'https://example.com' },
  ];

  const getResourceIcon = (type) => {
    switch (type) {
      case 'video':
        return Video;
      case 'article':
        return Book;
      default:
        return LinkIcon;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>

            <h2 className="text-2xl font-bold mb-4">{skill.title}</h2>
            <p className="text-gray-600 mb-6">{skill.content}</p>

            <div className="space-y-6">
              {/* Resources */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Resources</h3>
                <div className="space-y-2">
                  {resources.map((resource, index) => {
                    const Icon = getResourceIcon(resource.type);
                    return (
                      <a
                        key={index}
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <Icon className="w-5 h-5 text-indigo-600" />
                        <span className="flex-1">{resource.title}</span>
                        <ExternalLink className="w-4 h-4 text-gray-400" />
                      </a>
                    );
                  })}
                </div>
              </div>

              {/* Prerequisites */}
              {skill.prerequisites && skill.prerequisites.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Prerequisites</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    {skill.prerequisites.map((prereq, index) => (
                      <li key={index}>{prereq}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Notes */}
              {skill.challenge?.notes && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">Challenge Notes</h3>
                  <p className="text-blue-800">{skill.challenge.notes}</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

