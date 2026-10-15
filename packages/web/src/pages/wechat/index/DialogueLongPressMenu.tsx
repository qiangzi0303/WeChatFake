import { conversationListAtom } from "@/stateV2/conversation";
import { type IDialogueItem, dialogueItemAtom, dialogueListAtom } from "@/stateV2/dialogueList";
import { Dropdown, type MenuProps, Modal } from "antd";
import { useLongPress } from "ahooks";
import { useAtomValue, useSetAtom } from "jotai";
import { RESET } from "jotai/utils";
import { type PropsWithChildren, useRef, useState } from "react";

type Props = {
	itemId: IDialogueItem["id"];
	friendId: IDialogueItem["friendId"];
	/** 编辑模式下禁用长按菜单，避免与拖拽排序冲突 */
	disabled?: boolean;
};

/**
 * 包裹首页单个会话项，提供「长按（移动端）/ 右键（桌面）弹出会话操作菜单」能力。
 * 菜单项对齐微信：标为未读 / 置顶该聊天 / 不显示该聊天 / 删除该聊天。
 */
const DialogueLongPressMenu = ({
	itemId,
	friendId,
	disabled,
	children,
}: PropsWithChildren<Props>) => {
	const dialogueItem = useAtomValue(dialogueItemAtom(itemId));
	const setDialogueItem = useSetAtom(dialogueItemAtom(itemId));
	const setDialogueList = useSetAtom(dialogueListAtom);
	const setConversationList = useSetAtom(conversationListAtom(friendId));
	const [open, setOpen] = useState(false);
	const triggerRef = useRef<HTMLDivElement>(null);

	useLongPress(
		() => {
			if (disabled) return;
			setOpen(true);
		},
		triggerRef,
	);

	const handleMarkUnread = () => {
		setOpen(false);
		setDialogueItem((prev) =>
			prev
				? {
						...prev,
						badgeHide: false,
						unreadDisplayType: "dot",
						unreadMarkNumber: prev.unreadMarkNumber ?? 1,
					}
				: prev,
		);
	};

	const handleTogglePin = () => {
		setOpen(false);
		setDialogueItem((prev) => (prev ? { ...prev, isPinned: !prev.isPinned } : prev));
	};

	const handleHide = () => {
		setOpen(false);
		setDialogueList((prev) => prev.filter((v) => v.id !== itemId));
	};

	const handleDelete = () => {
		setOpen(false);
		Modal.confirm({
			title: "是否删除该聊天？",
			content: "这将删除与该聊天的聊天记录",
			okText: "删除",
			okButtonProps: { danger: true },
			cancelText: "取消",
			onOk: () => {
				setDialogueList((prev) => prev.filter((v) => v.id !== itemId));
				setConversationList(RESET);
			},
		});
	};

	const menuItems: MenuProps["items"] = [
		{ key: "unread", label: "标为未读", onClick: handleMarkUnread },
		{ key: "pin", label: dialogueItem?.isPinned ? "取消置顶" : "置顶该聊天", onClick: handleTogglePin },
		{ key: "hide", label: "不显示该聊天", onClick: handleHide },
		{ key: "delete", label: "删除该聊天", danger: true, onClick: handleDelete },
	];

	return (
		<Dropdown
			menu={{ items: menuItems }}
			trigger={["contextMenu"]}
			open={disabled ? false : open}
			onOpenChange={setOpen}
		>
			<div ref={triggerRef}>{children}</div>
		</Dropdown>
	);
};

export default DialogueLongPressMenu;
