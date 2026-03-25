const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const ATTACHMENTS_DIR = path.resolve(__dirname, '..', 'uploads', 'notices');
fs.mkdirSync(ATTACHMENTS_DIR, { recursive: true });

const addColumnIfMissing = (table, column, definition) => {
  db.all(`PRAGMA table_info(${table})`, (err, rows) => {
    if (err) {
      console.error(`[SQLite] Unable to inspect ${table}:`, err.message);
      return;
    }
    const exists = rows.some(row => row.name === column);
    if (!exists) {
      db.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`, (alterErr) => {
        if (alterErr) {
          console.error(`[SQLite] Failed to add column ${column} to ${table}:`, alterErr.message);
        } else {
          console.log(`[SQLite] Added column ${column} to ${table}`);
        }
      });
    }
  });
};

const ensureNotificationColumns = () => {
  [
    { name: 'attachment_name', definition: 'TEXT' },
    { name: 'attachment_path', definition: 'TEXT' },
    { name: 'attachment_type', definition: 'TEXT' },
    { name: 'attachment_size', definition: 'INTEGER' }
  ].forEach(col => addColumnIfMissing('notifications', col.name, col.definition));
};

// Database configuration
const dbPath = path.resolve(__dirname, 'student_results.db');
// Initialize Database Tables
const initDb = () => {
  db.serialize(() => {
    // 1. Students Table
    db.run(`
      CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        regd_no TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        mobile TEXT NOT NULL,
        email TEXT,
        cgpa REAL,
        sgpa REAL,
        semester INTEGER,
        branch TEXT,
        counsellor TEXT,
        total_tuition_fee REAL,
        scholarship_applied REAL,
        net_payable_amount REAL,
        amount_paid REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Detailed Marks Table
    db.run(`
      CREATE TABLE IF NOT EXISTS detailed_marks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER,
        subject_name TEXT NOT NULL,
        grade TEXT,
        m1 REAL,
        pre_t1 REAL,
        t2 REAL,
        t3 REAL,
        t4 REAL,
        t5_1 REAL,
        t5_2 REAL,
        t5_3 REAL,
        t5_4 REAL,
        t5_avg REAL,
        final_total REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
      )
    `);

    // 3. Attendance Table
    db.run(`
      CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER,
        semester INTEGER NOT NULL,
        subject_name TEXT NOT NULL,
        total_classes INTEGER DEFAULT 0,
        attended_classes INTEGER DEFAULT 0,
        attendance_percentage REAL,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
      )
    `);

    // 4. Academic Status Table
    db.run(`
      CREATE TABLE IF NOT EXISTS academic_status (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER UNIQUE,
        active_backlogs INTEGER DEFAULT 0,
        cleared_backlogs INTEGER DEFAULT 0,
        repeated_subjects TEXT,
        incomplete_subjects TEXT,
        course_completion_status TEXT DEFAULT 'In Progress',
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
      )
    `);

    // 5. Notifications Table
    db.run(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT DEFAULT 'Notice',
        target_role TEXT DEFAULT 'All',
        target_student_id INTEGER,
        posted_by TEXT DEFAULT 'Admin',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME,
        attachment_name TEXT,
        attachment_path TEXT,
        attachment_type TEXT,
        attachment_size INTEGER,
        FOREIGN KEY (target_student_id) REFERENCES students(id) ON DELETE CASCADE
      )
    `);
    ensureNotificationColumns();

    // 6. Faculty Contacts Table
    db.run(`
      CREATE TABLE IF NOT EXISTS faculty_contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        email TEXT,
        mobile TEXT,
        office_location TEXT,
        department TEXT
      )
    `);

    console.log('[SQLite] All required ERP tables validated/created');
  });
};

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('[SQLite] Unexpected error:', err.message);
  } else {
    console.log('[SQLite] Connected to database');
    initDb();
  }
});

class DatabaseService {
  constructor() {
    this.db = db;
  }

  // Helper method for running queries
  query(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Get all students
  async getAllStudents() {
    try {
      const result = await this.query('SELECT * FROM students ORDER BY regd_no');
      return result;
    } catch (error) {
      console.error('[DB] Error getting all students:', error.message);
      throw error;
    }
  }

  // Get student by registration number
  async getStudentByRegdNo(regdNo) {
    try {
      const normalizedRegd = regdNo.toString().toUpperCase().trim();
      const result = await this.query(
        'SELECT * FROM students WHERE UPPER(regd_no) = ?',
        [normalizedRegd]
      );
      return result[0] || null;
    } catch (error) {
      console.error('[DB] Error getting student:', error.message);
      throw error;
    }
  }

  // Check if student exists
  async studentExists(regdNo) {
    const student = await this.getStudentByRegdNo(regdNo);
    return student !== null;
  }

  // Get student with subjects
  async getStudentWithSubjects(regdNo) {
    try {
      const normalizedRegd = regdNo.toString().toUpperCase().trim();
      
      // Get student
      const studentResult = await this.query(
        'SELECT * FROM students WHERE UPPER(regd_no) = ?',
        [normalizedRegd]
      );
      
      if (!studentResult[0]) return null;
      
      const student = studentResult[0];
      
      // Get detailed marks
      const marksResult = await this.query(
        'SELECT * FROM detailed_marks WHERE student_id = ? ORDER BY id',
        [student.id]
      );
      
      return {
        ...student,
        subjects: marksResult.map(s => ({
          subject: s.subject_name,
          grade: s.grade,
          m1: s.m1,
          pre_t1: s.pre_t1,
          t2: s.t2,
          t3: s.t3,
          t4: s.t4,
          t5_1: s.t5_1,
          t5_2: s.t5_2,
          t5_3: s.t5_3,
          t5_4: s.t5_4,
          t5_avg: s.t5_avg,
          final_total: s['final_total'],
          marks: s.final_total || 0,
          max_marks: 100
        }))
      };
    } catch (error) {
      console.error('[DB] Error getting student with subjects:', error.message);
      throw error;
    }
  }

  // Get full ERP Dashboard data for a student
  async getStudentDashboardData(regdNo) {
    try {
      const studentData = await this.getStudentWithSubjects(regdNo);
      if (!studentData) return null;

      const studentId = studentData.id;

      // Fetch Attendance
      const attendance = await this.query(
        'SELECT * FROM attendance WHERE student_id = ?', [studentId]
      );

      // Fetch Academic Status
      const academicStatus = await this.query(
        'SELECT * FROM academic_status WHERE student_id = ?', [studentId]
      );

      // Fetch specific and global notifications
      const notifications = await this.query(
        `SELECT * FROM notifications 
         WHERE target_student_id = ? OR target_student_id IS NULL 
         ORDER BY created_at DESC LIMIT 10`, 
        [studentId]
      );

      // Fetch Faculty Contacts
      const faculty = await this.query('SELECT * FROM faculty_contacts');

      return {
        ...studentData,
        attendanceRecords: attendance,
        academicStatus: academicStatus[0] || {
          active_backlogs: 0,
          cleared_backlogs: 0,
          repeated_subjects: 'None',
          incomplete_subjects: 'None',
          course_completion_status: 'In Progress'
        },
        notifications,
        facultyContacts: faculty
      };
    } catch (error) {
      console.error('[DB] Error generating ERP dashboard:', error.message);
      throw error;
    }
  }

  // Validate student phone number
  async validateStudentPhone(regdNo, phone) {
    try {
      const student = await this.getStudentByRegdNo(regdNo);
      
      if (!student) {
        return { valid: false, error: 'STUDENT_NOT_FOUND' };
      }
      
      const studentMobile = student.mobile;
      if (!studentMobile) {
        return { valid: false, error: 'NO_MOBILE_ON_RECORD' };
      }
      
      const cleanedInput = phone.replace(/\D/g, '');
      const cleanedStored = studentMobile.toString().replace(/\D/g, '');
      
      if (cleanedInput !== cleanedStored) {
        return { valid: false, error: 'MOBILE_MISMATCH', stored: cleanedStored };
      }
      
      return { valid: true, student };
    } catch (error) {
      console.error('[DB] Error validating phone:', error.message);
      throw error;
    }
  }

  // Get counsellor name
  async getCounsellorName(regdNo) {
    try {
      const student = await this.getStudentByRegdNo(regdNo);
      return student ? student.counsellor : null;
    } catch (error) {
      console.error('[DB] Error getting counsellor:', error.message);
      throw error;
    }
  }

  // Add new student
  async addStudent(studentData) {
    try {
      const {
        regd_no, name, mobile, email, cgpa, sgpa, semester, branch, counsellor,
        total_tuition_fee, scholarship_applied, net_payable_amount, amount_paid
      } = studentData;

      // Check if student already exists
      const exists = await this.studentExists(regd_no);
      if (exists) {
        throw new Error(`Student with Regd.No. ${regd_no} already exists`);
      }
      
      // We use this.db.run manually here to get the lastID
      return new Promise((resolve, reject) => {
        this.db.run(
          `INSERT INTO students (regd_no, name, mobile, email, cgpa, sgpa, semester, branch, counsellor,
           total_tuition_fee, scholarship_applied, net_payable_amount, amount_paid)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [regd_no, name, mobile, email, cgpa, sgpa, semester, branch, counsellor,
           total_tuition_fee, scholarship_applied, net_payable_amount, amount_paid],
          async function(err) {
            if (err) {
              console.error('[DB] Error adding student:', err.message);
              return resolve({ success: false, error: err.message });
            }
            
            console.log(`[DB] Added student: ${regd_no}`);
            const result = await dbService.getStudentByRegdNo(regd_no);
            resolve({ success: true, student: result });
          }
        );
      });
    } catch (error) {
       return { success: false, error: error.message };
    }
  }

  // Update student
  async updateStudent(regdNo, updates) {
    try {
      const normalizedRegd = regdNo.toString().toUpperCase().trim();
      
      // Build dynamic query
      const fields = [];
      const values = [];

      for (const [key, value] of Object.entries(updates)) {
        if (value !== undefined) {
          fields.push(`${key} = ?`);
          values.push(value);
        }
      }

      if (fields.length === 0) {
        throw new Error('No fields to update');
      }

      values.push(normalizedRegd);

      return new Promise((resolve, reject) => {
        this.db.run(
          `UPDATE students SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
           WHERE UPPER(regd_no) = ?`,
          values,
          async function(err) {
            if (err) {
              console.error('[DB] Error updating student:', err.message);
              return resolve({ success: false, error: err.message });
            }
            if (this.changes === 0) {
              return resolve({ success: false, error: `Student with Regd.No. ${regdNo} not found` });
            }
            
            console.log(`[DB] Updated student: ${regdNo}`);
            const result = await dbService.getStudentByRegdNo(regdNo);
            resolve({ success: true, student: result });
          }
        );
      });
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Delete student
  async deleteStudent(regdNo) {
    try {
      const normalizedRegd = regdNo.toString().toUpperCase().trim();
      
      return new Promise((resolve, reject) => {
        // Enforce Foreign Key pragmatic deletes via manual cascading or simple delete
        this.db.run(
          'DELETE FROM students WHERE UPPER(regd_no) = ?',
          [normalizedRegd],
          function(err) {
            if (err) {
               console.error('[DB] Error deleting student:', err.message);
               return resolve({ success: false, error: err.message });
            }
            if (this.changes === 0) {
               return resolve({ success: false, error: `Student with Regd.No. ${regdNo} not found` });
            }
            console.log(`[DB] Deleted student: ${regdNo}`);
            resolve({ success: true, message: `Student ${regdNo} deleted successfully` });
          }
        );
      });
    } catch (error) {
      console.error('[DB] Error deleting student:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Add or update detailed marks — supports partial updates (only passed fields are changed)
  async addOrUpdateDetailedMarks(regdNo, marksData) {
    try {
      const student = await this.getStudentByRegdNo(regdNo);
      if (!student) return { success: false, error: 'STUDENT_NOT_FOUND' };

      const { subject_name } = marksData;
      if (!subject_name) return { success: false, error: 'subject_name required' };

      return new Promise((resolve) => {
        this.db.get(
          'SELECT * FROM detailed_marks WHERE student_id = ? AND UPPER(subject_name) = UPPER(?)',
          [student.id, subject_name],
          (err, existingMarks) => {
            if (err) return resolve({ success: false, error: err.message });

            // Merge existing data with incoming updates
            const m = existingMarks ? { ...existingMarks, ...marksData } : { ...marksData };

            // Calculate t5_avg based on t5 assignments 1 through 4
            const t5_1 = parseFloat(m.t5_1) || 0;
            const t5_2 = parseFloat(m.t5_2) || 0;
            const t5_3 = parseFloat(m.t5_3) || 0;
            const t5_4 = parseFloat(m.t5_4) || 0;
            m.t5_avg = (t5_1 + t5_2 + t5_3 + t5_4) / 4;

            // Calculate final total based on respective max marks
            m.final_total = (parseFloat(m.m1) || 0) + (parseFloat(m.pre_t1) || 0) + 
                            (parseFloat(m.t2) || 0) + (parseFloat(m.t3) || 0) + 
                            (parseFloat(m.t4) || 0) + m.t5_avg;

            const updateCols = ['grade','m1','pre_t1','t2','t3','t4','t5_1','t5_2','t5_3','t5_4','t5_avg','final_total'];
            const updateVals = updateCols.map(c => m[c] !== undefined ? m[c] : null);

            if (existingMarks) {
              this.db.run(
                `UPDATE detailed_marks SET ${updateCols.map(c => `${c} = ?`).join(', ')} WHERE id = ?`,
                [...updateVals, existingMarks.id],
                function(e) {
                  if (e) return resolve({ success: false, error: e.message });
                  resolve({ success: true, message: 'Marks updated successfully' });
                }
              );
            } else {
              this.db.run(
                `INSERT INTO detailed_marks
                 (student_id, subject_name, grade, m1, pre_t1, t2, t3, t4, t5_1, t5_2, t5_3, t5_4, t5_avg, final_total)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [student.id, subject_name, ...updateVals],
                function(e) {
                  if (e) return resolve({ success: false, error: e.message });
                  resolve({ success: true, message: 'Marks added successfully' });
                }
              );
            }
          }
        );
      });
    } catch (error) {
      console.error('[DB] Error modifying detailed marks:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Create global or targeted notice

  async createNotice(title, message, type = 'Notice', targetRegdNo = null, postedBy = 'Admin', attachmentDetail = null) {
    try {
      let targetStudentId = null;
      if (targetRegdNo) {
        const student = await this.getStudentByRegdNo(targetRegdNo);
        if (!student) return { success: false, error: 'Target student not found' };
        targetStudentId = student.id;
      }

      const attachment_name = attachmentDetail?.attachment_name ?? null;
      const attachment_path = attachmentDetail?.attachment_path ?? null;
      const attachment_type = attachmentDetail?.attachment_type ?? null;
      const attachment_size = attachmentDetail?.attachment_size ?? null;

      return new Promise((resolve, reject) => {
        this.db.run(
          `INSERT INTO notifications (title, message, type, target_student_id, posted_by, attachment_name, attachment_path, attachment_type, attachment_size)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [title, message, type, targetStudentId, postedBy, attachment_name, attachment_path, attachment_type, attachment_size],
          function(e) {
            if (e) return resolve({ success: false, error: e.message });
            resolve({ success: true, message: 'Notice created successfully', noticeId: this.lastID });
          }
        );
      });
    } catch (error) {
      console.error('[DB] Error creating notice:', error.message);
      return { success: false, error: error.message };
    }
  }

  async getNotices(limit = 20) {
    try {
      const sql = `
        SELECT 
          n.*, 
          s.regd_no AS target_regd_no, 
          s.name AS target_name
        FROM notifications n
        LEFT JOIN students s ON s.id = n.target_student_id
        ORDER BY created_at DESC
        LIMIT ?
      `;
      return await this.query(sql, [limit]);
    } catch (error) {
      console.error('[DB] Error fetching notices:', error.message);
      throw error;
    }
  }

  // Update Attendance
  async updateAttendance(regdNo, semester, subjectName, totalClasses, attendedClasses) {
    try {
      const student = await this.getStudentByRegdNo(regdNo);
      if (!student) return { success: false, error: 'STUDENT_NOT_FOUND' };
      
      let attended = Math.min(attendedClasses, totalClasses);
      let percentage = totalClasses > 0 ? (attended / totalClasses) * 100 : 0;

      return new Promise((resolve, reject) => {
        this.db.get(
          'SELECT id FROM attendance WHERE student_id = ? AND semester = ? AND UPPER(subject_name) = UPPER(?)',
          [student.id, semester, subjectName],
          (err, row) => {
            if (err) return resolve({ success: false, error: err.message });
            
            if (row) {
              this.db.run(
                'UPDATE attendance SET total_classes=?, attended_classes=?, attendance_percentage=? WHERE id=?',
                [totalClasses, attended, percentage, row.id],
                function(e) {
                  if (e) return resolve({ success: false, error: e.message });
                  resolve({ success: true, message: 'Attendance updated' });
                }
              );
            } else {
              this.db.run(
                'INSERT INTO attendance (student_id, semester, subject_name, total_classes, attended_classes, attendance_percentage) VALUES (?, ?, ?, ?, ?, ?)',
                [student.id, semester, subjectName, totalClasses, attended, percentage],
                function(e) {
                  if (e) return resolve({ success: false, error: e.message });
                  resolve({ success: true, message: 'Attendance added' });
                }
              );
            }
          }
        );
      });
    } catch(err) {
      console.error('[DB] Error modifying attendance:', err.message);
      return { success: false, error: err.message };
    }
  }

  // Update Academic Status
  async updateAcademicStatus(regdNo, statusData) {
    try {
      const student = await this.getStudentByRegdNo(regdNo);
      if (!student) return { success: false, error: 'STUDENT_NOT_FOUND' };

      const { active_backlogs = 0, cleared_backlogs = 0, repeated_subjects = '', incomplete_subjects = '', course_completion_status = 'In Progress' } = statusData;

      return new Promise((resolve) => {
        this.db.get('SELECT id FROM academic_status WHERE student_id = ?', [student.id], (err, row) => {
          if (err) return resolve({ success: false, error: err.message });
          
          if (row) {
            this.db.run(
              'UPDATE academic_status SET active_backlogs=?, cleared_backlogs=?, repeated_subjects=?, incomplete_subjects=?, course_completion_status=?, last_updated=CURRENT_TIMESTAMP WHERE id=?',
              [active_backlogs, cleared_backlogs, repeated_subjects, incomplete_subjects, course_completion_status, row.id],
              (e) => e ? resolve({ success: false, error: e.message }) : resolve({ success: true, message: 'Academic status updated' })
            );
          } else {
            this.db.run(
              'INSERT INTO academic_status (student_id, active_backlogs, cleared_backlogs, repeated_subjects, incomplete_subjects, course_completion_status) VALUES (?, ?, ?, ?, ?, ?)',
              [student.id, active_backlogs, cleared_backlogs, repeated_subjects, incomplete_subjects, course_completion_status],
              (e) => e ? resolve({ success: false, error: e.message }) : resolve({ success: true, message: 'Academic status added' })
            );
          }
        });
      });
    } catch(err) {
      console.error('[DB] Error modifying academic status:', err.message);
      return { success: false, error: err.message };
    }
  }

  // Get student results formatted for API
  async getStudentResults(regdNo) {
    try {
      // Changed to use getStudentDashboardData to grab the full ERP payload
      const erpData = await this.getStudentDashboardData(regdNo);
      
      if (!erpData) return null;

      return {
        registrationNumber: erpData.regd_no,
        name: erpData.name,
        cgpa: erpData.cgpa,
        sgpa: erpData.sgpa,
        semester: erpData.semester,
        branch: erpData.branch,
        counsellor: erpData.counsellor,
        feeDetails: {
          totalTuitionFee: erpData.total_tuition_fee,
          scholarshipApplied: erpData.scholarship_applied,
          netPayableAmount: erpData.net_payable_amount,
          amountPaid: erpData.amount_paid
        },
        subjectResults: erpData.subjects, // Contains the detailed marks!
        attendance: erpData.attendanceRecords,
        status: erpData.academicStatus,
        notifications: erpData.notifications,
        contacts: erpData.facultyContacts,
        mobile: erpData.mobile,
        email: erpData.email
      };
    } catch (error) {
      console.error('[DB] Error getting student ERP payload:', error.message);
      throw error;
    }
  }
}

// Create singleton instance
const dbService = new DatabaseService();

module.exports = dbService;
