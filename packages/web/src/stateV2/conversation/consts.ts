import { EConversationType, type TConversationItem } from "./typing";

export const ConversationTypeLabel = {
	[EConversationType.text]: "文本",
	[EConversationType.image]: "图片",
	[EConversationType.transfer]: "转账",
	[EConversationType.redPacket]: "红包",
	[EConversationType.personalCard]: "个人名片",
	[EConversationType.voice]: "语音消息",
	[EConversationType.video]: "视频",
	[EConversationType.centerText]: "居中文本",
	[EConversationType.redPacketAcceptedReply]: "红包领取成功消息",
};

// 新会话默认不预置任何聊天记录，保持干净的空会话。
// 注意：已存在 IndexedDB 的老会话不受影响（atomWithStorage 仅在首次无存储时取此默认值）。
export const MOCK_INIT_CONVERSATION_LIST: TConversationItem[] = [];
