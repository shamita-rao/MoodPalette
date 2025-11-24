import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native';
import MoodSelectionScreen from './MoodSelectionScreen';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <MoodSelectionScreen />
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#FEFEFE',
  },
};
