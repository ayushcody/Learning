/**
 * CodingAssessment Component
 * 
 * Single coding task harness using ProjectIDE with run/submit functionality.
 * Features:
 * - Embedded ProjectIDE component
 * - Task description and requirements
 * - Submission tracking
 * 
 * Props:
 * - None (uses React Router)
 * 
 * Environment Variables:
 * - VITE_API_BASE: Backend API base URL
 * 
 * Customization:
 * - Modify challenge data
 * - Change layout
 * - Add more instructions
 */

import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Sparkles } from 'lucide-react';
import ProjectIDE from '../components/ProjectIDE';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

export default function CodingAssessment() {
  const location = useLocation();
  const navigate = useNavigate();
  const [completed, setCompleted] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [score, setScore] = useState(null);

  // Get problem from location state (AI-generated) or use default
  const problem = location.state?.problem;
  const topic = location.state?.topic || 'Coding Challenge';
  const moduleName = location.state?.moduleName;
  const threshold = location.state?.threshold || 90;

  // Convert AI-generated problem to challenge format or use default
  const challenge = problem ? {
    language: (problem.language || 'javascript').toLowerCase(),
    initial_code: problem.initialCode || problem.functionSignature || `function solve() {\n  // Your code here\n}`,
    functionSignature: problem.functionSignature || '',
    tests: problem.testCases?.map(tc => ({
      description: tc.description,
      args: Array.isArray(tc.args) ? tc.args : undefined,
      expected: typeof tc.expected === 'object' ? JSON.stringify(tc.expected) : tc.expected,
      input: tc.input,
    })) || [],
    notes: problem.description || problem.title || 'Solve the problem below.',
  } : {
    language: 'javascript',
    initial_code: `// Write a function that calculates the factorial of a number
function factorial(n) {
  // Your code here
  return 1;
}
`,
    functionSignature: 'function factorial(n)',
    tests: [
      { description: '5!', args: [5], expected: '120' },
      { description: '0!', args: [0], expected: '1' },
      { description: '3!', args: [3], expected: '6' },
    ],
    notes: 'Implement the factorial function. Remember: factorial of 0 is 1.',
  };

  const handleSuccess = async (testResults) => {
    setCompleted(true);

    // Calculate score percentage
    if (testResults && testResults.results) {
      const passedTests = testResults.results.filter(r => r.passed).length;
      const totalTests = testResults.results.length;
      const percentage = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
      setScore(percentage);

      const passed = percentage >= threshold;

      // Generate remarks if didn't pass threshold
      if (!passed) {
        try {
          const response = await axios.post(`${API_BASE}/api/generate-remarks`, {
            topic: topic,
            score: passedTests,
            totalQuestions: totalTests,
            percentage: percentage,
            weakAreas: ['Code logic', 'Problem solving'],
          });
          setRemarks(response.data.remarks || '');
        } catch (error) {
          console.error('Failed to generate remarks:', error);
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-2 text-gray-600 hover:text-indigo-600"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Dashboard
      </button>

      <div className="card">
        <h1 className="text-3xl font-bold mb-4">Coding Assessment</h1>
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">
            {problem?.title || 'Task: Factorial Function'}
            {problem?.difficulty && (
              <span className={`ml-2 px-2 py-1 rounded text-xs ${problem.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                problem.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                {problem.difficulty}
              </span>
            )}
          </h2>
          <p className="text-gray-700 mb-4">
            {problem?.description || challenge.notes}
          </p>

          {problem?.examples && problem.examples.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold mb-2">Examples:</h3>
              {problem.examples.map((example, idx) => (
                <div key={idx} className="mb-2 text-sm">
                  <p><strong>Input:</strong> {typeof example.input === 'object' ? JSON.stringify(example.input) : example.input}</p>
                  <p><strong>Output:</strong> {typeof example.output === 'object' ? JSON.stringify(example.output) : example.output}</p>
                  {example.explanation && (
                    <p className="text-gray-600 italic">{example.explanation}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {problem?.constraints && problem.constraints.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold mb-2">Constraints:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                {problem.constraints.map((constraint, idx) => (
                  <li key={idx}>{constraint}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {completed && score !== null && (
          <div className={`border-2 rounded-xl p-6 mb-6 ${score >= threshold
            ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300'
            : 'bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-300'
            }`}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {score >= threshold ? (
                  <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/30">
                    <Check className="w-10 h-10 text-white" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full bg-orange-500 flex items-center justify-center shadow-lg">
                    <Check className="w-10 h-10 text-white" />
                  </div>
                )}
                <div>
                  <p className={`text-2xl font-bold mb-1 ${score >= threshold ? 'text-green-900' : 'text-orange-900'}`}>
                    {score >= threshold ? 'Assessment Completed! 🎉' : 'Good Progress!'}
                  </p>
                  <p className={`text-lg ${score >= threshold ? 'text-green-800' : 'text-orange-800'}`}>
                    {score >= threshold
                      ? `You scored ${score}% - Module Unlocked!`
                      : `You scored ${score}% - Need ${threshold}% to complete`}
                  </p>
                </div>
              </div>
              {score >= threshold && (
                <button
                  onClick={() => navigate('/roadmap')}
                  className="btn-success flex items-center gap-2"
                >
                  Next Module
                  <ArrowRight className="w-5 h-5" />
                </button>
              )}
            </div>
            {remarks && score < threshold && (
              <div className="mt-4 pt-4 border-t border-orange-300">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  <h4 className="font-semibold">AI-Generated Focus Areas:</h4>
                </div>
                <p className="text-gray-700">{remarks}</p>
              </div>
            )}
          </div>
        )}

        <ProjectIDE
          stepId={`coding-assessment-${topic.replace(/\s+/g, '-').toLowerCase()}`}
          challenge={challenge}
          stepTitle={problem?.title || 'Coding Challenge'}
          onSuccess={handleSuccess}
        />
      </div>
    </div>
  );
}
