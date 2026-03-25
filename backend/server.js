const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const students = [
  { id: 1, name: 'Ananya Rao', grade: '10', attendance: '98%', parent: 'Karthik Rao' },
  { id: 2, name: 'Rohan Varma', grade: '11', attendance: '96%', parent: 'Swathi Varma' },
  { id: 3, name: 'Ishaan Mathur', grade: '12', attendance: '99%', parent: 'Vikram Mathur' },
  { id: 4, name: 'Mihee Patel', grade: '10', attendance: '97%', parent: 'Rupesh Patel' }
];

const notices = [
  {
    id: 101,
    title: 'University Open House',
    audience: 'All Parents',
    date: '2026-03-30',
    summary: 'Meet the faculty and explore the new analytics lab on campus.',
    priority: 'high'
  },
  {
    id: 102,
    title: 'Extra Coaching Slots',
    audience: 'Grade 11 & 12',
    date: '2026-04-04',
    summary: 'Premium science coaching is available. Register with the counselor.',
    priority: 'medium'
  },
  {
    id: 103,
    title: 'Sports Day Volunteers',
    audience: 'Grade 9-12',
    date: '2026-04-10',
    summary: 'Looking for parent volunteers for the athletics meet.',
    priority: 'low'
  }
];

const results = [
  { id: 1, student: 'Ananya Rao', subject: 'Mathematics', grade: 'A+', status: 'Passed' },
  { id: 2, student: 'Rohan Varma', subject: 'Physics', grade: 'A', status: 'Passed' },
  { id: 3, student: 'Ishaan Mathur', subject: 'Chemistry', grade: 'A', status: 'Passed' },
  { id: 4, student: 'Mihee Patel', subject: 'Biology', grade: 'A-', status: 'Passed' }
];

const overview = {
  summary: 'Attendance stays excellent across grade 10-12; notice board is up to date.',
  totalStudents: students.length,
  totalNotices: notices.length,
  topStudents: ['Ananya Rao', 'Ishaan Mathur', 'Mihee Patel'],
  averageAttendance: '97.5%'
};

app.get('/', (_, res) => {
  res.send('University Parent Portal API');
});

app.get('/api/overview', (_, res) => {
  res.json({
    ...overview,
    recentResults: results.slice(0, 3)
  });
});

app.get('/api/students', (_, res) => {
  res.json({ students });
});

app.get('/api/notices', (_, res) => {
  res.json({ notices });
});

app.get('/api/results', (_, res) => {
  res.json({ results });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (email === 'parent@vignan.edu' && password === 'welcome123') {
    return res.json({ token: `parent-token-${Date.now()}`, message: 'Login successful' });
  }
  return res.status(401).json({ error: 'Invalid credentials' });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Parent portal API listening on port ${PORT}`);
});

if (process.argv.includes('--test')) {
  server.once('listening', () => {
    console.log('Test mode: closing server after verification');
    server.close(() => {
      console.log('Server closed (test mode)');
    });
  });
}

module.exports = { app };
