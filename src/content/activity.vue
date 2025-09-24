<template>
  <div class="total">
    <!-- 在手机端隐藏 head：最小侵入式改动 -->
    <div class="head" v-if="!isMobile">
      <div class="trapezoid" ref="trapezoid"></div>
      <div class="trapezoid-deco" ref="trapezoidDeco"></div>
      <div class="left">
        <div ref="lottieEl" class="lottieEl"></div>
        <h2 ref="Subheading">活动页</h2>
      </div>
      <img src="/aisu.png" alt="" class="hero">
    </div>

    <div class="display">
      <template v-if="activitylist && activitylist.length">
        <div v-for="value in activitylist" class="activity" :key="value.id">
          <div class="box" @click="toweb(value.id)">
            <img :src="value.coverUrl" alt="" class="cover">
            <h3>
              {{ value.title }}
            </h3>
            <p>
              {{ value.description }}
            </p>
            <svg width="300" height="500" viewBox="0 0 300 500" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="
                M 0 200
                Q 0 250 50 250
                L 250 250
                Q 300 250 300 300
                L 300 500
                L 0 500
                Z
              " fill="#ffffff" fill-opacity="0.9"/>
            </svg>
          </div>
          <div class="text">
            {{ new Date(value.createdAt).toLocaleString() }}
          </div>
        </div>
      </template>
      <div v-else class="empty-tip">{{ loading ? '加载中…' : (errorMsg || '暂无活动') }}</div>
    </div>
  </div>
</template>

<script setup name="Activity">
import { onMounted, onBeforeUnmount, ref } from 'vue';
import { documentService } from '@/services/api'
import lottie from 'lottie-web';
import { gsap } from "gsap";
import createInitialAnimation from '@/utils/Initial-animation';
import { useRouter } from 'vue-router'

const router = useRouter()
const trapezoid = ref(null);
const trapezoidDeco = ref(null)
const Subheading = ref(null);
const lottieEl = ref(null);

const activitylist = ref([])
const loading = ref(true)
const errorMsg = ref('')
// 移动端标记
const isMobile = ref(false)

onMounted(async () => {
  // 基础检测：宽度 + UA，保持最小风险
  isMobile.value = (window.innerWidth <= 768) || /Mobile|Android|iP(hone|od|ad)/i.test(navigator.userAgent);
  try {
    const res = await documentService.getDocuments();
    activitylist.value = res?.data || [];
  } catch (e) {
    console.error('[activity] 获取活动列表失败:', e);
    errorMsg.value = '加载失败';
  } finally {
    loading.value = false;
  }
  if (isMobile.value) {
    document.querySelector('.display').style.zIndex = '3';
    // 手机端：不执行初始动画 / 监听，交互保持纵向滚动
    return;
  }
  runInitialAnimations();
  window.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('scroll', onScroll, { passive: true });
});

onBeforeUnmount(() => {
  if (!isMobile.value) {
    window.removeEventListener('wheel', onWheel, { passive: false });
    window.removeEventListener('scroll', onScroll, { passive: true });
  }
});

function toweb(id) {
  // 使用 vue-router 跳转到指定文档页面
  const routeData = router.resolve({ name: 'ContentPage', params: { id } });
  window.open(routeData.href, '_blank');
}

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
.activity .cover {
  position: absolute;
  height: 100%;
  top: 0;
  left: 0;
  object-fit: cover;
  z-index: 0;
}

.activity .box h3 {
  position: relative;
  font-size: 2em;
  font-weight: bold;
  color: #0b4380;
  margin-bottom: 16px;
  font-family: 'Baskerville Old Face', serif;
  letter-spacing: 1px;
  z-index: 2;
}

.activity .box p {
  position: relative;
  font-size: 1.15em;
  color: #333;
  line-height: 1.7;
  margin-bottom: 0;
  font-family: 'Segoe UI', 'Arial', sans-serif;
  max-width: 260px;
  word-break: break-all;
  white-space: normal;
  z-index: 2;
}

.activity .box svg {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  z-index: 1;
}

.activity .box {
  position: relative;
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  border-radius: 8px;
  margin: 24px;
  overflow: hidden;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
  padding-top: 270px;
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1);

  width: 300px;
  height: 500px;
}

.activity .box:hover {
  cursor: pointer;
  transform: translateY(-18px);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.18), 0 2px 8px rgba(0, 0, 0, 0.10);
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.activity .text {
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
  /* 原为 -1，会在隐藏 head 后在某些移动端被放到点击层级后面，导致无法触发点击 */
  z-index: -1;
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