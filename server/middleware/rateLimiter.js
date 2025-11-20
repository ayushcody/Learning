/**
 * Rate Limiter Middleware
 * 
 * Protects expensive Gemini API endpoints from quota exhaustion
 * Free tier limits: 15 requests/minute, 1500/day
 * 
 * Strategy:
 * - Gemini endpoints: 5 requests/minute per IP (conservative)
 * - Assessment endpoints: 3 requests/15min per IP
 * - Topic search: 10 requests/hour per IP
 */

const rateLimit = require('express-rate-limit');

// Gemini content generation (most expensive)
const geminiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // 5 requests per minute (well below 15/min limit)
    message: {
        success: false,
        error: 'Too many content generation requests. Please wait a moment and try again.',
        retryAfter: 60,
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false, // Count all requests
});

// Assessment generation (also expensive)
const assessmentLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3, // 3 assessments per 15 minutes
    message: {
        success: false,
        error: 'Assessment limit reached. Please wait before starting another assessment.',
        retryAfter: 900,
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Topic search (moderate)
const searchLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 searches per hour
    message: {
        success: false,
        error: 'Search limit reached. Please try again in an hour or browse popular topics.',
        retryAfter: 3600,
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// General API protection
const generalLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 requests per minute
    message: {
        success: false,
        error: 'Too many requests. Please slow down.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    geminiLimiter,
    assessmentLimiter,
    searchLimiter,
    generalLimiter,
};
