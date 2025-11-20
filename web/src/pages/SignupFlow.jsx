/**
 * SignupFlow Component
 * 
 * Dedicated signup/login page with Firebase Auth.
 * Features:
 * - Sign up form
 * - Sign in form
 * - Toggle between modes
 * - Redirect after auth
 * 
 * Props:
 * - None (uses React Router)
 * 
 * Environment Variables:
 * - None directly (uses Firebase from firebase.js)
 * 
 * Customization:
 * - Modify form styling
 * - Add social auth providers
 * - Change redirect logic
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { Code } from 'lucide-react';
import Toast from '../shared/Toast';

export default function SignupFlow() {
  const [mode, setMode] = useState('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect if already signed in
    if (!auth) {
      return;
    }
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        navigate('/roadmap');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const showToast = (message, type = 'info') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast({ visible: false, message: '', type: 'info' }), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!auth) {
      setError('Authentication is not available. Please configure Firebase.');
      showToast('Authentication is not available. Please configure Firebase.', 'error');
      setLoading(false);
      return;
    }

    try {
      if (mode === 'signup') {
        await createUserWithEmailAndPassword(auth, email, password);
        showToast('Account created successfully!', 'success');
        navigate('/onboarding');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        showToast('Signed in successfully!', 'success');
        navigate('/roadmap');
      }
    } catch (err) {
      setError(err.message);
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
      <div className="w-full max-w-md">
        <div className="card">
          <div className="text-center mb-8">
            <Code className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">Roadmap MVP</h1>
            <p className="text-gray-600">
              {mode === 'signup' ? 'Create your account' : 'Welcome back'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50"
            >
              {loading ? 'Loading...' : mode === 'signup' ? 'Sign Up' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin');
                setError('');
              }}
              className="text-sm text-indigo-600 hover:text-indigo-700"
            >
              {mode === 'signin'
                ? "Don't have an account? Sign Up"
                : 'Already have an account? Sign In'}
            </button>
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

