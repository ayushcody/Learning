/**
 * TopicSearch Component
 * 
 * AI-powered search that uses Gemini AI to generate content for any topic.
 * Features:
 * - Real-time search with Gemini AI
 * - Popular topics display
 * - Generate personalized learning paths
 * 
 * Props:
 * - None (uses React Router)
 * 
 * Environment Variables:
 * - VITE_API_BASE: Backend API base URL
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Book, Sparkles, Loader } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import Toast from '../shared/Toast';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

export default function TopicSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const navigate = useNavigate();
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });

  const popularTopics = [
    { id: 'machine-learning', title: 'Machine Learning', category: 'AI/ML', difficulty: 'Intermediate' },
    { id: 'react-hooks', title: 'React Hooks', category: 'Frontend', difficulty: 'Beginner' },
    { id: 'nodejs-apis', title: 'Node.js APIs', category: 'Backend', difficulty: 'Intermediate' },
    { id: 'docker-containers', title: 'Docker Containers', category: 'DevOps', difficulty: 'Advanced' },
    { id: 'python-basics', title: 'Python Basics', category: 'Programming', difficulty: 'Beginner' },
    { id: 'data-structures', title: 'Data Structures', category: 'Computer Science', difficulty: 'Intermediate' },
    { id: 'data-science', title: 'Data Science', category: 'AI/ML', difficulty: 'Intermediate' },
  ];

  const showToast = (message, type = 'info') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast({ visible: false, message: '', type: 'info' }, 3000));
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      showToast('Please enter a search query', 'warning');
      return;
    }

    setIsGenerating(true);
    try {
      // Generate content for the topic
      const response = await axios.post(`${API_BASE}/api/generate-topic-content`, {
        topic: searchQuery
      });

      if (response.data.success && response.data.content) {
        // Navigate to topic overview with generated content
        navigate('/topics', {
          state: {
            topic: searchQuery,
            content: response.data.content
          }
        });
      } else if (response.data.fallback) {
        // Use fallback content
        navigate('/topics', {
          state: {
            topic: searchQuery,
            content: response.data.fallback
          }
        });
      } else {
        showToast('Failed to generate content. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Search error:', error);
      showToast(error.response?.data?.error || 'Failed to search. Make sure Gemini API is configured.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePopularTopicClick = (topic) => {
    navigate('/topics', {
      state: {
        topic: topic.title,
        category: topic.category,
        difficulty: topic.difficulty
      }
    });
  };

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
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2">AI-Powered Learning</h1>
        <p className="text-xl text-gray-600 mb-2">What do you want to learn?</p>
        <p className="text-sm text-gray-500">Search for any topic and get a personalized learning path</p>
      </div>

      {/* Search Input */}
      <div className="max-w-2xl mx-auto">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search for topics like 'Machine Learning', 'React', 'Python', 'Data Science'..."
            className="input-field pl-12 pr-32 text-lg py-4"
          />
          <button
            onClick={handleSearch}
            disabled={isGenerating || !searchQuery.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 btn-primary px-6 py-2 disabled:opacity-50 flex items-center gap-2"
          >
            {isGenerating ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Search
              </>
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          Powered by Gemini AI - Generate personalized learning content for any topic
        </p>
      </div>

      {/* Popular Topics */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6 text-center">Popular Topics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {popularTopics.map((topic, index) => (
            <motion.div
              key={topic.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handlePopularTopicClick(topic)}
              className="card cursor-pointer hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold mb-2 text-lg">{topic.title}</h3>
                  <p className="text-sm text-gray-600 mb-3">{topic.category}</p>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(topic.difficulty)}`}>
                    {topic.difficulty}
                  </span>
                </div>
                <Book className="w-6 h-6 text-indigo-600 flex-shrink-0 ml-4" />
              </div>
            </motion.div>
          ))}
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
