// ============================================
// 数据库记录类型
// ============================================

export interface Profile {
  user_id: string;
  username: string;
  avatar_url: string | null;
  bio: string;
  created_at: string;
}

export interface Video {
  id: string;
  user_id: string;
  title: string;
  description: string;
  status: 'uploading' | 'processing' | 'ready' | 'failed';
  original_url: string;
  original_size: number | null;
  transcoded: TranscodeResult[];
  hls_url: string | null;
  thumbnail_url: string | null;
  duration: number | null;
  width: number | null;
  height: number | null;
  view_count: number;
  like_count: number;
  comment_count: number;
  error_msg: string | null;
  created_at: string;
  updated_at: string;
  // JOIN 出来的
  user?: Profile;
  is_liked?: boolean;
}

export interface TranscodeResult {
  quality: string;
  url: string;
  size: number;
  bitrate: number;
  w: number;
  h: number;
}

export interface Comment {
  id: string;
  video_id: string;
  user_id: string;
  content: string;
  parent_id: string | null;
  created_at: string;
  user?: Profile;
}

export interface Like {
  video_id: string;
  user_id: string;
  created_at: string;
}

export interface Follow {
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'comment' | 'like' | 'follow' | 'transcode_ready' | 'transcode_failed';
  source_id: string | null;
  message: string | null;
  is_read: boolean;
  created_at: string;
}
