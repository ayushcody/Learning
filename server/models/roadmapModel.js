const ROADMAP_COLLECTION = 'roadmaps';
const DEFAULT_ROADMAP_ID = 'fsd_r1';

function buildFullStackRoadmap() {
  return {
    id: DEFAULT_ROADMAP_ID,
    role: 'Full Stack Developer',
    description:
      'A comprehensive roadmap to become a Full Stack Developer, covering frontend, backend, databases, and deployment.',
    steps: [
      {
        seq: 1,
        id: 'html-css-basics',
        type: 'content',
        title: 'HTML & CSS Fundamentals',
        est: '2 weeks',
        content:
          'Learn the building blocks of web development: HTML structure, CSS styling, responsive design, and modern CSS features like Flexbox and Grid.',
      },
      {
        seq: 2,
        id: 'javascript-basics',
        type: 'content',
        title: 'JavaScript Basics',
        est: '3 weeks',
        content:
          'Master JavaScript fundamentals: variables, functions, arrays, objects, DOM manipulation, and ES6+ features.',
      },
      {
        seq: 3,
        id: 'js-algorithms',
        type: 'project',
        title: 'JavaScript Algorithms Practice',
        est: '2 weeks',
        content: 'Practice solving algorithmic problems in JavaScript.',
        challenge: {
          language: 'javascript',
          initial_code: `// Write a function that reverses a string
function reverseString(str) {
  // Your code here
  return str;
}

// Example test cases
console.log(reverseString("hello")); // Should print "olleh"
console.log(reverseString("world")); // Should print "dlrow"
`,
          tests: [
            { input: '', expected: '' },
            { input: 'hello', expected: 'olleh' },
            { input: 'world', expected: 'dlrow' },
          ],
          notes: 'Return the reversed string. Consider edge cases like empty strings.',
        },
      },
      {
        seq: 4,
        id: 'react-intro',
        type: 'content',
        title: 'React Introduction',
        est: '3 weeks',
        content:
          'Learn React: components, JSX, props, state, hooks (useState, useEffect), and component lifecycle.',
      },
      {
        seq: 5,
        id: 'react-todo',
        type: 'project',
        title: 'Build a Todo App with React',
        est: '2 weeks',
        content: 'Create a fully functional todo application using React hooks and local state.',
        challenge: {
          language: 'javascript',
          initial_code: `// Create a simple React component for a todo item
import { useState } from 'react';

function TodoApp() {
  const [todos, setTodos] = useState([]);
  const [input, setInput] = useState('');
  
  // Add your todo logic here
  
  return (
    <div>
      <h1>Todo App</h1>
      {/* Your JSX here */}
    </div>
  );
}

export default TodoApp;
`,
          tests: [{ input: '{"method":"GET","path":"/api/posts"}', expected: '[]' }],
          notes: 'Implement add, remove, and toggle complete functionality.',
        },
      },
      {
        seq: 6,
        id: 'node-backend',
        type: 'content',
        title: 'Node.js & Express Backend',
        est: '3 weeks',
        content:
          'Build RESTful APIs with Node.js and Express. Learn routing, middleware, error handling, and async patterns.',
      },
      {
        seq: 7,
        id: 'api-project',
        type: 'project',
        title: 'Build a REST API',
        est: '2 weeks',
        content: 'Create a REST API with CRUD operations for a blog or notes application.',
        challenge: {
          language: 'javascript',
          initial_code: `// Express server setup
const express = require('express');
const app = express();

app.use(express.json());

// TODO: Create endpoints for:
// GET /api/posts - Get all posts
// POST /api/posts - Create a post
// GET /api/posts/:id - Get a post by ID
// PUT /api/posts/:id - Update a post
// DELETE /api/posts/:id - Delete a post

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});
`,
          tests: [{ input: '{"method":"GET","path":"/api/posts"}', expected: '[]' }],
          notes: 'Implement full CRUD with proper HTTP status codes.',
        },
      },
      {
        seq: 8,
        id: 'database-design',
        type: 'content',
        title: 'Database Design & SQL',
        est: '2 weeks',
        content:
          'Learn relational database concepts, SQL queries, normalization, and database design patterns.',
      },
      {
        seq: 9,
        id: 'full-stack-integration',
        type: 'content',
        title: 'Full Stack Integration',
        est: '3 weeks',
        content:
          'Connect frontend and backend: API integration, authentication, state management, and deployment.',
      },
      {
        seq: 10,
        id: 'deployment',
        type: 'content',
        title: 'Deployment & DevOps Basics',
        est: '2 weeks',
        content:
          'Deploy applications to cloud platforms (Vercel, Netlify, AWS), set up CI/CD, and learn basic DevOps practices.',
      },
    ],
  };
}

module.exports = {
  ROADMAP_COLLECTION,
  DEFAULT_ROADMAP_ID,
  buildFullStackRoadmap,
};
