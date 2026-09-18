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
			// 状态栏样式由页面内微信状态栏自行绘制，这里设为覆盖模式
			overlaysWebView: true,
			style: "DARK",
		},
	},
};

export default config;
