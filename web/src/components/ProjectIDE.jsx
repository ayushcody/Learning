/**
 * ProjectIDE Component
 * 
 * Embedded IDE using Monaco Editor for coding challenges.
 * Features:
 * - Code editing with syntax highlighting
 * - Run code button (executes via /api/run-code)
 * - Hint button (level 1/2 via /api/hint)
 * - Submit button (runs all tests and saves submission)
 * - Autosave to localStorage per step
 * 
 * Props:
 * - stepId: Unique identifier for the step (used for localStorage)
 * - challenge: Challenge object with { language, initial_code, tests[], notes }
 * - stepTitle: Title of the step (for hints)
 * - onSuccess: Callback when submission passes all tests
 * 
 * Environment Variables:
 * - VITE_API_BASE: Backend API base URL (e.g., http://localhost:4000)
 * 
 * Customization:
 * - Modify Monaco editor options (theme, fontSize, etc.)
 * - Change button styles via Tailwind classes
 * - Add more hint levels or customization
 * - Adjust localStorage key format
 */

import { useState, useEffect, Suspense, lazy } from 'react';
import { Play, Lightbulb, Check, Save } from 'lucide-react';

// Lazy load Monaco Editor (saves ~2MB from initial bundle)
const Editor = lazy(() => import('@monaco-editor/react'));
import { auth } from '../firebase';
import axios from 'axios';
import Toast from '../shared/Toast';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

const LANGUAGE_MAP = {
  javascript: { id: 63, name: 'JavaScript', monaco: 'javascript' },
  python: { id: 71, name: 'Python', monaco: 'python' },
  java: { id: 62, name: 'Java', monaco: 'java' },
  cpp: { id: 54, name: 'C++', monaco: 'cpp' },
};

export default function ProjectIDE({ stepId, challenge, stepTitle, onSuccess }) {
  const [code, setCode] = useState(challenge?.initial_code || '');
  const [selectedLanguage, setSelectedLanguage] = useState(challenge?.language || 'javascript');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [hintLevel, setHintLevel] = useState(1);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });

  // Load saved code from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`code_${stepId}`);
    if (saved) {
      setCode(saved);
    }
  }, [stepId]);

  // Save code to localStorage on change
  useEffect(() => {
    if (code && stepId) {
      localStorage.setItem(`code_${stepId}`, code);
    }
  }, [code, stepId]);

  const showToast = (message, type = 'info') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast({ visible: false, message: '', type: 'info' }), 3000);
  };

  const getAuthHeader = async () => {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      return { Authorization: `Bearer ${token}` };
    }
    return {};
  };

  const formatTestOutput = (result) => {
    if (!result) return 'No result returned.';
    const lines = [];
    if (result.status) {
      lines.push(`Status: ${result.status}`);
    }
    if (result.summary) {
      lines.push(
        `Summary: Passed ${result.summary.passedCount}/${result.summary.totalCount} tests (${result.summary.percentage || 0}%)`
      );
    }
    if (Array.isArray(result.tests)) {
      result.tests.forEach((test, index) => {
        const label = test.description ? `${test.description}` : `Test ${index + 1}`;
        const detail = test.passed ? '✓ PASS' : '✗ FAIL';
        lines.push(`${label}: ${detail}`);
        if (test.actual || test.expected) {
          lines.push(`  Expected: ${test.expected}`);
          lines.push(`  Actual: ${test.actual || '(no output)'}`);
        }
        if (test.stderr) {
          lines.push(`  stderr: ${test.stderr}`);
        }
      });
    }
    return lines.join('\n');
  };

  const executeTests = async (testsToRun) => {
    const suite = Array.isArray(testsToRun) ? testsToRun : [];
    if (!suite.length) {
      throw new Error('No tests available to run');
    }
    const payload = {
      language: selectedLanguage,
      source: code,
      tests: suite,
      functionSignature: challenge?.functionSignature,
    };
    const response = await axios.post(`${API_BASE}/api/run-code`, payload);
    return response.data;
  };

  const handleRun = async () => {
    if (!challenge?.tests?.[0]) {
      showToast('No test cases available', 'error');
      return;
    }

    setLoading(true);
    setOutput('Running...');

    try {
      const result = await executeTests([challenge.tests[0]]);
      setOutput(formatTestOutput(result));
      showToast('Code executed successfully', 'success');
    } catch (error) {
      setOutput(`Error: ${error.response?.data?.message || error.message}`);
      showToast('Code execution failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleHint = async () => {
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE}/api/hint`, {
        user_code: code,
        failing_test: challenge?.tests?.[0]?.input || '',
        step_title: stepTitle || 'Coding Challenge',
        hint_level: hintLevel,
      });

      const hint = response.data.hint;
      setOutput(`💡 Hint (Level ${hintLevel}):\n${hint}`);
      setHintLevel(hintLevel === 1 ? 2 : 1); // Toggle between levels
      showToast(`Hint received (${response.data.source})`, 'info');
    } catch (error) {
      showToast('Failed to get hint', 'error');
      setOutput(`Error: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!challenge?.tests?.length) {
      showToast('No test cases available', 'error');
      return;
    }

    setLoading(true);
    setOutput('Submitting... Running all tests...\n');

    const user = auth.currentUser;
    if (!user) {
      showToast('Please sign in to submit', 'error');
      setLoading(false);
      return;
    }

    try {
      const token = await user.getIdToken();
      const execution = await executeTests(challenge.tests);
      const testResults = execution.tests || [];
      const summary = execution.summary || {};
      const allPassed =
        summary.totalCount && summary.totalCount > 0
          ? summary.passedCount === summary.totalCount
          : testResults.every((r) => r.passed);

      setOutput(formatTestOutput(execution));

      // Save submission
      try {
        await axios.post(
          `${API_BASE}/api/save-submission`,
          {
            stepId,
            passed: allPassed,
            result: { tests: testResults, summary, status: execution.status },
            source: code,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const passedTests = summary.passedCount ?? testResults.filter(r => r.passed).length;
        const totalTests = summary.totalCount ?? testResults.length;
        const percentage = summary.percentage ?? (totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0);

        if (allPassed) {
          showToast('🎉 All tests passed!', 'success');
          setOutput((prev) => `${prev}\n\n✅ All tests passed! (${percentage}%)\nGreat job!`);
          onSuccess?.({ results: testResults, allPassed, percentage, passedTests, totalTests });
        } else {
          showToast(`Passed ${passedTests}/${totalTests} tests (${percentage}%)`, 'warning');
          setOutput((prev) => `${prev}\n\n❌ Passed ${passedTests}/${totalTests} tests (${percentage}%)\nReview the output above.`);
          onSuccess?.({ results: testResults, allPassed, percentage, passedTests, totalTests });
        }
      } catch (error) {
        showToast('Failed to save submission', 'error');
        console.error('Save submission error:', error);
      }
    } catch (error) {
      showToast('Submission failed', 'error');
      setOutput(`Error: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Code Editor</h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Language:</label>
              <select
                value={selectedLanguage}
                onChange={(e) => {
                  setSelectedLanguage(e.target.value);
                  // Reset code when language changes
                  const langDefaults = {
                    javascript: challenge?.initial_code || 'function solve() {\n  // Your code here\n  return;\n}',
                    python: '# Your code here\ndef solve():\n    pass',
                    java: 'public class Solution {\n    public static void solve() {\n        // Your code here\n    }\n}',
                    cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Your code here\n    return 0;\n}',
                  };
                  setCode(langDefaults[e.target.value] || challenge?.initial_code || '');
                }}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Save className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-500">Auto-saved</span>
            </div>
          </div>
        </div>

        <Suspense fallback={
          <div className="h-[400px] flex items-center justify-center bg-gray-900 rounded-lg">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading editor...</p>
            </div>
          </div>
        }>
          <Editor
            height="400px"
            language={LANGUAGE_MAP[selectedLanguage]?.monaco || 'javascript'}
            value={code}
            onChange={(value) => setCode(value || '')}
            theme="vs-dark"
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
            }}
          />
        </Suspense>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleRun}
          disabled={loading}
          className="btn-primary flex items-center gap-2 disabled:opacity-50"
        >
          <Play className="w-4 h-4" />
          Run
        </button>
        <button
          onClick={handleHint}
          disabled={loading}
          className="btn-secondary flex items-center gap-2 disabled:opacity-50"
        >
          <Lightbulb className="w-4 h-4" />
          Hint (Level {hintLevel})
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <Check className="w-4 h-4" />
          Submit
        </button>
      </div>

      {challenge?.notes && (
        <div className="card bg-blue-50 border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-2">📝 Notes</h4>
          <p className="text-sm text-blue-800">{challenge.notes}</p>
        </div>
      )}

      {output && (
        <div className="card bg-gray-900 text-green-400 font-mono text-sm">
          <h4 className="text-white mb-2">Output</h4>
          <pre className="whitespace-pre-wrap">{output}</pre>
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
