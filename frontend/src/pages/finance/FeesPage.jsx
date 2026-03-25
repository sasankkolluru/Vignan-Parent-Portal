import React, { useState, useEffect } from 'react';
import { CreditCard, Wallet, AlertCircle, Receipt, Loader2, Wifi, WifiOff } from 'lucide-react';
import { getSocket, joinStudentRoom } from '../../services/socketService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function FeesPage() {
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading]         = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const [activeTab, setActiveTab]     = useState('current');

  const getRegdNo = () => {
    try {
      const s = JSON.parse(localStorage.getItem('parent_session') || '{}');
      return (s.regdNo || s.studentRegdNo || '').toString().toUpperCase();
    } catch { return ''; }
  };

  const fetchStudent = async (regdNo) => {
    if (!regdNo) { setLoading(false); return; }
    try {
      const res  = await fetch(`${API_URL}/api/student/${regdNo}`);
      const data = await res.json();
      if (data.success && data.data) setStudentData(data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const regdNo = getRegdNo();
    fetchStudent(regdNo);

    const socket = getSocket();
    const onConnect    = () => { setSocketConnected(true); if (regdNo) joinStudentRoom(regdNo); };
    const onDisconnect = () => setSocketConnected(false);
    const onFees    = (updated) => setStudentData(prev => prev ? { ...prev, feeDetails: updated.feeDetails ?? prev.feeDetails } : updated);
    const onProfile = (updated) => setStudentData(prev => prev ? { ...prev, ...updated } : updated);

    socket.on('connect',         onConnect);
    socket.on('disconnect',      onDisconnect);
    socket.on('fees_updated',    onFees);
    socket.on('profile_updated', onProfile);
    if (socket.connected) { setSocketConnected(true); if (regdNo) joinStudentRoom(regdNo); }

    return () => {
      socket.off('connect',         onConnect);
      socket.off('disconnect',      onDisconnect);
      socket.off('fees_updated',    onFees);
      socket.off('profile_updated', onProfile);
    };
  }, []);

  const fees = studentData?.feeDetails || {};
  const total       = parseFloat(fees.totalTuitionFee)   || 0;
  const scholarship = parseFloat(fees.scholarshipApplied) || 0;
  const paid        = parseFloat(fees.amountPaid)         || 0;
  const netPayable  = parseFloat(fees.netPayableAmount)   || 0;
  const remaining   = Math.max(0, netPayable - paid);
  const paidPct     = netPayable > 0 ? Math.min(100, (paid / netPayable) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-2 mb-1">
            <CreditCard className="text-primary" /> Fees &amp; Financials
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Live fee data — updated by admin in real time.</p>
        </div>
        <div className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${socketConnected ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
          {socketConnected ? <><Wifi size={12}/><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"/>Live</> : <><WifiOff size={12}/> Connecting…</>}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl w-full sm:w-fit shadow-inner">
        {['current', 'history'].map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`flex-1 sm:px-6 py-2.5 rounded-xl text-sm font-bold transition-all capitalize ${activeTab === t ? 'bg-white dark:bg-slate-800 text-primary shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}>
            {t === 'current' ? 'Current Semester' : 'Payment History'}
          </button>
        ))}
      </div>

      {activeTab === 'current' && (
        <div className="space-y-6">
          {loading ? (
            <div className="glass-panel p-16 flex flex-col items-center justify-center rounded-3xl border border-slate-200 dark:border-slate-800">
              <Loader2 className="w-10 h-10 text-primary animate-spin mb-3" />
              <p className="text-slate-500 font-medium text-sm">Syncing live fee data…</p>
            </div>
          ) : (
            <>
              {/* Progress bar */}
              <div className="glass-panel rounded-3xl bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-xl p-8">
                <div className="flex flex-col lg:flex-row gap-8">
                  <div className="flex-1 space-y-5">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      Fee Breakdown
                      <span className="px-2 py-0.5 bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400 text-[10px] rounded-full uppercase tracking-wider font-bold">LIVE</span>
                    </h2>
                    <div className="space-y-3 text-sm">
                      {[
                        ['Total Tuition Fee', `₹ ${total.toLocaleString('en-IN')}`, 'text-slate-700 dark:text-slate-200'],
                        ['Scholarship Applied', `– ₹ ${scholarship.toLocaleString('en-IN')}`, 'text-emerald-600 dark:text-emerald-400'],
                        ['Net Payable', `₹ ${netPayable.toLocaleString('en-IN')}`, 'text-slate-700 dark:text-slate-200 font-bold'],
                        ['Amount Paid', `– ₹ ${paid.toLocaleString('en-IN')}`, 'text-blue-600 dark:text-blue-400'],
                      ].map(([label, val, cls]) => (
                        <div key={label} className="flex justify-between py-2.5 border-b border-slate-100 dark:border-slate-800">
                          <span className="text-slate-500 dark:text-slate-400">{label}</span>
                          <span className={cls}>{val}</span>
                        </div>
                      ))}
                    </div>

                    {/* Payment progress */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold text-slate-500">
                        <span>Payment Progress</span>
                        <span>{paidPct.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3">
                        <div
                          className="h-3 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-700"
                          style={{ width: `${paidPct}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Pending widget */}
                  <div className="lg:w-72 bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 flex flex-col justify-center">
                    <div className="text-center mb-5">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Outstanding Amount</p>
                      <div className="flex items-center justify-center gap-2">
                        <Wallet className="text-rose-500" size={26} />
                        <span className={`text-4xl font-black ${remaining > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          ₹ {remaining.toLocaleString('en-IN')}
                        </span>
                      </div>
                      {remaining === 0 && <p className="text-emerald-500 text-sm font-bold mt-1">✅ Fully Paid</p>}
                    </div>
                    {remaining > 0 && (
                      <div className="flex items-start gap-2 text-amber-700 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400 p-3 rounded-xl text-xs mb-4 border border-amber-200 dark:border-amber-500/20">
                        <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                        <p>Please pay the outstanding amount before the deadline to avoid penalties.</p>
                      </div>
                    )}
                    <button className="w-full flex justify-center items-center gap-2 bg-primary hover:bg-primary-hover text-white py-3 px-4 rounded-xl font-bold transition-all shadow-lg shadow-primary/30 active:scale-95 text-sm">
                      <Receipt size={16} /> Generate Challan
                    </button>
                  </div>
                </div>
              </div>

              {/* Scholarship card */}
              {scholarship > 0 && (
                <div className="glass-panel p-6 rounded-3xl border border-emerald-100 dark:border-emerald-900/30 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-800/50 flex items-center justify-center text-2xl">🏆</div>
                    <div>
                      <h3 className="font-bold text-emerald-800 dark:text-emerald-300">Scholarship Applied</h3>
                      <p className="text-emerald-600/80 text-sm mt-0.5">Merit-based discount approved by institution</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400">₹ {scholarship.toLocaleString('en-IN')}</p>
                    <span className="inline-flex items-center gap-1 bg-emerald-600 text-white text-xs font-bold px-2 py-0.5 rounded-full mt-1">Approved ✓</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="glass-panel rounded-3xl overflow-hidden bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-lg font-bold">Transaction History</h2>
            <p className="text-xs text-slate-400 mt-0.5">Recorded payments for this academic year</p>
          </div>
          {paid > 0 ? (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs uppercase tracking-wider">
                <tr>
                  {['Date','Description','Amount','Status'].map(h => (
                    <th key={h} className="px-5 py-3 font-semibold border-b border-slate-200 dark:border-slate-700">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{new Date().toLocaleDateString('en-IN')}</td>
                  <td className="px-5 py-4 font-medium">Semester Fee Payment</td>
                  <td className="px-5 py-4 font-bold text-emerald-600">₹ {paid.toLocaleString('en-IN')}</td>
                  <td className="px-5 py-4"><span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full text-xs font-bold">Verified</span></td>
                </tr>
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center text-slate-400">No payment records found.</div>
          )}
        </div>
      )}
    </div>
  );
}
