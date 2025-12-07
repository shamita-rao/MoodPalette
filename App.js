import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Provider, useSelector, useDispatch } from 'react-redux';
import { store, initializeAuth, signOutUser } from './store';
import HomeScreen from './HomeScreen';
import HistoryScreen from './HistoryScreen';
import AuthScreen from './AuthScreen';

const MainApp = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, authInitialized, isAuthLoading, user } = useSelector((state) => state.mood);
  const [activeTab, setActiveTab] = useState('Home');

  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  const handleSignOut = () => {
    dispatch(signOutUser());
  };

  const renderScreen = () => {
    switch (activeTab) {
      case 'Home':
        return <HomeScreen />;
      case 'History':
        return <HistoryScreen />;
      default:
        return <HomeScreen />;
    }
  };

  // Loading while checking authentication
  if (!authInitialized || isAuthLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFB6C1" />
          <Text style={styles.loadingText}>Loading Mood Palette...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Auth screen if not authenticated
  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  // Main app if authenticated
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {renderScreen()}
      </View>
      
      {/* Custom Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'Home' && styles.activeTab]}
          onPress={() => setActiveTab('Home')}
        >
          <Text style={[styles.tabIcon, activeTab === 'Home' && styles.activeTabIcon]}>
            🏠
          </Text>
          <Text style={[styles.tabLabel, activeTab === 'Home' && styles.activeTabLabel]}>
            Home
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'History' && styles.activeTab]}
          onPress={() => setActiveTab('History')}
        >
          <Text style={[styles.tabIcon, activeTab === 'History' && styles.activeTabIcon]}>
            📊
          </Text>
          <Text style={[styles.tabLabel, activeTab === 'History' && styles.activeTabLabel]}>
            History
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab]}
          onPress={handleSignOut}
        >
          <Text style={[styles.tabIcon]}>
            🚪
          </Text>
          <Text style={[styles.tabLabel]}>
            Sign Out
          </Text>
        </TouchableOpacity>
      </View>
      
      <StatusBar style="auto" />
    </SafeAreaView>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <Provider store={store}>
        <MainApp />
      </Provider>
    </SafeAreaProvider>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#FEFEFE',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    color: '#666',
    fontWeight: '500',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FEFEFE',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingBottom: 5,
    paddingTop: 10,
    height: 70,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 24,
    marginBottom: 4,
    color: '#666',
  },
  activeTabIcon: {
    color: '#FFB6C1',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  activeTabLabel: {
    color: '#FFB6C1',
  },
};
