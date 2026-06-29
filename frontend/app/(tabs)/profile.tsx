import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert, Image } from 'react-native';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

export default function ProfileScreen() {
  const { user, isLoggedIn, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [stats, setStats] = useState({ videos: 0, followers: 0, following: 0 });
  const [showMyVideos, setShowMyVideos] = useState(false);
  const [myVideos, setMyVideos] = useState<any[]>([]);
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]) return;

    setUploadingAvatar(true);
    try {
      const file = result.assets[0];
      const filePath = `${user!.id}.jpg`;
      const response = await fetch(file.uri);
      const blob = await response.blob();
      const { error: uploadError } = await supabase.storage.from('avatars')
        .upload(filePath, blob, { contentType: 'image/jpeg', upsert: true });
      if (uploadError) throw uploadError;

      const { data: publicUrl } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const { error: updateError } = await supabase.from('profiles')
        .update({ avatar_url: publicUrl.publicUrl }).eq('user_id', user!.id);
      if (updateError) throw updateError;

      setProfile({ ...profile, avatar_url: publicUrl.publicUrl });
    } catch (e: any) { Alert.alert('上传失败', e.message); }
    setUploadingAvatar(false);
  };

  useEffect(() => {
    if (!user) return;
    // 个人资料
    supabase.from('profiles').select('*').eq('user_id', user.id).single().then(({ data }) => {
      if (data) {
        setProfile(data);
        setUsername(data.username || '');
        setBio(data.bio || '');
      }
    });
    // 统计数据
    Promise.all([
      supabase.from('videos').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', user.id),
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', user.id),
    ]).then(([vRes, fRes, gRes]) => {
      setStats({
        videos: vRes.count ?? 0,
        followers: fRes.count ?? 0,
        following: gRes.count ?? 0,
      });
    });
  }, [user]);

  const saveProfile = async () => {
    if (!username.trim()) { Alert.alert('用户名不能为空'); return; }
    setSaving(true);
    const { error } = await supabase.from('profiles')
      .update({ username: username.trim(), bio: bio.trim() })
      .eq('user_id', user!.id);
    setSaving(false);
    if (error) Alert.alert('保存失败', error.message);
    else {
      setProfile({ ...profile, username: username.trim(), bio: bio.trim() });
      setEditing(false);
    }
  };

  const fetchMyVideos = () => {
    if (!user) { window.alert('未登录'); return; }
    if (showMyVideos) { setShowMyVideos(false); return; }
    setShowMyVideos(true);
    supabase.from('videos').select('id,title,status,created_at').eq('user_id', user.id).order('created_at', { ascending: false }).then(({ data, error }: any) => {
      if (error) { window.alert('加载失败: ' + error.message); setShowMyVideos(false); return; }
      setMyVideos(data || []);
    });
  };

  const deleteVideo = async (videoId: string) => {
    if (!window.confirm('确定删除这个视频？')) return;
    await supabase.from('videos').delete().eq('id', videoId);
    setMyVideos((prev: any) => prev.filter((v: any) => v.id !== videoId));
    setStats({ ...stats, videos: stats.videos - 1 });
  };

  const saveVideoTitle = async (videoId: string) => {
    if (!editTitle.trim()) return;
    await supabase.from('videos').update({ title: editTitle.trim() }).eq('id', videoId);
    setMyVideos((prev: any) => prev.map((v: any) => v.id === videoId ? { ...v, title: editTitle.trim() } : v));
    setEditingVideoId(null);
    setEditTitle('');
  };

  if (!isLoggedIn) {
    return (
      <View style={styles.container}>
        <View style={styles.notLoggedIn}>
          <Text style={styles.notLoggedIcon}>👤</Text>
          <Text style={styles.notLoggedTitle}>登录后查看更多</Text>
          <TouchableOpacity style={styles.loginLink} onPress={() => router.push('/auth/login')}>
            <Text style={styles.loginLinkText}>去登录</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* 个人信息卡片 */}
      <View style={styles.card}>
        <TouchableOpacity onPress={pickAvatar} disabled={uploadingAvatar}>
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatarLarge} />
          ) : (
            <View style={styles.avatarLarge}>
              <Text style={styles.avatarText}>{user?.email?.[0]?.toUpperCase() ?? '?'}</Text>
            </View>
          )}
          <Text style={styles.avatarHint}>{uploadingAvatar ? '上传中...' : '点击更换头像'}</Text>
        </TouchableOpacity>

        {editing ? (
          <View style={styles.editForm}>
            <Text style={styles.label}>用户名</Text>
            <TextInput style={styles.input} value={username} onChangeText={setUsername} placeholder="输入用户名" placeholderTextColor="#bbb" />
            <Text style={styles.label}>简介</Text>
            <TextInput style={[styles.input, styles.bioInput]} value={bio} onChangeText={setBio} placeholder="介绍一下自己..." placeholderTextColor="#bbb" multiline numberOfLines={3} />
            <View style={styles.editBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setUsername(profile?.username || ''); setBio(profile?.bio || ''); setEditing(false); }}>
                <Text style={styles.cancelBtnText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, saving && styles.btnDisabled]} onPress={saveProfile} disabled={saving}>
                <Text style={styles.saveBtnText}>{saving ? '保存中...' : '保存'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.profileInfo}>
            <Text style={styles.username}>{profile?.username || user?.email?.split('@')[0]}</Text>
            <Text style={styles.email}>{user?.email}</Text>
            {profile?.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
            <Text style={styles.userId}>ID: {user?.id?.slice(0, 8)}...</Text>
            <TouchableOpacity style={styles.editBtn} onPress={() => setEditing(true)}>
              <Text style={styles.editBtnText}>编辑资料</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* 统计 */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{stats.videos}</Text>
          <Text style={styles.statLabel}>视频</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{stats.followers}</Text>
          <Text style={styles.statLabel}>粉丝</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{stats.following}</Text>
          <Text style={styles.statLabel}>关注</Text>
        </View>
      </View>

      {/* 菜单 */}
      <View style={styles.menu}>
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/my-videos')}>
          <Text style={styles.menuText}>📹 我的视频</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        <View style={styles.menuItem}>
          <Text style={styles.menuText}>❤️ 点赞记录</Text>
          <Text style={styles.menuArrow}>›</Text>
        </View>
        <View style={[styles.menuItem, styles.menuItemLast]}>
          <Text style={styles.menuText}>⚙️ 设置</Text>
          <Text style={styles.menuArrow}>›</Text>
        </View>
      </View>

      {/* 我的视频列表 */}
      {showMyVideos && (
        <View style={styles.videoListCard}>
          <View style={styles.videoListHeader}>
            <Text style={styles.videoListTitle}>我的视频 ({myVideos.length})</Text>
            <Text style={styles.videoListClose} onPress={() => setShowMyVideos(false)}>收起</Text>
          </View>
          {myVideos.length === 0 ? (
            <Text style={styles.noVideos}>暂无视频</Text>
          ) : (
            myVideos.map((v: any) => (
              <View key={v.id} style={styles.videoRow}>
                <View style={styles.videoThumb}>
                  <Text style={styles.videoThumbIcon}>🎬</Text>
                </View>
                <View style={styles.videoDetail}>
                  {editingVideoId === v.id ? (
                    <View style={styles.editRow}>
                      <TextInput
                        style={styles.editInput}
                        value={editTitle}
                        onChangeText={setEditTitle}
                        onSubmitEditing={() => saveVideoTitle(v.id)}
                      />
                      <Text style={styles.editAction} onPress={() => saveVideoTitle(v.id)}>保存</Text>
                      <Text style={styles.editAction} onPress={() => setEditingVideoId(null)}>取消</Text>
                    </View>
                  ) : (
                    <>
                      <Text style={styles.videoTitle} numberOfLines={1}>{v.title}</Text>
                      <Text style={styles.videoMeta}>{v.status === 'ready' ? '✅ 已发布' : v.status === 'processing' ? '⏳ 转码中' : '📤 上传中'} · {new Date(v.created_at).toLocaleDateString()}</Text>
                    </>
                  )}
                </View>
                <View style={styles.videoActions}>
                  <Text style={styles.actionIcon} onPress={() => { setEditingVideoId(v.id); setEditTitle(v.title); }}>✏️</Text>
                  <Text style={styles.actionIcon} onPress={() => deleteVideo(v.id)}>🗑️</Text>
                </View>
              </View>
            ))
          )}
        </View>
      )}

      {/* 创建时间 */}
      <Text style={styles.createdAt}>
        加入于 {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '--'}
      </Text>
    </ScrollView>
  );
}

const PINK = '#fb7299';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f5f7' },
  scrollContent: { paddingBottom: 60 },

  // 顶部
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 48, paddingBottom: 12, paddingHorizontal: 24,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e6eb',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1a1a2e' },
  backHome: { fontSize: 14, color: '#666' },
  loginBtn: { color: PINK, fontSize: 14, fontWeight: '600' },
  logoutLink: { color: '#9499a0', fontSize: 14 },

  // 未登录
  notLoggedIn: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 120 },
  notLoggedIcon: { fontSize: 64, marginBottom: 16 },
  notLoggedTitle: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 24 },
  loginLink: { backgroundColor: PINK, borderRadius: 8, paddingHorizontal: 40, paddingVertical: 12 },
  loginLinkText: { color: '#fff', fontSize: 15, fontWeight: '600' },

  // 个人信息卡片
  card: {
    backgroundColor: '#fff', alignItems: 'center', padding: 32, margin: 24,
    borderRadius: 12, maxWidth: 500, alignSelf: 'center', width: '100%',
  },
  avatarLarge: { width: 80, height: 80, borderRadius: 40, backgroundColor: PINK, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: '700' },
  avatarHint: { fontSize: 12, color: '#9499a0', marginTop: 8, textAlign: 'center' },
  profileInfo: { alignItems: 'center', width: '100%' },
  username: { fontSize: 20, fontWeight: '700', color: '#18191c', marginBottom: 4 },
  email: { fontSize: 14, color: '#9499a0', marginBottom: 4 },
  bio: { fontSize: 14, color: '#333', marginTop: 8, marginBottom: 8, textAlign: 'center', lineHeight: 20, paddingHorizontal: 20 },
  userId: { fontSize: 12, color: '#ccc', marginBottom: 16 },
  editBtn: { paddingHorizontal: 24, paddingVertical: 8, borderRadius: 6, borderWidth: 1, borderColor: '#e5e6eb' },
  editBtnText: { fontSize: 14, color: '#666', fontWeight: '500' },

  // 编辑表单
  editForm: { width: '100%' },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6, marginLeft: 2, marginTop: 8 },
  input: {
    borderWidth: 1, borderColor: '#e5e6eb', borderRadius: 8, padding: 12,
    fontSize: 15, backgroundColor: '#f9f9fa', color: '#333', marginBottom: 12,
    outlineStyle: 'none' as any, width: '100%',
  },
  bioInput: { height: 80, textAlignVertical: 'top' },
  editBtns: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#e5e6eb', alignItems: 'center' },
  cancelBtnText: { color: '#666', fontSize: 15, fontWeight: '500' },
  saveBtn: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: PINK, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  btnDisabled: { opacity: 0.6 },

  // 统计
  statsRow: {
    flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 24, borderRadius: 12,
    padding: 16, maxWidth: 500, alignSelf: 'center', width: '100%',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 20, fontWeight: '700', color: '#18191c' },
  statLabel: { fontSize: 12, color: '#9499a0', marginTop: 4 },
  statDivider: { width: 1, height: 30, backgroundColor: '#e5e6eb' },

  // 菜单
  menu: {
    backgroundColor: '#fff', margin: 24, borderRadius: 12, paddingVertical: 4,
    maxWidth: 500, alignSelf: 'center', width: '100%',
  },
  menuItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#f4f5f7',
  },
  menuItemLast: { borderBottomWidth: 0 },
  menuText: { fontSize: 15, color: '#333' },
  menuArrow: { fontSize: 22, color: '#ccc' },

  // 我的视频列表
  videoListCard: { backgroundColor: '#fff', margin: 24, borderRadius: 12, padding: 16, maxWidth: 500, alignSelf: 'center', width: '100%' },
  videoListHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  videoListTitle: { fontSize: 16, fontWeight: '700', color: '#18191c' },
  videoListClose: { fontSize: 14, color: '#9499a0' },
  noVideos: { fontSize: 14, color: '#999', textAlign: 'center', padding: 20 },
  videoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f4f5f7' },
  videoThumb: { width: 80, height: 50, backgroundColor: '#f0f0ff', borderRadius: 6, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  videoThumbIcon: { fontSize: 20 },
  videoDetail: { flex: 1 },
  videoTitle: { fontSize: 14, fontWeight: '500', color: '#333', marginBottom: 4 },
  videoMeta: { fontSize: 12, color: '#9499a0' },
  videoActions: { flexDirection: 'row', gap: 12, marginLeft: 8 },
  actionIcon: { fontSize: 16, cursor: 'pointer' as any },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  editInput: { flex: 1, borderWidth: 1, borderColor: '#e5e6eb', borderRadius: 6, padding: 6, fontSize: 13, outlineStyle: 'none' as any },
  editAction: { fontSize: 13, color: '#fb7299', fontWeight: '600', cursor: 'pointer' as any },

  // 加入时间
  createdAt: { textAlign: 'center', fontSize: 12, color: '#ccc', marginBottom: 24 },
});
