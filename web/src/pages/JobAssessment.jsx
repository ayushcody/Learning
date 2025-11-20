/**
 * JobAssessment Component
 * 
 * Job-focused assessment page to compute skill gaps.
 * Features:
 * - Multiple choice questions
 * - Skill gap analysis
 * - Recommendations based on results
 * 
 * Props:
 * - None (uses React Router)
 * 
 * Environment Variables:
 * - None directly
 * 
 * Customization:
 * - Add more questions
 * - Modify skill gap calculation
 * - Change recommendations logic
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';

export default function JobAssessment() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const navigate = useNavigate();

  const questions = [
    {
      id: 1,
      question: 'Which HTTP method is used to create a new resource?',
      options: ['GET', 'POST', 'PUT', 'DELETE'],
      correct: 'POST',
    },
    {
      id: 2,
      question: 'What does CSS stand for?',
      options: ['Cascading Style Sheets', 'Computer Style Sheets', 'Creative Style Sheets', 'Colorful Style Sheets'],
      correct: 'Cascading Style Sheets',
    },
    {
      id: 3,
      question: 'Which of the following is a JavaScript framework?',
      options: ['Python', 'React', 'Java', 'C++'],
      correct: 'React',
    },
  ];

  const handleAnswer = (answer) => {
    setAnswers({ ...answers, [currentQuestion]: answer });
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowResults(true);
    }
  };

  const calculateResults = () => {
    let correct = 0;
    questions.forEach((q, index) => {
      if (answers[index] === q.correct) correct++;
    });
    return { correct, total: questions.length, percentage: Math.round((correct / questions.length) * 100) };
  };

  if (showResults) {
    const results = calculateResults();
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center">
          <h2 className="text-2xl font-bold mb-4">Assessment Results</h2>
          <div className="mb-6">
            <div className="text-4xl font-bold text-indigo-600 mb-2">
              {results.percentage}%
            </div>
            <p className="text-gray-600">
              {results.correct} out of {results.total} correct
            </p>
          </div>
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold mb-2">Skill Gap Analysis</h3>
            <p className="text-sm text-gray-700">
              {results.percentage >= 80
                ? 'Great job! You have a solid foundation. Continue with advanced topics.'
                : results.percentage >= 50
                ? 'Good progress! Focus on the areas you missed.'
                : 'Keep learning! We recommend starting with the basics.'}
            </p>
          </div>
          <button onClick={() => navigate('/roadmap')} className="btn-primary">
            View Roadmap
          </button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];
  const selectedAnswer = answers[currentQuestion];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card">
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-gray-600">
              Question {currentQuestion + 1} of {questions.length}
            </span>
            <span className="text-sm text-gray-600">
              {Math.round(((currentQuestion + 1) / questions.length) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all"
              style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        <h2 className="text-xl font-bold mb-6">{currentQ.question}</h2>

        <div className="space-y-3 mb-6">
          {currentQ.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswer(option)}
              className={`w-full p-4 rounded-lg border-2 text-left transition-colors ${
                selectedAnswer === option
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-indigo-300'
              }`}
            >
              {option}
            </button>
          ))}
        </div>

        <button
          onClick={handleNext}
          disabled={!selectedAnswer}
          className="btn-primary w-full disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {currentQuestion < questions.length - 1 ? 'Next' : 'View Results'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

