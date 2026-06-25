package com.videoplatform.transcoder.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TranscodeResult {
    private String quality;
    private String url;
    private long size;
    private int bitrate;
    private int width;
    private int height;
}
