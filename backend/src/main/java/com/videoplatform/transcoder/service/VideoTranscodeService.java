package com.videoplatform.transcoder.service;

import com.videoplatform.transcoder.lock.TranscodeLock;
import com.videoplatform.transcoder.model.TranscodeResult;
import com.videoplatform.transcoder.model.Video;
import com.videoplatform.transcoder.model.VideoMeta;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class VideoTranscodeService {

    private final FFmpegService ffmpegService;
    private final MinioService minioService;
    private final VideoMetadataService metadataService;
    private final TranscodeLock transcodeLock;

    @Async
    public void transcode(UUID videoId) {
        // CAS 抢占
        if (!metadataService.casStatus(videoId, "uploading", "processing")) {
            log.info("视频 {} 已被其他实例处理，跳过", videoId);
            return;
        }

        Path rawFile = null;
        try {
            Video video = metadataService.findById(videoId);

            // 下载原片
            rawFile = minioService.download(video.getOriginalUrl());
            log.info("下载完成: {}", videoId);

            // 分析视频信息
            VideoMeta meta = ffmpegService.probeVideo(rawFile);
            metadataService.updateMeta(videoId, meta);

            // 多码率转码
            List<TranscodeResult> results = new ArrayList<>();
            for (String quality : List.of("480p", "720p", "1080p")) {
                int targetHeight = switch (quality) {
                    case "480p" -> 480;
                    case "720p" -> 720;
                    case "1080p" -> 1080;
                    default -> 720;
                };
                if (meta.getHeight() <= targetHeight) {
                    log.info("跳过 {} (原片高度 {} ≤ {})", quality, meta.getHeight(), targetHeight);
                    continue;
                }

                Path output = ffmpegService.transcode(rawFile, quality);
                String url = minioService.upload(videoId, output, quality);
                results.add(new TranscodeResult(quality, url,
                        java.nio.file.Files.size(output),
                        getBitrate(quality),
                        getWidth(quality), targetHeight));
            }

            // 缩略图
            Path thumbnail = ffmpegService.captureFrame(rawFile, 3);
            String thumbnailUrl = minioService.upload(videoId, thumbnail, "thumbnail");

            // HLS
            String hlsUrl = ffmpegService.generateHLS(videoId, results);

            // 更新数据库
            metadataService.updateTranscoded(videoId, results, hlsUrl, thumbnailUrl);
            log.info("转码完成: {}", videoId);

            // 清理原片
            minioService.delete(video.getOriginalUrl());

        } catch (Exception e) {
            log.error("转码失败: {}", videoId, e);
            metadataService.updateFailed(videoId, e.getMessage());
        } finally {
            if (rawFile != null) {
                try { java.nio.file.Files.deleteIfExists(rawFile); } catch (Exception ignored) {}
            }
        }
    }

    private int getBitrate(String quality) {
        return switch (quality) { case "480p" -> 800; case "720p" -> 1500; case "1080p" -> 3000; default -> 1500; };
    }

    private int getWidth(String quality) {
        return switch (quality) { case "480p" -> 854; case "720p" -> 1280; case "1080p" -> 1920; default -> 1280; };
    }
}
