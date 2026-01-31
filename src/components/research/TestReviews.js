import React from 'react';

const TestReviews = ({ paperId }) => {
  return (
    <div style={{ 
      background: '#f8fafc', 
      padding: '20px', 
      borderRadius: '8px',
      marginTop: '20px',
      border: '1px solid #e2e8f0'
    }}>
      <h4 style={{ fontSize: '16px', marginBottom: '10px' }}>
        <i className="fas fa-star"></i> Test Reviews for Paper: {paperId}
      </h4>
      <p>This is a test review component. It works!</p>
      <button 
        className="btn btn-outline" 
        style={{ marginTop: '10px' }}
        onClick={() => alert(`Would add review for paper ${paperId}`)}
      >
        <i className="fas fa-plus"></i> Add Test Review
      </button>
    </div>
  );
};

export default TestReviews;  // ← MUST BE "export default"