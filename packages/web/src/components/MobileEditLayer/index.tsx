import { activatedNodeAtom, hoveredNodeAtom } from "@/stateV2/detectedNode";
import { modeAtom } from "@/stateV2/mode";
import { EditOutlined } from "@ant-design/icons";
import { useLongPress } from "ahooks";
import { App as AntdApp, Drawer, FloatButton } from "antd";
import { useAtom, useSetAtom } from "jotai";
import { memo, useEffect } from "react";
import MetaDataEditor from "../MetaDataEditor";

/**
 * 移动端（App 模式）编辑入口。
 *
 * 桌面端靠 `shift+z` 切换编辑模式、靠 RightPanel 常驻显示编辑器；
 * 手机上没有键盘、也隐藏了 RightPanel，这里补齐这两块：
 * - 长按屏幕任意处 或 点击右下角悬浮按钮 —— 切换编辑/预览模式
 * - 编辑模式下点选界面节点 —— 从底部弹出抽屉显示对应的 MetaDataEditor
 *
 * 节点点选本身（canBeDetected 的 onClick）在编辑模式下已天然生效，无需改动。
 */
const MobileEditLayer = () => {
	const [mode, setMode] = useAtom(modeAtom);
	const [activatedNode, setActivatedNode] = useAtom(activatedNodeAtom);
	const setHoveredNode = useSetAtom(hoveredNodeAtom);
	const isEdit = mode === "edit";

	const toggleMode = () => {
		setMode((prev) => (prev === "edit" ? "preview" : "edit"));
	};

	// 长按屏幕（预览模式下）切换到编辑模式。
	// 绑定到 document.body，delay 稍长以避免与点击/滑动冲突；
	// moveThreshold 让滑动手势不触发长按，从而不影响正常滚动。
	useLongPress(
		() => {
			if (!isEdit) toggleMode();
		},
		() => document.body,
		{ delay: 600, moveThreshold: { x: 10, y: 10 } },
	);

	// 退出编辑模式时清理选中/悬浮态
	useEffect(() => {
		if (!isEdit) {
			setActivatedNode(null);
			setHoveredNode(null);
		}
	}, [isEdit]);

	const drawerOpen = isEdit && !!activatedNode;

	return (
		<>
			{/* 右下角悬浮按钮：进入/退出编辑模式 */}
			<FloatButton
				icon={<EditOutlined />}
				type={isEdit ? "primary" : "default"}
				tooltip={isEdit ? "退出编辑" : "编辑"}
				style={{ right: 16, bottom: 80, zIndex: 70 }}
				onClick={toggleMode}
			/>

			{/* 编辑模式提示条 */}
			{isEdit && !activatedNode && (
				<div
					className="fixed top-0 right-0 left-0 z-[65] bg-[#07c160] py-1 text-center text-white text-xs"
					style={{ pointerEvents: "none" }}
				>
					编辑模式：点选任意元素进行编辑
				</div>
			)}

			{/* 底部抽屉：选中节点后弹出对应编辑器 */}
			<Drawer
				title="编辑"
				placement="bottom"
				height="60%"
				open={drawerOpen}
				onClose={() => setActivatedNode(null)}
				styles={{ body: { padding: 16 } }}
				zIndex={80}
			>
				<AntdApp>
					<MetaDataEditor />
				</AntdApp>
			</Drawer>
		</>
	);
};

export default memo(MobileEditLayer);
