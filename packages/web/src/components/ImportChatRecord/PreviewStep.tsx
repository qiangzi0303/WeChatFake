import { MYSELF_ID } from "@/faker/wechat/user";
import type { IFolderContent, IParseResult } from "@/services/chatImport";
import { EParsedMessageType, summarizeMessage } from "@/services/chatImport";
import type { IStateProfile } from "@/stateV2/profile";
import { Alert, Button, Checkbox, Form, Input, Radio, Select, Table, Tag } from "antd";
import dayjs from "dayjs";
import { useMemo, useState } from "react";

type Props = {
	folder: IFolderContent;
	parseResult: IParseResult;
	profiles: IStateProfile[];
	importing: boolean;
	onCancel: () => void;
	onConfirm: (config: {
		myselfSpeaker: string;
		friendSpeaker: string;
		targetFriendId?: string;
		transferAmount: string;
		redPacketAmount: string;
		overwrite: boolean;
	}) => void;
};

const TYPE_LABEL: Record<EParsedMessageType, string> = {
	[EParsedMessageType.text]: "文本",
	[EParsedMessageType.image]: "图片",
	[EParsedMessageType.video]: "视频",
	[EParsedMessageType.voice]: "语音",
	[EParsedMessageType.transfer]: "转账",
	[EParsedMessageType.redPacket]: "红包",
	[EParsedMessageType.system]: "系统提示",
	[EParsedMessageType.ignore]: "已忽略",
};

const PreviewStep = ({ folder, parseResult, profiles, importing, onCancel, onConfirm }: Props) => {
	const { messages, speakers, warnings } = parseResult;

	// 默认把出现次数少的一方当作「我」，通常导出方是对话主体
	const [myselfSpeaker, setMyselfSpeaker] = useState(speakers[0] ?? "");
	const [targetFriendId, setTargetFriendId] = useState<string>();
	const [transferAmount, setTransferAmount] = useState("0.00");
	const [redPacketAmount, setRedPacketAmount] = useState("0.00");
	const [overwrite, setOverwrite] = useState(true);

	const friendSpeaker = useMemo(
		() => speakers.find((v) => v !== myselfSpeaker) ?? myselfSpeaker,
		[speakers, myselfSpeaker],
	);

	const stats = useMemo(() => {
		const counter = new Map<EParsedMessageType, number>();
		for (const item of messages) {
			counter.set(item.type, (counter.get(item.type) ?? 0) + 1);
		}
		return Array.from(counter.entries());
	}, [messages]);

	const hasTransfer = messages.some((v) => v.type === EParsedMessageType.transfer);
	const hasRedPacket = messages.some((v) => v.type === EParsedMessageType.redPacket);

	const missingAttachments = useMemo(() => {
		const names = new Set(messages.map((v) => v.attachmentName).filter((v): v is string => !!v));
		return Array.from(names).filter((name) => !folder.attachments[name]);
	}, [messages, folder]);

	const friendOptions = profiles
		.filter((v) => v.id !== MYSELF_ID)
		.map((v) => ({
			value: v.id,
			label: v.remark ? `${v.remark}（${v.nickname}）` : v.nickname,
		}));

	return (
		<div className="space-y-4">
			<Alert
				type="info"
				showIcon
				message={
					<span>
						已读取 <b>{folder.textFileName}</b>，共解析出 <b>{messages.length}</b> 条消息， 附件{" "}
						<b>{Object.keys(folder.attachments).length}</b> 个
					</span>
				}
			/>

			<div className="space-x-1">
				{stats.map(([type, count]) => (
					<Tag key={type}>
						{TYPE_LABEL[type]} {count}
					</Tag>
				))}
			</div>

			{!!warnings.length && (
				<Alert
					type="warning"
					showIcon
					message={`有 ${warnings.length} 行未能识别，将被跳过`}
					description={
						<div className="max-h-24 overflow-auto text-xs">
							{warnings.map((v) => (
								<div key={v}>{v}</div>
							))}
						</div>
					}
				/>
			)}

			{!!missingAttachments.length && (
				<Alert
					type="warning"
					showIcon
					message={`有 ${missingAttachments.length} 个附件在文件夹里找不到，将显示为灰色提示文字`}
					description={
						<div className="max-h-24 overflow-auto text-xs">
							{missingAttachments.map((v) => (
								<div key={v}>{v}</div>
							))}
						</div>
					}
				/>
			)}

			<Form layout="vertical" size="small">
				<Form.Item label="哪一方是「我」" required>
					<Radio.Group
						value={myselfSpeaker}
						onChange={(ev) => setMyselfSpeaker(ev.target.value)}
						optionType="button"
						buttonStyle="solid"
						options={speakers.map((v) => ({ value: v, label: v }))}
					/>
				</Form.Item>

				<Form.Item label="对方导入到哪个联系人" extra={`留空则新建联系人「${friendSpeaker}」`}>
					<Select
						allowClear
						showSearch
						optionFilterProp="label"
						placeholder={`新建联系人「${friendSpeaker}」`}
						value={targetFriendId}
						onChange={setTargetFriendId}
						options={friendOptions}
					/>
				</Form.Item>

				{hasTransfer && (
					<Form.Item label="转账金额" extra="导出文件不含金额，统一填充为该值">
						<Input
							value={transferAmount}
							onChange={(ev) => setTransferAmount(ev.target.value)}
							prefix="¥"
						/>
					</Form.Item>
				)}

				{hasRedPacket && (
					<Form.Item label="红包金额" extra="导出文件不含金额，统一填充为该值">
						<Input
							value={redPacketAmount}
							onChange={(ev) => setRedPacketAmount(ev.target.value)}
							prefix="¥"
						/>
					</Form.Item>
				)}

				<Form.Item>
					<Checkbox checked={overwrite} onChange={(ev) => setOverwrite(ev.target.checked)}>
						覆盖该联系人已有的聊天记录
					</Checkbox>
				</Form.Item>
			</Form>

			<Table
				size="small"
				rowKey="index"
				dataSource={messages}
				pagination={{ pageSize: 8, size: "small" }}
				scroll={{ y: 240, x: "max-content" }}
				columns={[
					{
						title: "时间",
						dataIndex: "timestamp",
						width: 140,
						render: (v: number) => dayjs(v).format("MM-DD HH:mm"),
					},
					{
						title: "发送者",
						dataIndex: "speaker",
						width: 100,
						render: (v: string) => (
							<Tag color={v === myselfSpeaker ? "green" : "default"}>
								{v === myselfSpeaker ? `${v}（我）` : v}
							</Tag>
						),
					},
					{
						title: "类型",
						dataIndex: "type",
						width: 90,
						render: (v: EParsedMessageType) => TYPE_LABEL[v],
					},
					{
						title: "内容",
						render: (_, record) => (
							<span className="text-xs">
								{record.type === EParsedMessageType.text
									? record.content
									: summarizeMessage(record)}
								{record.attachmentName && (
									<span
										className={
											folder.attachments[record.attachmentName] ? "text-gray-400" : "text-red-400"
										}
									>
										{" "}
										{record.attachmentName}
									</span>
								)}
							</span>
						),
					},
				]}
			/>

			<div className="flex justify-end space-x-2">
				<Button onClick={onCancel} disabled={importing}>
					取消
				</Button>
				<Button
					type="primary"
					loading={importing}
					onClick={() =>
						onConfirm({
							myselfSpeaker,
							friendSpeaker,
							targetFriendId,
							transferAmount,
							redPacketAmount,
							overwrite,
						})
					}
				>
					开始导入
				</Button>
			</div>
		</div>
	);
};

export default PreviewStep;
