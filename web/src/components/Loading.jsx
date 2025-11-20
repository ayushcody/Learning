import React, { useState, useEffect } from 'react';
import { Coffee, Hourglass, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LOADING_MESSAGES = [
  "Hold on, grab some coffee...",
  "Crunching the data for you...",
  "Connecting to the AI brain...",
  "Fetching the latest insights...",
  "Building your personalized path...",
  "Almost there...",
  "Just a few more seconds...",
  "Making things look pretty...",
];

export default function Loading({ message }) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="mb-8"
      >
        <Loader2 className="w-12 h-12 text-indigo-600" />
      </motion.div>

      <div className="h-8 overflow-hidden relative w-full max-w-md text-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={currentMessageIndex}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="text-lg text-gray-600 font-medium absolute w-full"
          >
            {message || LOADING_MESSAGES[currentMessageIndex]}
          </motion.p>
        </AnimatePresence>
      </div>

      <div className="mt-8 flex gap-4 text-gray-400 text-sm">
        <div className="flex items-center gap-1">
          <Coffee className="w-4 h-4" />
          <span>Relax</span>
        </div>
        <div className="flex items-center gap-1">
          <Hourglass className="w-4 h-4" />
          <span>Processing</span>
        </div>
      </div>
    </div>
  );
}
