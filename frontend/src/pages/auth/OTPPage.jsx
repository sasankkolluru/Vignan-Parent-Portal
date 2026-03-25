import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { KeyRound, ArrowRight, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function OTPPage({ setIsAuthenticated }) {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes for OTP expiry
  const [remainingAttempts, setRemainingAttempts] = useState(3);
  const [resendWaitTime, setResendWaitTime] = useState(30);
  const inputRefs = useRef([]);

  // Redirect to login if no state is present (direct URL access block)
  useEffect(() => {
    if (!state || !state.phone) {
      navigate('/login');
    }
  }, [state, navigate]);

  // Timer countdown for OTP expiry
  useEffect(() => {
    if (timeLeft > 0 && !success) {
      const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timerId);
    }
  }, [timeLeft, success]);

  // Resend wait timer
  useEffect(() => {
    if (resendWaitTime > 0) {
      const timerId = setTimeout(() => setResendWaitTime(resendWaitTime - 1), 1000);
      return () => clearTimeout(timerId);
    }
  }, [resendWaitTime]);

  const handleChange = (index, value) => {
    if (isNaN(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Auto focus next
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const otpValue = otp.join('');
    
    if (otpValue.length < 6) {
      setError('Please enter the complete 6-digit OTP.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sessionId: state.sessionId,
          otp: otpValue,
          regdNo: state.regNo
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess(true);
        localStorage.setItem('studentId', data.student.registrationNumber);
        
        // Save the full student object in the session so Topbar doesn't need to refetch
        localStorage.setItem('parent_session', JSON.stringify({
          token: data.authToken,
          regdNo: data.student.registrationNumber,
          name: data.student.name,
          student: data.student // The actual student object returned by dbService.getStudentResults
        }));
        
        // Delay navigation to show success animation
        setTimeout(() => {
          setIsAuthenticated(true);
          navigate('/dashboard');
        }, 1000);
      } else {
        setError(data.message || 'Invalid OTP');
        if (data.remainingAttempts !== undefined) {
          setRemainingAttempts(data.remainingAttempts);
        }
      }
    } catch(err) {
      console.error(err);
      setError('Server error during verification. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setOtp(['', '', '', '', '', '']);
    inputRefs.current[0].focus();
    
    try {
      const response = await fetch(`${API_URL}/api/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: state.sessionId })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setTimeLeft(120); // Reset OTP expiry timer
        setResendWaitTime(30); // Reset resend wait time
        setRemainingAttempts(3); // Reset attempts
      } else {
        setError(data.message || 'Failed to resend OTP');
        if (data.waitTime) {
          setResendWaitTime(data.waitTime);
        }
      }
    } catch(err) {
      console.error('Failed to resend:', err);
      setError('Failed to resend OTP. Please try again.');
    }
  };

  if (!state) return null;

  return (
    <div>
      <div className="text-center mb-6">
        <div className="inline-flex p-3 rounded-2xl bg-primary/10 text-primary mb-4">
          <KeyRound size={24} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
          Verify OTP
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          We've sent a 6-digit code to <br className="hidden sm:block"/>
          <span className="font-semibold text-slate-900 dark:text-slate-300">
            {state.phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1-***-$3')}
          </span>
        </p>
      </div>

      {error && (
        <div className="flex flex-col items-center justify-center text-center gap-2 p-3 mb-4 text-sm text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-500/20">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </div>
          {remainingAttempts < 3 && remainingAttempts > 0 && (
            <p className="text-xs">{remainingAttempts} attempt(s) remaining</p>
          )}
        </div>
      )}

      {success ? (
        <div className="flex flex-col items-center justify-center py-8 animate-success-bounce">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center text-green-500 mb-4 shadow-lg shadow-green-500/20">
            <CheckCircle2 size={40} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Verification Successful!</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Redirecting to your dashboard...</p>
        </div>
      ) : (
        <form onSubmit={handleVerify}>
          <div className="flex justify-between gap-2 sm:gap-4 mb-8">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={el => inputRefs.current[i] = el}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="w-10 sm:w-12 h-12 sm:h-14 text-center text-xl sm:text-2xl font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none text-slate-900 dark:text-white transition-colors"
                disabled={loading}
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading || otp.join('').length < 6}
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white py-3.5 px-4 rounded-xl font-bold shadow-lg shadow-primary/30 transition-all hover:shadow-primary/50 disabled:opacity-70 disabled:cursor-not-allowed mb-6"
          >
            {loading ? 'Verifying...' : 'Verify OTP'}
            {!loading && <ArrowRight size={18} />}
          </button>

          <div className="flex flex-col items-center gap-4 mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
            {timeLeft > 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                OTP expires in <span className="text-primary font-bold">{Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</span>
              </p>
            ) : (
              <p className="text-sm text-red-500 font-medium">OTP Expired</p>
            )}
            
            {resendWaitTime > 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Resend available in {resendWaitTime}s
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={loading}
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-hover transition-colors"
              >
                <RefreshCw size={14} /> Resend OTP Code
              </button>
            )}

            <button
               type="button"
               onClick={() => navigate('/login')}
               className="text-sm font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-colors"
            >
              Change Phone Number
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
