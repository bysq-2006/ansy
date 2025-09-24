import express from 'express';
import cors from 'cors';
import fs from 'fs-extra';
import dotenv from 'dotenv';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import rateLimit from 'express-rate-limit';

dotenv.config(); //配置

import multer from 'multer';

const app = express();
const PORT = process.env.PORT || 3001;
const API_KEY = process.env.API_KEY || 'your-secret-api-key-here';

// 文档存储目录
const DOCUMENTS_DIR = path.join(process.cwd(), 'documents');
const UPLOADS_DIR = path.join(DOCUMENTS_DIR, 'uploads');
const INDEX_FILE = path.join(DOCUMENTS_DIR, 'index.json');

// 确保文档目录存在

await fs.ensureDir(DOCUMENTS_DIR);
await fs.ensureDir(UPLOADS_DIR);

// 如果索引文件不存在，创建一个空的
if (!(await fs.pathExists(INDEX_FILE))) {
  await fs.writeJson(INDEX_FILE, []);
}

// 中间件配置
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态资源访问：图片上传目录
app.use('/uploads', express.static(UPLOADS_DIR));

// 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 限制每个IP在窗口期内最多100个请求
  message: { error: '请求过于频繁，请稍后再试' }
});
app.use('/api/', limiter);

// API密钥验证中间件
const requireAuth = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
  
  if (!apiKey || apiKey !== API_KEY) {
    return res.status(401).json({ 
      error: '未授权访问',
      message: '请提供有效的API密钥' 
    });
  }
  
  next();
};

// 辅助函数：读取索引
const readIndex = async () => {
  try {
    return await fs.readJson(INDEX_FILE);
  } catch (error) {
    console.error('读取索引文件失败:', error);
    return [];
  }
};

// 辅助函数：写入索引
const writeIndex = async (index) => {
  try {
    await fs.writeJson(INDEX_FILE, index, { spaces: 2 });
  } catch (error) {
    console.error('写入索引文件失败:', error);
    throw error;
  }
};

// ==================== 公开接口（不需要密钥） ====================

// ==================== 图片上传接口（Vditor） ====================
// 使用 multer 处理图片上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Vditor 图片上传接口（无需鉴权）
app.post('/api/upload', upload.array('file[]'), (req, res) => {
  const files = req.files;
  if (!files || files.length === 0) {
    return res.status(400).json({
      msg: '未收到文件',
      code: 1,
      data: { errFiles: [], succMap: {} }
    });
  }
  const succMap = {};
  const host = req.protocol + '://' + req.get('host');
  files.forEach(file => {
    succMap[file.originalname] = `${host}/uploads/${file.filename}`;
  });
  res.json({
    msg: '',
    code: 0,
    data: {
      errFiles: [],
      succMap
    }
  });
});

// 获取文档列表
app.get('/api/documents', async (req, res) => {
  try {
    const index = await readIndex();
    res.json({
      success: true,
      data: index.map(doc => ({
        id: doc.id,
        title: doc.title,
        description: doc.description,
        imageUrl: doc.imageUrl || null,
        coverUrl: doc.coverUrl || '',
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        size: doc.size
      }))
    });
  } catch (error) {
    console.error('获取文档列表失败:', error);
    res.status(500).json({ 
      error: '服务器错误',
      message: '获取文档列表失败' 
    });
  }
});

// 获取特定文档内容
app.get('/api/documents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const index = await readIndex();
    const document = index.find(doc => doc.id === id);
    
    if (!document) {
      return res.status(404).json({ 
        error: '文档不存在',
        message: `找不到ID为 ${id} 的文档` 
      });
    }
    
    const filePath = path.join(DOCUMENTS_DIR, document.filename);
    const content = await fs.readFile(filePath, 'utf-8');
    
    res.json({
      success: true,
      data: {
        ...document,
        imageUrl: document.imageUrl || null,
        coverUrl: document.coverUrl || '',
        content
      }
    });
  } catch (error) {
    console.error('获取文档内容失败:', error);
    res.status(500).json({ 
      error: '服务器错误',
      message: '获取文档内容失败' 
    });
  }
});

// ==================== 需要密钥验证的接口 ====================

// 上传文档
app.post('/api/documents', requireAuth, async (req, res) => {
  try {
    const { title, content, description = '', imageUrl = '', coverUrl = '' } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ 
        error: '参数错误',
        message: '标题和内容不能为空' 
      });
    }
    
    // 生成唯一ID和文件名
    const id = uuidv4();
    const filename = `${id}.md`;
    const filePath = path.join(DOCUMENTS_DIR, filename);
    
    // 写入文件
    await fs.writeFile(filePath, content, 'utf-8');
    
    // 获取文件信息
    const stats = await fs.stat(filePath);
    
    // 更新索引
    const index = await readIndex();
    const newDocument = {
      id,
      title: title.trim(),
      description: description.trim(),
      imageUrl: imageUrl ? imageUrl.trim() : '',
      coverUrl: coverUrl ? coverUrl.trim() : '',
      filename,
      size: stats.size,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    index.push(newDocument);
    await writeIndex(index);
    
    res.status(201).json({
      success: true,
      message: '文档上传成功',
      data: newDocument
    });
  } catch (error) {
    console.error('上传文档失败:', error);
    res.status(500).json({ 
      error: '服务器错误',
      message: '文档上传失败' 
    });
  }
});

// 修改文档
app.put('/api/documents/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, description, imageUrl, coverUrl } = req.body;
    
    const index = await readIndex();
    const documentIndex = index.findIndex(doc => doc.id === id);
    
    if (documentIndex === -1) {
      return res.status(404).json({ 
        error: '文档不存在',
        message: `找不到ID为 ${id} 的文档` 
      });
    }
    
    const document = index[documentIndex];
    const filePath = path.join(DOCUMENTS_DIR, document.filename);
    
    // 更新文件内容
    if (content !== undefined) {
      await fs.writeFile(filePath, content, 'utf-8');
    }
    
    // 更新索引信息
    if (title !== undefined) {
      document.title = title.trim();
    }
    if (description !== undefined) {
      document.description = description.trim();
    }
    if (imageUrl !== undefined) document.imageUrl = imageUrl.trim();
    if (coverUrl !== undefined) document.coverUrl = coverUrl.trim();
    
    // 更新文件大小和修改时间
    const stats = await fs.stat(filePath);
    document.size = stats.size;
    document.updatedAt = new Date().toISOString();
    
    index[documentIndex] = document;
    await writeIndex(index);
    
    res.json({
      success: true,
      message: '文档更新成功',
      data: document
    });
  } catch (error) {
    console.error('更新文档失败:', error);
    res.status(500).json({ 
      error: '服务器错误',
      message: '文档更新失败' 
    });
  }
});

// 删除文档
app.delete('/api/documents/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const index = await readIndex();
    const documentIndex = index.findIndex(doc => doc.id === id);
    
    if (documentIndex === -1) {
      return res.status(404).json({ 
        error: '文档不存在',
        message: `找不到ID为 ${id} 的文档` 
      });
    }
    
    const document = index[documentIndex];
    const filePath = path.join(DOCUMENTS_DIR, document.filename);
    
    // 删除文件
    await fs.remove(filePath);
    
    // 从索引中移除
    index.splice(documentIndex, 1);
    await writeIndex(index);
    
    res.json({
      success: true,
      message: '文档删除成功',
      data: { id }
    });
  } catch (error) {
    console.error('删除文档失败:', error);
    res.status(500).json({ 
      error: '服务器错误',
      message: '文档删除失败' 
    });
  }
});

// 健康检查端点
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API服务正常运行',
    timestamp: new Date().toISOString()
  });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    error: '接口不存在',
    message: `未找到请求的接口: ${req.method} ${req.originalUrl}`
  });
});

// 全局错误处理
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    error: '内部服务器错误',
    message: '服务器遇到了一个错误'
  });
});

app.listen(PORT, () => {
  console.log(`📚 文档管理系统API服务启动成功`);
  console.log(`🚀 服务地址: http://localhost:${PORT}`);
  console.log(`📖 API文档: http://localhost:${PORT}/api/health`);
  console.log(`🔑 API密钥: ${API_KEY}`);
  console.log(`📁 文档存储目录: ${DOCUMENTS_DIR}`);
});