import { configureStore, createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { db, auth } from './firebase';
import { doc, setDoc, serverTimestamp, collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';

// Async thunk for signing in anonymously
export const signInUser = createAsyncThunk('mood/signInUser', async () => {
  if (!auth.currentUser) {
    await signInAnonymously(auth);
  }
  return auth.currentUser.uid;
});

// Async thunk for fetching mood history
export const fetchMoodHistory = createAsyncThunk('mood/fetchMoodHistory', async () => {
  try {
    if (!auth.currentUser) {
      await signInAnonymously(auth);
    }
    
    const userId = auth.currentUser.uid;
    console.log('Fetching moods for user:', userId);
    
    // Try to get a specific document first to test permissions
    const testDocId = `${userId}_test`;
    const testDocRef = doc(db, 'moods', testDocId);
    
    try {
      await testDocRef.get?.() || getDocs(query(collection(db, 'moods'), where('__name__', '==', testDocId)));
    } catch (testError) {
      console.log('Firestore permissions test failed, returning empty array');
      return [];
    }
    
    // If we get here, permissions seem OK, try the actual query
    const moodsRef = collection(db, 'moods');
    const q = query(
      moodsRef, 
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    const moods = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data && data.userId === userId) {
        moods.push({
          id: doc.id,
          ...data
        });
      }
    });
    
    console.log('Found moods:', moods.length);
    
    // Sort on client side
    const sortedMoods = moods.sort((a, b) => {
      return new Date(b.date) - new Date(a.date);
    });
    
    return sortedMoods;
    
  } catch (error) {
    console.error('Error fetching mood history:', error);
    console.log('Firestore might not be properly configured. Using demo mode.');
    
    // Return demo data when Firebase isn't working
    const demoMoods = [
      {
        id: 'demo_1',
        color: '#FFB6C1',
        notes: 'Demo entry - feeling great!',
        date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        dateKey: new Date(Date.now() - 86400000).toISOString().split('T')[0],
        userId: 'demo_user'
      },
      {
        id: 'demo_2', 
        color: '#87CEEB',
        notes: 'Demo entry - peaceful day',
        date: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        dateKey: new Date(Date.now() - 172800000).toISOString().split('T')[0],
        userId: 'demo_user'
      }
    ];
    
    console.log('Returning demo mood data');
    return demoMoods;
  }
});

// Async thunk for saving mood
export const saveMood = createAsyncThunk('mood/saveMood', async (moodData) => {
  const { selectedColor, notes, selectedDate } = moodData;
  
  // Ensure user is signed in
  if (!auth.currentUser) {
    await signInAnonymously(auth);
  }
  
  const getDateKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const dateKey = getDateKey(selectedDate);
  const userId = auth.currentUser.uid;
  
  const moodEntry = {
    color: selectedColor,
    notes: notes || '',
    date: selectedDate.toISOString(),
    dateKey: dateKey,
    userId: userId,
    timestamp: serverTimestamp(),
  };

  // Use a simpler document ID structure
  const moodRef = doc(db, 'moods', `${userId}_${dateKey}`);
  await setDoc(moodRef, moodEntry, { merge: true });
  
  // Return the entry with the ID for local state update
  return {
    id: `${userId}_${dateKey}`,
    ...moodEntry,
    timestamp: new Date().toISOString(), // Use current time for local state
  };
});

// Mood slice
const moodSlice = createSlice({
  name: 'mood',
  initialState: {
    selectedColor: '#FFB6C1',
    notes: '',
    showNotes: false,
    selectedDate: new Date(),
    showDatePicker: false,
    isLoading: false,
    error: null,
    userId: null,
    moodHistory: [],
    isLoadingHistory: false,
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
      });
  },
});

export const { 
  setSelectedColor, 
  setNotes, 
  setSelectedDate, 
  setShowDatePicker,
  resetNotes 
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