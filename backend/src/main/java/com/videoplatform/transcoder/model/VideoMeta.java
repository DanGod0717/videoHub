package com.videoplatform.transcoder.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VideoMeta {
    private int duration;
    private int width;
    private int height;
}
