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
        content
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
        content
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
</style>