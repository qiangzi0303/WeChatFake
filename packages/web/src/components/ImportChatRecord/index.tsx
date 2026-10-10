import { isAppMode } from "@/appMode";
import {
	type IFolderContent,
	type IParseResult,
	importChatRecord,
	isZipFile,
	parseChatRecord,
	readSelectedFiles,
	readZipFile,
} from "@/services/chatImport";
import { getAllProfilesValueSnapshot } from "@/stateV2/profile";
import { ImportOutlined } from "@ant-design/icons";
import { App, Button, Modal } from "antd";
import { type ReactNode, useRef, useState } from "react";
import PreviewStep from "./PreviewStep";

type Props = {
	/**
	 * 自定义触发器。收到的回调分别拉起「选文件夹」和「选 zip 压缩包」。
	 * 移动端用微信风格的列表行，桌面端用默认按钮。
	 */
	renderTrigger?: (actions: { openPicker: () => void; openZipPicker: () => void }) => ReactNode;
};

const ImportChatRecord = ({ renderTrigger }: Props) => {
	const { message } = App.useApp();
	const inputRef = useRef<HTMLInputElement>(null);
	const zipInputRef = useRef<HTMLInputElement>(null);
	const [open, setOpen] = useState(false);
	const [folder, setFolder] = useState<IFolderContent>();
	const [parseResult, setParseResult] = useState<IParseResult>();
	const [importing, setImporting] = useState(false);

	const closeModal = () => {
		setOpen(false);
		setFolder(undefined);
		setParseResult(undefined);
	};

	const handleConfirm = async (config: {
		myselfSpeaker: string;
		friendSpeaker: string;
		targetFriendId?: string;
		transferAmount: string;
		redPacketAmount: string;
		overwrite: boolean;
	}) => {
		if (!parseResult || !folder) return;
		setImporting(true);
		try {
			const result = await importChatRecord({
				parseResult,
				attachments: folder.attachments,
				...config,
			});
			const missingTip = result.missingAttachments.length
				? `，${result.missingAttachments.length} 个附件未找到`
				: "";
			message.success(
				`已导入 ${result.messageCount} 条消息到「${result.friendName}」，含 ${result.imageCount} 张图片${missingTip}`,
			);
			closeModal();
		} catch (error) {
			message.error(error instanceof Error ? error.message : "导入失败");
		} finally {
			setImporting(false);
		}
	};

	// 拿到内容后的通用后续：解析、校验、开预览弹窗
	const acceptContent = (content: IFolderContent) => {
		const result = parseChatRecord(content.text);
		if (!result.messages.length) {
			message.error("没有解析到任何消息，请确认文件格式");
			return;
		}
		if (result.speakers.length < 2) {
			message.warning("只识别到一位发送者，导入后可能全部显示在同一侧");
		}
		setFolder(content);
		setParseResult(result);
		setOpen(true);
	};

	const handleFilesSelected = async (files: FileList | null) => {
		if (!files?.length) return;
		try {
			const content = await readSelectedFiles(files);
			acceptContent(content);
		} catch (error) {
			message.error(error instanceof Error ? error.message : "读取失败");
		} finally {
			// 清空，否则连续选同一个文件夹不会触发 change
			if (inputRef.current) inputRef.current.value = "";
		}
	};

	const handleZipSelected = async (files: FileList | null) => {
		const file = files?.[0];
		if (!file) return;
		try {
			if (!isZipFile(file.name)) {
				message.error("请选择 .zip 格式的压缩包");
				return;
			}
			const content = await readZipFile(file);
			acceptContent(content);
		} catch (error) {
			message.error(error instanceof Error ? error.message : "读取失败");
		} finally {
			if (zipInputRef.current) zipInputRef.current.value = "";
		}
	};

	const openPicker = () => inputRef.current?.click();
	const openZipPicker = () => zipInputRef.current?.click();

	return (
		<>
			{renderTrigger ? (
				renderTrigger({ openPicker, openZipPicker })
			) : (
				<>
					<Button icon={<ImportOutlined />} onClick={openPicker}>
						导入聊天记录（文件夹）
					</Button>
					<Button icon={<ImportOutlined />} onClick={openZipPicker} className="ml-2">
						导入 zip
					</Button>
				</>
			)}
			<input
				ref={inputRef}
				type="file"
				className="hidden"
				// @ts-expect-error 目录选择是非标准属性，但主流浏览器与 WebView 都支持
				webkitdirectory=""
				directory=""
				multiple
				onChange={(ev) => handleFilesSelected(ev.target.files)}
			/>
			<input
				ref={zipInputRef}
				type="file"
				className="hidden"
				accept=".zip,application/zip,application/x-zip-compressed"
				onChange={(ev) => handleZipSelected(ev.target.files)}
			/>
			<Modal
				open={open}
				title="导入聊天记录"
				// 手机屏幕放不下固定 720，改成几乎铺满
				width={isAppMode ? "94vw" : 720}
				style={isAppMode ? { top: 16, maxWidth: "94vw", padding: 0 } : undefined}
				styles={
					isAppMode ? { body: { maxHeight: "78vh", overflowY: "auto", padding: 12 } } : undefined
				}
				onCancel={closeModal}
				footer={null}
				destroyOnClose
			>
				{parseResult && folder && (
					<PreviewStep
						folder={folder}
						parseResult={parseResult}
						profiles={getAllProfilesValueSnapshot()}
						importing={importing}
						onCancel={closeModal}
						onConfirm={handleConfirm}
					/>
				)}
			</Modal>
		</>
	);
};

export default ImportChatRecord;
