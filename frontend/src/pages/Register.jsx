import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import {
  GraduationCap,
  Lock,
  Mail,
  User,
  Hash,
  Building2,
  BookOpen,
  ArrowRight,
  AlertCircle,
  Sparkles,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    rollNumber: '',
    department: 'Computer Science',
    semester: 4,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rollLoading, setRollLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  // Fetch the next systematic sequential roll number whenever department changes
  const fetchNextRollNumber = async (dept) => {
    try {
      setRollLoading(true);
      const res = await axiosInstance.get(`/auth/next-roll-number?department=${encodeURIComponent(dept)}`);
      if (res.data.success && res.data.data?.rollNumber) {
        setFormData((prev) => ({
          ...prev,
          rollNumber: res.data.data.rollNumber,
        }));
      }
    } catch (err) {
      console.error('Failed to fetch sequential roll number:', err);
    } finally {
      setRollLoading(false);
    }
  };

  useEffect(() => {
    fetchNextRollNumber(formData.department);
  }, [formData.department]);

  // Digits-only keydown filter for numeric inputs
  const handleDigitsOnlyKeyDown = (e) => {
    const navigationKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight'];
    if (navigationKeys.includes(e.key) || e.ctrlKey || e.metaKey) {
      return;
    }
    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'semester') {
      const cleanVal = value.replace(/\D/g, '');
      const num = cleanVal === '' ? '' : Math.min(Math.max(Number(cleanVal), 1), 12);
      setFormData((prev) => ({ ...prev, semester: num }));
      return;
    }
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Manual validation
    if (!formData.name.trim()) {
      setError('Full Name is required.');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError('A valid email address is required.');
      return;
    }
    if (!formData.password || formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (!formData.rollNumber.trim()) {
      setError('Roll number could not be generated. Please select your department.');
      return;
    }
    if (!formData.department.trim()) {
      setError('Department is required.');
      return;
    }
    if (!formData.semester || formData.semester < 1 || formData.semester > 12) {
      setError('Semester must be a valid number between 1 and 12.');
      return;
    }

    try {
      setLoading(true);
      await register(formData);
      navigate('/student');
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const autofillDemoStudent = async () => {
    const rand = Math.floor(100 + Math.random() * 900);
    const demoEmail = `student${rand}@erp.edu`;
    const demoDept = 'Computer Science';
    setFormData((prev) => ({
      ...prev,
      name: 'Priya Sharma',
      email: demoEmail,
      password: 'StudentPass@123',
      department: demoDept,
      semester: 4,
    }));
    await fetchNextRollNumber(demoDept);
    setError('');
  };

  return (
    <main className="auth-page-container">
      <div className="auth-card register-card" role="region" aria-labelledby="register-heading">
        <header className="auth-header">
          <div className="auth-icon-badge" aria-hidden="true">
            <GraduationCap size={32} />
          </div>
          <h1 id="register-heading">Student Registration</h1>
          <p>Create your student account to enroll in courses, track attendance & check academic marks</p>
        </header>

        {error && (
          <div className="alert-box alert-error" role="alert" aria-live="assertive">
            <AlertCircle size={18} aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="form-grid-2">
            <div className="form-group">
              <label htmlFor="reg-name">
                Full Name <span className="text-danger" aria-hidden="true">*</span>
              </label>
              <div className="input-with-icon">
                <User size={18} className="input-icon" aria-hidden="true" />
                <input
                  id="reg-name"
                  name="name"
                  type="text"
                  placeholder="e.g. Priya Sharma"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  aria-required="true"
                  autoComplete="name"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="reg-email">
                Email Address <span className="text-danger" aria-hidden="true">*</span>
              </label>
              <div className="input-with-icon">
                <Mail size={18} className="input-icon" aria-hidden="true" />
                <input
                  id="reg-email"
                  name="email"
                  type="email"
                  placeholder="e.g. priya@erp.edu"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  aria-required="true"
                  autoComplete="email"
                />
              </div>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label htmlFor="reg-password">
                Password <span className="text-danger" aria-hidden="true">* (min 6 characters)</span>
              </label>
              <div className="input-with-icon">
                <Lock size={18} className="input-icon" aria-hidden="true" />
                <input
                  id="reg-password"
                  name="password"
                  type="password"
                  placeholder="Create a secure password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  aria-required="true"
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className="form-group">
              <div className="label-with-hint">
                <label htmlFor="reg-rollNumber">
                  Roll Number <span className="text-danger" aria-hidden="true">*</span>
                </label>
                <span className="badge-sequence" title="Systematically auto-calculated">
                  <CheckCircle2 size={12} aria-hidden="true" />
                  Auto-Sequenced
                </span>
              </div>
              <div className="input-with-icon">
                <Hash size={18} className="input-icon" aria-hidden="true" />
                <input
                  id="reg-rollNumber"
                  name="rollNumber"
                  type="text"
                  value={formData.rollNumber}
                  readOnly
                  aria-readonly="true"
                  placeholder={rollLoading ? 'Generating...' : 'e.g. CS2026001'}
                  className="input-readonly"
                  title="Roll number is systematically generated based on Department + Admission Year + Sequence Counter"
                />
                <button
                  type="button"
                  onClick={() => fetchNextRollNumber(formData.department)}
                  className="input-inline-btn"
                  title="Refresh sequential roll number"
                  aria-label="Refresh sequential roll number"
                >
                  <RefreshCw size={14} className={rollLoading ? 'spin' : ''} aria-hidden="true" />
                </button>
              </div>
              <small className="field-hint">
                System format: [DeptCode][Year][3-digit Sequence] (e.g. CS2026001)
              </small>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label htmlFor="reg-department">
                Department <span className="text-danger" aria-hidden="true">*</span>
              </label>
              <div className="input-with-icon">
                <Building2 size={18} className="input-icon" aria-hidden="true" />
                <select
                  id="reg-department"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  required
                  aria-required="true"
                >
                  <option value="Computer Science">Computer Science (CS)</option>
                  <option value="Information Technology">Information Technology (IT)</option>
                  <option value="Electronics & Communication">Electronics & Communication (EC)</option>
                  <option value="Electrical Engineering">Electrical Engineering (EE)</option>
                  <option value="Mechanical Engineering">Mechanical Engineering (ME)</option>
                  <option value="Civil Engineering">Civil Engineering (CE)</option>
                  <option value="Data Science & AI">Data Science & AI (DS)</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="reg-semester">
                Current Semester <span className="text-danger" aria-hidden="true">* (1 to 12 digits only)</span>
              </label>
              <div className="input-with-icon">
                <BookOpen size={18} className="input-icon" aria-hidden="true" />
                <input
                  id="reg-semester"
                  name="semester"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={formData.semester}
                  onKeyDown={handleDigitsOnlyKeyDown}
                  onChange={handleChange}
                  placeholder="1-12"
                  required
                  aria-required="true"
                />
              </div>
              <small className="field-hint">Only numeric digits allowed (1 to 12)</small>
            </div>
          </div>

          <button type="submit" className="btn-primary btn-block" disabled={loading}>
            {loading ? (
              <span className="btn-spinner-text">Creating Academic Account...</span>
            ) : (
              <>
                <span>Complete Registration</span>
                <ArrowRight size={18} aria-hidden="true" />
              </>
            )}
          </button>
        </form>

        <section className="demo-credentials-card" aria-label="Testing helper">
          <div className="demo-title">
            <Sparkles size={16} aria-hidden="true" />
            <span>Fast Testing Helper</span>
          </div>
          <button type="button" onClick={autofillDemoStudent} className="btn-outline-sm">
            <Sparkles size={14} aria-hidden="true" />
            <span>Autofill Sample Student Profile</span>
          </button>
        </section>

        <footer className="auth-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="auth-link">
              Sign in here
            </Link>
          </p>
        </footer>
      </div>
    </main>
  );
};

export default Register;
