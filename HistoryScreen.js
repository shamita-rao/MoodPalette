import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Share, Modal } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { fetchMoodHistory, deleteMood, editMood, openEditModal, closeEditModal, setEditColor, setEditNotes } from './store';

const HistoryScreen = () => {
  const dispatch = useDispatch();
  const { moodHistory, isLoadingHistory, error, user, showEditModal, editingMood, editColor, editNotes, isEditingLoading } = useSelector((state) => state.mood);
  
  // Filter
  const [selectedFilter, setSelectedFilter] = useState('monthly');

  useEffect(() => {
    dispatch(fetchMoodHistory());
  }, [dispatch]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    };
    return date.toLocaleDateString('en-US', options);
  };

  const getFilteredMoods = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    // Calculate start of current week (Sunday)
    const currentWeekStart = new Date(now);
    currentWeekStart.setDate(now.getDate() - now.getDay());

    return moodHistory.filter(mood => {
      const moodDate = new Date(mood.date);
      
      switch (selectedFilter) {
        case 'weekly':
          const sevenDaysAgo = new Date(now);
          sevenDaysAgo.setDate(now.getDate() - 7);
          return moodDate >= sevenDaysAgo;
        
        case 'monthly':
          const thirtyDaysAgo = new Date(now);
          thirtyDaysAgo.setDate(now.getDate() - 30);
          return moodDate >= thirtyDaysAgo;
          
        case 'yearly':
          return moodDate.getFullYear() === currentYear;
        
        case 'all':
        default:
          return true;
      }
    });
  };

  const getFilterLabel = () => {
    switch (selectedFilter) {
      case 'weekly': return 'Past 7 Days';
      case 'monthly': return 'Past 30 Days';
      case 'yearly': return 'This Year';
      case 'all': return 'All Time';
      default: return 'All Time';
    }
  };

  const exportMoodHistory = async () => {
    try {
      const filteredMoods = getFilteredMoods();
      
      if (filteredMoods.length === 0) {
        Alert.alert('No Data', 'No moods to export for the selected period.');
        return;
      }

      // Color to emoji mapping
      const colorEmojis = {
        // Positive emotions
        '#FFD700': '💛', // Gold - Joyful & Radiant (yellow heart)
        '#FF69B4': '🩷', // Pink - Excited & Energetic (pink heart)
        '#32CD32': '💚', // Lime Green - Happy & Alive (green heart)
        '#FF6347': '❤️', // Tomato - Passionate & Enthusiastic (red heart)
        '#FFA500': '🧡', // Orange - Optimistic & Cheerful (orange heart)
        
        // Negative emotions
        '#708090': '🩶', // Slate Gray - Sad & Melancholy (grey heart)
        '#4682B4': '💙', // Steel Blue - Anxious & Worried (blue heart)
        '#8B4513': '🤎', // Saddle Brown - Frustrated & Stuck (brown heart)
        '#483D8B': '💜', // Dark Slate Blue - Lonely & Isolated (purple heart)
        '#2F4F4F': '🖤', // Dark Slate Gray - Depressed & Heavy (black heart)
      };

      // Mood colors in chronological order
      const moodColors = filteredMoods
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .map(mood => colorEmojis[mood.color] || '⬜');

      // Grid (8 emojis per row)
      const rows = [];
      for (let i = 0; i < moodColors.length; i += 8) {
        rows.push(moodColors.slice(i, i + 8).join(''));
      }

      const colorGrid = rows.join('\n');
      
      const shareOptions = {
        message: `🎨 My Mood Palette (${getFilterLabel()}):\n\n${colorGrid}\n\nEach emoji represents a day's mood!`,
        title: `Mood Palette - ${getFilterLabel()}`,
      };

      await Share.share(shareOptions);
    } catch (error) {
      console.error('Error sharing mood history:', error);
      Alert.alert('Export Failed', 'There was an error exporting your mood history.');
    }
  };

  const groupMoodsByMonth = (moods) => {
    const groups = {};
    moods.forEach(mood => {
      const date = new Date(mood.date);
      const monthYear = `${date.getFullYear()}-${date.getMonth()}`;
      if (!groups[monthYear]) {
        groups[monthYear] = [];
      }
      groups[monthYear].push(mood);
    });
    return groups;
  };

  const getMonthName = (monthYear) => {
    const [year, month] = monthYear.split('-');
    const date = new Date(year, month);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Main component return
  if (isLoadingHistory) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FFB6C1" />
        <Text style={styles.loadingText}>Loading your mood history...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Firestore Setup Needed 🔧</Text>
        <Text style={styles.errorSubtext}>
          Please set up your Firebase Firestore database in test mode to view mood history.
        </Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => dispatch(fetchMoodHistory())}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (moodHistory.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyTitle}>No mood entries yet! 🎨</Text>
        <Text style={styles.emptySubtitle}>Start tracking your moods to see them here</Text>
      </View>
    );
  }

  const filteredMoods = getFilteredMoods();
  const groupedMoods = groupMoodsByMonth(filteredMoods);

  // Empty state for filtered results
  if (filteredMoods.length === 0 && moodHistory.length > 0) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>
          <Text style={styles.title}>Your Mood History</Text>
          <Text style={styles.subtitle}>
            {filteredMoods.length} of {moodHistory.length} entries
          </Text>
        </View>

        <View style={styles.filterContainer}>
          {[
            { key: 'weekly', label: '7 Days' },
            { key: 'monthly', label: '30 Days' },
            { key: 'yearly', label: 'This Year' },
            { key: 'all', label: 'All' }
          ].map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterButton,
                selectedFilter === filter.key && styles.activeFilterButton
              ]}
              onPress={() => setSelectedFilter(filter.key)}
            >
              <Text style={[
                styles.filterButtonText,
                selectedFilter === filter.key && styles.activeFilterButtonText
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.centerContainer}>
          <Text style={styles.emptyTitle}>No moods for this {selectedFilter === 'all' ? 'period' : selectedFilter.slice(0, -2)} 📅</Text>
          <Text style={styles.emptySubtitle}>Try selecting a different time period</Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>
        <Text style={styles.title}>Your Mood History</Text>
        <Text style={styles.subtitle}>
          {filteredMoods.length} of {moodHistory.length} entries
        </Text>
      </View>

      {/* Filter buttons */}
      <View style={styles.filterContainer}>
        {[
          { key: 'weekly', label: '7 Days' },
          { key: 'monthly', label: '30 Days' },
          { key: 'yearly', label: 'This Year' },
          { key: 'all', label: 'All' }
        ].map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterButton,
              selectedFilter === filter.key && styles.activeFilterButton
            ]}
            onPress={() => setSelectedFilter(filter.key)}
          >
            <Text style={[
              styles.filterButtonText,
              selectedFilter === filter.key && styles.activeFilterButtonText
            ]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Export button */}
      {filteredMoods.length > 0 && (
        <View style={styles.exportContainer}>
          <TouchableOpacity 
            style={styles.exportButton}
            onPress={exportMoodHistory}
          >
            <Text style={styles.exportButtonText}>📤 Export {getFilterLabel()}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Mood entries grouped by month */}
      {Object.entries(groupedMoods)
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([monthYear, moods]) => (
        <View key={monthYear} style={styles.monthSection}>
          <Text style={styles.monthHeader}>{getMonthName(monthYear)}</Text>
          <View style={styles.moodGrid}>
            {moods
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .map((mood) => (
              <TouchableOpacity 
                key={mood.id}
                style={[styles.moodSquare, { backgroundColor: mood.color }]}
                onLongPress={() => dispatch(openEditModal(mood))}
              >
                <View style={styles.moodContent}>
                  <Text style={styles.dateInSquare}>{formatDate(mood.date)}</Text>
                  {mood.notes && (
                    <Text style={styles.notesInSquare} numberOfLines={2}>
                      {mood.notes}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}
      
      <View style={styles.bottomPadding} />
    </ScrollView>

      {/* Edit/Delete Modal */}
    <Modal
      visible={showEditModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => dispatch(closeEditModal())}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Edit Mood</Text>
          
          {/* Color Selection */}
          <View style={styles.colorSelectionContainer}>
            <Text style={styles.colorLabel}>Choose Color</Text>
            <View style={styles.colorOptionsRow}>
              {[
                '#FFD700', '#FF69B4', '#32CD32', '#FF6347', '#FFA500',
                '#708090', '#4682B4', '#8B4513', '#483D8B', '#2F4F4F'
              ].map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOptionSmall,
                    { backgroundColor: color },
                    editColor === color && styles.colorOptionSelected
                  ]}
                  onPress={() => dispatch(setEditColor(color))}
                />
              ))}
            </View>
          </View>

          {/* Notes Edit */}
          <View style={styles.notesEditContainer}>
            <Text style={styles.notesLabel}>Edit Note</Text>
            <TouchableOpacity
              style={styles.notesEditInput}
              onPress={() => {
                Alert.prompt(
                  'Edit Note',
                  'Update your note',
                  (text) => dispatch(setEditNotes(text)),
                  'plain-text',
                  editNotes
                );
              }}
            >
              <Text style={styles.notesEditText}>
                {editNotes || 'Tap to edit note...'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButtonStyle]}
              onPress={() => {
                Alert.alert(
                  'Delete Mood Entry',
                  `Are you sure you want to delete this mood?`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          await dispatch(deleteMood(editingMood.id)).unwrap();
                          dispatch(closeEditModal());
                          Alert.alert('Deleted', 'Mood entry deleted successfully.');
                        } catch (error) {
                          Alert.alert('Delete Failed', 'There was an error deleting your mood entry.');
                        }
                      }
                    }
                  ]
                );
              }}
            >
              <Text style={styles.buttonText}>🗑️ Delete</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButtonStyle]}
              onPress={() => dispatch(closeEditModal())}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.saveButtonStyle, isEditingLoading && styles.buttonDisabled]}
              onPress={async () => {
                try {
                  await dispatch(editMood({
                    moodId: editingMood.id,
                    selectedColor: editColor,
                    notes: editNotes
                  })).unwrap();
                  dispatch(closeEditModal());
                  Alert.alert('Success', 'Mood updated successfully!');
                } catch (error) {
                  Alert.alert('Update Failed', 'There was an error updating your mood.');
                }
              }}
              disabled={isEditingLoading}
            >
              <Text style={styles.buttonText}>{isEditingLoading ? 'Saving...' : '💾 Save'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      </Modal>
    </View>
  );
};const styles = {
  container: {
    flex: 1,
    backgroundColor: '#FEFEFE',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#F8F9FA',
  },
  userInfo: {
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  userEmail: {
    fontSize: 12,
    color: '#6C757D',
    fontStyle: 'italic',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6C757D',
    fontWeight: '500',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#DEE2E6',
  },
  activeFilterButton: {
    backgroundColor: '#FFB6C1',
    borderColor: '#FFB6C1',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#6C757D',
    fontWeight: '600',
  },
  activeFilterButtonText: {
    color: '#FFFFFF',
  },
  exportContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  exportButton: {
    backgroundColor: '#28A745',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  exportButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  monthSection: {
    marginVertical: 10,
  },
  monthHeader: {
    fontSize: 20,
    fontWeight: '600',
    color: '#495057',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#F8F9FA',
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
  },
  moodSquare: {
    width: '31%',
    aspectRatio: 1,
    margin: '1%',
    borderRadius: 12,
    padding: 8,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  moodContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  dateInSquare: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  notesInSquare: {
    fontSize: 9,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    paddingHorizontal: 4,
  },
  loadingText: {
    fontSize: 16,
    color: '#6C757D',
    marginTop: 15,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#DC3545',
    textAlign: 'center',
    marginBottom: 10,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#6C757D',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#6C757D',
    textAlign: 'center',
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#ADB5BD',
    textAlign: 'center',
  },
  bottomPadding: {
    height: 20,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FEFEFE',
    borderRadius: 16,
    padding: 20,
    width: '85%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  colorSelectionContainer: {
    marginBottom: 20,
  },
  colorLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 10,
  },
  colorOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorOptionSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: '#333',
    borderWidth: 3,
  },
  notesEditContainer: {
    marginBottom: 20,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  notesEditInput: {
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    padding: 10,
    minHeight: 50,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  notesEditText: {
    fontSize: 14,
    color: '#666',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonStyle: {
    backgroundColor: '#FF6B6B',
  },
  cancelButtonStyle: {
    backgroundColor: '#D3D3D3',
  },
  saveButtonStyle: {
    backgroundColor: '#FFB6C1',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
};

export default HistoryScreen;