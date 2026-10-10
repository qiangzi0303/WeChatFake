import "./preflight.css";
import "./index.css";
import "animate.css";

import "./i18n";
import { Provider } from "jotai";
import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createHashRouter } from "react-router-dom";
import { initDBImagesCacheStore } from "./db";
import Splash from "./pages/splash";
import { routes } from "./router/index.tsx";
import { mainStore } from "./stateV2/store.ts";
import { initDayjs } from "./time.ts";
import { backendHealthCheck } from "./utils.ts";

initDayjs();
initDBImagesCacheStore();
backendHealthCheck();

const router = createHashRouter(routes);

const Root = () => {
	// 分享模式下不展示启动画面，直接进入内容
	const [showSplash, setShowSplash] = useState(!window.__SHARE_KEY__);

	return (
		<Provider store={mainStore}>
			{showSplash && <Splash onFinish={() => setShowSplash(false)} />}
			<RouterProvider router={router} />
		</Provider>
	);
};

ReactDOM.createRoot(document.getElementById("root")!).render(
	<React.StrictMode>
		<Root />
	</React.StrictMode>,
);
