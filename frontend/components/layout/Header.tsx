import { View, Text, TextInput, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { router, usePathname } from 'expo-router';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

export function Header() {
  const { user, isLoggedIn, signOut } = useAuth();
  const pathname = usePathname();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('username, avatar_url').eq('user_id', user.id).single().then(({ data }) => {
      if (data) {
        setDisplayName(data.username || user.email?.split('@')[0] || '');
        if (data.avatar_url) setAvatarUrl(data.avatar_url);
      }
    });
  }, [user]);

  return (
    <View style={styles.topBar}>
      {/* Logo */}
      <TouchableOpacity style={styles.logoWrap} onPress={() => router.push('/(tabs)/home')}>
        <Text style={styles.logo}>▶</Text>
        <Text style={styles.logoText}>VideoHub</Text>
      </TouchableOpacity>

      {/* 导航标签 */}
      <View style={styles.navTabs}>
        {['首页', '热门', '动画', '音乐', '游戏', '知识'].map((tab, i) => {
          const active = (tab === '首页' && pathname === '/(tabs)/home') ||
                         (tab === '热门' && pathname === '/hot');
          return (
            <TouchableOpacity key={tab} onPress={() => tab === '首页' && router.push('/(tabs)/home')}>
              <Text style={[styles.navTab, active && styles.navTabActive]}>{tab}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 搜索 + 用户 */}
      <View style={styles.topRight}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput style={styles.searchInput} placeholder="搜索视频..." placeholderTextColor="#999" />
        </View>

        <View style={styles.topActions}>
          {isLoggedIn ? (
            <View style={styles.userArea}>
              <TouchableOpacity style={styles.userBadge} onPress={() => setShowDropdown(!showDropdown)}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
                ) : (
                  <View style={styles.avatar}>
                    <Text style={styles.avatarLetter}>{user?.email?.[0]?.toUpperCase() ?? '?'}</Text>
                  </View>
                )}
                <Text style={styles.userName}>{displayName}</Text>
                <Text style={styles.arrow}>▾</Text>
              </TouchableOpacity>
              {showDropdown && (
                <View style={styles.dropdown}
                  // @ts-ignore
                  onMouseEnter={() => setShowDropdown(true)}
                  onMouseLeave={() => setShowDropdown(false)}>
                  <TouchableOpacity style={styles.dropItem} onPress={() => { setShowDropdown(false); router.push('/(tabs)/profile'); }}>
                    <Text style={styles.dropText}>👤 个人中心</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.dropItem} onPress={() => { setShowDropdown(false); router.push('/(tabs)/upload'); }}>
                    <Text style={styles.dropText}>📤 上传视频</Text>
                  </TouchableOpacity>
                  <View style={styles.dropDivider} />
                  <TouchableOpacity style={styles.dropItem} onPress={async () => { setShowDropdown(false); await signOut(); router.replace('/(tabs)/home'); }}>
                    <Text style={styles.dropText}>🚪 退出登录</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ) : (
            <Text style={styles.loginBtn} onPress={() => router.push('/auth/login')}>登录</Text>
          )}
        </View>
      </View>
    </View>
  );
}

const PINK = '#fb7299';

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingVertical: 8,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e6eb',
    zIndex: 9999, overflow: 'visible' as any,
  },
  logoWrap: { flexDirection: 'row', alignItems: 'center' },
  logo: { fontSize: 22, color: PINK, fontWeight: '800' },
  logoText: { fontSize: 16, fontWeight: '700', color: PINK, marginLeft: 6 },
  navTabs: { flexDirection: 'row', gap: 20 },
  navTab: { fontSize: 14, color: '#666' },
  navTabActive: { color: '#18191c', fontWeight: '600' },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 24 },
  searchBox: {
    width: 260, flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#f1f2f3', borderRadius: 8, paddingHorizontal: 12, height: 36,
  },
  searchIcon: { fontSize: 14, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#333', outlineStyle: 'none' as any },
  topActions: { marginLeft: 24, flexDirection: 'row', alignItems: 'center' },
  userArea: { position: 'relative' as any, zIndex: 9999 },
  userBadge: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: PINK, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  avatarImg: { width: 32, height: 32, borderRadius: 16, marginRight: 8 },
  avatarLetter: { color: '#fff', fontSize: 14, fontWeight: '700' },
  userName: { fontSize: 14, color: '#333', fontWeight: '500' },
  arrow: { fontSize: 12, color: '#999', marginLeft: 4 },
  dropdown: {
    position: 'absolute', top: 40, right: 0,
    backgroundColor: '#fff', borderRadius: 8, padding: 4,
    boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
    minWidth: 140, zIndex: 9999,
  },
  dropItem: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 6 },
  dropText: { fontSize: 14, color: '#333' },
  dropDivider: { height: 1, backgroundColor: '#eee', marginVertical: 4 },
  loginBtn: { color: PINK, fontSize: 14, fontWeight: '600' },
});
