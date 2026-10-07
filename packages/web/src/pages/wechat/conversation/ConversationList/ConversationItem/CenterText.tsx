import type { IConversationTypeSingleUpperText } from "@/stateV2/conversation";
import { memo } from "react";
import { twMerge } from "tailwind-merge";

type Props = {
	extraClassName: IConversationTypeSingleUpperText["extraClassName"];
	upperText: IConversationTypeSingleUpperText["upperText"];
	simpleContent: IConversationTypeSingleUpperText["simpleContent"];
};

const CenterText = ({ extraClassName, upperText, simpleContent }: Props) => {
	return (
		<>
			{upperText && <div className={"m-auto text-black/30 text-wechatTimeDivider"}>{upperText}</div>}
			<div className={twMerge("m-auto text-black/30 text-wechatTimeDivider", extraClassName)}>
				<div>{simpleContent}</div>
			</div>
		</>
	);
};

export default memo(CenterText);
