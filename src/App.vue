<template>
  <div class="head">
    <div class="trapezoid"></div>
    <div class="left">
      <h1>ANSY</h1>
      <h2>活动页</h2>
    </div>
    <img src="/aisu.png" alt="" class="hero">
  </div>

  <div class="display">

  </div>
</template>

<script setup>
import { on } from 'events';
import { onMounted, onUnmounted, ref } from 'vue';



</script>

<style scoped>
.trapezoid {
  position: absolute;
  left: 0;
  width: 65vw;
  height: 100vh;
  background: linear-gradient(135deg, #fff34b 0%, #ffe066 100%);
  clip-path: polygon(0 0, 100% 0, 55% 100%, 0 100%);
}

.display {
  height: 2000px;
  background: linear-gradient(180deg, #fff 0%, #f3f1f5 100%);
}

.head {
  padding: 6.25vw;
  display: flex;
  align-items: center;
  height: 100vh;
  position: relative;
  overflow: hidden;
  transform: translateY(-50px);

  background: #0564b2;
}

.left,
h2,
img {
  user-select: none;
  -webkit-user-drag: none;
  color: #1f2998;
}

h1 {
  font-family: 'Baskerville Old Face', serif;
  font-size: clamp(80px, 20vw, 250px);
  user-select: none;
  -webkit-user-drag: none;
  margin: 0;
  line-height: 0.9;
  opacity: 0;
  transform: translateY(20px);
  animation: fadeSlideIn 800ms ease forwards;
}

h2 {
  font-family: 'Baskerville Old Face', serif;
  font-size: clamp(40px, 7vw, 100px);
  margin: 10px 0 0 0;
  opacity: 0;
  transform: translateY(12px);
  animation: fadeSlideIn 900ms ease forwards;
  animation-delay: 120ms;
}

/* 右侧大图 */
.hero {
  position: absolute;
  bottom: 0;
  right: -50px;
  width: 1200px;
  z-index: -1;
  pointer-events: none;
  opacity: 0;
  animation: imgSlideIn 900ms cubic-bezier(.2, .8, .2, 1) 260ms forwards;
  filter: drop-shadow(0 20px 40px rgb(255, 255, 255));
}

/* 确保文字在图片之上 */
.left {
  z-index: 2;
}

@keyframes fadeSlideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes imgSlideIn {
  from {
    opacity: 0
  }

  to {
    opacity: 1
  }
}

/* 响应式：小屏幕堆叠，图片不做绝对定位 */
@media (max-width: 900px) {
  .head {
    flex-direction: column;
    padding: 40px 24px;
    height: auto;
    transform: none;
  }

  .hero {
    position: static;
    width: 100%;
    margin-top: 24px;
    transform: none;
    opacity: 1;
    animation: none;
    filter: none;
  }

  h1 {
    text-align: center;
  }

  h2 {
    text-align: center;
  }
}
</style>