import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, TextInput } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';

export default function ProfileScreen() {
  const { user, isLoggedIn, signOut } = useAuth();

  if (!isLoggedIn) {
    return (
      <View style={styles.container}>
        {/* 顶部栏 */}
        <View style={styles.topBar}>
          <View style={styles.searchBox}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput style={styles.searchInput} placeholder="搜索视频..." placeholderTextColor="#999" />
          </View>
          <Text style={styles.loginBtn} onPress={() => router.push('/auth/login')}>登录</Text>
        </View>
        <View style={styles.notLoggedIn}>
          <Text style={styles.notLoggedIcon}>👤</Text>
          <Text style={styles.notLoggedTitle}>登录后查看更多</Text>
          <Text style={styles.notLoggedDesc}>上传视频、管理你的内容</Text>
          <TouchableOpacity style={styles.loginLink} onPress={() => router.push('/auth/login')}>
            <Text style={styles.loginLinkText}>去登录</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
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
          <Text style={styles.userName}>{user?.email?.split('@')[0]}</Text>
        </View>
      </View>

      {/* 个人卡片 */}
      <View style={styles.profileCard}>
        <View style={styles.avatarLarge}>
          <Text style={styles.avatarLargeLetter}>{user?.email?.[0]?.toUpperCase() ?? '?'}</Text>
        </View>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>0</Text>
            <Text style={styles.statLabel}>视频</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>0</Text>
            <Text style={styles.statLabel}>粉丝</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>0</Text>
            <Text style={styles.statLabel}>关注</Text>
          </View>
        </View>
      </View>

      {/* 菜单 */}
      <View style={styles.menu}>
        <View style={styles.menuItem}>
          <Text style={styles.menuText}>📹 我的视频</Text>
          <Text style={styles.menuArrow}>›</Text>
        </View>
        <View style={styles.menuItem}>
          <Text style={styles.menuText}>❤️ 点赞记录</Text>
          <Text style={styles.menuArrow}>›</Text>
        </View>
        <View style={[styles.menuItem, styles.menuItemLast]}>
          <Text style={styles.menuText}>⚙️ 设置</Text>
          <Text style={styles.menuArrow}>›</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={() => {
        Alert.alert('退出登录', '确定要退出吗？', [
          { text: '取消', style: 'cancel' },
          { text: '退出', style: 'destructive', onPress: async () => { await signOut(); router.replace('/(tabs)/home'); }},
        ]);
      }}>
        <Text style={styles.logoutText}>退出登录</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const PINK = '#fb7299';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f5f7' },
  scrollContent: { paddingBottom: 60 },

  // 顶部栏
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
    justifyContent: 'center', alignItems: 'center', marginRight: 8,
  },
  avatarLetter: { color: '#fff', fontSize: 14, fontWeight: '700' },
  userName: { fontSize: 14, color: '#333', fontWeight: '500' },

  // 未登录
  notLoggedIn: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 120 },
  notLoggedIcon: { fontSize: 64, marginBottom: 16 },
  notLoggedTitle: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 8 },
  notLoggedDesc: { fontSize: 14, color: '#999', marginBottom: 24 },
  loginLink: { backgroundColor: PINK, borderRadius: 8, paddingHorizontal: 40, paddingVertical: 12 },
  loginLinkText: { color: '#fff', fontSize: 15, fontWeight: '600' },

  // 个人卡片
  profileCard: {
    backgroundColor: '#fff', alignItems: 'center', padding: 32, margin: 24,
    borderRadius: 12, maxWidth: 600, alignSelf: 'center', width: '100%',
  },
  avatarLarge: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: PINK,
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  avatarLargeLetter: { color: '#fff', fontSize: 32, fontWeight: '700' },
  email: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 20 },
  statsRow: {
    flexDirection: 'row', alignItems: 'center', width: '100%',
    justifyContent: 'center', gap: 40,
  },
  statItem: { alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: '700', color: '#18191c' },
  statLabel: { fontSize: 13, color: '#9499a0', marginTop: 4 },
  statDivider: { width: 1, height: 30, backgroundColor: '#e5e6eb' },

  // 菜单
  menu: { backgroundColor: '#fff', marginHorizontal: 24, borderRadius: 12, maxWidth: 600, alignSelf: 'center', width: '100%' },
  menuItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#f4f5f7',
  },
  menuItemLast: { borderBottomWidth: 0 },
  menuText: { fontSize: 15, color: '#333' },
  menuArrow: { fontSize: 22, color: '#ccc' },

  // 退出
  logoutBtn: {
    marginHorizontal: 24, marginTop: 24, borderRadius: 8, padding: 15,
    alignItems: 'center', borderWidth: 1, borderColor: '#e5e6eb',
    backgroundColor: '#fff', maxWidth: 600, alignSelf: 'center', width: '100%',
  },
  logoutText: { color: '#9499a0', fontSize: 15, fontWeight: '500' },
});
