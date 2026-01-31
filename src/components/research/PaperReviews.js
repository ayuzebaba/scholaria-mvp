import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';

const PaperReviews = ({ paperId }) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [isPaperAuthor, setIsPaperAuthor] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: '',
    strengths: '',
    weaknesses: ''
  });

  // ==================== CHECK IF USER IS PAPER AUTHOR ====================
  useEffect(() => {
    const checkIfAuthor = async () => {
      if (!user || !paperId) return;
      
      const { data: paper, error } = await supabase
        .from('papers')
        .select('author_id')
        .eq('id', paperId)
        .single();
      
      if (!error && paper) {
        setIsPaperAuthor(paper.author_id === user.id);
      }
    };
    
    checkIfAuthor();
  }, [paperId, user]);

  // ==================== CLOSE FORM IF USER IS AUTHOR ====================
  useEffect(() => {
    if (isPaperAuthor && showReviewForm) {
      setShowReviewForm(false);
      alert("As the paper author, you cannot review your own work.");
    }
  }, [isPaperAuthor, showReviewForm]);

  // ==================== FETCH REVIEWS ====================
  const getPaperReviews = async (paperId) => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          reviewer:profiles(full_name, institution, academic_title)
        `)
        .eq('paper_id', paperId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching reviews:', error);
        // Fallback to simple query if join fails
        const { data: simpleData } = await supabase
          .from('reviews')
          .select('*')
          .eq('paper_id', paperId)
          .order('created_at', { ascending: false });
        
        return simpleData?.map(review => ({
          ...review,
          reviewer: { full_name: 'Reviewer' }
        })) || [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getPaperReviews:', error);
      return [];
    }
  };

  // ==================== ADD NEW REVIEW ====================
  const addReview = async (reviewData) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    
    const { data, error } = await supabase
      .from('reviews')
      .insert([{
        ...reviewData,
        reviewer_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  };

  // ==================== LOAD REVIEWS ON MOUNT ====================
  useEffect(() => {
    loadReviews();
  }, [paperId]);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const reviewsData = await getPaperReviews(paperId);
      setReviews(reviewsData);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  // ==================== HANDLE REVIEW SUBMISSION ====================
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    // PREVENT AUTHORS FROM REVIEWING THEIR OWN PAPERS
    if (isPaperAuthor) {
      alert("❌ Authors cannot review their own papers. Share your paper with colleagues for peer feedback!");
      setShowReviewForm(false);
      return;
    }
    
    if (!reviewForm.comment.trim()) {
      alert('Please enter a comment');
      return;
    }
    
    try {
      await addReview({
        paper_id: paperId,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
        strengths: reviewForm.strengths,
        weaknesses: reviewForm.weaknesses
      });
      
      setShowReviewForm(false);
      setReviewForm({ rating: 5, comment: '', strengths: '', weaknesses: '' });
      loadReviews();
      
      alert('✅ Review submitted successfully!');
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('❌ Error submitting review: ' + error.message);
    }
  };

  // ==================== HELPER FUNCTIONS ====================
  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <i 
        key={i} 
        className="fas fa-star"
        style={{ 
          color: i < rating ? '#f59e0b' : '#e2e8f0',
          marginRight: '2px'
        }}
      />
    ));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // ==================== RENDER ====================
  return (
    <div className="reviews-section">
      {/* HEADER SECTION */}
      <div className="section-header" style={{ marginBottom: '20px' }}>
        <h3 className="section-title" style={{ fontSize: '16px' }}>
          <i className="fas fa-star"></i>
          Reviews ({reviews.length})
        </h3>
        
        {/* ADD REVIEW BUTTON (SHOW ONLY FOR NON-AUTHORS) */}
        {!isPaperAuthor && (
          <button 
            className="btn btn-outline"
            onClick={() => setShowReviewForm(!showReviewForm)}
            disabled={loading}
          >
            <i className="fas fa-plus"></i>
            {showReviewForm ? 'Cancel' : 'Add Review'}
          </button>
        )}
        
        {/* AUTHOR MESSAGE (SHOW ONLY FOR AUTHORS WITH NO REVIEWS) */}
        {isPaperAuthor && reviews.length === 0 && (
          <div style={{
            padding: '8px 12px',
            background: '#f0f9ff',
            border: '1px solid #bae6fd',
            borderRadius: '6px',
            fontSize: '12px',
            color: '#0369a1'
          }}>
            <i className="fas fa-lightbulb" style={{ marginRight: '6px' }}></i>
            Share your paper with colleagues to get peer reviews
          </div>
        )}
      </div>

      {/* REVIEW FORM (ONLY SHOWS IF NOT AUTHOR) */}
      {showReviewForm && !isPaperAuthor && (
        <div style={{ 
          background: '#f8fafc', 
          padding: '20px', 
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #e2e8f0'
        }}>
          <h4 style={{ marginBottom: '16px' }}>Submit Your Review</h4>
          <form onSubmit={handleSubmitReview}>
            {/* RATING */}
            <div className="form-group">
              <label>Rating *</label>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewForm({...reviewForm, rating: star})}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '24px',
                      cursor: 'pointer',
                      color: star <= reviewForm.rating ? '#f59e0b' : '#e2e8f0'
                    }}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            {/* COMMENT */}
            <div className="form-group">
              <label>Comment *</label>
              <textarea
                value={reviewForm.comment}
                onChange={(e) => setReviewForm({...reviewForm, comment: e.target.value})}
                rows="3"
                placeholder="Overall feedback on the paper..."
                required
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  borderRadius: '6px', 
                  border: '1px solid #cbd5e1',
                  fontFamily: 'inherit',
                  fontSize: '14px'
                }}
              />
            </div>

            {/* STRENGTHS */}
            <div className="form-group">
              <label>Strengths</label>
              <textarea
                value={reviewForm.strengths}
                onChange={(e) => setReviewForm({...reviewForm, strengths: e.target.value})}
                rows="2"
                placeholder="What are the strengths of this paper?"
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  borderRadius: '6px', 
                  border: '1px solid #cbd5e1',
                  fontFamily: 'inherit',
                  fontSize: '14px'
                }}
              />
            </div>

            {/* AREAS FOR IMPROVEMENT */}
            <div className="form-group">
              <label>Areas for Improvement</label>
              <textarea
                value={reviewForm.weaknesses}
                onChange={(e) => setReviewForm({...reviewForm, weaknesses: e.target.value})}
                rows="2"
                placeholder="What could be improved?"
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  borderRadius: '6px', 
                  border: '1px solid #cbd5e1',
                  fontFamily: 'inherit',
                  fontSize: '14px'
                }}
              />
            </div>

            {/* FORM BUTTONS */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button type="submit" className="btn btn-primary">
                <i className="fas fa-paper-plane"></i>
                Submit Review
              </button>
              <button 
                type="button" 
                className="btn btn-outline"
                onClick={() => setShowReviewForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* REVIEWS LIST */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
          Loading reviews...
        </div>
      ) : reviews.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '30px', 
          background: '#f8fafc',
          borderRadius: '8px',
          border: '1px dashed #cbd5e1'
        }}>
          <i className="fas fa-star" style={{ 
            fontSize: '24px', 
            color: '#cbd5e1', 
            marginBottom: '10px' 
          }}></i>
          <p style={{ marginBottom: '16px' }}>No reviews yet. Be the first to review this paper!</p>
          
          {/* "ADD FIRST REVIEW" BUTTON (ONLY FOR NON-AUTHORS) */}
          {!isPaperAuthor && (
            <button 
              className="btn btn-outline" 
              onClick={() => setShowReviewForm(true)}
            >
              <i className="fas fa-plus"></i> Add First Review
            </button>
          )}
        </div>
      ) : (
        <div className="reviews-list">
          {reviews.map((review) => (
            <div key={review.id} style={{ 
              background: 'white',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              marginBottom: '16px'
            }}>
              {/* REVIEWER INFO */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start',
                marginBottom: '12px' 
              }}>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '14px' }}>
                    {review.reviewer?.full_name || 'Reviewer'}
                    {review.reviewer?.academic_title && (
                      <span style={{ color: '#64748b', marginLeft: '6px' }}>
                        {review.reviewer.academic_title}
                      </span>
                    )}
                  </div>
                  {review.reviewer?.institution && (
                    <div style={{ color: '#64748b', fontSize: '12px', marginTop: '2px' }}>
                      {review.reviewer.institution}
                    </div>
                  )}
                  <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '4px' }}>
                    {formatDate(review.created_at)}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ marginBottom: '4px' }}>
                    {renderStars(review.rating)}
                  </div>
                  <div style={{ 
                    color: '#64748b', 
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    {review.rating}.0/5.0
                  </div>
                </div>
              </div>
              
              {/* COMMENT */}
              {review.comment && (
                <div style={{ 
                  marginTop: '12px',
                  paddingTop: '12px',
                  borderTop: '1px solid #f1f5f9'
                }}>
                  <div style={{ fontWeight: '500', marginBottom: '6px' }}>Comment</div>
                  <div style={{ lineHeight: '1.5', fontSize: '14px' }}>{review.comment}</div>
                </div>
              )}
              
              {/* STRENGTHS */}
              {review.strengths && (
                <div style={{ 
                  marginTop: '12px',
                  paddingTop: '12px',
                  borderTop: '1px solid #f1f5f9'
                }}>
                  <div style={{ fontWeight: '500', marginBottom: '6px', color: '#059669' }}>
                    <i className="fas fa-check" style={{ marginRight: '6px' }}></i>
                    Strengths
                  </div>
                  <div style={{ lineHeight: '1.5', fontSize: '14px' }}>{review.strengths}</div>
                </div>
              )}
              
              {/* AREAS FOR IMPROVEMENT */}
              {review.weaknesses && (
                <div style={{ 
                  marginTop: '12px',
                  paddingTop: '12px',
                  borderTop: '1px solid #f1f5f9'
                }}>
                  <div style={{ fontWeight: '500', marginBottom: '6px', color: '#dc2626' }}>
                    <i className="fas fa-exclamation-circle" style={{ marginRight: '6px' }}></i>
                    Areas for Improvement
                  </div>
                  <div style={{ lineHeight: '1.5', fontSize: '14px' }}>{review.weaknesses}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PaperReviews;