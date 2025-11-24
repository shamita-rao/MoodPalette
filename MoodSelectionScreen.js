import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';

const MoodSelectionScreen = () => {
  const [selectedColor, setSelectedColor] = useState('#FFB6C1'); // Light pink default
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);

  // Pastel color palette for quick selection
  const colorOptions = [
    '#FFB6C1', // Light Pink - Happy/Love
    '#DDA0DD', // Plum - Dreamy
    '#98FB98', // Pale Green - Calm/Peaceful
    '#87CEEB', // Sky Blue - Content
    '#F0E68C', // Khaki - Energetic
    '#FFA07A', // Light Salmon - Excited
    '#D3D3D3', // Light Gray - Neutral
    '#DEB887', // Burlywood - Cozy
    '#B0E0E6', // Powder Blue - Serene
    '#F5DEB3', // Wheat - Warm
    '#E6E6FA', // Lavender - Relaxed
    '#FFEFD5', // Papaya Whip - Cheerful
  ];

  const handleColorSelect = (color) => {
    setSelectedColor(color);
    setShowNotes(true);
  };

  const saveMoodEntry = () => {
    // For now, just show an alert - we'll integrate Firebase later
    Alert.alert(
      'Mood Saved!', 
      `Color: ${selectedColor}\nNotes: ${notes || 'No notes'}`,
      [{ text: 'OK' }]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>How are you feeling today?</Text>
        <Text style={styles.subtitle}>Choose a color that represents your mood</Text>
      </View>

      {/* Selected Color Display */}
      <View style={styles.selectedColorContainer}>
        <View style={[styles.selectedColorCircle, { backgroundColor: selectedColor }]} />
        <Text style={styles.selectedColorText}>Current Selection</Text>
      </View>

      {/* Color Grid */}
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

      {/* Notes Section */}
      {showNotes && (
        <View style={styles.notesSection}>
          <Text style={styles.notesLabel}>Add a note (optional)</Text>
          <TouchableOpacity
            style={styles.notesInput}
            onPress={() => {
              Alert.prompt(
                'Add Note',
                'How are you feeling?',
                (text) => setNotes(text),
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

      {/* Save Button */}
      {showNotes && (
        <TouchableOpacity style={styles.saveButton} onPress={saveMoodEntry}>
          <Text style={styles.saveButtonText}>Save Today's Mood</Text>
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
    marginBottom: 40,
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
  saveButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
};

export default MoodSelectionScreen;