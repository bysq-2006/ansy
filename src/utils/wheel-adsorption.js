// 基础滚轮吸附类，支持吸附点列表和缓动动画
class WheelAdsorption {
  constructor({
    container = window,
    points = [],
    duration = 600,
    easing = 'easeInOutCubic',
  } = {}) {
    this.container = container;
    this.points = Array.from(points).sort((a, b) => a - b);
    this.duration = duration;
    this.easing = easing;
    this.animating = false;
    this.tolerance = 3; // 容忍区间（像素），可通过实例修改
    this._onWheel = this._onWheel.bind(this);
    this.container.addEventListener('wheel', this._onWheel, { passive: false });
  }

  // 常用缓动函数
  static easings = {
    linear: t => t,
    easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
    easeOutCubic: t => 1 - Math.pow(1 - t, 3),
    easeInCubic: t => t * t * t,
  };

  _onWheel(e) {
    if (this.animating || this.points.length === 0) return;
    e.preventDefault();
    const current = this._getScroll();
    const dir = e.deltaY > 0 ? 1 : -1;
    let next;
    if (dir > 0) {
      // 向下，允许容忍区间
      next = this.points.find(p => p > current + this.tolerance) ?? this.points[this.points.length - 1];
    } else {
      for (let i = this.points.length - 1; i >= 0; i--) {
        // 向上，允许容忍区间
        if (this.points[i] < current - this.tolerance) {
          next = this.points[i];
          break;
        }
      }
      if (next === undefined) next = this.points[0];
    }
    if (next !== undefined && Math.abs(next - current) > this.tolerance) {
      this._scrollTo(next);
    }
  }

  _getScroll() {
    if (this.container === window) {
      return window.scrollY || document.documentElement.scrollTop;
    } else {
      return this.container.scrollTop;
    }
  }

  _setScroll(val) {
    if (this.container === window) {
      window.scrollTo(0, val);
    } else {
      this.container.scrollTop = val;
    }
  }

  _scrollTo(target) {
    const start = this._getScroll();
    const change = target - start;
    const startTime = performance.now();
    const ease = WheelAdsorption.easings[this.easing] || WheelAdsorption.easings.easeInOutCubic;
    this.animating = true;
    const animate = now => {
      const t = Math.min(1, (now - startTime) / this.duration);
      this._setScroll(start + change * ease(t));
      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        this._setScroll(target); // 确保精确到达目标位置
        this.animating = false;
      }
    };
    requestAnimationFrame(animate);
  }

  destroy() {
    this.container.removeEventListener('wheel', this._onWheel);
  }
}

export default WheelAdsorption;
