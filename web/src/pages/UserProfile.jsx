/**
 * UserProfile Component (Enhanced)
 * 
 * Comprehensive user profile with activity monitoring, progress tracking, and achievements.
 * Features:
 * - Editable profile information
 * - Enrolled roadmaps with progress bars
 * - 30-day activity heatmap
 * - Completed modules grid
 * - Skills & proficiency tracking
 * - Achievements/badges system
 * 
 * Environment Variables:
 * - VITE_API_BASE: Backend API base URL
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { onAuthStateChanged, updateProfile } from 'firebase/auth';
import axios from 'axios';
import {
  Save, Trophy, Code, Calendar, Settings, Camera,
  User as UserIcon, Award, Flame, Target, BookOpen,
  TrendingUp, CheckCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useProgress } from '../hooks/useProgress';
import { ROADMAPS, getRoadmapById } from '../data/roadmapsData';
import CompletionBadge from '../components/CompletionBadge';
import Badge from '../shared/Badge';
import Toast from '../shared/Toast';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

export default function UserProfile() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    goals: '',
    avatar: '',
  });
  const [showSettings, setShowSettings] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [streakData, setStreakData] = useState(null);
  const fileInputRef = useRef(null);
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
      const data = response.data || {};
      setProfile(data);
      setFormData({
        displayName: data.displayName || currentUser.displayName || '',
        bio: data.bio || '',
        goals: data.goals || '',
        avatar: data.avatar || currentUser.photoURL || '',
      });
      setAvatarPreview(data.avatar || currentUser.photoURL || null);
    } catch (error) {
      console.error('Failed to load profile:', error);
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

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
        setFormData({ ...formData, avatar: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const token = await user.getIdToken();
      const profileData = {
        ...profile,
        ...formData,
        email: user.email,
      };

      // Update Firebase Auth display name and photo
      const updateData = {};
      if (formData.displayName) {
        updateData.displayName = formData.displayName;
      }
      if (formData.avatar) {
        updateData.photoURL = formData.avatar;
      }
      if (Object.keys(updateData).length > 0) {
        await updateProfile(user, updateData);
      }

      // Update Firestore profile
      await axios.post(
        `${API_BASE}/api/profile`,
        profileData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setProfile(profileData);
      setToast({ visible: true, message: 'Profile saved successfully!', type: 'success' });
      setShowSettings(false);
    } catch (error) {
      setToast({ visible: true, message: 'Failed to save profile', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading || progressLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading profile...</div>
      </div>
    );
  }

  const completedCount = getTotalCompleted();
  const badges = profile?.badges || [];

  // Get member since date
  const memberSince = user?.metadata?.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Recently';

  // Get completed modules
  const completedModules = Object.entries(progress)
    .filter(([_, p]) => p?.completed)
    .map(([stepId, p]) => ({
      id: stepId,
      completedAt: p.completedAt,
      title: stepId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    }))
    .sort((a, b) => (b.completedAt?.seconds || 0) - (a.completedAt?.seconds || 0));

  // Determine enrolled roadmap (simplified - based on current roadmap or progress)
  const enrolledRoadmap = profile?.currentRoadmap?.topic || 'Full Stack Developer';
  const roadmap = getRoadmapById(enrolledRoadmap.toLowerCase().replace(/\s+/g, '-')) || ROADMAPS[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Profile</h1>
          <p className="text-gray-600">Manage your profile and track your learning journey</p>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="btn-secondary flex items-center gap-2"
        >
          <Settings className="w-4 h-4" />
          {showSettings ? 'Hide Settings' : 'Edit Profile'}
        </button>
      </div>

      {/* Profile Header */}
      <div className="card bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-indigo-600 flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
              {avatarPreview ? (
                <img src={avatarPreview} alt={formData.displayName || 'User'} className="w-full h-full object-cover" />
              ) : user?.photoURL ? (
                <img src={user.photoURL} alt={formData.displayName || 'User'} className="w-full h-full object-cover" />
              ) : (
                <span>{(formData.displayName || user?.email || 'U').charAt(0).toUpperCase()}</span>
              )}
            </div>
            {showSettings && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white hover:bg-indigo-700 transition-colors shadow-lg"
                title="Change avatar"
              >
                <Camera className="w-4 h-4" />
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-1">{formData.displayName || user?.email || 'User'}</h2>
            <p className="text-gray-600 mb-2">{user?.email}</p>
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Member since {memberSince}
              </span>
              {streakData?.current > 0 && (
                <span className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-full">
                  <Flame className="w-4 h-4" />
                  {streakData.current} day streak
                </span>
              )}
            </div>
            {formData.bio && (
              <p className="text-gray-700">{formData.bio}</p>
            )}
          </div>
        </div>
      </div>

      {/* Settings Form */}
      {showSettings && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Settings
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                className="input-field"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bio
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="input-field min-h-[100px]"
                placeholder="Tell us about yourself..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Learning Goals
              </label>
              <textarea
                value={formData.goals}
                onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
                className="input-field min-h-[100px]"
                placeholder="What are your learning goals?"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={() => {
                  setShowSettings(false);
                  loadProfile(user);
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card text-center bg-gradient-to-br from-green-50 to-emerald-50">
          <Trophy className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-green-900">{completedCount}</div>
          <div className="text-sm text-green-700">Steps Completed</div>
        </div>
        <div className="card text-center bg-gradient-to-br from-orange-50 to-red-50">
          <Flame className="w-8 h-8 text-orange-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-orange-900">{streakData?.current || 0}</div>
          <div className="text-sm text-orange-700">Current Streak</div>
        </div>
        <div className="card text-center bg-gradient-to-br from-indigo-50 to-purple-50">
          <Target className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-indigo-900">{streakData?.longest || 0}</div>
          <div className="text-sm text-indigo-700">Best Streak</div>
        </div>
        <div className="card text-center bg-gradient-to-br from-yellow-50 to-amber-50">
          <Award className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-yellow-900">{badges.length}</div>
          <div className="text-sm text-yellow-700">Badges Earned</div>
        </div>
      </div>

      {/* Enrolled Roadmap */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-indigo-600" />
          Enrolled Roadmap
        </h2>
        <div className="border-2 border-indigo-200 rounded-xl p-5 bg-gradient-to-br from-indigo-50 to-purple-50">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">{roadmap.icon}</span>
                <h3 className="text-xl font-bold">{roadmap.title}</h3>
              </div>
              <p className="text-gray-700 mb-2">{roadmap.description}</p>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>⏱ {roadmap.estimatedDuration}</span>
                <span>📊 {roadmap.difficulty}</span>
              </div>
            </div>
          </div>
          <div className="mb-2">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Progress</span>
              <span className="font-semibold">
                {roadmap.modules ? Math.min(Math.round((completedCount / roadmap.modules.length) * 100), 100) : 0}%
              </span>
            </div>
            <div className="progress-bar">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${roadmap.modules ? Math.min((completedCount / roadmap.modules.length) * 100, 100) : 0}%` }}
                className="progress-bar-fill"
              />
            </div>
          </div>
          <button
            onClick={() => navigate('/roadmap')}
            className="btn-primary w-full mt-3"
          >
            Continue Learning →
          </button>
        </div>
      </div>

      {/* Completed Modules Grid */}
      {completedModules.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-green-600" />
            Completed Modules ({completedModules.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedModules.map((module, index) => (
              <motion.div
                key={module.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.03 }}
                className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 hover:shadow-lg transition-all cursor-pointer"
                onClick={() => navigate(`/module/${module.id}`)}
              >
                <div className="flex items-start gap-3">
                  <CompletionBadge completed={true} size="md" showLabel={false} />
                  <div className="flex-1">
                    <h4 className="font-semibold text-green-900 mb-1 line-clamp-2">
                      {module.title}
                    </h4>
                    <p className="text-xs text-green-700">
                      {module.completedAt
                        ? new Date(module.completedAt.seconds * 1000).toLocaleDateString()
                        : 'Recently'}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Submissions */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {Object.entries(progress)
            .filter(([_, p]) => p?.attempts > 0)
            .slice(0, 10)
            .map(([stepId, p]) => (
              <div key={stepId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <Code className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium">
                      {stepId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </p>
                    <p className="text-sm text-gray-600">
                      {p.completed ? 'Completed' : `${p.attempts} attempt(s)`}
                    </p>
                  </div>
                </div>
                {p.completed && <Badge variant="success" size="sm">Passed</Badge>}
              </div>
            ))}
          {Object.keys(progress).length === 0 && (
            <p className="text-gray-500 text-center py-4">No submissions yet</p>
          )}
        </div>
      </div>

      {/* Achievements */}
      {badges.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Achievements</h2>
          <div className="flex flex-wrap gap-3">
            {badges.map((badge, index) => (
              <Badge key={index} variant="warning" size="lg">
                {badge}
              </Badge>
            ))}
          </div>
        </div>
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
