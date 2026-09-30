import {
	type IFolderContent,
	type IParseResult,
	importChatRecord,
	parseChatRecord,
	readSelectedFiles,
} from "@/services/chatImport";
import { getAllProfilesValueSnapshot } from "@/stateV2/profile";
import { ImportOutlined } from "@ant-design/icons";
import { App, Button, Modal } from "antd";
import { useRef, useState } from "react";
import PreviewStep from "./PreviewStep";

const ImportChatRecord = () => {
	const { message } = App.useApp();
	const inputRef = useRef<HTMLInputElement>(null);
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

	const handleFilesSelected = async (files: FileList | null) => {
		if (!files?.length) return;
		try {
			const content = await readSelectedFiles(files);
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
		} catch (error) {
			message.error(error instanceof Error ? error.message : "读取失败");
		} finally {
			// 清空，否则连续选同一个文件夹不会触发 change
			if (inputRef.current) inputRef.current.value = "";
		}
	};

	return (
		<>
			<Button icon={<ImportOutlined />} onClick={() => inputRef.current?.click()}>
				导入聊天记录
			</Button>
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
			<Modal
				open={open}
				title="导入聊天记录"
				width={720}
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
