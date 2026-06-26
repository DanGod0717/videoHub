import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { supabase, API_BASE } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

export default function UploadScreen() {
  const { user, isLoggedIn } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoFile, setVideoFile] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [uploading, setUploading] = useState(false);

  if (!isLoggedIn) {
    return (
      <View style={styles.container}>
        <View style={styles.topBar}>
          <View style={styles.searchBox}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput style={styles.searchInput} placeholder="搜索视频..." placeholderTextColor="#999" />
          </View>
          <Text style={styles.loginBtn} onPress={() => router.push('/auth/login')}>登录</Text>
        </View>
        <View style={styles.notLoggedIn}>
          <Text style={styles.notLoggedIcon}>📤</Text>
          <Text style={styles.notLoggedTitle}>登录后才能上传视频</Text>
          <TouchableOpacity style={styles.loginLink} onPress={() => router.push('/auth/login')}>
            <Text style={styles.loginLinkText}>去登录</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Step 1: 选择视频文件
  const pickVideo = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsEditing: false,
        quality: 1,
      });
      if (!result.canceled && result.assets?.[0]) {
        setVideoFile(result.assets[0]);
        if (!title) {
          // 用文件名作为默认标题
          const fileName = result.assets[0].fileName ?? result.assets[0].uri.split('/').pop() ?? '';
          setTitle(fileName.replace(/\.[^/.]+$/, ''));
        }
      }
    } catch (e: any) {
      Alert.alert('选择文件失败', e.message);
    }
  };

  // Step 2: 确认上传
  const handleUpload = async () => {
    if (!videoFile) { Alert.alert('请先选择视频文件'); return; }
    if (!title.trim()) { Alert.alert('请输入视频标题'); return; }

    setUploading(true);
    try {
      const videoId = crypto.randomUUID?.() ?? Date.now().toString();
      const filePath = `${user!.id}/${videoId}.mp4`;

      // 上传到 Storage
      const response = await fetch(videoFile.uri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from('raw-videos')
        .upload(filePath, blob, {
          contentType: blob.type || 'video/mp4',
          cacheControl: '3600',
        });

      if (uploadError) throw uploadError;

      // 写数据库（暂时直接设为 ready，等 Java 转码接上后再改回 uploading）
      const { error: dbError } = await supabase.from('videos').insert({
        id: videoId,
        user_id: user!.id,
        title: title.trim(),
        description: description.trim(),
        original_url: filePath,
        original_size: blob.size,
        status: 'uploading',  // 等待 Java 转码
      });

      if (dbError) throw dbError;

      // 触发 Java 转码
      fetch(`${API_BASE}/videos/${videoId}/transcode`, { method: 'POST' })
        .catch(e => console.log('转码触发:', e.message));

      Alert.alert('发布成功', '视频正在转码中，稍后出现在首页');
      router.push('/(tabs)/home');
    } catch (e: any) {
      Alert.alert('发布失败', e.message || String(e));
    }
    setUploading(false);
  };

  return (
    <View style={styles.container}>
      {/* 顶部栏 */}
      <View style={styles.topBar}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput style={styles.searchInput} placeholder="搜索视频..." placeholderTextColor="#999" />
        </View>
        <View style={styles.userBadge}>
          <View style={styles.avatar}>
            <Text style={styles.avatarLetter}>{user?.email?.[0]?.toUpperCase() ?? '?'}</Text>
          </View>
        </View>
      </View>

      {/* 上传表单 */}
      <View style={styles.uploadCard}>
        <Text style={styles.sectionTitle}>上传视频</Text>

        {/* 选择文件区域 */}
        {videoFile ? (
          <View style={styles.fileSelected}>
            <View style={styles.filePreview}>
              <Text style={styles.fileIcon}>🎬</Text>
            </View>
            <View style={styles.fileInfo}>
              <Text style={styles.fileName} numberOfLines={1}>
                {videoFile.fileName ?? '已选择视频'}
              </Text>
              <Text style={styles.fileSize}>
                {(videoFile.fileSize ? (videoFile.fileSize / 1024 / 1024).toFixed(1) : '?')} MB
              </Text>
            </View>
            <TouchableOpacity onPress={pickVideo}>
              <Text style={styles.changeBtn}>更换</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.uploadZone} onPress={pickVideo}>
            <Text style={styles.uploadIcon}>📁</Text>
            <Text style={styles.uploadHint}>点击选择视频文件</Text>
            <Text style={styles.uploadSubHint}>支持 MP4、MOV 格式</Text>
          </TouchableOpacity>
        )}

        {/* 标题 */}
        <Text style={styles.label}>标题</Text>
        <TextInput
          style={styles.input}
          placeholder="给视频起个吸引人的标题..."
          placeholderTextColor="#bbb"
          value={title}
          onChangeText={setTitle}
        />

        {/* 描述 */}
        <Text style={styles.label}>简介（选填）</Text>
        <TextInput
          style={[styles.input, styles.descInput]}
          placeholder="简单介绍一下视频内容..."
          placeholderTextColor="#bbb"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
        />

        {/* 发布按钮 */}
        <TouchableOpacity
          style={[styles.submitBtn, (!videoFile || uploading) && styles.submitBtnDisabled]}
          onPress={handleUpload}
          disabled={!videoFile || uploading}
        >
          <Text style={styles.submitBtnText}>
            {uploading ? '发布中...' : videoFile ? '确认发布' : '请先选择视频文件'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const PINK = '#fb7299';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f5f7' },

  // 顶部
  topBar: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e6eb',
  },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#f1f2f3', borderRadius: 8, paddingHorizontal: 12, height: 36,
  },
  searchIcon: { fontSize: 14, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#333', outlineStyle: 'none' as any },
  loginBtn: { color: PINK, fontSize: 14, fontWeight: '600', marginLeft: 24 },
  userBadge: { flexDirection: 'row', alignItems: 'center', marginLeft: 24 },
  avatar: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: PINK,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarLetter: { color: '#fff', fontSize: 14, fontWeight: '700' },

  // 未登录
  notLoggedIn: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 120 },
  notLoggedIcon: { fontSize: 64, marginBottom: 16 },
  notLoggedTitle: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 24 },
  loginLink: { backgroundColor: PINK, borderRadius: 8, paddingHorizontal: 40, paddingVertical: 12 },
  loginLinkText: { color: '#fff', fontSize: 15, fontWeight: '600' },

  // 上传卡片
  uploadCard: {
    margin: 24, backgroundColor: '#fff', borderRadius: 12, padding: 32,
    maxWidth: 640, alignSelf: 'center', width: '100%',
  },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#18191c', marginBottom: 24 },

  // 文件选择
  uploadZone: {
    borderWidth: 2, borderColor: '#e5e6eb', borderStyle: 'dashed',
    borderRadius: 12, padding: 48, alignItems: 'center', marginBottom: 24,
    cursor: 'pointer',
  },
  uploadIcon: { fontSize: 40, marginBottom: 12 },
  uploadHint: { fontSize: 15, color: '#333', fontWeight: '500', marginBottom: 4 },
  uploadSubHint: { fontSize: 13, color: '#9499a0' },

  fileSelected: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#f8f9fa', borderRadius: 12, padding: 16, marginBottom: 24,
  },
  filePreview: {
    width: 80, height: 50, backgroundColor: '#e8e8ff', borderRadius: 8,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  fileIcon: { fontSize: 24 },
  fileInfo: { flex: 1 },
  fileName: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 4 },
  fileSize: { fontSize: 12, color: '#9499a0' },
  changeBtn: { color: PINK, fontSize: 14, fontWeight: '600', paddingLeft: 12 },

  // 表单
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  input: {
    borderWidth: 1, borderColor: '#e5e6eb', borderRadius: 8, padding: 14,
    fontSize: 15, backgroundColor: '#f9f9fa', color: '#333', marginBottom: 20,
    outlineStyle: 'none' as any,
  },
  descInput: { height: 80, textAlignVertical: 'top' },

  // 发布按钮
  submitBtn: { backgroundColor: PINK, borderRadius: 8, padding: 15, alignItems: 'center', marginTop: 8 },
  submitBtnDisabled: { opacity: 0.4 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
