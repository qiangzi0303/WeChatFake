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
            /* 箭头形状按参考截图像素测量：主体右缘 x=668 恒定，
               外凸段 y=164~186（约 23px 高）、最远 x=677（外凸 9px），
               即高宽比约 2.5:1 的瘦长尖角，且垂直居中于气泡主体。
               旧实现用 12x12 正方形旋转 45° 裁切，被 45° 锁死成等宽等高，
               做不出这个比例，故改为显式尺寸 + 指向性 clip-path。 */
            .friend &::before {
              clip-path: polygon(100% 0, 0 50%, 100% 100%);
            }
            .mine &::before {
              clip-path: polygon(0 0, 100% 50%, 0 100%);
            }
          `}
					className={twMerge(
						// 气泡尺寸对齐真微信：正文 17.5px/行高 24px，上下各 8px 内边距
						// 得单行 40px（此前 p-[10px] 为 44px，偏高）；左右 12px。
						// 箭头 5x13px、外凸 5px，比例取自参考截图的 9px/23px。
						// 垂直位置锚在头像中心：头像 h-10(40px) 顶部对齐，中心恒为
						// 容器顶部下方 20px，故用 top-5 + -translate-y-1/2 让箭头
						// 中心落在 20px。此定位只依赖头像，不随正文字号变化。
						"group-[.friend]:before:-left-[5px] group-[.mine]:before:-right-[5px] relative max-w-[85%] break-words rounded-[6px] px-3 py-2 before:absolute before:top-5 before:h-[13px] before:w-[5px] before:-translate-y-1/2",
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
