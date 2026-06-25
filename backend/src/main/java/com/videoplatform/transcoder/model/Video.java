package com.videoplatform.transcoder.model;

import lombok.Data;
import java.time.Instant;
import java.util.UUID;

@Data
public class Video {
    private UUID id;
    private UUID userId;
    private String title;
    private String status;
    private String originalUrl;
    private Long originalSize;
    private String transcoded;   // JSONB string
    private String hlsUrl;
    private String thumbnailUrl;
    private Integer duration;
    private Integer width;
    private Integer height;
    private String errorMsg;
    private Instant createdAt;
    private Instant updatedAt;
}
