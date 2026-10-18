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
 * 包裹单条消息。
 *
 * 当前「长按删除聊天记录」功能已彻底隐藏（强哥要求，暂时不需要）：
 * 把 ENABLE_LONG_PRESS_MENU 置为 false 时，组件退化为纯布局透传，
 * 长按不再弹任何菜单。需要恢复时改回 true 即可（下方逻辑完整保留）。
 */
const ENABLE_LONG_PRESS_MENU = false;

const LongPressMenu = ({ itemId, disabled, children }: PropsWithChildren<Props>) => {
	const { removeConversationItem } = useConversationAPI();
	const [open, setOpen] = useState(false);
	const triggerRef = useRef<HTMLDivElement>(null);

	useLongPress(
		() => {
			if (!ENABLE_LONG_PRESS_MENU || disabled) return;
			setOpen(true);
		},
		triggerRef,
		{ delay: 20000 },
	);

	// 功能关闭时直接透传，但保留 flex 布局容器，避免断掉父级 flex 上下文
	if (!ENABLE_LONG_PRESS_MENU) {
		return <div className="flex flex-col space-y-4">{children}</div>;
	}

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
