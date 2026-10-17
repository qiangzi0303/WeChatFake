import { CloseCircleFilled } from "@ant-design/icons";
import { Button, Modal } from "antd";
import type { FallbackProps } from "react-error-boundary";

const Fallback = (props: FallbackProps) => {
	const { error } = props;
	console.log(props);
	// 把真实报错显示出来，便于手机端定位（否则只能看到通用提示）
	const message = error instanceof Error ? error.message : String(error);
	const stack = error instanceof Error ? error.stack : undefined;
	return (
		<Modal
			open={true}
			title={
				<div className="flex space-x-2">
					<CloseCircleFilled className="text-2xl text-red-600" />
					<div>出错啦</div>
				</div>
			}
			maskClosable={false}
			keyboard={false}
			cancelButtonProps={{ hidden: true }}
			okText="重新加载"
			onOk={() => {
				localStorage.clear();
				location.reload();
			}}
		>
			<div>点击下方按钮清除缓存数据重新加载应用</div>
			<div>
				如果一直出现该提示，请联系
				<Button type="link" href="mailto:liangniangbaby@gmail.com" target="_blank" className="px-0">
					开发者
				</Button>
			</div>
			<div className="mt-2 max-h-48 overflow-auto rounded bg-black/5 p-2 text-left text-red-700 text-xs">
				<div className="font-bold">{message}</div>
				{stack && <pre className="whitespace-pre-wrap break-all text-[10px]">{stack}</pre>}
			</div>
		</Modal>
	);
};

export default Fallback;
