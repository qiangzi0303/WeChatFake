/**
 * 从用户选择的 .eml 文件里解出聊天记录文本和附件。
 *
 * QQ 邮箱「导出聊天记录」会生成一个 .eml（MIME 邮件）：
 *   - 一个 text/plain 部分（base64 编码）是聊天正文，格式与 txt 导出完全一致，
 *     图片在正文里写作「[图片: 文件名(请在附件中查看)]」。
 *   - 若干 application/octet-stream 附件部分（base64 编码），filename 即正文引用的文件名。
 *
 * 本模块在前端手动解析 MIME（不依赖原生/第三方邮件库），产出与目录导入
 * 完全一致的 IFolderContent，接回同一条解析/导入链路。
 */

import { isImageFile } from "./importer";
import type { IFolderContent } from "./readFolder";

/** 判断文件是不是 eml（按扩展名，大小写不敏感） */
export const isEmlFile = (name: string) => name.toLowerCase().endsWith(".eml");

/** 解析一段 MIME header 文本（含折行续行）成小写键的字典 */
const parseHeaders = (headerText: string): Record<string, string> => {
	// 续行：以空格或 Tab 开头的行拼接到上一行
	const unfolded = headerText.replace(/\r?\n[ \t]+/g, " ");
	const result: Record<string, string> = {};
	for (const line of unfolded.split(/\r?\n/)) {
		const idx = line.indexOf(":");
		if (idx < 0) continue;
		const key = line.slice(0, idx).trim().toLowerCase();
		result[key] = line.slice(idx + 1).trim();
	}
	return result;
};

/** 从 Content-Type 里取 boundary */
const getBoundary = (contentType: string): string | undefined => {
	const m = contentType.match(/boundary="?([^";]+)"?/i);
	return m?.[1];
};

/** 从 header 里取 filename（支持 Content-Disposition 和 Content-Type 的 name） */
const getFilename = (headers: Record<string, string>): string | undefined => {
	const source = `${headers["content-disposition"] ?? ""};${headers["content-type"] ?? ""}`;
	const m = source.match(/(?:filename|name)\*?="?([^";]+)"?/i);
	return m?.[1]?.trim();
};

/** base64 解码为字节数组（忽略换行与空白） */
const base64ToBytes = (b64: string): Uint8Array => {
	const clean = b64.replace(/[^A-Za-z0-9+/=]/g, "");
	const binary = atob(clean);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
	return bytes;
};

/** base64（utf-8 文本）解码为字符串 */
const base64ToText = (b64: string): string => {
	const bytes = base64ToBytes(b64);
	return new TextDecoder("utf-8").decode(bytes);
};

interface IMimePart {
	headers: Record<string, string>;
	body: string;
}

/**
 * 按 boundary 把一段 multipart 正文切成若干子部分。
 * 返回每个子部分的「原始文本」（含它自己的 header + 空行 + body）。
 */
const splitByBoundary = (content: string, boundary: string): string[] => {
	const delimiter = `--${boundary}`;
	const segments = content.split(delimiter);
	// 首段是前导说明、末段是收尾（--boundary--），都丢弃
	return segments
		.slice(1, -1)
		.map((seg) => seg.replace(/^\r?\n/, "").replace(/\r?\n$/, ""));
};

/** 把一段「header + 空行 + body」拆成 part */
const parsePart = (raw: string): IMimePart => {
	const sepMatch = raw.match(/\r?\n\r?\n/);
	if (!sepMatch) return { headers: {}, body: raw };
	const splitAt = sepMatch.index ?? 0;
	const headerText = raw.slice(0, splitAt);
	const body = raw.slice(splitAt + sepMatch[0].length);
	return { headers: parseHeaders(headerText), body };
};

/**
 * 递归遍历 MIME 树，收集所有「叶子」part（非 multipart）。
 */
const collectLeafParts = (part: IMimePart): IMimePart[] => {
	const contentType = part.headers["content-type"] ?? "";
	const boundary = getBoundary(contentType);
	if (contentType.toLowerCase().startsWith("multipart/") && boundary) {
		const children = splitByBoundary(part.body, boundary);
		return children.flatMap((child) => collectLeafParts(parsePart(child)));
	}
	return [part];
};

/**
 * 读取一个 .eml File，产出与目录导入一致的 IFolderContent。
 */
export const readEmlFile = async (file: File): Promise<IFolderContent> => {
	const raw = await file.text();
	const root = parsePart(raw);
	const leaves = collectLeafParts(root);

	// 聊天正文：取第一个 text/plain
	const textPart = leaves.find((p) =>
		(p.headers["content-type"] ?? "").toLowerCase().includes("text/plain"),
	);
	if (!textPart) {
		throw new Error("这个 .eml 里没有找到聊天记录正文（text/plain）");
	}

	const textEncoding = (textPart.headers["content-transfer-encoding"] ?? "").toLowerCase();
	const text =
		textEncoding === "base64" ? base64ToText(textPart.body) : textPart.body;

	// 附件：所有带 filename 且是图片的 part
	const attachments: Record<string, File> = {};
	for (const part of leaves) {
		if (part === textPart) continue;
		const name = getFilename(part.headers);
		if (!name || !isImageFile(name)) continue;
		if (attachments[name]) continue;
		const encoding = (part.headers["content-transfer-encoding"] ?? "").toLowerCase();
		if (encoding !== "base64") continue;
		const bytes = base64ToBytes(part.body);
		attachments[name] = new File([bytes as BlobPart], name);
	}

	return {
		text,
		textFileName: file.name,
		attachments,
	};
};
