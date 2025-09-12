<template>
  <div class="head">
    <div class="trapezoid" ref="trapezoid"></div>
    <div class="trapezoid-deco"></div>
    <div class="left">
      <h1>ANSY</h1>
      <h2 ref="Subheading">活动页</h2>
    </div>
    <img src="/aisu.png" alt="" class="hero">
  </div>

  <div class="display">

  </div>
</template>

<script setup>
import { on } from 'events';
import { onMounted, onUnmounted, ref } from 'vue';
import createInitialAnimation, { runInitialAnimation } from '@/utils/Initial-animation';
const trapezoid = ref(null);
const Subheading = ref(null);

onMounted(() => {
  const animTrapezoid = createInitialAnimation(trapezoid.value, { translate: { x: 1200, y: 0 } });
  const animSubheading = createInitialAnimation(Subheading.value, { translate: { x: -600, y: 0 }});
  animTrapezoid.init();
  animSubheading.init();
  // 你可以后续调用 animTrapezoid.play() 实现入场动画
  setTimeout(() => {
    animSubheading.play(1, 'easeOutCubic');
    animTrapezoid.play(1, 'easeOutCubic');
  }, 3000);
});
</script>

<style scoped>
.trapezoid {
  position: absolute;
  left: 0;
  width: 66vw;
  height: 100vh;
  background: linear-gradient(135deg, #ff9800 0%, #ffc966 100%);
  clip-path: polygon(0 0, 100% 0, 55% 100%, 0 100%);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.18);
}

.trapezoid-deco {
  position: absolute;
  left: 200;
  width: 66vw;
  height: 100vh;
  background: #fff34b;
  clip-path: polygon(0 0, 97% 0, 52% 100%, 0 100%);
  pointer-events: none;
  z-index: 2;
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
  z-index: -2;
  background: #0564b2;
}

.left,
h2 {
  user-select: none;
  -webkit-user-drag: none;
  color: #1f2998;
  opacity: 1;
}

h1 {
  font-family: 'Baskerville Old Face', serif;
  font-size: clamp(80px, 20vw, 250px);
}

h2 {
  font-family: 'Baskerville Old Face', serif;
  font-size: clamp(40px, 7vw, 100px);
  margin: 10px 0 0 0;
}

.left {
  z-index: 2;
}

/* 右侧大图 */
.hero {
  user-select: none;
  -webkit-user-drag: none;
  position: absolute;
  bottom: 0;
  right: -50px;
  width: 1200px;
  z-index: -1;
  pointer-events: none;
  opacity: 1;
  filter: drop-shadow(0 20px 40px rgb(255, 255, 255));
}
</style>