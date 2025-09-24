<template>
  <div class="vditor-container">
    <div class="top-bar">
      <p v-if="store.isedit" class="mode-edit">当前为修改模式，ID: {{ store.isedit }}</p>
      <p v-else class="mode-new">当前为新增模式</p>
      <div class="actions">
        <button class="action-btn" @click="handleSubmit" :disabled="submitting">{{ store.isedit ? (submitting ? '更新中...' : '保存修改') : (submitting ? '上传中...' : '上传文档') }}</button>
        <button class="action-btn secondary" @click="resetContent" :disabled="submitting">清空</button>
      </div>
    </div>
    <div class="meta-form">
      <label>
        标题：
        <input v-model="titleRef" placeholder="请输入标题" :disabled="submitting" />
      </label>
      <label>
        描述：
        <input v-model="descRef" placeholder="可选描述" :disabled="submitting" />
      </label>
      <label>
        封面链接：
        <input v-model="coverRef" placeholder="http(s)://..." :disabled="submitting" />
      </label>
      <label>
        预览：
        <div class="cover-preview" v-if="coverRef">
          <img :src="coverRef" @error="onCoverError" alt="封面预览" />
        </div>
        <span v-else class="placeholder">暂无</span>
      </label>
    </div>
    <div id="vditor"></div>
  </div>
</template>

<script setup name="add-md">
import Vditor from 'vditor'
import { onMounted, ref } from 'vue';
import 'vditor/dist/index.css'
import { documentService } from '@/services/api'
import { useDocumentTemplate } from '@/stores/document'
import { useRouter } from 'vue-router'

const vditor = ref(null)
const store = useDocumentTemplate()
const submitting = ref(false)
// 新建模式下临时标题/描述
const titleRef = ref('')
const descRef = ref('')
const router = useRouter()
const coverRef = ref('')
function onCoverError(e){ e.target.style.opacity = 0.3 }

onMounted(async () => {
  vditor.value = new Vditor('vditor', {
    height: 520,
    mode: 'sv',
    outline: true,
    toolbarConfig: { pin: true },
    upload: {
      url: 'http://localhost:3001/api/upload',
      fieldName: 'file[]',
      multiple: true,
      accept: 'image/*'
    },
    toolbar: [
      'emoji', 'headings', 'bold', 'italic', 'strike', '|', 'quote', 'list', 'ordered-list', 'check',
      'outdent', 'indent', 'code', 'inline-code', 'upload', 'link', '|', 'table', 'edit-mode', 'both', 'preview', 'fullscreen', 'outline', 'export', 'br'
    ],
    after: async () => {
      // 如果是编辑模式，加载原内容
      if (store.isedit) {
        try {
          const res = await documentService.getDocument(store.isedit)
          const data = res.data || res
          vditor.value.setValue(data.content || '')
          titleRef.value = data.title || ''
          descRef.value = data.description || ''
          coverRef.value = data.coverUrl || data.imageUrl || ''
        } catch (e) {
          console.error('加载原文档失败', e)
          vditor.value.setValue('')
        }
      } else {
        vditor.value.setValue('')
      }
    }
  })
})

async function handleSubmit() {
  const content = vditor.value?.getValue() || ''
  if (!content.trim()) {
    return alert('内容不能为空')
  }
  submitting.value = true
  try {
    if (store.isedit) {
      // 更新模式
      await documentService.updateDocument(store.isedit, {
        title: titleRef.value || '未命名文档',
        description: descRef.value || '',
        content,
        coverUrl: coverRef.value
      })
      alert('更新成功')
    } else {
      // 新建模式需要标题/描述
      if (!titleRef.value) {
        const t = window.prompt('请输入标题：')
        if (!t) { submitting.value = false; return }
        titleRef.value = t
      }
      if (!descRef.value) {
        const d = window.prompt('请输入描述（可留空）：')
        if (d !== null) descRef.value = d
      }
      await documentService.createDocument({
        title: titleRef.value,
        description: descRef.value,
        content,
        coverUrl: coverRef.value
      })
      alert('上传成功')
    }
    // 成功后返回列表
    router.push('/management')
  } catch (e) {
    console.error(e)
    alert('操作失败：' + (e.message || '未知错误'))
  } finally {
    submitting.value = false
  }
}

function resetContent() {
  if (confirm('确定要清空内容吗？')) {
    vditor.value?.setValue('')
    if (!store.isedit) {
      titleRef.value = ''
      descRef.value = ''
    }
  }
}
</script>

<style scoped>
.vditor-container {
  width: 100%;
  margin: 0 auto;
}

#vditor {
  min-height: 100vh;
}
 .meta-form {
   display: grid;
   grid-template-columns: repeat(auto-fit,minmax(240px,1fr));
   gap: 16px;
   margin: 12px 0 24px;
   background: rgba(255,255,255,0.05);
   padding: 16px 20px;
   border-radius: 12px;
   backdrop-filter: blur(4px);
 }
 .meta-form label {
   display: flex;
   flex-direction: column;
   font-size: 14px;
   /* 原来是 #eee (白色系)，在浅色背景下不清晰，调整为深色 */
   color: #222;
   gap: 6px;
 }
 .meta-form input {
   /* 改为浅色输入框样式 */
   background: #fff;
   border: 1px solid #d0d5d9;
   padding: 6px 10px;
   border-radius: 6px;
   color: #222;
   outline: none;
   font-size: 14px;
   transition: border-color .2s, box-shadow .2s;
 }
 .meta-form input:focus {
   border-color: #1677ff;
   box-shadow: 0 0 0 2px rgba(22,119,255,0.25);
 }
 .cover-preview {
   width: 100%;
   aspect-ratio: 16 / 9;
   background: #f2f3f5;
   border: 1px solid #e2e5e8;
   border-radius: 8px;
   overflow: hidden;
   display: flex;
   align-items: center;
   justify-content: center;
 }
 .cover-preview img {
   width: 100%;
   height: 100%;
   object-fit: cover;
 }
 .placeholder { color: #888; font-size:12px; }

/* 如果你希望根据深浅主题自动切换，可以加一个简单的暗色模式覆盖 */
@media (prefers-color-scheme: dark) {
  .meta-form label { color: #eee; }
  .meta-form input {
    background: rgba(255,255,255,0.12);
    border: 1px solid rgba(255,255,255,0.25);
    color: #fff;
  }
  .meta-form input:focus {
    border-color: #5fb4ff;
    box-shadow: 0 0 0 2px rgba(95,180,255,0.3);
  }
  .cover-preview { background:#222; border:1px solid rgba(255,255,255,0.18); }
}
</style>