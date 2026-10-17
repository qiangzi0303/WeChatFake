import dayjs, { type Dayjs } from "dayjs";

type Props = {
	/** 由 antd Form 的 getValueProps 注入的 dayjs 值 */
	value?: Dayjs;
	/** 变更后回传 dayjs，交给 Form 的 normalize 转成时间戳 */
	onChange?: (value: Dayjs) => void;
	disabled?: boolean;
};

/**
 * 移动端友好的日期时间选择器，替代 antd 的滚轮式 DatePicker。
 *
 * 用原生 `<input type="datetime-local">`，在手机上会调起系统原生的
 * 日期时间选择面板，比一列列滚动的滚轮好选得多。对外保持与 antd
 * DatePicker 一致的 value(Dayjs)/onChange(Dayjs) 契约，可直接放进原有
 * Form.Item（getValueProps + normalize 不变）。
 */
const NativeDateTimePicker = ({ value, onChange, disabled }: Props) => {
	// datetime-local 需要 "YYYY-MM-DDTHH:mm" 格式
	const inputValue = value?.isValid() ? value.format("YYYY-MM-DDTHH:mm") : "";

	return (
		<input
			type="datetime-local"
			disabled={disabled}
			value={inputValue}
			onChange={(e) => {
				const next = e.target.value;
				// 原生输入可被清空，空值时忽略，避免产生 Invalid Date
				if (!next) return;
				onChange?.(dayjs(next));
			}}
			className="w-full rounded-md border border-[#d9d9d9] px-3 py-1.5 text-sm outline-none focus:border-wechatBrand-2"
		/>
	);
};

export default NativeDateTimePicker;