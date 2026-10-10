/**
 * 临时诊断工具：正文字号实时调节器 + 渲染实测。
 *
 * 用途：终结「APK 正文字号比真微信小」的反复试错。挂在 App 里后，
 * 用户在聊天页用 +/- 按钮直接调 body 基准字号（步进 0.5px），
 * 与旁边打开的真微信并排目测，直到一致，记下数字即可一次定死。
 *
 * 为什么要这样：真机实测已证明正文 computed font-size 与 body 一致、
 * 字体为系统苹方（同真微信），偏小仅源于基准 px 不足。与其一轮轮
 * 猜数字，不如给用户一个现场可调的旋钮，一轮收敛。
 *
 * 定位完成后应连同 main.tsx 的调用、public/diag.html 一并删除。
 */
export function mountDiagOverlay() {
	if (typeof window === "undefined" || typeof document === "undefined") return;

	const STEP = 0.5;
	const MIN = 16;
	const MAX = 28;

	// 起始值取当前 body 的实际字号，便于基于线上值微调
	const readBodyFS = () => Number.parseFloat(getComputedStyle(document.body).fontSize) || 19;
	let current = readBodyFS();

	const apply = () => {
		// 内联覆盖 index.css 的 body font-size；bubble 文字继承 body 随之变化。
		document.body.style.fontSize = `${current}px`;
	};

	const render = () => {
		const existing = document.getElementById("__diag_overlay__");
		if (existing) existing.remove();

		const html = document.documentElement;
		const htmlFS = getComputedStyle(html).fontSize;
		const bodyFS = getComputedStyle(document.body).fontSize;

		// 实测聊天气泡正文真实字号：SlateText 的 Editable 渲染为
		// [data-slate-editor] 容器。取第一个可见的。
		let bubbleFS = "n/a";
		const editors = document.querySelectorAll('[data-slate-editor="true"]');
		for (const el of Array.from(editors)) {
			const r = (el as HTMLElement).getBoundingClientRect();
			if (r.width > 0 && r.height > 0) {
				bubbleFS = getComputedStyle(el as HTMLElement).fontSize;
				break;
			}
		}

		const info = document.createElement("div");
		info.id = "__diag_overlay__";
		info.style.cssText =
			"position:fixed;left:0;right:0;top:0;z-index:999999;background:rgba(0,0,0,.85);" +
			"color:#0f0;font:12px/1.5 monospace;padding:8px 10px;";

		const line = document.createElement("div");
		line.textContent =
			`正文基准: ${current.toFixed(1)}px  |  body: ${bodyFS}  |  气泡实测: ${bubbleFS}  |  html: ${htmlFS}`;
		info.appendChild(line);

		// 构建标记：用于区分手机上装的是哪一版包。看到 BUILD-B 即为含
		// TEXT_AUTOSIZING 修复的新包；若仍显示旧值或无此行，说明装的是旧包。
		const ver = document.createElement("div");
		ver.style.cssText = "color:#ff0;";
		ver.textContent = "BUILD-B (autosize-fix)";
		info.appendChild(ver);

		const bar = document.createElement("div");
		bar.style.cssText = "display:flex;gap:8px;margin-top:6px;align-items:center;";

		const mkBtn = (label: string, fn: () => void) => {
			const b = document.createElement("button");
			b.textContent = label;
			b.style.cssText =
				"flex:0 0 auto;background:#0f0;color:#000;border:0;border-radius:4px;" +
				"font:bold 14px/1 monospace;padding:8px 14px;";
			b.addEventListener("click", (e) => {
				e.stopPropagation();
				fn();
				render();
			});
			return b;
		};

		const minus = mkBtn("−", () => {
			current = Math.max(MIN, current - STEP);
			apply();
		});
		const plus = mkBtn("＋", () => {
			current = Math.min(MAX, current + STEP);
			apply();
		});
		const reset = mkBtn("还原", () => {
			current = readBodyFS();
			document.body.style.fontSize = "";
		});
		const close = mkBtn("关闭", () => info.remove());

		bar.append(minus, plus, reset, close);
		info.appendChild(bar);

		const hint = document.createElement("div");
		hint.style.cssText = "margin-top:4px;color:#9f9;font-size:11px;";
		hint.textContent = "打开真微信并排目测，调到与真微信正文一致后，把上面的数值告诉我。";
		info.appendChild(hint);

		document.body.appendChild(info);
	};

	apply();
	setTimeout(render, 1200);
	window.addEventListener("resize", () => setTimeout(render, 200));
}
