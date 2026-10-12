import type { TConversationItem } from "@/stateV2/conversation";
import { Dropdown, type MenuProps, Modal } from "antd";
import { useLongPress } from "ahooks";
import { type PropsWithChildren, useRef, useState } from "react";
import { useConversationAPI } from "../context";

type Props = {
	itemId: TConversationItem["id"];
	/** 编辑模式下禁用长按菜单，避免与拖拽排序冲突 */
	disabled?: boolean;
};

/**
 * 包裹单条消息，提供「长按（移动端）/ 右键（桌面）弹出删除菜单」能力。
 * 删除走 context 的 removeConversationItem，仅在非编辑模式启用。
 */
const LongPressMenu = ({ itemId, disabled, children }: PropsWithChildren<Props>) => {
	const { removeConversationItem } = useConversationAPI();
	const [open, setOpen] = useState(false);
	const triggerRef = useRef<HTMLDivElement>(null);

	useLongPress(
		() => {
			if (disabled) return;
			setOpen(true);
		},
		triggerRef,
	);

	const handleDelete = () => {
		setOpen(false);
		Modal.confirm({
			title: "是否删除该聊天记录？",
			okText: "删除",
			okButtonProps: { danger: true },
			cancelText: "取消",
			onOk: () => removeConversationItem(itemId),
		});
	};

	const menuItems: MenuProps["items"] = [
		{
			key: "delete",
			label: "删除",
			danger: true,
			onClick: handleDelete,
		},
	];

	return (
		<Dropdown
			menu={{ items: menuItems }}
			trigger={["contextMenu"]}
			open={disabled ? false : open}
			onOpenChange={setOpen}
		>
			<div ref={triggerRef} className="flex flex-col space-y-4">
				{children}
			</div>
		</Dropdown>
	);
};

export default LongPressMenu;
