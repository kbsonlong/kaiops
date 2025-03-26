# K8s集群管理系统

一个基于Go和React的全栈应用，用于管理和监控Kubernetes集群。

## 功能特点

- 集群管理：创建、查看、更新和删除Kubernetes集群
- 节点监控：查看集群节点状态和详细信息
- 集群筛选：支持按类型和区域筛选集群
- 分页显示：支持集群列表分页查看
- RESTful API：提供标准的REST API接口
- Swagger文档：集成API文档

## 技术栈

### 后端
- Go
- Gin Web框架
- GORM数据库ORM
- Swagger API文档
- Air（热重载）

### 前端
- React 18
- TypeScript
- Vite构建工具
- React Router v6
- Ant Design UI组件库

## 本地开发

### 后端启动

1. 确保已安装Go 1.16+
2. 安装依赖：
```bash
go mod download
```

3. 创建数据库：
```bash
# 创建数据库
go run migrate/migrate.go
```

4. 初始化Api文档
```bash
swag init --parseDependency --parseInternal -g cmd/main.go
```

5. 启动开发服务器：
```bash
air # 使用air进行热重载
# 或者
go run cmd/main.go
```

### 前端启动

1. 进入前端目录：
```bash
cd frontend
```

2. 安装依赖：
```bash
npm install
```

3. 启动开发服务器：
```bash
npm run dev
```

## Docker部署

### 使用Dockerfile

#### 后端

```dockerfile
# 构建阶段
FROM golang:1.19-alpine AS builder
WORKDIR /app
COPY . .
RUN go mod download
RUN CGO_ENABLED=0 GOOS=linux go build -o main cmd/main.go

# 运行阶段
FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/main .
COPY .env .
EXPOSE 8080
CMD ["./main"]
```

#### 前端

```dockerfile
# 构建阶段
FROM node:18-alpine AS builder
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install
COPY frontend .
RUN npm run build

# 运行阶段
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 使用Docker Compose

创建`docker-compose.yml`：

```yaml
version: '3.8'

services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "8080:8080"
    environment:
      - DB_HOST=db
    depends_on:
      - db

  frontend:
    build:
      context: .
      dockerfile: frontend/Dockerfile
    ports:
      - "80:80"
    depends_on:
      - backend

  db:
    image: postgres:13-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=k8s_manager
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### 部署步骤

1. 构建并启动服务：
```bash
docker-compose up -d
```

2. 查看服务状态：
```bash
docker-compose ps
```

3. 查看日志：
```bash
docker-compose logs -f
```

4. 停止服务：
```bash
docker-compose down
```

## API文档

启动后端服务后，访问 `http://localhost:8080/swagger/index.html` 查看API文档。

## 开发环境要求

- Go 1.16+
- Node.js 16+
- Docker & Docker Compose (可选，用于容器化部署)