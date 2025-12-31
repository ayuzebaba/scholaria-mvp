import React, { useState, useEffect } from 'react';
import Layout from '../components/shared/Layout';
import { useAuth } from '../context/AuthContext';
import { 
  getProfile, 
  updateProfile, 
  getPapers, 
  createPaper,
  uploadPaperFile,
  getUserStats,
  createProfileIfNotExists
} from '../services/database';
import { supabase } from '../services/supabase';
import '../styles/globals.css';

const DashboardPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [papers, setPapers] = useState([]);
  const [stats, setStats] = useState({ papers: 0, citations: 0, avgReviews: 0 });
  const [skills, setSkills] = useState([]);
  const [researchInterests, setResearchInterests] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [newInterest, setNewInterest] = useState('');
  const [uploadForm, setUploadForm] = useState({
    title: '',
    abstract: '',
    keywords: '',
    status: 'draft',
    file: null
  });
  const [uploadingFile, setUploadingFile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // Function to ensure profile exists before any database operation
  const ensureProfileExists = async (userId) => {
    try {
      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();
      
      // If profile doesn't exist, create it
      if (!existingProfile) {
        const { data: authUser } = await supabase.auth.getUser();
        
        await supabase.from('profiles').upsert({
          id: userId,
          email: authUser.user.email,
          full_name: authUser.user.user_metadata?.full_name || authUser.user.email?.split('@')[0] || 'Researcher',
          institution: authUser.user.user_metadata?.institution || '',
          department: '',
          academic_title: 'Associate Professor',
          research_interests: [],
          skills: [],
          bio: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });
        
        console.log('Auto-created profile for user:', userId);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error ensuring profile exists:', error);
      return false;
    }
  };

  // Fetch user data on mount
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        // Ensure profile exists first
        await ensureProfileExists(user.id);
        
        // Fetch profile
        const userProfile = await getProfile(user.id);
        setProfile(userProfile);
        setSkills(userProfile.skills || []);
        setResearchInterests(userProfile.research_interests || []);
        
        // Fetch papers
        const userPapers = await getPapers(user.id);
        setPapers(userPapers);
        
        // Fetch stats
        const userStats = await getUserStats(user.id);
        setStats(userStats);
        
      } catch (error) {
        console.error('Error fetching user data:', error);
        // Fallback to default data
        setSkills(["Machine Learning", "Python", "NLP"]);
        setResearchInterests(["AI", "Machine Learning", "Computer Vision"]);
        setPapers([
          {
            id: 'demo-1',
            title: "Ethical Considerations in AI Development",
            abstract: "This paper explores the ethical implications of AI systems.",
            author_id: user?.id,
            keywords: ["AI", "Ethics", "Machine Learning"],
            status: "published",
            citation_count: 42,
            created_at: "2023-05-10T00:00:00Z"
          }
        ]);
        setStats({ papers: 1, citations: 42, avgReviews: 4.2 });
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [user]);

  // Save profile to database - FIXED VERSION
  const handleSaveProfile = async () => {
    if (!user || !profile) return;
    
    setSavingProfile(true);
    const saveBtn = document.getElementById('saveProfileBtn');
    const originalText = saveBtn?.innerHTML;
    
    if (saveBtn) {
      saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
      saveBtn.disabled = true;
    }
    
    try {
      console.log("🔄 Saving profile with data:", {
        full_name: profile.full_name || '',
        academic_title: profile.academic_title || 'Associate Professor',
        institution: profile.institution || '',
        department: profile.department || '',
        bio: profile.bio || '',
        skills: skills,
        research_interests: researchInterests
      });
      
      // Use direct Supabase call instead of updateProfile service
      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name || '',
          academic_title: profile.academic_title || 'Associate Professor',
          institution: profile.institution || '',
          department: profile.department || '',
          bio: profile.bio || '',
          skills: skills,
          research_interests: researchInterests,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single();
      
      if (error) {
        console.error("❌ Profile save error:", error);
        console.error("Full error:", JSON.stringify(error, null, 2));
        throw error;
      }
      
      console.log("✅ Profile saved successfully:", data);
      
      if (saveBtn) {
        saveBtn.innerHTML = '<i class="fas fa-check"></i> Saved';
      }
      
      // Show success message
      setTimeout(() => {
        if (saveBtn) {
          saveBtn.innerHTML = originalText;
          saveBtn.disabled = false;
        }
        setSavingProfile(false);
      }, 1500);
      
    } catch (error) {
      console.error('Error saving profile:', error);
      
      // Try alternative save method
      try {
        console.log("🔄 Trying alternative save method...");
        
        const { data, error: altError } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            email: user.email,
            full_name: profile.full_name || '',
            academic_title: profile.academic_title || 'Associate Professor',
            institution: profile.institution || '',
            department: profile.department || '',
            bio: profile.bio || '',
            skills: skills,
            research_interests: researchInterests,
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (altError) throw altError;
        
        console.log("✅ Profile saved via upsert:", data);
        
        if (saveBtn) {
          saveBtn.innerHTML = '<i class="fas fa-check"></i> Saved';
        }
        
        setTimeout(() => {
          if (saveBtn) {
            saveBtn.innerHTML = originalText;
            saveBtn.disabled = false;
          }
          setSavingProfile(false);
        }, 1500);
        
      } catch (altError) {
        console.error('Alternative save also failed:', altError);
        alert('Error saving profile. Please try again or refresh the page.');
        
        if (saveBtn) {
          saveBtn.innerHTML = originalText;
          saveBtn.disabled = false;
        }
        setSavingProfile(false);
      }
    }
  };

  // Upload paper with file
  const handleUploadPaper = async (e) => {
    e.preventDefault();
    
    if (!user) {
      alert('You must be logged in to upload a paper');
      return;
    }
    
    if (!uploadForm.title.trim()) {
      alert('Please enter a paper title');
      return;
    }
    
    setUploadingFile(true);
    
    try {
      // CRITICAL: Ensure profile exists before creating paper
      await ensureProfileExists(user.id);
      
      let fileData = null;
      
      // Upload file if exists
      if (uploadForm.file) {
        fileData = await uploadPaperFile(uploadForm.file, user.id);
      }
      
      // Create paper record
      const newPaper = await createPaper({
        author_id: user.id,
        title: uploadForm.title,
        abstract: uploadForm.abstract,
        keywords: uploadForm.keywords.split(',').map(k => k.trim()).filter(k => k),
        status: uploadForm.status,
        citation_count: 0,
        ...(fileData && {
          file_url: fileData.file_url,
          file_size: fileData.file_size
        })
      });
      
      // Add to local state
      setPapers([newPaper, ...papers]);
      
      // Update stats
      setStats(prev => ({
        ...prev,
        papers: prev.papers + 1
      }));
      
      // Reset form and close modal
      setUploadForm({
        title: '',
        abstract: '',
        keywords: '',
        status: 'draft',
        file: null
      });
      setShowUploadModal(false);
      
      // Show success message
      const uploadBtn = document.getElementById('uploadPaperBtn');
      if (uploadBtn) {
        const originalText = uploadBtn.innerHTML;
        uploadBtn.innerHTML = '<i class="fas fa-check"></i> Paper Uploaded!';
        uploadBtn.style.background = '#10b981';
        
        setTimeout(() => {
          uploadBtn.innerHTML = originalText;
          uploadBtn.style.background = '';
        }, 2000);
      }
      
    } catch (error) {
      console.error('Error uploading paper:', error);
      alert(`Error uploading paper: ${error.message}`);
    } finally {
      setUploadingFile(false);
    }
  };

  // Handle profile updates
  const handleProfileChange = (e) => {
    const { id, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [id]: value
    }));
  };

  // Add skill
  const handleAddSkill = () => {
    const skill = newSkill.trim();
    if (skill && !skills.includes(skill)) {
      setSkills([...skills, skill]);
      setNewSkill('');
    }
  };

  // Remove skill
  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };

  // Add research interest
  const handleAddInterest = () => {
    const interest = newInterest.trim();
    if (interest && !researchInterests.includes(interest)) {
      setResearchInterests([...researchInterests, interest]);
      setNewInterest('');
    }
  };

  // Remove research interest
  const handleRemoveInterest = (interestToRemove) => {
    setResearchInterests(researchInterests.filter(interest => interest !== interestToRemove));
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUploadForm({
      ...uploadForm,
      [name]: value
    });
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadForm({
        ...uploadForm,
        file: file
      });
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'published': return 'badge-published';
      case 'under-review': return 'badge-under-review';
      case 'draft': 
      default: return 'badge-draft';
    }
  };

  // Get status text
  const getStatusText = (status) => {
    switch(status) {
      case 'published': return 'Published';
      case 'under-review': return 'Under Review';
      case 'draft': 
      default: return 'Draft';
    }
  };

  // Loading state
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
              <p>Loading your dashboard...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container main-content">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="profile-summary">
            <div className="profile-avatar">
              {profile?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="profile-name">
              {profile?.full_name || user?.email?.split('@')[0] || 'Scholar'}
            </div>
            <div className="profile-title">
              {profile?.academic_title || 'Associate Professor'} • {profile?.institution || 'Add Institution'}
            </div>
            <div className="profile-stats">
              <div className="stat-item">
                <div className="stat-value">{stats.papers}</div>
                <div className="stat-label">Papers</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{stats.citations}</div>
                <div className="stat-label">Citations</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{stats.avgReviews}</div>
                <div className="stat-label">Avg. Rating</div>
              </div>
            </div>
          </div>
          
          <nav className="sidebar-nav">
            <a href="#" className="active">
              <i className="fas fa-user"></i>
              Profile
            </a>
            <a href="#">
              <i className="fas fa-file-alt"></i>
              My Papers ({papers.length})
            </a>
            <a href="#">
              <i className="fas fa-users"></i>
              Collaborators
            </a>
            <a href="#">
              <i className="fas fa-star"></i>
              Reviews
            </a>
            <a href="#">
              <i className="fas fa-cog"></i>
              Settings
            </a>
          </nav>
        </aside>

        {/* Content Area */}
        <main className="content-area">
          {/* Scholar Profile */}
          <section className="section-card">
            <div className="section-header">
              <h2 className="section-title">
                <i className="fas fa-user-circle"></i>
                Scholar Profile
              </h2>
              <button 
                className="btn btn-primary" 
                id="saveProfileBtn"
                onClick={handleSaveProfile}
                disabled={savingProfile}
              >
                {savingProfile ? (
                  <i className="fas fa-spinner fa-spin"></i>
                ) : (
                  <i className="fas fa-save"></i>
                )}
                {savingProfile ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
            
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="full_name">Full Name</label>
                <input 
                  type="text" 
                  id="full_name" 
                  value={profile?.full_name || ''}
                  onChange={handleProfileChange}
                  placeholder="Enter your full name"
                  required 
                  disabled={savingProfile}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="academic_title">Academic Title</label>
                <select 
                  id="academic_title" 
                  value={profile?.academic_title || 'Associate Professor'}
                  onChange={handleProfileChange}
                  disabled={savingProfile}
                >
                  <option>Professor</option>
                  <option>Associate Professor</option>
                  <option>Assistant Professor</option>
                  <option>Researcher</option>
                  <option>PhD Candidate</option>
                  <option>Postdoctoral Fellow</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="institution">Institution</label>
                <input 
                  type="text" 
                  id="institution" 
                  value={profile?.institution || ''}
                  onChange={handleProfileChange}
                  placeholder="e.g., Stanford University"
                  required 
                  disabled={savingProfile}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="department">Department</label>
                <input 
                  type="text" 
                  id="department" 
                  value={profile?.department || ''}
                  onChange={handleProfileChange}
                  placeholder="e.g., Computer Science"
                  required 
                  disabled={savingProfile}
                />
              </div>
              
              <div className="form-group full-width">
                <label>Research Interests</label>
                <div className="skills-container">
                  {researchInterests.map((interest, index) => (
                    <div key={index} className="skill-tag">
                      {interest}
                      <i 
                        className="fas fa-times" 
                        onClick={() => !savingProfile && handleRemoveInterest(interest)}
                        style={{ cursor: savingProfile ? 'not-allowed' : 'pointer', opacity: savingProfile ? 0.5 : 1 }}
                      />
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                  <input 
                    type="text" 
                    value={newInterest}
                    onChange={(e) => setNewInterest(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !savingProfile) {
                        e.preventDefault();
                        handleAddInterest();
                      }
                    }}
                    placeholder="Add research interest" 
                    style={{ flex: 1 }}
                    disabled={savingProfile}
                  />
                  <button 
                    type="button" 
                    className="btn btn-outline"
                    onClick={handleAddInterest}
                    disabled={savingProfile}
                  >
                    Add
                  </button>
                </div>
              </div>
              
              <div className="form-group full-width">
                <label>Skills & Expertise</label>
                <div className="skills-container">
                  {skills.map((skill, index) => (
                    <div key={index} className="skill-tag">
                      {skill}
                      <i 
                        className="fas fa-times" 
                        onClick={() => !savingProfile && handleRemoveSkill(skill)}
                        style={{ cursor: savingProfile ? 'not-allowed' : 'pointer', opacity: savingProfile ? 0.5 : 1 }}
                      />
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                  <input 
                    type="text" 
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !savingProfile) {
                        e.preventDefault();
                        handleAddSkill();
                      }
                    }}
                    placeholder="Add a skill" 
                    style={{ flex: 1 }}
                    disabled={savingProfile}
                  />
                  <button 
                    type="button" 
                    className="btn btn-outline"
                    onClick={handleAddSkill}
                    disabled={savingProfile}
                  >
                    Add
                  </button>
                </div>
              </div>
              
              <div className="form-group full-width">
                <label htmlFor="bio">Academic Biography</label>
                <textarea 
                  id="bio" 
                  value={profile?.bio || ''}
                  onChange={handleProfileChange}
                  placeholder="Tell us about your academic background, research focus, and achievements..."
                  rows="5"
                  disabled={savingProfile}
                />
              </div>
            </div>
          </section>

          {/* Research Hub */}
          <section className="section-card">
            <div className="section-header">
              <h2 className="section-title">
                <i className="fas fa-book-open"></i>
                Research Hub ({papers.length} papers)
              </h2>
              <button 
                className="btn btn-primary"
                id="uploadPaperBtn"
                onClick={() => setShowUploadModal(true)}
              >
                <i className="fas fa-plus"></i>
                Upload Paper
              </button>
            </div>
            
            <div className="papers-list">
              {papers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--gray)' }}>
                  <i className="fas fa-file-alt fa-2x" style={{ marginBottom: '16px', opacity: 0.5 }}></i>
                  <p>No papers yet. Upload your first paper!</p>
                  <button 
                    className="btn btn-primary"
                    onClick={() => setShowUploadModal(true)}
                    style={{ marginTop: '16px' }}
                  >
                    <i className="fas fa-plus"></i>
                    Upload First Paper
                  </button>
                </div>
              ) : (
                papers.map((paper) => (
                  <div key={paper.id} className="paper-card">
                    <div className="paper-header">
                      <div style={{ flex: 1 }}>
                        <h3 className="paper-title">{paper.title}</h3>
                        <div className="paper-meta">
                          <span><i className="far fa-calendar"></i> {formatDate(paper.created_at)}</span>
                          <span><i className="fas fa-quote-right"></i> {paper.citation_count || 0} citations</span>
                          <span><i className="fas fa-tags"></i> {paper.keywords?.join(', ') || 'No keywords'}</span>
                          {paper.file_url && (
                            <span><i className="fas fa-file-pdf"></i> PDF Available</span>
                          )}
                        </div>
                      </div>
                      <span className={`badge ${getStatusBadgeClass(paper.status)}`}>
                        {getStatusText(paper.status)}
                      </span>
                    </div>
                    <p className="paper-abstract">{paper.abstract || 'No abstract provided'}</p>
                    <div className="paper-actions">
                      {paper.file_url && (
                        <a href={paper.file_url} target="_blank" rel="noopener noreferrer" className="btn btn-text">
                          <i className="fas fa-download"></i> Download
                        </a>
                      )}
                      <button className="btn btn-text"><i className="far fa-eye"></i> View</button>
                      <button className="btn btn-text"><i className="far fa-edit"></i> Edit</button>
                      <button className="btn btn-text"><i className="fas fa-share"></i> Share</button>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="review-section">
              <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>
                <i className="fas fa-star"></i>
                Recent Reviews
              </h3>
              <div className="review-item">
                <div className="review-header">
                  <div className="reviewer">Dr. Robert Chen</div>
                  <div className="review-date">March 15, 2023</div>
                </div>
                <div className="review-rating">
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star-half-alt"></i>
                </div>
                <div className="review-comment">
                  Excellent methodology and clear contributions. Minor suggestions for improvement in the discussion section.
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay active">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Upload Research Paper</h3>
              <button 
                className="close-modal"
                onClick={() => setShowUploadModal(false)}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleUploadPaper}>
              <div className="form-group">
                <label htmlFor="paperTitle">Paper Title</label>
                <input 
                  type="text" 
                  id="paperTitle" 
                  name="title"
                  value={uploadForm.title}
                  onChange={handleInputChange}
                  placeholder="Enter paper title" 
                  required 
                  disabled={uploadingFile}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="paperAbstract">Abstract</label>
                <textarea 
                  id="paperAbstract" 
                  name="abstract"
                  value={uploadForm.abstract}
                  onChange={handleInputChange}
                  placeholder="Provide a brief abstract" 
                  rows="3" 
                  required 
                  disabled={uploadingFile}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="paperKeywords">Keywords (comma-separated)</label>
                <input 
                  type="text" 
                  id="paperKeywords" 
                  name="keywords"
                  value={uploadForm.keywords}
                  onChange={handleInputChange}
                  placeholder="e.g., AI, Machine Learning, NLP" 
                  disabled={uploadingFile}
                />
              </div>
              
              <div className="form-group">
                <label>Upload File (PDF, DOC, DOCX)</label>
                <div className="upload-area" onClick={() => !uploadingFile && document.getElementById('fileInput').click()}>
                  <div className="upload-icon">
                    <i className="fas fa-cloud-upload-alt"></i>
                  </div>
                  <h4 style={{ marginBottom: '8px' }}>Drag & drop your paper</h4>
                  <p style={{ color: 'var(--gray)', marginBottom: '16px' }}>or click to browse files</p>
                  <button 
                    type="button" 
                    className="btn btn-outline" 
                    id="browseFilesBtn"
                    disabled={uploadingFile}
                  >
                    <i className="fas fa-folder-open"></i>
                    Browse Files
                  </button>
                  {uploadForm.file && (
                    <p style={{ marginTop: '12px', color: 'var(--primary)' }}>
                      <i className="fas fa-file"></i> {uploadForm.file.name}
                    </p>
                  )}
                  <input 
                    type="file" 
                    id="fileInput" 
                    accept=".pdf,.doc,.docx" 
                    hidden 
                    onChange={handleFileChange}
                    disabled={uploadingFile}
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="paperStatus">Publication Status</label>
                <select 
                  id="paperStatus" 
                  name="status"
                  value={uploadForm.status}
                  onChange={handleInputChange}
                  disabled={uploadingFile}
                >
                  <option value="draft">Draft</option>
                  <option value="under-review">Under Review</option>
                  <option value="published">Published</option>
                </select>
              </div>
              
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ flex: 1 }}
                  disabled={uploadingFile}
                >
                  {uploadingFile ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-upload"></i>
                      Upload Paper
                    </>
                  )}
                </button>
                <button 
                  type="button" 
                  className="btn btn-outline"
                  onClick={() => setShowUploadModal(false)}
                  disabled={uploadingFile}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default DashboardPage;