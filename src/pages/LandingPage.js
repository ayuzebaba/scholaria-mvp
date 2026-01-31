import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/globals.css';

const HomePage = () => {
  const { user } = useAuth();

  // Get user initials for avatar
  const getInitials = () => {
    if (user?.user_metadata?.full_name || user?.user_metadata?.name) {
      const name = user.user_metadata.full_name || user.user_metadata.name;
      const names = name.split(' ');
      if (names.length >= 2) {
        return (names[0][0] + names[1][0]).toUpperCase();
      }
      return names[0].substring(0, 2).toUpperCase();
    }
    return user?.email?.substring(0, 2).toUpperCase() || 'U';
  };

  // Get user display name
  const getUserDisplayName = () => {
    return user?.user_metadata?.full_name || 
           user?.user_metadata?.name || 
           user?.email?.split('@')[0] || 
           'Scholar';
  };

  // Get user role
  const getUserRole = () => {
    return user?.user_metadata?.title || 
           user?.user_metadata?.role || 
           'Academic Researcher';
  };

  return (
    <div style={{ 
      background: '#f8fafc',
      minHeight: '100vh',
      padding: '30px 20px'
    }}>
      <div style={{ 
        maxWidth: '900px', // Reduced from 1200px
        width: '100%',
        padding: '30px', // Reduced from 40px
        margin: '0 auto',
        background: 'white',
        boxShadow: '0 10px 40px rgba(0,0,0,0.08)', // Lighter shadow
        border: '1px solid #e2e8f0',
        borderRadius: '16px' // Slightly smaller radius
      }}>
        {/* Welcome Hero Section - More Compact */}
        <div style={{
          background: '#f8fafc',
          borderRadius: '16px',
          padding: '30px', // Reduced from 40px
          marginBottom: '30px', // Reduced from 40px
          textAlign: 'center',
          border: '2px solid #e2e8f0',
          transition: 'all 0.3s ease'
        }} onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-3px)';
          e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';
          e.currentTarget.style.borderColor = '#2563eb';
        }} onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.borderColor = '#e2e8f0';
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: '20px', // Reduced from 24px
            flexWrap: 'wrap',
            marginBottom: '15px' // Reduced from 20px
          }}>
            <div style={{
              width: '80px', // Reduced from 100px
              height: '80px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '28px', // Reduced from 36px
              fontWeight: '600',
              flexShrink: 0,
              border: '3px solid white', // Reduced from 4px
              boxShadow: '0 6px 15px rgba(37, 99, 235, 0.3)' // Reduced shadow
            }}>
              {getInitials()}
            </div>
            
            <div style={{ maxWidth: '500px' }}> {/* Reduced from 600px */}
              <h1 style={{ fontSize: '28px', marginBottom: '10px', fontWeight: '700', color: '#1e293b' }}>
                Welcome back, {getUserDisplayName()}! 🎓
              </h1>
              <p style={{ fontSize: '16px', color: '#64748b', marginBottom: '0' }}>
                {getUserRole()} • Ready to collaborate and advance your research today?
              </p>
            </div>
          </div>
        </div>

        {/* Scholaria Platform Description - More Compact */}
        <div style={{
          background: '#f8fafc',
          borderRadius: '16px',
          padding: '30px',
          marginBottom: '30px',
          border: '2px solid #e2e8f0',
          transition: 'all 0.3s ease'
        }} onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-3px)';
          e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';
          e.currentTarget.style.borderColor = '#2563eb';
        }} onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.borderColor = '#e2e8f0';
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '20px', // Reduced from 30px
            flexWrap: 'wrap' 
          }}>
            <div style={{
              width: '60px', // Reduced from 80px
              height: '60px',
              borderRadius: '16px', // Reduced from 20px
              background: '#dbeafe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#2563eb',
              fontSize: '28px', // Reduced from 36px
              flexShrink: 0,
              border: '2px solid white', // Reduced from 3px
              boxShadow: '0 6px 15px rgba(37, 99, 235, 0.2)'
            }}>
              <i className="fas fa-graduation-cap"></i>
            </div>
            
            <div style={{ flex: 1 }}>
              <h2 style={{ 
                fontSize: '24px', // Reduced from 32px
                marginBottom: '12px', // Reduced from 16px
                color: '#1e293b',
                fontWeight: '700'
              }}>
                Scholaria Academic Platform
              </h2>
              <p style={{ 
                color: '#64748b', 
                fontSize: '15px', // Reduced from 18px
                lineHeight: '1.6',
                marginBottom: '0'
              }}>
                A centralized academic portfolio with focus on easy discoverability of research and publications. 
                Connect, collaborate, and accelerate your research journey with thousands of scholars worldwide.
              </p>
            </div>
          </div>
        </div>

        {/* Feature Cards - More Compact Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', // Reduced from 350px
          gap: '20px', // Reduced from 30px
          marginBottom: '30px' // Reduced from 40px
        }}>
          {/* Academic Profile Card */}
          <div style={{
            background: '#f8fafc',
            borderRadius: '16px',
            padding: '25px', // Reduced from 40px
            textAlign: 'center',
            transition: 'all 0.3s ease',
            border: '2px solid #e2e8f0',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }} onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';
            e.currentTarget.style.borderColor = '#667eea';
            e.currentTarget.style.background = 'white';
          }} onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.borderColor = '#e2e8f0';
            e.currentTarget.style.background = '#f8fafc';
          }}>
            <div>
              <div style={{
                width: '80px', // Reduced from 100px
                height: '80px',
                borderRadius: '20px', // Reduced from 25px
                background: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px', // Reduced from 30px
                color: '#667eea',
                fontSize: '36px', // Reduced from 48px
                border: '2px solid #667eea', // Reduced from 3px
                boxShadow: '0 6px 15px rgba(102, 126, 234, 0.2)'
              }}>
                <i className="fas fa-user-circle"></i>
              </div>
              <h3 style={{ fontSize: '22px', marginBottom: '15px', color: '#1e293b', fontWeight: '600' }}>
                Academic Profile
              </h3>
              <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px', lineHeight: '1.5' }}>
                Create and manage your professional academic profile. Showcase your publications, research interests, and achievements.
              </p>
            </div>
            <Link to="/dashboard" style={{
              background: '#667eea',
              color: 'white',
              padding: '10px 20px', // Reduced from 14px 28px
              borderRadius: '10px', // Reduced from 12px
              textDecoration: 'none',
              fontWeight: '600',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px', // Reduced from 10px
              transition: 'all 0.3s ease',
              border: '2px solid #667eea',
              fontSize: '14px' // Reduced from 16px
            }} onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 15px rgba(102, 126, 234, 0.4)';
              e.currentTarget.style.background = '#764ba2';
              e.currentTarget.style.borderColor = '#764ba2';
            }} onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.background = '#667eea';
              e.currentTarget.style.borderColor = '#667eea';
            }}>
              <i className="fas fa-user-edit"></i> Manage Profile
            </Link>
          </div>

          {/* University Network Card */}
          <div style={{
            background: '#f8fafc',
            borderRadius: '16px',
            padding: '25px',
            textAlign: 'center',
            transition: 'all 0.3s ease',
            border: '2px solid #e2e8f0',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }} onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';
            e.currentTarget.style.borderColor = '#4facfe';
            e.currentTarget.style.background = 'white';
          }} onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.borderColor = '#e2e8f0';
            e.currentTarget.style.background = '#f8fafc';
          }}>
            <div>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '20px',
                background: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                color: '#4facfe',
                fontSize: '36px',
                border: '2px solid #4facfe',
                boxShadow: '0 6px 15px rgba(79, 172, 254, 0.2)'
              }}>
                <i className="fas fa-university"></i>
              </div>
              <h3 style={{ fontSize: '22px', marginBottom: '15px', color: '#1e293b', fontWeight: '600' }}>
                University Network
              </h3>
              <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px', lineHeight: '1.5' }}>
                Connect with researchers from participating universities. Access transcripts, certificates, and academic resources.
              </p>
            </div>
            <Link to="/network" style={{
              background: '#4facfe',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '10px',
              textDecoration: 'none',
              fontWeight: '600',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.3s ease',
              border: '2px solid #4facfe',
              fontSize: '14px'
            }} onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 15px rgba(79, 172, 254, 0.4)';
              e.currentTarget.style.background = '#00f2fe';
              e.currentTarget.style.borderColor = '#00f2fe';
            }} onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.background = '#4facfe';
              e.currentTarget.style.borderColor = '#4facfe';
            }}>
              <i className="fas fa-network-wired"></i> Explore Network
            </Link>
          </div>

          {/* Collaboration Hub Card */}
          <div style={{
            background: '#f8fafc',
            borderRadius: '16px',
            padding: '25px',
            textAlign: 'center',
            transition: 'all 0.3s ease',
            border: '2px solid #e2e8f0',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }} onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';
            e.currentTarget.style.borderColor = '#f093fb';
            e.currentTarget.style.background = 'white';
          }} onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.borderColor = '#e2e8f0';
            e.currentTarget.style.background = '#f8fafc';
          }}>
            <div>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '20px',
                background: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                color: '#f093fb',
                fontSize: '36px',
                border: '2px solid #f093fb',
                boxShadow: '0 6px 15px rgba(240, 147, 251, 0.2)'
              }}>
                <i className="fas fa-lightbulb"></i>
              </div>
              <h3 style={{ fontSize: '22px', marginBottom: '15px', color: '#1e293b', fontWeight: '600' }}>
                Collaboration Hub
              </h3>
              <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px', lineHeight: '1.5' }}>
                Brainstorm ideas, find mentors, and collaborate on projects. Join discussions and share knowledge with peers.
              </p>
            </div>
            <Link to="/publicreview" style={{
              background: '#f093fb',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '10px',
              textDecoration: 'none',
              fontWeight: '600',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.3s ease',
              border: '2px solid #f093fb',
              fontSize: '14px'
            }} onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 15px rgba(240, 147, 251, 0.4)';
              e.currentTarget.style.background = '#f5576c';
              e.currentTarget.style.borderColor = '#f5576c';
            }} onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.background = '#f093fb';
              e.currentTarget.style.borderColor = '#f093fb';
            }}>
              <i className="fas fa-comments"></i> Start Collaborating
            </Link>
          </div>
        </div>

        {/* Quick Access Section - More Compact */}
        <div style={{
          background: '#f8fafc',
          borderRadius: '16px',
          padding: '30px',
          marginBottom: '30px',
          border: '2px solid #e2e8f0',
          transition: 'all 0.3s ease'
        }} onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-3px)';
          e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';
          e.currentTarget.style.borderColor = '#2563eb';
        }} onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.borderColor = '#e2e8f0';
        }}>
          <h2 style={{ 
            fontSize: '24px', // Reduced from 32px
            marginBottom: '25px', // Reduced from 40px
            display: 'flex',
            alignItems: 'center',
            gap: '15px', // Reduced from 20px
            color: '#1e293b'
          }}>
            <div style={{
              width: '50px', // Reduced from 70px
              height: '50px',
              borderRadius: '16px', // Reduced from 20px
              background: '#dbeafe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#2563eb',
              fontSize: '24px', // Reduced from 32px
              border: '2px solid white', // Reduced from 3px
              boxShadow: '0 6px 15px rgba(37, 99, 235, 0.2)'
            }}>
              <i className="fas fa-rocket"></i>
            </div>
            Quick Access
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', // Reduced from 250px
            gap: '15px' // Reduced from 25px
          }}>
            {[
              { icon: 'home', label: 'Dashboard', path: '/dashboard', color: '#667eea', desc: 'Manage papers & profile' },
              { icon: 'globe', label: 'Public Review', path: '/publicreview', color: '#4facfe', desc: 'Peer feedback system' },
              { icon: 'network-wired', label: 'Network', path: '/network', color: '#10b981', desc: 'Connect with scholars' },
              { icon: 'chart-line', label: 'Analytics', path: '/analytics', color: '#f59e0b', desc: 'Research insights' },
              { icon: 'upload', label: 'Upload Paper', path: '/dashboard', color: '#8b5cf6', desc: 'Share your research' },
              { icon: 'user-plus', label: 'Find Peers', path: '/network', color: '#f97316', desc: 'Collaboration tools' }
            ].map((item, index) => (
              <Link 
                key={index}
                to={item.path}
                style={{
                  background: '#f8fafc',
                  borderRadius: '16px',
                  padding: '20px', // Reduced from 30px
                  textAlign: 'center',
                  textDecoration: 'none',
                  color: '#1e293b',
                  transition: 'all 0.3s ease',
                  border: '2px solid #e2e8f0',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';
                  e.currentTarget.style.borderColor = item.color;
                  e.currentTarget.style.background = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.background = '#f8fafc';
                }}
              >
                <i className={`fas fa-${item.icon}`} style={{ 
                  fontSize: '32px', // Reduced from 48px
                  color: item.color,
                  marginBottom: '12px', // Reduced from 20px
                  display: 'block'
                }}></i>
                <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                  {item.label}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  {item.desc}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Communication Tools Section - More Compact */}
        <div style={{
          background: '#f8fafc',
          borderRadius: '16px',
          padding: '30px',
          marginBottom: '30px',
          border: '2px solid #e2e8f0',
          transition: 'all 0.3s ease'
        }} onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-3px)';
          e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';
          e.currentTarget.style.borderColor = '#0ea5e9';
        }} onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.borderColor = '#e2e8f0';
        }}>
          <h2 style={{ 
            fontSize: '24px', 
            marginBottom: '25px',
            display: 'flex',
            alignItems: 'center',
            gap: '15px',
            color: '#1e293b'
          }}>
            <div style={{
              width: '50px',
              height: '50px',
              borderRadius: '16px',
              background: '#e0f2fe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0ea5e9',
              fontSize: '24px',
              border: '2px solid white',
              boxShadow: '0 6px 15px rgba(14, 165, 233, 0.2)'
            }}>
              <i className="fas fa-comments"></i>
            </div>
            Communication Tools
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', // Reduced from 200px
            gap: '15px'
          }}>
            {[
              { icon: 'fab fa-whatsapp', label: 'WhatsApp', color: '#25D366', desc: 'Instant messaging' },
              { icon: 'fas fa-video', label: 'Zoom', color: '#4285F4', desc: 'Video meetings' },
              { icon: 'fas fa-comment-alt', label: 'Chat', color: '#2563eb', desc: 'In-app messaging' },
              { icon: 'fas fa-chart-bar', label: 'Stats', color: '#10b981', desc: 'Analytics dashboard' }
            ].map((tool, index) => (
              <div 
                key={index}
                style={{
                  background: '#f8fafc',
                  borderRadius: '16px',
                  padding: '20px',
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                  border: '2px solid #e2e8f0',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';
                  e.currentTarget.style.borderColor = tool.color;
                  e.currentTarget.style.background = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.background = '#f8fafc';
                }}
              >
                <i className={tool.icon} style={{ 
                  fontSize: '32px',
                  color: tool.color,
                  marginBottom: '12px',
                  display: 'block'
                }}></i>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>
                  {tool.label}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  {tool.desc}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Call to Action Section - More Compact */}
        <div style={{
          background: '#f8fafc',
          borderRadius: '16px',
          padding: '35px', // Reduced from 50px
          marginBottom: '30px',
          textAlign: 'center',
          border: '2px solid #e2e8f0',
          transition: 'all 0.3s ease'
        }} onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-3px)';
          e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';
          e.currentTarget.style.borderColor = '#2563eb';
        }} onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.borderColor = '#e2e8f0';
        }}>
          <div style={{
            width: '70px', // Reduced from 100px
            height: '70px',
            borderRadius: '20px', // Reduced from 25px
            background: '#dbeafe',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px', // Reduced from 30px
            color: '#2563eb',
            fontSize: '32px', // Reduced from 48px
            border: '2px solid white', // Reduced from 3px
            boxShadow: '0 6px 15px rgba(37, 99, 235, 0.2)'
          }}>
            <i className="fas fa-rocket"></i>
          </div>
          
          <h2 style={{ fontSize: '28px', marginBottom: '15px', color: '#1e293b', fontWeight: '700' }}>
            Ready to Elevate Your Research? 🚀
          </h2>
          <p style={{ fontSize: '15px', color: '#64748b', marginBottom: '25px', maxWidth: '500px', margin: '0 auto' }}>
            Join thousands of scholars who are already collaborating, publishing, and advancing their research careers.
          </p>
          
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/dashboard" style={{
              background: '#2563eb',
              color: 'white',
              fontWeight: '600',
              padding: '12px 24px', // Reduced from 16px 32px
              borderRadius: '10px', // Reduced from 12px
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px', // Reduced from 12px
              transition: 'all 0.3s ease',
              border: '2px solid #2563eb',
              fontSize: '14px' // Reduced from 16px
            }} onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(37, 99, 235, 0.4)';
              e.currentTarget.style.background = '#1e40af';
              e.currentTarget.style.borderColor = '#1e40af';
            }} onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.background = '#2563eb';
              e.currentTarget.style.borderColor = '#2563eb';
            }}>
              <i className="fas fa-upload"></i> Upload Your First Paper
            </Link>
            <Link to="/network" style={{
              background: '#f8fafc',
              color: '#2563eb',
              fontWeight: '600',
              padding: '12px 24px',
              borderRadius: '10px',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              transition: 'all 0.3s ease',
              border: '2px solid #2563eb',
              fontSize: '14px'
            }} onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(37, 99, 235, 0.2)';
              e.currentTarget.style.background = '#2563eb';
              e.currentTarget.style.color = 'white';
            }} onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.background = '#f8fafc';
              e.currentTarget.style.color = '#2563eb';
            }}>
              <i className="fas fa-user-plus"></i> Connect with Peers
            </Link>
          </div>
        </div>

        {/* Navigation to Dashboard - More Compact */}
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <Link to="/dashboard" style={{
            background: '#2563eb',
            color: 'white',
            padding: '10px 24px', // Reduced from 14px 32px
            borderRadius: '10px', // Reduced from 12px
            textDecoration: 'none',
            fontWeight: '600',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px', // Reduced from 12px
            boxShadow: '0 4px 15px rgba(37, 99, 235, 0.3)',
            transition: 'all 0.3s ease',
            fontSize: '14px' // Reduced from 16px
          }} onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 25px rgba(37, 99, 235, 0.4)';
            e.currentTarget.style.background = '#1e40af';
          }} onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(37, 99, 235, 0.3)';
            e.currentTarget.style.background = '#2563eb';
          }}>
            <i className="fas fa-arrow-right"></i> Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HomePage;