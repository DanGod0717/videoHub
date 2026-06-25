import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function VideoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View style={styles.container}>
      <View style={styles.player}>
        <Text style={styles.playerText}>视频播放器</Text>
        <Text style={styles.videoId}>Video ID: {id}</Text>
      </View>
      <Text style={styles.title}>视频详情页</Text>
      <Text style={styles.desc}>评论区、点赞等功能待实现</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  player: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#222', justifyContent: 'center', alignItems: 'center' },
  playerText: { color: '#fff', fontSize: 18, marginBottom: 8 },
  videoId: { color: '#888', fontSize: 12 },
  title: { color: '#fff', fontSize: 20, fontWeight: 'bold', padding: 16 },
  desc: { color: '#888', fontSize: 14, paddingHorizontal: 16 },
});
