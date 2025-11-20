/**
 * RoadmapPage Component
 * 
 * Displays job roles, then assessment, then personalized roadmap.
 * Features:
 * - Job role selection (Data Science, Full Stack Developer, Data Analyst)
 * - Assessment before showing roadmap
 * - Personalized roadmap based on assessment results
 * - Progress tracking
 * 
 * Props:
 * - None (uses React Router)
 * 
 * Environment Variables:
 * - VITE_API_BASE: Backend API base URL
 */

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, Play, TrendingUp, CheckCircle, ArrowRight, Sparkles } from 'lucide-react';
import CustomRoadmap from '../components/CustomRoadmap';
import StreakWidget from '../components/StreakWidget';
import TrendingTopics from '../components/TrendingTopics';
import CompletionBadge from '../components/CompletionBadge';
import { useProgress } from '../hooks/useProgress';
import { ROADMAPS } from '../data/roadmapsData';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import axios from 'axios';
import Toast from '../shared/Toast';
import Loading from '../components/Loading';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

// Map roadmaps data to job roles format
const JOB_ROLES = ROADMAPS.map(roadmap => ({
  id: roadmap.id,
  title: roadmap.title,
  description: roadmap.description,
  icon: roadmap.icon,
  color: 'from-indigo-500 to-purple-600', // Default gradient
  assessmentRequired: true,
  salary: roadmap.difficulty === 'Advanced' ? '₹12-20 LPA' : roadmap.difficulty === 'Intermediate' ? '₹6-12 LPA' : roadmap.difficulty.includes('Intermediate') ? '₹6-12 LPA' : '₹4-8 LPA',
  duration: roadmap.estimatedDuration,
  skills: roadmap.modules?.slice(0, 4).map(m => m.name) || [],
  demand: roadmap.inDemand ? 'High Demand' : 'Moderate Demand',
  demandColor: roadmap.inDemand ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700',
}));

export default function RoadmapPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState(null);
  const [assessmentComplete, setAssessmentComplete] = useState(false);
  const [assessmentResults, setAssessmentResults] = useState(null);
  const [roadmap, setRoadmap] = useState(null);
  const [userProgress, setUserProgress] = useState({});
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [savedRoleId, setSavedRoleId] = useState(null);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });
  const [autoCompleteApplied, setAutoCompleteApplied] = useState(false);

  useEffect(() => {
    if (!auth) {
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        loadUserProgress(currentUser);
        checkExistingRoadmap(currentUser);
      }
    });
    return () => unsubscribe();
  }, []);

  // Check if user came from assessment
  useEffect(() => {
    const assessmentData = location.state?.assessmentResults;
    const roleIdFromState = location.state?.roleId;

    if (assessmentData && roleIdFromState && !roadmap) {
      const role = JOB_ROLES.find(r => r.id === roleIdFromState);
      if (role && !loading) {
        setSelectedRole(role);
        setAssessmentResults(assessmentData);
        generatePersonalizedRoadmap(roleIdFromState, assessmentData);
      }
    }
  }, [location.state?.assessmentResults, location.state?.roleId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (roadmap && location.state?.autoComplete && !autoCompleteApplied) {
      autoCompleteRoadmap();
    }
  }, [roadmap, location.state?.autoComplete, autoCompleteApplied]);

  const checkExistingRoadmap = async (currentUser) => {
    try {
      const token = await currentUser.getIdToken();
      const response = await axios.get(`${API_BASE}/api/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data?.currentRoadmap) {
        const role = JOB_ROLES.find(r => r.id === response.data.currentRoadmap.roleId);
        if (role) {
          setSelectedRole(role);
          setAssessmentComplete(true);
          setAssessmentResults(response.data.currentRoadmap.assessmentResults);
          setRoadmap(response.data.currentRoadmap.roadmap);
          setSavedRoleId(response.data.currentRoadmap.roleId);
        }
      }
    } catch (error) {
      console.error('Failed to load existing roadmap:', error);
    }
  };

  const loadUserProgress = async (currentUser) => {
    try {
      const token = await currentUser.getIdToken();
      const response = await axios.get(`${API_BASE}/api/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data?.progress) {
        setUserProgress(response.data.progress);
      }
    } catch (error) {
      console.error('Failed to load user progress:', error);
    }
  };

  const handleRoleSelect = async (role) => {
    setSelectedRole(role);

    // Check if user already has assessment for this role
    if (user) {
      try {
        const token = await user.getIdToken();
        const response = await axios.get(`${API_BASE}/api/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const existingRoadmap = response.data?.currentRoadmap;
        if (existingRoadmap && existingRoadmap.roleId === role.id) {
          // User already has roadmap for this role, show it directly
          setAssessmentComplete(true);
          setAssessmentResults(existingRoadmap.assessmentResults);
          setRoadmap(existingRoadmap.roadmap);
          setSavedRoleId(existingRoadmap.roleId);
          return;
        }
      } catch (error) {
        console.error('Failed to check existing roadmap:', error);
      }
    }

    // No existing roadmap, start assessment
    navigate('/ai-assessment', {
      state: {
        topic: role.title,
        roleId: role.id,
        returnTo: '/roadmap',
      },
    });
  };

  const generateRoadmapForRole = async (roleId, results) => {
    setLoading(true);
    try {
      const role = JOB_ROLES.find(r => r.id === roleId);
      if (!role) {
        showToast('Invalid role selected', 'error');
        setLoading(false);
        return;
      }

      const response = await axios.post(`${API_BASE}/api/generate-topic-content`, {
        topic: role.title,
      });

      if (response.data.success && response.data.content) {
        const content = response.data.content;
        const modules = content.learningPath?.modules || [];

        let roadmapSteps = [];
        if (modules.length > 0) {
          roadmapSteps = modules.flatMap((module, moduleIndex) => {
            return module.topics?.map((topic, topicIndex) => {
              const stepId = `${roleId}-${moduleIndex}-${topicIndex}`;
              const passed = results ? checkIfTopicPassed(topic, results) : false;

              return {
                seq: moduleIndex * 10 + topicIndex + 1,
                id: stepId,
                type: 'content',
                title: topic,
                est: module.duration || '1-2 weeks',
                content: `Learn ${topic} as part of ${module.name}`,
                moduleName: module.name,
                completed: passed,
              };
            }) || [];
          });
        }

        // Ensure we have at least some steps
        if (roadmapSteps.length === 0) {
          // Fallback: create basic roadmap steps
          roadmapSteps = [
            {
              seq: 1,
              id: `${roleId}-0`,
              type: 'content',
              title: 'Getting Started',
              est: '1 week',
              content: `Start your journey to become a ${role.title}`,
              completed: false,
            },
          ];
        }

        const generatedRoadmap = {
          id: roleId,
          role: role.title,
          description: content.description || `Personalized learning path for ${role.title}`,
          steps: roadmapSteps,
          assessmentResults: results,
        };

        setRoadmap(generatedRoadmap);
        setAssessmentComplete(true);

        // Save roadmap to user profile
        if (user) {
          try {
            const token = await user.getIdToken();
            await axios.post(
              `${API_BASE}/api/profile`,
              {
                currentRoadmap: {
                  roleId,
                  assessmentResults: results,
                  roadmap: generatedRoadmap,
                },
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );
          } catch (saveError) {
            console.error('Failed to save roadmap:', saveError);
            showToast('Roadmap generated but failed to save. Please try again later.', 'warning');
          }
        }
      } else {
        throw new Error('Failed to generate roadmap content');
      }
    } catch (error) {
      console.error('Failed to generate roadmap:', error);
      showToast('Failed to generate roadmap. Please try again.', 'error');
      // Set a basic roadmap even on error so user doesn't see blank page
      const role = JOB_ROLES.find(r => r.id === roleId);
      if (role) {
        setRoadmap({
          id: roleId,
          role: role.title,
          description: `Personalized learning path for ${role.title}`,
          steps: [
            {
              seq: 1,
              id: `${roleId}-0`,
              type: 'content',
              title: 'Getting Started',
              est: '1 week',
              content: `Start your journey to become a ${role.title}`,
              completed: false,
            },
          ],
          assessmentResults: results,
        });
        setAssessmentComplete(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const generatePersonalizedRoadmap = async (roleId, results) => {
    await generateRoadmapForRole(roleId, results);
  };

  const checkIfTopicPassed = (topic, results) => {
    // Check if user passed assessment for this topic
    // This is simplified - in real app, check against actual assessment answers
    if (!results) return false;

    // Example: if topic is "Linear Algebra" and user scored well in math-related questions
    const topicLower = topic.toLowerCase();
    if (topicLower.includes('linear algebra') || topicLower.includes('algebra')) {
      return results.mathScore > 70; // Example threshold
    }
    if (topicLower.includes('calculus')) {
      return results.calculusScore > 70;
    }
    if (topicLower.includes('probability') || topicLower.includes('statistics')) {
      return results.statsScore > 70;
    }
    return false;
  };


  const handleStepClick = (step) => {
    // Navigate to topic overview with AI-generated content
    navigate('/topics', {
      state: {
        topic: step.title,
        content: null, // Will be generated
      },
    });
  };

  const showToast = (message, type = 'info') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast({ visible: false, message: '', type: 'info' }), 3000);
  };

  const autoCompleteRoadmap = async () => {
    try {
      if (!auth?.currentUser || !roadmap?.steps?.length) return;
      const token = await auth.currentUser.getIdToken();
      await Promise.all(
        roadmap.steps.map((step) =>
          axios.post(
            `${API_BASE}/api/mark-step-complete`,
            { stepId: step.id },
            { headers: { Authorization: `Bearer ${token}` } }
          )
        )
      );
      setUserProgress((prev) => {
        const updated = { ...prev };
        roadmap.steps.forEach((step) => {
          updated[step.id] = {
            completed: true,
            attempts: (updated[step.id]?.attempts || 0) + 1,
            completedAt: new Date().toISOString(),
          };
        });
        return updated;
      });
      setAutoCompleteApplied(true);
      showToast('Assessment mastered! All beginner modules unlocked.', 'success');
      navigate(location.pathname, {
        replace: true,
        state: { ...(location.state || {}), autoComplete: false },
      });
    } catch (error) {
      console.error('Auto completion failed:', error);
      showToast('Could not sync assessment progress. Please retry later.', 'error');
    }
  };

  const calculateStats = () => {
    if (!roadmap?.steps) return { total: 0, completed: 0, inProgress: 0 };

    const total = roadmap.steps.length;
    let completed = 0;
    let inProgress = 0;

    roadmap.steps.forEach((step) => {
      const progress = userProgress[step.id];
      if (step.completed || progress?.completed) completed++;
      else if (progress?.attempts > 0) inProgress++;
    });

    return { total, completed, inProgress };
  };

  // Show loading state while generating roadmap
  if (loading) {
    return <Loading message="Creating your personalized roadmap..." />;
  }

  // Show job role selection if no role selected
  if (!selectedRole || !assessmentComplete || !roadmap) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">Choose Your Career Path</h1>
          <p className="text-gray-600">Select a job role to get a personalized learning roadmap</p>
        </div>

        <p className="text-center text-gray-600 mb-8">
          Select a job role to get a personalized learning roadmap with AI-generated content based on your assessment
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {JOB_ROLES.map((role, index) => (
            <motion.div
              key={role.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="card cursor-pointer hover:shadow-xl transition-all hover:scale-[1.02]"
            >
              <div className={`w-full h-32 bg-gradient-to-br ${role.color} rounded-lg flex items-center justify-center mb-4 text-5xl font-bold text-white`}>
                {role.icon}
              </div>

              <div className="flex items-start justify-between mb-2">
                <h3 className="text-xl font-bold">{role.title}</h3>
                <span className={`px-2 py-1 rounded text-xs font-medium ${role.demandColor}`}>
                  {role.demand}
                </span>
              </div>

              <p className="text-gray-600 mb-4 text-sm">{role.description}</p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Average Salary:</span>
                  <span className="font-semibold text-green-600">{role.salary}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Time to Complete:</span>
                  <span className="font-semibold">{role.duration}</span>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Key Skills:</p>
                <div className="flex flex-wrap gap-1">
                  {role.skills.slice(0, 3).map((skill, idx) => (
                    <span key={idx} className="px-2 py-1 bg-gray-100 rounded text-xs">
                      {skill}
                    </span>
                  ))}
                  {role.skills.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                      +{role.skills.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => handleRoleSelect(role)}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                {savedRoleId === role.id ? 'Continue Learning' : 'Start Assessment'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </div>

        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={toast.visible}
          onClose={() => setToast({ visible: false, message: '', type: 'info' })}
        />
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return <Loading message="Generating your personalized roadmap..." />;
  }

  // Show roadmap
  const stats = calculateStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">{roadmap?.role || selectedRole.title}</h1>
          <p className="text-gray-600">{roadmap?.description}</p>
          {assessmentResults && (
            <div className="mt-2 flex items-center gap-2 text-sm text-indigo-600">
              <Sparkles className="w-4 h-4" />
              <span>Personalized based on your assessment</span>
            </div>
          )}
        </div>
        <button
          onClick={() => {
            const nextIncompleteStep = roadmap.steps.find(
              step => !step.completed && !userProgress[step.id]?.completed
            );
            if (nextIncompleteStep) {
              handleStepClick(nextIncompleteStep);
            } else {
              navigate('/');
            }
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Play className="w-5 h-5" />
          {roadmap.steps.find(s => !s.completed && !userProgress[s.id]?.completed) ? 'Continue Learning' : 'Go Home'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Roadmap Steps */}
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="text-xl font-bold mb-4">Learning Modules</h2>
            <div className="space-y-4">
              {roadmap.steps.map((step, index) => {
                const isCompleted = step.completed || userProgress[step.id]?.completed;
                const prevStep = index > 0 ? roadmap.steps[index - 1] : null;
                const nextStep = index < roadmap.steps.length - 1 ? roadmap.steps[index + 1] : null;

                return (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-5 rounded-xl border-2 transition-all hover:shadow-lg ${isCompleted
                      ? 'border-green-400 bg-gradient-to-br from-green-50 to-emerald-50 hover:border-green-500'
                      : 'border-gray-200 bg-white hover:border-indigo-300'
                      } cursor-pointer relative overflow-hidden`}
                    onClick={() => handleStepClick(step)}
                  >
                    {isCompleted && (
                      <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-bl-full" />
                    )}
                    <div className="flex items-start justify-between relative z-10">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {isCompleted && (
                            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shadow-md shadow-green-500/30">
                              <CheckCircle className="w-5 h-5 text-white" />
                            </div>
                          )}
                          <h3 className={`font-semibold text-lg ${isCompleted ? 'text-green-900' : 'text-gray-900'}`}>
                            {step.title}
                          </h3>
                        </div>
                        {step.moduleName && (
                          <p className={`text-sm mb-2 ${isCompleted ? 'text-green-700' : 'text-gray-600'}`}>
                            {step.moduleName}
                          </p>
                        )}
                        <p className={`text-sm mb-3 ${isCompleted ? 'text-green-800' : 'text-gray-700'}`}>
                          {step.content}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {step.est}
                          </span>
                          {isCompleted && (
                            <span className="px-2 py-1 bg-green-200 text-green-800 rounded-full text-xs font-medium">
                              Completed ✓
                            </span>
                          )}
                        </div>

                        {/* Inline control buttons removed: open/prev/next/mark complete are available inside the module/topic view */}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Stats Panel */}
        <div className="lg:col-span-1 space-y-6">
          {/* Streak Widget */}
          <StreakWidget />

          {/* Progress Overview */}
          <div className="card sticky top-4">
            <h2 className="text-xl font-bold mb-4">Progress Overview</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Overall Progress</span>
                  <span className="font-semibold">
                    {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
                  </span>
                </div>
                <div className="progress-bar">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%`,
                    }}
                    className="progress-bar-fill"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-indigo-600" />
                    <span className="text-sm font-medium">Total Steps</span>
                  </div>
                  <span className="font-bold text-lg">{stats.total}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium">Completed</span>
                  </div>
                  <span className="font-bold text-lg text-green-600">{stats.completed}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl border border-yellow-100">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-yellow-600" />
                    <span className="text-sm font-medium">In Progress</span>
                  </div>
                  <span className="font-bold text-lg text-yellow-600">{stats.inProgress}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.visible}
        onClose={() => setToast({ visible: false, message: '', type: 'info' })}
      />
    </div>
  );
}
