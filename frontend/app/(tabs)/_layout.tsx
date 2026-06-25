import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

export default function TabLayout() {
  // 桌面端固定布局：左侧侧栏 + 顶部导航
  return (
    <View style={styles.shell}>
      {/* 左侧侧栏 */}
      <View style={styles.sidebar}>
        <TouchableOpacity style={styles.logoWrap} onPress={() => router.push('/(tabs)/home')}>
          <Text style={styles.logo}>▶</Text>
          <Text style={styles.logoText}>VideoHub</Text>
        </TouchableOpacity>

        <View style={styles.nav}>
          <SidebarItem emoji="🏠" label="首页" route="/(tabs)/home" />
          <SidebarItem emoji="📤" label="上传" route="/(tabs)/upload" />
          <SidebarItem emoji="👤" label="我的" route="/(tabs)/profile" />
        </View>
      </View>

      {/* 右侧内容区 */}
      <View style={styles.main}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: { display: 'none' },
          }}
        >
          <Tabs.Screen name="home" />
          <Tabs.Screen name="upload" />
          <Tabs.Screen name="profile" />
        </Tabs>
      </View>
    </View>
  );
}

function SidebarItem({ emoji, label, route }: { emoji: string; label: string; route: string }) {
  return (
    <TouchableOpacity style={styles.navItem} onPress={() => router.push(route as any)}>
      <Text style={styles.navEmoji}>{emoji}</Text>
      <Text style={styles.navLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, flexDirection: 'row', backgroundColor: '#f4f5f7' },
  // 侧栏
  sidebar: {
    width: 200,
    backgroundColor: '#fff',
    borderRightWidth: 1,
    borderRightColor: '#e5e6eb',
    paddingTop: 16,
    paddingHorizontal: 12,
  },
  logoWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  logo: {
    fontSize: 22,
    color: '#fb7299',
    marginRight: 8,
    fontWeight: '800',
  },
  logoText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fb7299',
  },
  nav: { gap: 4 },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 2,
  },
  navEmoji: { fontSize: 18, marginRight: 10 },
  navLabel: { fontSize: 15, color: '#333', fontWeight: '500' },
  // 主内容
  main: { flex: 1 },
});
