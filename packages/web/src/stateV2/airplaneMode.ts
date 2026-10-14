import atomWithStorage from "./atomWithStorage";
import { mainStore } from "./store";

export type TStateAirplaneMode = {
	// 飞行模式开关。打开后微信首页顶部显示「当前无法连接网络」提示条。
	enabled: boolean;
};

export const airplaneModeAtom = atomWithStorage<TStateAirplaneMode>("airplaneMode", {
	enabled: false,
});

export const getAirplaneModeValueSnapshot = () => mainStore.get(airplaneModeAtom);
