const express = require('express');
const axios = require('axios');
const dbService = require('../database/dbService');

const router = express.Router();
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama3-70b-8192';
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';

const SCORE_FIELDS = [
  { key: 'm1', max: 20, label: 'M1 /20' },
  { key: 'pre_t1', max: 10, label: 'Pre-T1 /10' },
  { key: 't2', max: 5, label: 'T2 /5' },
  { key: 't3', max: 5, label: 'T3 /5' },
  { key: 't4', max: 20, label: 'T4 /20' },
  { key: 't5_avg', max: 20, label: 'T5 Avg /20' }
];
const LOW_GRADE_SET = new Set(['D', 'E', 'F', 'I', 'R']);

const normalizeSubjectScore = (subject) => {
  let total = 0;
  let count = 0;
  SCORE_FIELDS.forEach(({ key, max }) => {
    const raw = subject[key];
    const value = Number(raw);
    if (!Number.isFinite(value)) return;
    total += (value / max) * 100;
    count += 1;
  });
  return count ? Number((total / count).toFixed(1)) : null;
};

const computeInsights = (subjects = []) => {
  const enriched = subjects.map(subject => ({
    subject: subject.subject || 'Subject',
    grade: (subject.grade || '').toString().toUpperCase(),
    avgScore: normalizeSubjectScore(subject)
  }));

  const weaknesses = enriched
    .filter(sub => sub.avgScore !== null && (sub.avgScore < 60 || LOW_GRADE_SET.has(sub.grade)))
    .sort((a, b) => (a.avgScore ?? 0) - (b.avgScore ?? 0))
    .slice(0, 4);

  const strengths = enriched
    .filter(sub => sub.avgScore !== null && sub.avgScore >= 70 && !LOW_GRADE_SET.has(sub.grade))
    .sort((a, b) => (b.avgScore ?? 0) - (a.avgScore ?? 0))
    .slice(0, 3);

  return { strengths, weaknesses };
};

const buildAttendanceAlerts = (records = []) => {
  return records
    .map(record => {
      const total = Number(record.total_classes ?? 0);
      const attended = Number(record.attended_classes ?? 0);
      const percent = Number(record.attendance_percentage ?? (total ? ((attended / total) * 100) : 0).toFixed(1));
      return { subject: record.subject_name, percent, total, attended, semester: record.semester };
    })
    .filter(rec => rec.percent < 75)
    .sort((a, b) => a.percent - b.percent);
};

const buildHeuristicSummary = (student, insights, attendanceAlerts) => {
  const parts = [];
  const cgpa = student.cgpa !== undefined ? Number(student.cgpa).toFixed(2) : 'N/A';
  const sgpa = student.sgpa !== undefined ? Number(student.sgpa).toFixed(2) : 'N/A';
  parts.push(`${student.name} (${student.regd_no}) is currently holding CGPA ${cgpa} and SGPA ${sgpa} in ${student.branch || 'their branch'}.`);
  if (insights.strengths.length) {
    parts.push(`Strengths: ${insights.strengths.map(s => `${s.subject} (${s.avgScore}%)`).join(', ')}.`);
  }
  if (insights.weaknesses.length) {
    parts.push(`Needs focus in ${insights.weaknesses.map(w => `${w.subject} (${w.avgScore}%)`).join(', ')}.`);
  }
  if (attendanceAlerts.length) {
    parts.push(`Low attendance alerts in ${attendanceAlerts.map(a => `${a.subject} (${a.percent}%)`).join(', ')}.`);
  }
  if (student.counsellor) {
    parts.push(`Assigned counsellor: ${student.counsellor}.`);
  }
  return parts.join(' ');
};

const composeContext = (student, insights, attendanceAlerts) => {
  const subjectLines = insights.strengths.concat(insights.weaknesses)
    .map(sub => `${sub.subject}: avg ${sub.avgScore ?? 'N/A'}%, grade ${sub.grade || 'N/A'}`);
  const attendanceLines = attendanceAlerts.map(att => `${att.subject} ${att.attended}/${att.total} (${att.percent}%)`);

  return [
    `CGPA: ${student.cgpa ?? 'N/A'}, SGPA: ${student.sgpa ?? 'N/A'}`,
    `Branch: ${student.branch || 'Unknown'}, Semester: ${student.semester || 'N/A'}`,
    `Subject averages: ${subjectLines.length ? subjectLines.join('; ') : 'No subject data yet'}`,
    `Attendance snapshot: ${attendanceLines.length ? attendanceLines.join('; ') : 'No attendance alerts'}`
  ].join(' | ');
};

router.post('/summary', async (req, res) => {
  try {
    const { regdNo, prompt } = req.body;
    if (!regdNo) {
      return res.status(400).json({ success: false, error: 'MISSING_REGD', message: 'Registration number required' });
    }

    const student = await dbService.getStudentResults(regdNo.toString().toUpperCase());
    if (!student) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Student not found' });
    }

    const insights = computeInsights(student.subjectResults);
    const attendanceAlerts = buildAttendanceAlerts(student.attendance);
    const fallbackSummary = buildHeuristicSummary(student, insights, attendanceAlerts);
    let aiSummary = fallbackSummary;
    let generatedBy = 'heuristic';

    if (GROQ_API_KEY) {
      try {
        const userPrompt = prompt?.trim() || `Summarize the academic performance with focus on strengths, weaknesses, and attendance.`;
        const context = composeContext(student, insights, attendanceAlerts);
        const payload = {
          model: GROQ_MODEL,
          temperature: 0.3,
          max_tokens: 400,
          messages: [
            { role: 'system', content: 'You provide concise academic summaries for engineering students.' },
            { role: 'user', content: `${context}\n${userPrompt}` }
          ]
        };
        const response = await axios.post(GROQ_ENDPOINT, payload, {
          headers: {
            Authorization: `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });
        const completion = response?.data?.choices?.[0]?.message?.content;
        if (completion) {
          aiSummary = completion.trim();
          generatedBy = 'groq';
        }
      } catch (error) {
        console.error('[AI] Groq summary failed:', error.message);
      }
    }

    res.json({
      success: true,
      data: {
        summary: aiSummary,
        generatedBy,
        cgpa: student.cgpa,
        sgpa: student.sgpa,
        strengths: insights.strengths,
        weaknesses: insights.weaknesses,
        attendanceAlerts,
        prompt: prompt || null
      }
    });
  } catch (error) {
    console.error('[AI] Summary failure:', error);
    res.status(500).json({ success: false, error: 'SERVER_ERROR', message: 'Unable to generate summary' });
  }
});

module.exports = router;
