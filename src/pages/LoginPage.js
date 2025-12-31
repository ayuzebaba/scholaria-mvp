import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [institution, setInstitution] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (isLogin) {
        await signIn(email, password);
        navigate('/dashboard');
      } else {
        await signUp(email, password, fullName, institution);
        alert(`✅ Verification email sent to ${email}\n\n📬 Please check:\n1. Your INBOX\n2. SPAM/JUNK folder\n3. Wait 1-2 minutes\n\nOnce verified, login to Scholaria!`);
        setIsLogin(true);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Update AuthContext.js signUp function to accept institution
  /*const handleDemoLogin = async () => {
    try {
      await signIn('demo@scholaria.org', 'demo123');
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };*/

  const handleDemoLogin = () => {
    const name = "Ayodele Ogunyemi";
    alert(name);
  };

  const sayMyName = () => {alert ("Alert Ayo")}

  return (
    <div className="auth-overlay">
      <div className="auth-container">
        <div className="auth-tabs">
          <button 
            className={`auth-tab ${isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(true)}
          >
            Sign In
          </button>
          <button 
            className={`auth-tab ${!isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(false)}
          >
            Create Account
          </button>
        </div>
        
        {/* Login Form */}
        <div className={`auth-form ${isLogin ? 'active' : ''}`} id="loginForm">
          <h2 className="auth-title">Welcome back to Scholaria</h2>
          <p className="auth-subtitle">Sign in to access your research profile and papers</p>
          
          {error && (
            <div style={{
              background: '#fee2e2',
              color: '#991b1b',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}
          
          <form id="loginFormContent" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="loginEmail">Email Address</label>
              <input 
                type="email" 
                id="loginEmail" 
                placeholder="scholar@university.edu" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="loginPassword">Password</label>
              <input 
                type="password" 
                id="loginPassword" 
                placeholder="Enter your password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{width: '100%', marginTop: '10px'}}
              disabled={loading}
            >
              <i className="fas fa-sign-in-alt"></i>
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
          
          <div className="demo-login">
            {/*<button id="demoLoginBtn" onClick={handleDemoLogin}>*/}
            <button id="demoLoginBtn" onClick={sayMyName}>
              <i className="fas fa-rocket"></i>
              Try Demo Account (Derek & Ayo)
            </button>
          </div>
          
          <div className="auth-footer">
            <p>Academic or institution email recommended</p>
          </div>
        </div>
        
        {/* Register Form */}
        <div className={`auth-form ${!isLogin ? 'active' : ''}`} id="registerForm">
          <h2 className="auth-title">Join Scholaria</h2>
          <p className="auth-subtitle">Create your academic profile and start sharing research</p>
          
          {error && (
            <div style={{
              background: '#fee2e2',
              color: '#991b1b',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}
          
          <form id="registerFormContent" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="registerName">Full Name</label>
              <input 
                type="text" 
                id="registerName" 
                placeholder="Dr. Jane Doe" 
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="registerEmail">Academic Email</label>
              <input 
                type="email" 
                id="registerEmail" 
                placeholder="scholar@university.edu" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="registerPassword">Create Password</label>
              <input 
                type="password" 
                id="registerPassword" 
                placeholder="Minimum 8 characters" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="registerInstitution">Institution</label>
              <input 
                type="text" 
                id="registerInstitution" 
                placeholder="Stanford University" 
                required
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
              />
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{width: '100%', marginTop: '10px'}}
              disabled={loading}
            >
              <i className="fas fa-user-plus"></i>
              {loading ? 'Creating Account...' : 'Create Academic Profile'}
            </button>
          </form>
          
          <div className="auth-footer">
            <p>Already have an account? <button 
              onClick={() => setIsLogin(true)}
              style={{
                background: 'none',
                border: 'none',
                color: '#2563eb',
                fontWeight: '500',
                cursor: 'pointer',
                textDecoration: 'underline',
                padding: 0
              }}
            >
              Sign in here
            </button></p>
          </div>
        </div>
      </div>
    </div>
  );
}