import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { Provider } from 'react-redux';
import { store } from './store';
import HomeScreen from './HomeScreen';
import HistoryScreen from './HistoryScreen';

export default function App() {
  const [activeTab, setActiveTab] = useState('Home');

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

  return (
    <Provider store={store}>
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
        </View>
        
        <StatusBar style="auto" />
      </SafeAreaView>
    </Provider>
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
  activeTab: {
    // Add any active tab styling here if needed
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
