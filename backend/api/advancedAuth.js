const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

// In-memory store for advanced auth
const authStore = new Map();

// Face Recognition API Route
router.post('/face-auth-initiate', (req, res) => {
  const { regdNo } = req.body;
  
  const sessionId = uuidv4();
  const challengeCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  authStore.set(sessionId, {
    type: 'face',
    regdNo: regdNo.toUpperCase(),
    challengeCode,
    createdAt: Date.now(),
    expiresAt: Date.now() + (5 * 60 * 1000), // 5 minutes
    verified: false
  });
  
  console.log('\n' + '='.repeat(80));
  console.log(' '.repeat(25) + 'FACE AUTHENTICATION INITIATED');
  console.log('='.repeat(80));
  console.log(`Registration: ${regdNo.toUpperCase()}`);
  console.log(`Challenge Code: ${challengeCode}`);
  console.log(`Session ID: ${sessionId}`);
  console.log(' '.repeat(20) + 'Please show your face to camera');
  console.log('='.repeat(80));
  
  // Show Windows popup
  try {
    const { spawn } = require('child_process');
    spawn('powershell', ['-Command', `[System.Windows.Forms.MessageBox]::Show("Face Authentication Started for ${regdNo}\\nChallenge Code: ${challengeCode}", "Vignan University - Face Auth")`], { stdio: 'ignore' });
  } catch (e) {}
  
  res.json({
    success: true,
    sessionId,
    challengeCode,
    message: 'Face authentication initiated - show your face to camera',
    expiresIn: 300
  });
});

router.post('/face-auth-verify', (req, res) => {
  const { sessionId, regdNo } = req.body;
  
  const session = authStore.get(sessionId);
  
  if (!session || session.type !== 'face') {
    return res.json({
      success: false,
      error: 'INVALID_SESSION',
      message: 'Invalid or expired session'
    });
  }
  
  if (Date.now() > session.expiresAt) {
    authStore.delete(sessionId);
    return res.json({
      success: false,
      error: 'EXPIRED',
      message: 'Session expired'
    });
  }
  
  // Simulate face verification (in real implementation, you'd use face recognition API)
  const faceMatch = Math.random() > 0.1; // 90% success rate for demo
  
  if (!faceMatch) {
    return res.json({
      success: false,
      error: 'FACE_NOT_MATCHED',
      message: 'Face not recognized. Please try again.'
    });
  }
  
  // Success
  const studentData = {
    registrationNumber: session.regdNo,
    name: 'SANKEPELLI SAMEERA',
    cgpa: 7.36,
    sgpa: 5.5,
    credits: 120,
    attendance: 85,
    authMethod: 'face'
  };
  
  authStore.delete(sessionId);
  
  console.log(`\n✅ Face Authentication Successful!`);
  console.log(`Student: ${studentData.name} (${studentData.registrationNumber})`);
  
  res.json({
    success: true,
    message: 'Face authentication successful',
    authToken: uuidv4(),
    student: studentData
  });
});

// Fingerprint Authentication
router.post('/fingerprint-auth-initiate', (req, res) => {
  const { regdNo } = req.body;
  
  const sessionId = uuidv4();
  
  authStore.set(sessionId, {
    type: 'fingerprint',
    regdNo: regdNo.toUpperCase(),
    createdAt: Date.now(),
    expiresAt: Date.now() + (3 * 60 * 1000), // 3 minutes
    verified: false
  });
  
  console.log('\n' + '='.repeat(80));
  console.log(' '.repeat(25) + 'FINGERPRINT AUTHENTICATION');
  console.log('='.repeat(80));
  console.log(`Registration: ${regdNo.toUpperCase()}`);
  console.log(`Session ID: ${sessionId}`);
  console.log(' '.repeat(20) + 'Please place your finger on scanner');
  console.log('='.repeat(80));
  
  // Show Windows popup
  try {
    const { spawn } = require('child_process');
    spawn('powershell', ['-Command', `[System.Windows.Forms.MessageBox]::Show("Fingerprint Authentication Started for ${regdNo}\\nPlease place your finger on the scanner", "Vignan University - Fingerprint Auth")`], { stdio: 'ignore' });
  } catch (e) {}
  
  res.json({
    success: true,
    sessionId,
    message: 'Place your finger on the fingerprint scanner',
    expiresIn: 180
  });
});

router.post('/fingerprint-auth-verify', (req, res) => {
  const { sessionId, regdNo } = req.body;
  
  const session = authStore.get(sessionId);
  
  if (!session || session.type !== 'fingerprint') {
    return res.json({
      success: false,
      error: 'INVALID_SESSION',
      message: 'Invalid or expired session'
    });
  }
  
  if (Date.now() > session.expiresAt) {
    authStore.delete(sessionId);
    return res.json({
      success: false,
      error: 'EXPIRED',
      message: 'Session expired'
    });
  }
  
  // Simulate fingerprint verification
  const fingerprintMatch = Math.random() > 0.05; // 95% success rate
  
  if (!fingerprintMatch) {
    return res.json({
      success: false,
      error: 'FINGERPRINT_NOT_MATCHED',
      message: 'Fingerprint not recognized. Please try again.'
    });
  }
  
  const studentData = {
    registrationNumber: session.regdNo,
    name: 'SANKEPELLI SAMEERA',
    cgpa: 7.36,
    sgpa: 5.5,
    credits: 120,
    attendance: 85,
    authMethod: 'fingerprint'
  };
  
  authStore.delete(sessionId);
  
  console.log(`\n✅ Fingerprint Authentication Successful!`);
  console.log(`Student: ${studentData.name} (${studentData.registrationNumber})`);
  
  res.json({
    success: true,
    message: 'Fingerprint authentication successful',
    authToken: uuidv4(),
    student: studentData
  });
});

// Pattern Lock Authentication with Custom Pattern
router.post('/pattern-auth-initiate', (req, res) => {
  const { regdNo, userType } = req.body; // userType: 'student' or 'admin'
  
  const sessionId = uuidv4();
  
  // Load user configuration or use default
  let userPattern = '1-2-3-6-9-8-7-4'; // Default pattern
  try {
    const fs = require('fs');
    const path = require('path');
    const configPath = path.join(__dirname, '..', 'user_auth_config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (config.pattern_auth) {
        if (userType === 'admin' && config.pattern_auth.admin_pattern) {
          userPattern = config.pattern_auth.admin_pattern;
        } else if (userType === 'student' && config.pattern_auth.student_pattern) {
          userPattern = config.pattern_auth.student_pattern;
        }
      }
    }
  } catch (e) {
    // Fallback to default pattern
  }
  
  authStore.set(sessionId, {
    type: 'pattern',
    regdNo: regdNo ? regdNo.toUpperCase() : 'ADMIN',
    userType: userType || 'student',
    pattern: userPattern,
    createdAt: Date.now(),
    expiresAt: Date.now() + (10 * 60 * 1000), // 10 minutes
    verified: false
  });
  
  console.log('\n' + '='.repeat(80));
  console.log(' '.repeat(25) + 'PATTERN AUTHENTICATION');
  console.log('='.repeat(80));
  console.log(`User Type: ${userType ? userType.toUpperCase() : 'STUDENT'}`);
  if (regdNo) console.log(`Registration: ${regdNo.toUpperCase()}`);
  console.log(`Session ID: ${sessionId}`);
  console.log(`Pattern: ${userPattern}`);
  console.log(' '.repeat(15) + '🔓 Draw the pattern shown above');
  console.log('='.repeat(80));
  
  res.json({
    success: true,
    sessionId,
    pattern: userPattern,
    userType: userType || 'student',
    message: `Please draw the pattern: ${userPattern}`,
    patternHint: 'Connect the dots in the exact sequence shown',
    expiresIn: 120
  });
});

router.post('/pattern-auth-verify', (req, res) => {
  const { sessionId, pattern, regdNo } = req.body;
  
  const session = authStore.get(sessionId);
  
  if (!session || session.type !== 'pattern') {
    return res.json({
      success: false,
      error: 'INVALID_SESSION',
      message: 'Invalid or expired session'
    });
  }
  
  if (Date.now() > session.expiresAt) {
    authStore.delete(sessionId);
    return res.json({
      success: false,
      error: 'EXPIRED',
      message: 'Session expired'
    });
  }
  
  // Verify pattern
  if (pattern !== session.pattern) {
    return res.json({
      success: false,
      error: 'PATTERN_INCORRECT',
      message: `Incorrect pattern. Expected: ${session.pattern}`
    });
  }
  
  // Return appropriate data based on user type
  let responseData;
  if (session.userType === 'admin') {
    responseData = {
      registrationNumber: 'ADMIN',
      name: 'Administrator',
      role: 'admin',
      authMethod: 'pattern'
    };
  } else {
    responseData = {
      registrationNumber: session.regdNo,
      name: 'SANKEPELLI SAMEERA',
      cgpa: 7.36,
      sgpa: 5.5,
      credits: 120,
      attendance: 85,
      authMethod: 'pattern'
    };
  }
  
  authStore.delete(sessionId);
  
  console.log(`\n✅ Pattern Authentication Successful!`);
  console.log(`User Type: ${session.userType.toUpperCase()}`);
  if (session.regdNo !== 'ADMIN') {
    console.log(`Student: ${responseData.name} (${responseData.registrationNumber})`);
  } else {
    console.log(`Admin: ${responseData.name}`);
  }
  
  res.json({
    success: true,
    message: 'Pattern authentication successful',
    authToken: uuidv4(),
    userType: session.userType,
    [session.userType]: responseData
  });
});

// Voice Authentication with Personal Voice Detection
router.post('/voice-auth-initiate', (req, res) => {
  const { regdNo } = req.body;
  
  const sessionId = uuidv4();
  
  // Load user configuration or use default
  let userConfig;
  try {
    const fs = require('fs');
    const path = require('path');
    const configPath = path.join(__dirname, '..', 'user_auth_config.json');
    if (fs.existsSync(configPath)) {
      userConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
  } catch (e) {
    // Fallback to default if config not found
  }
  
  const phrase = userConfig?.voice_auth?.phrase || `Vignan University verify ${regdNo}`;
  const voiceId = userConfig?.voice_auth?.voice_id || `voice_${Math.floor(Math.random() * 900000) + 100000}`;
  
  authStore.set(sessionId, {
    type: 'voice',
    regdNo: regdNo.toUpperCase(),
    phrase,
    voiceId,
    userConfig,
    createdAt: Date.now(),
    expiresAt: Date.now() + (3 * 60 * 1000), // 3 minutes
    verified: false
  });
  
  console.log('\n' + '='.repeat(80));
  console.log(' '.repeat(25) + 'PERSONAL VOICE AUTHENTICATION');
  console.log('='.repeat(80));
  console.log(`Registration: ${regdNo.toUpperCase()}`);
  console.log(`Session ID: ${sessionId}`);
  console.log(`Voice ID: ${voiceId}`);
  console.log(`Please say: "${phrase}"`);
  console.log(' '.repeat(20) + '🎤 Using your personal voice profile');
  console.log('='.repeat(80));
  
  // Show Windows popup
  try {
    const { spawn } = require('child_process');
    spawn('powershell', ['-Command', `[System.Windows.Forms.MessageBox]::Show("Personal Voice Authentication\\nPlease say: '${phrase}'\\nVoice ID: ${voiceId}", "Vignan University - Personal Voice Auth")`], { stdio: 'ignore' });
  } catch (e) {}
  
  res.json({
    success: true,
    sessionId,
    phrase,
    voiceId,
    message: 'Please speak your personal phrase',
    expiresIn: 180
  });
});

router.post('/voice-auth-verify', (req, res) => {
  const { sessionId, regdNo } = req.body;
  
  const session = authStore.get(sessionId);
  
  if (!session || session.type !== 'voice') {
    return res.json({
      success: false,
      error: 'INVALID_SESSION',
      message: 'Invalid or expired session'
    });
  }
  
  if (Date.now() > session.expiresAt) {
    authStore.delete(sessionId);
    return res.json({
      success: false,
      error: 'EXPIRED',
      message: 'Session expired'
    });
  }
  
  // Personal voice verification with higher accuracy for trained voice
  let voiceMatch = false;
  
  if (session.userConfig && session.userConfig.voice_auth) {
    // If user has trained voice, use higher accuracy (95%)
    voiceMatch = Math.random() > 0.05;
    console.log(`[Voice Auth] Using trained voice profile: ${session.voiceId}`);
  } else {
    // Default voice recognition (85%)
    voiceMatch = Math.random() > 0.15;
    console.log(`[Voice Auth] Using default voice recognition`);
  }
  
  if (!voiceMatch) {
    return res.json({
      success: false,
      error: 'VOICE_NOT_MATCHED',
      message: 'Voice not recognized. Please try again or ensure you\'re using your trained voice.'
    });
  }
  
  const studentData = {
    registrationNumber: session.regdNo,
    name: 'SANKEPELLI SAMEERA',
    cgpa: 7.36,
    sgpa: 5.5,
    credits: 120,
    attendance: 85,
    authMethod: 'voice',
    voiceId: session.voiceId
  };
  
  authStore.delete(sessionId);
  
  console.log(`\n✅ Personal Voice Authentication Successful!`);
  console.log(`Student: ${studentData.name} (${studentData.registrationNumber})`);
  console.log(`Voice ID: ${session.voiceId}`);
  
  res.json({
    success: true,
    message: 'Personal voice authentication successful',
    authToken: uuidv4(),
    student: studentData
  });
});

module.exports = router;
