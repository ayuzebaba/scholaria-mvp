import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/shared/Layout';
import PaperReviews from '../components/research/PaperReviews';
import { supabase } from '../services/supabase';
import '../styles/globals.css';

const PublicReviewPage = () => {
  const navigate = useNavigate();
  const [publicPapers, setPublicPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Fetch all public papers
  useEffect(() => {
    fetchPublicPapers();
  }, []);

  const fetchPublicPapers = async () => {
    setLoading(true);
    try {
      // Get papers with author info
      const { data, error } = await supabase
        .from('papers')
        .select(`
          *,
          author:profiles(full_name, institution, academic_title, avatar_url)
        `)
        .neq('status', 'draft') // Exclude drafts
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      setPublicPapers(data || []);
    } catch (error) {
      console.error('Error fetching public papers:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter papers based on search and filters
  const filteredPapers = publicPapers.filter(paper => {
    // Search filter
    const matchesSearch = searchTerm === '' || 
      paper.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      paper.abstract.toLowerCase().includes(searchTerm.toLowerCase()) ||
      paper.keywords?.some(keyword => 
        keyword.toLowerCase().includes(searchTerm.toLowerCase())
      ) ||
      paper.author?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Status filter
    const matchesStatus = filterStatus === 'all' || paper.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'published': return 'badge-published';
      case 'under-review': return 'badge-under-review';
      case 'draft': 
      default: return 'badge-draft';
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'published': return 'Published';
      case 'under-review': return 'Under Review';
      case 'draft': 
      default: return 'Draft';
    }
  };

  const handleViewPaper = (paperId) => {
    // For now, just scroll to reviews section
    document.getElementById(`paper-${paperId}`)?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return (
      <Layout>
        <div className="container main-content">
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '400px' 
          }}>
            <div style={{ textAlign: 'center' }}>
              <i className="fas fa-spinner fa-spin fa-2x" style={{ color: 'var(--primary)', marginBottom: '20px' }}></i>
              <p>Loading public research papers...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container main-content">
        {/* Page Header */}
        <section className="section-card" style={{ marginBottom: '24px' }}>
          <div className="section-header">
            <div>
              <h1 style={{ fontSize: '24px', marginBottom: '8px' }}>
                <i className="fas fa-globe" style={{ color: 'var(--primary)', marginRight: '12px' }}></i>
                Public Review
              </h1>
              <p style={{ color: 'var(--gray)', fontSize: '14px' }}>
                Discover and review research papers from scholars worldwide. Contribute to academic discourse by providing valuable feedback.
              </p>
            </div>
            <div className="profile-stats" style={{ background: 'transparent', padding: 0, margin: 0 }}>
              <div className="stat-item">
                <div className="stat-value">{filteredPapers.length}</div>
                <div className="stat-label">Papers</div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr auto auto', 
            gap: '16px',
            marginTop: '20px'
          }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <input
                type="text"
                placeholder="Search papers by title, abstract, keywords, or author..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
            
            <div className="form-group" style={{ marginBottom: 0, minWidth: '180px' }}>
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="all">All Statuses</option>
                <option value="published">Published</option>
                <option value="under-review">Under Review</option>
              </select>
            </div>
            
            <button 
              className="btn btn-primary"
              onClick={fetchPublicPapers}
              style={{ whiteSpace: 'nowrap' }}
            >
              <i className="fas fa-sync-alt"></i>
              Refresh
            </button>
          </div>
        </section>

        {/* Papers List */}
        <section className="section-card">
          {filteredPapers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--gray)' }}>
              <i className="fas fa-search fa-3x" style={{ marginBottom: '20px', opacity: 0.5 }}></i>
              <h3 style={{ marginBottom: '12px' }}>No papers found</h3>
              <p style={{ marginBottom: '24px' }}>
                {searchTerm 
                  ? `No papers match "${searchTerm}". Try a different search term.`
                  : 'No public papers available yet. Be the first to upload a paper!'}
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button 
                  className="btn btn-outline"
                  onClick={() => setSearchTerm('')}
                >
                  Clear Search
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={() => navigate('/dashboard')}
                >
                  <i className="fas fa-upload"></i>
                  Upload Your Paper
                </button>
              </div>
            </div>
          ) : (
            <div className="papers-list">
              {filteredPapers.map((paper) => (
                <div key={paper.id} id={`paper-${paper.id}`} className="paper-card">
                  <div className="paper-header">
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                        {paper.author?.avatar_url ? (
                          <img 
                            src={paper.author.avatar_url} 
                            alt={paper.author.full_name}
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              objectFit: 'cover'
                            }}
                          />
                        ) : (
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: 'var(--primary)',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '600',
                            fontSize: '14px'
                          }}>
                            {paper.author?.full_name?.[0]?.toUpperCase() || 'A'}
                          </div>
                        )}
                        <div>
                          <h3 className="paper-title">{paper.title}</h3>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <i className="fas fa-user" style={{ color: 'var(--gray)', fontSize: '12px' }}></i>
                              <span style={{ fontSize: '13px', color: 'var(--dark)' }}>
                                {paper.author?.full_name || 'Anonymous Scholar'}
                              </span>
                            </div>
                            {paper.author?.academic_title && (
                              <span style={{ fontSize: '12px', color: 'var(--gray)' }}>
                                {paper.author.academic_title}
                              </span>
                            )}
                            {paper.author?.institution && (
                              <span style={{ fontSize: '12px', color: 'var(--primary)' }}>
                                <i className="fas fa-university" style={{ marginRight: '4px' }}></i>
                                {paper.author.institution}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="paper-meta">
                        <span><i className="far fa-calendar"></i> {formatDate(paper.created_at)}</span>
                        <span><i className="fas fa-quote-right"></i> {paper.citation_count || 0} citations</span>
                        <span><i className="fas fa-eye"></i> {paper.view_count || 0} views</span>
                        {paper.keywords?.length > 0 && (
                          <span><i className="fas fa-tags"></i> {paper.keywords.slice(0, 3).join(', ')}</span>
                        )}
                        {paper.file_url && (
                          <span><i className="fas fa-file-pdf"></i> PDF Available</span>
                        )}
                      </div>
                    </div>
                    <span className={`badge ${getStatusBadgeClass(paper.status)}`}>
                      {getStatusText(paper.status)}
                    </span>
                  </div>
                  
                  <p className="paper-abstract">
                    {paper.abstract || 'No abstract provided.'}
                    {paper.abstract && paper.abstract.length > 300 && '...'}
                  </p>
                  
                  <div className="paper-actions">
                    {paper.file_url && (
                      <a 
                        href={paper.file_url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="btn btn-text"
                      >
                        <i className="fas fa-download"></i> Download
                      </a>
                    )}
                    <button 
                      className="btn btn-text"
                      onClick={() => handleViewPaper(paper.id)}
                    >
                      <i className="far fa-eye"></i> View Paper
                    </button>
                    <button 
                      className="btn btn-primary"
                      onClick={() => document.getElementById(`reviews-${paper.id}`)?.scrollIntoView({ behavior: 'smooth' })}
                    >
                      <i className="fas fa-star"></i> Review This Paper
                    </button>
                  </div>
                  
                  {/* Reviews Section */}
                  <div id={`reviews-${paper.id}`} style={{ marginTop: '24px' }}>
                    <PaperReviews paperId={paper.id} />
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Stats Footer */}
          {filteredPapers.length > 0 && (
            <div style={{ 
              marginTop: '30px', 
              paddingTop: '20px', 
              borderTop: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '14px',
              color: 'var(--gray)'
            }}>
              <div>
                Showing {filteredPapers.length} of {publicPapers.length} papers
              </div>
              <div style={{ display: 'flex', gap: '20px' }}>
                <div>
                  <i className="fas fa-file-alt" style={{ marginRight: '6px' }}></i>
                  {publicPapers.filter(p => p.status === 'published').length} Published
                </div>
                <div>
                  <i className="fas fa-star" style={{ marginRight: '6px' }}></i>
                  {publicPapers.filter(p => p.status === 'under-review').length} Under Review
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
};

export default PublicReviewPage;