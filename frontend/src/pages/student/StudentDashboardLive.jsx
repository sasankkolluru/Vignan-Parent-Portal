import { useState, useEffect } from 'react';
import { getSocket, joinStudentRoom } from '../services/socketService';

export default function StudentDashboard({ studentData }) {
  const [socket, setSocket] = useState(null);
  const [profileData, setProfileData] = useState(studentData || {});
  const [notifications, setNotifications] = useState([]);
  const [realTimeUpdates, setRealTimeUpdates] = useState([]);

  useEffect(() => {
    // Initialize socket connection
    const socketInstance = getSocket();
    setSocket(socketInstance);

    // Join student room if regdNo is available
    if (studentData?.regd_no) {
      joinStudentRoom(studentData.regd_no);
      console.log(`[Student] Joined room for ${studentData.regd_no}`);
    }

    // Listen for profile updates from admin
    socketInstance.on('profile_updated', (data) => {
      console.log('[Student] Profile update received:', data);
      setProfileData(prev => ({ ...prev, ...data }));
      
      // Add to real-time updates
      setRealTimeUpdates(prev => [{
        type: 'profile',
        message: 'Your profile has been updated by the administration',
        data,
        timestamp: new Date()
      }, ...prev.slice(0, 4)]); // Keep only last 5 updates
    });

    // Listen for fees updates from admin
    socketInstance.on('fees_updated', (data) => {
      console.log('[Student] Fees update received:', data);
      setProfileData(prev => ({ 
        ...prev, 
        feeDetails: data.feeDetails 
      }));
      
      // Add to real-time updates
      setRealTimeUpdates(prev => [{
        type: 'fees',
        message: 'Your fee details have been updated',
        data,
        timestamp: new Date()
      }, ...prev.slice(0, 4)]);
    });

    // Listen for marks updates from admin
    socketInstance.on('marks_updated', (data) => {
      console.log('[Student] Marks update received:', data);
      
      // Update marks in profile data
      setProfileData(prev => ({
        ...prev,
        subjectResults: data.subjectResults || data
      }));
      
      // Add to real-time updates
      setRealTimeUpdates(prev => [{
        type: 'marks',
        message: 'Your marks have been updated',
        data,
        timestamp: new Date()
      }, ...prev.slice(0, 4)]);
    });

    // Listen for attendance updates from admin
    socketInstance.on('attendance_updated', (data) => {
      console.log('[Student] Attendance update received:', data);
      
      // Update attendance in profile data
      setProfileData(prev => ({
        ...prev,
        attendance: data.attendanceRecords || data
      }));
      
      // Add to real-time updates
      setRealTimeUpdates(prev => [{
        type: 'attendance',
        message: 'Your attendance has been updated',
        data,
        timestamp: new Date()
      }, ...prev.slice(0, 4)]);
    });

    // Listen for new notices from admin
    socketInstance.on('notice_posted', (data) => {
      console.log('[Student] New notice received:', data);
      
      // Add to notifications
      setNotifications(prev => [{
        ...data,
        id: data.id || Date.now(),
        read: false
      }, ...prev.slice(0, 9)]); // Keep only last 10 notifications
      
      // Add to real-time updates
      setRealTimeUpdates(prev => [{
        type: 'notice',
        message: `New ${data.type}: ${data.title}`,
        data,
        timestamp: new Date()
      }, ...prev.slice(0, 4)]);
    });

    // Cleanup on unmount
    return () => {
      socketInstance.off('profile_updated');
      socketInstance.off('fees_updated');
      socketInstance.off('marks_updated');
      socketInstance.off('attendance_updated');
      socketInstance.off('notice_posted');
    };
  }, [studentData]);

  const markNotificationAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  const getUpdateIcon = (type) => {
    switch (type) {
      case 'profile': return '👤';
      case 'marks': return '📊';
      case 'attendance': return '📅';
      case 'notice': return '📢';
      default: return '🔔';
    }
  };

  const getUpdateColor = (type) => {
    switch (type) {
      case 'profile': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'marks': return 'bg-green-100 text-green-800 border-green-200';
      case 'attendance': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'notice': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-blue-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">VS</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Student Portal</h1>
                <p className="text-xs text-gray-500">Vignan's Institute of Technology</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Live Status Indicator */}
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">Live Updates</span>
              </div>
              
              {/* Student Info */}
              <div className="text-right">
                <p className="font-semibold text-gray-900">{profileData.name}</p>
                <p className="text-sm text-gray-500">{profileData.regd_no}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Student Profile Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Student Profile</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Registration Number</p>
                  <p className="font-medium text-gray-900">{profileData.regd_no}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium text-gray-900">{profileData.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium text-gray-900">{profileData.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Mobile</p>
                  <p className="font-medium text-gray-900">{profileData.mobile}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Branch</p>
                  <p className="font-medium text-gray-900">{profileData.branch}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Semester</p>
                  <p className="font-medium text-gray-900">{profileData.semester}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Section</p>
                  <p className="font-medium text-gray-900">{profileData.section}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Counsellor</p>
                  <p className="font-medium text-gray-900">{profileData.counsellor}</p>
                </div>
              </div>
            </div>

            {/* Academic Performance */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Academic Performance</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-600 font-medium">CGPA</p>
                  <p className="text-2xl font-bold text-blue-900">{profileData.cgpa || 'N/A'}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-green-600 font-medium">SGPA</p>
                  <p className="text-2xl font-bold text-green-900">{profileData.sgpa || 'N/A'}</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4">
                  <p className="text-sm text-yellow-600 font-medium">Attendance</p>
                  <p className="text-2xl font-bold text-yellow-900">{profileData.attendance || 'N/A'}%</p>
                </div>
              </div>
            </div>

            {/* Recent Marks */}
            {(profileData.subjectResults || profileData.subjects) && (profileData.subjectResults || profileData.subjects).length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 overflow-hidden">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Detailed Subject Marks</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left whitespace-nowrap">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase font-medium text-xs">
                      <tr>
                        <th className="px-4 py-3">Subject</th>
                        <th className="px-3 py-3 text-center">Pre-T1<br/><span className="text-[9px] lowercase font-normal">(10)</span></th>
                        <th className="px-3 py-3 text-center">M1<br/><span className="text-[9px] lowercase font-normal">(20)</span></th>
                        <th className="px-3 py-3 text-center">T2<br/><span className="text-[9px] lowercase font-normal">(5)</span></th>
                        <th className="px-3 py-3 text-center">T3<br/><span className="text-[9px] lowercase font-normal">(5)</span></th>
                        <th className="px-3 py-3 text-center">T4<br/><span className="text-[9px] lowercase font-normal">(20)</span></th>
                        <th className="px-3 py-3 text-center">T5 Avg<br/><span className="text-[9px] lowercase font-normal">(20)</span></th>
                        <th className="px-3 py-3 text-center">Total<br/><span className="text-[9px] lowercase font-normal">(100)</span></th>
                        <th className="px-4 py-3 text-center">Grade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {(profileData.subjectResults || profileData.subjects).map((subject, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">{subject.subject || subject.subject_name}</td>
                          <td className="px-3 py-3 text-center text-gray-700">{subject.pre_t1 ?? '-'}</td>
                          <td className="px-3 py-3 text-center text-gray-700">{subject.m1 ?? '-'}</td>
                          <td className="px-3 py-3 text-center text-gray-700">{subject.t2 ?? '-'}</td>
                          <td className="px-3 py-3 text-center text-gray-700">{subject.t3 ?? '-'}</td>
                          <td className="px-3 py-3 text-center text-gray-700">{subject.t4 ?? '-'}</td>
                          <td className="px-3 py-3 text-center text-gray-700">{subject.t5_avg != null ? Number(subject.t5_avg).toFixed(1) : '-'}</td>
                          <td className="px-3 py-3 text-center font-bold text-gray-900">{subject.final_total ?? subject.marks ?? '-'}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              subject.grade === 'S' || subject.grade === 'A' ? 'bg-green-100 text-green-800' :
                              subject.grade === 'B' ? 'bg-yellow-100 text-yellow-800' :
                              subject.grade === 'C' ? 'bg-orange-100 text-orange-800' :
                              subject.grade ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-500'
                            }`}>
                              {subject.grade || 'N/A'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Fee Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Fee Information</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Tuition Fee</span>
                  <span className="font-medium text-gray-900">₹{profileData.totalTuitionFee || '0'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Scholarship Applied</span>
                  <span className="font-medium text-green-600">-₹{profileData.scholarshipApplied || '0'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Net Payable Amount</span>
                  <span className="font-medium text-gray-900">₹{profileData.netPayableAmount || '0'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Amount Paid</span>
                  <span className="font-medium text-green-600">₹{profileData.amountPaid || '0'}</span>
                </div>
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-900">Balance Due</span>
                    <span className="font-bold text-red-600">
                      ₹{((profileData.netPayableAmount || 0) - (profileData.amountPaid || 0))}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Real-time Updates */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Live Updates</h3>
              {realTimeUpdates.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No updates yet</p>
              ) : (
                <div className="space-y-3">
                  {realTimeUpdates.map((update, index) => (
                    <div key={index} className={`p-3 rounded-lg border ${getUpdateColor(update.type)}`}>
                      <div className="flex items-start gap-2">
                        <span className="text-lg">{getUpdateIcon(update.type)}</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{update.message}</p>
                          <p className="text-xs opacity-75 mt-1">
                            {new Date(update.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notifications */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Notices</h3>
              {notifications.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No notices</p>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        notification.read 
                          ? 'bg-gray-50 border-gray-200' 
                          : 'bg-blue-50 border-blue-200'
                      }`}
                      onClick={() => markNotificationAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-lg">📢</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                          <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(notification.timestamp || notification.createdAt).toLocaleString()}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-1"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
              <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm opacity-90">Total Updates</span>
                  <span className="font-bold">{realTimeUpdates.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm opacity-90">Unread Notices</span>
                  <span className="font-bold">{notifications.filter(n => !n.read).length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm opacity-90">Connection</span>
                  <span className="font-bold flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
                    Live
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
