// API基础配置和文档管理服务
import axios from 'axios'

// 创建axios实例
const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// API密钥（在生产环境中应该从环境变量获取）
const API_KEY = '123'

// 请求拦截器 - 为需要认证的请求添加API密钥
api.interceptors.request.use(
  (config) => {
    // 如果是需要认证的请求（POST, PUT, DELETE），添加API密钥
    if (['post', 'put', 'delete'].includes(config.method?.toLowerCase())) {
      config.headers['X-API-Key'] = API_KEY
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器 - 统一处理错误
api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    const errorMessage = error.response?.data?.message || error.message || '网络请求失败'
    console.error('API请求错误:', errorMessage)
    return Promise.reject(new Error(errorMessage))
  }
)

// 文档管理API服务
export const documentService = {
  // 获取文档列表（公开接口）
  async getDocuments() {
    return api.get('/documents')
  },

  // 获取文档内容（公开接口）
  async getDocument(id) {
    return api.get(`/documents/${id}`)
  },

  // 上传新文档（需要密钥）
  async createDocument(documentData) {
    const { title, content, description = '' } = documentData
    return api.post('/documents', {
      title: title.trim(),
      content,
      description: description.trim()
    })
  },

  // 更新文档（需要密钥）
  async updateDocument(id, documentData) {
    const updates = {}
    if (documentData.title !== undefined) updates.title = documentData.title.trim()
    if (documentData.content !== undefined) updates.content = documentData.content
    if (documentData.description !== undefined) updates.description = documentData.description.trim()
    
    return api.put(`/documents/${id}`, updates)
  },

  // 删除文档（需要密钥）
  async deleteDocument(id) {
    return api.delete(`/documents/${id}`)
  },

  // 健康检查
  async checkHealth() {
    return api.get('/health')
  }
}

// 导出API实例供其他地方使用
export default api