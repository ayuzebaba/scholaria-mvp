import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/shared/Layout';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import '../styles/globals.css';

const PublicProfilePage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('none');

  useEffect(() => {
    fetchProfileData();
  }, [userId]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch papers
      const { data: papersData, error: papersError } = await supabase
        .from('papers')
        .select('*')
        .eq('author_id', userId)
        .order('created_at', { ascending: false });

      if (!papersError) {
        setPapers(papersData || []);
      }

      // Check connection status
      if (currentUser?.id) {
        const { data: connectionData } = await supabase
          .from('connections')
          .select('status')
          .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${currentUser.id})`)
          .maybeSingle();

        if (connectionData) {
          setConnectionStatus(connectionData.status);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container main-content">
          <div style={{ textAlign: 'center', padding: '60px 20px', gridColumn: '1 / -1' }}>
            <i className="fas fa-spinner fa-spin fa-2x" style={{ color: 'var(--primary)', marginBottom: '20px' }}></i>
            <p>Loading profile...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <div className="container main-content">
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--gray)', gridColumn: '1 / -1' }}>
            <i className="fas fa-user-slash fa-3x" style={{ marginBottom: '20px', opacity: 0.5 }}></i>
            <h3>Scholar not found</h3>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/network')}
              style={{ marginTop: '16px' }}
            >
              Back to Network
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container main-content">
        <div style={{ gridColumn: '1 / -1' }}>
          {/* Profile Header Card */}
          <section className="section-card" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
              {/* Avatar */}
              <div style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                background: 'var(--primary)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '600',
                fontSize: '48px',
                flexShrink: 0
              }}>
                {profile.full_name?.[0]?.toUpperCase() || 'S'}
              </div>

              {/* Profile Info */}
              <div style={{ flex: 1 }}>
                <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>
                  {profile.full_name}
                </h1>
                <p style={{ color: 'var(--gray)', fontSize: '16px', marginBottom: '4px' }}>
                  {profile.academic_title}
                </p>
                <p style={{ color: 'var(--gray)', fontSize: '14px', marginBottom: '12px' }}>
                  {profile.institution}
                </p>
                {profile.department && (
                  <p style={{ color: 'var(--gray)', fontSize: '14px', marginBottom: '16px' }}>
                    Department: {profile.department}
                  </p>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {connectionStatus === 'accepted' ? (
                    <>
                      <button
                        className="btn btn-primary"
                        onClick={() => navigate(`/messages/${userId}`)}
                      >
                        <i className="fas fa-envelope"></i> Send Message
                      </button>
                      <button className="btn btn-outline" disabled>
                        <i className="fas fa-check"></i> Connected
                      </button>
                    </>
                  ) : connectionStatus === 'pending' ? (
                    <button className="btn btn-outline" disabled>
                      <i className="fas fa-clock"></i> Request Pending
                    </button>
                  ) : (
                    <button 
                      className="btn btn-outline" 
                      onClick={() => navigate('/network')}
                    >
                      <i className="fas fa-user-plus"></i> Not Connected
                    </button>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Bio Section */}
          {profile.bio && (
            <section className="section-card" style={{ marginBottom: '24px' }}>
              <h2 className="section-title">
                <i className="fas fa-quote-left"></i> About
              </h2>
              <p style={{ lineHeight: '1.6', color: 'var(--dark)', marginBottom: 0 }}>
                {profile.bio}
              </p>
            </section>
          )}

          {/* Research Interests */}
          {profile.research_interests && profile.research_interests.length > 0 && (
            <section className="section-card" style={{ marginBottom: '24px' }}>
              <h2 className="section-title">
                <i className="fas fa-flask"></i> Research Interests
              </h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {profile.research_interests.map((interest, idx) => (
                  <span
                    key={idx}
                    style={{
                      background: 'var(--primary-light)',
                      color: 'var(--primary)',
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Skills */}
          {profile.skills && profile.skills.length > 0 && (
            <section className="section-card" style={{ marginBottom: '24px' }}>
              <h2 className="section-title">
                <i className="fas fa-toolbox"></i> Skills & Expertise
              </h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {profile.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    style={{
                      background: 'var(--gray-light)',
                      color: 'var(--gray)',
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '14px'
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Papers Section */}
          <section className="section-card">
            <div className="section-header">
              <h2 className="section-title">
                <i className="fas fa-book"></i> Published Papers ({papers.length})
              </h2>
            </div>

            {papers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--gray)' }}>
                <i className="fas fa-file-alt fa-2x" style={{ marginBottom: '12px', opacity: 0.5 }}></i>
                <p>No papers published yet</p>
              </div>
            ) : (
              <div className="papers-list">
                {papers.map((paper) => (
                  <div key={paper.id} className="paper-card">
                    <div className="paper-header">
                      <div style={{ flex: 1 }}>
                        <h3 className="paper-title">{paper.title}</h3>
                        <div className="paper-meta">
                          <span><i className="far fa-calendar"></i> {new Date(paper.created_at).toLocaleDateString()}</span>
                          {paper.citation_count && (
                            <span><i className="fas fa-quote-right"></i> {paper.citation_count} citations</span>
                          )}
                          {paper.keywords?.length > 0 && (
                            <span><i className="fas fa-tags"></i> {paper.keywords.slice(0, 3).join(', ')}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <p className="paper-abstract">
                      {paper.abstract || 'No abstract provided.'}
                    </p>
                    {paper.file_url && (
                      <div className="paper-actions">
                        <a 
                          href={paper.file_url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="btn btn-text"
                        >
                          <i className="fas fa-download"></i> Download
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default PublicProfilePage;