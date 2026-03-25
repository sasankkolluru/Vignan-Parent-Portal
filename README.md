# Vignan Parent Portal Hackathon

A comprehensive student management system built for Vignan's University, featuring student and admin portals, academic analytics, attendance, fee tracking, and real-time updates.

## 📁 Project Structure

```
root/
├─ backend/                # Express API server, routes, database service, OTP, admin and student APIs
│   ├─ api/
│   ├─ database/
│   ├─ uploads/
│   ├─ index.js
│   ├─ server.js
│   └─ package.json
├─ frontend/               # React + Vite frontend app with layouts, pages, and components
│   ├─ public/
│   ├─ src/
│   │   ├─ api/
│   │   ├─ components/
│   │   ├─ layouts/
│   │   ├─ pages/
│   │   └─ services/
│   ├─ package.json
│   └─ vite.config.js
├─ demo hacki - Copy/      # Demo copy duplicate project folder for experiments
├─ README.md
└─ .gitignore
```

### Brief Description

This project provides a complete university parent portal with:
- Student dashboard for grades, attendance, fees, and performance insights.
- Admin dashboard for managing students, marks, fees, and notifications.
- Secure authentication and OTP support.
- SQLite DB backend and real-time Socket.IO updates.

## 🚀 Features

### Student Portal
- **Academic Dashboard**: View grades, CGPA, SGPA, and semester-wise performance
- **Attendance Tracking**: Monitor attendance records and historical data
- **Fee Management**: Check fee status, payment history, and outstanding amounts
- **Performance Insights**: Detailed subject-wise analysis and comparisons
- **Real-time Updates**: Live data synchronization using Socket.IO

### Admin Portal
- **Student Management**: Complete CRUD operations for all 1340+ students
- **Bulk Operations**: Import/Export student data via CSV
- **Academic Records**: Edit marks, grades, and subject details
- **Fee Administration**: Manage fee structures and payment tracking
- **Analytics Dashboard**: Comprehensive statistics and reporting
- **Notification System**: Send alerts to students and parents

## 🛠️ Tech Stack

### Frontend
- **React 18** with Vite for fast development
- **Tailwind CSS** for modern, responsive design
- **React Router** for navigation
- **Lucide React** for beautiful icons
- **Socket.IO Client** for real-time updates

### Backend
- **Node.js** with Express.js
- **SQLite3** database for data persistence
- **Socket.IO** for real-time communication
- **JWT** for authentication
- **Multer** for file uploads
- **Twilio** for SMS/OTP services

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/sasankkolluru/Vigan-Parent-Portal-Hackaton.git
   cd Vigan-Parent-Portal-Hackaton
   ```

2. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Environment Setup**
   ```bash
   # Backend
   cp .env.example .env
   # Frontend
   cp .env.example .env
   ```

5. **Import Student Data** (Optional)
   ```bash
   cd backend
   node scripts/importCSV.js
   ```

### Running the Application

1. **Start Backend Server**
   ```bash
   cd backend
   npm start
   # Server runs on http://localhost:5000
   ```

2. **Start Frontend Development Server**
   ```bash
   cd frontend
   npm run dev
   # Frontend runs on http://localhost:5173
   ```

## 🎯 Key Features Implemented

### ✅ Student Data Management
- **Complete CRUD Operations**: Create, Read, Update, Delete student records
- **Bulk Import**: CSV import for 1340+ students
- **Real-time Updates**: Live data synchronization
- **Advanced Filtering**: Search by name, registration, branch, semester

### ✅ Academic Performance
- **Grade Tracking**: Subject-wise grades and marks
- **CGPA/SGPA Calculation**: Automatic GPA computation
- **Performance Analytics**: Detailed performance insights

### ✅ Admin Dashboard
- **Student Statistics**: Real-time student count and metrics
- **Performance Analytics**: Academic performance insights
- **Edit Functionality**: Update student marks and profiles

## 🎨 UI/UX Features

### ✅ Modern Design
- **Responsive Layout**: Works on all devices
- **Professional Theme**: Clean, modern interface
- **Vignan Branding**: Professional university branding
- **Intro Screen**: Animated welcome screen (7 seconds)

## 🔧 API Endpoints

### Student APIs
- `GET /api/student/:regdNo` - Get student by registration number
- `GET /api/student/all/list` - Get all students with pagination

### Admin APIs
- `POST /api/admin/login` - Admin authentication
- `GET /api/admin/students` - Get all students with filters
- `PUT /api/admin/students/:regdNo` - Update student details
- `POST /api/admin/students/:regdNo/marks` - Update student marks

## 📞 Support

- **Developer**: Sasank Kolluru
- **Repository**: https://github.com/sasankkolluru/Vigan-Parent-Portal-Hackaton

---

**🎓 Built with ❤️ for Vignan's University**
