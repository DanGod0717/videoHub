package com.videoplatform.transcoder.config;

import io.minio.MinioClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MinioConfig {
//从配置文件读取 MinIO 连接地址、账号密钥，
// 创建一个全局唯一的 MinioClient 客户端 Bean，之后业务代码直接注入使用，不用每次手动新建连接
    //MinIO 服务地址
    @Value("${minio.endpoint}")
    private String endpoint;
    //MinIO  管理者帐号
    @Value("${minio.access-key}")
    private String accessKey;
    // 管理者密码
    @Value("${minio.secret-key}")
    private String secretKey;
    //.endpoint()：填入服务地址
    //.credentials(账号,密码)：填入鉴权密钥
    //.build()：生成可操作文件的 MinIO 客户端
    @Bean
    public MinioClient minioClient() {
        return MinioClient.builder()
                .endpoint(endpoint)
                .credentials(accessKey, secretKey)
                .build();
    }
}
