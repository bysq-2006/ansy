import { ref, watch } from 'vue'
import { defineStore } from 'pinia'

// 文档/认证相关的全局store
export const useDocumentStore = defineStore('document', () => {
  // 读取本地存储中的 key（如存在）
  const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('ANSY_API_KEY') : ''
  const apikey = ref(stored || '')
  const isedit = ref(null as string | null) // 当前正在编辑的文档ID

  // 持久化
  watch(apikey, (val) => {
    try { localStorage.setItem('ANSY_API_KEY', val || '') } catch (e) { }
  })

  function setApiKey(key: string) {
    apikey.value = key.trim()
  }

  return { apikey, setApiKey, isedit }
})

// 兼容旧名称，避免其它地方已引用 useDocumentTemplate
export function useDocumentTemplate() {
  return useDocumentStore()
}