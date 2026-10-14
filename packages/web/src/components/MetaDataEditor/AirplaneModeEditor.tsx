import { type TStateAirplaneMode, airplaneModeAtom } from "@/stateV2/airplaneMode";
import { Form, Switch } from "antd";
import { useSetAtom } from "jotai";

const AirplaneModeEditor = ({ data }: EditorProps<TStateAirplaneMode>) => {
	const [form] = Form.useForm<TStateAirplaneMode>();
	const setAirplaneMode = useSetAtom(airplaneModeAtom);

	const onFinish = (values: TStateAirplaneMode) => {
		setAirplaneMode(values);
	};

	return (
		<Form
			form={form}
			layout="vertical"
			autoComplete="off"
			onFinish={onFinish}
			onValuesChange={() => {
				setTimeout(() => {
					form.submit();
				});
			}}
			initialValues={data}
		>
			<Form.Item<TStateAirplaneMode> name="enabled" label="飞行模式（断网提示）" valuePropName="checked">
				<Switch />
			</Form.Item>
		</Form>
	);
};

export default AirplaneModeEditor;
