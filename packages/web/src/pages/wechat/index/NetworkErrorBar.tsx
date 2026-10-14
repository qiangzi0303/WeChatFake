import ErrorFilledSVG from "@/assets/error-filled.svg?react";
import { canBeDetected } from "@/components/NodeDetected";
import { airplaneModeAtom } from "@/stateV2/airplaneMode";
import { EMetaDataType } from "@/stateV2/detectedNode";
import { useAtomValue } from "jotai";

/**
 * 飞行模式断网提示条。
 * 开启飞行模式后，微信首页顶部显示「当前无法连接网络」红色提示，仿真实微信断网状态。
 */
const NetworkErrorBar = () => {
	const { enabled } = useAtomValue(airplaneModeAtom);

	if (!enabled) return null;

	return (
		<canBeDetected.div
			className="flex items-center bg-[#FDE7E9] px-4 py-2 text-sm text-black/70"
			metaData={{
				type: EMetaDataType.AirplaneMode,
				treeItemDisplayName: "飞行模式断网提示条",
			}}
		>
			<ErrorFilledSVG fill="#FA5151" className="mr-2 h-4 w-4 shrink-0" />
			<span>当前无法连接网络，可检查网络设置是否正常。</span>
		</canBeDetected.div>
	);
};

export default NetworkErrorBar;
