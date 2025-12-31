import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    return data;
  };

  const signUp = async (email, password, fullName, institution) => {
    console.log("🚀 Starting signup for:", email);
    
    try {
      // 1. Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { 
            full_name: fullName,
            institution: institution 
          },
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      });
      
      if (authError) {
        console.error("❌ Auth error:", authError);
        throw authError;
      }
      
      console.log("✅ Auth successful. User ID:", authData.user?.id);
      
      // 2. Create profile - WITH PROPER ERROR HANDLING
      if (authData.user) {
        console.log("📝 Creating profile in database...");
        
        const profilePayload = {
          id: authData.user.id,
          email: email,
          full_name: fullName,
          institution: institution,
          avatar_url: '',
          department: '',
          academic_title: 'Associate Professor',
          research_interests: [],
          skills: [],
          bio: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        console.log("Profile payload:", profilePayload);
        
        // Try upsert first
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .upsert(profilePayload)
          .select()
          .single();
        
        if (profileError) {
          console.error("❌ Upsert failed:", profileError);
          
          // Try insert as fallback
          console.log("🔄 Trying insert instead...");
          const { data: insertData, error: insertError } = await supabase
            .from('profiles')
            .insert(profilePayload)
            .select()
            .single();
          
          if (insertError) {
            console.error("❌ Insert also failed:", insertError);
            
            // Last resort: try without arrays
            console.log("🆘 Trying simplified insert...");
            const simplifiedPayload = {
              id: authData.user.id,
              email: email,
              full_name: fullName,
              institution: institution,
              avatar_url: '',
              department: '',
              academic_title: 'Associate Professor',
              bio: '',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            
            const { data: simpleData, error: simpleError } = await supabase
              .from('profiles')
              .insert(simplifiedPayload)
              .select()
              .single();
            
            if (simpleError) {
              console.error("💀 All profile creation attempts failed:", simpleError);
              throw new Error(`Profile creation failed: ${simpleError.message}`);
            }
            
            console.log("✅ Profile created (simplified):", simpleData);
            return authData;
          }
          
          console.log("✅ Profile created (via insert):", insertData);
          return authData;
        }
        
        console.log("✅ Profile created (via upsert):", profileData);
      } else {
        console.warn("⚠️ No user data returned from auth");
      }
      
      return authData;
      
    } catch (error) {
      console.error("💥 Signup process failed:", error);
      throw error;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  // AUTO-CREATE PROFILE FOR EXISTING USERS
  const ensureProfileExists = async (userId) => {
    try {
      // Check if profile exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();
      
      // If no profile exists, create one
      if (!existingProfile || fetchError?.code === 'PGRST116') {
        console.log("🔄 Creating missing profile for user:", userId);
        
        const { data: authUser } = await supabase.auth.getUser();
        
        if (!authUser.user) {
          console.error("Cannot create profile: No auth user found");
          return;
        }
        
        const { error: createError } = await supabase
          .from('profiles')
          .upsert({
            id: userId,
            email: authUser.user.email,
            full_name: authUser.user.user_metadata?.full_name || authUser.user.email.split('@')[0],
            institution: authUser.user.user_metadata?.institution || '',
            avatar_url: '',
            department: '',
            academic_title: 'Associate Professor',
            research_interests: [],
            skills: [],
            bio: '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (createError) {
          console.error("Failed to create missing profile:", createError);
        } else {
          console.log("✅ Created missing profile for:", userId);
        }
      }
    } catch (error) {
      console.error("Error ensuring profile exists:", error);
    }
  };

  // CALL THIS WHEN USER LOGS IN
  useEffect(() => {
    if (user?.id) {
      console.log("👤 User logged in:", user.email);
      ensureProfileExists(user.id);
    }
  }, [user]);

  const updateUserProfile = async (userId, updates) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const getUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      // Return default profile if none exists
      if (!data) {
        return {
          id: userId,
          email: user?.email || '',
          full_name: '',
          avatar_url: '',
          institution: '',
          department: '',
          academic_title: 'Associate Professor',
          research_interests: [],
          skills: [],
          bio: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    updateUserProfile,
    getUserProfile,
    ensureProfileExists
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}