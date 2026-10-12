import { atomEffect } from "jotai-effect";
import atomWithStorage from "./atomWithStorage";
import { bottomNavbarsAtom } from "./bottomNavbars";
import { mainStore } from "./store";

export type TStateUnreadCount = {
	count: number;
	calcuateType: "static" | "auto";
};

export const unreadCountAtom = atomWithStorage<TStateUnreadCount>("unreadCount", {
	count: 13,
	calcuateType: "auto",
});

export const getUnreadCountValueSnapshot = () => mainStore.get(unreadCountAtom);

export const unreadCountEffect = atomEffect((get, set) => {
	const { count } = get(unreadCountAtom);
	set(bottomNavbarsAtom, (pv) => ({
		...pv,
		WECHAT: {
			...pv.WECHAT,
			// 未读数为 0 时不显示角标（Badge 的 number 类型仅在值为 nil 时隐藏，传 0 会显示红色「0」）
			badgeNumber: count > 0 ? count : undefined,
		},
	}));
});
