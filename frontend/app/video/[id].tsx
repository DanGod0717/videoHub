import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, useWindowDimensions, Image } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { VideoPlayer } from '../../components/video/VideoPlayer';
import { Header } from '../../components/layout/Header';
import type { Video } from '../../types';

export default function VideoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, isLoggedIn } = useAuth();
  const { width } = useWindowDimensions();
  const isWide = width >= 1024;

  const [video, setVideo] = useState<Video | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentSending, setCommentSending] = useState(false);
  const [uploader, setUploader] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [currentQuality, setCurrentQuality] = useState('');

  // 获取当前用户 profile
  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('username, avatar_url').eq('user_id', user.id).single().then(({ data }) => {
      if (data) setProfile(data);
    });
  }, [user]);

  // 获取视频 + 博主信息 + 关注状态
  useEffect(() => {
    if (!id) return;

    supabase.from('videos').select('*').eq('id', id).single().then(({ data: v }) => {
      if (!v) return;
      setVideo(v);

      // 获取博主 profile
      supabase.from('profiles').select('*').eq('user_id', v.user_id).single().then(({ data: p }) => {
        if (p) setUploader(p);
      });

      // 检查是否已关注
      if (user && v.user_id !== user.id) {
        supabase.from('follows').select('*')
          .eq('follower_id', user.id)
          .eq('following_id', v.user_id)
          .maybeSingle().then(({ data }) => setIsFollowing(!!data));
      }
    });

    supabase.from('comments').select('*').eq('video_id', id)
      .order('created_at', { ascending: false }).then(async ({ data: rawComments }) => {
        if (!rawComments) return;
        // 批量查 profiles
        const userIds = [...new Set(rawComments.map((c: any) => c.user_id))];
        const { data: profiles } = await supabase.from('profiles')
          .select('user_id, username, avatar_url').in('user_id', userIds);
        const profileMap: any = {};
        (profiles || []).forEach((p: any) => { profileMap[p.user_id] = p; });
        setComments(rawComments.map((c: any) => ({ ...c, user: profileMap[c.user_id] || { username: '未知' } })));
      });

    // Realtime 订阅新评论
    supabase.removeAllChannels();
    const channel = supabase
      .channel(`comments-${id}`)
        .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'comments', filter: `video_id=eq.${id}` },
          (payload: any) => {
            supabase.from('profiles').select('user_id, username, avatar_url')
              .eq('user_id', payload.new.user_id).single().then(({ data: p }) => {
                setComments((prev: any) => {
                  if (prev.some((c: any) => c.id === payload.new.id)) return prev;
                  return [...prev, { ...payload.new, user: p || { username: '未知' } }];
                });
              });
          }
        )
        .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id, user]);

  // 初始化默认清晰度
  useEffect(() => {
    if (video) {
      const transcoded: any[] = video.transcoded || [];
      if (transcoded.length > 0 && !currentQuality) {
        setCurrentQuality(transcoded[transcoded.length - 1].quality);
      }
    }
  }, [video]);

  // 关注/取关
  const toggleFollow = async () => {
    if (!isLoggedIn) { Alert.alert('请先登录'); return; }
    setFollowLoading(true);
    if (isFollowing) {
      await supabase.from('follows').delete()
        .eq('follower_id', user!.id).eq('following_id', video!.user_id);
      setIsFollowing(false);
    } else {
      await supabase.from('follows').insert({
        follower_id: user!.id, following_id: video!.user_id,
      });
      setIsFollowing(true);
    }
    setFollowLoading(false);
  };

  const sendComment = async () => {
    if (!commentText.trim()) return;
    if (!isLoggedIn) { window.alert('请先登录'); return; }
    setCommentSending(true);
    const newComment = {
      id: 'temp-' + Date.now(),
      video_id: id,
      user_id: user!.id,
      content: commentText.trim(),
      created_at: new Date().toISOString(),
      user: { username: profile?.username || user?.email?.split('@')[0], avatar_url: profile?.avatar_url },
    };
    setComments((prev: any) => [...prev, newComment]);
    setCommentText('');
    await supabase.from('comments').insert({
      video_id: id, user_id: user!.id, content: newComment.content,
    });
    setCommentSending(false);
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
    if (day < 365) return `${Math.floor(day / 30)}个月前`;
    return `${Math.floor(day / 365)}年前`;
  };

  if (!video) {
    return <View style={styles.container}><Text style={styles.loading}>加载中...</Text></View>;
  }

  const isOwner = user?.id === video.user_id;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backText}>← 返回</Text>
      </TouchableOpacity>

      <Header />
      <ScrollView contentContainerStyle={[styles.scroll, isWide && styles.scrollWide]}>
        {/* 视频播放器 */}
        <VideoPlayer video={video} currentQuality={currentQuality} onQualityChange={setCurrentQuality} />

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

        {/* 博主信息 */}
        {uploader && (
          <View style={styles.section}>
            <TouchableOpacity style={styles.uploaderRow} onPress={() => router.push(`/user/${video.user_id}`)}>
              {uploader.avatar_url ? (
                <Image source={{ uri: uploader.avatar_url }} style={styles.uploaderAvatar} />
              ) : (
                <View style={styles.uploaderAvatar}>
                  <Text style={styles.uploaderAvatarText}>{uploader.username?.[0]?.toUpperCase() ?? '?'}</Text>
                </View>
              )}
              <View style={styles.uploaderInfo}>
                <Text style={styles.uploaderName}>{uploader.username ?? '未知'}</Text>
                <Text style={styles.uploaderBio} numberOfLines={2}>{uploader.bio || '这个人很懒，什么都没写'}</Text>
              </View>
            </TouchableOpacity>

            {!isOwner && (
              <TouchableOpacity
                style={[styles.followBtn, isFollowing && styles.followBtnActive]}
                onPress={toggleFollow}
                disabled={followLoading}
              >
                <Text style={[styles.followBtnText, isFollowing && styles.followBtnTextActive]}>
                  {followLoading ? '...' : isFollowing ? '已关注' : '+ 关注'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

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
              {c.user?.avatar_url ? (
                <Image source={{ uri: c.user.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{c.user?.username?.[0] ?? '?'}</Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <View style={styles.commentHeader}>
                  <Text style={styles.commentUser}>{c.user?.username ?? '未知'}</Text>
                  <Text style={styles.commentTime}>{timeAgo(c.created_at)}</Text>
                </View>
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
  playerWrap: { position: 'relative' as any, width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000' },
  player: { width: '100%', height: '100%' },
  qualityBar: { position: 'absolute', bottom: 40, right: 12, flexDirection: 'row', gap: 6, zIndex: 10 },
  qualityTag: { color: '#ddd', fontSize: 12, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.6)', cursor: 'pointer' as any },
  qualityActive: { color: '#fff', backgroundColor: '#fb7299', fontWeight: '600' },
  section: { backgroundColor: '#fff', padding: 16, marginBottom: 8 },
  videoTitle: { fontSize: 18, fontWeight: '700', color: '#18191c', marginBottom: 8 },
  meta: { fontSize: 13, color: '#9499a0', marginBottom: 12 },
  actions: { flexDirection: 'row', gap: 24, marginBottom: 4 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#f4f5f7', borderRadius: 20 },
  actionIcon: { fontSize: 15, color: '#333' },

  // 博主信息
  uploaderRow: { flexDirection: 'row', alignItems: 'center', paddingBottom: 12 },
  uploaderAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: PINK, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  uploaderAvatarText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  uploaderInfo: { flex: 1 },
  uploaderName: { fontSize: 16, fontWeight: '600', color: '#18191c', marginBottom: 2 },
  uploaderBio: { fontSize: 13, color: '#9499a0', lineHeight: 18 },
  followBtn: {
    marginTop: 12, paddingVertical: 10, borderRadius: 8,
    backgroundColor: PINK, alignItems: 'center',
  },
  followBtnActive: { backgroundColor: '#f4f5f7' },
  followBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  followBtnTextActive: { color: '#9499a0' },

  // 描述
  desc: { fontSize: 14, color: '#333', lineHeight: 22 },

  // 评论区
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#18191c', marginBottom: 16 },
  commentInputRow: { flexDirection: 'row', marginBottom: 20, gap: 8 },
  input: { flex: 1, backgroundColor: '#f4f5f7', borderRadius: 8, padding: 12, fontSize: 14, color: '#333', outlineStyle: 'none' as any },
  sendBtn: { backgroundColor: PINK, borderRadius: 8, paddingHorizontal: 20, justifyContent: 'center' },
  sendText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  loginHint: { color: PINK, fontSize: 14, textAlign: 'center', marginBottom: 20 },
  commentItem: { flexDirection: 'row', marginBottom: 16 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: PINK, justifyContent: 'center', alignItems: 'center', marginRight: 10, marginTop: 2 },
  avatarText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  commentHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  commentUser: { fontSize: 13, fontWeight: '600', color: '#333' },
  commentTime: { fontSize: 12, color: '#bbb' },
  commentText: { fontSize: 14, color: '#333', lineHeight: 20 },
});
