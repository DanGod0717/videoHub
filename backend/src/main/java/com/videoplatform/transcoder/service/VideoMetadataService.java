package com.videoplatform.transcoder.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.videoplatform.transcoder.model.TranscodeResult;
import com.videoplatform.transcoder.model.Video;
import com.videoplatform.transcoder.model.VideoMeta;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class VideoMetadataService {

    private final JdbcTemplate jdbc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public Video findById(UUID id) {
        return jdbc.queryForObject(
                "SELECT * FROM videos WHERE id = ?",
                (rs, rowNum) -> {
                    Video v = new Video();
                    v.setId(rs.getObject("id", UUID.class));
                    v.setUserId(rs.getObject("user_id", UUID.class));
                    v.setStatus(rs.getString("status"));
                    v.setTitle(rs.getString("title"));
                    v.setOriginalUrl(rs.getString("original_url"));
                    v.setOriginalSize(rs.getLong("original_size"));
                    return v;
                }, id);
    }

    @Transactional
    public boolean casStatus(UUID id, String from, String to) {
        return jdbc.update(
                "UPDATE videos SET status = ? WHERE id = ? AND status = ?",
                to, id, from) > 0;
    }

    @Transactional
    public void updateMeta(UUID id, VideoMeta meta) {
        jdbc.update(
                "UPDATE videos SET duration = ?, width = ?, height = ? WHERE id = ?",
                meta.getDuration(), meta.getWidth(), meta.getHeight(), id);
    }

    @Transactional
    public void updateTranscoded(UUID id, List<TranscodeResult> results,
                                  String hlsUrl, String thumbnailUrl) {
        try {
            String json = objectMapper.writeValueAsString(results);
            jdbc.update(
                    "UPDATE videos SET status = ?, transcoded = ?::jsonb, hls_url = ?, thumbnail_url = ? WHERE id = ?",
                    "ready", json, hlsUrl, thumbnailUrl, id);
        } catch (Exception e) {
            throw new RuntimeException("JSON 序列化失败", e);
        }
    }

    @Transactional
    public void updateFailed(UUID id, String errorMsg) {
        jdbc.update(
                "UPDATE videos SET status = ?, error_msg = ? WHERE id = ?",
                "failed", errorMsg, id);
    }
}
