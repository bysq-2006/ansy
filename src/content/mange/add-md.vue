<template>
  <div class="vditor-container">
    <div id="vditor"></div>
  </div>
</template>

<script setup name="add-md">
import Vditor from 'vditor'
import { onMounted, ref } from 'vue';
import 'vditor/dist/index.css'
import { documentService } from '@/services/api'

const vditor = ref(null)

onMounted(async () => {
  vditor.value = new Vditor('vditor', {
    height: 360,
    mode: 'sv',
    toolbarConfig: {
      pin: true,
    },
    after: () => {
      vditor.value.setValue('hello, Vditor + Vue!')
    },
    toolbar: [
      'emoji', 'headings', 'bold', 'italic', 'strike', '|', 'line', 'quote', 'list', 'ordered-list', 'check',
      'outdent', 'indent', 'code', 'inline-code', 'insert-after', 'insert-before', 'undo', 'redo', 'upload',
      'link', 'table', 'edit-mode', 'both', 'preview', 'fullscreen', 'outline', 'export', 'devtools', 'br',
      {
        name: 'sponsor',
        tipPosition: 's',
        tip: '上传该文档',
        className: 'right',
        icon: '<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg t="1758264962751" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="5422" xmlns:xlink="http://www.w3.org/1999/xlink" width="32" height="32"><path d="M160 224 240 128 784 128 864 224 160 224ZM640 672 640 800 384 800 384 672 192 672 490.016 361.408C502.144 348.736 521.92 348.768 533.984 361.344L832 672 640 672ZM942.208 229.312 849.792 90.688C840 76 817.792 64 800.256 64L223.744 64C206.56 64 184.032 75.968 174.208 90.688L81.792 229.312C72 244 64 270.368 64 288.064L64 896.288C64 931.52 92.544 960 127.712 960L896.288 960C931.2 960 960 931.488 960 896.288L960 288.064C960 270.048 952.032 244.032 942.208 229.312" p-id="5423"></path></svg>',
        click() {
          upload(
            '标题',
            vditor.value.getValue(),
            '描述'
          ).then(() => {
          })
        },
      }],
    upload: {
      url: 'http://localhost:3001/api/upload',
      fieldName: 'file[]',
      multiple: true,
      accept: 'image/*'
    }
  })
})

async function upload(title, content, description) {
  const titleInput = window.prompt('请输入标题：');
  if (!titleInput) {
    return;
  }
  title = titleInput;
  await documentService.createDocument({
    title: title,
    content: content,
    description: description
  })
  alert('上传成功')
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