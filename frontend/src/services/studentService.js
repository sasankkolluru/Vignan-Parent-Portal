const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function getParentSessionRegdNo() {
  if (typeof window === 'undefined') return '';

  const session = localStorage.getItem('parent_session');
  if (session) {
    try {
      const parsed = JSON.parse(session);
      const candidate = parsed.regdNo || parsed.studentRegdNo || parsed.registrationNumber || parsed.student?.registrationNumber || parsed.student?.regd_no;
      if (candidate) return candidate.toString().toUpperCase();
    } catch (error) {
      console.warn('[studentService] Invalid parent_session payload', error);
    }
  }

  const studentData = localStorage.getItem('studentData');
  if (studentData) {
    try {
      const parsed = JSON.parse(studentData);
      const candidate = parsed.registrationNumber || parsed.regd_no || parsed.regdNo;
      if (candidate) return candidate.toString().toUpperCase();
    } catch (error) {
      console.warn('[studentService] Invalid studentData payload', error);
    }
  }

  return '';
}

export async function fetchStudentRecord(regdNo) {
  if (!regdNo) return null;
  const response = await fetch(`${API_URL}/api/student/${regdNo}`);
  if (!response.ok) {
    throw new Error('Failed to reach ERP API');
  }
  const payload = await response.json();
  if (!payload.success) {
    throw new Error(payload.message || 'Unable to load student data');
  }
  return payload.data;
}
