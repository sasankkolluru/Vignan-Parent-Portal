# Parent Portal - Real-Time API Documentation

This directory documents the API endpoints powering the Vignan University Parent Verification and Student Information Chatbot System. The API acts as a real-time bridge between the uploaded `Updated_Counselling_Allocation_with_Marks.csv` and the React frontend.

## Base URL
`http://localhost:5000/api`

## Endpoints

### 1. Request OTP
**POST** `/auth/request-otp`
- **Description:** Verifies if the `RegdNo` exists in the dataset and triggers an OTP to the registered phone number.
- **Body:** `{ "regNo": "231FA04001", "phone": "9876543210" }`
- **Response:** `{ "success": true, "message": "OTP sent to 9876543210" }`

### 2. Verify OTP
**POST** `/auth/verify-otp`
- **Description:** Verifies the OTP (Use Universal Bypass: `123456` with phone `7989454441`). Returns the verified `studentRegdNo` token.
- **Body:** `{ "regNo": "231FA04001", "phone": "7989454441", "otp": "123456" }`
- **Response:** `{ "success": true, "token": "mock_jwt", "studentRegdNo": "231FA04001" }`

### 3. Get Student Data List
**GET** `/students`
- **Description:** Returns the entire parsed CSV dataset as an array of JSON objects.
- **Response:** `{ "success": true, "count": 168, "data": [...] }`

### 4. Get Live Individual Student Data
**GET** `/students/:regNo`
- **Description:** Fetches real-time mapped marks, CGPA, Attendance, Counsellor, and Fee boundaries for a specific student.
- **Response:** `{ "success": true, "data": { "Name of The Student": "...", "CGPA": "8.5", "Total Tuition Fee": "85000", ... } }`
