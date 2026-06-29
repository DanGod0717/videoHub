import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Header } from '../components/layout/Header';
import { useAuth } from '../hooks/useAuth';

export default function MyVideosScreen() {
  const { user, isLoggedIn } = useAuth();
  const { width } = useWindowDimensions();
  const isWide = width >= 1024;
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: '', description: '' });

  useEffect(() => {
    if (!user) return;
    supabase.from('videos').select('*').eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setVideos(data || []); setLoading(false); });
  }, [user]);

  const handleEdit = (v: any) => {
    setEditingId(v.id);
    setEditForm({ title: v.title, description: v.description || '' });
  };

  const handleSave = async () => {
    if (!editForm.title.trim()) { Alert.alert('标题不能为空'); return; }
    const { error } = await supabase.from('videos').update({
      title: editForm.title.trim(),
      description: editForm.description.trim(),
    }).eq('id', editingId);
    if (error) { Alert.alert('保存失败', error.message); return; }
    setVideos((prev: any) => prev.map((v: any) => v.id === editingId ? { ...v, ...editForm } : v));
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('确定删除这个视频？所有数据将无法恢复。')) return;
    await supabase.from('videos').delete().eq('id', id);
    setVideos((prev: any) => prev.filter((v: any) => v.id !== id));
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  const statusLabel = (s: string) => s === 'ready' ? '✅ 已发布' : s === 'processing' ? '⏳ 转码中' : s === 'failed' ? '❌ 失败' : '📤 待转码';

  if (!isLoggedIn) {
    return <View style={styles.container}><Text style={styles.hint}>请先登录</Text></View>;
  }

  return (
    <View style={styles.container}>
      <Header />

      <ScrollView contentContainerStyle={[styles.scroll, isWide && styles.scrollWide]}>
        {loading ? (
          <Text style={styles.hint}>加载中...</Text>
        ) : videos.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🎬</Text>
            <Text style={styles.emptyText}>还没有视频</Text>
            <Text style={styles.emptyHint} onPress={() => router.push('/(tabs)/upload')}>去上传 →</Text>
          </View>
        ) : (
          <View style={styles.listCard}>
            {videos.map((v: any) => (
              <View key={v.id} style={styles.row}>
                {/* 缩略图 */}
                <View style={styles.thumb}>
                  <Text style={styles.thumbIcon}>🎬</Text>
                </View>

                {/* 信息 */}
                <View style={styles.info}>
                  {editingId === v.id ? (
                    <>
                      <TextInput style={styles.input} value={editForm.title} onChangeText={(t) => setEditForm({ ...editForm, title: t })} placeholder="标题" />
                      <TextInput style={[styles.input, styles.inputDesc]} value={editForm.description} onChangeText={(t) => setEditForm({ ...editForm, description: t })} placeholder="简介" multiline />
                      <View style={styles.editBtns}>
                        <Text style={styles.saveBtn} onPress={handleSave}>💾 保存</Text>
                        <Text style={styles.cancelBtn} onPress={() => setEditingId(null)}>取消</Text>
                      </View>
                    </>
                  ) : (
                    <>
                      <Text style={styles.videoTitle} numberOfLines={1}>{v.title}</Text>
                      {v.description ? <Text style={styles.videoDesc} numberOfLines={2}>{v.description}</Text> : null}
                      <View style={styles.metaRow}>
                        <Text style={styles.statusTag}>{statusLabel(v.status)}</Text>
                        {v.duration ? <Text style={styles.meta}>{v.duration}秒</Text> : null}
                        <Text style={styles.meta}>{formatDate(v.created_at)}</Text>
                        <Text style={styles.meta}>{v.view_count ?? 0} 次观看</Text>
                        <Text style={styles.meta}>{v.comment_count ?? 0} 评论</Text>
                      </View>
                    </>
                  )}
                </View>

                {/* 操作 */}
                {editingId !== v.id && (
                  <View style={styles.actions}>
                    <Text style={styles.actionBtn} onPress={() => router.push(`/video/${v.id}`)}>▶️</Text>
                    <Text style={styles.actionBtn} onPress={() => handleEdit(v)}>✏️</Text>
                    <Text style={[styles.actionBtn, styles.deleteBtn]} onPress={() => handleDelete(v.id)}>🗑️</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const PINK = '#fb7299';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f5f7' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 48, paddingBottom: 12, paddingHorizontal: 24, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e6eb' },
  backBtn: { fontSize: 15, color: '#666' },
  title: { fontSize: 18, fontWeight: '700', color: '#18191c' },
  scroll: { paddingBottom: 60 },
  scrollWide: { maxWidth: 960, alignSelf: 'center', width: '100%' },
  hint: { color: '#999', textAlign: 'center', marginTop: 40, fontSize: 15 },

  // 空状态
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyText: { fontSize: 16, color: '#666', marginBottom: 12 },
  emptyHint: { fontSize: 15, color: PINK, fontWeight: '600' },

  // 视频列表
  listCard: { backgroundColor: '#fff', margin: 24, borderRadius: 12, overflow: 'hidden' },
  row: { flexDirection: 'row', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f4f5f7', alignItems: 'center' },
  thumb: { width: 100, height: 60, backgroundColor: '#f0f0ff', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  thumbIcon: { fontSize: 24 },
  info: { flex: 1 },
  videoTitle: { fontSize: 15, fontWeight: '600', color: '#18191c', marginBottom: 4 },
  videoDesc: { fontSize: 13, color: '#9499a0', marginBottom: 6, lineHeight: 18 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'center' },
  statusTag: { fontSize: 12, fontWeight: '600' },
  meta: { fontSize: 12, color: '#9499a0' },

  // 编辑
  input: { borderWidth: 1, borderColor: '#e5e6eb', borderRadius: 6, padding: 8, fontSize: 14, marginBottom: 8, backgroundColor: '#f9f9fa', outlineStyle: 'none' as any },
  inputDesc: { height: 50, textAlignVertical: 'top' },
  editBtns: { flexDirection: 'row', gap: 16 },
  saveBtn: { color: PINK, fontWeight: '600', fontSize: 14 },
  cancelBtn: { color: '#9499a0', fontSize: 14 },

  // 操作
  actions: { flexDirection: 'row', gap: 10, marginLeft: 12 },
  actionBtn: { fontSize: 18, padding: 4 },
  deleteBtn: { opacity: 0.6 },
});
