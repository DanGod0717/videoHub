import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import type { Video } from '../../types';

export function VideoCard({ video }: { video: Video }) {
  const formatCount = (num: number) => {
    if (num >= 10000) return (num / 10000).toFixed(1) + '万';
    return String(num);
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const sec = Math.floor(diff / 1000);
    if (sec < 60) return '刚刚';
    const mins = Math.floor(sec / 60);
    if (mins < 60) return `${mins}分钟前`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}小时前`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}天前`;
    if (days < 365) return `${Math.floor(days / 30)}个月前`;
    return `${Math.floor(days / 365)}年前`;
  };

  return (
    <TouchableOpacity style={styles.card} onPress={() => router.push(`/video/${video.id}`)} activeOpacity={0.85}>
      {/* 封面图 */}
      <View style={styles.coverWrap}>
        {video.thumbnail_url ? (
          <Image source={{ uri: video.thumbnail_url }} style={styles.cover} />
        ) : (
          <View style={styles.coverPlaceholder}>
            <Text style={styles.coverIcon}>🎬</Text>
          </View>
        )}
        {/* 时长标签 */}
        {video.duration && (
          <View style={styles.durationTag}>
            <Text style={styles.durationText}>
              {Math.floor(video.duration / 60)}:{String(video.duration % 60).padStart(2, '0')}
            </Text>
          </View>
        )}
        {/* 播放量 */}
        <View style={styles.viewTag}>
          <Text style={styles.viewText}>{formatCount(video.view_count)}</Text>
        </View>
      </View>

      {/* 标题 */}
      <Text style={styles.title} numberOfLines={2}>
        {video.title}
      </Text>

      {/* 作者信息 */}
      <View style={styles.authorRow}>
        <Text style={styles.author}>{video.user?.username ?? '未知'}</Text>
      </View>

      {/* 底部 meta */}
      <Text style={styles.meta}>
        {formatCount(video.view_count)}播放 · {timeAgo(video.created_at)}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    maxWidth: '25%',
    minWidth: 240,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  coverWrap: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 10,
  },
  cover: {
    width: '100%',
    aspectRatio: 16 / 10,
    backgroundColor: '#e8e8e8',
  },
  coverPlaceholder: {
    width: '100%',
    aspectRatio: 16 / 10,
    backgroundColor: '#f0f0ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverIcon: { fontSize: 32, opacity: 0.5 },
  durationTag: {
    position: 'absolute', bottom: 6, right: 6,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
  },
  durationText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  viewTag: {
    position: 'absolute', bottom: 6, left: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
  },
  viewText: { color: '#fff', fontSize: 11 },
  title: {
    fontSize: 14,
    fontWeight: '500',
    color: '#18191c',
    lineHeight: 20,
    marginBottom: 6,
  },
  authorRow: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 2,
  },
  author: { fontSize: 12, color: '#9499a0' },
  meta: { fontSize: 11, color: '#9499a0', marginTop: 2 },
});
