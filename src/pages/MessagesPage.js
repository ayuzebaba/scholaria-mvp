import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/shared/Layout';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import '../styles/globals.css';

const MessagesPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [otherUser, setOtherUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchData();
    const subscription = subscribeToMessages();
    return () => subscription?.unsubscribe();
  }, [userId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch other user profile
      const { data: userData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      setOtherUser(userData);

      // Fetch messages between the two users
      const { data: messagesData } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${currentUser.id})`)
        .order('created_at', { ascending: true });

      setMessages(messagesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    return supabase
      .channel(`messages:${currentUser.id}:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `or(and(sender_id.eq.${currentUser.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${currentUser.id}))`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new]);
        }
      )
      .subscribe();
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim()) return;

    setSending(true);

    try {
      const { error } = await supabase
        .from('messages')
        .insert([{
          sender_id: currentUser.id,
          receiver_id: userId,
          content: newMessage.trim(),
          read: false,
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error sending message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container main-content">
          <div style={{ textAlign: 'center', padding: '60px 20px', gridColumn: '1 / -1' }}>
            <i className="fas fa-spinner fa-spin fa-2x" style={{ color: 'var(--primary)', marginBottom: '20px' }}></i>
            <p>Loading messages...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!otherUser) {
    return (
      <Layout>
        <div className="container main-content">
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--gray)', gridColumn: '1 / -1' }}>
            <i className="fas fa-user-slash fa-3x" style={{ marginBottom: '20px', opacity: 0.5 }}></i>
            <h3>User not found</h3>
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
          <section className="section-card" style={{ display: 'flex', flexDirection: 'column', height: '600px' }}>
            
            {/* Chat Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: '16px',
              marginBottom: '16px',
              borderBottom: '1px solid var(--border)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
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
                  {otherUser.full_name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px', color: 'var(--dark)' }}>
                    {otherUser.full_name}
                  </h2>
                  <p style={{ color: 'var(--gray)', fontSize: '13px' }}>
                    {otherUser.institution}
                  </p>
                </div>
              </div>
              <button
                className="btn btn-text"
                onClick={() => navigate(`/profile/${userId}`)}
              >
                <i className="fas fa-user"></i> View Profile
              </button>
            </div>

            {/* Messages Container */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              marginBottom: '16px',
              paddingRight: '8px'
            }}>
              {messages.length === 0 ? (
                <div style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: 'var(--gray)',
                  textAlign: 'center'
                }}>
                  <div>
                    <i className="fas fa-comments fa-3x" style={{ marginBottom: '16px', opacity: 0.3 }}></i>
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      justifyContent: msg.sender_id === currentUser.id ? 'flex-end' : 'flex-start'
                    }}
                  >
                    <div style={{
                      maxWidth: '60%',
                      background: msg.sender_id === currentUser.id ? 'var(--primary)' : 'var(--light)',
                      color: msg.sender_id === currentUser.id ? 'white' : 'var(--dark)',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      wordWrap: 'break-word',
                      lineHeight: '1.5'
                    }}>
                      <p style={{ marginBottom: 0 }}>
                        {msg.content}
                      </p>
                      <p style={{
                        fontSize: '11px',
                        opacity: msg.sender_id === currentUser.id ? 0.7 : 0.6,
                        marginTop: '6px',
                        marginBottom: 0
                      }}>
                        {new Date(msg.created_at).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Message Input Form */}
            <form
              onSubmit={handleSendMessage}
              style={{
                display: 'flex',
                gap: '12px',
                paddingTop: '16px',
                borderTop: '1px solid var(--border)'
              }}
            >
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                disabled={sending}
                style={{ 
                  flex: 1,
                  padding: '10px 14px',
                  border: '2px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  fontSize: '14px',
                  fontFamily: 'Inter, sans-serif'
                }}
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={sending || !newMessage.trim()}
              >
                {sending ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> Sending
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane"></i> Send
                  </>
                )}
              </button>
            </form>
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default MessagesPage;