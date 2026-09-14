import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, LogOut, ShieldCheck, UserCheck, Sparkles } from 'lucide-react';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="navbar-container">
      <div className="navbar-content">
        <div className="navbar-brand" onClick={() => navigate(user?.role === 'admin' ? '/admin' : '/student')}>
          <div className="brand-icon-wrapper">
            <GraduationCap className="brand-icon" size={26} />
          </div>
          <div>
            <div className="brand-title">
              Student<span>ERP</span>
            </div>
            <div className="brand-subtitle">Academic Intelligence Platform</div>
          </div>
        </div>

        {isAuthenticated && user && (
          <div className="navbar-actions">
            <div className="user-profile-badge">
              <div className="user-avatar">
                {user.role === 'admin' ? (
                  <ShieldCheck size={18} className="role-icon-admin" />
                ) : (
                  <UserCheck size={18} className="role-icon-student" />
                )}
              </div>
              <div className="user-meta">
                <span className="user-name">{user.name}</span>
                <span className="user-email">{user.email}</span>
              </div>
              <span className={`role-pill ${user.role}`}>
                {user.role.toUpperCase()}
              </span>
              {user.role === 'student' && user.rollNumber && (
                <span className="roll-pill">
                  {user.rollNumber}
                </span>
              )}
            </div>

            <button onClick={handleLogout} className="btn-logout" title="Sign out from session">
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
