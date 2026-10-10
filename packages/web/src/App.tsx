import { App as AntdApp, ConfigProvider } from "antd";
import { useTranslation } from "react-i18next";

import { isAppMode } from "./appMode";
import LeftPanel from "./components/LeftPanel";
import MobileEditLayer from "./components/MobileEditLayer";
import RightPanel from "./components/RightPanel";
import Screen from "./components/Screen";
import TopPopover from "./components/TopPopover";
import Tour from "./components/Tour";
import { ANTD_LANG_MAP } from "./i18n";

const App = () => {
	const inShareMode = !!window.__SHARE_KEY__;
	const { i18n } = useTranslation();

	// App 模式：铺满整个视口的纯微信界面，无开发面板、无边框
	if (isAppMode || inShareMode) {
		return (
			<ConfigProvider locale={ANTD_LANG_MAP[i18n.language as keyof typeof ANTD_LANG_MAP]}>
				{/*
				 * antd 的 App 组件会渲染 .ant-app 容器并写死 font-size:14px。
				 * App 模式下整个 <Screen /> 都在它内部，于是聊天正文被这 14px 盖住，
				 * 无论怎么调 body 字号气泡都不变（PC 三栏布局里 Screen 不在 ant-app
				 * 内，所以 PC 可调、手机不可调）。这里让该容器字号继承 body，
				 * 交回给 body/各组件自己的字号控制。
				 */}
				<AntdApp
					className="h-screen w-screen overflow-hidden"
					style={{ fontSize: "inherit", lineHeight: "inherit" }}
				>
					<Screen />
				</AntdApp>
				{isAppMode && !inShareMode && <MobileEditLayer />}
				<Tour />
			</ConfigProvider>
		);
	}

	return (
		<ConfigProvider locale={ANTD_LANG_MAP[i18n.language as keyof typeof ANTD_LANG_MAP]}>
			<div className="grid min-h-screen grid-cols-3 max-lg:grid-cols-1">
				<AntdApp className="max-lg:hidden">
					<LeftPanel />
				</AntdApp>
				<div
					className="flex items-center justify-center overflow-auto border-orange-400 border-r border-l border-dashed max-lg:border-none"
					id="center"
				>
					<div className="border">
						<TopPopover>
							<Screen />
						</TopPopover>
					</div>
				</div>
				<RightPanel />
			</div>
			<Tour />
		</ConfigProvider>
	);
};

export default App;
