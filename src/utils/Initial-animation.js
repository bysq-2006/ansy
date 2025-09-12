// 内置缓动函数集合（0-1 -> 0-1）
const Easings = {
	linear: t => t,
	easeInQuad: t => t * t,
	easeOutQuad: t => t * (2 - t),
	easeInOutQuad: t => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
	easeOutCubic: t => (--t) * t * t + 1,
	easeInCubic: t => t * t * t,
	easeInOutCubic: t => (t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1),
	easeOutQuint: t => 1 + (--t) * t * t * t * t,
	easeInQuint: t => t * t * t * t * t,
	easeInOutQuint: t => (t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t)
};


/**
 * 创建初始动画控制器
 * @param {HTMLElement|NodeList|Array|Document} elementsOrRoot 目标元素、元素数组、NodeList
 * @param {Object} initial 初始状态配置 { translate:{x,y}, opacity, scale }（如前面传了selector）
 * @param {Object} options 其他默认配置 { willChange: true }
 */
export function createInitialAnimation(elements, initial = {}, options = {}) {
	// 只支持直接传元素/NodeList/数组
	let els;
	if (elements instanceof HTMLElement) {
		els = [elements];
	} else if (NodeList.prototype.isPrototypeOf(elements) || Array.isArray(elements)) {
		els = Array.from(elements);
	} else {
		els = [];
	}
	const cfg = {
		translate: { x: 0, y: 0, ...(initial.translate || {}) },
		opacity: initial.opacity === undefined ? 1 : initial.opacity,
		scale: initial.scale === undefined ? 1 : initial.scale,
		willChange: options.willChange !== false,
		autoInit: options.autoInit || false,
		restoreInline: options.restoreInline !== false
	};
	let meta = [];
	let inited = false;
	let playing = false;
	let rafId = null;
	let startTime = 0;
	let lastPromise = null;

	function parseTransform(transformStr) {
		// 只解析 translate(x,y) 与 scale(s) 情况，复杂矩阵保持 0/1 默认（可扩展）
		const res = { tx: 0, ty: 0, scale: 1 };
		if (!transformStr || transformStr === 'none') return res;
		const translateMatch = transformStr.match(/translate(?:3d)?\(([^)]+)\)/);
		if (translateMatch) {
			const parts = translateMatch[1].split(',').map(s => parseFloat(s));
			res.tx = parts[0] || 0;
			res.ty = (parts[1] || 0);
		}
		const scaleMatch = transformStr.match(/scale(?:3d)?\(([^)]+)\)/);
		if (scaleMatch) {
			const parts = scaleMatch[1].split(',').map(s => parseFloat(s));
			res.scale = parts[0] || 1;
		}
		const matrixMatch = transformStr.match(/matrix\(([^)]+)\)/);
		if (matrixMatch) {
			const parts = matrixMatch[1].split(',').map(s => parseFloat(s));
			res.tx = parts[4] || 0;
			res.ty = parts[5] || 0;
			// scale 也可以从 parts[0] 提取（一般是 a）
			res.scale = parts[0] || 1;
			return res;
		}
		return res;
	}

	function buildTransform(tx, ty, scale) {
		return `translate(${tx}px, ${ty}px) scale(${scale})`;
	}

	function applyInitial(metaItem) {
		const { el, baseTx, baseTy, baseScale, baseOpacity, hadInlineTransform, hadInlineOpacity } = metaItem;
		const addTx = cfg.translate.x;
		const addTy = cfg.translate.y;
		const mulScale = cfg.scale;
		const mulOpacity = cfg.opacity;
		const initTx = baseTx + addTx;
		const initTy = baseTy + addTy;
		const initScale = baseScale * mulScale;
		const initOpacity = (mulOpacity !== null && mulOpacity !== undefined) ? (baseOpacity * mulOpacity) : baseOpacity;
		metaItem.initTx = initTx;
		metaItem.initTy = initTy;
		metaItem.initScale = initScale;
		metaItem.initOpacity = initOpacity;
		el.style.transform = buildTransform(initTx, initTy, initScale);
		if (mulOpacity !== null && mulOpacity !== undefined) {
			el.style.opacity = String(initOpacity);
		}
		el.style.transition = 'none';
		if (cfg.willChange) el.style.willChange = 'transform, opacity';
		metaItem.hadInlineTransform = hadInlineTransform;
		metaItem.hadInlineOpacity = hadInlineOpacity;
	}

	function clearTransition(metaItem) {
		const { el } = metaItem;
		el.style.transition = '';
		if (cfg.willChange) el.style.willChange = '';
	}

	function init() {
		meta = els.map(el => {
			const style = window.getComputedStyle(el);
			const baseOpacity = parseFloat(style.opacity) || 1;
			const hadInlineTransform = el.style.transform !== '';
			const hadInlineOpacity = el.style.opacity !== '';
			const tfParsed = parseTransform(style.transform);
			const baseTx = tfParsed.tx;
			const baseTy = tfParsed.ty;
			const baseScale = tfParsed.scale;
			return { el, baseTx, baseTy, baseScale, baseOpacity, hadInlineTransform, hadInlineOpacity };
		});
		meta.forEach(applyInitial);
		inited = true;
	}

	/**
	 * 播放动画
	 * @param {number} durationSec 动画时长（秒）
	 * @param {string|function} easingNameOrFn 缓动名称或函数 (t:0-1)=>0-1
	 * @param {Object} playOptions 运行期选项 { stagger, onUpdate, onComplete }
	 * @returns {Promise<void>} 完成后resolve
	 */
	function play(durationSec = 0.8, easingNameOrFn = 'easeOutCubic', playOptions = {}) {
		if (!inited) init();
		if (playing) {
			// 若正在播放，先终止以前的 requestAnimationFrame（软打断）
			if (rafId) cancelAnimationFrame(rafId);
		}
		playing = true;

		const easing = typeof easingNameOrFn === 'function' ? easingNameOrFn : (Easings[easingNameOrFn] || Easings.linear);
		const durationMs = durationSec * 1000;
		const { stagger = 0, onUpdate, onComplete } = playOptions;
		const perDelay = Math.max(0, stagger * 1000);

		const itemMeta = meta.map((m, idx) => ({ ...m, delay: perDelay * idx }));
		startTime = performance.now();

		lastPromise = new Promise(resolve => {
			function frame(now) {
				let allDone = true;
				const baseElapsed = now - startTime;

				itemMeta.forEach(({ el, delay, baseTx, baseTy, baseScale, baseOpacity, initTx, initTy, initScale, initOpacity }) => {
					const localElapsed = baseElapsed - delay;
					if (localElapsed < 0) {
						allDone = false; // 还没开始
						return;
					}
					const clamped = Math.min(localElapsed, durationMs);
					let p = clamped / durationMs;
					if (p < 1) allDone = false;
					p = easing(p);
					// 反向插值回原值（p=0 在初始增量状态，p=1 在原始基础状态）
					const currentTx = initTx + (baseTx - initTx) * p;
					const currentTy = initTy + (baseTy - initTy) * p;
					const currentScale = initScale + (baseScale - initScale) * p;
					el.style.transform = buildTransform(currentTx, currentTy, currentScale);
					if (cfg.opacity !== undefined && cfg.opacity !== null) {
						const currentOpacity = initOpacity + (baseOpacity - initOpacity) * p;
						el.style.opacity = String(currentOpacity);
					}
				});

				if (onUpdate) {
					try { onUpdate(); } catch (e) { /* ignore */ }
				}

				if (!allDone) {
					rafId = requestAnimationFrame(frame);
				} else {
					// 结束，清理 transition/will-change
					meta.forEach(clearTransition);
					playing = false;
					if (onComplete) { try { onComplete(); } catch (e) { /* ignore */ } }
					resolve();
				}
			}
			rafId = requestAnimationFrame(frame);
		});
		return lastPromise;
	}

	function cancel() {
		if (rafId) cancelAnimationFrame(rafId);
		playing = false;
	}

	function reset() {
		cancel();
		meta.forEach(applyInitial);
	}

	function destroy() {
		cancel();
		meta.forEach(m => {
			const { el, baseOpacity, baseTx, baseTy, baseScale, hadInlineTransform, hadInlineOpacity } = m;
			// 恢复 transform / opacity 到原有（仅当我们改动过并且原本没有行内样式时）
			if (!hadInlineTransform) {
				el.style.transform = '';
			} else {
				// 保留用户原有行内 transform（无法准确还原复杂矩阵，只在未覆盖时）
			}
			if (cfg.opacity !== undefined && cfg.opacity !== null) {
				if (!hadInlineOpacity) el.style.opacity = '';
			}
			el.style.transition = '';
			if (cfg.willChange) el.style.willChange = '';
		});
		elements = [];
		meta = [];
		inited = false;
	}

	if (cfg.autoInit) init();

	return { init, play, cancel, reset, destroy, elements: () => els.slice(), easingMap: Easings };
}

// 便捷函数：一次性应用（初始化并播放）
export function runInitialAnimation(root, selector, initial, options, playArgs = []) {
	const inst = createInitialAnimation(root, selector, initial, options);
	inst.init();
	inst.play(...playArgs);
	return inst;
}

// 默认导出主工厂
export default createInitialAnimation;

