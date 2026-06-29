import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!username.trim()) { Alert.alert('请输入用户名'); return; }
    if (!email.trim()) { Alert.alert('请输入邮箱'); return; }
    if (password.length < 8) { Alert.alert('密码至少8位，需包含大小写字母、数字和符号'); return; }
    setLoading(true);
    try {
      await signUp(email.trim(), password, username.trim());
      router.replace('/(tabs)/home');
    } catch (e: any) {
      const msg = e.message || '未知错误';
      if (typeof window !== 'undefined') {
        window.alert('注册失败：' + msg);
      } else {
        Alert.alert('注册失败', msg);
      }
    }
    setLoading(false);
  };

  return (
    <View style={styles.bg}>
      <View style={styles.card}>
        <View style={styles.head}>
          <Text style={styles.logo}>▶</Text>
          <Text style={styles.brand}>VideoHub</Text>
        </View>
        <Text style={styles.title}>创建你的账号</Text>

        <Text style={styles.label}>用户名</Text>
        <TextInput style={styles.input} placeholder="给自己起个名字" placeholderTextColor="#bbb" value={username} onChangeText={setUsername} />

        <Text style={styles.label}>邮箱</Text>
        <TextInput style={styles.input} placeholder="请输入邮箱" placeholderTextColor="#bbb" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />

        <Text style={styles.label}>密码</Text>
        <TextInput style={styles.input} placeholder="至少8位，含大小写字母+数字+符号" placeholderTextColor="#bbb" value={password} onChangeText={setPassword} secureTextEntry />

        <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleRegister} disabled={loading}>
          <Text style={styles.btnText}>{loading ? '注册中...' : '注 册'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} style={styles.footer}>
          <Text style={styles.footerText}>已有账号？<Text style={styles.footerLink}>立即登录</Text></Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const PINK = '#fb7299';

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#f4f5f7', justifyContent: 'center', alignItems: 'center' },
  card: {
    width: 420, backgroundColor: '#fff', borderRadius: 16, padding: 40,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3,
  },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  logo: { fontSize: 28, color: PINK, fontWeight: '800', marginRight: 8 },
  brand: { fontSize: 22, fontWeight: '700', color: PINK },
  title: { fontSize: 18, fontWeight: '600', color: '#18191c', textAlign: 'center', marginBottom: 28 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6, marginLeft: 2 },
  input: {
    borderWidth: 1, borderColor: '#e5e6eb', borderRadius: 8, padding: 14, marginBottom: 20,
    fontSize: 15, backgroundColor: '#f9f9fa', color: '#333', outlineStyle: 'none' as any,
  },
  btn: { backgroundColor: PINK, borderRadius: 8, padding: 15, alignItems: 'center', marginTop: 8 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  footer: { alignItems: 'center', marginTop: 20 },
  footerText: { fontSize: 14, color: '#9499a0' },
  footerLink: { color: PINK, fontWeight: '600' },
});
