/**
 * ModulePage Component
 * 
 * Detail view for a single roadmap step (module).
 * Features:
 * - Displays step content or project challenge
 * - Quick stats (duration, difficulty, type)
 * - "Open in IDE" button for projects
 * - Fetches step data from roadmap
 * 
 * Props:
 * - None (uses React Router params)
 * 
 * Environment Variables:
 * - VITE_API_BASE: Backend API base URL
 * 
 * Customization:
 * - Modify step detail layout
 * - Add more metadata fields
 * - Customize IDE integration
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Code, Book, Clock, TrendingUp, ArrowLeft } from 'lucide-react';
import ProjectIDE from '../components/ProjectIDE';
import { sampleRoadmap } from '../data/sampleRoadmap';
import axios from 'axios';
import Toast from '../shared/Toast';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

export default function ModulePage() {
  const { stepId } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(null);
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showIDE, setShowIDE] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });

  useEffect(() => {
    loadRoadmap();
  }, [stepId]);

  const loadRoadmap = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/roadmap/fsd_r1`);
      setRoadmap(response.data);
      const foundStep = response.data.steps.find((s) => s.id === stepId);
      setStep(foundStep);
    } catch (error) {
      console.warn('Failed to load roadmap, using sample data:', error);
      setRoadmap(sampleRoadmap);
      const foundStep = sampleRoadmap.steps.find((s) => s.id === stepId);
      setStep(foundStep);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading module...</div>
      </div>
    );
  }

  if (!step) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold mb-4">Module not found</h2>
        <button onClick={() => navigate('/roadmap')} className="btn-primary">
          Back to Roadmap
        </button>
      </div>
    );
  }

  const handleSuccess = () => {
    setToast({ visible: true, message: 'Congratulations! You completed this challenge!', type: 'success' });
    setTimeout(() => {
      navigate('/roadmap');
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/roadmap')}
        className="flex items-center gap-2 text-gray-600 hover:text-indigo-600"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Roadmap
      </button>

      <div className="card">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{step.title}</h1>
            <div className="flex items-center gap-4 text-gray-600">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span>{step.est}</span>
              </div>
              <div className="flex items-center gap-2">
                {step.type === 'project' ? (
                  <Code className="w-5 h-5 text-purple-600" />
                ) : (
                  <Book className="w-5 h-5 text-blue-600" />
                )}
                <span className="capitalize">{step.type}</span>
              </div>
            </div>
          </div>
        </div>

        {!showIDE ? (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-3">Overview</h2>
              <p className="text-gray-700 leading-relaxed">{step.content}</p>
            </div>

            {/* Link to Full Topic Overview with AI-generated content */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Learn More</h3>
              <p className="text-blue-800 mb-4">
                Get AI-generated content including YouTube courses, learning path, and more for this topic.
              </p>
              <button
                onClick={() => navigate('/topics', {
                  state: {
                    topic: step.title,
                  }
                })}
                className="btn-primary flex items-center gap-2"
              >
                <Book className="w-5 h-5" />
                View Full Topic Content
              </button>
            </div>

            {step.type === 'project' && step.challenge && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="font-semibold text-purple-900 mb-2">Coding Challenge</h3>
                <p className="text-purple-800 mb-4">{step.challenge.notes}</p>
                <button
                  onClick={() => setShowIDE(true)}
                  className="btn-primary flex items-center gap-2"
                >
                  <Code className="w-5 h-5" />
                  Open in IDE
                </button>
              </div>
            )}
          </div>
        ) : (
          <div>
            <button
              onClick={() => setShowIDE(false)}
              className="mb-4 text-gray-600 hover:text-indigo-600 flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Overview
            </button>
            <ProjectIDE
              stepId={step.id}
              challenge={step.challenge}
              stepTitle={step.title}
              onSuccess={handleSuccess}
            />
          </div>
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

