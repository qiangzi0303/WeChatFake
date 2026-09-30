/**
 * 聊天记录导入的执行层。
 *
 * 负责三件有副作用的事：
 * 1. 把附件图片算 MD5 存进 IndexedDB
 * 2. 确保说话人在联系人列表里存在
 * 3. 写入会话消息 + 对话列表
 */

import { hashAssetsDB } from "@/db";
import { MYSELF_ID } from "@/faker/wechat/user";
import { generateFakeUser } from "@/faker/wechat/user/generator";
import { setConversationListValue } from "@/stateV2/conversation";
import { getDialogueListValueSnapshot, setDialogueListValue } from "@/stateV2/dialogueList";
import {
	type IStateProfile,
	getAllProfilesValueSnapshot,
	setAllProfilesValue,
	setProfileValue,
} from "@/stateV2/profile";
import { getFileMD5 } from "@/utils";
import { nanoid } from "nanoid";
import type { IParseResult, IParsedMessage } from "./parser";
import { formatDialogueTime, summarizeMessage, transformToConversationList } from "./transform";

/** 图片类附件的扩展名 */
const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp", "bmp"];

export const isImageFile = (name: string) => {
	const ext = name.split(".").pop()?.toLowerCase();
	return !!ext && IMAGE_EXTENSIONS.includes(ext);
};

export interface IImportPayload {
	parseResult: IParseResult;
	/** 附件文件，key 是文件名 */
	attachments: Record<string, File>;
	/** 哪个昵称是「我」 */
	myselfSpeaker: string;
	/** 哪个昵称是对方 */
	friendSpeaker: string;
	/** 对方要落到哪个联系人上，不传则新建 */
	targetFriendId?: IStateProfile["id"];
	/** 转账默认金额 */
	transferAmount?: string;
	/** 红包默认金额 */
	redPacketAmount?: string;
	/** 是否覆盖该联系人已有的聊天记录 */
	overwrite?: boolean;
}

export interface IImportResult {
	friendId: IStateProfile["id"];
	friendName: string;
	messageCount: number;
	imageCount: number;
	/** 附件在 txt 里被引用但文件夹里找不到的文件名 */
	missingAttachments: string[];
}

/** 把用到的附件存进 IndexedDB，返回「文件名 -> MD5」映射 */
const saveAttachments = async (messages: IParsedMessage[], attachments: Record<string, File>) => {
	const hashMap: Record<string, string> = {};
	const missing: string[] = [];

	const usedNames = Array.from(
		new Set(messages.map((v) => v.attachmentName).filter((v): v is string => !!v)),
	);

	for (const name of usedNames) {
		const file = attachments[name];
		if (!file) {
			missing.push(name);
			continue;
		}
		if (!isImageFile(name)) continue;
		const hash = await getFileMD5(file);
		await hashAssetsDB.images.put({ id: hash, file });
		hashMap[name] = hash;
	}

	return { hashMap, missing };
};

/** 找到或创建对方联系人，返回其 id */
const resolveFriendProfile = (friendSpeaker: string, targetFriendId?: IStateProfile["id"]) => {
	const allProfiles = getAllProfilesValueSnapshot();

	if (targetFriendId) {
		const existed = allProfiles.find((v) => v.id === targetFriendId);
		if (existed) {
			// 用导出记录里的昵称补一个备注，方便识别这段记录的来源
			if (!existed.remark && existed.nickname !== friendSpeaker) {
				setProfileValue(targetFriendId, (prev) => ({ ...prev, remark: friendSpeaker }));
			}
			return targetFriendId;
		}
	}

	const sameNickname = allProfiles.find(
		(v) => v.id !== MYSELF_ID && (v.remark === friendSpeaker || v.nickname === friendSpeaker),
	);
	if (sameNickname) return sameNickname.id;

	const profile = generateFakeUser({
		nickname: friendSpeaker,
		createdByFaker: true,
	});
	setAllProfilesValue((prev) => [...prev, profile]);
	return profile.id;
};

/** 更新对话列表里的那一条，没有则新建 */
const upsertDialogue = (friendId: IStateProfile["id"], lastMessage: IParsedMessage | undefined) => {
	const summary = lastMessage ? summarizeMessage(lastMessage) : "";
	const time = lastMessage ? formatDialogueTime(lastMessage.timestamp) : "";
	const existed = getDialogueListValueSnapshot().find((v) => v.friendId === friendId);

	if (existed) {
		setDialogueListValue((prev) =>
			prev.map((v) =>
				v.id === existed.id ? { ...v, lastMessage: summary, lastMessageTime: time } : v,
			),
		);
		return;
	}

	setDialogueListValue((prev) => [
		{
			id: nanoid(8),
			friendId,
			lastMessage: summary,
			lastMessageTime: time,
		},
		...prev,
	]);
};

/** 执行导入 */
export const importChatRecord = async (payload: IImportPayload): Promise<IImportResult> => {
	const {
		parseResult,
		attachments,
		myselfSpeaker,
		friendSpeaker,
		targetFriendId,
		transferAmount,
		redPacketAmount,
		overwrite = true,
	} = payload;

	const { messages } = parseResult;

	const { hashMap, missing } = await saveAttachments(messages, attachments);
	const friendId = resolveFriendProfile(friendSpeaker, targetFriendId);

	const conversationList = transformToConversationList(messages, {
		myselfSpeaker,
		friendSpeaker,
		attachmentHashMap: hashMap,
		defaultTransferAmount: transferAmount,
		defaultRedPacketAmount: redPacketAmount,
	});

	setConversationListValue(friendId, (prev) =>
		overwrite ? conversationList : [...prev, ...conversationList],
	);
	upsertDialogue(friendId, messages[messages.length - 1]);

	return {
		friendId,
		friendName: friendSpeaker,
		messageCount: conversationList.length,
		imageCount: Object.keys(hashMap).length,
		missingAttachments: missing,
	};
};
