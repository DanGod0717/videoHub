package com.videoplatform.transcoder.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class TranscodeScheduler {

    private final JdbcTemplate jdbc;
    private final VideoTranscodeService transcodeService;

    // 每 10 秒扫描一次
    @Scheduled(fixedDelay = 10_000)
    public void scanAndTranscode() {
        List<UUID> uploadingIds = jdbc.queryForList(
                "SELECT id FROM videos WHERE status = 'uploading' ORDER BY created_at LIMIT 5",
                UUID.class);

        if (uploadingIds.isEmpty()) return;

        log.info("发现 {} 个待转码视频", uploadingIds.size());
        for (UUID id : uploadingIds) {
            try {
                transcodeService.transcode(id);
            } catch (Exception e) {
                log.error("转码提交失败: {}", id, e);
            }
        }
    }
}
