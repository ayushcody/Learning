/**
 * App Component
 * 
 * Main application component with React Router v6 routing.
 * Sets up all routes and wraps pages in Layout component.
 * 
 * Routes:
 * - /: Landing page
 * - /signup: Signup/login page
 * - /roadmap: Roadmap view
 * - /module/:stepId: Individual module/step detail
 * - /dashboard: Simple dashboard
 * - /enhanced-dashboard: Gamified dashboard
 * - /onboarding: Onboarding flow
 * - /assessment: Generic assessment
 * - /coding-assessment: Coding challenge assessment
 * - /job-assessment: Job-focused assessment
 * - /ai-assessment: AI-powered assessment
 * - /topics: Topic overview/resources
 * - /search: Topic search
 * - /profile: User profile page
 * 
 * Environment Variables:
 * - None directly (components use env vars as needed)
 * 
 * Customization:
 * - Add new routes here
 * - Modify route paths
 * - Add route guards/protected routes
 */

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import SignupFlow from './pages/SignupFlow';
import RoadmapPage from './pages/RoadmapPage';
import ModulePage from './pages/ModulePage';
import Dashboard from './pages/Dashboard';
import EnhancedDashboard from './pages/EnhancedDashboard';
import OnboardingFlow from './pages/OnboardingFlow';
import Assessment from './pages/Assessment';
import CodingAssessment from './pages/CodingAssessment';
import JobAssessment from './pages/JobAssessment';
import AIAssessment from './pages/AIAssessment';
import TopicOverview from './pages/TopicOverview';
import TopicSearch from './pages/TopicSearch';
import UserProfile from './pages/UserProfile';
import ModuleDetailPage from './pages/ModuleDetailPage';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Layout>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/signup" element={<PublicRoute><SignupFlow /></PublicRoute>} />
          <Route path="/roadmap" element={<ProtectedRoute><RoadmapPage /></ProtectedRoute>} />
          <Route path="/module/:stepId" element={<ProtectedRoute><ModulePage /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/enhanced-dashboard" element={<ProtectedRoute><EnhancedDashboard /></ProtectedRoute>} />
          <Route path="/onboarding" element={<ProtectedRoute><OnboardingFlow /></ProtectedRoute>} />
          <Route path="/assessment" element={<ProtectedRoute><Assessment /></ProtectedRoute>} />
          <Route path="/coding-assessment" element={<ProtectedRoute><CodingAssessment /></ProtectedRoute>} />
          <Route path="/job-assessment" element={<ProtectedRoute><JobAssessment /></ProtectedRoute>} />
          <Route path="/ai-assessment" element={<ProtectedRoute><AIAssessment /></ProtectedRoute>} />
          <Route path="/topics" element={<ProtectedRoute><TopicOverview /></ProtectedRoute>} />
          <Route path="/search" element={<ProtectedRoute><TopicSearch /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
          <Route path="/module-detail/:moduleId" element={<ProtectedRoute><ModuleDetailPage /></ProtectedRoute>} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;

