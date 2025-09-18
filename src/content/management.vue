<template>
  {{ data }}
</template>

<script setup name="management">
import { onMounted, ref } from 'vue';
import { documentService } from '@/services/api'
const data = ref(null);

onMounted(async () => {
  data.value = await documentService.getDocuments();
  console.log(data.value);

  await documentService.createDocument({
    title: '标题',
    content: '# markdown内容',
    description: '描述'
  })
});
</script>

<style scoped></style>