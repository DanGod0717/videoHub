import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useEffect, useRef, useState, useMemo } from 'react';
import { supabase } from '../../lib/supabase';

interface Props {
  video: any;
  currentQuality: string;
  onQualityChange: (q: string) => void;
}

export function VideoPlayer({ video, currentQuality, onQualityChange }: Props) {
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [progressHover, setProgressHover] = useState(-1);
  const elRef = useRef<HTMLVideoElement | null>(null);
  const nodeRef = useRef<any>(null);
  const hideTimer = useRef<any>(null);
  const viewCounted = useRef(false);

  const url = useMemo(() => {
    const tc: any[] = video.transcoded || [];
    if (tc.length === 0) {
      return supabase.storage.from('raw-videos').getPublicUrl(video.original_url).data.publicUrl;
    }
    const t = currentQuality ? tc.find((x: any) => x.quality === currentQuality) : tc[tc.length - 1];
    if (!t) return '';
    const clean = t.url.replace(/^(transcoded|thumbnails)\//, '');
    return supabase.storage.from('transcoded').getPublicUrl(clean).data.publicUrl;
  }, [video, currentQuality]);

  // 创建并挂载 video 元素
  useEffect(() => {
    if (!nodeRef.current) return;

    // 清理旧的
    if (elRef.current) {
      elRef.current.pause();
      elRef.current.remove();
    }

    viewCounted.current = false;
    const el = document.createElement('video');
    elRef.current = el;
    el.src = url;
    el.style.width = '100%';
    el.style.height = '100%';
    el.style.backgroundColor = '#000';
    el.style.outline = 'none';
    el.setAttribute('playsinline', '');

    const onTime = () => {
      setCurrentTime(el.currentTime);
      // 播放超过 5% 即计为一次播放
      if (!viewCounted.current && el.duration > 0 && el.currentTime / el.duration >= 0.05) {
        viewCounted.current = true;
        supabase.rpc('increment_view', { video_id: video.id }).then(({ error }: any) => {
          if (error) console.error('播放量更新失败:', error.message);
        });
      }
    };
    const onMeta = () => setDuration(el.duration);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    el.addEventListener('timeupdate', onTime);
    el.addEventListener('loadedmetadata', onMeta);
    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);
    el.addEventListener('click', () => el.paused ? el.play() : el.pause());

    nodeRef.current.appendChild(el);

    // 页面切走时暂停
    const onVis = () => { if (document.hidden) el.pause(); };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      document.removeEventListener('visibilitychange', onVis);
      el.removeEventListener('timeupdate', onTime);
      el.removeEventListener('loadedmetadata', onMeta);
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
      el.pause();
      el.removeAttribute('src');
      el.load();
      el.remove();
    };
  }, [url]);

  const getEl = () => elRef.current;

  const togglePlay = () => { const e = getEl(); if (e) e.paused ? e.play() : e.pause(); };
  const seek = (e: any) => {
    const el = getEl(); if (!el) return;
    el.currentTime = ((e.nativeEvent.offsetX) / e.target.offsetWidth) * duration;
  };
  const toggleMute = () => { const e = getEl(); if (e) { e.muted = !e.muted; setMuted(e.muted); } };
  const changeVol = (e: any) => {
    const el = getEl(); if (!el) return;
    const v = parseFloat(e.target.value);
    el.volume = v; setVolume(v); setMuted(v === 0);
  };
  const toggleFS = () => {
    document.fullscreenElement ? document.exitFullscreen() :
      nodeRef.current?.requestFullscreen?.();
  };

  const showBar = () => {
    setShowControls(true);
    clearTimeout(hideTimer.current);
    if (playing) hideTimer.current = setTimeout(() => setShowControls(false), 3000);
  };

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  };

  const transcoded: any[] = video.transcoded || [];

  return (
    // @ts-ignore
    <View style={styles.wrap} ref={nodeRef} onMouseMove={showBar}
      onMouseLeave={() => { if (playing) setShowControls(false); }}>
      {showControls && (
        // @ts-ignore
        <View style={styles.overlay} onMouseMove={showBar}>
          <TouchableOpacity style={styles.centerBtn} onPress={togglePlay}>
            <Text style={styles.centerIcon}>{playing ? '⏸' : '▶'}</Text>
          </TouchableOpacity>

          <View style={styles.bottomBar}>
            {/* 进度条 */}
            {/* @ts-ignore */}
            <View style={styles.progressWrap} onClick={seek}
              onMouseMove={(e: any) => {
                const t = e.target as HTMLElement;
                const r = t.getBoundingClientRect();
                setProgressHover((e.clientX - r.left) / r.width);
              }}
              onMouseLeave={() => setProgressHover(-1)}>
              <View style={styles.progressBg}>
                <View style={[styles.progressPlayed, { width: `${duration ? (currentTime / duration) * 100 : 0}%` }]} />
              </View>
              {progressHover >= 0 && (
                <View style={[styles.progressDot, { left: `${progressHover * 100}%` }]}>
                  <Text style={styles.hoverTime}>{fmt(progressHover * duration)}</Text>
                </View>
              )}
            </View>

            <View style={styles.controlRow}>
              <View style={styles.leftGroup}>
                <Text style={styles.btn} onPress={togglePlay}>{playing ? '⏸' : '▶'}</Text>
                <Text style={styles.time}>{fmt(currentTime)} / {fmt(duration)}</Text>
              </View>
              <View style={styles.rightGroup}>
                {transcoded.length > 0 && (
                  <View style={styles.qualityGroup}>
                    {transcoded.map((t: any) => (
                      <Text key={t.quality}
                        style={[styles.qTag, currentQuality === t.quality && styles.qTagActive]}
                        onPress={() => onQualityChange(t.quality)}>{t.quality}</Text>
                    ))}
                  </View>
                )}
                <Text style={styles.btn} onPress={toggleMute}>{muted || volume === 0 ? '🔇' : '🔊'}</Text>
                <input type="range" min={0} max={1} step={0.1} value={muted ? 0 : volume}
                  onChange={changeVol} style={{ width: 50, accentColor: '#fb7299', cursor: 'pointer' }} />
                <Text style={styles.btn} onPress={toggleFS}>⛶</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const PINK = '#fb7299';

const styles = StyleSheet.create({
  wrap: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000', position: 'relative' as any, cursor: 'pointer' as any },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10 },
  centerBtn: {
    position: 'absolute', top: '50%', left: '50%', marginLeft: -32, marginTop: -32,
    width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center',
  },
  centerIcon: { color: '#fff', fontSize: 28 },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingTop: 30, paddingBottom: 8, paddingHorizontal: 12,
    backgroundImage: 'linear-gradient(transparent, rgba(0,0,0,0.7))' as any,
  },
  progressWrap: { height: 24, justifyContent: 'center', marginBottom: 4, position: 'relative' as any },
  progressBg: { height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, overflow: 'hidden' },
  progressPlayed: { height: 4, backgroundColor: PINK, borderRadius: 2 },
  progressDot: { position: 'absolute', top: -18, marginLeft: -30, backgroundColor: 'rgba(0,0,0,0.8)', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 2 },
  hoverTime: { color: '#fff', fontSize: 11 },
  controlRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  leftGroup: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rightGroup: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  btn: { color: '#fff', fontSize: 18, userSelect: 'none' as any },
  time: { color: '#ddd', fontSize: 13 },
  qualityGroup: { flexDirection: 'row', gap: 6 },
  qTag: { color: '#aaa', fontSize: 12, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.15)', overflow: 'hidden' },
  qTagActive: { color: '#fff', backgroundColor: PINK, fontWeight: '600' },
});
