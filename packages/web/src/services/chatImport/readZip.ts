/**
 * 从用户选择的 .zip 文件里解出聊天记录文本和附件。
 *
 * 微信导出的聊天记录常常是一个 zip：里面有「聊天记录.txt」和一个
 * 附件夹（图片等）。本模块用 fflate 在前端/WebView 内解压，产出与
 * readFolder 完全一致的 IFolderContent，接回同一条导入链路。
 *
 * 为什么在前端解压：Android 端没有 webkitdirectory 选目录那么顺手，
 * 让用户直接选一个 zip 文件，再在 app 内解压，交互最简单，且不依赖
 * 原生插件，Capacitor 的 WebView 里 fflate 可直接运行。
 */

import { unzipSync } from "fflate";

import { isImageFile } from "./importer";
import { type IFolderContent, readAsText } from "./readFolder";

/** 从 zip 内的条目路径里取出不含目录的文件名 */
const basename = (path: string) => path.split(/[\\/]/).pop() ?? path;

/** zip 内常见的无关条目：macOS 的 __MACOSX、各类隐藏文件 */
const isJunkEntry = (path: string) => {
	const name = basename(path);
	return (
		path.startsWith("__MACOSX/") ||
		name === ".DS_Store" ||
		name === "Thumbs.db" ||
		name.startsWith("._")
	);
};

/** 微信导出的文本文件名通常含「聊天记录」，兜底取任意 txt */
const pickRecordEntry = (names: string[]) => {
	const txtNames = names.filter((v) => v.toLowerCase().endsWith(".txt"));
	if (!txtNames.length) return undefined;
	return txtNames.find((v) => basename(v).includes("聊天记录")) ?? txtNames[0];
};

/** 判断文件是不是 zip（按扩展名，大小写不敏感） */
export const isZipFile = (name: string) => name.toLowerCase().endsWith(".zip");

/**
 * 解压一个 zip File，产出与目录导入一致的 IFolderContent。
 */
export const readZipFile = async (zip: File): Promise<IFolderContent> => {
	const buffer = new Uint8Array(await zip.arrayBuffer());

	let entries: Record<string, Uint8Array>;
	try {
		// 只需要文本和图片，目录等条目由 filter 跳过以省内存
		entries = unzipSync(buffer, {
			filter: (file) =>
				!file.name.endsWith("/") &&
				!isJunkEntry(file.name) &&
				(file.name.toLowerCase().endsWith(".txt") || isImageFile(basename(file.name))),
		});
	} catch {
		throw new Error("压缩包解压失败，请确认是有效的 .zip 文件");
	}

	const names = Object.keys(entries);
	const recordName = pickRecordEntry(names);
	if (!recordName) {
		throw new Error("压缩包里没有找到聊天记录的 txt 文件");
	}

	// 把解出的字节包成 File，复用既有的编码探测与附件入库逻辑
	const attachments: Record<string, File> = {};
	for (const name of names) {
		if (name === recordName) continue;
		const base = basename(name);
		if (!isImageFile(base)) continue;
		if (attachments[base]) continue;
		const bytes = entries[name];
		attachments[base] = new File([bytes as BlobPart], base);
	}

	const recordBytes = entries[recordName];
	const recordFile = new File([recordBytes as BlobPart], basename(recordName));
	const text = await readAsText(recordFile);

	return {
		text,
		textFileName: basename(recordName),
		attachments,
	};
};
