const express = require('express');
const otpService = require('./otp');
const dbService = require('../database/dbService');

const router = express.Router();

// POST /api/auth/send-otp - Send OTP
router.post('/send-otp', async (req, res) => {
  try {
    const { regdNo, phone } = req.body;

    // Validate inputs
    if (!regdNo || !phone) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_FIELDS',
        message: 'Registration Number and Phone Number are required'
      });
    }

    // Check if student exists using PostgreSQL
    const normalizedRegd = regdNo.toString().toUpperCase().trim();
    const normalizedPhone = phone.toString().replace(/\D/g, '');
    
    // Debug logging
    console.log(`[Auth] =========================================`);
    console.log(`[Auth] Received Regd.No.: "${regdNo}" (normalized: "${normalizedRegd}")`);
    console.log(`[Auth] Received Phone: "${phone}" (normalized: "${normalizedPhone}")`);
    console.log(`[Auth] Looking up student in PostgreSQL...`);
    
    try {
      const validation = await dbService.validateStudentPhone(normalizedRegd, normalizedPhone);
      
      if (!validation.valid) {
        if (validation.error === 'STUDENT_NOT_FOUND') {
          console.log(`[Auth] ERROR: Student "${normalizedRegd}" not found in database`);
          console.log(`[Auth] =========================================`);
          return res.status(404).json({
            success: false,
            error: 'INVALID_REGISTRATION',
            message: 'Invalid Registration Number. Student not found in database.'
          });
        }
        if (validation.error === 'MOBILE_MISMATCH') {
          console.log(`[Auth] ERROR: Phone mismatch! Entered: "${normalizedPhone}", Expected: "${validation.stored}"`);
          console.log(`[Auth] =========================================`);
          return res.status(400).json({
            success: false,
            error: 'INVALID_MOBILE',
            message: 'Invalid Mobile Number. The phone number does not match our records for this registration number.'
          });
        }
        if (validation.error === 'NO_MOBILE_ON_RECORD') {
          return res.status(400).json({
            success: false,
            error: 'NO_MOBILE',
            message: 'No mobile number on record for this student. Please contact administration.'
          });
        }
      }
      
      console.log(`[Auth] Student found, phone matches. Proceeding with OTP...`);
      console.log(`[Auth] =========================================`);
    } catch (dbError) {
      console.error('[Auth] Database error:', dbError.message);
      return res.status(500).json({
        success: false,
        error: 'DB_ERROR',
        message: 'Database connection error. Please try again.'
      });
    }

    // Send OTP
    const result = await otpService.sendOTP(normalizedRegd, phone);
    
    if (result.success) {
      res.json({
        success: true,
        sessionId: result.sessionId,
        message: result.message,
        expiresIn: result.expiresIn,
        ...(result.otp && { otp: result.otp }) // Only in dev/testing
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        message: result.message,
        ...(result.waitTime && { waitTime: result.waitTime })
      });
    }
  } catch (error) {
    console.error('[Auth] Error in send-otp:', error.message);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to send OTP. Please try again.'
    });
  }
});

// POST /api/auth/verify-otp - Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { sessionId, otp, regdNo } = req.body;

    // Validate inputs
    if (!sessionId || !otp || !regdNo) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_FIELDS',
        message: 'Session ID, OTP, and Registration Number are required'
      });
    }

    // Verify OTP
    const result = otpService.verifyOTP(sessionId, otp, regdNo);

    if (result.success) {
      // Get full student data from PostgreSQL
      const studentData = await dbService.getStudentResults(regdNo);
      
      res.json({
        success: true,
        message: result.message,
        authToken: result.authToken,
        student: studentData
      });
    } else {
      const statusCode = 
        result.error === 'MAX_ATTEMPTS_EXCEEDED' ? 429 :
        result.error === 'OTP_EXPIRED' ? 410 :
        result.error === 'SESSION_NOT_FOUND' ? 404 :
        400;

      res.status(statusCode).json({
        success: false,
        error: result.error,
        message: result.message,
        ...(result.remainingAttempts !== undefined && { remainingAttempts: result.remainingAttempts })
      });
    }
  } catch (error) {
    console.error('[Auth] Error in verify-otp:', error.message);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'OTP verification failed. Please try again.'
    });
  }
});

// POST /api/auth/resend-otp - Resend OTP
router.post('/resend-otp', async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_SESSION',
        message: 'Session ID is required'
      });
    }

    const result = await otpService.resendOTP(sessionId);

    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        expiresIn: result.expiresIn,
        ...(result.otp && { otp: result.otp })
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        message: result.message,
        ...(result.waitTime && { waitTime: result.waitTime })
      });
    }
  } catch (error) {
    console.error('[Auth] Error in resend-otp:', error.message);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to resend OTP. Please try again.'
    });
  }
});

// POST /api/auth/chat - AI Chatbot endpoint
router.post('/chat', async (req, res) => {
  try {
    const { message, sessionId, regdNo } = req.body;

    if (!message || !sessionId) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_FIELDS',
        message: 'Message and Session ID are required'
      });
    }

    // Get student context if regdNo provided
    let studentData = null;
    if (regdNo) {
      studentData = await dbService.getStudentResults(regdNo);
    }

    const aiChatbotService = require('./chatbot');
    
    // Check for quick response first
    const quickResponse = aiChatbotService.getQuickResponse(message);
    if (quickResponse) {
      return res.json({
        success: true,
        message: quickResponse,
        source: 'quick_response'
      });
    }

    // Get AI response from Groq
    const result = await aiChatbotService.sendMessage(message, sessionId, studentData);

    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        model: result.model,
        ...(result.usage && { usage: result.usage })
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        message: result.message
      });
    }
  } catch (error) {
    console.error('[Auth] Error in chat:', error.message);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Chat service temporarily unavailable. Please try again later.'
    });
  }
});

// POST /api/auth/clear-chat - Clear chat history
router.post('/clear-chat', (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (sessionId) {
      const aiChatbotService = require('./chatbot');
      aiChatbotService.clearHistory(sessionId);
    }
    
    res.json({
      success: true,
      message: 'Chat history cleared'
    });
  } catch (error) {
    console.error('[Auth] Error clearing chat:', error.message);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to clear chat history'
    });
  }
});

// GET /api/auth/session/:sessionId - Get session info (debug)
router.get('/session/:sessionId', (req, res) => {
  const info = otpService.getSessionInfo(req.params.sessionId);
  if (info) {
    res.json({ success: true, data: info });
  } else {
    res.status(404).json({ success: false, message: 'Session not found' });
  }
});

module.exports = router;
