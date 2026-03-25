const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

// Ensure uploads folder exists
const ATTACHMENTS_DIR = path.resolve(__dirname, "..", "uploads", "notices");
fs.mkdirSync(ATTACHMENTS_DIR, { recursive: true });

// DB Path
const dbPath = path.resolve(__dirname, "student_results.db");

// Initialize DB
let db;
try {
  db = new Database(dbPath);
  console.log("[SQLite] Connected to database");
  initDb();
} catch (err) {
  console.error("[SQLite] Connection error:", err.message);
}

// Add column if missing
const addColumnIfMissing = (table, column, definition) => {
  try {
    const rows = db.prepare(`PRAGMA table_info(${table})`).all();
    const exists = rows.some((row) => row.name === column);

    if (!exists) {
      db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`).run();
      console.log(`[SQLite] Added column ${column} to ${table}`);
    }
  } catch (err) {
    console.error(`[SQLite] Error modifying ${table}:`, err.message);
  }
};

const ensureNotificationColumns = () => {
  [
    { name: "attachment_name", definition: "TEXT" },
    { name: "attachment_path", definition: "TEXT" },
    { name: "attachment_type", definition: "TEXT" },
    { name: "attachment_size", definition: "INTEGER" },
  ].forEach((col) => addColumnIfMissing("notifications", col.name, col.definition));
};

// Initialize tables
function initDb() {
  db.prepare(`
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
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS detailed_marks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER,
      subject_name TEXT,
      grade TEXT,
      m1 REAL, pre_t1 REAL, t2 REAL, t3 REAL, t4 REAL,
      t5_1 REAL, t5_2 REAL, t5_3 REAL, t5_4 REAL,
      t5_avg REAL, final_total REAL
    )
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER,
      semester INTEGER,
      subject_name TEXT,
      total_classes INTEGER,
      attended_classes INTEGER,
      attendance_percentage REAL
    )
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      message TEXT,
      type TEXT,
      target_student_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      attachment_name TEXT,
      attachment_path TEXT,
      attachment_type TEXT,
      attachment_size INTEGER
    )
  `).run();

  ensureNotificationColumns();

  console.log("[SQLite] Tables ready");
}

// Service Class
class DatabaseService {
  constructor() {
    this.db = db;
  }

  query(sql, params = []) {
    return this.db.prepare(sql).all(params);
  }

  getStudentByRegdNo(regdNo) {
    return this.db
      .prepare("SELECT * FROM students WHERE UPPER(regd_no)=?")
      .get(regdNo.toUpperCase());
  }

  getAllStudents() {
    return this.query("SELECT * FROM students ORDER BY regd_no");
  }

  addStudent(data) {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO students (regd_no,name,mobile,email,cgpa,sgpa,semester,branch,counsellor)
        VALUES (?,?,?,?,?,?,?,?,?)
      `);

      stmt.run(
        data.regd_no,
        data.name,
        data.mobile,
        data.email,
        data.cgpa,
        data.sgpa,
        data.semester,
        data.branch,
        data.counsellor
      );

      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  deleteStudent(regdNo) {
    const result = this.db
      .prepare("DELETE FROM students WHERE UPPER(regd_no)=?")
      .run(regdNo.toUpperCase());

    return result.changes > 0
      ? { success: true }
      : { success: false, error: "Not found" };
  }

  addOrUpdateMarks(regdNo, marks) {
    const student = this.getStudentByRegdNo(regdNo);
    if (!student) return { success: false };

    const existing = this.db
      .prepare("SELECT * FROM detailed_marks WHERE student_id=? AND subject_name=?")
      .get(student.id, marks.subject_name);

    const t5_avg =
      ((marks.t5_1 || 0) +
        (marks.t5_2 || 0) +
        (marks.t5_3 || 0) +
        (marks.t5_4 || 0)) /
      4;

    const final_total =
      (marks.m1 || 0) +
      (marks.pre_t1 || 0) +
      (marks.t2 || 0) +
      (marks.t3 || 0) +
      (marks.t4 || 0) +
      t5_avg;

    if (existing) {
      this.db.prepare(`
        UPDATE detailed_marks SET
        grade=?, m1=?, pre_t1=?, t2=?, t3=?, t4=?,
        t5_1=?, t5_2=?, t5_3=?, t5_4=?, t5_avg=?, final_total=?
        WHERE id=?
      `).run(
        marks.grade,
        marks.m1,
        marks.pre_t1,
        marks.t2,
        marks.t3,
        marks.t4,
        marks.t5_1,
        marks.t5_2,
        marks.t5_3,
        marks.t5_4,
        t5_avg,
        final_total,
        existing.id
      );
    } else {
      this.db.prepare(`
        INSERT INTO detailed_marks
        (student_id,subject_name,grade,m1,pre_t1,t2,t3,t4,
        t5_1,t5_2,t5_3,t5_4,t5_avg,final_total)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      `).run(
        student.id,
        marks.subject_name,
        marks.grade,
        marks.m1,
        marks.pre_t1,
        marks.t2,
        marks.t3,
        marks.t4,
        marks.t5_1,
        marks.t5_2,
        marks.t5_3,
        marks.t5_4,
        t5_avg,
        final_total
      );
    }

    return { success: true };
  }
}

// Export
module.exports = new DatabaseService();