const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const dbService = require('../database/dbService');
const nodemailer = require('nodemailer');

// OTP Store: { sessionId: { otp, regdNo, phone, attempts, createdAt, expiresAt, verified } }
const otpStore = new Map();

// Configuration
const OTP_EXPIRY_MINUTES = 2;
const MAX_ATTEMPTS = 3;
const RESEND_DELAY_SECONDS = 30;
const TEST_OTP = '123456';

// SMS API Configuration - Using Twilio (recommended) or Fast2SMS fallback
const SMS_CONFIG = {
  provider: process.env.SMS_PROVIDER || 'twilio', // 'twilio', 'fast2sms', 'msg91'
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    fromNumber: process.env.TWILIO_PHONE_NUMBER
  },
  fast2sms: {
    apiKey: process.env.FAST2SMS_API_KEY
  },
  msg91: {
    authKey: process.env.MSG91_AUTH_KEY,
    senderId: process.env.MSG91_SENDER_ID || 'SCHOOL'
  }
};

class OTPService {
  // Generate 6-digit OTP
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Create email transporter
  createTransporter() {
    const config = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    };

    if (!process.env.SMTP_USER) {
      return null;
    }

    return nodemailer.createTransport(config);
  }

  // Send OTP via Email
  async sendOTPEmail(email, otp) {
    if (!email) return { success: false, error: 'NO_EMAIL' };
    
    const transporter = this.createTransporter();
    if (!transporter) {
      console.log(`\n========================================`);
      console.log(`[OTP] TEST MODE - Email OTP for ${email}`);
      console.log(`OTP: ${otp}`);
      console.log(`========================================\n`);
      return { success: true, testMode: true };
    }

    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || '"University System" <noreply@university.edu>',
        to: email,
        subject: 'Student Portal Login OTP',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Student Portal Verification</h2>
            <p>Your OTP for logging into the Student Portal is:</p>
            <h1 style="color: #4F46E5; letter-spacing: 5px;">${otp}</h1>
            <p>This OTP is valid for ${OTP_EXPIRY_MINUTES} minutes. Do not share it with anyone.</p>
          </div>
        `
      });
      console.log(`[OTP] OTP Email sent to ${email}`);
      return { success: true, testMode: false };
    } catch (error) {
      console.error('[OTP] Email sending failed:', error.message);
      throw error;
    }
  }

  // Send OTP via Voice Call (Twilio)
  async sendOTPVoice(phone, otp) {
    const twilio = require('twilio')(SMS_CONFIG.twilio.accountSid, SMS_CONFIG.twilio.authToken);
    
    try {
      // Use Twilio's built-in TwiML message parameter
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">
    Hello. This is an automated call from Vignan University.
    Your one time password is.
    <Pause length="1"/>
    ${otp.split('').join(' <Pause length="0.5"/> ')}
    <Pause length="1"/>
    Your password is ${otp}.
    Please enter this password to complete your login.
    Thank you.
  </Say>
</Response>`;

      const call = await twilio.calls.create({
        twiml: twiml,
        to: `+91${phone.replace(/\D/g, '')}`,
        from: SMS_CONFIG.twilio.fromNumber,
        record: false
      });

      console.log(`[OTP] Voice call initiated to ${phone}, Call SID: ${call.sid}`);
      return { success: true, callSid: call.sid, method: 'voice' };
    } catch (error) {
      console.error('[OTP] Voice call failed:', error.message);
      throw error;
    }
  }

  // Send OTP via Python script
  async sendPythonOTP(phone, otp) {
    const { spawn } = require('child_process');
    const path = require('path');
    
    return new Promise((resolve, reject) => {
      const pythonScript = path.join(__dirname, '..', 'get_otp.py');
      const python = spawn('python', [pythonScript, otp]);
      
      let output = '';
      let error = '';

      python.stdout.on('data', (data) => {
        output += data.toString();
      });

      python.stderr.on('data', (data) => {
        error += data.toString();
      });

      python.on('close', (code) => {
        if (code === 0) {
          console.log('[Python OTP] Output:', output);
          console.log(`[Python OTP] IMMEDIATE OTP: ${otp}`);
          resolve({ success: true, method: 'python_display', otp });
        } else {
          console.error('[Python OTP] Error:', error);
          reject(new Error('Python OTP script failed'));
        }
      });
    });
  }

  // Check if phone matches the one in database for this regdNo
  async validateStudentPhone(regdNo, phone) {
    const student = await dbService.getStudentByRegdNo(regdNo);
    if (!student) return { valid: false, error: 'STUDENT_NOT_FOUND' };
    
    const studentMobile = student.mobile;
    if (!studentMobile) return { valid: false, error: 'NO_MOBILE_ON_RECORD' };
    
    const cleanedInput = phone.replace(/\D/g, '');
    const cleanedStored = studentMobile.toString().replace(/\D/g, '');
    
    if (cleanedInput !== cleanedStored) {
      return { valid: false, error: 'MOBILE_MISMATCH', stored: cleanedStored };
    }
    
    return { valid: true, student };
  }

  // Validate phone number format
  validatePhone(phone) {
    const cleaned = phone.replace(/\D/g, '');
    // Indian mobile numbers: 10 digits starting with 6-9
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(cleaned);
  }

  // Send OTP via Twilio
  async sendTwilioSMS(phone, otp) {
    const twilio = require('twilio');
    const client = twilio(SMS_CONFIG.twilio.accountSid, SMS_CONFIG.twilio.authToken);
    
    const message = await client.messages.create({
      body: `Your OTP for Student Portal is: ${otp}. Valid for ${OTP_EXPIRY_MINUTES} minutes. Do not share it with anyone.`,
      from: SMS_CONFIG.twilio.fromNumber,
      to: `+91${phone}`
    });
    
    return message.sid;
  }

  // Send OTP via Fast2SMS
  async sendFast2SMS(phone, otp) {
    const response = await axios.post('https://www.fast2sms.com/dev/bulkV2', {
      route: 'q',
      message: `Your OTP for Student Portal is: ${otp}. Valid for ${OTP_EXPIRY_MINUTES} minutes.`,
      language: 'english',
      flash: 0,
      numbers: phone,
    }, {
      headers: {
        'authorization': SMS_CONFIG.fast2sms.apiKey,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  }

  // Send OTP via MSG91
  async sendMSG91(phone, otp) {
    const response = await axios.post('https://api.msg91.com/api/v5/flow/', {
      template_id: process.env.MSG91_TEMPLATE_ID,
      sender: SMS_CONFIG.msg91.senderId,
      short_url: '1',
      mobiles: `91${phone}`,
      var: otp
    }, {
      headers: {
        'authkey': SMS_CONFIG.msg91.authKey,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  }

  // Main send OTP function
  async sendOTP(regdNo, phone) {
    try {
      // Validate phone format
      if (!this.validatePhone(phone)) {
        return {
          success: false,
          error: 'INVALID_PHONE',
          message: 'Invalid mobile number format. Please enter a valid 10-digit Indian mobile number.'
        };
      }

      const cleanedPhone = phone.replace(/\D/g, '');

      // Check if student exists and phone matches Excel record
      const validation = await this.validateStudentPhone(regdNo, cleanedPhone);
      
      if (!validation.valid) {
        if (validation.error === 'STUDENT_NOT_FOUND') {
          return {
            success: false,
            error: 'INVALID_REGISTRATION',
            message: 'Invalid Registration Number. Student not found in database.'
          };
        }
        if (validation.error === 'MOBILE_MISMATCH') {
          return {
            success: false,
            error: 'INVALID_MOBILE',
            message: 'Invalid Mobile Number. The phone number does not match our records for this registration number.'
          };
        }
        if (validation.error === 'NO_MOBILE_ON_RECORD') {
          return {
            success: false,
            error: 'NO_MOBILE',
            message: 'No mobile number on record for this student. Please contact administration.'
          };
        }
      }

      // Check for existing active OTP and resend delay
      const existingSession = this.findSessionByPhone(cleanedPhone);
      if (existingSession) {
        const timeSinceLastSend = (Date.now() - existingSession.createdAt) / 1000;
        if (timeSinceLastSend < RESEND_DELAY_SECONDS) {
          const waitTime = Math.ceil(RESEND_DELAY_SECONDS - timeSinceLastSend);
          return {
            success: false,
            error: 'RESEND_DELAY',
            message: `Please wait ${waitTime} seconds before requesting a new OTP.`,
            waitTime
          };
        }
        
        // Remove old session if resending
        otpStore.delete(existingSession.sessionId);
      }

      // Generate OTP
      const isTestMode = process.env.TEST_MODE === 'true';
      const otp = isTestMode ? TEST_OTP : this.generateOTP();
      const sessionId = uuidv4();
      const now = Date.now();

      // Store OTP
      otpStore.set(sessionId, {
        sessionId,
        otp,
        regdNo: regdNo.toUpperCase().trim(),
        phone: cleanedPhone,
        email: validation.student.email,
        attempts: 0,
        createdAt: now,
        expiresAt: now + (OTP_EXPIRY_MINUTES * 60 * 1000),
        verified: false,
        lastSentAt: now
      });

      // Send OTP via Voice Call
      if (SMS_CONFIG.twilio.accountSid) {
        try {
          if (SMS_CONFIG.provider === 'twilio') {
            await this.sendTwilioSMS(cleanedPhone, otp);
          } else if (SMS_CONFIG.provider === 'voice') {
            await this.sendOTPVoice(cleanedPhone, otp);
          } else if (SMS_CONFIG.provider === 'python') {
            await this.sendPythonOTP(cleanedPhone, otp);
          } else if (SMS_CONFIG.provider === 'fast2sms') {
            await this.sendFast2SMS(cleanedPhone, otp);
          } else if (SMS_CONFIG.provider === 'msg91') {
            await this.sendMSG91(cleanedPhone, otp);
          } else if (SMS_CONFIG.provider === 'email') {
            await this.sendOTPEmail(validation.student.email, otp);
          }
        } catch (error) {
          console.error('[OTP] OTP sending failed:', error.message);
        }
      }

      console.log(`[OTP] Generated ${otp} for ${cleanedPhone} (Regd: ${regdNo})`);

      return {
        success: true,
        sessionId,
        message: isTestMode ? 'OTP generated (Test mode)' : 'OTP sent successfully',
        expiresIn: OTP_EXPIRY_MINUTES * 60,
        ...(isTestMode && { otp })
      };
    } catch (error) {
      console.error('[OTP] Error sending OTP:', error.message);
      return {
        success: false,
        error: 'SEND_FAILED',
        message: 'Failed to send OTP. Please try again.'
      };
    }
  }

  // Verify OTP
  verifyOTP(sessionId, otp, regdNo) {
    try {
      const session = otpStore.get(sessionId);

      // Check if session exists
      if (!session) {
        return {
          success: false,
          error: 'SESSION_NOT_FOUND',
          message: 'OTP session not found. Please request a new OTP.'
        };
      }

      // Check if already verified
      if (session.verified) {
        return {
          success: false,
          error: 'ALREADY_VERIFIED',
          message: 'OTP already verified.'
        };
      }

      // Check if expired
      if (Date.now() > session.expiresAt) {
        otpStore.delete(sessionId);
        return {
          success: false,
          error: 'OTP_EXPIRED',
          message: 'OTP has expired. Please request a new OTP.'
        };
      }

      // Check registration number match
      if (session.regdNo !== regdNo.toUpperCase().trim()) {
        return {
          success: false,
          error: 'REGD_MISMATCH',
          message: 'Registration number does not match.'
        };
      }

      // Check max attempts
      if (session.attempts >= MAX_ATTEMPTS) {
        otpStore.delete(sessionId);
        return {
          success: false,
          error: 'MAX_ATTEMPTS_EXCEEDED',
          message: 'Maximum verification attempts exceeded. Please request a new OTP.'
        };
      }

      // Increment attempts
      session.attempts++;

      // Verify OTP
      if (session.otp !== otp.toString().trim()) {
        const remainingAttempts = MAX_ATTEMPTS - session.attempts;
        
        if (remainingAttempts <= 0) {
          otpStore.delete(sessionId);
          return {
            success: false,
            error: 'MAX_ATTEMPTS_EXCEEDED',
            message: 'Maximum verification attempts exceeded. Please request a new OTP.'
          };
        }

        return {
          success: false,
          error: 'INVALID_OTP',
          message: `Incorrect OTP. ${remainingAttempts} attempt(s) remaining.`,
          remainingAttempts
        };
      }

      // Mark as verified
      session.verified = true;
      
      // Generate auth token
      const authToken = uuidv4();
      
      // Clean up after successful verification (keep for a short time)
      setTimeout(() => otpStore.delete(sessionId), 5000);

      console.log(`[OTP] Verified for ${session.phone} (Regd: ${regdNo})`);

      return {
        success: true,
        message: 'OTP verified successfully',
        authToken,
        regdNo: session.regdNo,
        phone: session.phone
      };
    } catch (error) {
      console.error('[OTP] Error verifying OTP:', error.message);
      return {
        success: false,
        error: 'VERIFICATION_FAILED',
        message: 'OTP verification failed. Please try again.'
      };
    }
  }

  // Resend OTP
  async resendOTP(sessionId) {
    const session = otpStore.get(sessionId);
    
    if (!session) {
      return {
        success: false,
        error: 'SESSION_NOT_FOUND',
        message: 'Session not found. Please request a new OTP.'
      };
    }

    const timeSinceLastSend = (Date.now() - session.lastSentAt) / 1000;
    
    if (timeSinceLastSend < RESEND_DELAY_SECONDS) {
      const waitTime = Math.ceil(RESEND_DELAY_SECONDS - timeSinceLastSend);
      return {
        success: false,
        error: 'RESEND_DELAY',
        message: `Please wait ${waitTime} seconds before resending OTP.`,
        waitTime
      };
    }

    // Generate new OTP
    const isTestMode = process.env.TEST_MODE === 'true';
    const newOTP = isTestMode ? TEST_OTP : this.generateOTP();
    
    // Update session
    session.otp = newOTP;
    session.attempts = 0;
    session.createdAt = Date.now();
    session.expiresAt = Date.now() + (OTP_EXPIRY_MINUTES * 60 * 1000);
    session.lastSentAt = Date.now();
    session.verified = false;

    // Send SMS
    if (SMS_CONFIG.twilio.accountSid) {
      try {
        if (SMS_CONFIG.provider === 'twilio') {
          await this.sendTwilioSMS(session.phone, newOTP);
        } else if (SMS_CONFIG.provider === 'fast2sms') {
          await this.sendFast2SMS(session.phone, newOTP);
        } else if (SMS_CONFIG.provider === 'msg91') {
          await this.sendMSG91(session.phone, newOTP);
        }
      } catch (smsError) {
        console.error('[OTP] SMS resend failed:', smsError.message);
      }
    }

    // Send Email
    try {
      if (session.email) {
        await this.sendOTPEmail(session.email, newOTP);
      }
    } catch (emailError) {
      console.error('[OTP] Email resend failed:', emailError.message);
    }

    console.log(`[OTP] Resent ${newOTP} to ${session.phone}`);

    return {
      success: true,
      message: isTestMode ? 'OTP resent (Test mode)' : 'OTP resent successfully',
      expiresIn: OTP_EXPIRY_MINUTES * 60,
      ...(isTestMode && { otp: newOTP })
    };
  }

  // Find session by phone number
  findSessionByPhone(phone) {
    const cleanedPhone = phone.replace(/\D/g, '');
    for (const [sessionId, session] of otpStore.entries()) {
      if (session.phone === cleanedPhone && !session.verified && Date.now() < session.expiresAt) {
        return { ...session, sessionId };
      }
    }
    return null;
  }

  // Clean up expired sessions (call periodically)
  cleanupExpiredSessions() {
    const now = Date.now();
    let cleaned = 0;
    for (const [sessionId, session] of otpStore.entries()) {
      if (now > session.expiresAt + (5 * 60 * 1000)) { // 5 minutes grace period
        otpStore.delete(sessionId);
        cleaned++;
      }
    }
    if (cleaned > 0) {
      console.log(`[OTP] Cleaned up ${cleaned} expired sessions`);
    }
    return cleaned;
  }

  // Get session info (for debugging)
  getSessionInfo(sessionId) {
    const session = otpStore.get(sessionId);
    if (!session) return null;
    
    return {
      sessionId,
      regdNo: session.regdNo,
      phone: session.phone,
      attempts: session.attempts,
      verified: session.verified,
      expiresIn: Math.max(0, Math.floor((session.expiresAt - Date.now()) / 1000)),
      createdAgo: Math.floor((Date.now() - session.createdAt) / 1000)
    };
  }
}

// Create singleton instance
const otpService = new OTPService();

// Periodic cleanup of expired sessions
setInterval(() => otpService.cleanupExpiredSessions(), 60000); // Every minute

module.exports = otpService;
