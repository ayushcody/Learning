/**
 * useProgress Hook
 * 
 * Global hook for fetching and managing user progress across the application.
 * Provides consistent progress tracking and completion status checking.
 * 
 * Features:
 * - Fetches user progress from API
 * - Caches progress data
 * - Provides helper function to check completion status
 * - Auto-refreshes when needed
 * 
 * Usage:
 * const { progress, isCompleted, refresh, loading } = useProgress();
 * 
 * if (isCompleted('step-id')) {
 *   // Show green completion indicator
 * }
 */

import { useState, useEffect, useCallback } from 'react';
import { auth } from '../firebase';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

export function useProgress() {
    const [progress, setProgress] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchProgress = useCallback(async () => {
        try {
            const user = auth.currentUser;
            if (!user) {
                setProgress({});
                setLoading(false);
                return;
            }

            const token = await user.getIdToken();
            const response = await axios.get(`${API_BASE}/api/profile`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const userProgress = response.data?.progress || {};
            setProgress(userProgress);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch progress:', err);
            setError(err);
            setProgress({});
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProgress();
    }, [fetchProgress]);

    // Helper function to check if a step is completed
    const isCompleted = useCallback((stepId) => {
        if (!stepId) return false;
        return progress[stepId]?.completed || false;
    }, [progress]);

    // Get completion percentage for a roadmap
    const getCompletionPercentage = useCallback((stepIds = []) => {
        if (!stepIds.length) return 0;
        const completed = stepIds.filter(id => isCompleted(id)).length;
        return Math.round((completed / stepIds.length) * 100);
    }, [isCompleted]);

    // Get total completed count
    const getTotalCompleted = useCallback(() => {
        return Object.values(progress).filter(p => p?.completed).length;
    }, [progress]);

    // Refresh progress (call after completing a module)
    const refresh = useCallback(() => {
        setLoading(true);
        fetchProgress();
    }, [fetchProgress]);

    return {
        progress,
        isCompleted,
        getCompletionPercentage,
        getTotalCompleted,
        refresh,
        loading,
        error,
    };
}
