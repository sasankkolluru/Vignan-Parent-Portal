const express = require('express');
const dbService = require('../database/dbService');

const UPLOADS_BASE_URL = process.env.UPLOADS_BASE_URL || 'http://localhost:5000/uploads';
const formatAttachmentUrl = (relativePath) => {
  if (!relativePath) return null;
  const trimmed = relativePath.replace(/^\/+/, '');
  return `${UPLOADS_BASE_URL.replace(/\/$/, '')}/${trimmed}`;
};

const router = express.Router();

// GET /api/student/:regdNo - Fetch full ERP student record (for parent dashboard)
router.get('/:regdNo', async (req, res) => {
  try {
    const { regdNo } = req.params;

    if (!regdNo) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_REGD_NO',
        message: 'Registration number is required'
      });
    }

    const normalizedRegd = regdNo.toString().toUpperCase().trim();

    // Try rich ERP dashboard data first (new tables)
    let dashData = null;
    if (typeof dbService.getStudentDashboardData === 'function') {
      dashData = await dbService.getStudentDashboardData(normalizedRegd);
    }

    if (dashData) {
      // Map to the shape DashboardPage.jsx expects
      const student = {
        registrationNumber: dashData.regd_no,
        name:               dashData.name,
        branch:             dashData.branch,
        semester:           dashData.semester,
        cgpa:               dashData.cgpa,
        sgpa:               dashData.sgpa,
        counsellor:         dashData.counsellor || 'Raghuram',
        // Subject marks
        subjectResults: (dashData.subjects || []).map(s => ({
          subject:    s.subject,
          grade:      s.grade,
          m1:         s.m1,
          pre_t1:     s.pre_t1,
          t2:         s.t2,
          t3:         s.t3,
          t4:         s.t4,
          t5_1:       s.t5_1,
          t5_2:       s.t5_2,
          t5_3:       s.t5_3,
          t5_4:       s.t5_4,
          t5_avg:     s.t5_avg,
          final_total:s.final_total,
          // Backward compatibility for old frontend React code
          marks:      s.final_total || 0,
          max_marks:  100
        })),
        // Attendance
        attendance: (dashData.attendanceRecords || []),
        // Academic status
        status: dashData.academicStatus || {},
        // Notifications
        notifications: (dashData.notifications || []).map(n => ({
          ...n,
          attachment_url: formatAttachmentUrl(n.attachment_path)
        })),
        // Faculty contacts
        contacts: (dashData.facultyContacts && dashData.facultyContacts.length > 0) ? dashData.facultyContacts : [
          { name: dashData.counsellor || 'Raghuram', role: 'Counsellor', mobile: '7989454441' },
          { name: 'Admin Support', role: 'Support', mobile: '9989884558' }
        ],
        // Fee details
        feeDetails: {
          totalTuitionFee:    dashData.total_tuition_fee,
          scholarshipApplied: dashData.scholarship_applied,
          netPayableAmount:   dashData.net_payable_amount,
          amountPaid:         dashData.amount_paid
        }
      };
      return res.json({ success: true, message: 'Student record found', data: student });
    }

    // Fallback: basic student lookup
    const student = await dbService.getStudentByRegdNo(normalizedRegd);

    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'STUDENT_NOT_FOUND',
        message: 'Invalid Registration Number. Student not found in database.'
      });
    }

    student.contacts = [
      { name: student.counsellor || 'Raghuram', role: 'Counsellor', mobile: '7989454441' },
      { name: 'Admin Support', role: 'Support', mobile: '9989884558' }
    ];

    res.json({
      success: true,
      message: 'Student record found',
      data: student
    });
  } catch (error) {
    console.error('[Students API] Error fetching student:', error.message);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to fetch student record. Please try again.'
    });
  }
});

// GET /api/student/:regdNo/counsellor - Get counsellor name only
router.get('/:regdNo/counsellor', async (req, res) => {
  try {
    const { regdNo } = req.params;
    const counsellor = await dbService.getCounsellorName(regdNo);

    if (!counsellor) {
      return res.status(404).json({
        success: false,
        error: 'COUNSELLOR_NOT_FOUND',
        message: 'Counsellor information not found'
      });
    }

    res.json({
      success: true,
      data: { counsellor }
    });
  } catch (error) {
    console.error('[Students API] Error fetching counsellor:', error.message);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to fetch counsellor information'
    });
  }
});

// GET /api/student/:regdNo/mobile - Get student mobile
router.get('/:regdNo/mobile', async (req, res) => {
  try {
    const { regdNo } = req.params;
    const student = await dbService.getStudentByRegdNo(regdNo);
    const mobile = student ? student.mobile : null;

    if (!mobile) {
      return res.status(404).json({
        success: false,
        error: 'MOBILE_NOT_FOUND',
        message: 'Mobile number not found for this student'
      });
    }

    res.json({
      success: true,
      data: { mobile }
    });
  } catch (error) {
    console.error('[Students API] Error fetching mobile:', error.message);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to fetch mobile number'
    });
  }
});

// POST /api/student - Add new student (Admin only)
router.post('/', async (req, res) => {
  try {
    const studentData = req.body;

    // Validate required fields
    if (!studentData['Regd.No.']) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_REGD_NO',
        message: 'Registration Number (Regd.No.) is required'
      });
    }

    // Map Excel field names to database column names
    const dbData = {
      regd_no: studentData['Regd.No.'],
      name: studentData['Name'],
      mobile: studentData['Mobile'],
      email: studentData['Email'],
      cgpa: studentData['CGPA'],
      sgpa: studentData['SGPA'],
      semester: studentData['Semester'],
      branch: studentData['Branch'],
      counsellor: studentData['Counsellor'],
      total_tuition_fee: studentData['Total Tuition Fee'],
      scholarship_applied: studentData['Scholarship Applied'],
      net_payable_amount: studentData['Net Payable Amount'],
      amount_paid: studentData['Amount Paid']
    };

    const result = await dbService.addStudent(dbData);

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
    console.error('[Students API] Error adding student:', error.message);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to add student. Please try again.'
    });
  }
});

// PUT /api/student/:regdNo - Update student (Admin only)
router.put('/:regdNo', async (req, res) => {
  try {
    const { regdNo } = req.params;
    const updates = req.body;

    // Map Excel field names to database column names
    const dbUpdates = {};
    const fieldMapping = {
      'Name': 'name',
      'Mobile': 'mobile',
      'Email': 'email',
      'CGPA': 'cgpa',
      'SGPA': 'sgpa',
      'Semester': 'semester',
      'Branch': 'branch',
      'Counsellor': 'counsellor',
      'Total Tuition Fee': 'total_tuition_fee',
      'Scholarship Applied': 'scholarship_applied',
      'Net Payable Amount': 'net_payable_amount',
      'Amount Paid': 'amount_paid'
    };

    for (const [excelField, dbField] of Object.entries(fieldMapping)) {
      if (updates[excelField] !== undefined) {
        dbUpdates[dbField] = updates[excelField];
      } else if (updates[dbField] !== undefined) {
        // Also accept standard database/JSON lowercase keys
        dbUpdates[dbField] = updates[dbField];
      }
    }

    if (Object.keys(dbUpdates).length === 0) {
       return res.status(400).json({ success: false, error: 'NO_UPDATES', message: 'No valid fields provided to update.' });
    }

    const result = await dbService.updateStudent(regdNo, dbUpdates);

    if (result.success) {
      res.json({
        success: true,
        message: 'Student updated successfully',
        data: result.student
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'UPDATE_FAILED',
        message: result.error
      });
    }
  } catch (error) {
    console.error('[Students API] Error updating student:', error.message);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to update student. Please try again.'
    });
  }
});

// DELETE /api/student/:regdNo - Delete student (Admin only)
router.delete('/:regdNo', async (req, res) => {
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
    console.error('[Students API] Error deleting student:', error.message);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to delete student. Please try again.'
    });
  }
});

// GET /api/students/all - Get all students (Admin only, paginated)
router.get('/all/list', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const allStudents = await dbService.getAllStudents();
    
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedStudents = allStudents.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedStudents,
      pagination: {
        total: allStudents.length,
        page,
        limit,
        totalPages: Math.ceil(allStudents.length / limit)
      }
    });
  } catch (error) {
    console.error('[Students API] Error fetching all students:', error.message);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to fetch students list'
    });
  }
});

module.exports = router;
