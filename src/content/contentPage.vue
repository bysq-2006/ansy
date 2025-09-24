<template>
	<div class="content-page">
    <h1 v-if="state.status==='loaded'"> {{ state.title }} </h1>
		<div class="inner" v-if="state.status==='loaded'" v-html="state.html"></div>
		<div v-else class="state">
			<template v-if="state.status==='loading'">加载中...</template>
			<template v-else-if="state.status==='error'">获取文档失败：{{ state.error }}</template>
			<template v-else-if="state.status==='empty'">未找到文档</template>
		</div>
	</div>
</template>

<script setup lang="ts" name="ContentPage">
import { onMounted, reactive, watch } from 'vue'
import { useRoute } from 'vue-router'
import { documentService } from '@/services/api'

interface State {
	status: 'loading' | 'error' | 'loaded' | 'empty'
  title: string
	html: string
	error: string
}

const route = useRoute()
const state = reactive<State>({
	status: 'loading',
  title: '',
	html: '',
	error: ''
})

async function load(id: string | undefined) {
	if (!id) {
		state.status = 'empty'
    state.title = ''
		state.html = ''
		return
	}
	state.status = 'loading'
  state.title = ''
	state.error = ''
	state.html = ''
	try {
		const res: any = await documentService.getDocument(id)
		if (!res?.success || !res?.data?.content) {
			state.status = 'empty'
			return
		}
		// 动态加载 markdown 解析库，避免首屏体积变大
		const { marked } = await import('marked')
		const raw = res.data.content as string
    const title = res.data.title as string
		// 设置一些基础选项（可按需扩展）
		marked.setOptions({
			breaks: true
		})
		const parsed = marked.parse(raw)
    state.title = title
		state.html = typeof parsed === 'string' ? parsed : ''
		state.status = 'loaded'
	} catch (e: any) {
		state.status = 'error'
		state.error = e?.message || '未知错误'
	}
}

onMounted(() => {
	load(route.params.id as string | undefined)
})

watch(() => route.params.id, (id) => {
	load(id as string | undefined)
})
</script>

<style scoped>
.content-page {
	min-height: 100vh;
	background: #083565;
	display: flex;
	justify-content: center;
	box-sizing: border-box;
	color: #fff;
	overflow-y: auto;
}
.inner {
  padding: 48px 56px;
	width: 60%;
  height: 100vh;
	background: #fff;
	box-shadow: 0 8px 24px rgba(0,0,0,0.13);
	line-height: 1.65;
	font-size: 16px;
	color: #222;
	word-break: break-word;
}
.inner :deep(h1),
.inner :deep(h2),
.inner :deep(h3),
.inner :deep(h4) {
	color: #fff;
	font-weight: 600;
	line-height: 1.3;
	margin: 1.6em 0 .8em;
}
.inner :deep(h1){ font-size: 2.2em; }
.inner :deep(h2){ font-size: 1.8em; }
.inner :deep(h3){ font-size: 1.4em; }
.inner :deep(a){ color:#5fb4ff; text-decoration:none; }
.inner :deep(a:hover){ text-decoration:underline; }
.inner :deep(code){ background:rgba(0,0,0,.35); padding:2px 6px; border-radius:4px; font-family: ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace; }
.inner :deep(pre){ background:rgba(0,0,0,.55); padding:18px 20px; border-radius:10px; overflow:auto; }
.inner :deep(pre code){ background:unset; padding:0; }
.inner :deep(img){ max-width:100%; display:block; margin:16px auto; border-radius:10px; }
.inner :deep(blockquote){ border-left:4px solid #5fb4ff; margin:1.2em 0; padding:.6em 1em; background:rgba(95,180,255,0.08); }
.inner :deep(ul), .inner :deep(ol){ padding-left:1.4em; }
.state { color:#fff; font-size:18px; display:flex; align-items:center; justify-content:center; min-height:300px; }
</style>