package com.videoplatform.transcoder.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
@Slf4j
public class MinioService {

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.service-role-key}")
    private String serviceRoleKey;

    private final HttpClient httpClient = HttpClient.newHttpClient();

    private static final String BUCKET_RAW = "raw-videos";
    private static final String BUCKET_TRANSCODED = "transcoded";
    private static final String BUCKET_THUMBNAILS = "thumbnails";

    public Path download(String objectPath) throws Exception {
        String url = supabaseUrl + "/storage/v1/object/" + BUCKET_RAW + "/" + objectPath;
        HttpRequest req = HttpRequest.newBuilder(URI.create(url))
                .header("apikey", serviceRoleKey)
                .header("Authorization", "Bearer " + serviceRoleKey)
                .GET().build();
        HttpResponse<InputStream> resp = httpClient.send(req, HttpResponse.BodyHandlers.ofInputStream());

        if (resp.statusCode() != 200) {
            throw new RuntimeException("下载失败: HTTP " + resp.statusCode());
        }

        Path tmp = Files.createTempFile("raw_", ".mp4");
        Files.copy(resp.body(), tmp, StandardCopyOption.REPLACE_EXISTING);
        return tmp;
    }

    public String upload(UUID videoId, Path file, String suffix) throws Exception {
        String bucket = suffix.startsWith("thumb") ? BUCKET_THUMBNAILS : BUCKET_TRANSCODED;
        String objectName = videoId + "/" + suffix + ".mp4";
        if (suffix.startsWith("thumb")) objectName = videoId + "/thumb.jpg";

        String url = supabaseUrl + "/storage/v1/object/" + bucket + "/" + objectName;
        byte[] data = Files.readAllBytes(file);
        String contentType = suffix.startsWith("thumb") ? "image/jpeg" : "video/mp4";

        HttpRequest req = HttpRequest.newBuilder(URI.create(url))
                .header("apikey", serviceRoleKey)
                .header("Authorization", "Bearer " + serviceRoleKey)
                .header("Content-Type", contentType)
                .header("x-upsert", "true")
                .POST(HttpRequest.BodyPublishers.ofByteArray(data))
                .build();

        HttpResponse<String> resp = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
        if (resp.statusCode() != 200) {
            throw new RuntimeException("上传失败: HTTP " + resp.statusCode() + " " + resp.body());
        }
        return objectName;
    }

    public void delete(String objectPath) throws Exception {
        String url = supabaseUrl + "/storage/v1/object/" + BUCKET_RAW + "/" + objectPath;
        HttpRequest req = HttpRequest.newBuilder(URI.create(url))
                .header("apikey", serviceRoleKey)
                .header("Authorization", "Bearer " + serviceRoleKey)
                .DELETE().build();
        httpClient.send(req, HttpResponse.BodyHandlers.discarding());
    }
}
