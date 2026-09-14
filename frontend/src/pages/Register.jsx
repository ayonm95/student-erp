import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, Lock, Mail, User, Hash, Building2, BookOpen, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';

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

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'semester' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Manual client checks
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
      setError('Roll number is required.');
      return;
    }
    if (!formData.department.trim()) {
      setError('Department is required.');
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

  const autofillDemoStudent = () => {
    const randomId = Math.floor(100 + Math.random() * 900);
    setFormData({
      name: 'Priya Sharma',
      email: `priya${randomId}@erp.edu`,
      password: 'StudentPass@123',
      rollNumber: `CS2026${randomId}`,
      department: 'Computer Science',
      semester: 4,
    });
    setError('');
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card register-card">
        <div className="auth-header">
          <div className="auth-icon-badge">
            <GraduationCap size={32} />
          </div>
          <h1>Student Registration</h1>
          <p>Create your student account to enroll in courses, view attendance & check grades</p>
        </div>

        {error && (
          <div className="alert-box alert-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-grid-2">
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <div className="input-with-icon">
                <User size={18} className="input-icon" />
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="e.g. Priya Sharma"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-with-icon">
                <Mail size={18} className="input-icon" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="e.g. priya@erp.edu"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label htmlFor="password">Password (min 6 characters)</label>
              <div className="input-with-icon">
                <Lock size={18} className="input-icon" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Create a secure password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="rollNumber">Roll Number (Unique ID)</label>
              <div className="input-with-icon">
                <Hash size={18} className="input-icon" />
                <input
                  id="rollNumber"
                  name="rollNumber"
                  type="text"
                  placeholder="e.g. CS2026101"
                  value={formData.rollNumber}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label htmlFor="department">Department</label>
              <div className="input-with-icon">
                <Building2 size={18} className="input-icon" />
                <select
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  required
                >
                  <option value="Computer Science">Computer Science</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Electronics & Communication">Electronics & Communication</option>
                  <option value="Electrical Engineering">Electrical Engineering</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Civil Engineering">Civil Engineering</option>
                  <option value="Data Science & AI">Data Science & AI</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="semester">Current Semester (1-12)</label>
              <div className="input-with-icon">
                <BookOpen size={18} className="input-icon" />
                <input
                  id="semester"
                  name="semester"
                  type="number"
                  min="1"
                  max="12"
                  value={formData.semester}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          <button type="submit" className="btn-primary btn-block" disabled={loading}>
            {loading ? (
              <span className="btn-spinner-text">Creating Account...</span>
            ) : (
              <>
                <span>Complete Registration</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="demo-credentials-card">
          <div className="demo-title">
            <Sparkles size={16} />
            <span>Fast Testing Helper</span>
          </div>
          <button type="button" onClick={autofillDemoStudent} className="btn-outline-sm">
            <Sparkles size={14} />
            <span>Generate Sample Student Profile</span>
          </button>
        </div>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="auth-link">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
