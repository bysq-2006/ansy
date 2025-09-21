<template>
  <div class="management-container">
    <!-- 顶部添加按钮 -->
    <div class="header">
      <h2>文档管理</h2>
      <button class="add-btn" @click="navigateToAdd">
        <span class="icon">+</span>
        新增文档
      </button>
    </div>

    <div class="apikey-input" style="margin-bottom: 24px;">
      <label style="font-weight: 500; color: #333; margin-right: 12px;">API Key:</label>
      <input v-model="docStore.apikey" type="text" class="form-input" style="max-width: 350px;"
        placeholder="请输入 API Key" />
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading">
      加载中...
    </div>

    <!-- 空状态 -->
    <div v-else-if="!documents || documents.length === 0" class="empty-state">
      <p>暂无文档，点击上方按钮开始创建你的第一个文档吧！</p>
    </div>

    <!-- 文档列表 -->
    <div v-else class="document-list">
      <div v-for="doc in documents" :key="doc.id" class="document-item">
        <div class="document-info">
          <h3 class="document-title">{{ doc.title }}</h3>
          <p class="document-description">{{ doc.description || '无描述' }}</p>
          <div class="document-meta">
            <span class="meta-item">创建时间: {{ formatDate(doc.createdAt) }}</span>
            <span class="meta-item">更新时间: {{ formatDate(doc.updatedAt) }}</span>
            <span class="meta-item">大小: {{ formatSize(doc.size) }}</span>
          </div>
        </div>
        <div class="document-actions">
          <button class="edit-btn" @click="editDocument(doc)" title="编辑">
            <span class="icon">✏️</span>
            修改
          </button>
          <button class="delete-btn" @click="deleteDocument(doc)" title="删除">
            <span class="icon">🗑️</span>
            删除
          </button>
        </div>
      </div>
    </div>

    <!-- 编辑弹窗 -->
    <div v-if="showEditModal" class="modal-overlay" @click="closeEditModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>编辑文档</h3>
          <button class="close-btn" @click="closeEditModal">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>标题:</label>
            <input v-model="editingDoc.title" type="text" class="form-input" placeholder="请输入文档标题">
          </div>
          <div class="form-group">
            <label>图片路径:</label>
            <input v-model="editingDoc.description" type="text" class="form-input" placeholder="请输入文档描述">
          </div>
          <div class="form-group">
            <button @click="navigateToedit">修改文档</button>
          </div>
        </div>
        <div class="modal-footer">
          <button class="cancel-btn" @click="closeEditModal">取消</button>
          <button class="save-btn" @click="saveDocument">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup name="management">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { documentService } from '@/services/api'
import { useDocumentTemplate } from '@/stores/document'

const router = useRouter();
const documents = ref([]);
const loading = ref(true);
const showEditModal = ref(false);
const editingDoc = ref({});
const docStore = useDocumentTemplate()

// 获取文档列表
const loadDocuments = async () => {
  try {
    loading.value = true;
    const response = await documentService.getDocuments();
    // 后端返回格式：{ success: true, data: [...] }
    documents.value = response.data || response || [];
  } catch (error) {
    console.error('获取文档列表失败:', error);
    alert('获取文档列表失败，请稍后重试');
  } finally {
    loading.value = false;
  }
};

// 跳转到添加页面
const navigateToAdd = () => {
  useDocumentTemplate().isedit = null
  router.push('/management/add-md');
};

const navigateToedit = () => {
  useDocumentTemplate().isedit = editingDoc.value.id
  router.push('/management/add-md');
};

// 编辑文档
const editDocument = (doc) => {
  editingDoc.value = {
    id: doc.id,
    title: doc.title,
    description: doc.description || ''
  };
  showEditModal.value = true;
};

// 保存文档
const saveDocument = async () => {
  if (!editingDoc.value.title.trim()) {
    alert('请输入文档标题');
    return;
  }

  try {
    await documentService.updateDocument(editingDoc.value.id, {
      title: editingDoc.value.title,
      description: editingDoc.value.description
    });

    // 更新本地数据
    const index = documents.value.findIndex(doc => doc.id === editingDoc.value.id);
    if (index !== -1) {
      documents.value[index].title = editingDoc.value.title;
      documents.value[index].description = editingDoc.value.description;
      documents.value[index].updatedAt = new Date().toISOString();
    }

    closeEditModal();
    alert('保存成功');
  } catch (error) {
    console.error('保存失败:', error);
    alert('保存失败，请稍后重试');
  }
};

// 关闭编辑弹窗
const closeEditModal = () => {
  showEditModal.value = false;
  editingDoc.value = {};
};

// 删除文档
const deleteDocument = async (doc) => {
  if (!confirm(`确定要删除文档"${doc.title}"吗？此操作不可恢复。`)) {
    return;
  }

  try {
    await documentService.deleteDocument(doc.id);
    documents.value = documents.value.filter(d => d.id !== doc.id);
    alert('删除成功');
  } catch (error) {
    console.error('删除失败:', error);
    alert('删除失败，请稍后重试');
  }
};

// 格式化日期
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 格式化文件大小
const formatSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

onMounted(() => {
  loadDocuments();
});
</script>

<style scoped>
.management-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #f0f0f0;
}

.header h2 {
  color: #333;
  font-size: 28px;
  margin: 0;
}

.add-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.add-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.add-btn .icon {
  font-size: 18px;
  font-weight: bold;
}

.loading {
  text-align: center;
  padding: 60px 0;
  font-size: 18px;
  color: #666;
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
  color: #999;
}

.empty-state p {
  font-size: 18px;
  margin: 0;
}

.document-list {
  display: grid;
  gap: 20px;
}

.document-item {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.document-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  border-color: #667eea;
}

.document-info {
  flex: 1;
  margin-right: 20px;
}

.document-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #333;
}

.document-description {
  font-size: 14px;
  color: #666;
  margin: 0 0 12px 0;
  line-height: 1.5;
}

.document-meta {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.meta-item {
  font-size: 12px;
  color: #999;
  background: #f8f9fa;
  padding: 4px 8px;
  border-radius: 4px;
}

.document-actions {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
}

.edit-btn,
.delete-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.edit-btn {
  background: #e3f2fd;
  color: #1976d2;
}

.edit-btn:hover {
  background: #bbdefb;
}

.delete-btn {
  background: #ffebee;
  color: #d32f2f;
}

.delete-btn:hover {
  background: #ffcdd2;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h3 {
  margin: 0;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #333;
}

.modal-body {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.form-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s ease;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid #e0e0e0;
}

.cancel-btn,
.save-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cancel-btn {
  background: #f5f5f5;
  color: #666;
}

.cancel-btn:hover {
  background: #e0e0e0;
}

.save-btn {
  background: #667eea;
  color: white;
}

.save-btn:hover {
  background: #5a6fd8;
}

@media (max-width: 768px) {
  .management-container {
    padding: 15px;
  }

  .header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }

  .document-item {
    flex-direction: column;
    gap: 20px;
  }

  .document-actions {
    justify-content: flex-start;
  }

  .document-meta {
    flex-direction: column;
    gap: 8px;
  }
}
</style>