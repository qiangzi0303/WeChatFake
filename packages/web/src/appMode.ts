/**
 * App 模式：作为原生 App（Capacitor）运行，或显式开启 VITE_APP_MODE 时为 true。
 *
 * App 模式下：
 * - 隐藏左右开发面板（LeftPanel / RightPanel）
 * - 微信界面铺满整个视口
 * - 显示微信自带的状态栏（时间/信号/电量）
 */
export const isAppMode =
	import.meta.env.VITE_APP_MODE === "true" ||
	typeof window !== "undefined" && !!(window as unknown as { Capacitor?: unknown }).Capacitor;
