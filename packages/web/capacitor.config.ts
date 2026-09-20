import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
	appId: "com.fakeworld.app",
	appName: "微信",
	// Vite 构建产物目录（相对于本文件所在的 packages/web）
	webDir: "dist",
	android: {
		// 允许 http 明文流量（AI 假聊天接口等本地/自建服务可能用 http）
		allowMixedContent: true,
	},
	plugins: {
		SplashScreen: {
			// 交给应用内 React 启动页（src/pages/splash）接管，
			// 原生启动屏只做极短过渡，避免出现双重闪屏
			launchShowDuration: 0,
			backgroundColor: "#000000",
			androidSplashResourceName: "splash",
			showSpinner: false,
		},
		StatusBar: {
			// 页面内不再渲染模拟状态栏，改用手机真实状态栏，
			// 故关闭覆盖模式让它独占空间，避免遮住微信标题栏
			overlaysWebView: false,
			// 微信主色为浅色背景，状态栏图标用深色
			style: "LIGHT",
			backgroundColor: "#ededed",
		},
	},
};

export default config;
