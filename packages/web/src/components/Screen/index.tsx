import { Global, css } from "@emotion/react";
import { type CSSProperties, memo } from "react";
import { isDesktop, isMobileOnly } from "react-device-detect";
import { ErrorBoundary } from "react-error-boundary";
import { Outlet } from "react-router-dom";

import { isAppMode } from "@/appMode";
import Fallback from "../Fallback";
import DetectedOverall from "../NodeDetected/DetectedFloating";
import StatusBar from "../StatusBar";
import useDeviceConfig from "../useDeviceConfig";

const Screen = () => {
	const { screenSize } = useDeviceConfig();

	const fullScreen = isAppMode || isMobileOnly;

	const style: CSSProperties = fullScreen
		? { width: "100vw", height: "calc(100vh - 1px)" }
		: {
				width: screenSize.width,
				height: screenSize.height,
			};

	return (
		<div style={style} className="relative flex flex-col overflow-hidden" id="screen">
			<Global
				styles={css`
   &::-webkit-scrollbar {
     display: none;
   }
        `}
			/>
			<DetectedOverall />
			{/* App 模式下用手机真实状态栏（时间/信号/电量），不渲染页面内的模拟状态栏 */}
			{isDesktop && !isAppMode && <StatusBar />}
			<ErrorBoundary FallbackComponent={Fallback}>
				<Outlet />
			</ErrorBoundary>
		</div>
	);
};

export default memo(Screen);

