# 视频平台

## 项目结构

```
video-platform/
├── frontend/                  # Expo 跨平台前端（React Native）
│   ├── app/                   # 页面（文件路由）
│   │   ├── _layout.tsx        # 根布局（Auth + QueryClient）
│   │   ├── (tabs)/
│   │   │   ├── _layout.tsx    # 底部 Tab 导航
│   │   │   ├── home.tsx       # 首页视频流
│   │   │   ├── upload.tsx     # 上传页
│   │   │   └── profile.tsx    # 个人页
│   │   ├── auth/
│   │   │   ├── login.tsx      # 登录
│   │   │   └── register.tsx   # 注册
│   │   ├── video/[id].tsx     # 视频播放页
│   │   └── user/[id].tsx      # 用户主页
│   ├── components/
│   │   ├── video/VideoCard.tsx
│   │   └── ui/Loading.tsx
│   ├── hooks/
│   │   ├── useAuth.ts         # 认证 hook
│   │   └── useVideos.ts       # 视频列表 hook
│   ├── stores/
│   │   └── authStore.ts       # Zustand 认证状态
│   ├── lib/
│   │   └── supabase.ts        # Supabase 客户端
│   ├── types/index.ts         # TypeScript 类型
│   ├── package.json
│   ├── app.json
│   └── tsconfig.json
│
├── backend/                   # Java Spring Boot 转码服务
│   ├── src/main/java/com/videoplatform/transcoder/
│   │   ├── TranscodeApplication.java
│   │   ├── config/
│   │   │   └── MinioConfig.java
│   │   ├── controller/
│   │   │   └── TranscodeController.java
│   │   ├── service/
│   │   │   ├── VideoTranscodeService.java   # 转码主流程
│   │   │   ├── FFmpegService.java           # FFmpeg 命令
│   │   │   ├── MinioService.java            # 文件存储
│   │   │   └── VideoMetadataService.java    # 数据库操作
│   │   ├── model/
│   │   │   ├── Video.java
│   │   │   ├── TranscodeResult.java
│   │   │   └── VideoMeta.java
│   │   ├── lock/
│   │   │   └── TranscodeLock.java
│   │   └── exception/
│   │       └── GlobalExceptionHandler.java
│   ├── src/main/resources/
│   │   └── application.yml
│   └── pom.xml
│
└── supabase/
    └── schema.sql             # 数据库建表脚本
```

## 启动顺序

### 1. 启动 Supabase
```bash
cd ~/supabase-project
docker compose up -d
```

### 2. 执行建表 SQL
打开 http://localhost:3000 → SQL Editor → 粘贴 supabase/schema.sql → 执行

### 3. 启动前端
```bash
cd ~/javapywork/video-platform/frontend
npx expo start --web
```

### 4. 启动 Java 后端（需要转码功能时）
```bash
cd ~/javapywork/video-platform/backend
mvn spring-boot:run
```

## 技术栈

| 层 | 技术 |
|----|------|
| 前端 | Expo (React Native) + TypeScript + React Query + Zustand |
| 数据库 | Supabase PostgreSQL + RLS + Trigger |
| 认证 | Supabase Auth (GoTrue) |
| 存储 | Supabase Storage + MinIO |
| 实时 | Supabase Realtime |
| 转码 | Java Spring Boot + FFmpeg |


### java转码功能

 转码全流程

  1. 抢任务
     UPDATE videos SET status='processing' WHERE id=? AND status='uploading'
     → 只有第一个抢到的实例能改成功（原子操作防重复）

  2. 下载原片
     从 Supabase Storage (MinIO) 下载用户上传的 .mp4

  3. 分析视频
     ffprobe → 拿到时长、分辨率、编码格式

  4. 多码率转码（并行）
     原片 1080p → ffmpeg → 480p.mp4  (854×480,  800kbps)
               → ffmpeg → 720p.mp4  (1280×720, 1500kbps)
               → ffmpeg → 1080p.mp4 (1920×1080,3000kbps)

     智能跳过：原片只有 720p → 不转 1080p，省 CPU

  5. 截缩略图
     ffmpeg -ss 3 -vframes 1 → 截取第 3 秒画面 → thumb.jpg

  6. 上传产物
     转码后的视频 + 缩略图 → 上传回 Supabase Storage

  7. 更新数据库
     UPDATE videos SET status='ready', transcoded=[...], hls_url='...', thumbnail_url='...'

  8. 清理
     删除原片（省存储空间）+ 删除本地临时文件

  ---
  一句话
  
  ▎ Java 把用户上传的一个大原片，变成多个清晰度的小视频 + 一张封面图，让不同网速的人都能流畅观看