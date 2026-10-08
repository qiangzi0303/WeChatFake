/** @type {import('tailwindcss').Config} */
export default {
	content: ["./index.html", "./src/**/*.{ts,js,jsx,tsx}"],
	theme: {
		extend: {
			// 字体栈对齐 WeUI（src/style/base/variable/global.less）：
			// @weuiFontEN: system-ui, -apple-system, "Helvetica Neue"
			// @weuiFontCN: "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei"
			// WeUI 自身只挂了 EN 段、靠 system-ui 回落中文，但 Android WebView 上
			// 部分定制 ROM 的 system-ui 不稳，所以显式补齐主流 ROM 的中文字体。
			fontFamily: {
				sans: [
					"system-ui",
					"-apple-system",
					'"Helvetica Neue"',
					'"PingFang SC"',
					'"HarmonyOS Sans SC"',
					"MiSans",
					'"Source Han Sans SC"',
					'"Noto Sans CJK SC"',
					'"Hiragino Sans GB"',
					'"Microsoft YaHei"',
					"sans-serif",
					'"Apple Color Emoji"',
					'"Segoe UI Emoji"',
					'"Noto Color Emoji"',
				],
			},
			fontSize: {
				// 微信正文号 = 17.5px（真机观感微调值，非文档原值）。
				// 适老化指南 iOS 档 17px / Android 档 16px、WeUI 同为 17px，
				// 但真机下 16 与 17 均偏小，故上调半像素，勿按文档改回。
				// 行高固定 24px（原 17px×1.41176 亦为 24px），保持气泡高度不变。
				// 导航栏标题与聊天气泡正文同为此号、同为常规字重。
				wechat: ["17.5px", "24px"],
				// WeUI @weuiCellTipsFontSize
				wechatTips: ["14px", "1.6"],
				// 聊天页内的时间分割与系统提示。真微信这里比列表摘要(14px)
				// 小一号，两者此前共用 wechatTips 导致时间偏大。
				wechatTimeDivider: ["12px", "1.4"],
				// 会话列表右上角的时间，同样小于摘要字号
				wechatListTime: ["12px", "1.4"],
				// WeUI .weui-tabbar__label
				wechatTab: ["10px", "1.4"],
			},
			colors: {
				antDaybreakBlue: {
					1: "#e6f4ff",
					2: "#bae0ff",
					3: "#91caff",
					4: "#69b1ff",
					5: "#4096ff",
					6: "#1677ff",
					7: "#0958d9",
					8: "#003eb3",
					9: "#002c8c",
					10: "#001d66",
				},
				wechatBrand: {
					1: "#069A4D",
					2: "#06AE57",
					3: "#07C160",
					4: "#39CD80",
					5: "#B4ECCF",
				},
				wechatLightGreen: {
					1: "#77BD54",
					2: "#86D55F",
					3: "#95EC69",
					4: "#AAF087",
					5: "#DFF9D2",
				},
				wechatYellow: {
					1: "#CC9C00",
					2: "#E6B000",
					3: "#FFC300",
					4: "#FFCF33",
					5: "#FFEDB2",
				},
				wechatOrange: {
					1: "#C87E2F",
					2: "#E18E35",
					3: "#FA9D3B",
					4: "#FBB162",
					5: "#FDE1C4",
				},
				wechatBG: {
					1: "#000",
					2: "#333",
					3: "#EDEDED",
					4: "#F7F7F7",
					5: "#fff",
				},
				wechatLink: {
					1: "#465677",
					2: "#4E6186",
					3: "#576B95",
					4: "#7989AA",
					5: "#CCD2DF",
				},
				wechatRed: {
					1: "#C84141",
					2: "#E14949",
					3: "#FA5151",
					4: "#FB7474",
					5: "#FDCACA",
				},
			},
			height: {
				17: "4.25rem",
				18: "4.5rem",
				34: "8.5rem",
			},
			width: {
				17: "4.25rem",
				18: "4.5rem",
				34: "8.5rem",
			},
			padding: {
				18: "4.5rem",
			},
			spacing: {
				1.5: "0.375rem",
			},
			scale: {
				60: ".60",
				80: ".80",
				85: ".85",
			},
			saturate: {
				60: ".60",
			},
			zIndex: {
				100: "100",
				200: "200",
			},
		},
	},
	plugins: [require("@tailwindcss/aspect-ratio"), require("tailwindcss-animated")],
	corePlugins: {
		preflight: false,
		aspectRatio: false,
	},
};
