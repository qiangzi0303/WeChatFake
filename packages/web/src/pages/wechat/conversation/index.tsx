import { setDialogueListValue } from "@/stateV2/dialogueList";
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import ConversationFooter from "./ConversationFooter";
import ConversationHeader from "./ConversationHeader";
import ConversationList from "./ConversationList";
import { ConversationAPIProvider } from "./context";

const Conversation = () => {
	const { id } = useParams<{ id: string }>();

	// 进入聊天界面即视为已读：清掉该会话的未读角标，退回列表时不再显示红色数字
	useEffect(() => {
		if (!id) return;
		setDialogueListValue((prev) => {
			let changed = false;
			const next = prev.map((dialogue) => {
				if (dialogue.friendId !== id) return dialogue;
				if (!dialogue.unreadMarkNumber && !dialogue.unreadDisplayType) return dialogue;
				changed = true;
				return { ...dialogue, unreadMarkNumber: undefined, unreadDisplayType: undefined };
			});
			return changed ? next : prev;
		});
	}, [id]);

	return (
		<ConversationAPIProvider>
			<ConversationHeader />
			<ConversationList />
			<ConversationFooter />
		</ConversationAPIProvider>
	);
};

export default Conversation;
