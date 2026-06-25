package com.videoplatform.transcoder.service;

import io.minio.GetObjectArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class MinioService {

    private final MinioClient minioClient;
    private static final String BUCKET_RAW = "raw-videos";
    private static final String BUCKET_TRANSCODED = "transcoded";
    private static final String BUCKET_THUMBNAILS = "thumbnails";

    public Path download(String objectPath) throws Exception {
        Path tmp = Files.createTempFile("raw_", ".mp4");
        try (InputStream is = minioClient.getObject(
                GetObjectArgs.builder().bucket(BUCKET_RAW).object(objectPath).build())) {
            Files.copy(is, tmp, StandardCopyOption.REPLACE_EXISTING);
        }
        return tmp;
    }

    public String upload(UUID videoId, Path file, String suffix) throws Exception {
        String objectName = videoId + "/" + suffix.replace("thumb", "thumb") + getExtension(suffix);
        String bucket = suffix.startsWith("thumb") ? BUCKET_THUMBNAILS : BUCKET_TRANSCODED;

        minioClient.putObject(PutObjectArgs.builder()
                .bucket(bucket).object(objectName)
                .stream(Files.newInputStream(file), Files.size(file), -1)
                .contentType(suffix.startsWith("thumb") ? "image/jpeg" : "video/mp4")
                .build());
        return bucket + "/" + objectName;
    }

    public void delete(String objectPath) throws Exception {
        minioClient.removeObject(RemoveObjectArgs.builder()
                .bucket(BUCKET_RAW).object(objectPath).build());
    }

    private String getExtension(Path file) {
        String name = file.getFileName().toString();
        return name.contains(".") ? name.substring(name.lastIndexOf(".")) : "";
    }
}
