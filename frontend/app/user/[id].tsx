import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function UserScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>用户主页</Text>
      <Text style={styles.subtitle}>User ID: {id}</Text>
      <Text style={styles.desc}>该用户发布的视频列表待实现</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#888', marginBottom: 16 },
  desc: { fontSize: 14, color: '#aaa' },
});
