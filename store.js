import { configureStore, createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { db, auth } from './firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';

// Async thunk for signing in anonymously
export const signInUser = createAsyncThunk('mood/signInUser', async () => {
  if (!auth.currentUser) {
    await signInAnonymously(auth);
  }
  return auth.currentUser.uid;
});

// Async thunk for saving mood
export const saveMood = createAsyncThunk('mood/saveMood', async (moodData) => {
  const { selectedColor, notes, selectedDate } = moodData;
  
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

  const moodRef = doc(db, 'moods', `${userId}_${dateKey}`);
  await setDoc(moodRef, moodEntry, { merge: true });
  
  return moodEntry;
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
      .addCase(saveMood.fulfilled, (state) => {
        state.isLoading = false;
        state.notes = '';
      })
      .addCase(saveMood.rejected, (state, action) => {
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