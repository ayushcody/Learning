/**
 * PublicRoute Component
 * 
 * Wrapper component that redirects authenticated users away from public pages (like landing page).
 * Use this for pages that should only be accessible to unauthenticated users.
 */

import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import Loading from './Loading';

export default function PublicRoute({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <Loading />;
  }

  // If user is authenticated, redirect to dashboard
  return user ? <Navigate to="/dashboard" replace /> : children;
}

