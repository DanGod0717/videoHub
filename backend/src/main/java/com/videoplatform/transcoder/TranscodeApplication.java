package com.videoplatform.transcoder;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class TranscodeApplication {
    public static void main(String[] args) {
        SpringApplication.run(TranscodeApplication.class, args);
    }
}
