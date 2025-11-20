const axios = require('axios');
const { LANGUAGE_IDS } = require('../utils/constants');

const JUDGE0_STATUS = {
  1: 'IN_QUEUE',
  2: 'PROCESSING',
  3: 'ACCEPTED',
  4: 'WRONG_ANSWER',
  5: 'TIME_LIMIT_EXCEEDED',
  6: 'COMPILATION_ERROR',
  7: 'RUNTIME_ERROR',
  8: 'RUNTIME_ERROR',
  9: 'RUNTIME_ERROR',
  10: 'RUNTIME_ERROR',
};

function buildJudge0Headers() {
  const headers = { 'Content-Type': 'application/json' };
  if (process.env.RAPIDAPI_KEY) {
    headers['X-RapidAPI-Key'] = process.env.RAPIDAPI_KEY;
    headers['X-RapidAPI-Host'] = process.env.RAPIDAPI_HOST || 'judge0-ce.p.rapidapi.com';
  }
  return headers;
}

async function runCode({ language, source, stdin }) {
  return submitToJudge0({ language, source, stdin });
}

function mapStatus(statusId) {
  return JUDGE0_STATUS[statusId] || 'UNKNOWN';
}

function escapeForSingleQuotes(str = '') {
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function extractFunctionName(signature = '', language = '', sourceCode = '') {
  let name = null;
  const lang = language?.toLowerCase();

  // 1. Try to extract from signature
  if (signature) {
    if (lang === 'python') {
      const match = signature.match(/def\s+([a-zA-Z_][\w]*)\s*\(/);
      if (match) name = match[1];
    } else if (lang === 'javascript') {
      const match = signature.match(/function\s+([a-zA-Z_][\w]*)\s*\(/);
      if (match) name = match[1];
      else {
        const constMatch = signature.match(/(?:const|let|var)\s+([a-zA-Z_][\w]*)\s*=\s*/);
        if (constMatch) name = constMatch[1];
      }
    }

    // If signature is just the name (no def/function keyword)
    if (!name && /^[a-zA-Z_][\w]*$/.test(signature.trim())) {
      name = signature.trim();
    }
  }

  // 2. If we have source code, verify or discover the function name
  if (sourceCode) {
    if (lang === 'python') {
      // Find all function definitions in source
      const matches = [...sourceCode.matchAll(/^def\s+([a-zA-Z_][\w]*)\s*\(/gm)];
      if (matches.length > 0) {
        // If we found a name from signature, check if it exists in source
        const exists = name && matches.some(m => m[1] === name);
        if (!exists) {
          // If not found (or no name yet), use the last defined function as a heuristic
          // (Users often write the solution function last, or it's the only one)
          name = matches[matches.length - 1][1];
        }
      }
    } else if (lang === 'javascript') {
      const funcMatches = [...sourceCode.matchAll(/function\s+([a-zA-Z_][\w]*)\s*\(/g)];
      const varMatches = [...sourceCode.matchAll(/(?:const|let|var)\s+([a-zA-Z_][\w]*)\s*=\s*(?:async\s*)?(?:function|\(|[a-zA-Z_][\w]*\s*=>)/g)];
      const allMatches = [...funcMatches, ...varMatches];

      if (allMatches.length > 0) {
        const exists = name && allMatches.some(m => m[1] === name);
        if (!exists) {
          name = allMatches[allMatches.length - 1][1];
        }
      }
    }
  }

  return name;
}

function buildHarnessSource({ language, baseSource, functionSignature, test }) {
  const fn = extractFunctionName(functionSignature, language);
  if (!fn) {
    return null;
  }

  const args = Array.isArray(test.args) ? test.args : [];
  const kwargs = test.kwargs && typeof test.kwargs === 'object' ? test.kwargs : {};

  if (language.toLowerCase() === 'python') {
    const argsJson = escapeForSingleQuotes(JSON.stringify(args));
    const kwargsJson = escapeForSingleQuotes(JSON.stringify(kwargs));
    return `${baseSource}
import json

__test_args = json.loads('${argsJson}')
__test_kwargs = json.loads('${kwargsJson}')
__result = ${fn}(*__test_args, **__test_kwargs)
print(__result)
`;
  }

  if (language.toLowerCase() === 'javascript') {
    const argsLiteral = JSON.stringify(args);
    return `${baseSource}
const __testArgs = ${argsLiteral};
const __result = ${fn}(...__testArgs);
console.log(__result);
`;
  }

  return null;
}

async function submitToJudge0({ language, source, stdin }) {
  if (!language || !source) {
    const error = new Error('Missing language or source code');
    error.status = 400;
    throw error;
  }

  const languageId = LANGUAGE_IDS[language.toLowerCase()];
  if (!languageId) {
    const error = new Error(`Unsupported language: ${language}`);
    error.status = 400;
    throw error;
  }

  const payload = {
    language_id: languageId,
    source_code: Buffer.from(source).toString('base64'),
    stdin: stdin ? Buffer.from(stdin).toString('base64') : '',
  };

  const judge0Url = process.env.JUDGE0_URL || 'https://judge0-ce.p.rapidapi.com';
  const headers = buildJudge0Headers();

  try {
    // CRITICAL: wait and fields must be query parameters, not in the body!
    // base64_encoded=true tells Judge0 to encode stdout/stderr in base64
    // wait=true tells Judge0 to wait until execution completes
    // fields specifies what data to return
    const queryParams = 'base64_encoded=true&wait=true&fields=stdout,stderr,status,compile_output,message';
    const response = await axios.post(
      `${judge0Url}/submissions?${queryParams}`,
      payload,
      { headers }
    );
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 403) {
      const forbiddenError = new Error('Code execution service rejected the request (403). Verify RAPIDAPI_KEY or Judge0 URL.');
      forbiddenError.status = 502;
      throw forbiddenError;
    }
    throw error;
  }
}

async function runCodeWithTests({ language, source, tests = [], functionSignature }) {
  if (!Array.isArray(tests) || tests.length === 0) {
    const error = new Error('No tests provided');
    error.status = 400;
    throw error;
  }

  const results = [];
  let summaryStatus = 'ACCEPTED';

  for (const test of tests) {
    const harnessSource = buildHarnessSource({
      language,
      baseSource: source,
      functionSignature,
      test,
    });

    if (!harnessSource) {
      console.warn('⚠️ Harness source generation failed. Using raw source.');
      console.log('Function Signature:', functionSignature);
      console.log('Language:', language);
    } else {
      console.log('✅ Harness source generated successfully.');
    }

    const stdinPayload = harnessSource ? '' : test.input || '';
    const expectedOutput = test.expected ?? '';

    console.log(`🚀 Submitting to Judge0... Language: ${language}`);
    const submission = await submitToJudge0({
      language,
      source: harnessSource || source,
      stdin: stdinPayload,
    });

    console.log('📥 Judge0 Response:', JSON.stringify(submission, null, 2));

    const stdout = submission.stdout ? Buffer.from(submission.stdout, 'base64').toString('utf8').trim() : '';
    const stderr = submission.stderr ? Buffer.from(submission.stderr, 'base64').toString('utf8').trim() : '';
    const statusId = submission.status?.id;
    const statusLabel = mapStatus(statusId);

    console.log(`📤 Decoded stdout: "${stdout}"`);
    console.log(`⚠️ Decoded stderr: "${stderr}"`);
    console.log(`📊 Status: ${statusLabel} (ID: ${statusId})`);

    let passed = false;
    if (statusLabel === 'ACCEPTED') {
      // Normalize outputs for comparison
      const normalize = (val) => {
        if (typeof val !== 'string') return val;
        const trimmed = val.trim();
        // Try parsing as JSON/number to handle type differences
        try {
          return JSON.parse(trimmed);
        } catch {
          return trimmed;
        }
      };

      const actual = normalize(stdout);
      const expected = normalize(expectedOutput);

      // Deep equality check for objects/arrays, strict equality for primitives
      try {
        if (typeof actual === 'object' && actual !== null && typeof expected === 'object' && expected !== null) {
          passed = JSON.stringify(actual) === JSON.stringify(expected);
        } else {
          // Loose equality for numbers/strings (e.g. "5" == 5)
          passed = actual == expected;
        }
      } catch (e) {
        passed = false;
      }

      if (!passed && summaryStatus === 'ACCEPTED') {
        summaryStatus = 'WRONG_ANSWER';
      }
    } else if (summaryStatus === 'ACCEPTED') {
      summaryStatus = statusLabel;
    }

    results.push({
      description: test.description || '',
      input: test.input ?? '',
      args: test.args,
      expected: expectedOutput,
      actual: stdout,
      stderr,
      status: statusLabel,
      passed,
    });
  }

  const passedCount = results.filter((r) => r.passed).length;
  const totalCount = results.length;

  return {
    status: summaryStatus,
    summary: {
      passedCount,
      totalCount,
      percentage: totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0,
    },
    tests: results,
  };
}

module.exports = {
  runCode,
  runCodeWithTests,
};
