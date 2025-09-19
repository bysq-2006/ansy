<template>
  <div class="total">
    <!-- #083565 -->
    <div class="head">
      <div class="trapezoid" ref="trapezoid"></div>
      <div class="trapezoid-deco" ref="trapezoidDeco"></div>
      <div class="left">
        <div ref="lottieEl" class="lottieEl"></div>
        <h2 ref="Subheading">活动页</h2>
      </div>
      <img src="/aisu.png" alt="" class="hero">
    </div>

    <div class="display">
      <div v-for="value in activitylist" class="activity" :key="value.id">
        <div class="box"></div>
        <div class="text">
          {{ value.title }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup name="Activity">
import { onMounted, ref } from 'vue';
import { documentService } from '@/services/api'
import lottie from 'lottie-web';
import { gsap } from "gsap";
import createInitialAnimation from '@/utils/Initial-animation';

const trapezoid = ref(null);
const trapezoidDeco = ref(null)
const Subheading = ref(null);
const lottieEl = ref(null);

const activitylist = ref(null)

onMounted(async () => {
  activitylist.value = (await documentService.getDocuments()).data
  runInitialAnimations();
  window.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('scroll', onScroll, { passive: true });
});

function onScroll() {
  // 只在活动页状态下吸附
  if (inActivity) {
    const min = window.innerWidth / 2;
    const max = window.innerWidth;
    if (window.scrollX > min && window.scrollX < max) {
      // 平滑吸附到活动页
      window.scrollTo({ left: window.innerWidth, behavior: 'smooth' });
      targetScrollLeft = window.innerWidth;
    }
  }
}

// 状态：是否已进入活动页
let inActivity = false;
// 防抖：动画进行中
let busy = false;
// 平滑滚动相关
let targetScrollLeft = 0;
let animating = false;

function onWheel(e) {
  e.preventDefault();
  if (busy) return;
  const delta = e.deltaY;
  // 进入
  if (!inActivity && delta > 1 && window.scrollX < window.innerWidth / 2) {
    busy = true;
    playEnterActivity(() => { busy = false; inActivity = true; });
    return;
  }
  // 返回
  if (inActivity && delta < -1 && window.scrollX > window.innerWidth - 100 && window.scrollX < window.innerWidth + 10) {
    busy = true;
    playBackToHead(() => { busy = false; inActivity = false; });
    return;
  }
  // 普通平滑横向滚动
  targetScrollLeft += delta;
  const max = document.documentElement.scrollWidth - window.innerWidth;
  if (targetScrollLeft < 0) targetScrollLeft = 0;
  else if (targetScrollLeft > max) targetScrollLeft = max;
  if (!animating) {
    animating = true;
    requestAnimationFrame(animateScroll);
  }
}

// 平滑滚动动画函数
function animateScroll() {
  const current = window.scrollX;
  const diff = targetScrollLeft - current;
  // 差值很小就结束
  if (Math.abs(diff) < 0.5) {
    window.scrollTo({ left: targetScrollLeft });
    animating = false;
    return;
  }
  // 采用缓动比例（指数逼近），0.15~0.25 可调
  const step = diff * 0.12; // 调整速度/阻尼
  window.scrollTo({ left: current + step });
  requestAnimationFrame(animateScroll);
}

function playEnterActivity(done) {
  let switched = false;
  gsap.to([trapezoidDeco.value], {
    x: 1800,
    duration: 1,
    ease: 'power2.inOut',
    onUpdate: () => {
      if (!switched) {
        const x = gsap.getProperty(trapezoidDeco.value, 'x');
        if (x >= 0) {
          switched = true;
          window.scrollTo({ left: window.innerWidth });
          targetScrollLeft = window.innerWidth; // 同步目标
        }
      }
    },
    onComplete: () => { done && done(); }
  });
  gsap.to([lottieEl.value, Subheading.value], {
    x: -1200,
    duration: 1,
    ease: 'power2.inOut'
  });
}

function playBackToHead(done) {
  let switched = false;
  gsap.to([trapezoidDeco.value], {
    x: -1200,
    duration: 1,
    ease: 'power2.inOut',
    onUpdate: () => {
      if (!switched) {
        const x = gsap.getProperty(trapezoidDeco.value, 'x');
        if (x <= 0) {
          switched = true;
          window.scrollTo({ left: 0 });
          targetScrollLeft = 0; // 同步目标
        }
      }
    },
    onComplete: () => { done && done(); }
  });
  gsap.to([lottieEl.value, Subheading.value], {
    x: 0,
    duration: 1,
    ease: 'power2.inOut'
  });
}


function runInitialAnimations() {
  const animTrapezoid = createInitialAnimation([trapezoidDeco.value, trapezoid.value], { translate: { x: 1200, y: 0 } });
  const animSubheading = createInitialAnimation(Subheading.value, { translate: { x: -600, y: 0 } });
  const animLottie = createInitialAnimation(lottieEl.value, { translate: { x: 0.22 * window.innerWidth, y: 0 } });
  let aeANSY = null;

  animTrapezoid.init();
  animSubheading.init();
  animLottie.init();

  setTimeout(() => {
    aeANSY = lottie.loadAnimation({
      container: lottieEl.value,
      renderer: 'svg',
      loop: false,
      autoplay: true,
      path: '/ANSY.json'
    });

    aeANSY.addEventListener('DOMLoaded', () => {
      setTimeout(() => {
        animSubheading.play(1, 'easeOutCubic');
        animTrapezoid.play(1, 'easeOutCubic', { stagger: 0.2 });
        animLottie.play(1, 'easeOutCubic');
      }, 1300);
    });
  }, 600);
}
</script>

<style scoped>
.display .box {
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 16px;
  margin: 24px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  width: 300px;
  height: 500px;
}

.display .text {
  color: white;
  text-align: center;
  font-family: 'Baskerville Old Face', serif;
  font-size: 1.4em;

  margin-top: 100px;
}

.display {
  display: flex;
  align-items: center;

  box-sizing: border-box;
  flex-shrink: 0;
  /* 关键：不允许被压缩 */
  padding: 24px;
  min-width: 100vw;
  background-color: #083565;
}

.lottieEl {
  height: 200px;
  margin-bottom: 100px;
}

.trapezoid {
  position: absolute;
  left: 0;
  width: 1100px;
  height: 100vh;
  background: #f7eb48;
  clip-path: polygon(0 0, 100% 0, 60% 100%, 0 100%);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.18);
  z-index: 1;
}

.trapezoid-deco {
  position: fixed;
  left: 0;
  width: 2300px;
  height: 100vh;
  transform: translateX(-1200px);
  background: #fff34b;
  clip-path: polygon(-1000px 0, 2287px 0, 1847px 100%, -1000px 100%);
  z-index: 1;
}

.head {
  min-width: 100vw;
  padding: 6.25vw;
  display: flex;
  align-items: center;
  height: 100vh;
  position: relative;
  overflow: hidden;
  z-index: 0;
  background: #0564b2;
}

.left {
  user-select: none;
  -webkit-user-drag: none;
  color: #1f2998;
  opacity: 1;
  z-index: 2;
}

h2 {
  font-family: 'Baskerville Old Face', serif;
  font-size: clamp(40px, 7vw, 100px);
  margin: 10px 0 0 0;
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

.total {
  display: flex;
}

.head {
  pointer-events: none;
  /* 禁用所有子元素的鼠标事件 */
}
</style>

<style>
html {
  margin: 0;
  height: 100%;
  overflow: auto;
  /* 允许滚动 */
  scrollbar-width: none;
  /* Firefox */
  -ms-overflow-style: none;
  /* IE / Edge */
}

html::-webkit-scrollbar {
  scrollbar-width: none;
  /* Chrome / Safari / Edge(Chromium) */
}
</style>