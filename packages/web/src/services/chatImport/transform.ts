/**
 * 把解析出来的原始消息转换成应用内的状态结构。
 *
 * 这里只做纯数据转换，不碰 IndexedDB 和 jotai，便于单独验证。
 */

import {
	EConversationType,
	type TConversationItem,
	type TConversationRole,
} from "@/stateV2/conversation";
import dayjs from "dayjs";
import { nanoid } from "nanoid";
import type { Descendant } from "slate";
import { EParsedMessageType, type IParsedMessage } from "./parser";

/** 相邻消息间隔超过这个分钟数时，才在气泡上方显示时间 */
export const UPPER_TEXT_GAP_MINUTES = 4;

export interface ITransformOptions {
	/** 哪个昵称算「我」，其余昵称都算对方 */
	myselfSpeaker: string;
	/** 对方昵称 */
	friendSpeaker: string;
	/** 附件文件名 -> 已存入 IndexedDB 的 MD5 */
	attachmentHashMap?: Record<string, string>;
	/** 转账默认金额，导出文件里没有金额信息 */
	defaultTransferAmount?: string;
	/** 红包默认金额 */
	defaultRedPacketAmount?: string;
	/** 语音缺少时长时的默认秒数 */
	defaultVoiceDuration?: number;
}

/** 把纯文本转成 slate 需要的结构，多行文本拆成多个段落 */
export const textToSlateValue = (text: string): Descendant[] => {
	const lines = text.split("\n");
	return lines.map((line) => ({
		type: "paragraph" as const,
		children: [{ text: line }],
	}));
};

/**
 * 按真实微信的规则生成气泡上方的时间文本：
 * 今天只显示时分，昨天加「昨天」，一周内显示星期，更早显示日期。
 */
export const formatUpperText = (timestamp: number, now = dayjs()) => {
	const target = dayjs(timestamp);
	if (target.isSame(now, "day")) return target.format("HH:mm");
	if (target.isSame(now.subtract(1, "day"), "day")) return `昨天 ${target.format("HH:mm")}`;
	if (now.diff(target, "day") < 7) {
		const weekdays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
		return `${weekdays[target.day()]} ${target.format("HH:mm")}`;
	}
	if (target.isSame(now, "year")) return target.format("M月D日 HH:mm");
	return target.format("YYYY年M月D日 HH:mm");
};

/** 列表里「最后一条消息」的摘要文本 */
export const summarizeMessage = (message: IParsedMessage): string => {
	switch (message.type) {
		case EParsedMessageType.text:
			return message.content.replace(/\n/g, " ");
		case EParsedMessageType.image:
			return "[图片]";
		case EParsedMessageType.video:
			return "[视频]";
		case EParsedMessageType.voice:
			return "[语音]";
		case EParsedMessageType.transfer:
			return "[转账]";
		case EParsedMessageType.redPacket:
			return "[红包]";
		default:
			return message.content || "[消息]";
	}
};

/** 对话列表里显示的时间，比气泡上方的更简短 */
export const formatDialogueTime = (timestamp: number, now = dayjs()) => {
	const target = dayjs(timestamp);
	if (target.isSame(now, "day")) return target.format("HH:mm");
	if (target.isSame(now.subtract(1, "day"), "day")) return "昨天";
	if (now.diff(target, "day") < 7) {
		const weekdays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
		return weekdays[target.day()];
	}
	return target.format("YYYY/M/D");
};

/**
 * 把解析结果转换成会话消息数组。
 *
 * 时间显示遵循真实微信的习惯：不是每条都带时间，
 * 只有第一条以及与上一条间隔超过 UPPER_TEXT_GAP_MINUTES 分钟的才显示。
 */
export const transformToConversationList = (
	messages: IParsedMessage[],
	options: ITransformOptions,
): TConversationItem[] => {
	const {
		myselfSpeaker,
		attachmentHashMap = {},
		defaultTransferAmount = "0.00",
		defaultRedPacketAmount = "0.00",
		defaultVoiceDuration = 2,
	} = options;

	const result: TConversationItem[] = [];
	let lastTimestamp: number | undefined;

	for (const message of messages) {
		const role: TConversationRole = message.speaker === myselfSpeaker ? "mine" : "friend";
		const needUpperText =
			lastTimestamp === undefined ||
			dayjs(message.timestamp).diff(lastTimestamp, "minute") >= UPPER_TEXT_GAP_MINUTES;
		const upperText = needUpperText ? formatUpperText(message.timestamp) : undefined;
		lastTimestamp = message.timestamp;

		const base = {
			id: nanoid(8),
			role,
			upperText,
			sendTimestamp: message.timestamp,
		};

		switch (message.type) {
			case EParsedMessageType.text: {
				result.push({
					...base,
					type: EConversationType.text,
					textContent: textToSlateValue(message.content),
				});
				break;
			}
			case EParsedMessageType.image: {
				const hash = message.attachmentName
					? attachmentHashMap[message.attachmentName]
					: undefined;
				if (hash) {
					result.push({ ...base, type: EConversationType.image, imageInfo: hash });
				} else {
					// 找不到对应图片文件时降级成系统提示，避免出现破图
					result.push({
						...base,
						type: EConversationType.centerText,
						simpleContent: "图片",
					});
				}
				break;
			}
			case EParsedMessageType.video: {
				const hash = message.attachmentName
					? attachmentHashMap[message.attachmentName]
					: undefined;
				if (hash) {
					result.push({ ...base, type: EConversationType.video, videoInfo: hash });
				} else {
					result.push({
						...base,
						type: EConversationType.centerText,
						simpleContent: "视频",
					});
				}
				break;
			}
			case EParsedMessageType.voice: {
				result.push({
					...base,
					type: EConversationType.voice,
					duration: message.duration ?? defaultVoiceDuration,
					isRead: true,
					showStt: false,
				});
				break;
			}
			case EParsedMessageType.transfer: {
				result.push({
					...base,
					type: EConversationType.transfer,
					originalSender: role,
					transferStatus: "accepted",
					amount: defaultTransferAmount,
				});
				break;
			}
			case EParsedMessageType.redPacket: {
				result.push({
					...base,
					type: EConversationType.redPacket,
					originalSender: role,
					redPacketStatus: "accepted",
					amount: defaultRedPacketAmount,
				});
				break;
			}
			default: {
				result.push({
					...base,
					type: EConversationType.centerText,
					simpleContent: message.content,
				});
				break;
			}
		}
	}

	return result;
};
