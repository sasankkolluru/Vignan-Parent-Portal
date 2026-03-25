const { spawn } = require('child_process');
const path = require('path');

class PythonOTPService {
  constructor() {
    this.pythonScript = path.join(__dirname, 'send_sms_otp.py');
  }

  async sendOTP(phoneNumber, otp) {
    return new Promise((resolve, reject) => {
      const python = spawn('python', [this.pythonScript, otp]);
      
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
          if (output.includes('SUCCESS')) {
            resolve({ success: true, method: 'python_sms' });
          } else {
            // Show OTP in console for testing
            console.log(`[Python OTP] Fallback - OTP: ${otp}`);
            resolve({ success: true, method: 'console', otp });
          }
        } else {
          console.error('[Python OTP] Error:', error);
          reject(new Error('Python OTP script failed'));
        }
      });
    });
  }
}

module.exports = PythonOTPService;
