/**
 * OnboardingFlow Component
 * 
 * Multi-step onboarding flow for new users.
 * Steps:
 * 1. Choose role
 * 2. Baseline assessment questions
 * 3. Set goals
 * 
 * Props:
 * - None (uses React Router)
 * 
 * Environment Variables:
 * - None directly
 * 
 * Customization:
 * - Add more onboarding steps
 * - Modify questions
 * - Change flow order
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Check } from 'lucide-react';

export default function OnboardingFlow() {
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState('');
  const [answers, setAnswers] = useState({});
  const navigate = useNavigate();

  const roles = [
    { id: 'fullstack', label: 'Full Stack Developer', description: 'Learn both frontend and backend' },
    { id: 'frontend', label: 'Frontend Developer', description: 'Focus on user interfaces' },
    { id: 'backend', label: 'Backend Developer', description: 'Build APIs and servers' },
  ];

  const questions = [
    { id: 'experience', text: 'What is your programming experience?', type: 'radio', options: ['Beginner', 'Intermediate', 'Advanced'] },
    { id: 'goal', text: 'What is your primary goal?', type: 'radio', options: ['Learn new skills', 'Career change', 'Build projects'] },
    { id: 'time', text: 'How many hours per week can you dedicate?', type: 'radio', options: ['< 5 hours', '5-10 hours', '> 10 hours'] },
  ];

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    // Save onboarding data to profile
    navigate('/dashboard');
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Step {step} of 3</span>
            <span className="text-sm text-gray-500">{Math.round((step / 3) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(step / 3) * 100}%` }}
              className="bg-indigo-600 h-2 rounded-full"
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="text-2xl font-bold mb-6">Choose Your Learning Path</h2>
              <div className="space-y-4">
                {roles.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => setSelectedRole(role.id)}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-colors ${
                      selectedRole === role.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-indigo-300'
                    }`}
                  >
                    <h3 className="font-semibold mb-1">{role.label}</h3>
                    <p className="text-sm text-gray-600">{role.description}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="text-2xl font-bold mb-6">Tell Us About Yourself</h2>
              <div className="space-y-6">
                {questions.map((question) => (
                  <div key={question.id}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {question.text}
                    </label>
                    <div className="space-y-2">
                      {question.options.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setAnswers({ ...answers, [question.id]: option })}
                          className={`w-full p-3 rounded-lg border text-left transition-colors ${
                            answers[question.id] === option
                              ? 'border-indigo-500 bg-indigo-50'
                              : 'border-gray-200 hover:border-indigo-300'
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="text-2xl font-bold mb-6">You're All Set!</h2>
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-gray-600 mb-6">
                  Ready to start your learning journey? Let's begin!
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <button
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
            className="btn-secondary flex items-center gap-2 disabled:opacity-50"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </button>
          <button
            onClick={handleNext}
            className="btn-primary flex items-center gap-2"
          >
            {step === 3 ? 'Get Started' : 'Next'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

