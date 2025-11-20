const LANGUAGE_IDS = {
  python3: 71,
  python: 71,
  javascript: 63,
  node: 63,
  java: 62,
  cpp: 54,
  c: 50,
};

const FALLBACK_HINTS = [
  'Check your variable initialization. Make sure all variables are defined before use.',
  'Review your loop boundaries - common issues are off-by-one errors.',
  'Verify your input parsing. Are you handling all edge cases like empty strings or null values?',
  "Double-check your return statements. Ensure you're returning the correct value type.",
  "Look at your conditional logic. Are all branches of your if/else statements correct?",
];

module.exports = {
  LANGUAGE_IDS,
  FALLBACK_HINTS,
};
