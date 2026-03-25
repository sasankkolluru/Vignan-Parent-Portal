import React, { useState } from 'react';
import { History, Download, ChevronDown } from 'lucide-react';

export default function HistoricalAttendancePage() {
  const semesters = ["Semester 1", "Semester 2", "Semester 3"];
  const [selectedSem, setSelectedSem] = useState(semesters[semesters.length - 1]);

  // Mock Data
  const historicalData = {
    "Semester 1": { avg: 92.5, subjects: [
      { code: "PH101", name: "Physics", total: 40, attended: 38, perc: 95.0, status: "OK" },
      { code: "MA101", name: "Math I", total: 40, attended: 36, perc: 90.0, status: "OK" },
    ]},
    "Semester 2": { avg: 88.0, subjects: [
      { code: "CH101", name: "Chemistry", total: 40, attended: 35, perc: 87.5, status: "OK" },
      { code: "MA102", name: "Math II", total: 40, attended: 32, perc: 80.0, status: "OK" },
    ]},
    "Semester 3": { avg: 82.5, subjects: [
      { code: "CS101", name: "Intro to Programming", total: 45, attended: 35, perc: 77.7, status: "OK" },
      { code: "EE101", name: "Basic Electronics", total: 40, attended: 29, perc: 72.5, status: "Low" },
    ]}
  };

  const currentData = historicalData[selectedSem];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-2">
            <History className="text-primary" /> Historical Attendance
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Review past semester records.</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl text-sm font-semibold transition-colors shadow-sm">
          <Download size={16} /> Download PDF
        </button>
      </div>

      <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl w-full sm:w-auto overflow-x-auto shadow-inner">
        {semesters.map(sem => (
          <button
            key={sem}
            onClick={() => setSelectedSem(sem)}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
              selectedSem === sem 
                ? 'bg-white dark:bg-slate-800 text-primary shadow-sm' 
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {sem}
          </button>
        ))}
      </div>

      <div className="glass-panel p-6 rounded-3xl bg-primary/5 border border-primary/10 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Semester Average</h2>
          <p className="text-slate-500 text-sm">Average attendance across all credited courses in {selectedSem}.</p>
        </div>
        <span className="text-4xl font-black text-primary">{currentData.avg}%</span>
      </div>

      <div className="glass-panel rounded-3xl overflow-hidden bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-bold">Subject Records: {selectedSem}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-sm border-b border-slate-200 dark:border-slate-700/50">
                <th className="p-4 font-semibold">Subject Code</th>
                <th className="p-4 font-semibold">Subject Name</th>
                <th className="p-4 font-semibold text-center">Classes Total</th>
                <th className="p-4 font-semibold text-center">Attended</th>
                <th className="p-4 font-semibold text-right">Percentage</th>
                <th className="p-4 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {currentData.subjects.map((sub, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="p-4 font-medium text-slate-700 dark:text-slate-300">{sub.code}</td>
                  <td className="p-4 text-slate-600 dark:text-slate-400">{sub.name}</td>
                  <td className="p-4 text-center">{sub.total}</td>
                  <td className="p-4 text-center font-medium">{sub.attended}</td>
                  <td className="p-4 text-right font-bold text-slate-800 dark:text-slate-200">{sub.perc.toFixed(1)}%</td>
                  <td className="p-4 text-center">
                    <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-bold ${
                      sub.status === 'OK' 
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' 
                        : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                    }`}>
                      {sub.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
