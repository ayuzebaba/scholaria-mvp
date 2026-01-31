import { supabase } from './supabase';

// ===== PROFILES =====
export const getProfile = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching profile:', error);
    throw error;
  }
  
  // Return default profile if none exists
  if (!data) {
    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;
    
    return {
      id: userId,
      email: user.email,
      full_name: user.user_metadata?.full_name || '',
      avatar_url: user.user_metadata?.avatar_url || '',
      institution: user.user_metadata?.institution || '',
      department: user.user_metadata?.department || '',
      academic_title: user.user_metadata?.title || 'Associate Professor',
      research_interests: [],
      skills: [],
      bio: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }
  
  return data;
};

export const updateProfile = async (userId, profileData) => {
  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      ...profileData,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
  
  return data;
};

// Create profile if doesn't exist
export const createProfileIfNotExists = async (userId, userData) => {
  try {
    const existingProfile = await getProfile(userId);
    
    if (!existingProfile.id) {
      const { data, error } = await supabase
        .from('profiles')
        .insert([{
          id: userId,
          email: userData.email,
          full_name: userData.user_metadata?.full_name || userData.email?.split('@')[0],
          institution: userData.user_metadata?.institution || '',
          department: userData.user_metadata?.department || '',
          academic_title: userData.user_metadata?.title || 'Associate Professor',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }
    
    return existingProfile;
  } catch (error) {
    console.error('Error creating profile:', error);
    throw error;
  }
};

// ===== PAPERS =====
export const getPapers = async (userId) => {
  const { data, error } = await supabase
    .from('papers')
    .select('*')
    .eq('author_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching papers:', error);
    return [];
  }
  
  return data || [];
};

export const createPaper = async (paperData) => {
  const { data, error } = await supabase
    .from('papers')
    .insert([paperData])
    .select()
    .single();
  
  if (error) {
    console.error('Error creating paper:', error);
    throw error;
  }
  
  return data;
};

export const updatePaper = async (paperId, updates) => {
  const { data, error } = await supabase
    .from('papers')
    .update(updates)
    .eq('id', paperId)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating paper:', error);
    throw error;
  }
  
  return data;
};

export const deletePaper = async (paperId) => {
  const { error } = await supabase
    .from('papers')
    .delete()
    .eq('id', paperId);
  
  if (error) {
    console.error('Error deleting paper:', error);
    throw error;
  }
  
  return true;
};

// ===== FILE UPLOAD =====
export const uploadPaperFile = async (file, userId) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${Date.now()}.${fileExt}`;
  
  const { data, error } = await supabase.storage
    .from('papers')
    .upload(fileName, file);
  
  if (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
  
  // Get public URL
  const { data: urlData } = supabase.storage
    .from('papers')
    .getPublicUrl(data.path);
  
  return {
    file_url: urlData.publicUrl,
    file_size: file.size,
    file_name: file.name
  };
};

// ===== STATISTICS =====
export const getUserStats = async (userId) => {
  try {
    // Get papers count
    const { count: papersCount, error: countError } = await supabase
      .from('papers')
      .select('*', { count: 'exact', head: true })
      .eq('author_id', userId);
    
    if (countError) {
      console.error('Error counting papers:', countError);
      return { papers: 0, citations: 0, avgReviews: 0 };
    }
    
    // Get total citations
    const { data: papers, error: papersError } = await supabase
      .from('papers')
      .select('citation_count')
      .eq('author_id', userId);
    
    if (papersError) {
      console.error('Error fetching paper stats:', papersError);
      return { papers: papersCount || 0, citations: 0, avgReviews: 0 };
    }
    
    const citations = papers.reduce((sum, paper) => sum + (paper.citation_count || 0), 0);
    
    // For now, using citation_count as reviews (you can add reviews table later)
    const avgReviews = papers.length > 0 ? (citations / papers.length).toFixed(1) : 0;
    
    return {
      papers: papersCount || 0,
      citations,
      avgReviews: parseFloat(avgReviews)
    };
  } catch (error) {
    console.error('Error getting user stats:', error);
    return { papers: 0, citations: 0, avgReviews: 0 };
  }
};

// ===== SEARCH =====
export const searchPapers = async (query, userId = null) => {
  let queryBuilder = supabase
    .from('papers')
    .select('*');
  
  if (userId) {
    queryBuilder = queryBuilder.eq('author_id', userId);
  }
  
  if (query) {
    queryBuilder = queryBuilder.or(`title.ilike.%${query}%,abstract.ilike.%${query}%`);
  }
  
  const { data, error } = await queryBuilder.order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error searching papers:', error);
    return [];
  }
  
  return data || [];
};

// ===== AUTO-CREATE PROFILE =====
// Call this after user signs up
export const handleNewUser = async (user) => {
  try {
    await createProfileIfNotExists(user.id, {
      email: user.email,
      user_metadata: user.user_metadata
    });
  } catch (error) {
    console.error('Error handling new user:', error);
  }
};


// ===== REVIEWS =====
export const getPaperReviews = async (paperId) => {
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      *,
      reviewer:profiles(*)
    `)
    .eq('paper_id', paperId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching reviews:', error);
    return [];
  }
  
  return data || [];
};

export const addReview = async (reviewData) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  
  const { data, error } = await supabase
    .from('reviews')
    .insert([{
      ...reviewData,
      reviewer_id: user.id
    }])
    .select()
    .single();
  
  if (error) {
    console.error('Error adding review:', error);
    throw error;
  }
  
  return data;
};

export const requestReview = async (paperId, reviewerId, message, deadline) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  
  const { data, error } = await supabase
    .from('review_requests')
    .insert([{
      paper_id: paperId,
      requested_from_id: reviewerId,
      requested_by_id: user.id,
      message,
      deadline,
      status: 'pending'
    }])
    .select()
    .single();
  
  if (error) {
    console.error('Error requesting review:', error);
    throw error;
  }
  
  return data;
};

export const getUserReviewRequests = async (userId) => {
  const { data, error } = await supabase
    .from('review_requests')
    .select(`
      *,
      paper:papers(*),
      requested_by:profiles!requested_by_id(*)
    `)
    .eq('requested_from_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching review requests:', error);
    return [];
  }
  
  return data || [];
};

