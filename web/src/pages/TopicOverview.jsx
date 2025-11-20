/**
 * TopicOverview Component
 * 
 * Comprehensive topic overview with AI-generated content including:
 * - What is the field (description)
 * - YouTube tutorials/courses (AI-generated links)
 * - Learning path graph/outline
 * - Key learning points and prerequisites
 * - Take Assessment button (AI-generated)
 * - Code problems (AI-generated)
 * 
 * Props:
 * - None (uses React Router location state)
 * 
 * Environment Variables:
 * - VITE_API_BASE: Backend API base URL
 */

import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Book, Video, ExternalLink, ArrowLeft, Clock, User, Star, 
  Play, Code, FileText, Loader, Sparkles, CheckCircle 
} from 'lucide-react';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import axios from 'axios';
import Toast from '../shared/Toast';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

export default function TopicOverview() {
  const location = useLocation();
  const navigate = useNavigate();
  const [topic, setTopic] = useState('Data Science');
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingAssessment, setGeneratingAssessment] = useState(false);
  const [generatingProblem, setGeneratingProblem] = useState(false);
  const [user, setUser] = useState(null);
  const [moduleProgress, setModuleProgress] = useState({});
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });

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
    const topicName = location.state?.topic || 'Data Science';
    const existingContent = location.state?.content;
    
    setTopic(topicName);
    
    if (existingContent) {
      setContent(existingContent);
      setLoading(false);
    } else {
      loadTopicContent(topicName);
    }
  }, [location]);

  const loadTopicContent = async (topicName) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/api/generate-topic-content`, {
        topic: topicName
      });

      if (response.data.success && response.data.content) {
        setContent(response.data.content);
      } else if (response.data.fallback) {
        setContent(response.data.fallback);
      } else {
        showToast('Failed to load content. Make sure Gemini API is configured.', 'error');
        // Use topic-specific default content
        setContent(getDefaultContentForTopic(topicName));
      }
    } catch (error) {
      console.error('Error loading topic content:', error);
      showToast(error.response?.data?.error || 'Failed to load content', 'error');
      setContent(getDefaultContentForTopic(topicName));
    } finally {
      setLoading(false);
    }
  };

  const getDefaultContentForTopic = (topic) => {
    const topicLower = topic.toLowerCase();
    
    // Only use Data Science defaults if topic is actually Data Science
    if (topicLower.includes('data science')) {
      return getDefaultDataScienceContent();
    }
    
    // Generic default for other topics
    return {
      description: `${topic} is an important topic that covers fundamental concepts and practical applications.`,
      keyPoints: [
        `Core concepts and fundamentals of ${topic}`,
        `Practical applications and real-world use cases`,
        `Best practices and industry standards`,
        `Common challenges and how to overcome them`,
        `Integration with other technologies and tools`
      ],
      prerequisites: [
        'Basic programming knowledge',
        'Understanding of fundamental concepts',
        'Familiarity with development tools'
      ],
      youtubeCourses: [
        {
          title: `${topic} Full Course`,
          url: 'https://www.youtube.com/results?search_query=' + encodeURIComponent(topic + ' tutorial'),
          description: `Learn ${topic} from scratch`,
          duration: 'Varies'
        }
      ],
      learningPath: {
        duration: '4-8 weeks',
        difficulty: 'Intermediate',
        modules: [
          { name: `${topic} Fundamentals`, duration: '2 weeks', topics: ['Introduction', 'Basics', 'Core Concepts'] }
        ]
      }
    };
  };

  const getDefaultDataScienceContent = () => ({
    description: 'Data Science is an interdisciplinary field that uses scientific methods, processes, algorithms, and systems to extract knowledge and insights from structured and unstructured data. It combines domain expertise, programming skills, and knowledge of mathematics and statistics to extract meaningful insights from data.',
    keyPoints: [
      'Core concepts and fundamentals of Data Science',
      'Practical applications and real-world use cases',
      'Best practices and industry standards',
      'Common challenges and how to overcome them',
      'Integration with other technologies and tools'
    ],
    prerequisites: [
      'Basic programming knowledge',
      'Understanding of fundamental concepts',
      'Familiarity with development tools'
    ],
    youtubeCourses: [
      {
        title: 'Data Science Full Course for Beginners',
        url: 'https://www.youtube.com/watch?v=ua-CiDNNj30',
        description: 'Complete Data Science course covering all fundamentals',
        duration: '12 hours'
      },
      {
        title: 'Python for Data Science and Machine Learning',
        url: 'https://www.youtube.com/watch?v=LHBE6Q9XlzI',
        description: 'Learn Python programming for data analysis',
        duration: '6 hours'
      },
      {
        title: 'Data Science with Python - Full Course',
        url: 'https://www.youtube.com/watch?v=z9iOWRJcV9w',
        description: 'Comprehensive course on data science using Python',
        duration: '10 hours'
      }
    ],
    learningPath: {
      duration: '8-12 weeks',
      difficulty: 'Intermediate',
      modules: [
        { name: 'Data Science Fundamentals', duration: '2 weeks', topics: ['Introduction', 'Data Types', 'Basic Statistics'] },
        { name: 'Data Analysis', duration: '2 weeks', topics: ['Data Cleaning', 'Exploratory Analysis', 'Visualization'] },
        { name: 'Machine Learning Basics', duration: '3 weeks', topics: ['Supervised Learning', 'Unsupervised Learning', 'Model Evaluation'] },
        { name: 'Advanced Topics', duration: '2 weeks', topics: ['Deep Learning', 'NLP', 'Time Series'] }
      ]
    }
  });

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

  const showToast = (message, type = 'info') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast({ visible: false, message: '', type: 'info' }, 3000));
  };

  const handleModuleClick = (module, allModules) => {
    // When a module is clicked from TopicOverview, open module detail but do NOT show module navigation buttons
    navigate(`/module-detail/${module.id}`, {
      state: {
        module,
        allModules,
        topic,
      }
    });
  };

  const handleTakeAssessment = async () => {
    setGeneratingAssessment(true);
    try {
      const response = await axios.post(`${API_BASE}/api/generate-assessment`, {
        topic: topic,
        difficulty: content?.learningPath?.difficulty || 'Intermediate',
        count: 5
      });

      if (response.data.success && response.data.questions) {
        navigate('/ai-assessment', { 
          state: { 
            topic: topic,
            questions: response.data.questions 
          } 
        });
      } else {
        showToast('Failed to generate assessment', 'error');
      }
    } catch (error) {
      console.error('Error generating assessment:', error);
      showToast(error.response?.data?.error || 'Failed to generate assessment', 'error');
    } finally {
      setGeneratingAssessment(false);
    }
  };

  const handleGenerateCodeProblem = async () => {
    setGeneratingProblem(true);
    try {
      const response = await axios.post(`${API_BASE}/api/generate-code-problem`, {
        topic: topic,
        difficulty: 'Easy',
        language: 'python'
      });

      if (response.data.success && response.data.problem) {
        navigate('/coding-assessment', { 
          state: { 
            topic: topic,
            problem: response.data.problem 
          } 
        });
      } else {
        showToast('Failed to generate code problem', 'error');
      }
    } catch (error) {
      console.error('Error generating code problem:', error);
      showToast(error.response?.data?.error || 'Failed to generate code problem', 'error');
    } finally {
      setGeneratingProblem(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-indigo-600" />
          <p className="text-gray-600">Generating personalized content with AI...</p>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold mb-4">Content not found</h2>
        <button onClick={() => navigate('/search')} className="btn-primary">
          Back to Search
        </button>
      </div>
    );
  }

  const getDifficultyColor = (difficulty) => {
    const colors = {
      'Beginner': 'bg-green-100 text-green-700',
      'Intermediate': 'bg-yellow-100 text-yellow-700',
      'Advanced': 'bg-red-100 text-red-700'
    };
    return colors[difficulty] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <button
        onClick={() => navigate('/search')}
        className="flex items-center gap-2 text-gray-600 hover:text-indigo-600"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Search
      </button>

      <div className="flex items-start justify-between">
      <div>
          <h1 className="text-4xl font-bold mb-2">{topic}</h1>
          <div className="flex items-center gap-4 text-gray-600">
            <span className="flex items-center gap-1">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              AI-Generated
            </span>
            <span className={`px-2 py-1 rounded text-sm font-medium ${getDifficultyColor(content.learningPath?.difficulty || 'Intermediate')}`}>
              {content.learningPath?.difficulty || 'Intermediate'} Level
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {content.learningPath?.duration || '8-12 weeks'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* What is the Field */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <Book className="w-6 h-6 text-indigo-600" />
              <h2 className="text-2xl font-bold">What is {topic}?</h2>
            </div>
            <p className="text-gray-700 leading-relaxed mb-4">{content.description}</p>

            {/* Key Learning Points */}
            <div className="mt-6">
              <h3 className="text-xl font-semibold mb-4">Key Learning Points:</h3>
              <ul className="space-y-2">
                {content.keyPoints?.map((point, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Star className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Prerequisites */}
            <div className="mt-6">
              <h3 className="text-xl font-semibold mb-4">Prerequisites</h3>
              <ul className="space-y-2">
                {content.prerequisites?.map((req, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-gray-700">{req}</span>
                  </li>
                ))}
              </ul>
            </div>
      </div>

          {/* YouTube Courses */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <Video className="w-6 h-6 text-red-600" />
              <h2 className="text-2xl font-bold">YouTube Courses</h2>
            </div>
            <p className="text-gray-600 mb-4">AI-curated full courses to get you started</p>
            <div className="space-y-4">
              {content.youtubeCourses?.map((course, index) => (
            <motion.a
              key={index}
                  href={course.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
                  className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">{course.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">{course.description}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        <span>{course.duration}</span>
                      </div>
                </div>
                    <ExternalLink className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  </div>
                </motion.a>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="card">
            <h3 className="text-lg font-bold mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Duration</p>
                  <p className="font-semibold">{content.learningPath?.duration || '8-12 weeks'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Star className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Difficulty</p>
                  <p className="font-semibold">{content.learningPath?.difficulty || 'Intermediate'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Popularity</p>
                  <p className="font-semibold">High</p>
                </div>
              </div>
            </div>
          </div>

          {/* Ready to Start */}
          <div className="card bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200">
            <h3 className="text-lg font-bold mb-3">Ready to Start?</h3>
            <p className="text-sm text-gray-700 mb-4">
              Take a quick assessment to create your personalized learning path
            </p>
            <button
              onClick={handleTakeAssessment}
              disabled={generatingAssessment}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {generatingAssessment ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Start Assessment
                </>
              )}
            </button>
          </div>

          {/* Code Problems */}
          <div className="card">
            <h3 className="text-lg font-bold mb-3">Practice Coding</h3>
            <p className="text-sm text-gray-700 mb-4">
              Solve AI-generated coding problems related to this topic
            </p>
            <button
              onClick={handleGenerateCodeProblem}
              disabled={generatingProblem}
              className="btn-secondary w-full flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {generatingProblem ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Code className="w-4 h-4" />
                  Generate Code Problem
                </>
              )}
            </button>
          </div>

          {/* Progress Overview */}
          <div className="card bg-indigo-50 border border-indigo-200">
            <h3 className="text-lg font-bold mb-3">Progress Overview</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Modules Completed:</span>
                <span className="font-semibold">
                  {content.learningPath?.modules?.filter(m => moduleProgress[topic]?.[m.id || `module-${content.learningPath.modules.indexOf(m) + 1}`]?.completed).length || 0} / {content.learningPath?.modules?.length || 0}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-indigo-600 h-2 rounded-full transition-all"
                  style={{ 
                    width: `${content.learningPath?.modules?.length ? 
                      (content.learningPath.modules.filter(m => moduleProgress[topic]?.[m.id || `module-${content.learningPath.modules.indexOf(m) + 1}`]?.completed).length / content.learningPath.modules.length) * 100 
                      : 0}%` 
                  }}
                />
              </div>
            </div>
            <p className="text-sm text-gray-700 mt-3">
              Click on modules to view details and mark them as complete.
            </p>
          </div>

          {/* Module Completion Threshold */}
          <div className="card bg-blue-50 border border-blue-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">AI</span>
              </div>
              <h3 className="font-bold">AI-Powered Learning</h3>
            </div>
            <p className="text-sm text-gray-700">
              Score <strong>90% or higher</strong> on assessments to unlock the next module. Content is personalized based on your progress.
            </p>
          </div>
        </div>
      </div>

      {/* Learning Path Graph/Outline */}
      {content.learningPath?.modules && (
        <div className="card">
          <h2 className="text-2xl font-bold mb-6">Learning Path Outline</h2>
          <div className="space-y-4">
            {content.learningPath.modules.map((module, index) => {
              const isCompleted = moduleProgress[topic]?.[module.id]?.completed;
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative pl-8 pb-6 last:pb-0"
                >
                  {/* Connection Line */}
                  {index < content.learningPath.modules.length - 1 && (
                    <div className="absolute left-3 top-8 bottom-0 w-0.5 bg-indigo-200" />
                  )}
                  
                  {/* Module Circle */}
                  <div className={`absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center ${
                    isCompleted ? 'bg-green-600' : 'bg-indigo-600'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="w-4 h-4 text-white" />
                    ) : (
                      <span className="text-white text-xs font-bold">{index + 1}</span>
                    )}
                  </div>

                  <div className={`rounded-lg p-4 cursor-pointer transition-all ${
                    isCompleted ? 'bg-green-50 border border-green-200' : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                  onClick={() => handleModuleClick({...module, id: module.id || `module-${index + 1}`}, content.learningPath.modules)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{module.name}</h3>
                        {isCompleted && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                            Completed
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-gray-500">{module.duration}</span>
                    </div>
                    {module.topics && (
                      <div className="flex flex-wrap gap-2 mt-2 mb-4">
                        {module.topics.map((topic, topicIndex) => (
                          <span
                            key={topicIndex}
                            className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {/* Assessment and Code Test Buttons */}
                    <div className="flex gap-2 mt-4" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          setGeneratingAssessment(true);
                          try {
                            const response = await axios.post(`${API_BASE}/api/generate-assessment`, {
                              topic: `${topic} - ${module.name}`,
                              difficulty: content.learningPath?.difficulty || 'Intermediate',
                              count: 5,
                            });

                            if (response.data.success && response.data.questions) {
                              navigate('/ai-assessment', { 
                                state: { 
                                  topic: `${topic} - ${module.name}`,
                                  questions: response.data.questions,
                                  moduleName: module.name,
                                  threshold: 90,
                                } 
                              });
                            }
                          } catch (error) {
                            showToast('Failed to generate assessment', 'error');
                          } finally {
                            setGeneratingAssessment(false);
                          }
                        }}
                        className="btn-primary text-sm flex items-center gap-2 flex-1"
                      >
                        <FileText className="w-4 h-4" />
                        Assessment
                      </button>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          setGeneratingProblem(true);
                          try {
                            const response = await axios.post(`${API_BASE}/api/generate-code-problem`, {
                              topic: `${topic} - ${module.name}`,
                              difficulty: 'Medium',
                              language: 'javascript'
                            });

                            if (response.data.success && response.data.problem) {
                              navigate('/coding-assessment', { 
                                state: { 
                                  topic: `${topic} - ${module.name}`,
                                  problem: response.data.problem,
                                  moduleName: module.name,
                                  threshold: 90,
                                } 
                              });
                            }
                          } catch (error) {
                            showToast('Failed to generate code problem', 'error');
                          } finally {
                            setGeneratingProblem(false);
                          }
                        }}
                        className="btn-secondary text-sm flex items-center gap-2 flex-1"
                      >
                        <Code className="w-4 h-4" />
                        Code Test
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
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
