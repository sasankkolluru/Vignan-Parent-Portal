const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');

// Admin OTP Store: { sessionId: { otp, email, attempts, createdAt, expiresAt, verified } }
const adminOtpStore = new Map();

// Configuration
const OTP_EXPIRY_MINUTES = 5;
const MAX_ATTEMPTS = 3;

// Admin credentials with mobile
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123',
  mobile: '7989454441', // Admin mobile for OTP
  name: 'Administrator',
  role: 'super_admin'
};

class AdminOTPService {
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

    // For testing/development without real SMTP
    if (!process.env.SMTP_USER) {
      console.log('[AdminOTP] No SMTP configured, using test mode');
      return null;
    }

    return nodemailer.createTransport(config);
  }

  // Send OTP via Email
  async sendOTPEmail(email, otp) {
    const transporter = this.createTransporter();
    if (!transporter) {
      console.log(`\n========================================`);
      console.log(`[AdminOTP] TEST MODE - Email OTP for ${email}`);
      console.log(`OTP: ${otp}`);
      console.log(`========================================\n`);
      return { success: true, testMode: true };
    }

    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || '"University Admin" <noreply@university.edu>',
        to: email,
        subject: 'Admin Login OTP',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Admin Login Verification</h2>
            <p>Your OTP for admin login is:</p>
            <h1 style="color: #4F46E5; letter-spacing: 5px;">${otp}</h1>
            <p>This OTP is valid for ${OTP_EXPIRY_MINUTES} minutes. Do not share it with anyone.</p>
          </div>
        `
      });
      console.log(`[AdminOTP] OTP Email sent to ${email}`);
      return { success: true, testMode: false };
    } catch (error) {
      console.error('[AdminOTP] Email sending failed:', error.message);
      throw error;
    }
  }

  // Send OTP via SMS
  async sendOTPSMS(mobile, otp) {
    // Use the same SMS provider as student OTPs
    const twilio = require('twilio');
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      // Test mode - log OTP to console
      console.log(`\n========================================`);
      console.log(`[AdminOTP] TEST MODE - OTP for ${mobile}`);
      console.log(`OTP: ${otp}`);
      console.log(`========================================\n`);
      return { success: true, testMode: true };
    }

    try {
      const client = twilio(accountSid, authToken);
      
      const message = await client.messages.create({
        body: `Your OTP for admin login is: ${otp}. Valid for ${OTP_EXPIRY_MINUTES} minutes. Do not share it with anyone.`,
        from: fromNumber,
        to: `+91${mobile}`
      });
      
      console.log(`[AdminOTP] OTP SMS sent to ${mobile}`);
      return { success: true, testMode: false };
    } catch (error) {
      console.error('[AdminOTP] SMS sending failed:', error.message);
      throw error;
    }
  }

  // Send OTP to admin
  async sendOTP(username, password) {
    try {
      // Validate admin credentials first
      if (username !== ADMIN_CREDENTIALS.username || password !== ADMIN_CREDENTIALS.password) {
        return {
          success: false,
          error: 'INVALID_CREDENTIALS',
          message: 'Invalid username or password'
        };
      }

      const mobile = ADMIN_CREDENTIALS.mobile;
      const isTestMode = process.env.TEST_MODE === 'true';
      const otp = isTestMode ? '123456' : this.generateOTP();
      const sessionId = uuidv4();
      const now = Date.now();

      // Store OTP
      adminOtpStore.set(sessionId, {
        sessionId,
        otp,
        mobile,
        username,
        attempts: 0,
        createdAt: now,
        expiresAt: now + (OTP_EXPIRY_MINUTES * 60 * 1000),
        verified: false
      });

      // Send SMS
      let smsResult = { testMode: false, success: false };
      try {
        smsResult = await this.sendOTPSMS(mobile, otp);
      } catch (e) {
        console.error('[AdminOTP] Fallback to email due to SMS error:', e.message);
      }

      // Send Email
      let emailResult = { testMode: false, success: false };
      try {
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@university.edu';
        emailResult = await this.sendOTPEmail(adminEmail, otp);
      } catch (e) {
        console.error('[AdminOTP] Admin email sending failed:', e.message);
      }

      const isEmailOrSmsTestMode = smsResult.testMode || emailResult.testMode;

      console.log(`[AdminOTP] Generated OTP ${otp} for admin (${mobile})`);

      return {
        success: true,
        sessionId,
        message: isEmailOrSmsTestMode 
          ? `OTP generated (Test mode - check console). Valid for ${OTP_EXPIRY_MINUTES} minutes.`
          : `OTP sent to admin mobile and email. Valid for ${OTP_EXPIRY_MINUTES} minutes.`,
        expiresIn: OTP_EXPIRY_MINUTES * 60,
        mobile: mobile,
        ...(isEmailOrSmsTestMode && { otp }) // Only return OTP in test mode
      };
    } catch (error) {
      console.error('[AdminOTP] Error sending OTP:', error.message);
      return {
        success: false,
        error: 'SEND_FAILED',
        message: 'Failed to send OTP. Please try again.'
      };
    }
  }

  // Verify OTP
  verifyOTP(sessionId, otp) {
    try {
      const session = adminOtpStore.get(sessionId);

      if (!session) {
        return {
          success: false,
          error: 'SESSION_NOT_FOUND',
          message: 'OTP session not found. Please request a new OTP.'
        };
      }

      if (session.verified) {
        return {
          success: false,
          error: 'ALREADY_VERIFIED',
          message: 'OTP already verified.'
        };
      }

      if (Date.now() > session.expiresAt) {
        adminOtpStore.delete(sessionId);
        return {
          success: false,
          error: 'OTP_EXPIRED',
          message: 'OTP has expired. Please request a new OTP.'
        };
      }

      if (session.attempts >= MAX_ATTEMPTS) {
        adminOtpStore.delete(sessionId);
        return {
          success: false,
          error: 'MAX_ATTEMPTS_EXCEEDED',
          message: 'Maximum verification attempts exceeded. Please request a new OTP.'
        };
      }

      session.attempts++;

      if (session.otp !== otp.toString().trim()) {
        const remainingAttempts = MAX_ATTEMPTS - session.attempts;
        
        if (remainingAttempts <= 0) {
          adminOtpStore.delete(sessionId);
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
      
      // Generate admin token
      const adminToken = uuidv4();
      
      // Clean up after successful verification
      setTimeout(() => adminOtpStore.delete(sessionId), 5000);

      console.log(`[AdminOTP] Admin verified successfully`);

      return {
        success: true,
        message: 'OTP verified successfully',
        adminToken,
        admin: {
          username: ADMIN_CREDENTIALS.username,
          name: ADMIN_CREDENTIALS.name,
          role: ADMIN_CREDENTIALS.role,
          mobile: ADMIN_CREDENTIALS.mobile
        }
      };
    } catch (error) {
      console.error('[AdminOTP] Error verifying OTP:', error.message);
      return {
        success: false,
        error: 'VERIFICATION_FAILED',
        message: 'OTP verification failed. Please try again.'
      };
    }
  }

  // Resend OTP
  async resendOTP(sessionId) {
    const session = adminOtpStore.get(sessionId);
    
    if (!session) {
      return {
        success: false,
        error: 'SESSION_NOT_FOUND',
        message: 'Session not found. Please login again.'
      };
    }

    // Generate new OTP
    const isTestMode = process.env.TEST_MODE === 'true';
    const newOTP = isTestMode ? '123456' : this.generateOTP();
    
    // Update session
    session.otp = newOTP;
    session.attempts = 0;
    session.createdAt = Date.now();
    session.expiresAt = Date.now() + (OTP_EXPIRY_MINUTES * 60 * 1000);
    session.verified = false;

    // Send SMS
    let smsResult = { testMode: false, success: false };
    try {
      smsResult = await this.sendOTPSMS(session.mobile, newOTP);
    } catch (e) {
      console.error('[AdminOTP] Fallback to email due to SMS error:', e.message);
    }

    // Send Email
    let emailResult = { testMode: false, success: false };
    try {
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@university.edu';
      emailResult = await this.sendOTPEmail(adminEmail, newOTP);
    } catch (e) {
      console.error('[AdminOTP] Admin email sending failed:', e.message);
    }

    const isEmailOrSmsTestMode = smsResult.testMode || emailResult.testMode;

    console.log(`[AdminOTP] Resent OTP ${newOTP} to admin`);

    return {
      success: true,
      message: isEmailOrSmsTestMode 
        ? `New OTP generated (Test mode - check console)`
        : `New OTP sent to admin mobile and email.`,
      expiresIn: OTP_EXPIRY_MINUTES * 60,
      ...(isEmailOrSmsTestMode && { otp: newOTP })
    };
  }

  // Cleanup expired sessions
  cleanupExpiredSessions() {
    const now = Date.now();
    let cleaned = 0;
    for (const [sessionId, session] of adminOtpStore.entries()) {
      if (now > session.expiresAt + (5 * 60 * 1000)) {
        adminOtpStore.delete(sessionId);
        cleaned++;
      }
    }
    if (cleaned > 0) {
      console.log(`[AdminOTP] Cleaned up ${cleaned} expired sessions`);
    }
    return cleaned;
  }
}

// Create singleton instance
const adminOTPService = new AdminOTPService();

// Periodic cleanup
setInterval(() => adminOTPService.cleanupExpiredSessions(), 60000);

module.exports = adminOTPService;
