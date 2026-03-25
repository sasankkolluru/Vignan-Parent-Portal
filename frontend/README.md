# Vignan's University - Parent Portal & Chatbot System

A secure, mobile-first web application designed to allow parents to access their child's academic information through an intuitive conversational chatbot interface and traditional dashboard pages. Designed specifically for ease of use, ensuring accessibility for all parents regardless of technical literacy.

## 🌟 Key Philosophy
- **Simple Authentication**: Phone number + OTP login. No complex passwords required.
- **Dual Interface**: Access information via traditional visual dashboards or simply ask the AI Chatbot.
- **Accessibility**: Quick-action buttons and summarized data for parents who may not be highly technical.
- **Vignan's University Experience**: Professional Navy Blue and Gold aesthetic integrating the official logo and branding guidelines.

## 🛠️ Technology Stack (Frontend)
- **Framework**: React 18+ (via Vite for lightning-fast builds)
- **Styling**: Tailwind CSS v3 (Custom Vignan Theme with Glassmorphism)
- **Routing**: React Router DOM (v6)
- **Icons**: Lucide React
- **Architecture**: Mobile-first, component-driven architecture.

---

## ✅ Implementation Checklist (Design Brief Alignment)

### 1. Welcome & Authentication Gateway (Page 1 & 2)
- [x] Institution-branded hero section with Vignan logo.
- [x] Simple Phone/Registration Input UI.
- [x] OTP Verification screen with auto-advance and countdown timer features visually structured.
- [x] Secure session handling architecture (simulated, ready for backend hookup).

### 2. Parent Dashboard / Command Center (Page 3)
- [x] Overview Cards: Attendance, CGPA, Fee Alerts.
- [x] Quick Actions to jump to major app sections.
- [x] Embedded chatbot overview right on the dashboard.
- [x] Glassmorphism card-based layout with responsive breakpoints.

### 3. Academic Monitoring Center (Page 4)
- [x] Overall Attendance Section with visual color indicators (green/yellow/red).
- [x] Subject-wise breakdown.
- [x] Historical semester-wise attendance reports.

### 4. Academic Performance Center (Page 5)
- [x] Current CGPA and Semester-wise SGPA tracking via tables.
- [x] Subject-wise marks with internal/external breakdown.
- [x] Backlog, Incomplete, and Repeated Subjects tracking with dedicated views.

### 5. Performance Insights - AI-Powered (Page 6)
- [x] Highlights of Academic Strengths & Areas for Improvement.
- [x] Auto-generated actionable recommendations in chat-bubble formats.

### 6. Financial Hub (Page 7)
- [x] Current fee status (Total, Paid, Pending, Scholarships) with dynamic indicators.
- [x] Pay Now UI blocks.
- [x] Historical payment transaction tabular layout with reference numbers.

### 7. Communication & Support Directory (Page 8)
- [x] Searchable faculty and class advisor contacts list.
- [x] Location, email, phone, and office hours display.

### 8. Notifications & Calendar Center (Page 9)
- [x] Filtered feed (Exams, Assignments, General Calendar).
- [x] Visual badge indicators for upcoming deadlines and events.

### 9. AI Chat Interface (Page 10)
- [x] Bubble chat UI integrated into the main dashboard.
- [x] Quick-action suggestion chips for illiterate/non-technical users ("Show attendance").
- [x] Bot typing and message simulated states.

### 10. Settings & Profile Management (Page 11)
- [x] Linked student profile view.
- [x] Parent profile and preferences (Language toggles, Notifications).
- [x] Secure Logout flow.

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation
1. Navigate to the project directory:
   ```bash
   cd "C:\Users\SASANK KOLLURU\OneDrive\Desktop\hacki"
   ```
2. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to the localhost port provided in the terminal (e.g., `http://localhost:5173/` or `http://localhost:5174/`).

*(Note: The backend/database integration specifications will be provided separately.)*
