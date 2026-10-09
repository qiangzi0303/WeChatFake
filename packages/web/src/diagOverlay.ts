/**
 * 临时诊断浮层：仅用于定位「APK 内字号偏小而手机浏览器正常」的根因。
 *
 * 显示 WebView 真机实测值：innerWidth / devicePixelRatio / 视口 scale /
 * html 与 body 的 computed font-size / 实际渲染字体等。装一次截图即可，
 * 定位完成后应连同 main.tsx 的调用一并删除。
 */
export function mountDiagOverlay() {
	if (typeof window === "undefined" || typeof document === "undefined") return;

	const render = () => {
		const existing = document.getElementById("__diag_overlay__");
		if (existing) existing.remove();

		const html = document.documentElement;
		const bodyFS = getComputedStyle(document.body).fontSize;
		const htmlFS = getComputedStyle(html).fontSize;
		const bodyFont = getComputedStyle(document.body).fontFamily;

		// 临时量一行 1rem 文字的真实字号
		const probe = document.createElement("span");
		probe.style.fontSize = "1rem";
		probe.style.position = "absolute";
		probe.style.visibility = "hidden";
		probe.textContent = "x";
		document.body.appendChild(probe);
		const remFS = getComputedStyle(probe).fontSize;
		probe.remove();

		const rows: Array<[string, unknown]> = [
			["innerWidth", window.innerWidth],
			["outerWidth", window.outerWidth],
			["screen.width", screen.width],
			["devicePixelRatio", window.devicePixelRatio],
			["vv.scale", window.visualViewport ? window.visualViewport.scale.toFixed(3) : "n/a"],
			["vv.width", window.visualViewport ? Math.round(window.visualViewport.width) : "n/a"],
			["html font-size", htmlFS],
			["body font-size", bodyFS],
			["1rem 实测", remFS],
			["body font", bodyFont.slice(0, 40)],
		];

		const box = document.createElement("div");
		box.id = "__diag_overlay__";
		box.style.cssText =
			"position:fixed;left:0;right:0;bottom:0;z-index:999999;background:rgba(0,0,0,.86);" +
			"color:#0f0;font:12px/1.5 monospace;padding:10px 12px;white-space:pre;";
		box.textContent =
			rows.map(([k, v]) => k.padEnd(16, " ") + ": " + String(v)).join("\n") +
			"\n(点我关闭)";
		box.addEventListener("click", () => box.remove());
		document.body.appendChild(box);
	};

	// 等 React 首帧与字体就绪后再测，稍作延迟
	setTimeout(render, 1200);
	window.addEventListener("resize", () => setTimeout(render, 200));
}
