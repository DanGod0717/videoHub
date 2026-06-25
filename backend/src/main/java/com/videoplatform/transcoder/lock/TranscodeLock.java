package com.videoplatform.transcoder.lock;

import org.springframework.stereotype.Component;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

@Component
public class TranscodeLock {

    private final ConcurrentHashMap<UUID, Long> locks = new ConcurrentHashMap<>();

    public boolean tryAcquire(UUID videoId) {
        Long now = System.currentTimeMillis();
        Long existing = locks.putIfAbsent(videoId, now);
        if (existing == null) return true;

        // 超时 30 分钟自动释放
        if (now - existing > TimeUnit.MINUTES.toMillis(30)) {
            locks.put(videoId, now);
            return true;
        }
        return false;
    }

    public void release(UUID videoId) {
        locks.remove(videoId);
    }
}
