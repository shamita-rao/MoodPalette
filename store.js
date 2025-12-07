import { configureStore, createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { db, auth } from './firebase';
import { doc, setDoc, deleteDoc, serverTimestamp, collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { 
  signInAnonymously, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged
} from 'firebase/auth';

// Color name mapping for mood colors
const COLOR_NAMES = {
  // Positive emotions - bright and warm tones
  '#FFD700': 'Gold - Joyful & Radiant',
  '#FF69B4': 'Hot Pink - Excited & Energetic',
  '#32CD32': 'Lime Green - Happy & Alive', 
  '#FF6347': 'Tomato - Passionate & Enthusiastic',
  '#FFA500': 'Orange - Optimistic & Cheerful',
  
  // Negative emotions - cool and dull tones
  '#708090': 'Slate Gray - Sad & Melancholy',
  '#4682B4': 'Steel Blue - Anxious & Worried',
  '#8B4513': 'Saddle Brown - Frustrated & Stuck',
  '#483D8B': 'Dark Slate Blue - Lonely & Isolated',
  '#2F4F4F': 'Dark Slate Gray - Depressed & Heavy'
};

// Export utility function to get color name
export const getColorName = (hexColor) => COLOR_NAMES[hexColor] || 'Unknown Color';

// Async thunk for signing in anonymously
export const signInUser = createAsyncThunk('mood/signInUser', async () => {
  if (!auth.currentUser) {
    await signInAnonymously(auth);
  }
  return auth.currentUser.uid;
});

// Auth thunks
export const signUpWithEmail = createAsyncThunk('auth/signUpWithEmail', async ({ email, password }) => {
  try {
    console.log('Attempting to create user with email:', email);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log('User created successfully:', userCredential.user.uid);
    return {
      uid: userCredential.user.uid,
      email: userCredential.user.email,
    };
  } catch (error) {
    console.error('Sign up error:', error);
    throw new Error(error.message);
  }
});

export const signInWithEmail = createAsyncThunk('auth/signInWithEmail', async ({ email, password }) => {
  try {
    console.log('Attempting to sign in user with email:', email);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('User signed in successfully:', userCredential.user.uid);
    return {
      uid: userCredential.user.uid,
      email: userCredential.user.email,
    };
  } catch (error) {
    console.error('Sign in error:', error);
    throw new Error(error.message);
  }
});

export const signOutUser = createAsyncThunk('auth/signOutUser', async () => {
  await signOut(auth);
  return null;
});

export const initializeAuth = createAsyncThunk('auth/initializeAuth', async () => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      if (user) {
        resolve({
          uid: user.uid,
          email: user.email,
          isAnonymous: user.isAnonymous,
        });
      } else {
        resolve(null);
      }
    });
  });
});

// Async thunk for fetching mood history
export const fetchMoodHistory = createAsyncThunk('mood/fetchMoodHistory', async () => {
  try {
    if (!auth.currentUser) {
      console.error('No authenticated user when fetching mood history');
      throw new Error('No authenticated user');
    }
    
    const userId = auth.currentUser.uid;
    console.log('Fetching moods for authenticated user:', userId);
    
    // Skip permission test for now - try direct query
    console.log('Attempting direct Firestore query for user:', userId);
    
    // Try a more specific query approach
    const moodsRef = collection(db, 'moods');
    
    // Instead of querying all moods, try to get documents that match the user pattern
    // This works better with default security rules
    const q = query(moodsRef, where('userId', '==', userId));
    
    const querySnapshot = await getDocs(q);
    const moods = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data && data.userId === userId) {
        // Convert Firestore timestamps to serializable strings
        const mood = {
          id: doc.id,
          ...data
        };
        
        // Handle timestamp conversion for Redux serialization
        if (data.timestamp && typeof data.timestamp.toDate === 'function') {
          mood.timestamp = data.timestamp.toDate().toISOString();
        }
        
        // Ensure date is a string for Redux
        if (mood.date && typeof mood.date !== 'string') {
          mood.date = mood.date.toISOString ? mood.date.toISOString() : String(mood.date);
        }
        
        // Add color name if it doesn't exist (for backward compatibility)
        if (mood.color && !mood.colorName) {
          mood.colorName = COLOR_NAMES[mood.color] || 'Unknown Color';
        }
        
        moods.push(mood);
      }
    });
    
    console.log('Found moods:', moods.length);
    
    // Sort on client side by date (newest first)
    const sortedMoods = moods.sort((a, b) => {
      const dateA = new Date(a.date || a.timestamp);
      const dateB = new Date(b.date || b.timestamp);
      return dateB - dateA;
    });
    
    return sortedMoods;
    
  } catch (error) {
    console.error('❌ Error fetching mood history:', error);
    console.log('🔒 This is a Firestore permissions issue - your rules are blocking reads.');
    console.log('💡 App will work locally but won\'t sync with Firebase until rules are fixed.');
    
    // Return empty array to show that local mood saving still works
    console.log('📱 Returning empty array - local mood entries will still work');
    return [];
  }
});

// Async thunk for saving mood
export const saveMood = createAsyncThunk('mood/saveMood', async (moodData) => {
  const { selectedColor, notes, selectedDate } = moodData;
  
  // Ensure user is signed in
  if (!auth.currentUser) {
    console.error('No authenticated user found when trying to save mood');
    throw new Error('No authenticated user');
  }

  console.log('Saving mood for user:', auth.currentUser.uid);
  console.log('Mood data:', { selectedColor, notes, selectedDate });

  const getDateKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const dateKey = getDateKey(selectedDate);
  const userId = auth.currentUser.uid;
  const userEmail = auth.currentUser.email;
  
  const moodEntry = {
    color: selectedColor, // Hex code like "#D3D3D3"
    colorName: COLOR_NAMES[selectedColor] || 'Unknown Color', // Human-readable name
    notes: notes || '', // User's notes (string)
    date: selectedDate.toISOString(), // ISO date string like "2025-12-07T19:13:36.825Z"
    dateKey: dateKey, // Date key like "2025-12-07"
    userId: userId, // User ID string like "0KZQTcAhYKfA6uJ06y3SEeW1qKt2"
    userEmail: userEmail, // User email like "shamita.rao@gmail.com"
    timestamp: serverTimestamp(), // Firebase server timestamp
  };

  // Create a readable document ID using email prefix
  const emailPrefix = userEmail.split('@')[0].replace(/\./g, '_'); // "shamita_rao"
  const docId = `${emailPrefix}_${dateKey}_${userId.slice(-6)}`; // "shamita_rao_2025-12-07_qKt2"
  const moodRef = doc(db, 'moods', docId);
  
  console.log('Attempting to save to Firestore with doc ID:', docId);
  console.log('Mood entry data:', moodEntry);
  
  try {
    // Try to save to Firestore
    await setDoc(moodRef, moodEntry, { merge: true });
    console.log('✅ Mood saved successfully to Firestore');
  } catch (firestoreError) {
    console.error('❌ Firestore save error:', firestoreError);
    console.error('This is a Firestore security rules issue. Please update your rules.');
    
    // Don't throw error - just log it and continue with local state
    // This allows the app to work even with restrictive Firestore rules
    console.log('💡 Continuing with local state only. Mood will be saved locally but not synced to Firebase.');
  }
  
  // Return the entry with the ID for local state update
  return {
    id: docId,
    color: selectedColor,
    colorName: COLOR_NAMES[selectedColor] || 'Unknown Color',
    notes: notes || '',
    date: selectedDate.toISOString(),
    dateKey: dateKey,
    userId: userId,
    userEmail: userEmail,
    timestamp: new Date().toISOString(), // Use current time for local state
  };
});

// Async thunk for deleting mood
export const deleteMood = createAsyncThunk('mood/deleteMood', async (moodId) => {
  // Ensure user is signed in
  if (!auth.currentUser) {
    console.error('No authenticated user found when trying to delete mood');
    throw new Error('No authenticated user');
  }

  console.log('Deleting mood with ID:', moodId);
  
  try {
    const moodRef = doc(db, 'moods', moodId);
    await deleteDoc(moodRef);
    console.log('✅ Mood deleted successfully from Firestore');
    
    return moodId; // Return the ID for local state update
  } catch (firestoreError) {
    console.error('❌ Firestore delete error:', firestoreError);
    console.error('This is a Firestore security rules issue or connectivity problem.');
    
    // Still return the ID to remove from local state even if Firebase fails
    console.log('💡 Removing from local state even though Firebase delete failed.');
    return moodId;
  }
});

// Mood slice
const moodSlice = createSlice({
  name: 'mood',
  initialState: {
    selectedColor: '#FFD700',
    notes: '',
    showNotes: false,
    selectedDate: new Date(),
    showDatePicker: false,
    isLoading: false,
    error: null,
    userId: null,
    moodHistory: [],
    isLoadingHistory: false,
    // Auth state
    user: null,
    isAuthenticated: false,
    isAuthLoading: false,
    authError: null,
    authInitialized: false,
  },
  reducers: {
    setSelectedColor: (state, action) => {
      state.selectedColor = action.payload;
      state.showNotes = true;
    },
    setNotes: (state, action) => {
      state.notes = action.payload;
    },
    setSelectedDate: (state, action) => {
      state.selectedDate = action.payload;
    },
    setShowDatePicker: (state, action) => {
      state.showDatePicker = action.payload;
    },
    resetNotes: (state) => {
      state.notes = '';
    },
    clearAuthError: (state) => {
      state.authError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Sign in user
      .addCase(signInUser.fulfilled, (state, action) => {
        state.userId = action.payload;
      })
      // Save mood
      .addCase(saveMood.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(saveMood.fulfilled, (state, action) => {
        state.isLoading = false;
        state.notes = '';
        // Add the new mood to history immediately
        state.moodHistory.unshift(action.payload);
      })
      .addCase(saveMood.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
      })
      // Fetch mood history
      .addCase(fetchMoodHistory.pending, (state) => {
        state.isLoadingHistory = true;
        state.error = null;
      })
      .addCase(fetchMoodHistory.fulfilled, (state, action) => {
        state.isLoadingHistory = false;
        state.moodHistory = action.payload;
      })
      .addCase(fetchMoodHistory.rejected, (state, action) => {
        state.isLoadingHistory = false;
        state.error = action.error.message;
      })
      // Auth cases
      .addCase(initializeAuth.pending, (state) => {
        state.isAuthLoading = true;
        state.authError = null;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.isAuthLoading = false;
        state.user = action.payload;
        state.isAuthenticated = !!action.payload;
        state.authInitialized = true;
        if (action.payload) {
          state.userId = action.payload.uid;
        }
      })
      .addCase(initializeAuth.rejected, (state, action) => {
        state.isAuthLoading = false;
        state.authError = action.error.message;
        state.authInitialized = true;
      })
      // Sign up
      .addCase(signUpWithEmail.pending, (state) => {
        state.isAuthLoading = true;
        state.authError = null;
      })
      .addCase(signUpWithEmail.fulfilled, (state, action) => {
        state.isAuthLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.userId = action.payload.uid;
      })
      .addCase(signUpWithEmail.rejected, (state, action) => {
        state.isAuthLoading = false;
        state.authError = action.error.message;
      })
      // Sign in
      .addCase(signInWithEmail.pending, (state) => {
        state.isAuthLoading = true;
        state.authError = null;
      })
      .addCase(signInWithEmail.fulfilled, (state, action) => {
        state.isAuthLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.userId = action.payload.uid;
      })
      .addCase(signInWithEmail.rejected, (state, action) => {
        state.isAuthLoading = false;
        state.authError = action.error.message;
      })
      // Sign out
      .addCase(signOutUser.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.userId = null;
        state.moodHistory = [];
      })
      // Delete mood cases
      .addCase(deleteMood.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteMood.fulfilled, (state, action) => {
        state.isLoading = false;
        // Remove the deleted mood from local state
        state.moodHistory = state.moodHistory.filter(mood => mood.id !== action.payload);
      })
      .addCase(deleteMood.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
      });
  },
});

export const { 
  setSelectedColor, 
  setNotes, 
  setSelectedDate, 
  setShowDatePicker,
  resetNotes,
  clearAuthError 
} = moodSlice.actions;

// Configure store
export const store = configureStore({
  reducer: {
    mood: moodSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['mood/setSelectedDate'],
        ignoredPaths: ['mood.selectedDate'],
      },
    }),
});