const express = require('express');
const dbService = require('../database/dbService');

const router = express.Router();

// Hardcoded admin credentials (in production, use hashed passwords in database)
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123', // Change this in production
  name: 'Administrator',
  role: 'super_admin'
};

// POST /api/admin/login - Admin login (no OTP)
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_CREDENTIALS',
        message: 'Username and password are required'
      });
    }

    // Validate admin credentials
    if (username !== ADMIN_CREDENTIALS.username || password !== ADMIN_CREDENTIALS.password) {
      return res.status(401).json({
        success: false,
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid username or password'
      });
    }

    // Generate admin token
    const { v4: uuidv4 } = require('uuid');
    const adminToken = uuidv4();

    console.log(`[Admin] Login successful for: ${username}`);

    res.json({
      success: true,
      message: 'Admin login successful',
      adminToken,
      admin: {
        username: ADMIN_CREDENTIALS.username,
        name: ADMIN_CREDENTIALS.name,
        role: ADMIN_CREDENTIALS.role
      }
    });
  } catch (error) {
    console.error('[Admin] Login error:', error.message);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Login failed. Please try again.'
    });
  }
});

// GET /api/admin/stats - Dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    // Total students
    const totalResult = await dbService.query('SELECT COUNT(*) as total FROM students');
    const totalStudents = parseInt(totalResult[0].total);

    // Students by branch
    const branchResult = await dbService.query(`
      SELECT branch, COUNT(*) as count, AVG(cgpa) as avg_cgpa
      FROM students
      GROUP BY branch
      ORDER BY count DESC
    `);

    // Students by semester
    const semesterResult = await dbService.query(`
      SELECT semester, COUNT(*) as count
      FROM students
      GROUP BY semester
      ORDER BY semester
    `);

    // CGPA distribution
    const cgpaResult = await dbService.query(`
      SELECT 
        CASE 
          WHEN cgpa >= 9.0 THEN '9.0+'
          WHEN cgpa >= 8.0 THEN '8.0-8.9'
          WHEN cgpa >= 7.0 THEN '7.0-7.9'
          WHEN cgpa >= 6.0 THEN '6.0-6.9'
          ELSE 'Below 6.0'
        END as range,
        COUNT(*) as count
      FROM students
      WHERE cgpa IS NOT NULL
      GROUP BY 1
      ORDER BY MIN(cgpa) DESC
    `);

    // Fee collection summary
    const feeResult = await dbService.query(`
      SELECT 
        SUM(total_tuition_fee) as total_fees,
        SUM(scholarship_applied) as total_scholarships,
        SUM(net_payable_amount) as total_payable,
        SUM(amount_paid) as total_collected,
        SUM(net_payable_amount - amount_paid) as total_due
      FROM students
    `);

    res.json({
      success: true,
      data: {
        totalStudents,
        byBranch: branchResult.rows,
        bySemester: semesterResult.rows,
        cgpaDistribution: cgpaResult.rows,
        feeSummary: feeResult.rows[0]
      }
    });
  } catch (error) {
    console.error('[Admin] Error fetching stats:', error.message);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to fetch dashboard statistics'
    });
  }
});

// GET /api/admin/students - Get all students with filters
router.get('/students', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      cgpa_min,
      cgpa_max,
      section,
      branch,
      semester,
      attendance_min,
      sort_by = 'regd_no',
      sort_order = 'asc',
      search
    } = req.query;

    // Build query conditions
    let conditions = [];
    let params = [];
    let paramIndex = 1;

    if (cgpa_min) {
      conditions.push(`cgpa >= $${paramIndex++}`);
      params.push(parseFloat(cgpa_min));
    }

    if (cgpa_max) {
      conditions.push(`cgpa <= $${paramIndex++}`);
      params.push(parseFloat(cgpa_max));
    }

    if (section) {
      conditions.push(`section ILIKE $${paramIndex++}`);
      params.push(`%${section}%`);
    }

    if (branch) {
      conditions.push(`branch ILIKE $${paramIndex++}`);
      params.push(`%${branch}%`);
    }

    if (semester) {
      conditions.push(`semester = $${paramIndex++}`);
      params.push(parseInt(semester));
    }

    if (attendance_min) {
      conditions.push(`attendance >= $${paramIndex++}`);
      params.push(parseFloat(attendance_min));
    }

    if (search) {
      conditions.push(`(regd_no ILIKE $${paramIndex} OR name ILIKE $${paramIndex} OR mobile ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Validate sort column
    const allowedSortColumns = ['regd_no', 'name', 'cgpa', 'sgpa', 'semester', 'branch', 'attendance', 'created_at'];
    const sortColumn = allowedSortColumns.includes(sort_by) ? sort_by : 'regd_no';
    const sortDirection = sort_order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM students ${whereClause}`;
    const countResult = await dbService.query(countQuery, params);
    const totalCount = parseInt(countResult[0].count);

    // Get paginated students
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const studentsQuery = `
      SELECT 
        s.id, s.regd_no, s.name, s.mobile, s.email, 
        s.cgpa, s.sgpa, s.semester, s.branch, s.section,
        s.counsellor, s.attendance, s.total_tuition_fee,
        s.scholarship_applied, s.net_payable_amount, s.amount_paid,
        s.created_at, s.updated_at,
        COUNT(sr.id) as subject_count
      FROM students s
      LEFT JOIN subject_results sr ON s.id = sr.student_id
      ${whereClause}
      GROUP BY s.id
      ORDER BY ${sortColumn} ${sortDirection}
      LIMIT ? OFFSET ?
    `;
    
    params.push(parseInt(limit), offset);

    const studentsResult = await dbService.query(studentsQuery, params);

    res.json({
      success: true,
      data: {
        students: studentsResult.rows,
        pagination: {
          total: totalCount,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(totalCount / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('[Admin] Error fetching students:', error.message);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to fetch students data'
    });
  }
});

// GET /api/admin/students/top-performers - Get top performers
router.get('/students/top-performers', async (req, res) => {
  try {
    const { category = 'cgpa', limit = 10, branch, semester } = req.query;

    let orderBy;
    switch (category.toLowerCase()) {
      case 'cgpa':
        orderBy = 'cgpa DESC';
        break;
      case 'sgpa':
        orderBy = 'sgpa DESC';
        break;
      case 'attendance':
        orderBy = 'attendance DESC';
        break;
      case 'coding':
        orderBy = 'coding_score DESC';
        break;
      case 'competitions':
        orderBy = 'competition_wins DESC';
        break;
      default:
        orderBy = 'cgpa DESC';
    }

    let conditions = [];
    let params = [];
    let paramIndex = 1;

    if (branch) {
      conditions.push(`branch ILIKE $${paramIndex++}`);
      params.push(`%${branch}%`);
    }

    if (semester) {
      conditions.push(`semester = $${paramIndex++}`);
      params.push(parseInt(semester));
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        id, regd_no, name, mobile, email, 
        cgpa, sgpa, semester, branch, section,
        attendance, counsellor,
        coding_score, competition_wins, achievements
      FROM students
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT ?
    `;
    
    params.push(parseInt(limit));

    const result = await dbService.query(query, params);

    res.json({
      success: true,
      category,
      data: result.rows
    });
  } catch (error) {
    console.error('[Admin] Error fetching top performers:', error.message);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to fetch top performers'
    });
  }
});

// GET /api/admin/student/:regdNo/details - Get detailed student info
router.get('/student/:regdNo/details', async (req, res) => {
  try {
    const { regdNo } = req.params;

    const studentQuery = `
      SELECT 
        s.*,
        json_group_array(
          json_object(
            'subject', sr.subject_name,
            'grade', sr.grade,
            'marks', sr.marks,
            'max_marks', sr.max_marks
          )
        ) FILTER (WHERE sr.id IS NOT NULL) as subjects
      FROM students s
      LEFT JOIN subject_results sr ON s.id = sr.student_id
      WHERE UPPER(s.regd_no) = UPPER(?)
      GROUP BY s.id
    `;

    const result = await dbService.query(studentQuery, [regdNo]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'STUDENT_NOT_FOUND',
        message: 'Student not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('[Admin] Error fetching student details:', error.message);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to fetch student details'
    });
  }
});

// POST /api/admin/student - Add new student
router.post('/student', async (req, res) => {
  try {
    const studentData = req.body;

    // Validate required fields
    if (!studentData.regd_no || !studentData.name || !studentData.mobile) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_FIELDS',
        message: 'Registration number, name, and mobile are required'
      });
    }

    const result = await dbService.addStudent(studentData);

    if (result.success) {
      res.status(201).json({
        success: true,
        message: 'Student added successfully',
        data: result.student
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'ADD_FAILED',
        message: result.error
      });
    }
  } catch (error) {
    console.error('[Admin] Error adding student:', error.message);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to add student'
    });
  }
});

// PUT /api/admin/student/:regdNo - Update student
router.put('/student/:regdNo', async (req, res) => {
  try {
    const { regdNo } = req.params;
    const updateData = req.body;

    const result = await dbService.updateStudent(regdNo, updateData);

    if (result.success) {
      res.json({
        success: true,
        message: 'Student updated successfully',
        data: result.student
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'UPDATE_FAILED',
        message: result.error
      });
    }
  } catch (error) {
    console.error('[Admin] Error updating student:', error.message);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to update student'
    });
  }
});

// DELETE /api/admin/student/:regdNo - Delete student
router.delete('/student/:regdNo', async (req, res) => {
  try {
    const { regdNo } = req.params;

    const result = await dbService.deleteStudent(regdNo);

    if (result.success) {
      res.json({
        success: true,
        message: result.message
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'DELETE_FAILED',
        message: result.error
      });
    }
  } catch (error) {
    console.error('[Admin] Error deleting student:', error.message);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to delete student'
    });
  }
});

// POST /api/admin/bulk-marks - Bulk marks entry
router.post('/bulk-marks', async (req, res) => {
  try {
    const { section, subject, testType, marks, facultyName } = req.body;

    if (!section || !subject || !testType || !marks || !Array.isArray(marks)) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_FIELDS',
        message: 'Section, subject, test type, and marks array are required'
      });
    }

    let savedCount = 0;
    for (const markEntry of marks) {
      try {
        await dbService.updateStudentMarks(markEntry.regd_no, subject, testType, markEntry.marks, markEntry.max_marks, markEntry.grade);
        savedCount++;
      } catch (err) {
        console.error(`Error saving marks for ${markEntry.regd_no}:`, err.message);
      }
    }

    res.json({
      success: true,
      message: `Bulk marks entry completed`,
      saved: savedCount,
      total: marks.length
    });
  } catch (error) {
    console.error('[Admin] Error in bulk marks entry:', error.message);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to complete bulk marks entry'
    });
  }
});

// POST /api/admin/student/:regdNo/attendance - Update attendance
router.post('/student/:regdNo/attendance', async (req, res) => {
  try {
    const { regdNo } = req.params;
    const { subject, semester, attendedClasses, totalClasses } = req.body;

    if (!attendedClasses || !totalClasses) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_FIELDS',
        message: 'Attended classes and total classes are required'
      });
    }

    const attendance = ((attendedClasses / totalClasses) * 100).toFixed(2);
    
    const result = await dbService.updateStudentAttendance(regdNo, attendance, subject, semester);

    if (result.success) {
      res.json({
        success: true,
        message: 'Attendance updated successfully',
        attendance: parseFloat(attendance)
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'UPDATE_FAILED',
        message: result.error
      });
    }
  } catch (error) {
    console.error('[Admin] Error updating attendance:', error.message);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to update attendance'
    });
  }
});

// POST /api/admin/notice - Post notice
router.post('/notice', async (req, res) => {
  try {
    const { title, message, type, targetRegdNo } = req.body;

    if (!title || !message || !type) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_FIELDS',
        message: 'Title, message, and type are required'
      });
    }

    const noticeData = {
      title,
      message,
      type,
      targetRegdNo: targetRegdNo || null,
      createdAt: new Date().toISOString()
    };

    const result = await dbService.addNotice(noticeData);

    if (result.success) {
      res.json({
        success: true,
        message: 'Notice posted successfully',
        data: result.notice
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'POST_FAILED',
        message: result.error
      });
    }
  } catch (error) {
    console.error('[Admin] Error posting notice:', error.message);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to post notice'
    });
  }
});

// POST /api/admin/auto-attendance - Generate attendance based on CGPA
router.post('/auto-attendance', async (req, res) => {
  try {
    const { branch, semester } = req.body;

    let conditions = [];
    let params = [];
    let paramIndex = 1;

    if (branch) {
      conditions.push(`branch ILIKE $${paramIndex++}`);
      params.push(`%${branch}%`);
    }

    if (semester) {
      conditions.push(`semester = $${paramIndex++}`);
      params.push(parseInt(semester));
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const studentsQuery = `
      SELECT regd_no, cgpa
      FROM students
      ${whereClause}
    `;
    
    const studentsResult = await dbService.query(studentsQuery, params);
    
    let updatedCount = 0;
    for (const student of studentsResult.rows) {
      let attendance;
      const cgpa = parseFloat(student.cgpa) || 0;
      
      if (cgpa >= 8.5) {
        attendance = 95 + Math.random() * 5; // 95-100%
      } else if (cgpa >= 8.0) {
        attendance = 80 + Math.random() * 15; // 80-95%
      } else if (cgpa >= 7.0) {
        attendance = 75 + Math.random() * 5; // 75-80%
      } else if (cgpa >= 6.5) {
        attendance = 65 + Math.random() * 10; // 65-75%
      } else {
        attendance = 55 + Math.random() * 10; // 55-65%
      }
      
      attendance = Math.min(100, Math.max(0, attendance));
      
      try {
        await dbService.updateStudentAttendance(student.regd_no, attendance.toFixed(2));
        updatedCount++;
      } catch (err) {
        console.error(`Error updating attendance for ${student.regd_no}:`, err.message);
      }
    }

    res.json({
      success: true,
      message: 'Auto-attendance generation completed',
      count: updatedCount
    });
  } catch (error) {
    console.error('[Admin] Error in auto-attendance generation:', error.message);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to generate auto-attendance'
    });
  }
});

// GET /api/admin/twilio-status - Check Twilio connection
router.get('/twilio-status', async (req, res) => {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken) {
      return res.json({
        success: false,
        connected: false,
        message: 'Twilio credentials not configured',
        config: {
          accountSid: accountSid ? '✓ Set' : '✗ Missing',
          authToken: authToken ? '✓ Set' : '✗ Missing',
          fromNumber: fromNumber || 'Not set'
        }
      });
    }

    // Try to validate credentials by fetching account info
    const twilio = require('twilio');
    const client = twilio(accountSid, authToken);

    try {
      const account = await client.api.accounts(accountSid).fetch();
      
      res.json({
        success: true,
        connected: true,
        message: 'Twilio connected successfully',
        account: {
          sid: account.sid,
          status: account.status,
          type: account.type,
          friendlyName: account.friendlyName
        },
        config: {
          accountSid: '✓ Valid',
          authToken: '✓ Valid',
          fromNumber: fromNumber || 'Not set'
        }
      });
    } catch (twilioError) {
      res.json({
        success: false,
        connected: false,
        message: 'Twilio credentials invalid',
        error: twilioError.message,
        config: {
          accountSid: accountSid ? '✓ Set' : '✗ Missing',
          authToken: authToken ? '✓ Set' : '✗ Missing',
          fromNumber: fromNumber || 'Not set'
        }
      });
    }
  } catch (error) {
    console.error('[Admin] Twilio status check error:', error.message);
    res.status(500).json({
      success: false,
      connected: false,
      message: 'Error checking Twilio status',
      error: error.message
    });
  }
});

module.exports = router;
