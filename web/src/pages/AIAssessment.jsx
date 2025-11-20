/**
 * AIAssessment Component
 * 
 * Two-phase assessment:
 * 1. Experience level question
 * 2. 7 questions based on experience level
 * Uses Gemini AI to generate questions and analyze results
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lightbulb, ArrowRight, CheckCircle, XCircle, Loader, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import Toast from '../shared/Toast';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';
const LOADING_MESSAGES = [
  'Brewing brain teasers just for you...',
  'Hold on tight—Gemini is flexing its neurons!',
  'Grab a cup of coffee while we craft your quiz.',
  'We are cooking something tasty for your brain!',
  'Don’t forget to blink! The next question is spicy.',
  'Teaching robots humor is harder than these questions...',
  'Quick! Think of your favorite bug fix dance.',
];

const TOPIC_QUESTION_RULES = [
  { pattern: /full\s*stack/i, count: 10 },
  { pattern: /data\s*science/i, count: 12 },
  { pattern: /machine\s*learning/i, count: 10 },
  { pattern: /data\s*analyst|analytics/i, count: 8 },
  { pattern: /frontend|backend/i, count: 9 },
];

const determineQuestionCount = (topic = '') => {
  const match = TOPIC_QUESTION_RULES.find((rule) => rule.pattern.test(topic));
  if (match) return match.count;
  const estimated = Math.round(topic.split(' ').length / 2) + 5;
  return Math.min(Math.max(estimated, 5), 12);
};

export default function AIAssessment() {
  const location = useLocation();
  const navigate = useNavigate();
  const [phase, setPhase] = useState('experience'); // 'experience' or 'questions'
  const [experienceLevel, setExperienceLevel] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [hint, setHint] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });
  const [answerFeedback, setAnswerFeedback] = useState(null);
  const [answeredQuestions, setAnsweredQuestions] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [assessmentResults, setAssessmentResults] = useState(null);
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);
  const [waitingForNext, setWaitingForNext] = useState(false);
  const [playfulMessage, setPlayfulMessage] = useState(LOADING_MESSAGES[0]);

  const topic = location.state?.topic || location.state?.roleId || 'the topic';
  const roleId = location.state?.roleId;
  const returnTo = location.state?.returnTo || '/dashboard';
  const desiredQuestionCount = useMemo(() => determineQuestionCount(topic), [topic]);

  useEffect(() => {
    // If we have questions already (from state), use them
    if (location.state?.questions && location.state.questions.length > 0) {
      setQuestions(location.state.questions);
      setPhase('questions');
    }
  }, [location]);

  useEffect(() => {
    if (!generatingQuestions) return undefined;
    const interval = setInterval(() => {
      setPlayfulMessage((prev) => {
        const currentIndex = LOADING_MESSAGES.indexOf(prev);
        const nextIndex = (currentIndex + 1) % LOADING_MESSAGES.length;
        return LOADING_MESSAGES[nextIndex];
      });
    }, 2500);
    return () => clearInterval(interval);
  }, [generatingQuestions]);

  const showToast = (message, type = 'info') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast({ visible: false, message: '', type: 'info' }), 3000);
  };

  const handleExperienceSelect = async (level) => {
    setExperienceLevel(level);
    setGeneratingQuestions(true);
    setPhase('questions');

    try {
      // Generate questions based on experience level
      const response = await axios.post(`${API_BASE}/api/generate-assessment`, {
        topic: topic,
        difficulty: level,
        count: desiredQuestionCount,
      });

      if (response.data.success && response.data.questions) {
        setQuestions(response.data.questions);
        setQuestionIndex(0);
        setScore(0);
        setSelectedAnswer(null);
        setAnsweredQuestions([]);
        setAnswerFeedback(null);
        setWaitingForNext(false);
        setHint('');
      } else {
        showToast('Failed to generate questions', 'error');
        setPhase('experience');
      }
    } catch (error) {
      console.error('Error generating questions:', error);
      showToast(error.response?.data?.error || 'Failed to generate questions', 'error');
      setPhase('experience');
    } finally {
      setGeneratingQuestions(false);
    }
  };

  const handleGetHint = async () => {
    if (!questions[questionIndex]) return;
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/api/hint`, {
        user_code: '',
        failing_test: '',
        step_title: questions[questionIndex].question,
        hint_level: 1,
      });
      setHint(response.data.hint);
      showToast('Hint received!', 'info');
    } catch (error) {
      showToast('Failed to get hint', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (index) => {
    if (waitingForNext) return;
    setSelectedAnswer(index);
  };

  const handleSubmit = () => {
    if (selectedAnswer === null) {
      showToast('Please select an answer', 'warning');
      return;
    }

    const currentQuestion = questions[questionIndex];
    const isCorrect = currentQuestion.correctAnswer !== undefined
      ? selectedAnswer === currentQuestion.correctAnswer
      : true;

    // Show immediate feedback
    setAnswerFeedback({
      isCorrect,
      explanation: currentQuestion.explanation || (isCorrect ? 'Correct!' : 'Incorrect. Try again!'),
      correctAnswer: currentQuestion.correctAnswer,
    });
    setWaitingForNext(true);

    // Track answered questions
    setAnsweredQuestions((prev) => [
      ...prev,
      {
        questionId: currentQuestion.id,
        selectedAnswer,
        isCorrect,
        question: currentQuestion.question,
      },
    ]);

    if (isCorrect) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNextStep = () => {
    setAnswerFeedback(null);
    setWaitingForNext(false);
    setHint('');
    if (questionIndex < questions.length - 1) {
      setQuestionIndex((prev) => prev + 1);
      setSelectedAnswer(null);
    } else {
      analyzeResults();
    }
  };

  const analyzeResults = async () => {
    setLoading(true);
    try {
      // Send results to server for analysis
      const response = await axios.post(`${API_BASE}/api/analyze-assessment`, {
        topic: topic,
        experienceLevel: experienceLevel,
        answeredQuestions: answeredQuestions,
        score: score,
        totalQuestions: questions.length,
      });

      if (response.data.success) {
        setAssessmentResults(response.data);
        setShowResult(true);
      } else {
        // Fallback analysis
        const percentage = Math.round((score / questions.length) * 100);
        setAssessmentResults({
          score,
          percentage,
          weakAreas: answeredQuestions
            .filter(q => !q.isCorrect)
            .map(q => q.question)
            .slice(0, 3),
          recommendations: 'Focus on the topics you got wrong.',
        });
        setShowResult(true);
      }
    } catch (error) {
      console.error('Error analyzing results:', error);
      // Fallback
      const percentage = Math.round((score / questions.length) * 100);
      setAssessmentResults({
        score,
        percentage,
        weakAreas: answeredQuestions
          .filter(q => !q.isCorrect)
          .map(q => q.question)
          .slice(0, 3),
        recommendations: 'Focus on the topics you got wrong.',
      });
      setShowResult(true);
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = async () => {
    if (!assessmentResults) return;

    const threshold = location.state?.threshold || 90;
    const moduleName = location.state?.moduleName;
    const percentage = assessmentResults.percentage || Math.round((score / questions.length) * 100);
    const passed = percentage >= threshold;

    // Generate AI remarks if needed
    let remarks = '';
    if (!passed && !moduleName) {
      try {
        const response = await axios.post(`${API_BASE}/api/generate-remarks`, {
          topic: topic,
          score: assessmentResults.score || score,
          totalQuestions: questions.length,
          percentage: percentage,
          weakAreas: assessmentResults.weakAreas || [],
        });
        remarks = response.data.remarks || '';
      } catch (error) {
        console.error('Failed to generate remarks:', error);
      }
    }

    // Create comprehensive results
    const results = {
      score: assessmentResults.score || score,
      totalQuestions: questions.length,
      percentage: percentage,
      experienceLevel,
      answeredQuestions,
      weakAreas: assessmentResults.weakAreas || [],
      recommendations: assessmentResults.recommendations || '',
      passed: passed,
      remarks: remarks || assessmentResults.remarks || '',
      moduleName: moduleName,
      // Scoring for different topics
      mathScore: experienceLevel === 'Beginner' ? score * 10 : experienceLevel === 'Intermediate' ? score * 15 : score * 20,
      calculusScore: experienceLevel === 'Beginner' ? score * 10 : experienceLevel === 'Intermediate' ? score * 15 : score * 20,
      statsScore: experienceLevel === 'Beginner' ? score * 10 : experienceLevel === 'Intermediate' ? score * 15 : score * 20,
    };
    const perfectBeginner = experienceLevel === 'Beginner' && results.score === questions.length;

    // If generating roadmap (not module test), show loading state
    if (roleId && returnTo === '/roadmap') {
      setIsGeneratingRoadmap(true);
      // Navigate to roadmap which will generate the personalized roadmap
      navigate(returnTo, {
        state: {
          roleId,
          assessmentResults: results,
          autoComplete: perfectBeginner,
        },
        replace: false,
      });
    } else if (moduleName) {
      // Return to topic overview with completion status
      navigate('/topics', {
        state: {
          topic: topic.replace(` - ${moduleName}`, ''),
          moduleCompleted: passed,
          moduleName: moduleName,
          assessmentResults: results,
        },
        replace: false,
      });
    } else {
      // For topic search assessments without roleId, go back to search or dashboard
      if (returnTo === '/search') {
        navigate(returnTo, {
          state: {
            assessmentComplete: true,
            assessmentResults: results,
          },
          replace: false,
        });
      } else {
        navigate('/dashboard', {
          state: {
            assessmentResults: results,
          },
          replace: false,
        });
      }
    }
  };

  // Experience selection phase
  if (phase === 'experience') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card">
          <h2 className="text-2xl font-bold mb-4">AI-Powered Assessment</h2>
          <p className="text-gray-600 mb-6">
            Let's start by understanding your current experience level with {topic}
          </p>

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">What is your current experience level?</h3>
            <div className="space-y-3">
              {['Beginner', 'Intermediate', 'Advanced'].map((level, index) => (
                <button
                  key={level}
                  onClick={() => handleExperienceSelect(level)}
                  disabled={generatingQuestions}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-colors ${experienceLevel === level
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-indigo-300'
                    } ${generatingQuestions ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{level}</span>
                    {generatingQuestions && experienceLevel === level && (
                      <Loader className="w-5 h-5 animate-spin text-indigo-600" />
                    )}
                  </div>
                </button>
              ))}
            </div>
            {generatingQuestions && (
              <div className="mt-4 text-center text-gray-600">
                <Loader className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-600" />
                <p>{playfulMessage}</p>
              </div>
            )}
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

  // Questions phase
  if (phase === 'questions' && questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-indigo-600" />
          <p className="text-gray-600">{playfulMessage}</p>
        </div>
      </div>
    );
  }

  // Results phase
  if (showResult && assessmentResults) {
    const threshold = location.state?.threshold || 90;
    const moduleName = location.state?.moduleName;
    const percentage = assessmentResults.percentage || Math.round((score / questions.length) * 100);
    const passed = percentage >= threshold;

    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center">
          <h2 className="text-3xl font-bold mb-4">Assessment Complete!</h2>
          <div className="mb-6">
            <div className={`text-6xl font-bold mb-2 ${passed ? 'text-green-600' : 'text-indigo-600'}`}>
              {percentage}%
            </div>
            <p className="text-gray-600">You scored {assessmentResults.score || score} out of {questions.length}</p>
            {moduleName && (
              <p className="text-sm text-gray-500 mt-2">
                {passed ? (
                  <span className="text-green-600 font-semibold">✓ Module Completed! (Threshold: {threshold}%)</span>
                ) : (
                  <span className="text-orange-600">Need {threshold}% to complete (You have {percentage}%)</span>
                )}
              </p>
            )}
          </div>
          <div className="mb-6">
            {passed ? (
              <div className="flex items-center justify-center gap-2 text-green-600 mb-2">
                <CheckCircle className="w-6 h-6" />
                <span className="font-semibold">Excellent! Module Completed!</span>
              </div>
            ) : percentage >= 70 ? (
              <div className="flex items-center justify-center gap-2 text-orange-600 mb-2">
                <XCircle className="w-6 h-6" />
                <span className="font-semibold">Good! Keep practicing to reach {threshold}%</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 text-red-600 mb-2">
                <XCircle className="w-6 h-6" />
                <span className="font-semibold">Keep practicing!</span>
              </div>
            )}
          </div>

          {assessmentResults.weakAreas && assessmentResults.weakAreas.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 text-left">
              <h3 className="font-semibold mb-2">Areas to Focus On:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                {assessmentResults.weakAreas.slice(0, 3).map((area, idx) => (
                  <li key={idx}>{area}</li>
                ))}
              </ul>
            </div>
          )}

          {assessmentResults.recommendations && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 text-left">
              <h3 className="font-semibold mb-2">Recommendations:</h3>
              <p className="text-sm text-gray-700">{assessmentResults.recommendations}</p>
            </div>
          )}

          {!passed && assessmentResults.remarks && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-4 text-left">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                AI-Generated Focus Areas:
              </h3>
              <p className="text-sm text-gray-700">{assessmentResults.remarks}</p>
            </div>
          )}

          <button
            onClick={handleFinish}
            disabled={isGeneratingRoadmap}
            className="btn-primary disabled:opacity-50"
          >
            {isGeneratingRoadmap ? (
              <>
                <Loader className="w-4 h-4 animate-spin mr-2" />
                Creating your personalized roadmap...
              </>
            ) : (
              moduleName ? 'Continue' : (roleId ? 'Continue to Roadmap' : 'Continue')
            )}
          </button>
        </div>
      </div>
    );
  }

  // Question display
  const currentQuestion = questions[questionIndex];

  if (!currentQuestion) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-indigo-600" />
          <p className="text-gray-600">Loading question...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card">
        <div className="mb-4">
          <h2 className="text-2xl font-bold mb-2">AI-Powered Assessment</h2>
          <p className="text-gray-600 mb-2">Topic: {topic} | Level: {experienceLevel}</p>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Question {questionIndex + 1} of {questions.length}</span>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">{currentQuestion.question}</h3>

          {currentQuestion.options ? (
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={waitingForNext || !!answerFeedback}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-colors ${selectedAnswer === index
                      ? 'border-indigo-500 bg-indigo-50'
                      : answerFeedback && index === currentQuestion.correctAnswer
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-indigo-300'
                    } ${answerFeedback ? 'cursor-default' : ''}`}
                >
                  {option}
                </button>
              ))}
            </div>
          ) : (
            <textarea
              className="input-field min-h-[150px]"
              placeholder="Type your answer here..."
            />
          )}
        </div>

        {/* Immediate Feedback */}
        {answerFeedback && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`rounded-lg p-4 mb-4 border-2 ${answerFeedback.isCorrect
                ? 'bg-green-50 border-green-500'
                : 'bg-red-50 border-red-500'
              }`}
          >
            <div className="flex items-center gap-2 mb-2">
              {answerFeedback.isCorrect ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              <span className={`font-semibold ${answerFeedback.isCorrect ? 'text-green-900' : 'text-red-900'
                }`}>
                {answerFeedback.isCorrect ? 'Correct!' : 'Incorrect'}
              </span>
            </div>
            <p className={`text-sm ${answerFeedback.isCorrect ? 'text-green-800' : 'text-red-800'
              }`}>
              {answerFeedback.explanation}
            </p>
            {!answerFeedback.isCorrect && answerFeedback.correctAnswer !== undefined && currentQuestion.options && (
              <p className="text-sm text-gray-700 mt-2">
                Correct answer: {currentQuestion.options[answerFeedback.correctAnswer]}
              </p>
            )}
          </motion.div>
        )}

        {hint && !answerFeedback && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              Hint
            </h4>
            <p className="text-blue-800">{hint}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-3 items-center">
          <button
            onClick={handleGetHint}
            disabled={loading || waitingForNext || !!answerFeedback}
            className="btn-secondary flex items-center gap-2 disabled:opacity-50"
          >
            <Lightbulb className="w-4 h-4" />
            Get Hint
          </button>
          <button
            onClick={handleSubmit}
            disabled={selectedAnswer === null || loading || waitingForNext || !!answerFeedback}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            Submit Answer
            <ArrowRight className="w-4 h-4" />
          </button>
          {waitingForNext && (
            <button
              onClick={handleNextStep}
              disabled={loading}
              className="btn-secondary flex items-center gap-2 disabled:opacity-50"
            >
              {loading && questionIndex === questions.length - 1 ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Analyzing results...
                </>
              ) : (
                <>
                  {questionIndex === questions.length - 1 ? 'See Results' : 'Next Question'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          )}
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
