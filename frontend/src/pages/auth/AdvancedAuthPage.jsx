import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff, Grid3x3, ArrowLeft, Volume2, AlertCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function AdvancedAuthPage() {
  const [regNo, setRegNo] = useState('');
  const [authMethod, setAuthMethod] = useState('voice'); // 'voice' or 'pattern'
  const [sessionId, setSessionId] = useState('');
  const [phrase, setPhrase] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [pattern, setPattern] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('initiate'); // 'initiate', 'verify', 'success'
  const navigate = useNavigate();
  
  const canvasRef = useRef(null);
  const mediaRecorderRef = useRef(null);

  // Initialize pattern grid
  useEffect(() => {
    if (authMethod === 'pattern' && canvasRef.current) {
      drawPatternGrid();
    }
  }, [authMethod]);

  const drawPatternGrid = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const size = 300;
    const dotSize = 20;
    const spacing = size / 4;
    
    canvas.width = size;
    canvas.height = size;
    
    ctx.clearRect(0, 0, size, size);
    
    // Draw dots
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const x = spacing + col * spacing;
        const y = spacing + row * spacing;
        
        ctx.beginPath();
        ctx.arc(x, y, dotSize / 2, 0, 2 * Math.PI);
        ctx.fillStyle = '#64748b';
        ctx.fill();
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
    
    // Draw pattern lines if exists
    if (pattern.length > 1) {
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
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
    }
  };

  const handleVoiceInitiate = async () => {
    if (!regNo.trim()) {
      setError('Please enter your registration number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/advanced/voice-auth-initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regdNo: regNo.trim() })
      });

      const data = await response.json();
      
      if (data.success) {
        setSessionId(data.sessionId);
        setPhrase(data.phrase);
        setStep('verify');
      } else {
        setError(data.message || 'Failed to initiate voice authentication');
      }
    } catch (err) {
      setError('Server connection failed');
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        // In demo, we'll just proceed with verification
        handleVoiceVerify();
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      
      // Auto-stop after 3 seconds
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
          setIsRecording(false);
        }
      }, 3000);
    } catch (err) {
      setError('Microphone access denied');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleVoiceVerify = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/advanced/voice-auth-verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, regdNo: regNo.trim() })
      });

      const data = await response.json();
      
      if (data.success) {
        setStep('success');
        setTimeout(() => {
          localStorage.setItem('authToken', data.authToken);
          localStorage.setItem('studentData', JSON.stringify(data.student));
          setIsAuthenticated(true);
          navigate('/dashboard');
        }, 2000);
      } else {
        setError(data.message || 'Voice verification failed');
      }
    } catch (err) {
      setError('Server connection failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePatternInitiate = async () => {
    if (!regNo.trim()) {
      setError('Please enter your registration number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/advanced/pattern-auth-initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regdNo: regNo.trim() })
      });

      const data = await response.json();
      
      if (data.success) {
        setSessionId(data.sessionId);
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

  const handleCanvasMouseDown = (e) => {
    if (step !== 'verify' || authMethod !== 'pattern') return;
    
    const dotIndex = getDotIndex(e.clientX, e.clientY);
    if (dotIndex && !pattern.includes(dotIndex)) {
      setPattern([dotIndex]);
      setIsDrawing(true);
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (!isDrawing || step !== 'verify' || authMethod !== 'pattern') return;
    
    const dotIndex = getDotIndex(e.clientX, e.clientY);
    if (dotIndex && !pattern.includes(dotIndex)) {
      setPattern([...pattern, dotIndex]);
    }
  };

  const handleCanvasMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    if (pattern.length >= 4) {
      handlePatternVerify();
    }
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
          regdNo: regNo.trim() 
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setStep('success');
        setTimeout(() => {
          localStorage.setItem('authToken', data.authToken);
          localStorage.setItem('studentData', JSON.stringify(data.student));
          setIsAuthenticated(true);
          navigate('/dashboard');
        }, 2000);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => navigate('/login')}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Advanced Authentication</h1>
            <div className="w-9" />
          </div>

          {/* Registration Number Input */}
          {step === 'initiate' && (
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

          {/* Auth Method Selection */}
          {step === 'initiate' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                Choose Authentication Method
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setAuthMethod('voice')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    authMethod === 'voice'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-slate-200 dark:border-slate-600 hover:border-slate-300'
                  }`}
                >
                  <Mic className="w-6 h-6 mx-auto mb-2 text-blue-600 dark:text-blue-400" />
                  <div className="text-sm font-medium text-slate-900 dark:text-white">Voice</div>
                </button>
                <button
                  onClick={() => setAuthMethod('pattern')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    authMethod === 'pattern'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-slate-200 dark:border-slate-600 hover:border-slate-300'
                  }`}
                >
                  <Grid3x3 className="w-6 h-6 mx-auto mb-2 text-blue-600 dark:text-blue-400" />
                  <div className="text-sm font-medium text-slate-900 dark:text-white">Pattern</div>
                </button>
              </div>
            </div>
          )}

          {/* Voice Authentication */}
          {authMethod === 'voice' && step === 'initiate' && (
            <button
              onClick={handleVoiceInitiate}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Volume2 className="w-5 h-5" />
              {loading ? 'Initiating...' : 'Start Voice Authentication'}
            </button>
          )}

          {authMethod === 'voice' && step === 'verify' && (
            <div className="text-center">
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <Volume2 className="w-8 h-8 mx-auto mb-2 text-blue-600 dark:text-blue-400" />
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Please speak clearly:
                </p>
                <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                  "{phrase}"
                </p>
              </div>
              
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={loading}
                className={`w-full py-4 px-4 rounded-xl transition-all flex items-center justify-center gap-3 ${
                  isRecording
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                } disabled:bg-slate-400`}
              >
                {isRecording ? (
                  <>
                    <MicOff className="w-6 h-6" />
                    <span>Stop Recording</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-6 h-6" />
                    <span>{loading ? 'Verifying...' : 'Start Recording'}</span>
                  </>
                )}
              </button>
              
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
                Recording will stop automatically after 3 seconds
              </p>
            </div>
          )}

          {/* Pattern Authentication */}
          {authMethod === 'pattern' && step === 'initiate' && (
            <button
              onClick={handlePatternInitiate}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Grid3x3 className="w-5 h-5" />
              {loading ? 'Initiating...' : 'Start Pattern Authentication'}
            </button>
          )}

          {authMethod === 'pattern' && step === 'verify' && (
            <div className="text-center">
              <div className="mb-4">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Draw your pattern on the grid
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Hint: Connect at least 4 dots
                </p>
              </div>
              
              <div className="flex justify-center mb-4">
                <canvas
                  ref={canvasRef}
                  className="border-2 border-slate-300 dark:border-slate-600 rounded-xl cursor-pointer"
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  onMouseLeave={handleCanvasMouseUp}
                />
              </div>
              
              <button
                onClick={resetPattern}
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Clear Pattern
              </button>
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
                Redirecting to dashboard...
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
