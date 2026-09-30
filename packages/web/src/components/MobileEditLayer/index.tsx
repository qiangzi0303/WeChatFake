import { activatedNodeAtom, hoveredNodeAtom } from "@/stateV2/detectedNode";
import { modeAtom } from "@/stateV2/mode";
import { App as AntdApp, Drawer } from "antd";
import { useAtom, useSetAtom } from "jotai";
import { memo, useEffect } from "react";
import MetaDataEditor from "../MetaDataEditor";

/**
 * 移动端（App 模式）编辑入口。
 *
 * 桌面端靠 `shift+z` 切换编辑模式、靠 RightPanel 常驻显示编辑器；
 * 手机上没有键盘、也隐藏了 RightPanel，这里补齐这两块：
 * - 进入编辑模式的入口在「我 - 设置」菜单最后一行（见 pages/wechat/my）
 * - 编辑模式下点选界面节点 —— 从底部弹出抽屉显示对应的 MetaDataEditor
 * - 顶部提示条兼作退出按钮
 *
 * 默认停留在预览模式，不做长按手势，避免与正常点击/滑动抢事件。
 * 节点点选本身（canBeDetected 的 onClick）在编辑模式下已天然生效，无需改动。
 */
const MobileEditLayer = () => {
	const [mode, setMode] = useAtom(modeAtom);
	const [activatedNode, setActivatedNode] = useAtom(activatedNodeAtom);
	const setHoveredNode = useSetAtom(hoveredNodeAtom);
	const isEdit = mode === "edit";

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
			{/* 编辑模式提示条，点击即退出编辑 */}
			{isEdit && !activatedNode && (
				<button
					type="button"
					className="fixed top-0 right-0 left-0 z-[65] flex items-center justify-center gap-2 bg-[#07c160] py-1 text-center text-white text-xs"
					onClick={() => setMode("preview")}
				>
					<span>编辑模式：点选任意元素进行编辑</span>
					<span className="rounded-full bg-white/25 px-2 py-[1px]">退出</span>
				</button>
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
