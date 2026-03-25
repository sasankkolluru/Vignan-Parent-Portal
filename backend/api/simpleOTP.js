const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// Simple in-memory OTP store
const otpStore = new Map();

// Generate and display OTP immediately
router.post('/send-otp-simple', (req, res) => {
  const { regdNo, phone } = req.body;
  
  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const sessionId = uuidv4();
  
  // Store OTP
  otpStore.set(sessionId, {
    otp,
    regdNo: regdNo.toUpperCase(),
    phone,
    createdAt: Date.now(),
    expiresAt: Date.now() + (2 * 60 * 1000) // 2 minutes
  });
  
  // Display OTP in console with large text
  console.log('\n' + '='.repeat(80));
  console.log(' '.repeat(30) + 'OTP GENERATED');
  console.log('='.repeat(80));
  console.log(' '.repeat(20) + `YOUR ONE TIME PASSWORD IS: ${otp}`);
  console.log('='.repeat(80));
  console.log(`Registration: ${regdNo.toUpperCase()}`);
  console.log(`Phone: ${phone}`);
  console.log(`Session ID: ${sessionId}`);
  console.log(`Valid for: 2 minutes`);
  console.log('='.repeat(80));
  console.log('\n');
  
  // Also show in Windows popup
  try {
    const { spawn } = require('child_process');
    spawn('powershell', ['-Command', `[System.Windows.Forms.MessageBox]::Show("Your OTP is: ${otp}", "Vignan University OTP")`], { stdio: 'ignore' });
  } catch (e) {
    // Ignore if PowerShell fails
  }
  
  res.json({
    success: true,
    sessionId,
    message: 'OTP generated - check console',
    expiresIn: 120
  });
});

// Simple OTP verification
router.post('/verify-otp-simple', (req, res) => {
  const { sessionId, otp, regdNo } = req.body;
  
  const session = otpStore.get(sessionId);
  
  if (!session) {
    return res.json({
      success: false,
      error: 'SESSION_NOT_FOUND',
      message: 'Session expired or invalid'
    });
  }
  
  if (Date.now() > session.expiresAt) {
    otpStore.delete(sessionId);
    return res.json({
      success: false,
      error: 'OTP_EXPIRED',
      message: 'OTP has expired'
    });
  }
  
  if (session.otp !== otp) {
    return res.json({
      success: false,
      error: 'INVALID_OTP',
      message: 'Invalid OTP'
    });
  }
  
  if (session.regdNo !== regdNo.toUpperCase()) {
    return res.json({
      success: false,
      error: 'MISMATCH',
      message: 'Registration number mismatch'
    });
  }
  
  // Success - return mock student data
  const studentData = {
    registrationNumber: session.regdNo,
    name: 'SANKEPELLI SAMEERA',
    cgpa: 7.36,
    sgpa: 5.5,
    credits: 120,
    attendance: 85,
    phone: session.phone
  };
  
  // Clean up
  otpStore.delete(sessionId);
  
  console.log(`\n✅ OTP Verified Successfully!`);
  console.log(`Student: ${studentData.name} (${studentData.registrationNumber})`);
  
  res.json({
    success: true,
    message: 'OTP verified successfully',
    authToken: uuidv4(),
    student: studentData
  });
});

module.exports = router;
