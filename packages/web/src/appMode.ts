/**
 * App 模式：作为原生 App（Capacitor）运行，或显式开启 VITE_APP_MODE 时为 true。
 *
 * App 模式下：
 * - 隐藏左右开发面板（LeftPanel / RightPanel）
 * - 微信界面铺满整个视口
 * - 状态栏使用手机系统自带的（页面内不再绘制模拟状态栏）
 */
export const isAppMode =
	import.meta.env.VITE_APP_MODE === "true" ||
	typeof window !== "undefined" && !!(window as unknown as { Capacitor?: unknown }).Capacitor;
