import { View, FlatList, StyleSheet, Text, RefreshControl } from 'react-native';
import { useVideos } from '../../hooks/useVideos';
import { VideoCard } from '../../components/video/VideoCard';
import { Loading } from '../../components/ui/Loading';
import { useState, useCallback } from 'react';

export default function HomeScreen() {
  const { videos, loading, refetch } = useVideos();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, []);

  return (
    <View style={styles.container}>
      {loading ? <Loading /> : (
        <FlatList
          data={videos}
          keyExtractor={(item) => item.id}
          numColumns={4}
          renderItem={({ item }) => <VideoCard video={item} />}
          contentContainerStyle={videos.length === 0 ? styles.emptyContainer : styles.grid}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🎬</Text>
              <Text style={styles.emptyTitle}>还没有视频</Text>
              <Text style={styles.emptyDesc}>成为第一个上传视频的人吧</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f5f7' },
  grid: { padding: 16, gap: 12 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { alignItems: 'center' },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 8 },
  emptyDesc: { fontSize: 14, color: '#999' },
});
