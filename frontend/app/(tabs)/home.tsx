import { View, FlatList, StyleSheet, Text, RefreshControl, TextInput } from 'react-native';
import { router } from 'expo-router';
import { useVideos } from '../../hooks/useVideos';
import { VideoCard } from '../../components/video/VideoCard';
import { Loading } from '../../components/ui/Loading';
import { useAuth } from '../../hooks/useAuth';
import { useState, useCallback } from 'react';

export default function HomeScreen() {
  const { videos, loading, refetch } = useVideos();
  const { user, isLoggedIn } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, []);

  if (loading) return <Loading />;

  return (
    <View style={styles.container}>
      {/* 顶部导航栏 */}
      <View style={styles.topBar}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput style={styles.searchInput} placeholder="搜索视频..." placeholderTextColor="#999" />
        </View>
        <View style={styles.topActions}>
          {isLoggedIn ? (
            <View style={styles.userBadge}>
              <View style={styles.avatar}>
                <Text style={styles.avatarLetter}>{user?.email?.[0]?.toUpperCase() ?? '?'}</Text>
              </View>
              <Text style={styles.userName}>{user?.email?.split('@')[0]}</Text>
            </View>
          ) : (
            <Text style={styles.loginBtn} onPress={() => router.push('/auth/login')}>
              登录
            </Text>
          )}
        </View>
      </View>

      {/* 分类标签 */}
      <View style={styles.tags}>
        {['推荐', '热门', '最新', '搞笑', '音乐', '游戏', '知识'].map((tag, i) => (
          <View key={tag} style={[styles.tag, i === 0 && styles.tagActive]}>
            <Text style={[styles.tagText, i === 0 && styles.tagTextActive]}>{tag}</Text>
          </View>
        ))}
      </View>

      {/* 视频网格 */}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f5f7' },
  // 顶部导航
  topBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 24, paddingVertical: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e6eb',
  },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#f1f2f3', borderRadius: 8, paddingHorizontal: 12, height: 36,
  },
  searchIcon: { fontSize: 14, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#333', outlineStyle: 'none' as any },
  topActions: { marginLeft: 24, flexDirection: 'row', alignItems: 'center' },
  userBadge: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#fb7299',
    justifyContent: 'center', alignItems: 'center', marginRight: 8,
  },
  avatarLetter: { color: '#fff', fontSize: 14, fontWeight: '700' },
  userName: { fontSize: 14, color: '#333', fontWeight: '500' },
  loginBtn: { color: '#fb7299', fontSize: 14, fontWeight: '600' },
  // 分类标签
  tags: {
    flexDirection: 'row', paddingHorizontal: 24, paddingVertical: 12,
    backgroundColor: '#fff', gap: 16, borderBottomWidth: 1, borderBottomColor: '#e5e6eb',
  },
  tag: {
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 6,
    backgroundColor: '#f1f2f3',
  },
  tagActive: { backgroundColor: '#fb7299' },
  tagText: { fontSize: 13, color: '#666' },
  tagTextActive: { color: '#fff', fontWeight: '600' },
  // 视频网格
  grid: { padding: 16, gap: 12 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { alignItems: 'center' },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 8 },
  emptyDesc: { fontSize: 14, color: '#999' },
});
