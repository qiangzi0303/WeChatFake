import { isAppMode } from "@/appMode";
import ADD_OUTLINED_SVG from "@/assets/add-outlined.svg?react";
import ALBUM_OUTLINED_SVG from "@/assets/album-outlined.svg?react";
import ARROW_OUTLINED_SVG from "@/assets/arrow-outlined.svg?react";
import CARDS_SVG from "@/assets/cards.svg?react";
import FAVORITES_SVG from "@/assets/favorites.svg?react";
import PAYLOGO_OUTLINED_SVG from "@/assets/paylogo-outlined.svg?react";
import QRCODE_OUTLINED_SVG from "@/assets/qrcode-outlined.svg?react";
import Setting_Outlined_SVG from "@/assets/setting-outlined.svg?react";
import StickerOutlinedSVG from "@/assets/sticker-outlined.svg?react";
import { h } from "@/components/HashAssets";
import ImportChatRecord from "@/components/ImportChatRecord";
import { canBeDetected } from "@/components/NodeDetected";
import useMode from "@/components/useMode";
import useModeNavigate from "@/components/useModeNavigate";
import { EBottomNavBars } from "@/stateV2/bottomNavbars";
import { EMetaDataType } from "@/stateV2/detectedNode";
import { myProfileAtom } from "@/stateV2/profile";
import BottomNavbar, { useToggleNavbarActivated } from "@/wechatComponents/BottomNavbar";
import List from "@/wechatComponents/List";
import { EditOutlined, ImportOutlined } from "@ant-design/icons";
import { useLongPress } from "ahooks";
import { useAtomValue } from "jotai";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import CircularNotchSVG from "./assets/circular-notch.svg?react";

const My = () => {
	const { avatarInfo, wechat, nickname } = useAtomValue(myProfileAtom)!;
	const navigate = useModeNavigate();
	const { setMode } = useMode();
	const { t } = useTranslation();
	useToggleNavbarActivated(EBottomNavBars.MY);

	// App 模式下「导入聊天记录 / 编辑模式」默认隐藏，长按本页切换显隐，
	// 避免这两个开发入口常驻在高仿界面里。
	const [devEntriesVisible, setDevEntriesVisible] = useState(false);
	const pageRef = useRef<HTMLDivElement>(null);

	useLongPress(() => setDevEntriesVisible((v) => !v), pageRef);

	return (
		<div ref={pageRef} className="flex min-h-0 flex-1 flex-col">
			<canBeDetected.div
				className="flex cursor-pointer flex-col pt-12 pr-3 pb-6 pl-9"
				onClick={() => {
					navigate("/wechat/my/profile-edit");
				}}
				metaData={{
					type: EMetaDataType.MyProfile,
					treeItemDisplayName: (data) => `个人信息编辑（${data.nickname}）`,
				}}
			>
				<div className="flex">
					<h.img src={avatarInfo} className="h-16 w-16 rounded-md" />
					<div className="ml-4 flex flex-col justify-between py-1">
						<div className="font-medium text-lg">{nickname}</div>
						<div className="space-x-3 text-black/60 text-sm">
							<span>{t("wechatPage.my.wid")}:</span>
							<span>{wechat}</span>
						</div>
					</div>
					<div className="ml-auto flex items-end space-x-3 py-1">
						<QRCODE_OUTLINED_SVG fill="rgba(0,0,0,0.6)" className="w-[18px]" />
						<ARROW_OUTLINED_SVG fill="rgba(0,0,0,0.3)" className="w-[18px]" />
					</div>
				</div>
				<div className="mt-[2px] ml-20 flex items-center">
					<div className="flex origin-left scale-[0.85] items-center space-x-[2px] rounded-2xl border border-black/10 px-3">
						<ADD_OUTLINED_SVG fill="rgba(0,0,0,0.6)" className="w-3" />
						<span className="text-black/60 text-sm">{t("wechatPage.my.status")}</span>
					</div>
					<div className="flex h-5 w-5 items-center justify-center rounded-full border border-black/10">
						<CircularNotchSVG className="h-3 w-3" fill="#707070" />
					</div>
				</div>
			</canBeDetected.div>
			<div className="flex-1 bg-[rgba(237,237,237,1)]">
				<List className="mt-1.5">
					<List.Item
						withJump
						icon={<PAYLOGO_OUTLINED_SVG fill="#39CD80" />}
						onClick={() => navigate("/wechat/service")}
					>
						{t("wechatPage.my.services")}
					</List.Item>
				</List>
				<List className="mt-1.5">
					<List.Item withJump icon={<FAVORITES_SVG />}>
						{t("wechatPage.my.favorites")}
					</List.Item>
					<List.Item withJump icon={<ALBUM_OUTLINED_SVG fill="#2A7FCB" />}>
						{t("wechatPage.my.moments")}
					</List.Item>
					<List.Item withJump icon={<CARDS_SVG />}>
						{t("wechatPage.my.cards")}
					</List.Item>
					<List.Item withJump icon={<StickerOutlinedSVG fill="#F3C429" />}>
						{t("wechatPage.my.stickers")}
					</List.Item>
				</List>
				<List className="mt-1.5">
					<List.Item withJump icon={<Setting_Outlined_SVG fill="#2A7FCB" />}>
						{t("wechatPage.my.settings")}
					</List.Item>
					{isAppMode && devEntriesVisible && (
						<>
							<ImportChatRecord
								renderTrigger={({ openPicker, openFilesPicker, openEmlPicker }) => (
									<>
										<List.Item
											icon={<ImportOutlined className="text-[#576b95] text-lg" />}
											onClick={openPicker}
										>
											导入聊天记录（文件夹）
										</List.Item>
										<List.Item
											icon={<ImportOutlined className="text-[#576b95] text-lg" />}
											onClick={openFilesPicker}
										>
											导入聊天记录（选文件：txt+图片）
										</List.Item>
										<List.Item
											icon={<ImportOutlined className="text-[#576b95] text-lg" />}
											onClick={openEmlPicker}
										>
											导入聊天记录（eml 文件）
										</List.Item>
									</>
								)}
							/>
							<List.Item
								icon={<EditOutlined className="text-[#07c160] text-lg" />}
								onClick={() => setMode("edit")}
							>
								编辑模式
							</List.Item>
						</>
					)}
				</List>
			</div>
			<BottomNavbar />
		</div>
	);
};

export default My;
