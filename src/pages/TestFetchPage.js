// TestFetchPage.js - With CRUD Operations (Fixed confirm issue)
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/shared/Layout';
import '../styles/globals.css';

const TestFetchPage = () => {
  const { user } = useAuth();
  const [testData, setTestData] = useState('Waiting...');
  const [counter, setCounter] = useState(0);
  const [crudData, setCrudData] = useState([]);
  const [newItem, setNewItem] = useState({ title: '', description: '' });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  
  // Table name for CRUD operations
  const CRUD_TABLE = 'test_items';
  
  // Fetch from existing profiles table
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
  
  // CRUD Functions
  const fetchCrudData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from(CRUD_TABLE)
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setCrudData(data || []);
    } catch (error) {
      console.error('Error fetching CRUD data:', error);
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const createItem = async () => {
    if (!newItem.title.trim()) {
      alert('Title is required!');
      return;
    }
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from(CRUD_TABLE)
        .insert([{
          title: newItem.title,
          description: newItem.description,
          user_id: user?.id,
          status: 'active'
        }])
        .select();
      
      if (error) throw error;
      
      setNewItem({ title: '', description: '' });
      fetchCrudData();
      alert('Item created successfully!');
    } catch (error) {
      console.error('Error creating item:', error);
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const updateItem = async (id) => {
    if (!newItem.title.trim()) {
      alert('Title is required!');
      return;
    }
    
    try {
      setLoading(true);
      const { error } = await supabase
        .from(CRUD_TABLE)
        .update({
          title: newItem.title,
          description: newItem.description,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;
      
      setEditingId(null);
      setNewItem({ title: '', description: '' });
      fetchCrudData();
      alert('Item updated successfully!');
    } catch (error) {
      console.error('Error updating item:', error);
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Show delete confirmation
  const showDeleteConfirmation = (id) => {
    setItemToDelete(id);
    setShowDeleteConfirm(true);
  };
  
  // Actually delete the item
  const confirmDelete = async () => {
    if (!itemToDelete) return;
    
    try {
      setLoading(true);
      const { error } = await supabase
        .from(CRUD_TABLE)
        .delete()
        .eq('id', itemToDelete);
      
      if (error) throw error;
      
      fetchCrudData();
      alert('Item deleted successfully!');
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
      setItemToDelete(null);
    }
  };
  
  // Cancel delete
  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setItemToDelete(null);
  };
  
  const startEdit = (item) => {
    setEditingId(item.id);
    setNewItem({ title: item.title, description: item.description || '' });
  };
  
  const cancelEdit = () => {
    setEditingId(null);
    setNewItem({ title: '', description: '' });
  };
  
  const handleClick = () => {
    setCounter(prev => prev + 1);
    fetchTestData();
  };
  
  // Initial fetch
  useEffect(() => {
    fetchTestData();
    fetchCrudData();
  }, []);
  
  const doubleCounter = counter * 2;
  const isEven = counter % 2 === 0;
  const currentTime = new Date().toLocaleTimeString();
  
  return (
    <Layout>
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '10px',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ marginBottom: '15px' }}>
              <i className="fas fa-exclamation-triangle" style={{ color: '#dc3545', marginRight: '10px' }}></i>
              Confirm Delete
            </h3>
            <p style={{ marginBottom: '20px' }}>
              Are you sure you want to delete this item? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button 
                className="btn btn-outline"
                onClick={cancelDelete}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                className="btn btn-danger"
                onClick={confirmDelete}
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div style={{ 
        maxWidth: '95vw',
        width: '100%',
        margin: '0 auto',
        padding: '20px',
        background: 'var(--light)',
        minHeight: '100vh'
      }}>
        
        <section style={{ 
          background: 'white',
          borderRadius: '12px',
          padding: '30px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          width: '100%',
          maxWidth: '100%'
        }}>
          
          <h1 style={{ 
            fontSize: '28px', 
            marginBottom: '20px',
            color: 'var(--primary)',
            borderBottom: '3px solid var(--primary)',
            paddingBottom: '10px'
          }}>
            <i className="fas fa-database" style={{ marginRight: '12px' }}></i>
            Database CRUD Operations Test
          </h1>
          
          {/* 4 CARDS GRID */}
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px',
            marginBottom: '30px'
          }}>
            
            {/* Card 1: Existing Database Read */}
            <div style={{ 
              background: '#f8f9fa', 
              padding: '20px', 
              borderRadius: '8px',
              border: '1px solid #dee2e6'
            }}>
              <h3><i className="fas fa-table"></i> 📊 Existing Table Read</h3>
              <p><strong>Table:</strong> profiles</p>
              <p><strong>Data:</strong> {testData}</p>
              <button 
                className="btn btn-sm btn-primary"
                onClick={fetchTestData}
                style={{ marginTop: '10px' }}
              >
                <i className="fas fa-sync"></i> Refresh
              </button>
            </div>
            
            {/* Card 2: CRUD Operations Form */}
            <div style={{ 
              background: '#e8f4fd', 
              padding: '20px', 
              borderRadius: '8px',
              border: '2px solid #4dabf7'
            }}>
              <h3><i className="fas fa-plus-circle"></i> 🎯 CRUD Operations</h3>
              <p><strong>Table:</strong> {CRUD_TABLE}</p>
              
              <div style={{ marginTop: '15px' }}>
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Title *
                  </label>
                  <input
                    type="text"
                    value={newItem.title}
                    onChange={(e) => setNewItem({...newItem, title: e.target.value})}
                    placeholder="Enter title"
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid #ddd'
                    }}
                  />
                </div>
                
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Description
                  </label>
                  <input
                    type="text"
                    value={newItem.description}
                    onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                    placeholder="Enter description"
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid #ddd'
                    }}
                  />
                </div>
                
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {editingId ? (
                    <>
                      <button 
                        className="btn btn-warning"
                        onClick={() => updateItem(editingId)}
                        disabled={loading}
                        style={{ padding: '8px 16px' }}
                      >
                        <i className="fas fa-save"></i> Update
                      </button>
                      <button 
                        className="btn btn-outline"
                        onClick={cancelEdit}
                        style={{ padding: '8px 16px' }}
                      >
                        <i className="fas fa-times"></i> Cancel
                      </button>
                    </>
                  ) : (
                    <button 
                      className="btn btn-success"
                      onClick={createItem}
                      disabled={loading}
                      style={{ padding: '8px 16px' }}
                    >
                      <i className="fas fa-plus"></i> Create
                    </button>
                  )}
                  
                  <button 
                    className="btn btn-info"
                    onClick={fetchCrudData}
                    disabled={loading}
                    style={{ padding: '8px 16px' }}
                  >
                    <i className="fas fa-redo"></i> Refresh
                  </button>
                </div>
              </div>
            </div>
            
            {/* Card 3: Counter */}
            <div style={{ 
              background: '#f8f9fa', 
              padding: '20px', 
              borderRadius: '8px',
              border: '1px solid #dee2e6'
            }}>
              <h3><i className="fas fa-calculator"></i> 🧮 Counter</h3>
              <p><strong>Count:</strong> {counter}</p>
              <p><strong>Double:</strong> {doubleCounter}</p>
              <p><strong>Even?:</strong> {isEven ? '✅ Yes' : '❌ No'}</p>
              <button 
                className="btn btn-sm btn-primary"
                onClick={() => setCounter(prev => prev + 1)}
                style={{ marginTop: '10px' }}
              >
                <i className="fas fa-plus"></i> Increment
              </button>
            </div>
            
            {/* Card 4: Time */}
            <div style={{ 
              background: '#f8f9fa', 
              padding: '20px', 
              borderRadius: '8px',
              border: '1px solid #dee2e6'
            }}>
              <h3><i className="fas fa-clock"></i> ⏰ Time</h3>
              <p><strong>Current:</strong> {currentTime}</p>
              <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
              <p><strong>User ID:</strong> {user?.id ? user.id.substring(0, 8) + '...' : 'Not logged in'}</p>
            </div>
          </div>
          
          {/* CRUD DATA TABLE */}
          <div style={{ 
            marginTop: '30px',
            background: '#f8f9fa',
            borderRadius: '8px',
            padding: '20px',
            border: '1px solid #dee2e6'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0 }}>
                <i className="fas fa-list"></i> 📋 {CRUD_TABLE} Table Data ({crudData.length} items)
              </h3>
              <button 
                className="btn btn-sm btn-outline"
                onClick={fetchCrudData}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Refresh Data'}
              </button>
            </div>
            
            {loading ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <i className="fas fa-spinner fa-spin" style={{ marginRight: '10px' }}></i>
                Loading data...
              </div>
            ) : crudData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#6c757d' }}>
                <i className="fas fa-inbox" style={{ fontSize: '48px', marginBottom: '10px', opacity: 0.5 }}></i>
                <p>No data yet. Create your first item!</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#e9ecef' }}>
                      <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>ID</th>
                      <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Title</th>
                      <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Description</th>
                      <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Created</th>
                      <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {crudData.map((item) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                        <td style={{ padding: '10px' }}>{item.id.substring(0, 8)}...</td>
                        <td style={{ padding: '10px', fontWeight: 'bold' }}>{item.title}</td>
                        <td style={{ padding: '10px' }}>{item.description || '-'}</td>
                        <td style={{ padding: '10px' }}>
                          {new Date(item.created_at).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '10px' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                              className="btn btn-sm btn-warning"
                              onClick={() => startEdit(item)}
                              style={{ padding: '4px 8px' }}
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button 
                              className="btn btn-sm btn-danger"
                              onClick={() => showDeleteConfirmation(item.id)}
                              style={{ padding: '4px 8px' }}
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          {/* ACTION BUTTONS */}
          <div style={{ 
            display: 'flex', 
            gap: '15px',
            marginTop: '30px',
            marginBottom: '30px',
            flexWrap: 'wrap'
          }}>
            <button 
              className="btn btn-primary"
              onClick={handleClick}
              style={{ padding: '12px 24px', fontSize: '16px' }}
            >
              <i className="fas fa-sync-alt"></i> Fetch Profiles & Count
            </button>
            
            <button 
              className="btn btn-success"
              onClick={() => setCounter(0)}
              style={{ padding: '12px 24px', fontSize: '16px' }}
            >
              <i className="fas fa-redo"></i> Reset Counter
            </button>
            
            <button 
              className="btn btn-outline"
              onClick={() => window.alert(`Total CRUD items: ${crudData.length}\nCounter: ${counter}`)}
              style={{ padding: '12px 24px', fontSize: '16px' }}
            >
              <i className="fas fa-info-circle"></i> Show Stats
            </button>
          </div>
          
          {/* TABLE STATUS INFO */}
          <div style={{ 
            marginTop: '30px', 
            padding: '15px',
            background: '#e9ecef',
            borderRadius: '8px',
            fontSize: '14px',
            color: '#6c757d'
          }}>
            <p><strong>Table Status:</strong> Using "{CRUD_TABLE}" table</p>
            <p><strong>Items Displayed:</strong> {crudData.length}</p>
            <p><strong>User ID:</strong> {user?.id ? 'Authenticated' : 'Not logged in'}</p>
          </div>
          
        </section>
      </div>
    </Layout>
  );
};

export default TestFetchPage;