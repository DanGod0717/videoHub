package com.videoplatform.transcoder.service;

import com.videoplatform.transcoder.model.TranscodeResult;
import com.videoplatform.transcoder.model.VideoMeta;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@Slf4j
public class FFmpegService {

    private static final int TIMEOUT_MINUTES = 10;

    public VideoMeta probeVideo(Path input) throws Exception {
        ProcessBuilder pb = new ProcessBuilder(
                "ffprobe", "-v", "quiet", "-print_format", "json",
                "-show_format", "-show_streams", input.toString()
        );
        Process p = pb.start();
        p.waitFor(1, TimeUnit.MINUTES);

        String output = new String(p.getInputStream().readAllBytes());
        // 简化：从 ffprobe JSON 中解析 duration/width/height
        double duration = 0; int width = 0; int height = 0;
        if (output.contains("\"duration\"")) {
            String dur = output.split("\"duration\"")[1].split(":")[1].split(",")[0].replaceAll("[^0-9.]", "");
            duration = Double.parseDouble(dur);
        }
        if (output.contains("\"width\"")) {
            String w = output.split("\"width\"")[1].split(":")[1].split(",")[0].replaceAll("[^0-9]", "");
            width = Integer.parseInt(w);
        }
        if (output.contains("\"height\"")) {
            String h = output.split("\"height\"")[1].split(":")[1].split(",")[0].replaceAll("[^0-9]", "");
            height = Integer.parseInt(h);
        }
        return new VideoMeta((int) duration, width, height);
    }

    public Path transcode(Path input, String quality) throws Exception {
        Path output = Files.createTempFile("transcode_" + quality + "_", ".mp4");

        String videoBitrate = "800k";
        String scale = "-2:480";
        String audioBitrate = "128k";
        if ("720p".equals(quality)) { videoBitrate = "1500k"; scale = "-2:720"; }
        if ("1080p".equals(quality)) { videoBitrate = "3000k"; scale = "-2:1080"; audioBitrate = "192k"; }

        ProcessBuilder pb = new ProcessBuilder(
                "ffmpeg", "-y", "-i", input.toString(),
                "-c:v", "libx264", "-preset", "fast",
                "-vf", "scale=" + scale,
                "-b:v", videoBitrate, "-c:a", "aac", "-b:a", audioBitrate,
                output.toString()
        );

        Process p = pb.start();
        p.waitFor(TIMEOUT_MINUTES, TimeUnit.MINUTES);

        if (p.exitValue() != 0) {
            String err = new String(p.getErrorStream().readAllBytes());
            throw new RuntimeException("FFmpeg 转码失败: " + err);
        }
        return output;
    }

    public Path captureFrame(Path input, int second) throws Exception {
        Path output = Files.createTempFile("thumb_", ".jpg");
        new ProcessBuilder("ffmpeg", "-y", "-i", input.toString(),
                "-ss", String.valueOf(second), "-vframes", "1", output.toString())
                .start().waitFor(1, TimeUnit.MINUTES);
        return output;
    }

    public String generateHLS(UUID videoId, List<TranscodeResult> results) {
        // 简化版：返回第一个（最高清）的 URL 作为 hls_url
        return results.isEmpty() ? null : results.get(results.size() - 1).getUrl();
    }
}
