import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSelector, useDispatch } from 'react-redux';
import { 
  setSelectedColor, 
  setNotes, 
  setSelectedDate, 
  setShowDatePicker,
  saveMood,
  getColorName
} from './store';

const HomeScreen = () => {
  const dispatch = useDispatch();
  
  const {
    selectedColor,
    notes,
    showNotes,
    selectedDate,
    showDatePicker,
    isLoading,
    error
  } = useSelector((state) => state.mood);

  const colorOptions = [
    // Positive emotions
    '#FFD700',  // Gold - Joyful & Radiant
    '#FF69B4',  // Hot Pink - Excited & Energetic
    '#32CD32',  // Lime Green - Happy & Alive
    '#FF6347',  // Tomato - Passionate & Enthusiastic
    '#FFA500',  // Orange - Optimistic & Cheerful
    
    // Negative emotions
    '#708090',  // Slate Gray - Sad & Melancholy
    '#4682B4',  // Steel Blue - Anxious & Worried
    '#8B4513',  // Saddle Brown - Frustrated & Stuck
    '#483D8B',  // Dark Slate Blue - Lonely & Isolated
    '#2F4F4F',  // Dark Slate Gray - Depressed & Heavy
  ];

  const handleColorSelect = (color) => {
    dispatch(setSelectedColor(color));
  };

  const handleDateChange = (event, date) => {
    if (Platform.OS === 'android') {
      dispatch(setShowDatePicker(false));
    }
    if (date) {
      dispatch(setSelectedDate(date));
    }
  };

  const formatDate = (date) => {
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(date).toLocaleDateString('en-US', options);
  };

  const isToday = (date) => {
    const today = new Date();
    return new Date(date).toDateString() === today.toDateString();
  };

  const saveMoodEntry = async () => {
    if (isLoading) return;
    
    try {
      await dispatch(saveMood({ selectedColor, notes, selectedDate })).unwrap();
      
      Alert.alert(
        'Mood Saved! 🎨', 
        `Your mood for ${formatDate(selectedDate)} has been saved successfully.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error saving mood entry:', error);
      Alert.alert(
        'Save Failed',
        'There was an error saving your mood entry. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {isToday(selectedDate) ? 'How are you feeling today?' : 'How were you feeling?'}
        </Text>
        <Text style={styles.subtitle}>Choose a color that represents your mood</Text>
      </View>

      <View style={styles.dateSection}>
        <Text style={styles.dateLabel}>Select Date</Text>
        <TouchableOpacity 
          style={styles.dateSelector}
          onPress={() => dispatch(setShowDatePicker(true))}
        >
          <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
          <Text style={styles.dateIcon}>📅</Text>
        </TouchableOpacity>
        
        {showDatePicker && (
          <DateTimePicker
            value={new Date(selectedDate)}
            mode="date"
            display={Platform.OS === 'ios' ? 'compact' : 'default'}
            onChange={handleDateChange}
            maximumDate={new Date()}
          />
        )}
        
        {Platform.OS === 'ios' && showDatePicker && (
          <TouchableOpacity 
            style={styles.datePickerDone}
            onPress={() => dispatch(setShowDatePicker(false))}
          >
            <Text style={styles.datePickerDoneText}>Done</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.selectedColorContainer}>
        <View style={[styles.selectedColorCircle, { backgroundColor: selectedColor }]} />
        <Text style={styles.selectedColorText}>Current Selection</Text>
        <Text style={styles.colorNameText}>{getColorName(selectedColor)}</Text>
      </View>

      <View style={styles.colorGrid}>
        {colorOptions.map((color, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.colorOption,
              { backgroundColor: color },
              selectedColor === color && styles.selectedBorder
            ]}
            onPress={() => handleColorSelect(color)}
          />
        ))}
      </View>

      {showNotes && (
        <View style={styles.notesSection}>
          <Text style={styles.notesLabel}>Add a note (optional)</Text>
          <TouchableOpacity
            style={styles.notesInput}
            onPress={() => {
              Alert.prompt(
                'Add Note',
                'How are you feeling?',
                (text) => dispatch(setNotes(text)),
                'plain-text',
                notes
              );
            }}
          >
            <Text style={styles.notesText}>
              {notes || 'Tap to add a note...'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {showNotes && (
        <TouchableOpacity 
          style={[styles.saveButton, isLoading && styles.saveButtonDisabled]} 
          onPress={saveMoodEntry}
          disabled={isLoading}
        >
          <Text style={styles.saveButtonText}>
            {isLoading ? 'Saving...' : (isToday(selectedDate) ? 'Save Today\'s Mood' : 'Save Mood Entry')}
          </Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#FEFEFE',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 30,
  },
  dateSection: {
    marginBottom: 30,
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 10,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minWidth: 250,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dateText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  dateIcon: {
    fontSize: 18,
  },
  datePickerDone: {
    backgroundColor: '#FFB6C1',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginTop: 10,
  },
  datePickerDoneText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  selectedColorContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  selectedColorCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedColorText: {
    fontSize: 14,
    color: '#666',
  },
  colorNameText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    marginTop: 4,
    fontStyle: 'italic',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 15,
    marginBottom: 30,
  },
  colorOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  selectedBorder: {
    borderWidth: 3,
    borderColor: '#333',
  },
  notesSection: {
    marginBottom: 30,
  },
  notesLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 10,
  },
  notesInput: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 15,
    minHeight: 60,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  notesText: {
    fontSize: 16,
    color: '#666',
  },
  saveButton: {
    backgroundColor: '#FFB6C1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonDisabled: {
    backgroundColor: '#D3D3D3',
    shadowOpacity: 0.05,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
};

export default HomeScreen;