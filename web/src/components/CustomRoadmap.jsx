/**
 * CustomRoadmap Component
 * 
 * Visual roadmap/timeline component that displays roadmap steps
 * with progress indicators and click-to-open functionality.
 * 
 * Props:
 * - roadmap: Roadmap object with { steps[] }
 * - userProgress: User progress object from Firestore (optional)
 * - onStepClick: Callback when a step is clicked
 * 
 * Customization:
 * - Modify timeline styling (vertical vs horizontal)
 * - Change step card design
 * - Adjust progress indicator colors
 * - Add animations for step completion
 */

import { motion } from 'framer-motion';
import { CheckCircle, Circle, Code, Book } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CustomRoadmap({ roadmap, userProgress = {}, onStepClick }) {
  const navigate = useNavigate();

  const handleStepClick = (step) => {
    if (onStepClick) {
      onStepClick(step);
    } else {
      navigate(`/module/${step.id}`);
    }
  };

  const getStepStatus = (stepId) => {
    const progress = userProgress[stepId];
    if (progress?.completed) return 'completed';
    if (progress?.attempts > 0) return 'in-progress';
    return 'not-started';
  };

  return (
    <div className="space-y-4">
      {roadmap?.steps?.map((step, index) => {
        const status = getStepStatus(step.id);
        const Icon = step.type === 'project' ? Code : Book;
        
        return (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => handleStepClick(step)}
            className="card cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-indigo-500"
          >
            <div className="flex items-start gap-4">
              {/* Status Icon */}
              <div className="flex-shrink-0 mt-1">
                {status === 'completed' ? (
                  <CheckCircle className="w-6 h-6 text-green-500" />
                ) : status === 'in-progress' ? (
                  <Circle className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                ) : (
                  <Circle className="w-6 h-6 text-gray-300" />
                )}
              </div>

              {/* Step Content */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-lg font-semibold">{step.title}</h3>
                  {step.type === 'project' && (
                    <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded">
                      Project
                    </span>
                  )}
                </div>
                <p className="text-gray-600 mb-2">{step.content}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>⏱️ {step.est}</span>
                  <span>#{step.seq}</span>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

