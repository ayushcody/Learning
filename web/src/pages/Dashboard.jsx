/**
 * Enhanced Dashboard Component
 * 
 * Comprehensive dashboard with real-time analytics, progress tracking, and gamification.
 * Features:
 * - Streak widget integration
 * - Weekly activity visualization
 * - Completed modules grid
 * - Trending topics
 * - Smart "Continue Learning" navigation
 * - Real-time stats with animations
 * 
 * Environment Variables:
 * - VITE_API_BASE: Backend API base URL
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Code, Book, Trophy, TrendingUp, Play, Calendar,
  Flame, CheckCircle, Target, Award, Clock
} from 'lucide-react';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import axios from 'axios';
import { useProgress } from '../hooks/useProgress';
import StreakWidget from '../components/StreakWidget';
import TrendingTopics from '../components/TrendingTopics';
import CompletionBadge from '../components/CompletionBadge';
import StatBox from '../shared/StatBox';
import Toast from '../shared/Toast';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [streakData, setStreakData] = useState(null);
  const navigate = useNavigate();
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });
  const { progress, isCompleted, getTotalCompleted, loading: progressLoading } = useProgress();

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      navigate('/signup');
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await loadProfile(currentUser);
        await loadStreakData(currentUser);
      } else {
        navigate('/signup');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [navigate]);

  const loadProfile = async (currentUser) => {
    try {
      if (!currentUser) return;
      const token = await currentUser.getIdToken();
      const response = await axios.get(`${API_BASE}/api/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(response.data);
    } catch (error) {
      console.error('Failed to load profile:', error);
      setProfile({ progress: {} });
    }
  };

  const loadStreakData = async (currentUser) => {
    try {
      if (!currentUser) return;
      const token = await currentUser.getIdToken();
      const response = await axios.get(`${API_BASE}/api/streak`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStreakData(response.data);
    } catch (error) {
      console.error('Failed to load streak data:', error);
    }
  };

  if (loading || progressLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  const completedCount = getTotalCompleted();
  const hasStartedRoadmap = profile?.currentRoadmap || Object.keys(progress).length > 0;
  const currentRoadmap = profile?.currentRoadmap;
  const totalSteps = currentRoadmap?.roadmap?.steps?.length ||
    (hasStartedRoadmap ? Object.keys(progress).length : 0);

  // Get completed modules for display
  const completedModules = Object.entries(progress)
    .filter(([_, p]) => p?.completed)
    .map(([stepId, p]) => ({
      id: stepId,
      completedAt: p.completedAt,
      title: stepId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    }))
    .sort((a, b) => (b.completedAt?.seconds || 0) - (a.completedAt?.seconds || 0))
    .slice(0, 6);

  // Find next incomplete step
  const getContinueLearningPath = () => {
    const progressKeys = Object.keys(progress);
    if (progressKeys.length === 0) {
      return '/roadmap';
    }
    const incompleteStep = progressKeys.find(key => !progress[key]?.completed);
    if (incompleteStep) {
      return `/module/${incompleteStep}`;
    }
    return '/roadmap';
  };

  const quickActions = [
    { label: 'Continue Learning', icon: Play, onClick: () => navigate(getContinueLearningPath()), colorClass: 'indigo' },
    { label: 'View Roadmap', icon: Book, onClick: () => navigate('/roadmap'), colorClass: 'blue' },
    { label: 'View Profile', icon: Trophy, onClick: () => navigate('/profile'), colorClass: 'purple' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-600">
          {hasStartedRoadmap
            ? `Welcome back${user?.displayName ? `, ${user.displayName}` : ''}! Keep up the great work! 🚀`
            : "Welcome! Start a learning path to track your progress."}
        </p>
      </div>

      {!hasStartedRoadmap ? (
        /* Get Started CTA */
        <div className="card text-center py-12 bg-gradient-to-br from-indigo-50 to-purple-50">
          <Target className="w-16 h-16 mx-auto mb-4 text-indigo-600" />
          <h2 className="text-2xl font-bold mb-4">Get Started</h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Choose a career path to begin your personalized learning journey with AI-powered content
          </p>
          <button
            onClick={() => navigate('/roadmap')}
            className="btn-primary text-lg px-8 py-3"
          >
            Choose Your Career Path
          </button>
        </div>
      ) : (
        <>
          {/* Streak Widget - Prominent at top */}
          <StreakWidget />

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatBox
              label="Completed Steps"
              value={completedCount}
              icon={Trophy}
              color="green"
            />
            <StatBox
              label="Total Steps"
              value={totalSteps}
              icon={Code}
              color="indigo"
            />
            <StatBox
              label="Progress"
              value={`${totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0}%`}
              icon={TrendingUp}
              color="blue"
            />
            <StatBox
              label="Current Streak"
              value={`${streakData?.current || 0} 🔥`}
              icon={Flame}
              color="orange"
            />
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                const colorMap = {
                  indigo: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border-indigo-200',
                  blue: 'bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200',
                  purple: 'bg-purple-50 hover:bg-purple-100 text-purple-600 border-purple-200',
                };
                const colorClasses = colorMap[action.colorClass] || colorMap.indigo;
                return (
                  <motion.button
                    key={action.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={action.onClick}
                    className={`p-4 rounded-xl ${colorClasses} transition-all text-left border-2 hover:shadow-lg`}
                  >
                    <Icon className="w-6 h-6 mb-2" />
                    <p className="font-semibold">{action.label}</p>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Completed Modules Grid */}
          {completedModules.length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Award className="w-6 h-6 text-green-600" />
                  Recently Completed
                </h2>
                <button
                  onClick={() => navigate('/profile')}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  View All →
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {completedModules.map((module, index) => (
                  <motion.div
                    key={module.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="card-gradient bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 hover:shadow-lg transition-all cursor-pointer"
                    onClick={() => navigate(`/module/${module.id}`)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center shadow-md shadow-green-500/30">
                        <CheckCircle className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-green-900 mb-1 line-clamp-2">
                          {module.title}
                        </h3>
                        <div className="flex items-center gap-1 text-xs text-green-700">
                          <Clock className="w-3 h-3" />
                          <span>
                            {module.completedAt
                              ? new Date(module.completedAt.seconds * 1000).toLocaleDateString()
                              : 'Recently'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Trending Topics */}
          <TrendingTopics limit={6} />

          {/* Recent Activity */}
          <div className="card">
            <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {Object.entries(progress)
                .filter(([_, p]) => p?.completed || p?.attempts > 0)
                .slice(0, 5)
                .map(([stepId, p]) => (
                  <div key={stepId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium">
                          {stepId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </p>
                        <p className="text-sm text-gray-600">
                          {p.completed ? 'Completed' : `${p.attempts} attempt(s)`}
                        </p>
                      </div>
                    </div>
                    {p.completed && <CompletionBadge completed={true} size="sm" showLabel={false} />}
                  </div>
                ))}
              {Object.keys(progress).length === 0 && (
                <p className="text-gray-500 text-center py-4">No activity yet. Start learning!</p>
              )}
            </div>
          </div>
        </>
      )}

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.visible}
        onClose={() => setToast({ visible: false, message: '', type: 'info' })}
      />
    </div>
  );
}
