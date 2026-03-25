import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Grid3x3, ArrowLeft, AlertCircle, User, Shield } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function PatternAuthPage({ setIsAuthenticated, setIsAdminAuthenticated }) {
  const [regNo, setRegNo] = useState('');
  const [userType, setUserType] = useState('student'); // 'student' or 'admin'
  const [sessionId, setSessionId] = useState('');
  const [correctPattern, setCorrectPattern] = useState('');
  const [pattern, setPattern] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [inputMethod, setInputMethod] = useState('drag'); // 'drag' or 'click'
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('initiate'); // 'initiate', 'verify', 'success'
  const navigate = useNavigate();
  const location = useLocation();
  
  const canvasRef = useRef(null);

  // Check if coming from login with registration number
  useEffect(() => {
    if (location.state?.regNo) {
      setRegNo(location.state.regNo);
    }
    if (location.state?.userType) {
      setUserType(location.state.userType);
    }
  }, [location.state]);

  // Initialize and draw pattern grid
  useEffect(() => {
    if (step === 'verify' && canvasRef.current) {
      drawPatternGrid();
    }
  }, [step, correctPattern]);

  const drawPatternGrid = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const size = 300;
    const dotSize = 20;
    const spacing = size / 4;
    
    canvas.width = size;
    canvas.height = size;
    
    ctx.clearRect(0, 0, size, size);
    
    // Draw grid lines
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    
    // Vertical lines
    for (let i = 1; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(spacing * i, spacing);
      ctx.lineTo(spacing * i, size - spacing);
      ctx.stroke();
    }
    
    // Horizontal lines
    for (let i = 1; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(spacing, spacing * i);
      ctx.lineTo(size - spacing, spacing * i);
      ctx.stroke();
    }
    
    // Draw dots with numbers
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const x = spacing + col * spacing;
        const y = spacing + row * spacing;
        const dotNumber = row * 3 + col + 1;
        
        // Check if this dot is in the pattern
        const isInPattern = pattern.includes(dotNumber);
        
        // Draw dot with different colors based on pattern state
        ctx.beginPath();
        ctx.arc(x, y, dotSize / 2, 0, 2 * Math.PI);
        
        if (isInPattern) {
          // Connected dots - vibrant blue with strong glow effect
          ctx.fillStyle = '#2563eb';
          ctx.fill();
          
          // Add strong glow effect for connected dots
          ctx.shadowColor = '#2563eb';
          ctx.shadowBlur = 15;
          ctx.strokeStyle = '#1e40af';
          ctx.lineWidth = 4;
          ctx.stroke();
          ctx.shadowBlur = 0;
        } else {
          // Unconnected dots - darker gray for contrast
          ctx.fillStyle = '#475569';
          ctx.fill();
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        
        // Draw number with better contrast
        ctx.fillStyle = isInPattern ? '#ffffff' : '#ffffff';
        ctx.font = isInPattern ? 'bold 13px Arial' : 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(dotNumber.toString(), x, y);
      }
    }
    
    // Draw pattern lines if exists
    if (pattern.length > 1) {
      // Draw thicker, more visible lines with vibrant color
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      // Add strong shadow for better visibility
      ctx.shadowColor = '#2563eb';
      ctx.shadowBlur = 8;
      
      ctx.beginPath();
      
      for (let i = 0; i < pattern.length; i++) {
        const dotIndex = pattern[i];
        const row = Math.floor((dotIndex - 1) / 3);
        const col = (dotIndex - 1) % 3;
        const x = spacing + col * spacing;
        const y = spacing + row * spacing;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      
      // Reset shadow
      ctx.shadowBlur = 0;
      
      // Redraw connected dots on top of lines for better visibility
      for (let i = 0; i < pattern.length; i++) {
        const dotIndex = pattern[i];
        const row = Math.floor((dotIndex - 1) / 3);
        const col = (dotIndex - 1) % 3;
        const x = spacing + col * spacing;
        const y = spacing + row * spacing;
        
        // Outer ring for connected dots - more prominent
        ctx.beginPath();
        ctx.arc(x, y, dotSize / 2 + 5, 0, 2 * Math.PI);
        ctx.strokeStyle = '#1e40af';
        ctx.lineWidth = 4;
        ctx.stroke();
        
        // Inner dot - vibrant color
        ctx.beginPath();
        ctx.arc(x, y, dotSize / 2, 0, 2 * Math.PI);
        ctx.fillStyle = '#2563eb';
        ctx.fill();
        
        // Add inner glow
        ctx.beginPath();
        ctx.arc(x, y, dotSize / 2 - 2, 0, 2 * Math.PI);
        ctx.fillStyle = '#3b82f6';
        ctx.fill();
        
        // Number - higher contrast
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(dotIndex.toString(), x, y);
      }
    }
  };

  const handlePatternInitiate = async () => {
    if (userType === 'student' && !regNo.trim()) {
      setError('Please enter your registration number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/advanced/pattern-auth-initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          regdNo: userType === 'student' ? regNo.trim() : undefined,
          userType 
        })
      });

      console.log('Pattern initiate response status:', response.status);
      const data = await response.json();
      console.log('Pattern initiate response data:', data);
      
      if (data.success) {
        setSessionId(data.sessionId);
        setCorrectPattern(data.pattern);
        setStep('verify');
      } else {
        setError(data.message || 'Failed to initiate pattern authentication');
      }
    } catch (err) {
      setError('Server connection failed');
    } finally {
      setLoading(false);
    }
  };

  const getDotIndex = (x, y) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const relX = x - rect.left;
    const relY = y - rect.top;
    const spacing = canvas.width / 4;
    
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const dotX = spacing + col * spacing;
        const dotY = spacing + row * spacing;
        const distance = Math.sqrt(Math.pow(relX - dotX, 2) + Math.pow(relY - dotY, 2));
        
        if (distance < 30) {
          return row * 3 + col + 1;
        }
      }
    }
    return null;
  };

  const handleDotClick = (dotIndex) => {
    if (step !== 'verify') return;
    
    if (inputMethod === 'click') {
      // Click-by-click method
      if (!pattern.includes(dotIndex) && pattern.length < 10) {
        const newPattern = [...pattern, dotIndex];
        setPattern(newPattern);
        
        // No auto-verification - user must submit manually
      }
    }
  };

  const handleCanvasMouseDown = (e) => {
    if (step !== 'verify') return;
    
    const dotIndex = getDotIndex(e.clientX, e.clientY);
    if (dotIndex) {
      if (inputMethod === 'drag') {
        // Drag method
        if (!pattern.includes(dotIndex)) {
          setPattern([dotIndex]);
          setIsDrawing(true);
        }
      } else {
        // Click method
        handleDotClick(dotIndex);
      }
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (!isDrawing || step !== 'verify') return;
    
    const dotIndex = getDotIndex(e.clientX, e.clientY);
    if (dotIndex && !pattern.includes(dotIndex) && pattern.length < 10) {
      setPattern([...pattern, dotIndex]);
    }
  };

  const handleCanvasMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    // No auto-verification - user must submit manually
  };

  const handlePatternVerify = async () => {
    setLoading(true);
    setError('');

    try {
      const patternString = pattern.join('-');
      const response = await fetch(`${API_URL}/api/advanced/pattern-auth-verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sessionId, 
          pattern: patternString, 
          regdNo: userType === 'student' ? regNo.trim() : undefined
        })
      });

      console.log('Pattern verification response status:', response.status);
      const data = await response.json();
      console.log('Pattern verification response data:', data);
      
      if (data.success) {
        setStep('success');
        console.log('Pattern auth successful:', data);
        localStorage.setItem('authToken', data.authToken);

        if (data.userType === 'admin') {
          console.log('Setting admin authentication state...');
          localStorage.setItem('adminToken', data.authToken);
          localStorage.setItem('adminData', JSON.stringify(data.admin));
          setIsAdminAuthenticated(true); // Set admin authentication state
          console.log('Admin auth state set, checking immediately...');

          // Test the state immediately
          setTimeout(() => {
            console.log('Admin token in localStorage after set:', localStorage.getItem('adminToken'));
            console.log('About to navigate to admin dashboard...');
            navigate('/admin/dashboard');
          }, 100);
        } else {
          localStorage.setItem('studentData', JSON.stringify(data.student));
          localStorage.setItem('parent_session', JSON.stringify({
            token: data.authToken,
            regdNo: data.student?.registrationNumber || data.student?.regd_no || '',
            student: data.student
          }));
          setIsAuthenticated(true);
          navigate('/dashboard');
        }
      } else {
        setError(data.message || 'Pattern verification failed');
        setPattern([]);
        drawPatternGrid();
      }
    } catch (err) {
      setError('Server connection failed');
    } finally {
      setLoading(false);
    }
  };

  const resetPattern = () => {
    setPattern([]);
    drawPatternGrid();
  };

  const renderNumberButtons = () => {
    const buttons = [];
    for (let i = 1; i <= 9; i++) {
      const isInPattern = pattern.includes(i);
      buttons.push(
        <button
          key={i}
          onClick={() => handleDotClick(i)}
          disabled={step !== 'verify' || inputMethod !== 'click' || isInPattern || pattern.length >= 10}
          className={`w-12 h-12 rounded-lg font-bold text-lg transition-all ${
            isInPattern
              ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50'
              : pattern.length >= 10
              ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
              : 'bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-500'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {i}
        </button>
      );
    }
    return buttons;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => navigate(userType === 'admin' ? '/admin/login' : '/login')}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {userType === 'admin' ? 'Admin' : 'Student'} Pattern Login
            </h1>
            <div className="w-9" />
          </div>

          {/* User Type Selection */}
          {step === 'initiate' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                Login Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setUserType('student')}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    userType === 'student'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-slate-200 dark:border-slate-600 hover:border-slate-300'
                  }`}
                >
                  <User className="w-5 h-5 mx-auto mb-1 text-blue-600 dark:text-blue-400" />
                  <div className="text-xs font-medium text-slate-900 dark:text-white">Student</div>
                </button>
                <button
                  onClick={() => setUserType('admin')}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    userType === 'admin'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-slate-200 dark:border-slate-600 hover:border-slate-300'
                  }`}
                >
                  <Shield className="w-5 h-5 mx-auto mb-1 text-blue-600 dark:text-blue-400" />
                  <div className="text-xs font-medium text-slate-900 dark:text-white">Admin</div>
                </button>
              </div>
            </div>
          )}

          {/* Registration Number Input for Students */}
          {step === 'initiate' && userType === 'student' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Registration Number
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="e.g. 231FA04001"
                value={regNo}
                onChange={(e) => setRegNo(e.target.value.toUpperCase())}
              />
            </div>
          )}

          {/* Initiate Button */}
          {step === 'initiate' && (
            <button
              onClick={handlePatternInitiate}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Grid3x3 className="w-5 h-5" />
              {loading ? 'Initiating...' : 'Start Pattern Authentication'}
            </button>
          )}

          {/* Pattern Drawing */}
          {step === 'verify' && (
            <div className="text-center">
              <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <Grid3x3 className="w-8 h-8 mx-auto mb-2 text-blue-600 dark:text-blue-400" />
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Draw the pattern shown below:
                </p>
                <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                  {correctPattern}
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                  Connect the dots in the exact sequence
                </p>
              </div>
              
              {/* Input Method Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Input Method:
                </label>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => setInputMethod('drag')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      inputMethod === 'drag'
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    🖱️ Drag
                  </button>
                  <button
                    onClick={() => setInputMethod('click')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      inputMethod === 'click'
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    👆 Click Numbers
                  </button>
                </div>
              </div>
              
              {/* Pattern Display */}
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <canvas
                    ref={canvasRef}
                    className="border-2 border-slate-300 dark:border-slate-600 rounded-xl cursor-pointer bg-white dark:bg-slate-800 shadow-lg"
                    onMouseDown={handleCanvasMouseDown}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleCanvasMouseUp}
                    onMouseLeave={handleCanvasMouseUp}
                    style={{ 
                      width: '300px', 
                      height: '300px',
                      cursor: inputMethod === 'drag' ? 'pointer' : 'default'
                    }}
                  />
                  {/* Add a subtle glow effect around the canvas */}
                  <div className="absolute inset-0 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 pointer-events-none"></div>
                </div>
              </div>
              
              {/* Number Buttons for Click Method */}
              {inputMethod === 'click' && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Click numbers in sequence (max 10 dots):
                  </p>
                  <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
                    {renderNumberButtons()}
                  </div>
                  <div className="mt-3 space-y-2">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Current pattern: {pattern.join(' → ') || 'None'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Progress: {pattern.length} / 10 dots (maximum)
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      ⚠️ Click "Submit Pattern" to verify (no auto-verify)
                    </p>
                    {/* Submit button - always show when pattern has dots */}
                    {pattern.length >= 1 && (
                      <button
                        onClick={handlePatternVerify}
                        disabled={loading}
                        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-400 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
                      >
                        {loading ? 'Verifying...' : 'Submit Pattern'}
                      </button>
                    )}
                  </div>
                </div>
              )}
              
              {/* Instructions */}
              <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">
                  {inputMethod === 'drag' 
                    ? '🖱️ Drag your mouse to connect dots (max 10 dots)'
                    : '👆 Click the number buttons in sequence (max 10 dots)'
                  }
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                  Expected pattern: {correctPattern}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                  Current progress: {pattern.length} / 10 dots (maximum)
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                  ⚠️ Manual submission required - Click "Submit Pattern" to verify
                </p>
                {/* Submit button for drag method */}
                {inputMethod === 'drag' && pattern.length >= 1 && (
                  <button
                    onClick={handlePatternVerify}
                    disabled={loading}
                    className="w-full mt-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-400 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
                  >
                    {loading ? 'Verifying...' : 'Submit Pattern'}
                  </button>
                )}
              </div>
              
              <div className="flex gap-3 justify-center">
                <button
                  onClick={resetPattern}
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Clear Pattern
                </button>
                <button
                  onClick={() => setStep('initiate')}
                  className="text-sm text-slate-600 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
                >
                  Back
                </button>
              </div>
              
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
                Minimum 4 dots required • Pattern will auto-verify when complete
              </p>
            </div>
          )}

          {/* Success State */}
          {step === 'success' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="w-8 h-8 bg-green-600 rounded-full" />
              </div>
              <h2 className="text-xl font-bold text-green-900 dark:text-green-100 mb-2">
                Authentication Successful!
              </h2>
              <p className="text-green-700 dark:text-green-300">
                Redirecting to {userType} dashboard...
              </p>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
