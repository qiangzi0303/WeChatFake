import atomWithStorage from "./atomWithStorage";
import { mainStore } from "./store";

export const ALL_LOGIN_DEVICES = ["Windows", "iPad", "Mac", "Watch", "Desktop"] as const;

export type TStateMultipleDeviceLogin = {
	devices: (typeof ALL_LOGIN_DEVICES)[number][];
	visible: boolean;
};

export const multipleDeviceLoginAtom = atomWithStorage<TStateMultipleDeviceLogin>(
	"multipleDeviceLogin",
	{
		// 默认不显示「iPad微信已登录」等多设备登录提示条。
		// 需要时可在编辑模式里重新加设备并打开。
		devices: [],
		visible: false,
	},
);

export const getMultipleDeviceLoginValueSnapshot = () => mainStore.get(multipleDeviceLoginAtom);
