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
  const [activeTab, setActiveTab] = useState('discover');
  const [sendingRequest, setSendingRequest] = useState({});
  const [processingRequest, setProcessingRequest] = useState({});
  
  // New states for profile modal and chat
  const [selectedScholar, setSelectedScholar] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedChatUser, setSelectedChatUser] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([]);

  useEffect(() => {
    fetchScholars();
    fetchConnections();
  }, [user?.id]);

  const fetchScholars = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user?.id)
        .order('full_name')
        .limit(50);
      
      if (!error) {
        const scholarsWithStatus = await Promise.all(
          (data || []).map(async (scholar) => {
            const { data: existingConnection } = await supabase
              .from('connections')
              .select('id, status, sender_id, receiver_id')
              .or(`and(sender_id.eq.${user?.id},receiver_id.eq.${scholar.id}),and(sender_id.eq.${scholar.id},receiver_id.eq.${user?.id})`)
              .maybeSingle();
            
            return {
              ...scholar,
              connectionStatus: existingConnection?.status || 'none',
              connectionId: existingConnection?.id || null
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
    
    const incomingRequest = connections.find(conn => 
      conn.sender_id === scholarId && 
      conn.receiver_id === user.id && 
      conn.status === 'pending'
    );

    if (incomingRequest) {
      return;
    }

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
        setScholars(prev => prev.map(scholar => 
          scholar.id === scholarId 
            ? { 
                ...scholar, 
                connectionStatus: 'pending',
                connectionId: data.id
              }
            : scholar
        ));
        
        setConnections(prev => [...prev, data]);
        await fetchConnections();
        alert('✅ Connection request sent!');
      }
    } catch (error) {
      console.error('Error sending connection request:', error);
      alert('❌ Error sending connection request');
    } finally {
      setSendingRequest(prev => ({ ...prev, [scholarId]: false }));
    }
  };

  const handleAcceptConnection = async (senderId) => {
    const pendingConnection = connections.find(conn => 
      conn.sender_id === senderId && 
      conn.receiver_id === user?.id && 
      conn.status === 'pending'
    );
    
    if (!pendingConnection) {
      alert('❌ No pending connection request found for this scholar');
      return;
    }
    
    setProcessingRequest(prev => ({ ...prev, [senderId]: 'accepting' }));
    
    try {
      const { error } = await supabase
        .from('connections')
        .update({ 
          status: 'accepted', 
          updated_at: new Date().toISOString() 
        })
        .eq('id', pendingConnection.id);
      
      if (error) {
        alert(`❌ Database error: ${error.message}`);
        return;
      }
      
      setConnections(prev => prev.map(conn =>
        conn.id === pendingConnection.id
          ? { ...conn, status: 'accepted', updated_at: new Date().toISOString() }
          : conn
      ));
      
      setScholars(prev => prev.map(scholar => 
        scholar.id === senderId 
          ? { ...scholar, connectionStatus: 'accepted' }
          : scholar
      ));
      
      await fetchConnections();
      await fetchScholars();
      
      alert('✅ Connection accepted!');
      
    } catch (error) {
      console.error('Error in handleAcceptConnection:', error);
      alert('❌ Error accepting connection');
    } finally {
      setProcessingRequest(prev => ({ ...prev, [senderId]: null }));
    }
  };

  const handleRejectConnection = async (senderId) => {
    const pendingConnection = connections.find(conn => 
      conn.sender_id === senderId && 
      conn.receiver_id === user?.id && 
      conn.status === 'pending'
    );
    
    if (!pendingConnection) {
      alert('❌ No pending connection request found');
      return;
    }
    
    setProcessingRequest(prev => ({ ...prev, [senderId]: 'rejecting' }));
    
    try {
      const { error } = await supabase
        .from('connections')
        .update({ 
          status: 'rejected', 
          updated_at: new Date().toISOString() 
        })
        .eq('id', pendingConnection.id);
      
      if (error) throw error;
      
      setConnections(prev => prev.map(conn =>
        conn.id === pendingConnection.id
          ? { ...conn, status: 'rejected' }
          : conn
      ));
      
      setScholars(prev => prev.map(scholar => 
        scholar.id === senderId 
          ? { ...scholar, connectionStatus: 'rejected' }
          : scholar
      ));
      
      await fetchConnections();
      
      alert('Connection request declined.');
      
    } catch (error) {
      console.error('Error rejecting connection:', error);
      alert('❌ Error rejecting connection');
    } finally {
      setProcessingRequest(prev => ({ ...prev, [senderId]: null }));
    }
  };

  const handleViewProfile = (scholar) => {
    setSelectedScholar(scholar);
    setShowProfileModal(true);
  };

  const handleStartChat = (scholar) => {
    setSelectedChatUser(scholar);
    setChatMessages([]); // Clear previous messages
    setShowChat(true);
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    const newMessage = {
      text: message,
      sender: 'me',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toLocaleDateString()
    };
    
    setChatMessages(prev => [...prev, newMessage]);
    setMessage('');
    
    // Simulate auto-reply after 1 second
    setTimeout(() => {
      const reply = {
        text: `Thanks for your message! This is an auto-reply from ${selectedChatUser?.full_name}.`,
        sender: 'them',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toLocaleDateString()
      };
      setChatMessages(prev => [...prev, reply]);
    }, 1000);
  };

  const getConnectionButtonText = (scholar) => {
    switch(scholar.connectionStatus) {
      case 'pending':
        const connection = connections.find(conn => 
          (conn.sender_id === user?.id && conn.receiver_id === scholar.id && conn.status === 'pending') ||
          (conn.sender_id === scholar.id && conn.receiver_id === user?.id && conn.status === 'pending')
        );
        return connection?.sender_id === user?.id ? 'Request Sent' : 'Respond to Request';
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
        const connection = connections.find(conn => 
          (conn.sender_id === user?.id && conn.receiver_id === scholar.id && conn.status === 'pending') ||
          (conn.sender_id === scholar.id && conn.receiver_id === user?.id && conn.status === 'pending')
        );
        return connection?.sender_id === user?.id ? 'btn-outline' : 'btn-primary';
      case 'accepted':
        return 'btn-success';
      case 'rejected':
        return 'btn-outline';
      default:
        return 'btn-primary';
    }
  };

  const hasIncomingRequest = (scholar) => {
    return connections.some(conn => 
      conn.sender_id === scholar.id && 
      conn.receiver_id === user?.id && 
      conn.status === 'pending'
    );
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
              <div className="stat-item">
                <div className="stat-value">{acceptedConnections.length}</div>
                <div className="stat-label">Connections</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{pendingRequests.length}</div>
                <div className="stat-label">Requests</div>
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
                      {filteredScholars.map((scholar) => {
                        const isIncomingRequest = hasIncomingRequest(scholar);
                        const isOutgoingRequest = connections.some(conn => 
                          conn.sender_id === user?.id && 
                          conn.receiver_id === scholar.id && 
                          conn.status === 'pending'
                        );
                        
                        return (
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
                                
                                {/* Connection Status Badge */}
                                {isIncomingRequest && (
                                  <div style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    background: '#fff3cd',
                                    color: '#856404',
                                    padding: '4px 10px',
                                    borderRadius: '20px',
                                    fontSize: '12px',
                                    marginTop: '8px'
                                  }}>
                                    <i className="fas fa-envelope" style={{ fontSize: '10px' }}></i>
                                    <span>Sent you a connection request</span>
                                  </div>
                                )}
                              </div>
                              
                              {/* Action Buttons */}
                              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                                {/* INCOMING REQUEST: Show Accept/Decline buttons */}
                                {isIncomingRequest ? (
                                  <>
                                    <button 
                                      className="btn btn-primary"
                                      onClick={() => handleAcceptConnection(scholar.id)}
                                      disabled={processingRequest[scholar.id] === 'accepting'}
                                      style={{ minWidth: '100px' }}
                                    >
                                      {processingRequest[scholar.id] === 'accepting' ? (
                                        <>
                                          <i className="fas fa-spinner fa-spin"></i> Accepting...
                                        </>
                                      ) : (
                                        <>
                                          <i className="fas fa-check"></i> Accept
                                        </>
                                      )}
                                    </button>
                                    <button 
                                      className="btn btn-outline"
                                      onClick={() => handleRejectConnection(scholar.id)}
                                      disabled={processingRequest[scholar.id] === 'rejecting'}
                                      style={{ minWidth: '100px' }}
                                    >
                                      {processingRequest[scholar.id] === 'rejecting' ? (
                                        <>
                                          <i className="fas fa-spinner fa-spin"></i> Declining...
                                        </>
                                      ) : (
                                        <>
                                          <i className="fas fa-times"></i> Decline
                                        </>
                                      )}
                                    </button>
                                  </>
                                ) : (
                                  /* NORMAL CONNECT BUTTON */
                                  <button 
                                    className={`btn ${getConnectionButtonClass(scholar)}`}
                                    onClick={() => handleConnect(scholar.id)}
                                    disabled={sendingRequest[scholar.id] || isOutgoingRequest || scholar.connectionStatus === 'accepted' || scholar.connectionStatus === 'rejected'}
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
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
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
                                <button 
                                  className="btn btn-outline"
                                  onClick={() => handleStartChat(connectedScholar)}
                                >
                                  <i className="fas fa-envelope"></i> Message
                                </button>
                                <button 
                                  className="btn btn-text"
                                  onClick={() => handleViewProfile(connectedScholar)}
                                >
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
                                onClick={() => handleAcceptConnection(connection.sender_id)}
                                disabled={processingRequest[connection.sender_id] === 'accepting'}
                                style={{ minWidth: '100px' }}
                              >
                                {processingRequest[connection.sender_id] === 'accepting' ? (
                                  <>
                                    <i className="fas fa-spinner fa-spin"></i> Accepting...
                                  </>
                                ) : (
                                  <>
                                    <i className="fas fa-check"></i> Accept
                                  </>
                                )}
                              </button>
                              <button 
                                className="btn btn-outline"
                                onClick={() => handleRejectConnection(connection.sender_id)}
                                disabled={processingRequest[connection.sender_id] === 'rejecting'}
                                style={{ minWidth: '100px' }}
                              >
                                {processingRequest[connection.sender_id] === 'rejecting' ? (
                                  <>
                                    <i className="fas fa-spinner fa-spin"></i> Declining...
                                  </>
                                ) : (
                                  <>
                                    <i className="fas fa-times"></i> Decline
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
            </>
          )}
        </section>
      </div>

      {/* Profile Modal */}
      {showProfileModal && selectedScholar && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '10px',
            padding: '30px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '20px', margin: 0 }}>Scholar Profile</h3>
              <button 
                onClick={() => setShowProfileModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'var(--primary)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '600',
                fontSize: '24px'
              }}>
                {selectedScholar.full_name?.[0]?.toUpperCase() || 'S'}
              </div>
              <div>
                <h4 style={{ fontSize: '18px', marginBottom: '5px' }}>{selectedScholar.full_name}</h4>
                <p style={{ color: 'var(--gray)', marginBottom: '5px' }}>{selectedScholar.academic_title}</p>
                <p style={{ color: 'var(--gray)' }}>{selectedScholar.institution}</p>
              </div>
            </div>
            
            <div style={{ marginTop: '20px' }}>
              <h5 style={{ fontSize: '16px', marginBottom: '10px' }}>Research Interests</h5>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {selectedScholar.research_interests?.map((interest, idx) => (
                  <span key={idx} style={{
                    background: 'var(--primary-light)',
                    color: 'var(--primary)',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '14px'
                  }}>
                    {interest}
                  </span>
                ))}
              </div>
            </div>
            
            {selectedScholar.bio && (
              <div style={{ marginTop: '20px' }}>
                <h5 style={{ fontSize: '16px', marginBottom: '10px' }}>Bio</h5>
                <p style={{ lineHeight: '1.6' }}>{selectedScholar.bio}</p>
              </div>
            )}
            
            <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button 
                className="btn btn-primary"
                onClick={() => {
                  setShowProfileModal(false);
                  handleStartChat(selectedScholar);
                }}
              >
                <i className="fas fa-envelope"></i> Send Message
              </button>
              <button 
                className="btn btn-outline"
                onClick={() => setShowProfileModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Modal */}
      {showChat && selectedChatUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '10px',
            width: '400px',
            maxWidth: '90%',
            height: '500px',
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Chat Header */}
            <div style={{
              padding: '15px 20px',
              borderBottom: '1px solid #eee',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'var(--primary)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '600'
                }}>
                  {selectedChatUser?.full_name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '16px' }}>{selectedChatUser?.full_name}</h4>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--gray)' }}>Online</p>
                </div>
              </div>
              <button 
                onClick={() => setShowChat(false)}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>
            
            {/* Chat Messages */}
            <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
              {chatMessages.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--gray)', padding: '40px 20px' }}>
                  <i className="fas fa-comments fa-2x" style={{ marginBottom: '10px', opacity: 0.5 }}></i>
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                chatMessages.map((msg, idx) => (
                  <div key={idx} style={{
                    marginBottom: '10px',
                    textAlign: msg.sender === 'me' ? 'right' : 'left'
                  }}>
                    <div style={{
                      display: 'inline-block',
                      background: msg.sender === 'me' ? 'var(--primary)' : '#f0f0f0',
                      color: msg.sender === 'me' ? 'white' : 'black',
                      padding: '10px 15px',
                      borderRadius: '15px',
                      maxWidth: '70%'
                    }}>
                      {msg.text}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--gray)', marginTop: '4px' }}>
                      {msg.time}
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* Message Input */}
            <div style={{ padding: '15px', borderTop: '1px solid #eee' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a message..."
                  style={{ flex: 1, padding: '10px 15px', border: '1px solid #ddd', borderRadius: '20px' }}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <button 
                  className="btn btn-primary"
                  onClick={handleSendMessage}
                  disabled={!message.trim()}
                  style={{ borderRadius: '20px', padding: '10px 20px' }}
                >
                  <i className="fas fa-paper-plane"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default NetworkPage;