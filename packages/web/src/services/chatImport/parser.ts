/**
 * 微信聊天记录导出文件解析器
 *
 * 支持的导出格式为三行一组、空行分隔：
 * ```
 * ·昵称
 * 2026年09月17日 10:05
 * 消息内容
 * ```
 * 消息内容可能是纯文本，也可能是 `[图片] 文件名` 这类带标记的特殊消息。
 */

/** 解析出来的原始消息类型 */
export enum EParsedMessageType {
	text = "text",
	image = "image",
	video = "video",
	voice = "voice",
	transfer = "transfer",
	redPacket = "redPacket",
	/** 语音/视频通话等系统提示，渲染为居中灰字 */
	system = "system",
	/** 表情等无需处理的消息，解析时直接丢弃 */
	ignore = "ignore",
}

export interface IParsedMessage {
	/** 在原文件中的序号，从 0 开始 */
	index: number;
	/** 发送者昵称（已去掉前缀 ·） */
	speaker: string;
	/** 消息时间戳（毫秒） */
	timestamp: number;
	/** 原始时间文本 */
	rawTime: string;
	type: EParsedMessageType;
	/** 纯文本内容，或系统提示文案 */
	content: string;
	/** 附件文件名，图片/视频/语音可能有 */
	attachmentName?: string;
	/** 语音时长（秒） */
	duration?: number;
}

export interface IParseResult {
	messages: IParsedMessage[];
	/** 出现过的所有昵称，按首次出现顺序 */
	speakers: string[];
	/** 无法解析的行，用于提示用户 */
	warnings: string[];
}

/** 形如 `2026年09月17日 10:05` 或 `2026-09-17 10:05:30` */
const TIME_PATTERNS = [
	/^(\d{4})年(\d{1,2})月(\d{1,2})日\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/,
	/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/,
];

/** 内容行里的类型标记，按优先级顺序匹配 */
const CONTENT_MARKERS: {
	pattern: RegExp;
	type: EParsedMessageType;
	/** 从匹配结果里取出附加信息 */
	pick?: (matched: RegExpMatchArray) => Partial<IParsedMessage>;
}[] = [
	{
		// 另一种导出写法：[图片: 文件名(请在附件中查看)]
		pattern: /^\[图片:\s*(.+?)(?:\s*[(（]请在附件中查看[)）])?\]$/,
		type: EParsedMessageType.image,
		pick: (m) => ({ attachmentName: m[1].trim() || undefined }),
	},
	{
		// 另一种导出写法：[视频: 文件名(请在附件中查看)]
		pattern: /^\[视频:\s*(.+?)(?:\s*[(（]请在附件中查看[)）])?\]$/,
		type: EParsedMessageType.video,
		pick: (m) => ({ attachmentName: m[1].trim() || undefined }),
	},
	{
		pattern: /^\[图片\]\s*(.*)$/,
		type: EParsedMessageType.image,
		pick: (m) => ({ attachmentName: m[1].trim() || undefined }),
	},
	{
		pattern: /^\[视频\]\s*(.*)$/,
		type: EParsedMessageType.video,
		pick: (m) => ({ attachmentName: m[1].trim() || undefined }),
	},
	{
		// [语音] 5" 形式，秒数可能缺失
		pattern: /^\[语音\]\s*(?:(\d+)\s*["″秒]?)?\s*(.*)$/,
		type: EParsedMessageType.voice,
		pick: (m) => ({
			duration: m[1] ? Number(m[1]) : undefined,
			attachmentName: m[2]?.trim() || undefined,
		}),
	},
	{ pattern: /^\[微信转账\]\s*(.*)$/, type: EParsedMessageType.transfer },
	{ pattern: /^\[转账\]\s*(.*)$/, type: EParsedMessageType.transfer },
	{ pattern: /^\[微信红包\]\s*(.*)$/, type: EParsedMessageType.redPacket },
	{ pattern: /^\[红包\]\s*(.*)$/, type: EParsedMessageType.redPacket },
];

/**
 * 需要渲染成居中系统提示的标记。
 * 这些类型在应用里没有对应的气泡组件，用居中灰字最接近真实微信的呈现。
 */
const SYSTEM_MARKERS: { pattern: RegExp; label: (rest: string) => string }[] = [
	{ pattern: /^\[语音通话\]\s*(.*)$/, label: (rest) => (rest ? `语音通话 ${rest}` : "语音通话") },
	{ pattern: /^\[视频通话\]\s*(.*)$/, label: (rest) => (rest ? `视频通话 ${rest}` : "视频通话") },
	{ pattern: /^\[小程序\]\s*(.*)$/, label: (rest) => (rest ? `小程序：${rest}` : "小程序") },
	{ pattern: /^\[位置\]\s*(.*)$/, label: (rest) => (rest ? `位置：${rest}` : "位置") },
	{ pattern: /^\[文件\]\s*(.*)$/, label: (rest) => (rest ? `文件：${rest}` : "文件") },
	{ pattern: /^\[链接\]\s*(.*)$/, label: (rest) => (rest ? `链接：${rest}` : "链接") },
	{ pattern: /^\[动画表情\]\s*(.*)$/, label: () => "动画表情" },
	{ pattern: /^\[名片\]\s*(.*)$/, label: (rest) => (rest ? `名片：${rest}` : "名片") },
];

/**
 * 需要直接忽略、不生成任何消息的标记。
 * 微信动画表情导出成文本后只剩 `[表情]`，没有可还原的素材，按用户要求整条丢弃。
 */
const IGNORE_MARKERS: RegExp[] = [
	/^\[表情\]$/,
	/^\[表情[:：].*\]$/,
	/^\[动画表情\]$/,
];

/** 解析单条消息的内容行 */
export const parseContentLine = (
	raw: string,
): Pick<IParsedMessage, "type" | "content" | "attachmentName" | "duration"> => {
	const line = raw.trim();

	for (const pattern of IGNORE_MARKERS) {
		if (pattern.test(line)) {
			return { type: EParsedMessageType.ignore, content: "" };
		}
	}

	for (const marker of CONTENT_MARKERS) {
		const matched = line.match(marker.pattern);
		if (!matched) continue;
		return {
			type: marker.type,
			content: "",
			...marker.pick?.(matched),
		};
	}

	for (const marker of SYSTEM_MARKERS) {
		const matched = line.match(marker.pattern);
		if (!matched) continue;
		return {
			type: EParsedMessageType.system,
			content: marker.label(matched[1]?.trim() ?? ""),
		};
	}

	// 未知的 [xxx] 标记统一降级成系统提示，避免把标记当正文显示
	const unknownMarker = line.match(/^\[([^\]]+)\]\s*(.*)$/);
	if (unknownMarker) {
		const [, name, rest] = unknownMarker;
		return {
			type: EParsedMessageType.system,
			content: rest ? `${name}：${rest}` : name,
		};
	}

	return { type: EParsedMessageType.text, content: line };
};

/** 昵称行形如 `·强子`，前缀可能是 ·、•、· 等多种间隔号 */
const SPEAKER_PREFIX = /^[·•‧・]\s*(.+)$/;

/** 判断某一行是否是昵称行，是则返回去掉前缀的昵称 */
export const parseSpeakerLine = (line: string): string | undefined => {
	const matched = line.trim().match(SPEAKER_PREFIX);
	const name = matched?.[1]?.trim();
	return name || undefined;
};

/**
 * 另一种导出格式的日期分隔行，形如：`————— 2020-03-11 —————`
 * 破折号数量、全角/半角、前后空格都可能有出入，用宽松匹配。
 */
const DATE_DIVIDER = /^[—\-－\s]*(\d{4})[-/年](\d{1,2})[-/月](\d{1,2})日?[—\-－\s]*$/;

/**
 * 另一种导出格式的消息头行，形如：`郝正佳 11:54`
 * 昵称 + 空格 + 时分（可带秒）。昵称里可能含空格，故时间锚在行尾。
 */
const INLINE_HEADER = /^(.+?)\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/;

/**
 * 判断文本是否为「日期分隔行 + 昵称 时间」这种导出格式。
 * 命中条件：存在至少一条日期分隔行，且存在至少一条行内消息头。
 */
const isInlineHeaderFormat = (lines: string[]): boolean => {
	let hasDivider = false;
	let hasHeader = false;
	for (const raw of lines) {
		const line = raw.trim();
		if (!line) continue;
		if (DATE_DIVIDER.test(line)) hasDivider = true;
		else if (INLINE_HEADER.test(line)) hasHeader = true;
		if (hasDivider && hasHeader) return true;
	}
	return false;
};

/**
 * 解析「日期分隔行 + `昵称 时间` + 空行 + 内容」这种导出格式。
 *
 * 日期来自最近的分隔行，消息头只带时分；内容在消息头之后，
 * 直到下一个消息头或日期分隔行之前（支持多行、跳过空行）。
 */
const parseInlineHeaderFormat = (lines: string[]): IParseResult => {
	const messages: IParsedMessage[] = [];
	const speakers: string[] = [];
	const warnings: string[] = [];

	let index = 0;
	let cursor = 0;
	// 当前上下文日期，缺省用今天兜底
	let curY = new Date().getFullYear();
	let curM = 1;
	let curD = 1;
	let hasDate = false;

	while (cursor < lines.length) {
		const line = lines[cursor].trim();
		if (!line) {
			cursor += 1;
			continue;
		}

		const dateMatch = line.match(DATE_DIVIDER);
		if (dateMatch) {
			curY = Number(dateMatch[1]);
			curM = Number(dateMatch[2]);
			curD = Number(dateMatch[3]);
			hasDate = true;
			cursor += 1;
			continue;
		}

		const header = line.match(INLINE_HEADER);
		if (!header) {
			warnings.push(`第 ${cursor + 1} 行无法识别，已跳过：${line.slice(0, 40)}`);
			cursor += 1;
			continue;
		}

		const speaker = header[1].trim();
		const hour = Number(header[2]);
		const minute = Number(header[3]);
		const second = header[4] ? Number(header[4]) : 0;
		const rawTime = hasDate
			? `${curY}-${String(curM).padStart(2, "0")}-${String(curD).padStart(2, "0")} ${header[2]}:${header[3]}`
			: `${header[2]}:${header[3]}`;
		const timestamp = new Date(curY, curM - 1, curD, hour, minute, second).getTime();

		// 收集正文：消息头之后，遇到下一条消息头或日期分隔行停止
		const contentLines: string[] = [];
		let contentCursor = cursor + 1;
		while (contentCursor < lines.length) {
			const contentLine = lines[contentCursor];
			const trimmed = contentLine.trim();
			if (!trimmed) {
				contentCursor += 1;
				continue;
			}
			if (DATE_DIVIDER.test(trimmed) || INLINE_HEADER.test(trimmed)) break;
			contentLines.push(contentLine);
			contentCursor += 1;
		}

		// 没有任何正文（极少见），跳过这条头
		if (!contentLines.length) {
			cursor = contentCursor;
			continue;
		}

		if (!speakers.includes(speaker)) speakers.push(speaker);

		const parsed = parseContentLine(contentLines[0]);
		// 表情等忽略类型直接丢弃，不生成消息
		if (parsed.type === EParsedMessageType.ignore) {
			cursor = contentCursor;
			continue;
		}
		const content =
			parsed.type === EParsedMessageType.text
				? contentLines.map((v) => v.trim()).join("\n")
				: parsed.content;

		messages.push({
			index,
			speaker,
			timestamp,
			rawTime,
			...parsed,
			content,
		});
		index += 1;
		cursor = contentCursor;
	}

	return { messages, speakers, warnings };
};

/**
 * 解析整个聊天记录文件。
 *
 * 先自动识别导出格式：
 * - 「日期分隔行 + `昵称 时间` + 内容」走 parseInlineHeaderFormat；
 * - 否则按默认的「以时间行为锚点」策略解析（`·昵称` + 完整时间 + 内容）。
 *
 * 默认策略不死板地三行一组：时间行格式最固定、最不容易误判，
 * 它的上一行是昵称，下面直到空行或下一条消息昵称行之前都算正文（支持多行）。
 */
export const parseChatRecord = (rawText: string): IParseResult => {
	// 去掉 BOM，统一换行符
	const text = rawText.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
	const lines = text.split("\n");

	// 行内消息头格式单独处理
	if (isInlineHeaderFormat(lines)) {
		return parseInlineHeaderFormat(lines);
	}

	const messages: IParsedMessage[] = [];
	const speakers: string[] = [];
	const warnings: string[] = [];

	let index = 0;
	let cursor = 0;

	while (cursor < lines.length) {
		const line = lines[cursor];

		if (!line.trim()) {
			cursor += 1;
			continue;
		}

		const speaker = parseSpeakerLine(line);
		if (!speaker) {
			warnings.push(`第 ${cursor + 1} 行无法识别，已跳过：${line.trim().slice(0, 40)}`);
			cursor += 1;
			continue;
		}

		const rawTime = lines[cursor + 1]?.trim() ?? "";
		const timestamp = parseTimeLine(rawTime);
		if (timestamp === undefined) {
			warnings.push(`第 ${cursor + 2} 行时间格式无法识别，该条消息已跳过：${rawTime.slice(0, 40)}`);
			cursor += 1;
			continue;
		}

		// 收集正文：从时间行之后开始，遇到空行或下一条消息的昵称行停止
		const contentLines: string[] = [];
		let contentCursor = cursor + 2;
		while (contentCursor < lines.length) {
			const contentLine = lines[contentCursor];
			if (!contentLine.trim()) break;
			// 下一行是昵称且再下一行是时间，说明新消息开始了
			if (
				parseSpeakerLine(contentLine) &&
				parseTimeLine(lines[contentCursor + 1]?.trim() ?? "") !== undefined
			) {
				break;
			}
			contentLines.push(contentLine);
			contentCursor += 1;
		}

		if (!speakers.includes(speaker)) speakers.push(speaker);

		const parsed = parseContentLine(contentLines[0] ?? "");
		// 表情等忽略类型直接丢弃，不生成消息
		if (parsed.type === EParsedMessageType.ignore) {
			cursor = contentCursor;
			continue;
		}
		// 多行文本用换行拼回去，标记类消息只取第一行
		const content =
			parsed.type === EParsedMessageType.text
				? contentLines.map((v) => v.trim()).join("\n")
				: parsed.content;

		messages.push({
			index,
			speaker,
			timestamp,
			rawTime,
			...parsed,
			content,
		});
		index += 1;
		cursor = contentCursor;
	}

	return { messages, speakers, warnings };
};

/** 判断某一行是否是时间行，是则返回时间戳 */
export const parseTimeLine = (line: string): number | undefined => {
	for (const pattern of TIME_PATTERNS) {
		const matched = line.trim().match(pattern);
		if (!matched) continue;
		const [, year, month, day, hour, minute, second] = matched;
		const date = new Date(
			Number(year),
			Number(month) - 1,
			Number(day),
			Number(hour),
			Number(minute),
			second ? Number(second) : 0,
		);
		const time = date.getTime();
		if (!Number.isNaN(time)) return time;
	}
	return undefined;
};
