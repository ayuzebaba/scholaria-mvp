import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';

const PaperReviewsSimple = ({ paperId }) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: '',
    strengths: '',
    weaknesses: ''
  });

  // Debug function to check table existence
  const checkReviewsTable = async () => {
    console.log("🔍 Checking if reviews table exists...");
    const { data, error } = await supabase
      .from('reviews')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error("❌ Reviews table check failed:", error);
      return false;
    }
    
    console.log("✅ Reviews table exists, count:", data);
    return true;
  };


  const getPaperReviews = async (paperId) => {
  console.log("📥 Fetching reviews for paper:", paperId);
  
  // SIMPLE query without join first
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('paper_id', paperId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('❌ Error fetching reviews:', error);
    return [];
  }
  
  console.log('✅ Reviews fetched:', data);
  console.log('✅ Count:', data?.length || 0);
  
  // If we have data but no profiles, add empty reviewer object
  if (data && data.length > 0) {
    return data.map(review => ({
      ...review,
      reviewer: { full_name: 'Unknown Reviewer' }
    }));
  }
  
  return data || [];
};


  const addReview = async (reviewData) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error("❌ No user found for review");
      throw new Error('Not authenticated');
    }
    
    console.log("📝 Attempting to add review:", {
      ...reviewData,
      reviewer_id: user.id,
      user_email: user.email
    });
    
    // First check table
    await checkReviewsTable();
    
    const { data, error } = await supabase
      .from('reviews')
      .insert([{
        ...reviewData,
        reviewer_id: user.id
      }])
      .select()
      .single();
    
    if (error) {
      console.error("❌ ERROR adding review:", error);
      console.error("Full error:", JSON.stringify(error, null, 2));
      throw error;
    }
    
    console.log("✅ SUCCESS: Review added:", data);
    return data;
  };

  useEffect(() => {
    console.log("🔄 Component mounted with paperId:", paperId);
    loadReviews();
  }, [paperId]);

  const loadReviews = async () => {
    console.log("🔄 Starting loadReviews...");
    setLoading(true);
    try {
      const reviewsData = await getPaperReviews(paperId);
      console.log("📊 Reviews data received:", reviewsData);
      setReviews(reviewsData);
    } catch (error) {
      console.error('❌ Error in loadReviews:', error);
    } finally {
      setLoading(false);
      console.log("🔄 loadReviews completed");
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    console.log("🔄 Submitting review...");
    
    try {
      const result = await addReview({
        paper_id: paperId,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
        strengths: reviewForm.strengths,
        weaknesses: reviewForm.weaknesses
      });
      
      console.log("✅ Review submission result:", result);
      
      setShowReviewForm(false);
      setReviewForm({ rating: 5, comment: '', strengths: '', weaknesses: '' });
      
      // Reload reviews after a short delay
      setTimeout(() => {
        loadReviews();
      }, 500);
      
      alert('✅ Review submitted successfully!');
    } catch (error) {
      console.error('❌ Error submitting review:', error);
      alert(`❌ Error submitting review: ${error.message}`);
    }
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <i 
        key={i} 
        className="fas fa-star"
        style={{ color: i < rating ? '#f59e0b' : '#e2e8f0' }}
      />
    ));
  };

  // Simple test - insert a review directly
  const testInsertReview = async () => {
    console.log("🧪 Testing review insertion...");
    try {
      const testData = {
        paper_id: paperId,
        rating: 4,
        comment: 'Test review from debug',
        strengths: 'Test strength',
        weaknesses: 'Test weakness'
      };
      
      const result = await addReview(testData);
      console.log("🧪 Test result:", result);
      alert(`Test review added: ${result.id}`);
      loadReviews();
    } catch (error) {
      console.error("🧪 Test failed:", error);
      alert(`Test failed: ${error.message}`);
    }
  };

  return (
    <div className="reviews-section">
      <div className="section-header" style={{ marginBottom: '20px' }}>
        <h3 className="section-title" style={{ fontSize: '16px' }}>
          <i className="fas fa-star"></i>
          Reviews ({reviews.length})
        </h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn btn-outline"
            onClick={() => setShowReviewForm(!showReviewForm)}
          >
            <i className="fas fa-plus"></i>
            Add Review
          </button>
          <button 
            className="btn btn-secondary"
            onClick={testInsertReview}
            style={{ background: '#6b7280', color: 'white' }}
          >
            <i className="fas fa-vial"></i>
            Test Insert
          </button>
        </div>
      </div>

      {/* Debug info */}
      <div style={{ 
        background: '#f3f4f6', 
        padding: '10px', 
        borderRadius: '6px',
        marginBottom: '15px',
        fontSize: '12px',
        color: '#4b5563'
      }}>
        <div><strong>Debug Info:</strong> Paper ID: {paperId}</div>
        <div>User: {user?.email || 'Not logged in'}</div>
        <div>Reviews in state: {reviews.length}</div>
      </div>

      {/* Review Form */}
      {showReviewForm && (
        <div style={{ 
          background: '#f8fafc', 
          padding: '20px', 
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #e2e8f0'
        }}>
          <h4 style={{ marginBottom: '16px' }}>Submit Your Review</h4>
          <form onSubmit={handleSubmitReview}>
            <div className="form-group">
              <label>Rating</label>
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

            <div className="form-group">
              <label>Comment *</label>
              <textarea
                value={reviewForm.comment}
                onChange={(e) => setReviewForm({...reviewForm, comment: e.target.value})}
                rows="3"
                placeholder="Overall feedback on the paper..."
                required
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div className="form-group">
              <label>Strengths</label>
              <textarea
                value={reviewForm.strengths}
                onChange={(e) => setReviewForm({...reviewForm, strengths: e.target.value})}
                rows="2"
                placeholder="What are the strengths of this paper?"
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div className="form-group">
              <label>Areas for Improvement</label>
              <textarea
                value={reviewForm.weaknesses}
                onChange={(e) => setReviewForm({...reviewForm, weaknesses: e.target.value})}
                rows="2"
                placeholder="What could be improved?"
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
            </div>

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

      {/* Reviews List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <i className="fas fa-spinner fa-spin"></i>
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
          <i className="fas fa-star" style={{ fontSize: '24px', color: '#cbd5e1', marginBottom: '10px' }}></i>
          <p>No reviews yet. Be the first to review this paper!</p>
          <button 
            className="btn btn-outline" 
            onClick={() => setShowReviewForm(true)}
            style={{ marginTop: '10px' }}
          >
            <i className="fas fa-plus"></i> Add First Review
          </button>
        </div>
      ) : (
        <div className="reviews-list">
          {reviews.map((review) => (
            <div key={review.id} style={{ 
              background: 'white',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              marginBottom: '12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div>
                  <div style={{ fontWeight: '500' }}>
                    {review.reviewer?.full_name || 'Anonymous Reviewer'}
                  </div>
                  <div style={{ color: '#64748b', fontSize: '12px' }}>
                    {new Date(review.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  {renderStars(review.rating)}
                </div>
              </div>
              
              {review.comment && (
                <div style={{ marginTop: '8px' }}>
                  <strong>Comment:</strong> {review.comment}
                </div>
              )}
              
              {review.strengths && (
                <div style={{ marginTop: '8px' }}>
                  <strong>Strengths:</strong> {review.strengths}
                </div>
              )}
              
              {review.weaknesses && (
                <div style={{ marginTop: '8px' }}>
                  <strong>Areas for Improvement:</strong> {review.weaknesses}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PaperReviewsSimple;