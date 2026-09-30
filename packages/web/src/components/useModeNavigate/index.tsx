import { isAppMode } from "@/appMode";
import { getModeValueSnapshot } from "@/stateV2/mode";
import { showToast } from "@/wechatComponents/Toast";
import { noop } from "lodash-es";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { type NavigateFunction, useNavigate } from "react-router-dom";

type Options = {
	errorMsg?: string;
	silence?: boolean;
	/**
	 * 编辑模式下也允许跳转。
	 *
	 * App 模式默认就是允许的：手机上没有节点树，
	 * 拦掉跳转等于把人锁在当前页。
	 */
	allowInEdit?: boolean;
};

export default function useModeNavigate(options?: Options): NavigateFunction {
	const { t, i18n } = useTranslation();
	const {
		errorMsg = t("base.safeNavigateNotice"),
		silence = false,
		allowInEdit = isAppMode,
	} = options ?? {};
	const baseNavigate = useNavigate();

	const navigate = useCallback(
		(...args: Parameters<NavigateFunction>) => {
			if (!allowInEdit && getModeValueSnapshot() === "edit") {
				!silence &&
					showToast({
						type: "error",
						content: errorMsg,
					});
				return noop;
			}
			return baseNavigate(...args);
		},
		[i18n.language, allowInEdit],
	);

	return navigate as NavigateFunction;
}
