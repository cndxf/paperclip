# Paperclip 本地部署

本目录基于官方 Paperclip Docker 快速启动配置。管理界面：`http://127.0.0.1:31300`。

启动：

```sh
docker-compose --env-file .env -f docker/docker-compose.quickstart.yml up -d --build
```

停止：

```sh
docker-compose --env-file .env -f docker/docker-compose.quickstart.yml down
```

数据位于 `data/`。模型 API 密钥未写入本地配置，需要使用智能体时再在 Paperclip 设置中配置。
