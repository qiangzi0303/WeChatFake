import BackFilledSVG from "@/assets/back-filled.svg?react";
import { canBeDetected } from "@/components/NodeDetected";
import useModeNavigate from "@/components/useModeNavigate";
import { airplaneModeAtom } from "@/stateV2/airplaneMode";
import { EMetaDataType } from "@/stateV2/detectedNode";
import List from "@/wechatComponents/List";
import { Switch } from "antd";
import { useAtom } from "jotai";

const Settings = () => {
	const navigate = useModeNavigate();
	const [airplaneMode, setAirplaneMode] = useAtom(airplaneModeAtom);

	return (
		<>
			<div className="grid grid-cols-3 bg-[rgba(237,237,237,1)] px-4 py-2">
				<BackFilledSVG
					fill="black"
					className="h-5 w-5 cursor-pointer"
					onClick={() => navigate("/wechat/my")}
				/>
				<div className="flex items-center justify-center font-medium">设置</div>
				<div />
			</div>
			<div className="flex-1 bg-[rgba(237,237,237,1)]">
				<List className="mt-1.5">
					<canBeDetected.div
						metaData={{
							type: EMetaDataType.AirplaneMode,
							treeItemDisplayName: "飞行模式",
						}}
					>
						<List.Item>
							<div className="flex items-center justify-between">
								<span>飞行模式</span>
								<Switch
									checked={airplaneMode.enabled}
									onChange={(checked) => setAirplaneMode({ enabled: checked })}
								/>
							</div>
						</List.Item>
					</canBeDetected.div>
				</List>
			</div>
		</>
	);
};

export default Settings;
