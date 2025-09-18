# 文档管理系统后端

## 环境变量配置

```bash
# API密钥（生产环境请使用强密钥）
API_KEY=your-secret-api-key-here

# 前端URL（CORS配置）
FRONTEND_URL=http://localhost:5173

# 服务端口
PORT=3001
```

## 安装依赖

```bash
cd backend
npm install
```

## 启动服务

```bash
# 开发模式（文件变化自动重启）
npm run dev

# 生产模式
npm start
```

## API接口文档

### 公开接口（无需密钥）

#### 获取文档列表
- **GET** `/api/documents`
- **描述**: 获取所有文档的基本信息列表
- **响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "文档标题",
      "description": "文档描述",
      "createdAt": "2023-12-01T10:00:00.000Z",
      "updatedAt": "2023-12-01T10:00:00.000Z",
      "size": 1024
    }
  ]
}
```

#### 获取文档内容
- **GET** `/api/documents/:id`
- **描述**: 获取指定文档的完整内容
- **响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "文档标题",
    "description": "文档描述",
    "content": "# Markdown内容",
    "createdAt": "2023-12-01T10:00:00.000Z",
    "updatedAt": "2023-12-01T10:00:00.000Z",
    "size": 1024
  }
}
```

### 需要密钥验证的接口

**请求头**: `X-API-Key: your-secret-api-key-here` 或 `Authorization: Bearer your-secret-api-key-here`

#### 上传文档
- **POST** `/api/documents`
- **请求体**:
```json
{
  "title": "文档标题",
  "content": "# Markdown内容",
  "description": "文档描述（可选）"
}
```

#### 修改文档
- **PUT** `/api/documents/:id`
- **请求体**:
```json
{
  "title": "新标题（可选）",
  "content": "新内容（可选）",
  "description": "新描述（可选）"
}
```

#### 删除文档
- **DELETE** `/api/documents/:id`

## 文件结构

```
backend/
├── server.js          # 主服务文件
├── package.json       # 项目配置
├── documents/         # 文档存储目录（自动创建）
│   ├── index.json    # 文档索引文件
│   └── *.md          # Markdown文件
└── README.md         # 本文件
```

## 安全特性

1. **API密钥验证**: 所有写操作都需要有效的API密钥
2. **CORS配置**: 限制跨域访问来源
3. **速率限制**: 防止API滥用
4. **输入验证**: 验证必要的请求参数
5. **错误处理**: 完整的错误处理和日志记录