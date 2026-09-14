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
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  PlusCircle,
  Trash2,
  Search,
  Compass,
  Check,
} from 'lucide-react';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', text: '' }

  const [profile, setProfile] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [grades, setGrades] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);

  // Catalog filtering states
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogDept, setCatalogDept] = useState('ALL');
  const [enrollingCourseId, setEnrollingCourseId] = useState(null);
  const [droppingEnrollmentId, setDroppingEnrollmentId] = useState(null);

  const studentId = user?.studentId;

  const showFeedback = (type, text) => {
    setFeedback({ type, text });
    setTimeout(() => {
      setFeedback(null);
    }, 6000);
  };

  const fetchStudentData = async () => {
    if (!studentId) {
      setError('Student profile ID could not be identified for this account.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      const [profRes, enrRes, attRes, grdRes, coursesRes] = await Promise.all([
        axiosInstance.get(`/students/${studentId}`),
        axiosInstance.get(`/enrollment/student/${studentId}`),
        axiosInstance.get(`/attendance/student/${studentId}`),
        axiosInstance.get(`/grades/student/${studentId}`),
        axiosInstance.get('/courses'),
      ]);

      setProfile(profRes.data.data);
      setEnrollments(enrRes.data.data || []);
      setAttendance(attRes.data.data || []);
      setGrades(grdRes.data.data || []);
      setAvailableCourses(coursesRes.data.data || []);
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

  // Self-Enrollment handler
  const handleSelfEnroll = async (course) => {
    try {
      setEnrollingCourseId(course._id);
      const res = await axiosInstance.post('/enrollment', {
        course: course._id,
      });

      if (res.data.success) {
        showFeedback('success', `Successfully enrolled in ${course.courseCode} - ${course.courseName}!`);
        // Refresh enrollments list
        const enrRes = await axiosInstance.get(`/enrollment/student/${studentId}`);
        setEnrollments(enrRes.data.data || []);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to enroll in course.';
      showFeedback('error', msg);
    } finally {
      setEnrollingCourseId(null);
    }
  };

  // Self-Drop handler
  const handleDropCourse = async (enr) => {
    const courseCode = enr.course?.courseCode || 'this course';
    const confirmDrop = window.confirm(
      `Are you sure you want to drop ${courseCode}? You will be removed from this subject roster.`
    );
    if (!confirmDrop) return;

    try {
      setDroppingEnrollmentId(enr._id);
      const res = await axiosInstance.delete(`/enrollment/${enr._id}`);
      if (res.data.success) {
        showFeedback('success', `Successfully dropped course ${courseCode}.`);
        setEnrollments((prev) => prev.filter((e) => e._id !== enr._id));
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to unenroll from course.';
      showFeedback('error', msg);
    } finally {
      setDroppingEnrollmentId(null);
    }
  };

  // Set of enrolled course IDs
  const enrolledCourseIds = new Set(enrollments.map((e) => e.course?._id).filter(Boolean));

  // Filtered Course Catalog
  const filteredCourses = availableCourses.filter((c) => {
    const matchesSearch =
      c.courseCode.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      c.courseName.toLowerCase().includes(catalogSearch.toLowerCase());
    const matchesDept = catalogDept === 'ALL' || c.department === catalogDept;
    return matchesSearch && matchesDept;
  });

  const uniqueDepartments = Array.from(new Set(availableCourses.map((c) => c.department).filter(Boolean)));

  return (
    <div className="dashboard-layout">
      {/* Student Top Header Card */}
      <header className="dashboard-header-card student-banner">
        <div className="header-info">
          <h2>Welcome back, {user?.name || 'Student'}</h2>
          <p>
            Department of {profile?.department || user?.department} • Semester {profile?.semester || user?.semester} • Roll No:{' '}
            <span className="code-badge">{profile?.rollNumber || user?.rollNumber}</span>
          </p>
        </div>
        <button onClick={fetchStudentData} className="btn-refresh" title="Refresh records" aria-label="Refresh records">
          <RefreshCw size={16} className={loading ? 'spin' : ''} aria-hidden="true" />
          <span>Sync</span>
        </button>
      </header>

      {/* Global Toast / Feedback Alerts */}
      {feedback && (
        <div
          className={`alert-box ${feedback.type === 'success' ? 'alert-success' : 'alert-error'} slide-down`}
          role="alert"
          aria-live="assertive"
        >
          {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{feedback.text}</span>
        </div>
      )}

      {error && (
        <div className="alert-box alert-error" role="alert" aria-live="assertive">
          <AlertCircle size={18} aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <nav className="tab-navigation" role="tablist" aria-label="Student Portal Sections">
        <button
          role="tab"
          aria-selected={activeTab === 'profile'}
          className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <User size={16} aria-hidden="true" />
          <span>My Profile</span>
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'courses'}
          className={`tab-btn ${activeTab === 'courses' ? 'active' : ''}`}
          onClick={() => setActiveTab('courses')}
        >
          <BookOpen size={16} aria-hidden="true" />
          <span>My Enrolled Courses ({enrollments.length})</span>
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'catalog'}
          className={`tab-btn ${activeTab === 'catalog' ? 'active' : ''}`}
          onClick={() => setActiveTab('catalog')}
        >
          <Compass size={16} aria-hidden="true" />
          <span>Course Catalog & Self-Enroll</span>
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'attendance'}
          className={`tab-btn ${activeTab === 'attendance' ? 'active' : ''}`}
          onClick={() => setActiveTab('attendance')}
        >
          <CalendarCheck size={16} aria-hidden="true" />
          <span>My Attendance ({attendancePct}%)</span>
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'grades'}
          className={`tab-btn ${activeTab === 'grades' ? 'active' : ''}`}
          onClick={() => setActiveTab('grades')}
        >
          <Award size={16} aria-hidden="true" />
          <span>Report Card & Grades</span>
        </button>
      </nav>

      {/* Main Tab Views */}
      {loading ? (
        <div className="center-loader-screen" role="status">
          <div className="spinner" aria-hidden="true"></div>
          <p>Retrieving your academic records...</p>
        </div>
      ) : (
        <main className="tab-content-area">
          {/* TAB 1: PROFILE */}
          {activeTab === 'profile' && (
            <div className="profile-grid">
              <div className="dashboard-card profile-details-card">
                <div className="profile-avatar-large" aria-hidden="true">
                  <GraduationCap size={48} />
                </div>
                <h3>{profile?.userId?.name || user?.name}</h3>
                <span className="profile-badge-student">Enrolled Scholar</span>

                <div className="profile-meta-list">
                  <div className="profile-meta-item">
                    <span className="meta-label">
                      <Hash size={16} aria-hidden="true" /> Roll Number:
                    </span>
                    <strong className="code-badge">{profile?.rollNumber}</strong>
                  </div>
                  <div className="profile-meta-item">
                    <span className="meta-label">
                      <Mail size={16} aria-hidden="true" /> Email:
                    </span>
                    <strong>{profile?.userId?.email || user?.email}</strong>
                  </div>
                  <div className="profile-meta-item">
                    <span className="meta-label">
                      <Building2 size={16} aria-hidden="true" /> Department:
                    </span>
                    <strong>{profile?.department}</strong>
                  </div>
                  <div className="profile-meta-item">
                    <span className="meta-label">
                      <BookOpen size={16} aria-hidden="true" /> Semester:
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
                      {attendancePct >= 75 ? 'Safe (≥75% req)' : 'Shortage Alert (<75%)'}
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
                    <strong>Privacy & Integrity Guaranteed:</strong> This portal enforces identity ownership at the database and middleware layers. You can only access your own profile, attendance, and exam scores.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MY ENROLLED COURSES */}
          {activeTab === 'courses' && (
            <div className="dashboard-card">
              <div className="card-header-flex">
                <div>
                  <h3>My Enrolled Courses</h3>
                  <p>Current academic term enrolled subjects and credit weights</p>
                </div>
                <div className="header-actions-flex">
                  <div className="credits-badge">
                    Total Credits: {enrollments.reduce((acc, e) => acc + (e.course?.credits || 0), 0)}
                  </div>
                  <button
                    onClick={() => setActiveTab('catalog')}
                    className="btn-primary-sm"
                    aria-label="Browse Course Catalog"
                  >
                    <PlusCircle size={15} aria-hidden="true" />
                    <span>Browse & Enroll</span>
                  </button>
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
                    <div className="course-card-footer">
                      <button
                        type="button"
                        onClick={() => handleDropCourse(enr)}
                        disabled={droppingEnrollmentId === enr._id}
                        className="btn-outline-danger-sm"
                        title="Drop this course if no attendance or grade marks exist"
                        aria-label={`Drop course ${enr.course?.courseCode}`}
                      >
                        <Trash2 size={13} aria-hidden="true" />
                        <span>{droppingEnrollmentId === enr._id ? 'Dropping...' : 'Drop Course'}</span>
                      </button>
                    </div>
                  </div>
                ))}
                {enrollments.length === 0 && (
                  <div className="empty-state">
                    <BookOpen size={36} aria-hidden="true" />
                    <p>You have not enrolled in any courses yet.</p>
                    <small>Click "Browse & Enroll" to select and self-enroll in university courses.</small>
                    <button
                      onClick={() => setActiveTab('catalog')}
                      className="btn-primary-sm mt-3"
                    >
                      <Compass size={15} />
                      <span>Explore Open Courses</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: COURSE CATALOG & SELF-ENROLLMENT */}
          {activeTab === 'catalog' && (
            <div className="dashboard-card">
              <div className="card-header-flex">
                <div>
                  <h3>University Course Catalog & Self-Enrollment</h3>
                  <p>Browse active courses across all departments and self-enroll directly</p>
                </div>
                <div className="credits-badge">
                  Available Subjects: {availableCourses.length}
                </div>
              </div>

              {/* Filter controls */}
              <div className="catalog-filters-bar">
                <div className="search-input-wrapper">
                  <Search size={16} className="search-icon" aria-hidden="true" />
                  <input
                    type="text"
                    placeholder="Search by course code or subject title..."
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    aria-label="Search courses"
                  />
                </div>
                <div className="select-dept-wrapper">
                  <select
                    value={catalogDept}
                    onChange={(e) => setCatalogDept(e.target.value)}
                    aria-label="Filter by department"
                  >
                    <option value="ALL">All Departments ({availableCourses.length})</option>
                    {uniqueDepartments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Course Catalog Grid */}
              <div className="courses-grid mt-4">
                {filteredCourses.map((course) => {
                  const isEnrolled = enrolledCourseIds.has(course._id);
                  const isProcessing = enrollingCourseId === course._id;

                  return (
                    <div key={course._id} className={`course-card ${isEnrolled ? 'course-card-enrolled' : ''}`}>
                      <div className="course-card-top">
                        <span className="course-code-tag">{course.courseCode}</span>
                        <span className="credits-tag">{course.credits} Credits</span>
                      </div>
                      <h4>{course.courseName}</h4>
                      <div className="course-card-meta">
                        <span>Department: {course.department}</span>
                        <span>Semester: {course.semester}</span>
                      </div>

                      <div className="course-card-footer">
                        {isEnrolled ? (
                          <span className="status-pill present" title="You are currently enrolled in this subject">
                            <Check size={14} aria-hidden="true" />
                            Enrolled
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSelfEnroll(course)}
                            disabled={isProcessing}
                            className="btn-primary-sm"
                            aria-label={`Enroll in ${course.courseCode} ${course.courseName}`}
                          >
                            <PlusCircle size={14} aria-hidden="true" />
                            <span>{isProcessing ? 'Enrolling...' : 'Enroll in Course'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {filteredCourses.length === 0 && (
                  <div className="empty-state">
                    <Search size={36} aria-hidden="true" />
                    <p>No courses match your filter criteria.</p>
                    <small>Try clearing your search query or selecting "All Departments".</small>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: MY ATTENDANCE */}
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
                  <span>
                    Current Attendance Rate: <strong>{attendancePct}%</strong>
                  </span>
                  <span>
                    {attendedClasses} attended / {totalClasses} classes
                  </span>
                </div>
                <div className="progress-track" role="progressbar" aria-valuenow={attendancePct} aria-valuemin="0" aria-valuemax="100">
                  <div
                    className={`progress-fill ${attendancePct >= 75 ? 'fill-good' : 'fill-bad'}`}
                    style={{ width: `${Math.min(attendancePct, 100)}%` }}
                  ></div>
                </div>
              </div>

              <div className="table-responsive mt-6">
                <h4>Chronological Attendance Log</h4>
                <table className="custom-table" aria-label="Student Attendance Records">
                  <thead>
                    <tr>
                      <th scope="col">Date</th>
                      <th scope="col">Course Code</th>
                      <th scope="col">Course Name</th>
                      <th scope="col">Status</th>
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
                                <CheckCircle2 size={14} aria-hidden="true" /> Present
                              </>
                            ) : (
                              <>
                                <XCircle size={14} aria-hidden="true" /> Absent
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

          {/* TAB 5: MY GRADES */}
          {activeTab === 'grades' && (
            <div className="dashboard-card">
              <div className="card-header-flex">
                <div>
                  <h3>Academic Transcript & Performance</h3>
                  <p>Scores for internal assessments and external examinations</p>
                </div>
                {grades.length > 0 && (
                  <div className="gpa-summary-badge">
                    <span>
                      Overall Score: {totalMarksObtained} / {totalMaxMarks} ({overallPercentage}%)
                    </span>
                    <span className="gpa-letter">{calculateGradeLetter(overallPercentage).letter}</span>
                  </div>
                )}
              </div>

              <div className="table-responsive">
                <table className="custom-table" aria-label="Student Grade Transcript">
                  <thead>
                    <tr>
                      <th scope="col">Course Code</th>
                      <th scope="col">Course Name</th>
                      <th scope="col">Exam Type</th>
                      <th scope="col">Marks Scored</th>
                      <th scope="col">Max Marks</th>
                      <th scope="col">Percentage</th>
                      <th scope="col">Grade</th>
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
        </main>
      )}
    </div>
  );
};

export default StudentDashboard;
