import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native';
import { Provider } from 'react-redux';
import { store } from './store';
import MoodSelectionScreen from './MoodSelectionScreen';

export default function App() {
  return (
    <Provider store={store}>
      <SafeAreaView style={styles.container}>
        <MoodSelectionScreen />
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
};
