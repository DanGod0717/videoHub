-- ============================================
-- 视频平台 - 完整数据库建表脚本
-- ============================================

-- 建表
CREATE TABLE public.profiles (
    user_id   uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username  text UNIQUE NOT NULL,
    avatar_url text,
    bio        text DEFAULT '',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.videos (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title         text NOT NULL,
    description   text DEFAULT '',
    status        text DEFAULT 'uploading' CHECK (status IN ('uploading','processing','ready','failed')),
    original_url  text NOT NULL,
    original_size bigint,
    transcoded    jsonb DEFAULT '[]',
    hls_url       text,
    thumbnail_url text,
    duration      int,
    width         int,
    height        int,
    view_count    int DEFAULT 0,
    like_count    int DEFAULT 0,
    comment_count int DEFAULT 0,
    error_msg     text,
    created_at    timestamptz DEFAULT now(),
    updated_at    timestamptz DEFAULT now()
);

CREATE TABLE public.comments (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id   uuid REFERENCES public.videos(id) ON DELETE CASCADE NOT NULL,
    user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content    text NOT NULL,
    parent_id  uuid REFERENCES public.comments(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE public.likes (
    video_id   uuid REFERENCES public.videos(id) ON DELETE CASCADE,
    user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    PRIMARY KEY (video_id, user_id)
);

CREATE TABLE public.follows (
    follower_id  uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    following_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at   timestamptz DEFAULT now(),
    PRIMARY KEY (follower_id, following_id),
    CHECK (follower_id <> following_id)
);

CREATE TABLE public.notifications (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type       text NOT NULL CHECK (type IN ('comment','like','follow','transcode_ready','transcode_failed')),
    source_id  uuid,
    message    text,
    is_read    boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- 索引
CREATE INDEX idx_videos_feed ON public.videos (status, created_at DESC) WHERE status = 'ready';
CREATE INDEX idx_videos_user ON public.videos (user_id, created_at DESC);
CREATE INDEX idx_videos_transcoded ON public.videos USING GIN (transcoded);
CREATE INDEX idx_comments_video ON public.comments (video_id, created_at);
CREATE INDEX idx_notifications_user ON public.notifications (user_id, is_read, created_at DESC);

-- 开启 RLS
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS 策略
CREATE POLICY "videos_select" ON public.videos FOR SELECT USING (status = 'ready');
CREATE POLICY "videos_insert" ON public.videos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "videos_update" ON public.videos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "videos_delete" ON public.videos FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "comments_select" ON public.comments FOR SELECT USING (true);
CREATE POLICY "comments_insert" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_delete" ON public.comments FOR DELETE USING (
    auth.uid() = user_id OR auth.uid() = (SELECT user_id FROM public.videos WHERE id = video_id)
);

CREATE POLICY "likes_select" ON public.likes FOR SELECT USING (true);
CREATE POLICY "likes_insert" ON public.likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "likes_delete" ON public.likes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "follows_select" ON public.follows FOR SELECT USING (true);
CREATE POLICY "follows_insert" ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "follows_delete" ON public.follows FOR DELETE USING (auth.uid() = follower_id);

CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "notifications_select" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_insert" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "notifications_update" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- Trigger 函数
CREATE FUNCTION public.handle_new_user() RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (user_id, username, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE FUNCTION public.auto_updated_at() RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_videos_updated_at BEFORE UPDATE ON public.videos FOR EACH ROW EXECUTE FUNCTION public.auto_updated_at();
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.auto_updated_at();

CREATE FUNCTION public.check_video_status() RETURNS trigger AS $$
BEGIN
    IF OLD.status = 'ready' AND NEW.status <> 'ready' THEN
        RAISE EXCEPTION '已完成的视频不能回退状态';
    END IF;
    IF OLD.status = 'processing' AND NEW.status NOT IN ('ready', 'failed') THEN
        RAISE EXCEPTION '处理中的视频只能变为 ready 或 failed';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_video_status BEFORE UPDATE ON public.videos FOR EACH ROW WHEN (OLD.status IS DISTINCT FROM NEW.status) EXECUTE FUNCTION public.check_video_status();

CREATE FUNCTION public.sync_comment_count() RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.videos SET comment_count = comment_count + 1 WHERE id = NEW.video_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.videos SET comment_count = comment_count - 1 WHERE id = OLD.video_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_comment_count AFTER INSERT OR DELETE ON public.comments FOR EACH ROW EXECUTE FUNCTION public.sync_comment_count();

CREATE FUNCTION public.sync_like_count() RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.videos SET like_count = like_count + 1 WHERE id = NEW.video_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.videos SET like_count = like_count - 1 WHERE id = OLD.video_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_like_count AFTER INSERT OR DELETE ON public.likes FOR EACH ROW EXECUTE FUNCTION public.sync_like_count();
