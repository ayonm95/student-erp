import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import {
  Users,
  BookOpen,
  UserCheck,
  CalendarCheck,
  Award,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Search,
  Filter,
  RefreshCw,
  X,
} from 'lucide-react';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Data states
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [grades, setGrades] = useState([]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [modalType, setModalType] = useState(null); // 'createCourse', 'editCourse', 'editStudent', 'enrollStudent', 'markAttendance', 'editAttendance', 'enterGrade', 'editGrade'
  const [activeItem, setActiveItem] = useState(null);

  // Form states
  const [courseForm, setCourseForm] = useState({
    courseCode: '',
    courseName: '',
    credits: 3,
    semester: 1,
    department: 'Computer Science',
  });

  const [studentForm, setStudentForm] = useState({
    name: '',
    email: '',
    rollNumber: '',
    department: '',
    semester: 1,
  });

  const [enrollForm, setEnrollForm] = useState({
    student: '',
    course: '',
    academicYear: '2025-2026',
  });

  const [attendanceForm, setAttendanceForm] = useState({
    student: '',
    course: '',
    date: new Date().toISOString().split('T')[0],
    status: 'present',
  });

  const [gradeForm, setGradeForm] = useState({
    student: '',
    course: '',
    examType: 'internal1',
    marksObtained: 40,
    maxMarks: 50,
  });

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback({ type: '', message: '' });
    }, 4000);
  };

  // Fetch all administrative dataset
  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [stdRes, crsRes, enrRes, attRes, grdRes] = await Promise.all([
        axiosInstance.get('/students'),
        axiosInstance.get('/courses'),
        axiosInstance.get('/enrollment'),
        axiosInstance.get('/attendance'),
        axiosInstance.get('/grades'),
      ]);

      setStudents(stdRes.data.data || []);
      setCourses(crsRes.data.data || []);
      setEnrollments(enrRes.data.data || []);
      setAttendanceRecords(attRes.data.data || []);
      setGrades(grdRes.data.data || []);
    } catch (err) {
      showFeedback('error', err.response?.data?.message || 'Failed to load records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // ---------------- Handlers for Courses ----------------
  const handleCreateCourse = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const res = await axiosInstance.post('/courses', courseForm);
      setCourses((prev) => [...prev, res.data.data]);
      showFeedback('success', 'Course created successfully!');
      setModalType(null);
      setCourseForm({
        courseCode: '',
        courseName: '',
        credits: 3,
        semester: 1,
        department: 'Computer Science',
      });
    } catch (err) {
      showFeedback('error', err.response?.data?.message || 'Error creating course.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateCourse = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const res = await axiosInstance.put(`/courses/${activeItem._id}`, courseForm);
      setCourses((prev) => prev.map((c) => (c._id === activeItem._id ? res.data.data : c)));
      showFeedback('success', 'Course updated successfully!');
      setModalType(null);
    } catch (err) {
      showFeedback('error', err.response?.data?.message || 'Error updating course.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCourse = async (id) => {
    if (!window.confirm('Delete this course? All associated enrollments, attendance, and grades will also be removed.')) {
      return;
    }
    try {
      setActionLoading(true);
      await axiosInstance.delete(`/courses/${id}`);
      setCourses((prev) => prev.filter((c) => c._id !== id));
      setEnrollments((prev) => prev.filter((e) => e.course?._id !== id && e.course !== id));
      showFeedback('success', 'Course and associated records removed.');
    } catch (err) {
      showFeedback('error', err.response?.data?.message || 'Error deleting course.');
    } finally {
      setActionLoading(false);
    }
  };

  // ---------------- Handlers for Students ----------------
  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const res = await axiosInstance.put(`/students/${activeItem._id}`, studentForm);
      setStudents((prev) => prev.map((s) => (s._id === activeItem._id ? res.data.data : s)));
      showFeedback('success', 'Student profile updated successfully!');
      setModalType(null);
    } catch (err) {
      showFeedback('error', err.response?.data?.message || 'Error updating student.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteStudent = async (id) => {
    if (!window.confirm('Are you sure you want to delete this student and all linked records?')) {
      return;
    }
    try {
      setActionLoading(true);
      await axiosInstance.delete(`/students/${id}`);
      setStudents((prev) => prev.filter((s) => s._id !== id));
      setEnrollments((prev) => prev.filter((e) => e.student?._id !== id && e.student !== id));
      setAttendanceRecords((prev) => prev.filter((a) => a.student?._id !== id && a.student !== id));
      setGrades((prev) => prev.filter((g) => g.student?._id !== id && g.student !== id));
      showFeedback('success', 'Student deleted successfully.');
    } catch (err) {
      showFeedback('error', err.response?.data?.message || 'Error deleting student.');
    } finally {
      setActionLoading(false);
    }
  };

  // ---------------- Handlers for Enrollment ----------------
  const handleEnrollStudent = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const res = await axiosInstance.post('/enrollment', enrollForm);
      setEnrollments((prev) => [res.data.data, ...prev]);
      showFeedback('success', 'Student enrolled in course successfully!');
      setModalType(null);
      setEnrollForm({
        student: '',
        course: '',
        academicYear: '2025-2026',
      });
    } catch (err) {
      showFeedback('error', err.response?.data?.message || 'Error enrolling student.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnenroll = async (id) => {
    if (!window.confirm('Remove student from this course enrollment?')) return;
    try {
      setActionLoading(true);
      await axiosInstance.delete(`/enrollment/${id}`);
      setEnrollments((prev) => prev.filter((e) => e._id !== id));
      showFeedback('success', 'Enrollment removed.');
    } catch (err) {
      showFeedback('error', err.response?.data?.message || 'Error unenrolling student.');
    } finally {
      setActionLoading(false);
    }
  };

  // ---------------- Handlers for Attendance ----------------
  const handleMarkAttendance = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const res = await axiosInstance.post('/attendance', attendanceForm);
      setAttendanceRecords((prev) => [res.data.data, ...prev]);
      showFeedback('success', 'Attendance recorded successfully!');
      setModalType(null);
    } catch (err) {
      showFeedback('error', err.response?.data?.message || 'Error recording attendance.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateAttendance = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const res = await axiosInstance.put(`/attendance/${activeItem._id}`, {
        status: attendanceForm.status,
        date: attendanceForm.date,
      });
      setAttendanceRecords((prev) => prev.map((a) => (a._id === activeItem._id ? res.data.data : a)));
      showFeedback('success', 'Attendance corrected successfully!');
      setModalType(null);
    } catch (err) {
      showFeedback('error', err.response?.data?.message || 'Error updating attendance.');
    } finally {
      setActionLoading(false);
    }
  };

  // ---------------- Handlers for Grades ----------------
  const handleEnterGrade = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const res = await axiosInstance.post('/grades', gradeForm);
      setGrades((prev) => [res.data.data, ...prev]);
      showFeedback('success', 'Grade recorded successfully!');
      setModalType(null);
    } catch (err) {
      showFeedback('error', err.response?.data?.message || 'Error entering grade.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateGrade = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const res = await axiosInstance.put(`/grades/${activeItem._id}`, {
        examType: gradeForm.examType,
        marksObtained: gradeForm.marksObtained,
        maxMarks: gradeForm.maxMarks,
      });
      setGrades((prev) => prev.map((g) => (g._id === activeItem._id ? res.data.data : g)));
      showFeedback('success', 'Grade record updated successfully!');
      setModalType(null);
    } catch (err) {
      showFeedback('error', err.response?.data?.message || 'Error updating grade.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteGrade = async (id) => {
    if (!window.confirm('Delete this grade record?')) return;
    try {
      setActionLoading(true);
      await axiosInstance.delete(`/grades/${id}`);
      setGrades((prev) => prev.filter((g) => g._id !== id));
      showFeedback('success', 'Grade record deleted.');
    } catch (err) {
      showFeedback('error', err.response?.data?.message || 'Error deleting grade.');
    } finally {
      setActionLoading(false);
    }
  };

  // Calculation Metrics
  const totalAttendance = attendanceRecords.length;
  const presentCount = attendanceRecords.filter((a) => a.status === 'present').length;
  const attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;

  return (
    <div className="dashboard-layout">
      {/* Top Banner & Feedback */}
      {feedback.message && (
        <div className={`feedback-toast ${feedback.type}`}>
          {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{feedback.message}</span>
        </div>
      )}

      <div className="dashboard-header-card">
        <div className="header-info">
          <h2>Administrative Control Center</h2>
          <p>Complete authority to manage Students, Courses, Enrollments, Attendance & Grade Assessments</p>
        </div>
        <button onClick={fetchAllData} className="btn-refresh" title="Reload all dataset">
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
          <span>Sync Data</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="tab-navigation">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <TrendingUp size={16} />
          <span>Overview</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'students' ? 'active' : ''}`}
          onClick={() => setActiveTab('students')}
        >
          <Users size={16} />
          <span>Students ({students.length})</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'courses' ? 'active' : ''}`}
          onClick={() => setActiveTab('courses')}
        >
          <BookOpen size={16} />
          <span>Courses ({courses.length})</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'enrollment' ? 'active' : ''}`}
          onClick={() => setActiveTab('enrollment')}
        >
          <UserCheck size={16} />
          <span>Enrollments ({enrollments.length})</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'attendance' ? 'active' : ''}`}
          onClick={() => setActiveTab('attendance')}
        >
          <CalendarCheck size={16} />
          <span>Attendance ({attendanceRecords.length})</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'grades' ? 'active' : ''}`}
          onClick={() => setActiveTab('grades')}
        >
          <Award size={16} />
          <span>Grades & Marks ({grades.length})</span>
        </button>
      </div>

      {/* TAB CONTENT */}
      {loading ? (
        <div className="center-loader-screen">
          <div className="spinner"></div>
          <p>Fetching ERP records from cloud database...</p>
        </div>
      ) : (
        <div className="tab-content-area">
          {/* 1. OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="overview-grid">
              <div className="stat-card stat-students">
                <div className="stat-icon">
                  <Users size={28} />
                </div>
                <div className="stat-content">
                  <span className="stat-label">Total Registered Students</span>
                  <span className="stat-value">{students.length}</span>
                  <span className="stat-hint">Active student records</span>
                </div>
              </div>

              <div className="stat-card stat-courses">
                <div className="stat-icon">
                  <BookOpen size={28} />
                </div>
                <div className="stat-content">
                  <span className="stat-label">Active Courses</span>
                  <span className="stat-value">{courses.length}</span>
                  <span className="stat-hint">Curriculum offerings</span>
                </div>
              </div>

              <div className="stat-card stat-enrollments">
                <div className="stat-icon">
                  <UserCheck size={28} />
                </div>
                <div className="stat-content">
                  <span className="stat-label">Total Enrollments</span>
                  <span className="stat-value">{enrollments.length}</span>
                  <span className="stat-hint">Course seats occupied</span>
                </div>
              </div>

              <div className="stat-card stat-attendance">
                <div className="stat-icon">
                  <CalendarCheck size={28} />
                </div>
                <div className="stat-content">
                  <span className="stat-label">Attendance Rate</span>
                  <span className="stat-value">{attendanceRate}%</span>
                  <span className="stat-hint">{presentCount} present out of {totalAttendance} logs</span>
                </div>
              </div>

              {/* Quick Actions Card */}
              <div className="dashboard-card full-width quick-actions-panel">
                <h3>Quick Administrative Actions</h3>
                <div className="action-buttons-group">
                  <button
                    onClick={() => {
                      setCourseForm({
                        courseCode: '',
                        courseName: '',
                        credits: 4,
                        semester: 1,
                        department: 'Computer Science',
                      });
                      setModalType('createCourse');
                    }}
                    className="btn-action-tile"
                  >
                    <BookOpen size={20} />
                    <span>Add New Course</span>
                  </button>

                  <button
                    onClick={() => {
                      setEnrollForm({
                        student: students[0]?._id || '',
                        course: courses[0]?._id || '',
                        academicYear: '2025-2026',
                      });
                      setModalType('enrollStudent');
                    }}
                    className="btn-action-tile"
                    disabled={students.length === 0 || courses.length === 0}
                  >
                    <UserCheck size={20} />
                    <span>Enroll Student</span>
                  </button>

                  <button
                    onClick={() => {
                      setAttendanceForm({
                        student: students[0]?._id || '',
                        course: courses[0]?._id || '',
                        date: new Date().toISOString().split('T')[0],
                        status: 'present',
                      });
                      setModalType('markAttendance');
                    }}
                    className="btn-action-tile"
                    disabled={students.length === 0 || courses.length === 0}
                  >
                    <CalendarCheck size={20} />
                    <span>Mark Attendance</span>
                  </button>

                  <button
                    onClick={() => {
                      setGradeForm({
                        student: students[0]?._id || '',
                        course: courses[0]?._id || '',
                        examType: 'internal1',
                        marksObtained: 42,
                        maxMarks: 50,
                      });
                      setModalType('enterGrade');
                    }}
                    className="btn-action-tile"
                    disabled={students.length === 0 || courses.length === 0}
                  >
                    <Award size={20} />
                    <span>Record Exam Grade</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 2. STUDENTS TAB */}
          {activeTab === 'students' && (
            <div className="dashboard-card">
              <div className="card-header-flex">
                <div>
                  <h3>Student Registry</h3>
                  <p>View, update, or remove student profiles</p>
                </div>
                <div className="search-box">
                  <Search size={16} />
                  <input
                    type="text"
                    placeholder="Search by Name, Roll No, Dept..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Roll Number</th>
                      <th>Student Name</th>
                      <th>Email</th>
                      <th>Department</th>
                      <th>Semester</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students
                      .filter(
                        (s) =>
                          s.rollNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.userId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.department?.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((std) => (
                        <tr key={std._id}>
                          <td>
                            <span className="code-badge">{std.rollNumber}</span>
                          </td>
                          <td className="font-semibold">{std.userId?.name || 'N/A'}</td>
                          <td>{std.userId?.email || 'N/A'}</td>
                          <td>{std.department}</td>
                          <td>
                            <span className="tag-sem">Sem {std.semester}</span>
                          </td>
                          <td>
                            <div className="action-buttons-cell">
                              <button
                                onClick={() => {
                                  setActiveItem(std);
                                  setStudentForm({
                                    name: std.userId?.name || '',
                                    email: std.userId?.email || '',
                                    rollNumber: std.rollNumber,
                                    department: std.department,
                                    semester: std.semester,
                                  });
                                  setModalType('editStudent');
                                }}
                                className="btn-icon btn-edit"
                                title="Edit Student Profile"
                              >
                                <Edit2 size={15} />
                              </button>
                              <button
                                onClick={() => handleDeleteStudent(std._id)}
                                className="btn-icon btn-delete"
                                title="Delete Student"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    {students.length === 0 && (
                      <tr>
                        <td colSpan="6" className="text-center py-6 text-muted">
                          No students found. Students can register via the portal.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. COURSES TAB */}
          {activeTab === 'courses' && (
            <div className="dashboard-card">
              <div className="card-header-flex">
                <div>
                  <h3>Course Catalog</h3>
                  <p>Manage courses, credit weights, and curriculum mappings</p>
                </div>
                <button
                  onClick={() => {
                    setCourseForm({
                      courseCode: '',
                      courseName: '',
                      credits: 3,
                      semester: 1,
                      department: 'Computer Science',
                    });
                    setModalType('createCourse');
                  }}
                  className="btn-primary-sm"
                >
                  <Plus size={16} />
                  <span>Create Course</span>
                </button>
              </div>

              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Course Code</th>
                      <th>Course Name</th>
                      <th>Credits</th>
                      <th>Semester</th>
                      <th>Department</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses.map((course) => (
                      <tr key={course._id}>
                        <td>
                          <span className="code-badge">{course.courseCode}</span>
                        </td>
                        <td className="font-semibold">{course.courseName}</td>
                        <td>{course.credits} Credits</td>
                        <td>Semester {course.semester}</td>
                        <td>{course.department}</td>
                        <td>
                          <div className="action-buttons-cell">
                            <button
                              onClick={() => {
                                setActiveItem(course);
                                setCourseForm({
                                  courseCode: course.courseCode,
                                  courseName: course.courseName,
                                  credits: course.credits,
                                  semester: course.semester,
                                  department: course.department,
                                });
                                setModalType('editCourse');
                              }}
                              className="btn-icon btn-edit"
                              title="Edit Course"
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              onClick={() => handleDeleteCourse(course._id)}
                              className="btn-icon btn-delete"
                              title="Delete Course"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {courses.length === 0 && (
                      <tr>
                        <td colSpan="6" className="text-center py-6 text-muted">
                          No courses in catalog. Click "Create Course" to add one.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. ENROLLMENT TAB */}
          {activeTab === 'enrollment' && (
            <div className="dashboard-card">
              <div className="card-header-flex">
                <div>
                  <h3>Course Enrollments</h3>
                  <p>Assign students to courses with duplicate enrollment protection</p>
                </div>
                <button
                  onClick={() => {
                    setEnrollForm({
                      student: students[0]?._id || '',
                      course: courses[0]?._id || '',
                      academicYear: '2025-2026',
                    });
                    setModalType('enrollStudent');
                  }}
                  className="btn-primary-sm"
                  disabled={students.length === 0 || courses.length === 0}
                >
                  <Plus size={16} />
                  <span>Enroll Student</span>
                </button>
              </div>

              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Roll Number</th>
                      <th>Student Name</th>
                      <th>Course Code</th>
                      <th>Course Name</th>
                      <th>Academic Year</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrollments.map((enr) => (
                      <tr key={enr._id}>
                        <td>
                          <span className="code-badge">{enr.student?.rollNumber || 'N/A'}</span>
                        </td>
                        <td className="font-semibold">{enr.student?.userId?.name || 'N/A'}</td>
                        <td>
                          <span className="code-badge">{enr.course?.courseCode || 'N/A'}</span>
                        </td>
                        <td>{enr.course?.courseName || 'N/A'}</td>
                        <td>{enr.academicYear}</td>
                        <td>
                          <button
                            onClick={() => handleUnenroll(enr._id)}
                            className="btn-icon btn-delete"
                            title="Unenroll Student"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {enrollments.length === 0 && (
                      <tr>
                        <td colSpan="6" className="text-center py-6 text-muted">
                          No enrollments recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 5. ATTENDANCE TAB */}
          {activeTab === 'attendance' && (
            <div className="dashboard-card">
              <div className="card-header-flex">
                <div>
                  <h3>Attendance Records</h3>
                  <p>Daily session logging and attendance status management</p>
                </div>
                <button
                  onClick={() => {
                    setAttendanceForm({
                      student: students[0]?._id || '',
                      course: courses[0]?._id || '',
                      date: new Date().toISOString().split('T')[0],
                      status: 'present',
                    });
                    setModalType('markAttendance');
                  }}
                  className="btn-primary-sm"
                  disabled={students.length === 0 || courses.length === 0}
                >
                  <Plus size={16} />
                  <span>Mark Attendance</span>
                </button>
              </div>

              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Roll Number</th>
                      <th>Student Name</th>
                      <th>Course</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceRecords.map((rec) => (
                      <tr key={rec._id}>
                        <td>{new Date(rec.date).toLocaleDateString()}</td>
                        <td>
                          <span className="code-badge">{rec.student?.rollNumber || 'N/A'}</span>
                        </td>
                        <td className="font-semibold">{rec.student?.userId?.name || 'N/A'}</td>
                        <td>
                          {rec.course?.courseCode} - {rec.course?.courseName}
                        </td>
                        <td>
                          <span className={`status-pill ${rec.status}`}>
                            {rec.status.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => {
                              setActiveItem(rec);
                              setAttendanceForm({
                                student: rec.student?._id || '',
                                course: rec.course?._id || '',
                                date: new Date(rec.date).toISOString().split('T')[0],
                                status: rec.status,
                              });
                              setModalType('editAttendance');
                            }}
                            className="btn-icon btn-edit"
                            title="Correct Attendance Entry"
                          >
                            <Edit2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {attendanceRecords.length === 0 && (
                      <tr>
                        <td colSpan="6" className="text-center py-6 text-muted">
                          No attendance sessions logged.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 6. GRADES TAB */}
          {activeTab === 'grades' && (
            <div className="dashboard-card">
              <div className="card-header-flex">
                <div>
                  <h3>Grade Registry & Evaluations</h3>
                  <p>Assessment scores: Internal 1, Internal 2, and External Examinations</p>
                </div>
                <button
                  onClick={() => {
                    setGradeForm({
                      student: students[0]?._id || '',
                      course: courses[0]?._id || '',
                      examType: 'internal1',
                      marksObtained: 40,
                      maxMarks: 50,
                    });
                    setModalType('enterGrade');
                  }}
                  className="btn-primary-sm"
                  disabled={students.length === 0 || courses.length === 0}
                >
                  <Plus size={16} />
                  <span>Enter Grade</span>
                </button>
              </div>

              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Roll Number</th>
                      <th>Student Name</th>
                      <th>Course</th>
                      <th>Exam Type</th>
                      <th>Score</th>
                      <th>Percentage</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grades.map((grd) => {
                      const pct = Math.round((grd.marksObtained / grd.maxMarks) * 100);
                      return (
                        <tr key={grd._id}>
                          <td>
                            <span className="code-badge">{grd.student?.rollNumber || 'N/A'}</span>
                          </td>
                          <td className="font-semibold">{grd.student?.userId?.name || 'N/A'}</td>
                          <td>
                            {grd.course?.courseCode} - {grd.course?.courseName}
                          </td>
                          <td>
                            <span className={`exam-pill ${grd.examType}`}>
                              {grd.examType.toUpperCase()}
                            </span>
                          </td>
                          <td>
                            <strong>{grd.marksObtained}</strong> / {grd.maxMarks}
                          </td>
                          <td>
                            <span className={`score-badge ${pct >= 50 ? 'pass' : 'fail'}`}>
                              {pct}%
                            </span>
                          </td>
                          <td>
                            <div className="action-buttons-cell">
                              <button
                                onClick={() => {
                                  setActiveItem(grd);
                                  setGradeForm({
                                    student: grd.student?._id || '',
                                    course: grd.course?._id || '',
                                    examType: grd.examType,
                                    marksObtained: grd.marksObtained,
                                    maxMarks: grd.maxMarks,
                                  });
                                  setModalType('editGrade');
                                }}
                                className="btn-icon btn-edit"
                                title="Update Grade"
                              >
                                <Edit2 size={15} />
                              </button>
                              <button
                                onClick={() => handleDeleteGrade(grd._id)}
                                className="btn-icon btn-delete"
                                title="Delete Grade"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {grades.length === 0 && (
                      <tr>
                        <td colSpan="7" className="text-center py-6 text-muted">
                          No grades recorded yet.
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

      {/* ---------------- MODAL OVERLAYS ---------------- */}
      {modalType && (
        <div className="modal-backdrop" onClick={() => setModalType(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {modalType === 'createCourse' && 'Add New Course'}
                {modalType === 'editCourse' && `Edit Course: ${activeItem?.courseCode}`}
                {modalType === 'editStudent' && `Edit Student: ${activeItem?.rollNumber}`}
                {modalType === 'enrollStudent' && 'Enroll Student into Course'}
                {modalType === 'markAttendance' && 'Record Attendance'}
                {modalType === 'editAttendance' && 'Correct Attendance Record'}
                {modalType === 'enterGrade' && 'Enter Exam Grade'}
                {modalType === 'editGrade' && 'Update Grade Entry'}
              </h3>
              <button onClick={() => setModalType(null)} className="btn-close-modal">
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              {/* Course Form Modal */}
              {(modalType === 'createCourse' || modalType === 'editCourse') && (
                <form onSubmit={modalType === 'createCourse' ? handleCreateCourse : handleUpdateCourse}>
                  <div className="form-group">
                    <label>Course Code</label>
                    <input
                      type="text"
                      placeholder="e.g. CS501"
                      value={courseForm.courseCode}
                      onChange={(e) => setCourseForm({ ...courseForm, courseCode: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Course Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Operating Systems"
                      value={courseForm.courseName}
                      onChange={(e) => setCourseForm({ ...courseForm, courseName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-grid-2">
                    <div className="form-group">
                      <label>Credits (1-10)</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={courseForm.credits}
                        onChange={(e) => setCourseForm({ ...courseForm, credits: Number(e.target.value) })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Semester (1-12)</label>
                      <input
                        type="number"
                        min="1"
                        max="12"
                        value={courseForm.semester}
                        onChange={(e) => setCourseForm({ ...courseForm, semester: Number(e.target.value) })}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Department</label>
                    <input
                      type="text"
                      placeholder="e.g. Computer Science"
                      value={courseForm.department}
                      onChange={(e) => setCourseForm({ ...courseForm, department: e.target.value })}
                      required
                    />
                  </div>
                  <div className="modal-actions">
                    <button type="button" onClick={() => setModalType(null)} className="btn-secondary">
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary" disabled={actionLoading}>
                      {actionLoading ? 'Saving...' : modalType === 'createCourse' ? 'Create Course' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              )}

              {/* Student Edit Modal */}
              {modalType === 'editStudent' && (
                <form onSubmit={handleUpdateStudent}>
                  <div className="form-group">
                    <label>Student Full Name</label>
                    <input
                      type="text"
                      value={studentForm.name}
                      onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      value={studentForm.email}
                      onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-grid-2">
                    <div className="form-group">
                      <label>Roll Number</label>
                      <input
                        type="text"
                        value={studentForm.rollNumber}
                        onChange={(e) => setStudentForm({ ...studentForm, rollNumber: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Semester</label>
                      <input
                        type="number"
                        min="1"
                        max="12"
                        value={studentForm.semester}
                        onChange={(e) => setStudentForm({ ...studentForm, semester: Number(e.target.value) })}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Department</label>
                    <input
                      type="text"
                      value={studentForm.department}
                      onChange={(e) => setStudentForm({ ...studentForm, department: e.target.value })}
                      required
                    />
                  </div>
                  <div className="modal-actions">
                    <button type="button" onClick={() => setModalType(null)} className="btn-secondary">
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary" disabled={actionLoading}>
                      {actionLoading ? 'Updating...' : 'Save Profile Changes'}
                    </button>
                  </div>
                </form>
              )}

              {/* Enrollment Modal */}
              {modalType === 'enrollStudent' && (
                <form onSubmit={handleEnrollStudent}>
                  <div className="form-group">
                    <label>Select Student</label>
                    <select
                      value={enrollForm.student}
                      onChange={(e) => setEnrollForm({ ...enrollForm, student: e.target.value })}
                      required
                    >
                      <option value="">-- Choose Student --</option>
                      {students.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.rollNumber} - {s.userId?.name} ({s.department})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Select Course</label>
                    <select
                      value={enrollForm.course}
                      onChange={(e) => setEnrollForm({ ...enrollForm, course: e.target.value })}
                      required
                    >
                      <option value="">-- Choose Course --</option>
                      {courses.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.courseCode} - {c.courseName} ({c.credits} cr)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Academic Year</label>
                    <input
                      type="text"
                      placeholder="e.g. 2025-2026"
                      value={enrollForm.academicYear}
                      onChange={(e) => setEnrollForm({ ...enrollForm, academicYear: e.target.value })}
                      required
                    />
                  </div>
                  <div className="modal-actions">
                    <button type="button" onClick={() => setModalType(null)} className="btn-secondary">
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary" disabled={actionLoading}>
                      {actionLoading ? 'Enrolling...' : 'Confirm Enrollment'}
                    </button>
                  </div>
                </form>
              )}

              {/* Mark Attendance Modal */}
              {modalType === 'markAttendance' && (
                <form onSubmit={handleMarkAttendance}>
                  <div className="form-group">
                    <label>Select Student</label>
                    <select
                      value={attendanceForm.student}
                      onChange={(e) => setAttendanceForm({ ...attendanceForm, student: e.target.value })}
                      required
                    >
                      <option value="">-- Choose Student --</option>
                      {students.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.rollNumber} - {s.userId?.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Select Course</label>
                    <select
                      value={attendanceForm.course}
                      onChange={(e) => setAttendanceForm({ ...attendanceForm, course: e.target.value })}
                      required
                    >
                      <option value="">-- Choose Course --</option>
                      {courses.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.courseCode} - {c.courseName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-grid-2">
                    <div className="form-group">
                      <label>Date</label>
                      <input
                        type="date"
                        value={attendanceForm.date}
                        onChange={(e) => setAttendanceForm({ ...attendanceForm, date: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Status</label>
                      <select
                        value={attendanceForm.status}
                        onChange={(e) => setAttendanceForm({ ...attendanceForm, status: e.target.value })}
                        required
                      >
                        <option value="present">Present</option>
                        <option value="absent">Absent</option>
                      </select>
                    </div>
                  </div>
                  <div className="modal-actions">
                    <button type="button" onClick={() => setModalType(null)} className="btn-secondary">
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary" disabled={actionLoading}>
                      {actionLoading ? 'Recording...' : 'Mark Attendance'}
                    </button>
                  </div>
                </form>
              )}

              {/* Edit Attendance Modal */}
              {modalType === 'editAttendance' && (
                <form onSubmit={handleUpdateAttendance}>
                  <p className="modal-subtext">
                    Correcting attendance record for <strong>{activeItem?.student?.userId?.name}</strong> in{' '}
                    <strong>{activeItem?.course?.courseCode}</strong>.
                  </p>
                  <div className="form-grid-2">
                    <div className="form-group">
                      <label>Session Date</label>
                      <input
                        type="date"
                        value={attendanceForm.date}
                        onChange={(e) => setAttendanceForm({ ...attendanceForm, date: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Status</label>
                      <select
                        value={attendanceForm.status}
                        onChange={(e) => setAttendanceForm({ ...attendanceForm, status: e.target.value })}
                        required
                      >
                        <option value="present">Present</option>
                        <option value="absent">Absent</option>
                      </select>
                    </div>
                  </div>
                  <div className="modal-actions">
                    <button type="button" onClick={() => setModalType(null)} className="btn-secondary">
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary" disabled={actionLoading}>
                      {actionLoading ? 'Updating...' : 'Save Correction'}
                    </button>
                  </div>
                </form>
              )}

              {/* Enter Grade / Edit Grade Modal */}
              {(modalType === 'enterGrade' || modalType === 'editGrade') && (
                <form onSubmit={modalType === 'enterGrade' ? handleEnterGrade : handleUpdateGrade}>
                  {modalType === 'enterGrade' && (
                    <>
                      <div className="form-group">
                        <label>Student</label>
                        <select
                          value={gradeForm.student}
                          onChange={(e) => setGradeForm({ ...gradeForm, student: e.target.value })}
                          required
                        >
                          <option value="">-- Choose Student --</option>
                          {students.map((s) => (
                            <option key={s._id} value={s._id}>
                              {s.rollNumber} - {s.userId?.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Course</label>
                        <select
                          value={gradeForm.course}
                          onChange={(e) => setGradeForm({ ...gradeForm, course: e.target.value })}
                          required
                        >
                          <option value="">-- Choose Course --</option>
                          {courses.map((c) => (
                            <option key={c._id} value={c._id}>
                              {c.courseCode} - {c.courseName}
                            </option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}

                  <div className="form-group">
                    <label>Examination Type</label>
                    <select
                      value={gradeForm.examType}
                      onChange={(e) => setGradeForm({ ...gradeForm, examType: e.target.value })}
                      required
                    >
                      <option value="internal1">Internal Examination 1</option>
                      <option value="internal2">Internal Examination 2</option>
                      <option value="external">External End-Semester Exam</option>
                    </select>
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label>Marks Obtained</label>
                      <input
                        type="number"
                        min="0"
                        value={gradeForm.marksObtained}
                        onChange={(e) => setGradeForm({ ...gradeForm, marksObtained: Number(e.target.value) })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Maximum Marks</label>
                      <input
                        type="number"
                        min="1"
                        value={gradeForm.maxMarks}
                        onChange={(e) => setGradeForm({ ...gradeForm, maxMarks: Number(e.target.value) })}
                        required
                      />
                    </div>
                  </div>

                  <div className="modal-actions">
                    <button type="button" onClick={() => setModalType(null)} className="btn-secondary">
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary" disabled={actionLoading}>
                      {actionLoading ? 'Saving...' : modalType === 'enterGrade' ? 'Submit Grade' : 'Update Grade'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
