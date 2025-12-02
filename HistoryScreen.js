import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { fetchMoodHistory } from './store';

const HistoryScreen = () => {
  const dispatch = useDispatch();
  const { moodHistory, isLoadingHistory, error } = useSelector((state) => state.mood);

  useEffect(() => {
    dispatch(fetchMoodHistory());
  }, [dispatch]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
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

  const groupedMoods = groupMoodsByMonth(moodHistory);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Mood History</Text>
        <Text style={styles.subtitle}>{moodHistory.length} entries</Text>
      </View>

      {Object.entries(groupedMoods).map(([monthYear, moods]) => (
        <View key={monthYear} style={styles.monthSection}>
          <Text style={styles.monthTitle}>{getMonthName(monthYear)}</Text>
          
          <View style={styles.moodGrid}>
            {moods.map((mood) => (
              <View key={mood.id} style={styles.moodItem}>
                <View 
                  style={[styles.colorCircle, { backgroundColor: mood.color }]} 
                />
                <Text style={styles.dateText}>{formatDate(mood.date)}</Text>
                {mood.notes && (
                  <Text style={styles.notesText} numberOfLines={2}>
                    {mood.notes}
                  </Text>
                )}
              </View>
            ))}
          </View>
        </View>
      ))}
      
      <View style={styles.bottomPadding} />
    </ScrollView>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#FEFEFE',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 18,
    color: '#FF6B6B',
    marginBottom: 10,
    textAlign: 'center',
    fontWeight: '600',
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#FFB6C1',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  monthSection: {
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  moodItem: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    minWidth: 100,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  colorCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    lineHeight: 14,
  },
  bottomPadding: {
    height: 20,
  },
};

export default HistoryScreen;