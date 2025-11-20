import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Trophy, Calendar as CalendarIcon, Zap } from 'lucide-react';
import { auth } from '../firebase';
import axios from 'axios';
import confetti from 'canvas-confetti';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

export default function StreakWidget({ compact = false }) {
    const [streak, setStreak] = useState({
        current: 0,
        longest: 0,
        lastVisit: null,
        dailyVisits: [],
    });
    const [loading, setLoading] = useState(true);
    const [checkedInToday, setCheckedInToday] = useState(false);
    const [celebrating, setCelebrating] = useState(false);

    useEffect(() => {
        loadStreakData();
    }, []);

    const loadStreakData = async () => {
        try {
            if (!auth.currentUser) return;
            const token = await auth.currentUser.getIdToken();
            const response = await axios.get(`${API_BASE}/api/streak`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.data.success) {
                setStreak(response.data.streak);

                // Check if already checked in today
                const today = new Date().toISOString().split('T')[0];
                setCheckedInToday(response.data.streak.dailyVisits?.includes(today) || false);
            }
        } catch (error) {
            console.error('Failed to load streak:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCheckIn = async () => {
        if (checkedInToday || !auth.currentUser) return;

        try {
            const token = await auth.currentUser.getIdToken();
            const response = await axios.post(
                `${API_BASE}/api/streak/check-in`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                setStreak(response.data.streak);
                setCheckedInToday(true);

                // Celebrate!
                setCelebrating(true);
                triggerConfetti(response.data.milestone || response.data.newRecord);

                setTimeout(() => setCelebrating(false), 2000);
            }
        } catch (error) {
            console.error('Check-in failed:', error);
        }
    };

    const triggerConfetti = (isMilestone = false) => {
        const count = isMilestone ? 200 : 100;
        const spread = isMilestone ? 100 : 60;

        confetti({
            particleCount: count,
            spread: spread,
            origin: { y: 0.6 },
            colors: ['#ff6b35', '#f7931e', '#fdc830', '#f37335'],
        });

        if (isMilestone) {
            setTimeout(() => {
                confetti({
                    particleCount: 100,
                    spread: 80,
                    origin: { y: 0.7 },
                    colors: ['#FFD700', '#FFA500', '#FF6347'],
                });
            }, 250);
        }
    };

    const getLast7Days = () => {
        const days = [];
        const today = new Date();

        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

            days.push({
                date: dateStr,
                dayName,
                active: streak.dailyVisits?.includes(dateStr) || false,
                isToday: i === 0,
            });
        }

        return days;
    };

    if (loading) {
        return (
            <div className={compact ? 'card-glass p-4' : 'card'}>
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-24 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                </div>
            </div>
        );
    }

    if (compact) {
        return (
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="card-glass p-4 cursor-pointer hover-lift"
                onClick={!checkedInToday ? handleCheckIn : undefined}
            >
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Flame className="w-8 h-8 text-orange-500 fire-icon" />
                        {streak.current > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                {streak.current}
                            </span>
                        )}
                    </div>
                    <div>
                        <div className="font-bold text-lg text-gradient-fire">
                            {streak.current} Day{streak.current !== 1 ? 's' : ''}
                        </div>
                        <div className="text-xs text-gray-600">
                            {checkedInToday ? "Checked in! 🎉" : "Tap to check in"}
                        </div>
                    </div>
                </div>
            </motion.div>
        );
    }

    const last7Days = getLast7Days();

    return (
        <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="card-gradient relative overflow-hidden"
        >
            <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Flame className="w-6 h-6 text-orange-500 fire-icon" />
                        <h3 className="text-xl font-bold text-gradient-fire">Daily Streak</h3>
                    </div>
                    {streak.longest > 0 && (
                        <div className="badge badge-fire">
                            <Trophy className="w-4 h-4" />
                            Best: {streak.longest}
                        </div>
                    )}
                </div>

                {/* Current Streak Display */}
                <div className="text-center py-6">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={streak.current}
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.5, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                            className="relative inline-block"
                        >
                            <div className="text-6xl font-black text-gradient-fire mb-2">
                                {streak.current}
                            </div>
                            {celebrating && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: [0, 1.5, 1] }}
                                    className="absolute -top-8 -right-8 text-4xl"
                                >
                                    🎉
                                </motion.div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                    <p className="text-gray-600 font-medium">
                        Day{streak.current !== 1 ? 's' : ''} in a row
                    </p>
                </div>

                {/* 7-Day Calendar */}
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <CalendarIcon className="w-4 h-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-600">Last 7 Days</span>
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                        {last7Days.map((day, index) => (
                            <motion.div
                                key={day.date}
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: index * 0.05 }}
                                className="text-center"
                            >
                                <div className="text-xs text-gray-500 mb-1">{day.dayName}</div>
                                <div
                                    className={`calendar-day ${day.active ? 'calendar-day-active' : 'calendar-day-inactive'
                                        } ${day.isToday ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`}
                                >
                                    {day.active ? '✓' : ''}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Check-in Button */}
                {!checkedInToday ? (
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleCheckIn}
                        className="w-full btn-success flex items-center justify-center gap-2"
                    >
                        <Zap className="w-5 h-5" />
                        Check In Today
                    </motion.button>
                ) : (
                    <div className="text-center p-4 bg-green-50 rounded-xl border-2 border-green-200">
                        <div className="flex items-center justify-center gap-2 text-green-700 font-semibold">
                            <Flame className="w-5 h-5" />
                            All set for today! 🎉
                        </div>
                        <p className="text-sm text-green-600 mt-1">Come back tomorrow to keep the streak going!</p>
                    </div>
                )}

                {/* Streak Milestones */}
                {streak.current > 0 && (
                    <div className="pt-4 border-t border-gray-200">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Next milestone:</span>
                            <span className="font-semibold text-indigo-600">
                                {Math.ceil((streak.current + 1) / 7) * 7} days
                            </span>
                        </div>
                        <div className="mt-2 progress-bar">
                            <div
                                className="progress-bar-fill"
                                style={{
                                    width: `${((streak.current % 7) / 7) * 100}%`,
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
