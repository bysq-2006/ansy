<template>
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

  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import lottie from 'lottie-web';
import createInitialAnimation from '@/utils/Initial-animation';
import WheelAdsorption from '@/utils/wheel-adsorption'

const trapezoid = ref(null);
const trapezoidDeco = ref(null)
const Subheading = ref(null);
const lottieEl = ref(null);

onMounted(() => {
  const wa = new WheelAdsorption({
    points: [0, window.innerHeight, 2000], // 你的吸附点
    duration: 600,                // 动画时长（毫秒）
    easing: 'easeInOutCubic'      // 缓动类型，可选'linear'、'easeInCubic'、'easeOutCubic'等
  })
  window.addEventListener('scroll', trapezoidscroll)
  runInitialAnimations();
});

function trapezoidscroll() {
  const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
  const windowHeight = window.innerHeight;

  const progress = Math.min(scrollTop / windowHeight, 1);
  let width = 1800

  trapezoidDeco.value.style.clipPath = `polygon(-1000px 0, ${2267 - (2267 - width) * progress}px 0, ${1827 - (1827 - width) * progress}px 100%, -1000px 100%)`;
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
.lottieEl {
  height: 200px;
  margin-bottom: 100px;
}

.trapezoid {
  position: absolute;
  left: 0;
  width: 1100px;
  height: 100vh;
  background: linear-gradient(135deg, #ff9800 0%, #ffc966 100%);
  clip-path: polygon(0 0, 100% 0, 60% 100%, 0 100%);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.18);
}

.trapezoid-deco {
  position: fixed;
  left: 0;
  width: 2300px;
  height: 100vh;
  transform: translateX(-1200px);
  background: #fff34b;
  clip-path: polygon(-1000px 0, 2267px 0, 1827px 100%, -1000px 100%);
  z-index: 1;
}

.display {
  position: relative;
  height: 2000px;
  background: linear-gradient(180deg, #fff 0%, #f3f1f5 100%);
  z-index: -4;
  background: #0564b2;
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
</style>