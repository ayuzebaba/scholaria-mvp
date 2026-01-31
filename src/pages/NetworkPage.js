import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/shared/Layout';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import '../styles/globals.css';

const NetworkPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [scholars, setScholars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [connections, setConnections] = useState([]);
  const [activeTab, setActiveTab] = useState('discover');
  const [sendingRequest, setSendingRequest] = useState({});
  const [processingRequest, setProcessingRequest] = useState({});

  // DEBUG: Log user on load
  useEffect(() => {
    console.log('================================');
    console.log('🚀 NetworkPage Loaded');
    console.log('User from Auth Context:', user);
    console.log('User ID:', user?.id);
    console.log('================================');
  }, []);

  // DEBUG: Log whenever connections change
  useEffect(() => {
    console.log('📊 Connections Updated:', {
      totalConnections: connections.length,
      accepted: connections.filter(c => c.status === 'accepted').length,
      pending: connections.filter(c => c.status === 'pending').length,
      rejected: connections.filter(c => c.status === 'rejected').length,
      allData: connections
    });
  }, [connections]);

  useEffect(() => {
    console.log('👤 User state changed:', user);
    if (user?.id) {
      console.log('✅ User authenticated with ID:', user.id);
      fetchScholars();
      fetchConnections();
    } else {
      console.log('❌ No user ID found');
    }
  }, [user?.id]);

  const fetchScholars = async () => {
    console.log('🔄 Fetching scholars...');
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user?.id)
        .order('full_name')
        .limit(50);
      
      console.log('📚 Scholars fetch result:', { error, count: data?.length });
      
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
        console.log('✅ Scholars loaded:', scholarsWithStatus.length);
      }
    } catch (error) {
      console.error('❌ Error fetching scholars:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchConnections = async () => {
    try {
      if (!user?.id) {
        console.log('⚠️ No user ID, skipping fetchConnections');
        return;
      }
      
      console.log('🔄 Fetching connections for user:', user.id);
      
      // First, get all connections without the profile relationships
      const { data: connectionsData, error: connectionsError } = await supabase
        .from('connections')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);
      
      console.log('📡 Connections fetch result:', { 
        error: connectionsError, 
        count: connectionsData?.length,
        data: connectionsData 
      });
      
      if (connectionsError) {
        console.error('❌ Error fetching connections:', connectionsError);
        return;
      }
      
      // Then, fetch the profiles separately
      let enrichedConnections = connectionsData || [];
      
      if (enrichedConnections.length > 0) {
        const senderIds = [...new Set(enrichedConnections.map(c => c.sender_id))];
        const receiverIds = [...new Set(enrichedConnections.map(c => c.receiver_id))];
        const allUserIds = [...new Set([...senderIds, ...receiverIds])];
        
        console.log('👥 Fetching profiles for users:', allUserIds);
        
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .in('id', allUserIds);
        
        if (!profilesError && profilesData) {
          const profileMap = {};
          profilesData.forEach(p => {
            profileMap[p.id] = p;
          });
          
          enrichedConnections = connectionsData.map(conn => ({
            ...conn,
            sender: profileMap[conn.sender_id],
            receiver: profileMap[conn.receiver_id]
          }));
          
          console.log('✅ Enriched connections with profiles:', enrichedConnections);
        }
      }
      
      setConnections(enrichedConnections);
      console.log('✅ Connections loaded:', enrichedConnections.length);
      
    } catch (error) {
      console.error('❌ Error in fetchConnections:', error);
    }
  };

  const handleConnect = async (scholarId) => {
    if (!user?.id) {
      console.log('❌ No user ID, cannot connect');
      return;
    }
    
    console.log('🤝 handleConnect called:', { scholarId, userId: user.id });
    
    const incomingRequest = connections.find(conn => 
      conn.sender_id === scholarId && 
      conn.receiver_id === user.id && 
      conn.status === 'pending'
    );

    if (incomingRequest) {
      console.log('⚠️ Incoming request already exists, returning early');
      return;
    }

    setSendingRequest(prev => ({ ...prev, [scholarId]: true }));
    
    try {
      console.log('📝 Inserting connection request...');
      
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
      
      console.log('💾 Insert response:', { error, data });
      
      if (error) {
        if (error.code === '23505') {
          alert('Connection request already sent or pending!');
        } else {
          throw error;
        }
      } else {
        console.log('✅ Connection request created successfully');
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
      console.error('❌ Error sending connection request:', error);
      alert('❌ Error sending connection request');
    } finally {
      setSendingRequest(prev => ({ ...prev, [scholarId]: false }));
    }
  };

  const handleAcceptConnection = async (senderId) => {
    console.log('═══════════════════════════════');
    console.log('🔄 ACCEPT CONNECTION INITIATED');
    console.log('Sender ID:', senderId);
    console.log('Current User ID:', user?.id);
    console.log('═══════════════════════════════');
    
    // Find the pending connection from this sender
    const pendingConnection = connections.find(conn => {
      const isSender = conn.sender_id === senderId;
      const isReceiver = conn.receiver_id === user?.id;
      const isPending = conn.status === 'pending';
      
      console.log('🔍 Checking connection:', {
        connId: conn.id,
        connSenderId: conn.sender_id,
        connReceiverId: conn.receiver_id,
        connStatus: conn.status,
        isSender,
        isReceiver,
        isPending,
        match: isSender && isReceiver && isPending
      });
      
      return isSender && isReceiver && isPending;
    });
    
    console.log('📍 Found pending connection:', pendingConnection);
    
    if (!pendingConnection) {
      console.error('❌ No pending connection found');
      console.log('Available connections:', connections);
      alert('❌ No pending connection request found for this scholar');
      return;
    }
    
    console.log('✅ Pending connection found, ID:', pendingConnection.id);
    
    setProcessingRequest(prev => ({ ...prev, [senderId]: 'accepting' }));
    
    try {
      console.log('📤 Sending UPDATE to database...');
      console.log('Connection ID to update:', pendingConnection.id);
      
      const { error } = await supabase
        .from('connections')
        .update({ 
          status: 'accepted', 
          updated_at: new Date().toISOString() 
        })
        .eq('id', pendingConnection.id);
      
      console.log('💾 Database UPDATE response:', { error });
      
      // CRITICAL: Check error and STOP if it failed
      if (error) {
        console.error('❌ DATABASE UPDATE FAILED:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        alert(`❌ Database error: ${error.message}`);
        return;  // 🔑 STOP HERE - Don't continue!
      }
      
      console.log('✅ Database update succeeded!');
      
      console.log('✅ Database update succeeded, now updating local state...');
      
      // Update connections state
      setConnections(prev => {
        const updated = prev.map(conn =>
          conn.id === pendingConnection.id
            ? { ...conn, status: 'accepted', updated_at: new Date().toISOString() }
            : conn
        );
        console.log('📊 New connections state:', updated);
        return updated;
      });
      
      // Update scholars state
      setScholars(prev => prev.map(scholar => 
        scholar.id === senderId 
          ? { ...scholar, connectionStatus: 'accepted' }
          : scholar
      ));
      
      console.log('🔄 Refreshing data from database...');
      await fetchConnections();
      await fetchScholars();
      
      console.log('✅ CONNECTION ACCEPTED SUCCESSFULLY!');
      console.log('═══════════════════════════════');
      alert('✅ Connection accepted! Database updated successfully.');
      
    } catch (error) {
      console.error('❌ Error in handleAcceptConnection:', error);
      console.log('═══════════════════════════════');
      alert('❌ Error accepting connection. Please try again.');
    } finally {
      setProcessingRequest(prev => ({ ...prev, [senderId]: null }));
    }
  };

  const handleRejectConnection = async (senderId) => {
    console.log('🚫 REJECT CONNECTION INITIATED');
    console.log('Sender ID:', senderId);
    console.log('Current User ID:', user?.id);
    
    const pendingConnection = connections.find(conn => 
      conn.sender_id === senderId && 
      conn.receiver_id === user?.id && 
      conn.status === 'pending'
    );
    
    console.log('Found pending connection:', pendingConnection);
    
    if (!pendingConnection) {
      console.error('❌ No pending connection found');
      alert('❌ No pending connection request found');
      return;
    }
    
    setProcessingRequest(prev => ({ ...prev, [senderId]: 'rejecting' }));
    
    try {
      console.log('📤 Sending REJECT UPDATE to database...');
      
      const { error } = await supabase
        .from('connections')
        .update({ 
          status: 'rejected', 
          updated_at: new Date().toISOString() 
        })
        .eq('id', pendingConnection.id);
      
      console.log('💾 Database REJECT response:', { error });
      
      if (error) {
        console.error('❌ DATABASE UPDATE FAILED:', error);
        alert(`❌ Database error: ${error.message}`);
        return;
      }
      
      console.log('✅ Database reject succeeded');
      
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

        <section className="section-card">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <i className="fas fa-spinner fa-spin fa-2x" style={{ color: 'var(--primary)', marginBottom: '20px' }}></i>
              <p>Loading network...</p>
            </div>
          ) : (
            <>
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
                              
                              <div style={{ flex: 1 }}>
                                <h3 style={{ fontSize: '16px', marginBottom: '4px' }}>
                                  {scholar.full_name || 'Anonymous Scholar'}
                                </h3>
                                <p style={{ color: 'var(--gray)', fontSize: '14px', marginBottom: '8px' }}>
                                  {scholar.academic_title} • {scholar.institution}
                                </p>
                                
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
                              
                              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
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
                              
                              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                                <button 
                                  className="btn btn-outline"
                                  onClick={() => navigate(`/messages/${connectedScholar.id}`)}
                                >
                                  <i className="fas fa-envelope"></i> Message
                                </button>
                                <button 
                                  className="btn btn-text"
                                  onClick={() => navigate(`/profile/${connectedScholar.id}`)}
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
    </Layout>
  );
};

export default NetworkPage;