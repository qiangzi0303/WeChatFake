/**
 * 从用户选择的目录里挑出聊天记录文本和附件。
 *
 * 不依赖绝对路径，靠 input[webkitdirectory] 拿到的 FileList 工作，
 * 浏览器和 Android WebView 都支持。
 */

import { isImageFile } from "./importer";

export interface IFolderContent {
	/** 聊天记录文本内容 */
	text: string;
	/** 文本文件名，用于界面显示 */
	textFileName: string;
	/** 附件，key 是不带路径的文件名 */
	attachments: Record<string, File>;
}

/** 从文件名里取出不含目录的部分 */
const basename = (path: string) => path.split(/[\\/]/).pop() ?? path;

/** 微信导出的文本文件名通常含「聊天记录」，兜底取任意 txt */
const pickRecordFile = (files: File[]) => {
	const txtFiles = files.filter((v) => v.name.toLowerCase().endsWith(".txt"));
	if (!txtFiles.length) return undefined;
	return txtFiles.find((v) => v.name.includes("聊天记录")) ?? txtFiles[0];
};

/**
 * 读取文本并处理编码。
 * 微信导出可能是 UTF-8 也可能是 GBK，先按 UTF-8 解，
 * 出现替换字符（U+FFFD）说明猜错了，再退回 GBK。
 */
export const readAsText = async (file: File): Promise<string> => {
	const buffer = await file.arrayBuffer();

	const utf8 = new TextDecoder("utf-8").decode(buffer);
	if (!utf8.includes("\uFFFD")) return utf8;

	try {
		const gbk = new TextDecoder("gbk").decode(buffer);
		if (!gbk.includes("\uFFFD")) return gbk;
		// 两种都有乱码时，取乱码更少的那个
		const utf8Bad = (utf8.match(/\uFFFD/g) ?? []).length;
		const gbkBad = (gbk.match(/\uFFFD/g) ?? []).length;
		return gbkBad < utf8Bad ? gbk : utf8;
	} catch {
		// 少数环境不支持 gbk 解码器
		return utf8;
	}
};

/**
 * 读取用户选中的文件列表。
 * 既支持选整个文件夹，也支持只选一个 txt 加若干图片。
 */
export const readSelectedFiles = async (fileList: FileList | File[]): Promise<IFolderContent> => {
	const files = Array.from(fileList);
	if (!files.length) throw new Error("没有选择任何文件");

	const recordFile = pickRecordFile(files);
	if (!recordFile) {
		throw new Error("没有找到聊天记录的 txt 文件，请选择微信导出的整个文件夹");
	}

	const attachments: Record<string, File> = {};
	for (const file of files) {
		if (file === recordFile) continue;
		const name = basename(file.name);
		if (!isImageFile(name)) continue;
		// 同名文件后出现的不覆盖先出现的，保持与 txt 引用一致
		if (!attachments[name]) attachments[name] = file;
	}

	const text = await readAsText(recordFile);

	return {
		text,
		textFileName: basename(recordFile.name),
		attachments,
	};
};
