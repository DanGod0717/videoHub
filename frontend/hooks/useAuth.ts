import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

export function useAuth() {
  const user = useAuthStore((s) => s.user);

  const signUp = async (email: string, password: string, username: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    if (error) throw error;
    // data.user 存在但 data.session 为 null → 邮箱已注册（GoTrue 防枚举攻击）
    if (data.user && !data.session) {
      throw new Error('该邮箱已被注册，请直接登录');
    }
    return data;
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return {
    user,
    isLoggedIn: !!user,
    signUp,
    signIn,
    signOut,
  };
}
