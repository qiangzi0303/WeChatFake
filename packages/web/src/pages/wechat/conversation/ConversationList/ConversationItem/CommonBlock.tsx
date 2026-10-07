import { h } from "@/components/HashAssets";
import useModeNavigate from "@/components/useModeNavigate";
import type { IConversationItemBase } from "@/stateV2/conversation";
import { getModeValueSnapshot } from "@/stateV2/mode";
import { type IStateProfile, profileAtom } from "@/stateV2/profile";
import { css } from "@emotion/react";
import { useDebounceFn } from "ahooks";
import { useAtomValue } from "jotai";
import type {
	CSSProperties,
	ComponentType,
	MouseEventHandler,
	PropsWithChildren,
	ReactNode,
} from "react";
import { twJoin, twMerge } from "tailwind-merge";
import { useConversationAPI } from "../../context";

interface Props<P = AnyObject> {
	upperText: IConversationItemBase["upperText"];
	senderId: IStateProfile["id"];
	innerBlockClassName?: string;
	blockClassName?: string;
	blockStyle?: CSSProperties;
	extraElement?: ReactNode;
	hideAvatar?: boolean;
	innerBlockComponent?: ComponentType<P> | string;
	innerBlockProps?: P;
	onClick?: MouseEventHandler<HTMLDivElement>;
}

const CommonBlock = <P extends AnyObject>({
	upperText,
	senderId,
	children,
	innerBlockClassName,
	blockClassName,
	blockStyle,
	extraElement,
	hideAvatar,
	innerBlockComponent: InnerBlockComponent = "div",
	innerBlockProps,
	onClick,
}: PropsWithChildren<Props<P>>) => {
	const { avatarInfo } = useAtomValue(profileAtom(senderId))!;
	const navigate = useModeNavigate({ silence: true });
	const { sendTickleText } = useConversationAPI();

	const handleClick: MouseEventHandler<HTMLImageElement> = (ev) => {
		const { detail: count } = ev;
		if (count === 2) {
			handleDoubliClick();
		} else if (count === 1) {
			navigate(`/wechat/friend/${senderId}`);
		}
	};

	const handleDoubliClick = () => {
		if (getModeValueSnapshot() === "edit") return;
		sendTickleText(senderId);
	};

	const { run: debouncedHandleClick } = useDebounceFn(handleClick, { wait: 200 });

	return (
		<>
			{upperText && <div className="m-auto text-black/30 text-wechatTimeDivider">{upperText}</div>}
			<div
				className={twMerge(
					"relative flex max-w-[85%] space-x-3 group-[.mine]:ml-auto group-[.mine]:flex-row-reverse group-[.mine]:space-x-reverse",
					blockClassName,
				)}
				style={blockStyle}
				onClick={onClick}
			>
				<h.img
					src={avatarInfo}
					className={twJoin(
						"h-10 w-10 min-w-10 cursor-pointer rounded object-cover object-center",
						hideAvatar && "invisible",
					)}
					onClick={debouncedHandleClick}
				/>
				<InnerBlockComponent
					css={css`
            &::before {
              clip-path: polygon(0% 50%, 50% 100%, 0% 100%);
            }
          `}
					className={twMerge(
						// 气泡尺寸对齐真微信：正文 17px/行高 24px，上下各 8px 内边距
						// 得到单行 40px（此前 p-[10px] 为 44px，偏高）；左右 12px。
						// 箭头从 28px 收到 12px —— 原尺寸接近气泡整高，明显过大。
						"group-[.friend]:before:-left-[3px] group-[.mine]:before:-right-[3px] group-[.mine]:before:-rotate-[135deg] relative max-w-[85%] break-words rounded-[6px] px-3 py-2 before:absolute before:top-[12px] before:h-3 before:w-3 group-[.friend]:before:rotate-45",
						innerBlockClassName,
					)}
					{...(innerBlockProps as P)}
				>
					{children}
				</InnerBlockComponent>
				{extraElement}
			</div>
		</>
	);
};

export default CommonBlock;
