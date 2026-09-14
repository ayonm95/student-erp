import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import {
  User,
  BookOpen,
  CalendarCheck,
  Award,
  Hash,
  Building2,
  Mail,
  GraduationCap,
  Percent,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [profile, setProfile] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [grades, setGrades] = useState([]);

  const studentId = user?.studentId;

  const fetchStudentData = async () => {
    if (!studentId) {
      setError('Student profile ID could not be identified for this account.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      const [profRes, enrRes, attRes, grdRes] = await Promise.all([
        axiosInstance.get(`/students/${studentId}`),
        axiosInstance.get(`/enrollment/student/${studentId}`),
        axiosInstance.get(`/attendance/student/${studentId}`),
        axiosInstance.get(`/grades/student/${studentId}`),
      ]);

      setProfile(profRes.data.data);
      setEnrollments(enrRes.data.data || []);
      setAttendance(attRes.data.data || []);
      setGrades(grdRes.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch student data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, [studentId]);

  // Attendance metrics
  const totalClasses = attendance.length;
  const attendedClasses = attendance.filter((a) => a.status === 'present').length;
  const attendancePct = totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 100;

  // Grade metrics
  const totalMarksObtained = grades.reduce((acc, g) => acc + g.marksObtained, 0);
  const totalMaxMarks = grades.reduce((acc, g) => acc + g.maxMarks, 0);
  const overallPercentage = totalMaxMarks > 0 ? Math.round((totalMarksObtained / totalMaxMarks) * 100) : 0;

  const calculateGradeLetter = (pct) => {
    if (pct >= 90) return { letter: 'A+', color: 'grade-aplus' };
    if (pct >= 80) return { letter: 'A', color: 'grade-a' };
    if (pct >= 70) return { letter: 'B+', color: 'grade-bplus' };
    if (pct >= 60) return { letter: 'B', color: 'grade-b' };
    if (pct >= 50) return { letter: 'C', color: 'grade-c' };
    return { letter: 'F', color: 'grade-f' };
  };

  return (
    <div className="dashboard-layout">
      {/* Student Top Header Card */}
      <div className="dashboard-header-card student-banner">
        <div className="header-info">
          <h2>Welcome back, {user?.name || 'Student'}</h2>
          <p>
            Department of {profile?.department || user?.department} • Semester {profile?.semester || user?.semester} • Roll No: {profile?.rollNumber || user?.rollNumber}
          </p>
        </div>
        <button onClick={fetchStudentData} className="btn-refresh" title="Refresh records">
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
          <span>Sync</span>
        </button>
      </div>

      {error && (
        <div className="alert-box alert-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="tab-navigation">
        <button
          className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <User size={16} />
          <span>My Profile</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'courses' ? 'active' : ''}`}
          onClick={() => setActiveTab('courses')}
        >
          <BookOpen size={16} />
          <span>Enrolled Courses ({enrollments.length})</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'attendance' ? 'active' : ''}`}
          onClick={() => setActiveTab('attendance')}
        >
          <CalendarCheck size={16} />
          <span>My Attendance ({attendancePct}%)</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'grades' ? 'active' : ''}`}
          onClick={() => setActiveTab('grades')}
        >
          <Award size={16} />
          <span>Report Card & Grades</span>
        </button>
      </div>

      {/* Main Tab Views */}
      {loading ? (
        <div className="center-loader-screen">
          <div className="spinner"></div>
          <p>Retrieving your academic records...</p>
        </div>
      ) : (
        <div className="tab-content-area">
          {/* TAB 1: PROFILE */}
          {activeTab === 'profile' && (
            <div className="profile-grid">
              <div className="dashboard-card profile-details-card">
                <div className="profile-avatar-large">
                  <GraduationCap size={48} />
                </div>
                <h3>{profile?.userId?.name || user?.name}</h3>
                <span className="profile-badge-student">Enrolled Scholar</span>

                <div className="profile-meta-list">
                  <div className="profile-meta-item">
                    <span className="meta-label">
                      <Hash size={16} /> Roll Number:
                    </span>
                    <strong className="code-badge">{profile?.rollNumber}</strong>
                  </div>
                  <div className="profile-meta-item">
                    <span className="meta-label">
                      <Mail size={16} /> Email:
                    </span>
                    <strong>{profile?.userId?.email || user?.email}</strong>
                  </div>
                  <div className="profile-meta-item">
                    <span className="meta-label">
                      <Building2 size={16} /> Department:
                    </span>
                    <strong>{profile?.department}</strong>
                  </div>
                  <div className="profile-meta-item">
                    <span className="meta-label">
                      <BookOpen size={16} /> Semester:
                    </span>
                    <strong className="tag-sem">Semester {profile?.semester}</strong>
                  </div>
                  <div className="profile-meta-item">
                    <span className="meta-label">Account Role:</span>
                    <strong className="role-pill student">STUDENT (VERIFIED)</strong>
                  </div>
                </div>
              </div>

              <div className="dashboard-card academic-overview-card">
                <h3>Academic Standing Snapshot</h3>
                <div className="academic-stats-row">
                  <div className="mini-stat-box">
                    <span className="mini-stat-label">Active Courses</span>
                    <span className="mini-stat-number">{enrollments.length}</span>
                    <span className="mini-stat-sub">This term</span>
                  </div>
                  <div className="mini-stat-box">
                    <span className="mini-stat-label">Attendance</span>
                    <span className={`mini-stat-number ${attendancePct >= 75 ? 'text-success' : 'text-danger'}`}>
                      {attendancePct}%
                    </span>
                    <span className="mini-stat-sub">
                      {attendancePct >= 75 ? 'Safe (>75% req)' : 'Shortage Alert (<75%)'}
                    </span>
                  </div>
                  <div className="mini-stat-box">
                    <span className="mini-stat-label">Aggregate Marks</span>
                    <span className="mini-stat-number">{overallPercentage}%</span>
                    <span className="mini-stat-sub">
                      {grades.length > 0 ? `${calculateGradeLetter(overallPercentage).letter} Grade` : 'Pending'}
                    </span>
                  </div>
                </div>

                <div className="security-notice-box">
                  <p>
                    <strong>Privacy & Ownership Guaranteed:</strong> This portal securely enforces identity ownership at the database and middleware layers. You can only view your own records. Access to other student profiles is strictly prohibited and guarded via JWT signature verification.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MY COURSES */}
          {activeTab === 'courses' && (
            <div className="dashboard-card">
              <div className="card-header-flex">
                <div>
                  <h3>My Enrolled Courses</h3>
                  <p>Current semester course catalog and credit load</p>
                </div>
                <div className="credits-badge">
                  Total Credits: {enrollments.reduce((acc, e) => acc + (e.course?.credits || 0), 0)}
                </div>
              </div>

              <div className="courses-grid">
                {enrollments.map((enr) => (
                  <div key={enr._id} className="course-card">
                    <div className="course-card-top">
                      <span className="course-code-tag">{enr.course?.courseCode}</span>
                      <span className="credits-tag">{enr.course?.credits} Credits</span>
                    </div>
                    <h4>{enr.course?.courseName}</h4>
                    <div className="course-card-meta">
                      <span>Department: {enr.course?.department}</span>
                      <span>Semester: {enr.course?.semester}</span>
                      <span>Academic Year: {enr.academicYear}</span>
                    </div>
                  </div>
                ))}
                {enrollments.length === 0 && (
                  <div className="empty-state">
                    <BookOpen size={36} />
                    <p>You have not been enrolled in any courses yet.</p>
                    <small>Your department administrator will enroll you in scheduled subjects.</small>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: MY ATTENDANCE */}
          {activeTab === 'attendance' && (
            <div className="dashboard-card">
              <div className="card-header-flex">
                <div>
                  <h3>Attendance Performance Tracker</h3>
                  <p>75% minimum attendance requirement compliance</p>
                </div>
                <div className="attendance-indicator">
                  <span className={`compliance-tag ${attendancePct >= 75 ? 'compliant' : 'warning'}`}>
                    {attendancePct >= 75 ? 'Attendance Satisfactory' : 'Below 75% Threshold'}
                  </span>
                </div>
              </div>

              {/* Attendance Progress Bar */}
              <div className="attendance-bar-container">
                <div className="attendance-bar-labels">
                  <span>Current Attendance Rate: <strong>{attendancePct}%</strong></span>
                  <span>{attendedClasses} attended / {totalClasses} classes</span>
                </div>
                <div className="progress-track">
                  <div
                    className={`progress-fill ${attendancePct >= 75 ? 'fill-good' : 'fill-bad'}`}
                    style={{ width: `${Math.min(attendancePct, 100)}%` }}
                  ></div>
                </div>
              </div>

              <div className="table-responsive mt-6">
                <h4>Chronological Attendance Log</h4>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Course Code</th>
                      <th>Course Name</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map((att) => (
                      <tr key={att._id}>
                        <td>{new Date(att.date).toLocaleDateString()}</td>
                        <td>
                          <span className="code-badge">{att.course?.courseCode}</span>
                        </td>
                        <td>{att.course?.courseName}</td>
                        <td>
                          <span className={`status-pill ${att.status}`}>
                            {att.status === 'present' ? (
                              <>
                                <CheckCircle2 size={14} /> Present
                              </>
                            ) : (
                              <>
                                <XCircle size={14} /> Absent
                              </>
                            )}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {attendance.length === 0 && (
                      <tr>
                        <td colSpan="4" className="text-center py-6 text-muted">
                          No attendance sessions logged for your courses yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: MY GRADES */}
          {activeTab === 'grades' && (
            <div className="dashboard-card">
              <div className="card-header-flex">
                <div>
                  <h3>Academic Transcript & Performance</h3>
                  <p>Scores for internal assessments and external examinations</p>
                </div>
                {grades.length > 0 && (
                  <div className="gpa-summary-badge">
                    <span>Overall Score: {totalMarksObtained} / {totalMaxMarks} ({overallPercentage}%)</span>
                    <span className="gpa-letter">{calculateGradeLetter(overallPercentage).letter}</span>
                  </div>
                )}
              </div>

              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Course Code</th>
                      <th>Course Name</th>
                      <th>Exam Type</th>
                      <th>Marks Scored</th>
                      <th>Max Marks</th>
                      <th>Percentage</th>
                      <th>Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grades.map((grd) => {
                      const pct = Math.round((grd.marksObtained / grd.maxMarks) * 100);
                      const { letter, color } = calculateGradeLetter(pct);
                      return (
                        <tr key={grd._id}>
                          <td>
                            <span className="code-badge">{grd.course?.courseCode}</span>
                          </td>
                          <td className="font-semibold">{grd.course?.courseName}</td>
                          <td>
                            <span className={`exam-pill ${grd.examType}`}>
                              {grd.examType === 'internal1' && 'Internal 1'}
                              {grd.examType === 'internal2' && 'Internal 2'}
                              {grd.examType === 'external' && 'External Exam'}
                            </span>
                          </td>
                          <td>
                            <strong>{grd.marksObtained}</strong>
                          </td>
                          <td>{grd.maxMarks}</td>
                          <td>{pct}%</td>
                          <td>
                            <span className={`grade-pill ${color}`}>{letter}</span>
                          </td>
                        </tr>
                      );
                    })}
                    {grades.length === 0 && (
                      <tr>
                        <td colSpan="7" className="text-center py-6 text-muted">
                          No grades recorded yet. Check back after your instructors publish marks.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
