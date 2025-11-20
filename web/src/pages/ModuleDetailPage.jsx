import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Clock, Play } from 'lucide-react';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import axios from 'axios';
import Toast from '../shared/Toast';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

export default function ModuleDetailPage() {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [module, setModule] = useState(null);
  const [allModules, setAllModules] = useState([]);
  const [moduleProgress, setModuleProgress] = useState({});
  const [topic, setTopic] = useState('');
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });
  const [readOnlyNavigation, setReadOnlyNavigation] = useState(false);

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        loadModuleProgress(currentUser);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const stateData = location.state;
    if (stateData) {
      setModule(stateData.module);
      setAllModules(stateData.allModules || []);
      setTopic(stateData.topic || '');
      // If navigation came from roadmap, hide prev/next in this view
      if (typeof stateData.readOnlyNavigation !== 'undefined') {
        setReadOnlyNavigation(!!stateData.readOnlyNavigation);
      }
    }
  }, [location.state]);

  const loadModuleProgress = async (currentUser) => {
    try {
      const token = await currentUser.getIdToken();
      const response = await axios.get(`${API_BASE}/api/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data?.moduleProgress) {
        setModuleProgress(response.data.moduleProgress);
      }
    } catch (error) {
      console.error('Failed to load module progress:', error);
    }
  };

  const markModuleComplete = async () => {
    if (!user || !module) return;
    
    try {
      const token = await user.getIdToken();
      await axios.post(`${API_BASE}/api/mark-module-complete`, 
        { moduleId: module.id, topicId: topic },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      loadModuleProgress(user);
      setToast({ visible: true, message: 'Module marked as complete!', type: 'success' });
    } catch (error) {
      setToast({ visible: true, message: 'Failed to mark module complete', type: 'error' });
    }
  };

  const getCurrentModuleIndex = () => {
    return allModules.findIndex(m => m.id === moduleId);
  };

  const getPrevModule = () => {
    const currentIndex = getCurrentModuleIndex();
    return currentIndex > 0 ? allModules[currentIndex - 1] : null;
  };

  const getNextModule = () => {
    const currentIndex = getCurrentModuleIndex();
    return currentIndex < allModules.length - 1 ? allModules[currentIndex + 1] : null;
  };

  const navigateToModule = (targetModule) => {
    navigate(`/module-detail/${targetModule.id}`, {
      state: {
        module: targetModule,
        allModules,
        topic
      }
    });
  };

  if (!module) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading module...</div>
      </div>
    );
  }

  const isCompleted = moduleProgress[topic]?.[module.id]?.completed;
  const prevModule = getPrevModule();
  const nextModule = getNextModule();

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/topics', { state: { topic } })}
        className="flex items-center gap-2 text-gray-600 hover:text-indigo-600"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to {topic}
      </button>

      <div className="card">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              {isCompleted && (
                <CheckCircle className="w-6 h-6 text-green-600" />
              )}
              <h1 className="text-3xl font-bold">{module.name}</h1>
            </div>
            <div className="flex items-center gap-4 text-gray-600 mb-4">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {module.duration}
              </span>
              <span>Module {getCurrentModuleIndex() + 1} of {allModules.length}</span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Topics Covered</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {module.topics?.map((tpc, index) => (
                <button
                  key={index}
                  onClick={() => navigate('/topics', { state: { topic: tpc } })}
                  className="text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span className="font-medium">{tpc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Learning Objectives</h3>
            <p className="text-blue-800">
              By the end of this module, you will understand the core concepts of {module.name} 
              and be able to apply them in practical scenarios.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {!readOnlyNavigation && prevModule && (
              <button
                onClick={() => navigateToModule(prevModule)}
                className="btn-secondary flex items-center gap-2"
              >
                ← Previous: {prevModule.name}
              </button>
            )}

            {!isCompleted && (
              <button
                onClick={markModuleComplete}
                className="btn-primary bg-green-600 hover:bg-green-700 flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Mark as Complete
              </button>
            )}

            {!readOnlyNavigation && nextModule && (
              <button
                onClick={() => navigateToModule(nextModule)}
                className="btn-primary flex items-center gap-2"
              >
                Next: {nextModule.name} →
              </button>
            )}
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