import BackFilledSVG from "@/assets/back-filled.svg?react";
import SlateInput from "@/components/MetaDataEditor/SlateInput";
import useModeNavigate from "@/components/useModeNavigate";
import { generateTextFeed } from "@/faker/wechat/moments";
import { MYSELF_ID } from "@/faker/wechat/user";
import { feedListAtom } from "@/stateV2/moments";
import { SLATE_INITIAL_VALUE } from "@/wechatComponents/SlateText/utils";
import { Button } from "antd";
import { useSetAtom } from "jotai";
import { isEqual } from "lodash-es";
import { useState } from "react";
import type { Descendant } from "slate";

const MomentsPublish = () => {
	const navigate = useModeNavigate();
	const setFeedList = useSetAtom(feedListAtom);
	const [text, setText] = useState<Descendant[]>(SLATE_INITIAL_VALUE);

	const isEmpty = isEqual(text, SLATE_INITIAL_VALUE);

	const handlePublish = () => {
		if (isEmpty) return;
		setFeedList((prev) => [generateTextFeed(MYSELF_ID, text), ...prev]);
		navigate("/wechat/moments");
	};

	return (
		<div className="flex h-full flex-col bg-white">
			<div className="flex items-center justify-between px-4 py-3">
				<BackFilledSVG
					fill="black"
					className="h-5 w-5 cursor-pointer"
					onClick={() => navigate("/wechat/moments")}
				/>
				<Button type="primary" disabled={isEmpty} onClick={handlePublish}>
					发表
				</Button>
			</div>
			<div className="flex-1 px-4 pt-2">
				<SlateInput value={text} onChange={setText} />
			</div>
		</div>
	);
};

export default MomentsPublish;
