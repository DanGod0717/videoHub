import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { Header } from '../../components/layout/Header';

export default function TabLayout() {
  return (
    <View style={styles.shell}>
      <Header />
      <Tabs screenOptions={{ headerShown: false, tabBarStyle: { display: 'none' } }}>
        <Tabs.Screen name="home" />
        <Tabs.Screen name="upload" />
        <Tabs.Screen name="profile" />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: '#f4f5f7' },
});
