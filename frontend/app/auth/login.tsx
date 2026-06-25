import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) { Alert.alert('请填写完整'); return; }
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      router.replace('/(tabs)/home');
    } catch (e: any) { Alert.alert('登录失败', e.message); }
    setLoading(false);
  };

  return (
    <View style={styles.bg}>
      <View style={styles.card}>
        {/* 头部 */}
        <View style={styles.head}>
          <Text style={styles.logo}>▶</Text>
          <Text style={styles.brand}>VideoHub</Text>
        </View>
        <Text style={styles.title}>登录你的账号</Text>

        {/* 表单 */}
        <Text style={styles.label}>邮箱</Text>
        <TextInput
          style={styles.input}
          placeholder="请输入邮箱"
          placeholderTextColor="#bbb"
          value={email} onChangeText={setEmail}
          autoCapitalize="none" keyboardType="email-address"
        />

        <Text style={styles.label}>密码</Text>
        <TextInput
          style={styles.input}
          placeholder="请输入密码"
          placeholderTextColor="#bbb"
          value={password} onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleLogin} disabled={loading}>
          <Text style={styles.btnText}>{loading ? '登录中...' : '登 录'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/auth/register')} style={styles.footer}>
          <Text style={styles.footerText}>没有账号？<Text style={styles.footerLink}>立即注册</Text></Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const PINK = '#fb7299';

const styles = StyleSheet.create({
  bg: {
    flex: 1, backgroundColor: '#f4f5f7',
    justifyContent: 'center', alignItems: 'center',
  },
  card: {
    width: 420, backgroundColor: '#fff', borderRadius: 16,
    padding: 40, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12,
    elevation: 3,
  },
  head: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  logo: { fontSize: 28, color: PINK, fontWeight: '800', marginRight: 8 },
  brand: { fontSize: 22, fontWeight: '700', color: PINK },
  title: { fontSize: 18, fontWeight: '600', color: '#18191c', textAlign: 'center', marginBottom: 28 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6, marginLeft: 2 },
  input: {
    borderWidth: 1, borderColor: '#e5e6eb', borderRadius: 8,
    padding: 14, marginBottom: 20, fontSize: 15,
    backgroundColor: '#f9f9fa', color: '#333',
    outlineStyle: 'none' as any,
  },
  btn: {
    backgroundColor: PINK, borderRadius: 8, padding: 15,
    alignItems: 'center', marginTop: 8,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  footer: { alignItems: 'center', marginTop: 20 },
  footerText: { fontSize: 14, color: '#9499a0' },
  footerLink: { color: PINK, fontWeight: '600' },
});
