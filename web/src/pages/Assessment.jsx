/**
 * Assessment Component
 * 
 * Generic assessment runner with multiple choice questions and instant feedback.
 * Features:
 * - Multiple choice questions
 * - Instant feedback on selection
 * - Score tracking
 * - Results summary
 * 
 * Props:
 * - None (uses React Router)
 * 
 * Environment Variables:
 * - None directly
 * 
 * Customization:
 * - Modify question set
 * - Change feedback messages
 * - Adjust scoring logic
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, ArrowRight } from 'lucide-react';

export default function Assessment() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [results, setResults] = useState([]);
  const navigate = useNavigate();

  const questions = [
    {
      id: 1,
      question: 'What is React?',
      options: ['A library', 'A framework', 'A language', 'A database'],
      correct: 0,
    },
    {
      id: 2,
      question: 'Which hook is used for side effects?',
      options: ['useState', 'useEffect', 'useContext', 'useReducer'],
      correct: 1,
    },
    {
      id: 3,
      question: 'What is the virtual DOM?',
      options: ['Real DOM', 'JavaScript representation', 'HTML element', 'CSS selector'],
      correct: 1,
    },
  ];

  const handleSelect = (index) => {
    if (showFeedback) return;
    setSelectedAnswer(index);
  };

  const handleSubmit = () => {
    const isCorrect = selectedAnswer === questions[currentQuestion].correct;
    if (isCorrect) setScore(score + 1);
    
    setResults([...results, {
      question: questions[currentQuestion].question,
      selected: selectedAnswer,
      correct: questions[currentQuestion].correct,
      isCorrect,
    }]);
    
    setShowFeedback(true);
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
    } else {
      // Show results
    }
  };

  const finished = results.length === questions.length;

  if (finished) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center">
          <h2 className="text-2xl font-bold mb-4">Assessment Complete!</h2>
          <div className="mb-6">
            <div className="text-4xl font-bold text-indigo-600 mb-2">
              {score} / {questions.length}
            </div>
            <p className="text-gray-600">
              {Math.round((score / questions.length) * 100)}% Correct
            </p>
          </div>
          <button onClick={() => navigate('/dashboard')} className="btn-primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card">
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-gray-600">
              Question {currentQuestion + 1} of {questions.length}
            </span>
            <span className="text-sm font-semibold">Score: {score}</span>
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
          {currentQ.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrect = index === currentQ.correct;
            const showResult = showFeedback && (isSelected || isCorrect);

            return (
              <button
                key={index}
                onClick={() => handleSelect(index)}
                disabled={showFeedback}
                className={`w-full p-4 rounded-lg border-2 text-left transition-colors ${
                  showResult
                    ? isCorrect
                      ? 'border-green-500 bg-green-50'
                      : isSelected
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200'
                    : isSelected
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-indigo-300'
                } disabled:opacity-100`}
              >
                <div className="flex items-center justify-between">
                  <span>{option}</span>
                  {showResult && (
                    isCorrect ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : isSelected ? (
                      <XCircle className="w-5 h-5 text-red-600" />
                    ) : null
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <button
          onClick={showFeedback ? handleNext : handleSubmit}
          disabled={selectedAnswer === null}
          className="btn-primary w-full disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {showFeedback ? 'Next' : 'Submit'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

