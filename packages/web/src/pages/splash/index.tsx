import { useEffect, useState } from "react";

interface SplashProps {
	/** 启动画面结束回调 */
	onFinish: () => void;
}

/**
 * 微信经典启动画面：纯黑底 + 蓝色地球 + 底部小人剪影
 * 纯 CSS 实现，无需图片素材，真机秒开
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
			className={`fixed inset-0 flex flex-col items-center justify-center overflow-hidden transition-opacity duration-500 ${
				fadeOut ? "opacity-0" : "opacity-100"
			}`}
			style={{ zIndex: 99999, backgroundColor: "#000" }}
		>
			{/* 星空点缀 */}
			<div className="absolute inset-0 opacity-60" style={{ background: STAR_FIELD }} />

			{/* 地球 */}
			<div
				className="relative animate-[splashEarthIn_1.2s_ease-out]"
				style={{
					width: "62vw",
					maxWidth: 300,
					aspectRatio: "1 / 1",
					borderRadius: "50%",
					background:
						"radial-gradient(circle at 35% 30%, #6db3f2 0%, #1a5fb4 42%, #0a2d5e 78%, #041530 100%)",
					boxShadow:
						"inset -18px -22px 60px rgba(0,0,0,0.75), 0 0 60px rgba(60,130,220,0.35)",
				}}
			>
				{/* 大陆色块（抽象云层/陆地） */}
				<div
					className="absolute inset-0"
					style={{
						borderRadius: "50%",
						opacity: 0.55,
						background:
							"radial-gradient(ellipse 30% 22% at 60% 40%, rgba(120,180,120,0.7), transparent 60%), radial-gradient(ellipse 22% 30% at 38% 62%, rgba(140,190,130,0.6), transparent 60%), radial-gradient(ellipse 26% 16% at 55% 72%, rgba(230,235,245,0.5), transparent 60%)",
					}}
				/>
			</div>

			{/* 底部小人剪影（仰望地球） */}
			<div className="absolute" style={{ bottom: "16%" }}>
				<div
					style={{
						width: 10,
						height: 26,
						background: "#000",
						borderRadius: "40% 40% 0 0",
						position: "relative",
						filter: "drop-shadow(0 0 1px rgba(255,255,255,0.15))",
					}}
				>
					{/* 头 */}
					<div
						style={{
							position: "absolute",
							top: -9,
							left: "50%",
							transform: "translateX(-50%)",
							width: 8,
							height: 8,
							borderRadius: "50%",
							background: "#000",
						}}
					/>
				</div>
			</div>

			<style>{KEYFRAMES}</style>
		</div>
	);
};

const STAR_FIELD =
	"radial-gradient(1px 1px at 20% 30%, #fff, transparent), radial-gradient(1px 1px at 70% 20%, #fff, transparent), radial-gradient(1px 1px at 40% 70%, #ccc, transparent), radial-gradient(1px 1px at 85% 60%, #fff, transparent), radial-gradient(1px 1px at 15% 80%, #ddd, transparent), radial-gradient(1px 1px at 60% 85%, #fff, transparent), radial-gradient(1px 1px at 90% 40%, #eee, transparent)";

const KEYFRAMES = `
@keyframes splashEarthIn {
  0% { transform: scale(1.15); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}`;

export default Splash;
