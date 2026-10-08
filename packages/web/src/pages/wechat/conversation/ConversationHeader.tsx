import BackFilledSVG from "@/assets/back-filled.svg?react";
import MoreFilledSVG from "@/assets/more-filled.svg?react";
import { canBeDetected } from "@/components/NodeDetected";
import useModeNavigate from "@/components/useModeNavigate";
import { EMetaDataType } from "@/stateV2/detectedNode";
import { profileAtom } from "@/stateV2/profile";
import { unreadCountAtom } from "@/stateV2/unreadCount";
import { useAtomValue } from "jotai";
import { useParams } from "react-router-dom";

const ConversationHeader = () => {
	const { id } = useParams<{ id: string }>();
	const friendProfile = useAtomValue(profileAtom(id ?? ""))!;
	const unreadCount = useAtomValue(unreadCountAtom);
	const navigate = useModeNavigate();

	return (
		<div className="grid grid-cols-3 border-black/5 border-b bg-[#F5F5F5] px-4 py-2">
			<div className="flex items-center">
				<BackFilledSVG
					fill="black"
					className="h-5 w-5 cursor-pointer"
					onClick={() => {
						navigate("/wechat");
					}}
				/>
				<canBeDetected.div
					className="ml-1 rounded-2xl bg-[rgba(0,0,0,0.15)] px-2 py-[2px] text-xs"
					metaData={{
						type: EMetaDataType.UnreadCount,
						treeItemDisplayName: "未读消息数",
					}}
				>
					{unreadCount.count}
				</canBeDetected.div>
			</div>
			{/* 导航栏标题：字号与气泡正文同为 16px（微信适老化指南 Android 基准），
			    两者观感差异来自字重 —— 标题 Semibold(600)、气泡正文 Regular。 */}
			<div className="flex items-center justify-center truncate text-wechat font-semibold">
				{friendProfile.remark ?? friendProfile.nickname}
			</div>
			<div className="flex items-center justify-end">
				<MoreFilledSVG fill="black" className="h-5 w-5" />
			</div>
		</div>
	);
};

export default ConversationHeader;
