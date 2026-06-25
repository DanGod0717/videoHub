package com.videoplatform.transcoder.controller;

import com.videoplatform.transcoder.service.VideoTranscodeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/videos")
@RequiredArgsConstructor
public class TranscodeController {

    private final VideoTranscodeService transcodeService;

    @PostMapping("/{id}/transcode")
    public ResponseEntity<String> triggerTranscode(@PathVariable UUID id) {
        transcodeService.transcode(id);
        return ResponseEntity.accepted().body("转码任务已提交");
    }
}
