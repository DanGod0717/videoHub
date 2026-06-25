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
