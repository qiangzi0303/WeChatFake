import { useEffect, useState } from "react";

import splashImg from "@/assets/splash.webp";

interface SplashProps {
	/** 启动画面结束回调 */
	onFinish: () => void;
}

/**
 * 微信启动画面：全屏展示地球图，深色底衬边。
 * 图片按宽度铺满、等比缩放居中，长屏机型上下由深色背景自然延伸，不裁切主体。
 */
const Splash = ({ onFinish }: SplashProps) => {
	const [fadeOut, setFadeOut] = useState(false);

	useEffect(() => {
		const fadeTimer = setTimeout(() => setFadeOut(true), 2200);
		const finishTimer = setTimeout(onFinish, 2800);
		return () => {
			clearTimeout(fadeTimer);
			clearTimeout(finishTimer);
		};
	}, [onFinish]);

	return (
		<div
			className={`fixed inset-0 overflow-hidden transition-opacity duration-500 ${
				fadeOut ? "opacity-0" : "opacity-100"
			}`}
			style={{
				zIndex: 99999,
				// 图片四边为近纯黑，衬底用黑色使长屏机型的上下延伸区无缝衔接
				backgroundColor: "#000",
				backgroundImage: `url(${splashImg})`,
				backgroundSize: "contain",
				backgroundPosition: "center",
				backgroundRepeat: "no-repeat",
			}}
		/>
	);
};

export default Splash;
