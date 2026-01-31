import React, { useState, useEffect } from 'react';
import Layout from '../components/shared/Layout';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import '../styles/globals.css';

const NetworkPage = () => {
  const { user } = useAuth();
  const [scholars, setScholars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [connections, setConnections] = useState([]);
  const [activeTab, setActiveTab] = useState('discover'); // discover, connections, requests
  const [sendingRequest, setSendingRequest] = useState({});

  useEffect(() => {
    fetchScholars();
    fetchConnections();
  }, [user?.id]);

  const fetchScholars = async () => {
    setLoading(true);
    try {
      // Get all scholars except current user
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user?.id)
        .order('full_name')
        .limit(50);
      
      if (!error) {
        // Mark scholars who already have connection requests
        const scholarsWithStatus = await Promise.all(
          (data || []).map(async (scholar) => {
            // Check if connection already exists
            const { data: existingConnection } = await supabase
              .from('connections')
              .select('status')
              .or(`and(sender_id.eq.${user?.id},receiver_id.eq.${scholar.id}),and(sender_id.eq.${scholar.id},receiver_id.eq.${user?.id})`)
              .maybeSingle();
            
            return {
              ...scholar,
              connectionStatus: existingConnection?.status || 'none'
            };
          })
        );
        
        setScholars(scholarsWithStatus);
      }
    } catch (error) {
      console.error('Error fetching scholars:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchConnections = async () => {
    try {
      if (!user?.id) return;
      
      // Get all connections involving current user
      const { data, error } = await supabase
        .from('connections')
        .select(`
          *,
          sender:profiles!sender_id(*),
          receiver:profiles!receiver_id(*)
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);
      
      if (!error) {
        setConnections(data || []);
      }
    } catch (error) {
      console.error('Error fetching connections:', error);
    }
  };

  const handleConnect = async (scholarId) => {
    if (!user?.id) return;
    
    setSendingRequest(prev => ({ ...prev, [scholarId]: true }));
    
    try {
      const { data, error } = await supabase
        .from('connections')
        .insert([{
          sender_id: user.id,
          receiver_id: scholarId,
          status: 'pending',
          message: 'I would like to connect with you on Scholaria.'
        }])
        .select()
        .single();
      
      if (error) {
        if (error.code === '23505') {
          alert('Connection request already sent or pending!');
        } else {
          throw error;
        }
      } else {
        // Update local state
        setScholars(prev => prev.map(scholar => 
          scholar.id === scholarId 
            ? { ...scholar, connectionStatus: 'pending' }
            : scholar
        ));
        
        setConnections(prev => [...prev, data]);
        
        alert('✅ Connection request sent!');
      }
    } catch (error) {
      console.error('Error sending connection request:', error);
      alert('❌ Error sending connection request');
    } finally {
      setSendingRequest(prev => ({ ...prev, [scholarId]: false }));
    }
  };

  const handleAcceptConnection = async (connectionId) => {
    try {
      const { error } = await supabase
        .from('connections')
        .update({ 
          status: 'accepted', 
          updated_at: new Date().toISOString() 
        })
        .eq('id', connectionId);
      
      if (!error) {
        // Update local state
        setConnections(prev => prev.map(conn =>
          conn.id === connectionId
            ? { ...conn, status: 'accepted' }
            : conn
        ));
        
        // Refresh scholars list to update status
        fetchScholars();
        
        alert('✅ Connection accepted!');
      }
    } catch (error) {
      console.error('Error accepting connection:', error);
      alert('❌ Error accepting connection');
    }
  };

  const handleRejectConnection = async (connectionId) => {
    try {
      const { error } = await supabase
        .from('connections')
        .update({ 
          status: 'rejected', 
          updated_at: new Date().toISOString() 
        })
        .eq('id', connectionId);
      
      if (!error) {
        // Update local state
        setConnections(prev => prev.map(conn =>
          conn.id === connectionId
            ? { ...conn, status: 'rejected' }
            : conn
        ));
        
        alert('Connection request declined.');
      }
    } catch (error) {
      console.error('Error rejecting connection:', error);
      alert('❌ Error rejecting connection');
    }
  };

  const getConnectionButtonText = (scholar) => {
    switch(scholar.connectionStatus) {
      case 'pending':
        return scholar.sender_id === user?.id ? 'Request Sent' : 'Respond to Request';
      case 'accepted':
        return 'Connected';
      case 'rejected':
        return 'Request Declined';
      default:
        return 'Connect';
    }
  };

  const getConnectionButtonClass = (scholar) => {
    switch(scholar.connectionStatus) {
      case 'pending':
        return 'btn-outline';
      case 'accepted':
        return 'btn-success';
      case 'rejected':
        return 'btn-outline';
      default:
        return 'btn-primary';
    }
  };

  const filteredScholars = scholars.filter(scholar =>
    !searchTerm ||
    scholar.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    scholar.institution?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    scholar.research_interests?.some(interest => 
      interest.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const pendingRequests = connections.filter(conn => 
    conn.status === 'pending' && conn.receiver_id === user?.id
  );

  const acceptedConnections = connections.filter(conn => 
    conn.status === 'accepted'
  );

  return (
    <Layout>
      <div className="container main-content">
        {/* Page Header */}
        <section className="section-card" style={{ marginBottom: '24px' }}>
          <div className="section-header">
            <div>
              <h1 style={{ fontSize: '24px', marginBottom: '8px' }}>
                <i className="fas fa-network-wired" style={{ color: 'var(--primary)', marginRight: '12px' }}></i>
                Academic Network
              </h1>
              <p style={{ color: 'var(--gray)', fontSize: '14px' }}>
                Connect with scholars, find collaborators, and build your academic network.
              </p>
            </div>
            <div className="profile-stats" style={{ background: 'transparent', padding: 0, margin: 0 }}>
              <div className="stat-item">
                <div className="stat-value">{scholars.length}</div>
                <div className="stat-label">Scholars</div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <button 
              className={`btn ${activeTab === 'discover' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveTab('discover')}
              style={{ minWidth: '120px' }}
            >
              <i className="fas fa-compass"></i> Discover
            </button>
            <button 
              className={`btn ${activeTab === 'connections' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveTab('connections')}
              style={{ minWidth: '120px' }}
            >
              <i className="fas fa-users"></i> Connections ({acceptedConnections.length})
            </button>
            <button 
              className={`btn ${activeTab === 'requests' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveTab('requests')}
              style={{ minWidth: '120px' }}
            >
              <i className="fas fa-user-plus"></i> Requests
              {pendingRequests.length > 0 && (
                <span style={{
                  background: '#ef4444',
                  color: 'white',
                  fontSize: '10px',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  marginLeft: '6px'
                }}>
                  {pendingRequests.length}
                </span>
              )}
            </button>
          </div>

          {/* Search */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <input
              type="text"
              placeholder="Search scholars by name, institution, or research interests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
        </section>

        {/* Content Area */}
        <section className="section-card">
          {/* Loading State */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <i className="fas fa-spinner fa-spin fa-2x" style={{ color: 'var(--primary)', marginBottom: '20px' }}></i>
              <p>Loading network...</p>
            </div>
          ) : (
            <>
              {/* Discover Tab */}
              {activeTab === 'discover' && (
                <>
                  {filteredScholars.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--gray)' }}>
                      <i className="fas fa-users fa-3x" style={{ marginBottom: '20px', opacity: 0.5 }}></i>
                      <p>No scholars found matching "{searchTerm}"</p>
                    </div>
                  ) : (
                    <div className="papers-list">
                      {filteredScholars.map((scholar) => (
                        <div key={scholar.id} className="paper-card">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            {/* Avatar */}
                            <div style={{
                              width: '60px',
                              height: '60px',
                              borderRadius: '50%',
                              background: 'var(--primary)',
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: '600',
                              fontSize: '18px',
                              flexShrink: 0
                            }}>
                              {scholar.full_name?.[0]?.toUpperCase() || 'S'}
                            </div>
                            
                            {/* Scholar Info */}
                            <div style={{ flex: 1 }}>
                              <h3 style={{ fontSize: '16px', marginBottom: '4px' }}>
                                {scholar.full_name || 'Anonymous Scholar'}
                              </h3>
                              <p style={{ color: 'var(--gray)', fontSize: '14px', marginBottom: '8px' }}>
                                {scholar.academic_title} • {scholar.institution}
                              </p>
                              
                              {/* Research Interests */}
                              {scholar.research_interests?.length > 0 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                                  {scholar.research_interests.slice(0, 3).map((interest, idx) => (
                                    <span key={idx} style={{
                                      background: 'var(--primary-light)',
                                      color: 'var(--primary)',
                                      padding: '4px 10px',
                                      borderRadius: '20px',
                                      fontSize: '12px',
                                      fontWeight: '500'
                                    }}>
                                      {interest}
                                    </span>
                                  ))}
                                  {scholar.research_interests.length > 3 && (
                                    <span style={{
                                      background: 'var(--gray-light)',
                                      color: 'var(--gray)',
                                      padding: '4px 10px',
                                      borderRadius: '20px',
                                      fontSize: '12px'
                                    }}>
                                      +{scholar.research_interests.length - 3} more
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                            
                            {/* Action Buttons */}
                            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                              <button 
                                className={`btn ${getConnectionButtonClass(scholar)}`}
                                onClick={() => handleConnect(scholar.id)}
                                disabled={sendingRequest[scholar.id] || scholar.connectionStatus !== 'none'}
                                style={{ minWidth: '120px' }}
                              >
                                {sendingRequest[scholar.id] ? (
                                  <>
                                    <i className="fas fa-spinner fa-spin"></i> Sending...
                                  </>
                                ) : (
                                  <>
                                    <i className="fas fa-user-plus"></i> {getConnectionButtonText(scholar)}
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Connections Tab */}
              {activeTab === 'connections' && (
                <>
                  {acceptedConnections.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--gray)' }}>
                      <i className="fas fa-users fa-3x" style={{ marginBottom: '20px', opacity: 0.5 }}></i>
                      <h3 style={{ marginBottom: '12px' }}>No connections yet</h3>
                      <p>Connect with other scholars to build your academic network.</p>
                      <button 
                        className="btn btn-primary"
                        onClick={() => setActiveTab('discover')}
                        style={{ marginTop: '16px' }}
                      >
                        <i className="fas fa-compass"></i> Discover Scholars
                      </button>
                    </div>
                  ) : (
                    <div className="papers-list">
                      {acceptedConnections.map((connection) => {
                        const connectedScholar = connection.sender_id === user?.id 
                          ? connection.receiver 
                          : connection.sender;
                        
                        return (
                          <div key={connection.id} className="paper-card">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                              {/* Avatar */}
                              <div style={{
                                width: '60px',
                                height: '60px',
                                borderRadius: '50%',
                                background: 'var(--primary)',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: '600',
                                fontSize: '18px',
                                flexShrink: 0
                              }}>
                                {connectedScholar?.full_name?.[0]?.toUpperCase() || 'C'}
                              </div>
                              
                              {/* Connection Info */}
                              <div style={{ flex: 1 }}>
                                <h3 style={{ fontSize: '16px', marginBottom: '4px' }}>
                                  {connectedScholar?.full_name}
                                </h3>
                                <p style={{ color: 'var(--gray)', fontSize: '14px', marginBottom: '8px' }}>
                                  {connectedScholar?.academic_title} • {connectedScholar?.institution}
                                </p>
                                <div style={{ fontSize: '12px', color: 'var(--gray)' }}>
                                  <i className="fas fa-link"></i> Connected since {new Date(connection.updated_at).toLocaleDateString()}
                                </div>
                              </div>
                              
                              {/* Action Buttons */}
                              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                                <button className="btn btn-outline">
                                  <i className="fas fa-envelope"></i> Message
                                </button>
                                <button className="btn btn-text">
                                  <i className="fas fa-user"></i> View Profile
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {/* Requests Tab */}
              {activeTab === 'requests' && (
                <>
                  {pendingRequests.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--gray)' }}>
                      <i className="fas fa-inbox fa-3x" style={{ marginBottom: '20px', opacity: 0.5 }}></i>
                      <h3 style={{ marginBottom: '12px' }}>No pending requests</h3>
                      <p>When other scholars send you connection requests, they'll appear here.</p>
                    </div>
                  ) : (
                    <div className="papers-list">
                      {pendingRequests.map((connection) => (
                        <div key={connection.id} className="paper-card">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            {/* Sender Avatar */}
                            <div style={{
                              width: '60px',
                              height: '60px',
                              borderRadius: '50%',
                              background: 'var(--primary)',
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: '600',
                              fontSize: '18px',
                              flexShrink: 0
                            }}>
                              {connection.sender?.full_name?.[0]?.toUpperCase() || 'S'}
                            </div>
                            
                            {/* Request Info */}
                            <div style={{ flex: 1 }}>
                              <h3 style={{ fontSize: '16px', marginBottom: '4px' }}>
                                {connection.sender?.full_name}
                              </h3>
                              <p style={{ color: 'var(--gray)', fontSize: '14px', marginBottom: '8px' }}>
                                {connection.sender?.academic_title} • {connection.sender?.institution}
                              </p>
                              {connection.message && (
                                <p style={{ 
                                  background: 'var(--light)', 
                                  padding: '8px 12px', 
                                  borderRadius: '6px',
                                  fontSize: '13px',
                                  marginBottom: '12px'
                                }}>
                                  "{connection.message}"
                                </p>
                              )}
                              <div style={{ fontSize: '12px', color: 'var(--gray)' }}>
                                <i className="far fa-clock"></i> {new Date(connection.created_at).toLocaleDateString()}
                              </div>
                            </div>
                            
                            {/* Action Buttons */}
                            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                              <button 
                                className="btn btn-primary"
                                onClick={() => handleAcceptConnection(connection.id)}
                                style={{ minWidth: '100px' }}
                              >
                                <i className="fas fa-check"></i> Accept
                              </button>
                              <button 
                                className="btn btn-outline"
                                onClick={() => handleRejectConnection(connection.id)}
                                style={{ minWidth: '100px' }}
                              >
                                <i className="fas fa-times"></i> Decline
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </section>
      </div>
    </Layout>
  );
};

export default NetworkPage;