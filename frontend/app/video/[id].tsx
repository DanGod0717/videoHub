import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import type { Video } from '../../types';

export default function VideoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, isLoggedIn } = useAuth();
  const { width } = useWindowDimensions();
  const isWide = width >= 1024;
  const playerRef = useRef<any>(null);

  const [video, setVideo] = useState<Video | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');

  // 获取视频
  useEffect(() => {
    if (!id) return;
    supabase.from('videos').select('*').eq('id', id).single().then(({ data: v }) => {
      if (v) setVideo(v);
    });
    supabase.from('comments').select('*, user:user_id(username)').eq('video_id', id)
      .order('created_at', { ascending: true }).then(({ data }) => setComments(data || []));

    // 播放量 +1
    supabase.rpc('increment_view', { video_id: id }).then(({ error }) => {
      if (error) console.log('播放量更新失败:', error.message);
    });
  }, [id]);

  // 播放器：用原生 DOM 方式创建 video 元素（web 兼容）
  const setupPlayer = useCallback((node: any) => {
    if (!node || !video) return;
    playerRef.current = node;

    // 清除旧内容
    while (node.firstChild) node.removeChild(node.firstChild);

    const best = video.transcoded?.[video.transcoded.length - 1];
    let url: string;
    if (best) {
      // Java 返回的 url 已含 bucket 前缀，getPublicUrl 会再加一次 → 需要去掉
      const cleanPath = best.url.replace(/^(transcoded|thumbnails)\//, '');
      url = supabase.storage.from('transcoded').getPublicUrl(cleanPath).data.publicUrl;
    } else {
      url = supabase.storage.from('raw-videos').getPublicUrl(video.original_url).data.publicUrl;
    }

    const el = document.createElement('video');
    el.src = url;
    el.controls = true;
    el.autoplay = true;
    el.style.width = '100%';
    el.style.height = '100%';
    el.style.backgroundColor = '#000';
    el.style.outline = 'none';
    node.appendChild(el);
  }, [video]);

  const sendComment = async () => {
    if (!commentText.trim()) return;
    if (!isLoggedIn) { Alert.alert('请先登录'); return; }
    await supabase.from('comments').insert({
      video_id: id, user_id: user!.id, content: commentText.trim(),
    });
    setCommentText('');
  };

  const formatCount = (n: number) => n >= 10000 ? (n / 10000).toFixed(1) + '万' : String(n);

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const sec = Math.floor(diff / 1000);
    if (sec < 60) return '刚刚';
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}分钟前`;
    const hour = Math.floor(min / 60);
    if (hour < 24) return `${hour}小时前`;
    const day = Math.floor(hour / 24);
    if (day < 30) return `${day}天前`;
    const month = Math.floor(day / 30);
    if (month < 12) return `${month}个月前`;
    return `${Math.floor(month / 12)}年前`;
  };

  if (!video) {
    return <View style={styles.container}><Text style={styles.loading}>加载中...</Text></View>;
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backText}>← 返回</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={[styles.scroll, isWide && styles.scrollWide]}>
        {/* 视频播放器 */}
        <View style={styles.player} ref={setupPlayer} />

        {/* 视频信息 */}
        <View style={styles.section}>
          <Text style={styles.videoTitle}>{video.title}</Text>
          <Text style={styles.meta}>
            {formatCount(video.view_count)} 次观看 · {timeAgo(video.created_at)}
          </Text>
          <View style={styles.actions}>
            <View style={styles.actionBtn}>
              <Text style={styles.actionIcon}>👍 {formatCount(video.like_count)}</Text>
            </View>
            <View style={styles.actionBtn}>
              <Text style={styles.actionIcon}>💬 {comments.length}</Text>
            </View>
          </View>
        </View>

        {/* 描述 */}
        {video.description ? (
          <View style={styles.section}>
            <Text style={styles.desc}>{video.description}</Text>
          </View>
        ) : null}

        {/* 评论 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>评论 ({comments.length})</Text>
          {isLoggedIn ? (
            <View style={styles.commentInputRow}>
              <TextInput
                style={styles.input}
                placeholder="发一条友善的评论..."
                placeholderTextColor="#999"
                value={commentText}
                onChangeText={setCommentText}
                onSubmitEditing={sendComment}
              />
              <TouchableOpacity style={styles.sendBtn} onPress={sendComment}>
                <Text style={styles.sendText}>发送</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.loginHint} onPress={() => router.push('/auth/login')}>登录后参与评论 →</Text>
          )}

          {comments.map((c: any) => (
            <View key={c.id} style={styles.commentItem}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{c.user?.username?.[0] ?? '?'}</Text>
              </View>
              <View>
                <Text style={styles.commentUser}>{c.user?.username ?? '未知'}</Text>
                <Text style={styles.commentText}>{c.content}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const PINK = '#fb7299';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f5f7' },
  loading: { color: '#999', textAlign: 'center', marginTop: 100 },
  backBtn: { position: 'absolute', top: 16, left: 16, zIndex: 10, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  backText: { color: '#fff', fontSize: 14 },
  scroll: { paddingBottom: 60 },
  scrollWide: { maxWidth: 1100, alignSelf: 'center', width: '100%' },
  player: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000' },
  section: { backgroundColor: '#fff', padding: 16, marginBottom: 8 },
  videoTitle: { fontSize: 18, fontWeight: '700', color: '#18191c', marginBottom: 8 },
  meta: { fontSize: 13, color: '#9499a0', marginBottom: 12 },
  actions: { flexDirection: 'row', gap: 24, marginBottom: 4 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#f4f5f7', borderRadius: 20 },
  actionIcon: { fontSize: 15, color: '#333' },
  desc: { fontSize: 14, color: '#333', lineHeight: 22 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#18191c', marginBottom: 16 },
  commentInputRow: { flexDirection: 'row', marginBottom: 20, gap: 8 },
  input: { flex: 1, backgroundColor: '#f4f5f7', borderRadius: 8, padding: 12, fontSize: 14, color: '#333', outlineStyle: 'none' as any },
  sendBtn: { backgroundColor: PINK, borderRadius: 8, paddingHorizontal: 20, justifyContent: 'center' },
  sendText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  loginHint: { color: PINK, fontSize: 14, textAlign: 'center', marginBottom: 20 },
  commentItem: { flexDirection: 'row', marginBottom: 16 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: PINK, justifyContent: 'center', alignItems: 'center', marginRight: 10, marginTop: 2 },
  avatarText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  commentUser: { fontSize: 13, fontWeight: '600', color: '#333', marginBottom: 4 },
  commentText: { fontSize: 14, color: '#333', lineHeight: 20 },
});
