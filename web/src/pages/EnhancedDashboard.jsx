/**
 * EnhancedDashboard Component
 * 
 * Gamified dashboard with streaks, badges, and progress bars.
 * Features:
 * - Streak counter
 * - Achievement badges
 * - Detailed progress visualization
 * - Leaderboard (optional)
 * 
 * Props:
 * - None (uses React Router)
 * 
 * Environment Variables:
 * - VITE_API_BASE: Backend API base URL
 * 
 * Customization:
 * - Modify badge system
 * - Change streak calculation logic
 * - Add more gamification elements
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Flame, Trophy, Award, Target, Star } from 'lucide-react';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import axios from 'axios';
import StatBox from '../shared/StatBox';
import Badge from '../shared/Badge';
import Toast from '../shared/Toast';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

export default function EnhancedDashboard() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });

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
      // Set a default profile structure if API fails
      setProfile({ progress: {}, stats: {} });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  const progress = profile?.progress || {};
  const completedCount = Object.values(progress).filter((p) => p?.completed).length;
  const totalSteps = 10;
  const progressPercent = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;

  // Mock gamification data (you can fetch from Firestore)
  const streak = profile?.streak || 0;
  const badges = profile?.badges || [];
  const achievements = [
    { id: 'first', label: 'First Step', icon: Star, earned: completedCount > 0 },
    { id: 'halfway', label: 'Halfway There', icon: Target, earned: progressPercent >= 50 },
    { id: 'complete', label: 'Roadmap Master', icon: Trophy, earned: progressPercent >= 100 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Enhanced Dashboard</h1>
        <p className="text-gray-600">Track your progress with gamification elements.</p>
      </div>

      {/* Streak & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatBox
          label="Days Streak"
          value={streak}
          icon={Flame}
          color="orange"
        />
        <StatBox
          label="Completed"
          value={completedCount}
          icon={Trophy}
          color="green"
        />
        <StatBox
          label="Badges Earned"
          value={badges.length}
          icon={Award}
          color="purple"
        />
        <StatBox
          label="Progress"
          value={`${progressPercent}%`}
          icon={Target}
          color="indigo"
        />
      </div>

      {/* Progress Bar */}
      <div className="card">
        <div className="flex justify-between mb-2">
          <h2 className="text-xl font-bold">Overall Progress</h2>
          <span className="text-indigo-600 font-semibold">{progressPercent}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5 }}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 h-4 rounded-full"
          />
        </div>
        <p className="text-sm text-gray-600 mt-2">
          {completedCount} of {totalSteps} steps completed
        </p>
      </div>

      {/* Achievements */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Achievements</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {achievements.map((achievement) => {
            const Icon = achievement.icon;
            return (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`p-4 rounded-lg border-2 ${
                  achievement.earned
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-8 h-8 ${
                      achievement.earned ? 'text-green-600' : 'text-gray-400'
                    }`}
                  />
                  <div>
                    <p className="font-semibold">{achievement.label}</p>
                    {achievement.earned ? (
                      <Badge variant="success" size="sm">Earned</Badge>
                    ) : (
                      <Badge variant="primary" size="sm">Locked</Badge>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Badges */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Your Badges</h2>
        {badges.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {badges.map((badge, index) => (
              <Badge key={index} variant="warning" size="lg">
                {badge}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">
            Complete challenges to earn badges!
          </p>
        )}
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

