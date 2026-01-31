import React, { useState, useEffect } from 'react';
import Layout from '../components/shared/Layout';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import '../styles/globals.css';

const AnalyticsPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPapers: 0,
    totalCitations: 0,
    hIndex: 0,
    papersByYear: [],
    topCitedPapers: [],
    recentActivity: [],
    avgCitationsPerPaper: 0,
    papersThisYear: 0
  });
  const [lastUpdated, setLastUpdated] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (user?.id) {
      fetchAnalytics();
    }
  }, [user?.id]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Get all user's papers
      const { data: papers, error } = await supabase
        .from('papers')
        .select('*')
        .eq('author_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Calculate basic stats
      const totalCitations = papers?.reduce((sum, paper) => sum + (paper.citation_count || 0), 0) || 0;
      const avgCitationsPerPaper = papers?.length ? totalCitations / papers.length : 0;
      
      // Group papers by year
      const papersByYear = {};
      papers?.forEach(paper => {
        const year = new Date(paper.created_at).getFullYear();
        papersByYear[year] = (papersByYear[year] || 0) + 1;
      });
      
      // Calculate h-index (simplified)
      const citationCounts = papers?.map(p => p.citation_count || 0).sort((a, b) => b - a) || [];
      let hIndex = 0;
      for (let i = 0; i < citationCounts.length; i++) {
        if (citationCounts[i] >= i + 1) {
          hIndex = i + 1;
        } else {
          break;
        }
      }

      // Get papers this year
      const currentYear = new Date().getFullYear();
      const papersThisYear = papers?.filter(p => 
        new Date(p.created_at).getFullYear() === currentYear
      ).length || 0;

      // Get top cited papers
      const topCitedPapers = [...(papers || [])]
        .sort((a, b) => (b.citation_count || 0) - (a.citation_count || 0))
        .slice(0, 5);

      // Get recent activity (recent papers)
      const recentActivity = papers?.slice(0, 5) || [];

      setStats({
        totalPapers: papers?.length || 0,
        totalCitations,
        hIndex,
        papersByYear: Object.entries(papersByYear).map(([year, count]) => ({ year, count })),
        topCitedPapers,
        recentActivity,
        avgCitationsPerPaper: parseFloat(avgCitationsPerPaper.toFixed(2)),
        papersThisYear
      });

      setLastUpdated(new Date());

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportAnalytics = () => {
    const csv = [
      ['Research Analytics Export', ''],
      ['Generated', new Date().toLocaleDateString()],
      ['', ''],
      ['Metric', 'Value'],
      ['Total Papers', stats.totalPapers],
      ['Total Citations', stats.totalCitations],
      ['h-index', stats.hIndex],
      ['Average Citations per Paper', stats.avgCitationsPerPaper],
      ['Papers This Year', stats.papersThisYear],
      ['Years Active', stats.papersByYear.length],
      ['', ''],
      ['Year', 'Papers Published'],
      ...stats.papersByYear.map(({ year, count }) => [year, count]),
      ['', ''],
      ['Top Cited Papers', 'Citations'],
      ...stats.topCitedPapers.map(paper => [paper.title, paper.citation_count || 0])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `research_analytics_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getColorForMetric = (value, goodThreshold, mediumThreshold) => {
    if (value >= goodThreshold) return 'var(--success)';
    if (value >= mediumThreshold) return 'var(--warning)';
    return 'var(--danger)';
  };

  if (loading) {
    return (
      <Layout>
        <div className="container main-content">
          <div style={{ textAlign: 'center', padding: '60px 20px', gridColumn: '1 / -1' }}>
            <i className="fas fa-spinner fa-spin fa-2x" style={{ color: 'var(--primary)', marginBottom: '20px' }}></i>
            <p>Loading analytics...</p>
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
          <div className="section-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '16px' }}>
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h1 style={{ fontSize: '24px', marginBottom: '8px' }}>
                  <i className="fas fa-chart-line" style={{ color: 'var(--primary)', marginRight: '12px' }}></i>
                  Research Analytics
                </h1>
                <p style={{ color: 'var(--gray)', fontSize: '14px' }}>
                  Track your research impact, citations, and publication trends.
                </p>
              </div>
              <button 
                className="btn btn-outline" 
                onClick={exportAnalytics}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <i className="fas fa-download"></i> Export Data
              </button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '4px', width: '100%', flexWrap: 'wrap' }}>
              <button 
                className={`btn ${activeTab === 'overview' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setActiveTab('overview')}
                style={{ minWidth: '100px' }}
              >
                <i className="fas fa-tachometer-alt"></i> Overview
              </button>
              <button 
                className={`btn ${activeTab === 'papers' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setActiveTab('papers')}
                style={{ minWidth: '100px' }}
              >
                <i className="fas fa-file-alt"></i> Papers
              </button>
              <button 
                className={`btn ${activeTab === 'citations' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setActiveTab('citations')}
                style={{ minWidth: '100px' }}
              >
                <i className="fas fa-quote-right"></i> Citations
              </button>
              <button 
                className={`btn ${activeTab === 'insights' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setActiveTab('insights')}
                style={{ minWidth: '100px' }}
              >
                <i className="fas fa-lightbulb"></i> Insights
              </button>
            </div>

            {lastUpdated && (
              <p style={{ fontSize: '12px', color: 'var(--gray)', marginTop: '4px' }}>
                <i className="far fa-clock"></i> Last updated: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
        </section>

        {/* Stats Cards - Always Visible */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '16px', 
          marginBottom: '24px' 
        }}>
          {/* Total Papers Card */}
          <div className="section-card" style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ 
              width: '60px', 
              height: '60px', 
              borderRadius: '50%', 
              background: 'var(--primary-light)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              margin: '0 auto 12px'
            }}>
              <i className="fas fa-file-alt fa-2x" style={{ color: 'var(--primary)' }}></i>
            </div>
            <div className="stat-value" style={{ fontSize: '32px', fontWeight: '700', color: getColorForMetric(stats.totalPapers, 20, 10) }}>
              {stats.totalPapers}
            </div>
            <div className="stat-label" style={{ color: 'var(--gray)', fontSize: '14px' }}>
              Total Papers
            </div>
            <div style={{ fontSize: '12px', color: 'var(--gray)', marginTop: '8px' }}>
              {stats.papersThisYear} this year
            </div>
          </div>

          {/* Total Citations Card */}
          <div className="section-card" style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ 
              width: '60px', 
              height: '60px', 
              borderRadius: '50%', 
              background: 'var(--success-light)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              margin: '0 auto 12px'
            }}>
              <i className="fas fa-quote-right fa-2x" style={{ color: 'var(--success)' }}></i>
            </div>
            <div className="stat-value" style={{ fontSize: '32px', fontWeight: '700', color: getColorForMetric(stats.totalCitations, 100, 50) }}>
              {stats.totalCitations}
            </div>
            <div className="stat-label" style={{ color: 'var(--gray)', fontSize: '14px' }}>
              Total Citations
            </div>
            <div style={{ fontSize: '12px', color: 'var(--gray)', marginTop: '8px' }}>
              Avg: {stats.avgCitationsPerPaper} per paper
            </div>
          </div>

          {/* h-index Card */}
          <div className="section-card" style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ 
              width: '60px', 
              height: '60px', 
              borderRadius: '50%', 
              background: 'var(--warning-light)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              margin: '0 auto 12px'
            }}>
              <i className="fas fa-chart-bar fa-2x" style={{ color: 'var(--warning)' }}></i>
            </div>
            <div className="stat-value" style={{ fontSize: '32px', fontWeight: '700', color: getColorForMetric(stats.hIndex, 10, 5) }}>
              {stats.hIndex}
            </div>
            <div className="stat-label" style={{ color: 'var(--gray)', fontSize: '14px' }}>
              h-index
            </div>
            <div style={{ fontSize: '12px', color: 'var(--gray)', marginTop: '8px' }}>
              {stats.hIndex >= 10 ? 'Excellent!' : stats.hIndex >= 5 ? 'Good' : 'Growing'}
            </div>
          </div>

          {/* Years Active Card */}
          <div className="section-card" style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ 
              width: '60px', 
              height: '60px', 
              borderRadius: '50%', 
              background: 'var(--info-light)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              margin: '0 auto 12px'
            }}>
              <i className="fas fa-calendar-alt fa-2x" style={{ color: 'var(--info)' }}></i>
            </div>
            <div className="stat-value" style={{ fontSize: '32px', fontWeight: '700' }}>
              {stats.papersByYear.length}
            </div>
            <div className="stat-label" style={{ color: 'var(--gray)', fontSize: '14px' }}>
              Years Active
            </div>
            <div style={{ fontSize: '12px', color: 'var(--gray)', marginTop: '8px' }}>
              Since {stats.papersByYear[0]?.year || 'N/A'}
            </div>
          </div>
        </div>

        {/* Publication Goal Progress */}
        <section className="section-card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '16px', margin: 0 }}>
              <i className="fas fa-bullseye"></i> Publication Goal: 20 papers
            </h3>
            <span style={{ fontSize: '14px', color: 'var(--gray)' }}>
              {stats.totalPapers} of 20 ({Math.round((stats.totalPapers / 20) * 100)}%)
            </span>
          </div>
          <div style={{ 
            width: '100%', 
            height: '20px', 
            background: '#e9ecef', 
            borderRadius: '10px',
            overflow: 'hidden'
          }}>
            <div style={{ 
              width: `${Math.min((stats.totalPapers / 20) * 100, 100)}%`, 
              height: '100%', 
              background: 'var(--primary)',
              transition: 'width 0.5s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              paddingRight: '10px'
            }}>
              <span style={{ color: 'white', fontSize: '12px', fontWeight: '600' }}>
                {stats.totalPapers}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--gray)' }}>0</span>
            <span style={{ fontSize: '13px', color: 'var(--gray)' }}>10</span>
            <span style={{ fontSize: '13px', color: 'var(--gray)' }}>20</span>
          </div>
          {stats.totalPapers < 20 && (
            <p style={{ fontSize: '13px', color: 'var(--gray)', marginTop: '12px', marginBottom: 0 }}>
              <i className="fas fa-info-circle"></i> {20 - stats.totalPapers} more papers needed to reach your goal
            </p>
          )}
        </section>

        {/* Content based on active tab */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gap: '24px' }}>
            {/* Recent Papers */}
            <section className="section-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 className="section-title" style={{ margin: 0 }}>
                  <i className="fas fa-clock"></i> Recent Papers
                </h2>
                <span style={{ fontSize: '14px', color: 'var(--gray)' }}>
                  {stats.recentActivity.length} papers
                </span>
              </div>
              {stats.recentActivity.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--gray)' }}>
                  <i className="fas fa-file-alt fa-2x" style={{ marginBottom: '12px', opacity: 0.5 }}></i>
                  <p>No papers published yet</p>
                  <button 
                    className="btn btn-primary"
                    onClick={() => window.location.href = '/dashboard'}
                    style={{ marginTop: '12px' }}
                  >
                    <i className="fas fa-plus"></i> Add Your First Paper
                  </button>
                </div>
              ) : (
                <div className="papers-list">
                  {stats.recentActivity.map((paper) => (
                    <div key={paper.id} className="paper-card">
                      <div className="paper-header">
                        <div style={{ flex: 1 }}>
                          <h3 className="paper-title">{paper.title}</h3>
                          <div className="paper-meta">
                            <span><i className="far fa-calendar"></i> {new Date(paper.created_at).toLocaleDateString()}</span>
                            <span><i className="fas fa-quote-right"></i> {paper.citation_count || 0} citations</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Papers by Year Chart */}
            <section className="section-card">
              <h2 className="section-title">
                <i className="fas fa-chart-bar"></i> Publications by Year
              </h2>
              {stats.papersByYear.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--gray)' }}>
                  <i className="fas fa-chart-bar fa-2x" style={{ marginBottom: '12px', opacity: 0.5 }}></i>
                  <p>No publication data available</p>
                </div>
              ) : (
                <div style={{ padding: '20px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', height: '200px' }}>
                    {stats.papersByYear.map((item, index) => {
                      const maxCount = Math.max(...stats.papersByYear.map(p => p.count));
                      const height = maxCount > 0 ? (item.count / maxCount) * 150 : 0;
                      
                      return (
                        <div key={index} style={{ flex: 1, textAlign: 'center' }}>
                          <div style={{
                            height: `${height}px`,
                            background: 'var(--primary)',
                            borderRadius: '4px 4px 0 0',
                            marginBottom: '8px',
                            position: 'relative'
                          }}>
                            <div style={{
                              position: 'absolute',
                              top: '-25px',
                              left: '0',
                              right: '0',
                              textAlign: 'center',
                              fontSize: '14px',
                              fontWeight: '600'
                            }}>
                              {item.count}
                            </div>
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--gray)' }}>{item.year}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>
          </div>
        )}

        {activeTab === 'papers' && (
          <section className="section-card">
            <h2 className="section-title">
              <i className="fas fa-file-alt"></i> Paper Analytics
            </h2>
            <p style={{ color: 'var(--gray)', marginBottom: '20px' }}>
              Detailed statistics about your publications.
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div style={{ background: 'var(--light)', padding: '16px', borderRadius: '8px' }}>
                <h4 style={{ fontSize: '14px', color: 'var(--gray)', marginBottom: '8px' }}>Most Productive Year</h4>
                <div style={{ fontSize: '24px', fontWeight: '700' }}>
                  {stats.papersByYear.length > 0 
                    ? Math.max(...stats.papersByYear.map(p => p.count))
                    : 0} papers
                </div>
                <div style={{ fontSize: '13px', color: 'var(--gray)' }}>
                  {stats.papersByYear.length > 0 
                    ? stats.papersByYear.reduce((max, curr) => curr.count > max.count ? curr : max).year
                    : 'N/A'}
                </div>
              </div>
              
              <div style={{ background: 'var(--light)', padding: '16px', borderRadius: '8px' }}>
                <h4 style={{ fontSize: '14px', color: 'var(--gray)', marginBottom: '8px' }}>Average per Year</h4>
                <div style={{ fontSize: '24px', fontWeight: '700' }}>
                  {stats.papersByYear.length > 0
                    ? (stats.totalPapers / stats.papersByYear.length).toFixed(1)
                    : 0}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--gray)' }}>
                  papers per year
                </div>
              </div>
            </div>
            
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--gray)' }}>
              <i className="fas fa-chart-pie fa-2x" style={{ marginBottom: '12px', opacity: 0.5 }}></i>
              <p>Advanced paper analytics coming soon!</p>
            </div>
          </section>
        )}

        {activeTab === 'citations' && (
          <section className="section-card">
            <h2 className="section-title">
              <i className="fas fa-quote-right"></i> Citation Analysis
            </h2>
            <p style={{ color: 'var(--gray)', marginBottom: '20px' }}>
              Track your citation impact and growth.
            </p>
            
            {stats.topCitedPapers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--gray)' }}>
                <i className="fas fa-quote-right fa-2x" style={{ marginBottom: '12px', opacity: 0.5 }}></i>
                <p>No citation data available yet</p>
                <p style={{ fontSize: '13px', marginTop: '8px' }}>
                  Citations will appear when your papers are cited by other researchers
                </p>
              </div>
            ) : (
              <div>
                <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>Top Cited Papers</h3>
                <div className="papers-list">
                  {stats.topCitedPapers.map((paper, index) => (
                    <div key={paper.id} className="paper-card">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: index === 0 ? 'var(--gold)' : index === 1 ? 'var(--silver)' : index === 2 ? 'var(--bronze)' : 'var(--primary-light)',
                          color: index < 3 ? 'white' : 'var(--primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '600',
                          fontSize: '16px',
                          flexShrink: 0
                        }}>
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                        </div>
                        <div style={{ flex: 1 }}>
                          <h3 className="paper-title">{paper.title}</h3>
                          <div className="paper-meta">
                            <span><i className="far fa-calendar"></i> {new Date(paper.created_at).toLocaleDateString()}</span>
                            <span><i className="fas fa-quote-right"></i> {paper.citation_count || 0} citations</span>
                          </div>
                        </div>
                        <div style={{
                          background: 'var(--success-light)',
                          color: 'var(--success)',
                          padding: '6px 12px',
                          borderRadius: '20px',
                          fontWeight: '600',
                          fontSize: '14px'
                        }}>
                          {paper.citation_count || 0} cites
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {activeTab === 'insights' && (
          <section className="section-card">
            <h2 className="section-title">
              <i className="fas fa-lightbulb"></i> AI Insights
            </h2>
            <p style={{ color: 'var(--gray)', marginBottom: '20px' }}>
              Intelligent recommendations based on your research profile.
            </p>
            
            <div style={{ 
              background: 'linear-gradient(135deg, var(--primary-light) 0%, var(--info-light) 100%)', 
              padding: '24px', 
              borderRadius: '12px',
              marginBottom: '24px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  background: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <i className="fas fa-robot fa-2x" style={{ color: 'var(--primary)' }}></i>
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', margin: 0 }}>Scholaria AI Assistant</h3>
                  <p style={{ fontSize: '14px', color: 'var(--gray)', margin: 0 }}>Powered by advanced analytics</p>
                </div>
              </div>
              
              <div style={{ background: 'rgba(255,255,255,0.9)', padding: '16px', borderRadius: '8px' }}>
                <p style={{ marginBottom: '12px' }}>
                  <strong>Based on your current research profile:</strong>
                </p>
                <ul style={{ paddingLeft: '20px', marginBottom: '16px' }}>
                  {stats.totalPapers < 5 && <li>Focus on publishing more papers to increase visibility</li>}
                  {stats.hIndex < 5 && <li>Consider collaborating with established researchers to boost citations</li>}
                  {stats.papersThisYear === 0 && <li>Aim to publish at least 1-2 papers per year to maintain activity</li>}
                  {stats.avgCitationsPerPaper < 2 && <li>Target higher-impact journals for future publications</li>}
                </ul>
                <p style={{ fontSize: '13px', color: 'var(--gray)', marginBottom: 0 }}>
                  <i className="fas fa-info-circle"></i> These are general recommendations based on common academic benchmarks.
                </p>
              </div>
            </div>
            
            <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px' }}>
              <h4 style={{ marginBottom: '10px', color: 'var(--dark)' }}>📈 Planned Analytics Features:</h4>
              <ul style={{ paddingLeft: '20px', color: '#666' }}>
                <li>Citation growth over time</li>
                <li>Co-author network visualization</li>
                <li>Journal impact analysis</li>
                <li>Research trend predictions</li>
                <li>Collaboration recommendations</li>
                <li>Grant success probability</li>
                <li>Paper impact forecasting</li>
              </ul>
              <p style={{ fontSize: '13px', color: 'var(--gray)', marginTop: '12px', marginBottom: 0 }}>
                <i className="fas fa-star"></i> Subscribe to updates for these premium features
              </p>
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
};

export default AnalyticsPage;