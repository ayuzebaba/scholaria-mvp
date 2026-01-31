// TestFetchPage.js - With WIDER PANEL for testing only
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/shared/Layout';
import '../styles/globals.css';

const TestFetchPage = () => {
  const { user } = useAuth();
  const [testData, setTestData] = useState('Waiting...');
  const [counter, setCounter] = useState(0);
  
  const fetchTestData = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, institution')
        .limit(1);
      
      if (error) throw error;
      setTestData(data[0] ? `${data[0].full_name} from ${data[0].institution}` : 'No data');
      
    } catch (error) {
      console.error('Test error:', error);
      setTestData('Error fetching data');
    }
  };
  
  const handleClick = () => {
    setCounter(prev => prev + 1);
    fetchTestData();
  };
  
  useEffect(() => {
    fetchTestData();
  }, []);
  
  const doubleCounter = counter * 2;
  const isEven = counter % 2 === 0;
  const currentTime = new Date().toLocaleTimeString();
  
  return (
    <Layout>
      {/* WIDER CONTAINER - ONLY FOR THIS PAGE */}
      <div style={{ 
        maxWidth: '95vw', // ← 95% of viewport width (VERY WIDE!)
        width: '100%',
        margin: '0 auto',
        padding: '20px',
        background: 'var(--light)',
        minHeight: '100vh'
      }}>
        
        {/* WIDER CARD */}
        <section style={{ 
          background: 'white',
          borderRadius: '12px',
          padding: '30px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          width: '100%', // ← Full width of container
          maxWidth: '100%'
        }}>
          
          <h1 style={{ 
            fontSize: '28px', 
            marginBottom: '20px',
            color: 'var(--primary)',
            borderBottom: '3px solid var(--primary)',
            paddingBottom: '10px'
          }}>
            <i className="fas fa-expand-alt" style={{ marginRight: '12px' }}></i>
            WIDE PANEL JavaScript Test
          </h1>
          
          {/* WIDE CONTENT AREA */}
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px',
            marginBottom: '30px'
          }}>
            
            {/* Card 1 */}
            <div style={{ 
              background: '#f8f9fa', 
              padding: '20px', 
              borderRadius: '8px',
              border: '1px solid #dee2e6'
            }}>
              <h3>📊 User Info</h3>
              <p><strong>User ID:</strong> {user?.id || 'Not logged in'}</p>
              <p><strong>Test Data:</strong> {testData}</p>
            </div>
            
            {/* Card 2 */}
            <div style={{ 
              background: '#f8f9fa', 
              padding: '20px', 
              borderRadius: '8px',
              border: '1px solid #dee2e6'
            }}>
              <h3>🧮 Counter</h3>
              <p><strong>Count:</strong> {counter}</p>
              <p><strong>Double:</strong> {doubleCounter}</p>
              <p><strong>Even?:</strong> {isEven ? '✅ Yes' : '❌ No'}</p>
            </div>
            
            {/* Card 3 */}
            <div style={{ 
              background: '#f8f9fa', 
              padding: '20px', 
              borderRadius: '8px',
              border: '1px solid #dee2e6'
            }}>
              <h3>⏰ Time</h3>
              <p><strong>Current:</strong> {currentTime}</p>
              <p><strong>Page loaded:</strong> {new Date().toLocaleDateString()}</p>
            </div>
            
          </div>
          
          {/* WIDE BUTTON ROW */}
          <div style={{ 
            display: 'flex', 
            gap: '15px',
            marginBottom: '30px',
            flexWrap: 'wrap'
          }}>
            <button 
              className="btn btn-primary"
              onClick={handleClick}
              style={{ padding: '12px 24px', fontSize: '16px' }}
            >
              <i className="fas fa-sync-alt"></i> Fetch & Count
            </button>
            
            <button 
              className="btn btn-outline"
              onClick={() => alert(`Counter: ${counter}`)}
              style={{ padding: '12px 24px', fontSize: '16px' }}
            >
              <i className="fas fa-bell"></i> Show Alert
            </button>
            
            <button 
              className="btn btn-success"
              onClick={() => setCounter(0)}
              style={{ padding: '12px 24px', fontSize: '16px' }}
            >
              <i className="fas fa-redo"></i> Reset Counter
            </button>
          </div>
          
          {/* WIDE ARRAY DISPLAY */}
          {counter > 0 && (
            <div style={{ 
              marginTop: '20px',
              padding: '20px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '10px',
              color: 'white'
            }}>
              <h3 style={{ color: 'white', marginBottom: '15px' }}>
                Array Test (.map() demonstration)
              </h3>
              <div style={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: '15px'
              }}>
                {Array.from({ length: counter }, (_, i) => i + 1).map(num => (
                  <div 
                    key={num}
                    style={{ 
                      background: 'rgba(255,255,255,0.2)',
                      padding: '15px',
                      borderRadius: '8px',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      fontSize: '18px',
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    Item #{num}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* DEBUG INFO - Hidden but useful */}
          <div style={{ 
            marginTop: '30px', 
            padding: '15px',
            background: '#e9ecef',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#6c757d'
          }}>
            <p><strong>Panel Width:</strong> ~95% of screen</p>
            <p><strong>Container:</strong> Custom inline styles (no global.css changes)</p>
            <p><strong>Test-only:</strong> This wide layout affects only this page</p>
          </div>
          
        </section>
      </div>
    </Layout>
  );
};

export default TestFetchPage;