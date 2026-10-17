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
						// 返回上一页，而非强制跳首页：
						// 从好友资料页进会话应回到资料页，从会话列表进则回首页。
						navigate(-1);
					}}
				/>
				<canBeDetected.div
					className="ml-1 rounded-2xl bg-[rgba(0,0,0,0.15)] px-2 py-[2px] text-xs"
					metaData={{
						type: EMetaDataType.UnreadCount,
						treeItemDisplayName: "未读消息数",
					}}
					// 未读数为 0 时不显示角标，与真实微信一致
					style={{ display: unreadCount.count > 0 ? undefined : "none" }}
				>
					{unreadCount.count}
				</canBeDetected.div>
			</div>
			{/* 导航栏标题：与气泡正文同为 17.5px，不加粗（按真机观感定） */}
			<div className="flex items-center justify-center truncate text-wechat">
				{friendProfile.remark ?? friendProfile.nickname}
			</div>
			<div className="flex items-center justify-end">
				<MoreFilledSVG fill="black" className="h-5 w-5" />
			</div>
		</div>
	);
};

export default ConversationHeader;
