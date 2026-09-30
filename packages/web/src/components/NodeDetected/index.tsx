import {
	type IStateNode,
	type StaticMetaData,
	activatedNodeAtom,
	getActivatedNodeValueSnapshot,
	hoveredNodeAtom,
} from "@/stateV2/detectedNode";
import { nodesAtomsAtom } from "@/stateV2/detectedNode/nodeAtom";
import { useMergeRefs } from "@floating-ui/react";
import { useCreation, useUpdateEffect } from "ahooks";
import { atom, useSetAtom } from "jotai";
import { isArray, omit } from "lodash-es";
import {
	type HTMLAttributes,
	type MouseEvent,
	type ReactNode,
	type Ref,
	memo,
	useCallback,
	useEffect,
	useId,
	useRef,
} from "react";
import Sortable from "sortablejs";
import useMode from "../useMode";

export type InjectProps = {
	metaData?: StaticMetaData.InjectMetaData | StaticMetaData.InjectMetaData[];
	nodeTreeSort?: boolean;
	/**
	 * 即使处于编辑模式也不接管交互，保持组件原有的 onClick。
	 *
	 * 编辑模式下本组件会把 onClick 替换成「选中该节点」，
	 * 这让节点自身的跳转失效。移动端底部导航栏是唯一的换页手段，
	 * 被接管后就困在当前页了，所以那里需要让路。
	 */
	detectDisabled?: boolean;
};

type PropsAreEqual<P> = (prevProps: Readonly<P>, nextProps: Readonly<P>) => boolean;

function canBeDetected<T extends object>(
	component: {
		(props: T): Exclude<ReactNode, undefined>;
		displayName?: string;
	},
	propsAreEqual?: PropsAreEqual<T> | false,
	componentName = component.displayName ?? component.name,
) {
	const NodeDetected = (
		props: InjectProps & T & HTMLAttributes<void> & { innerRef?: Ref<any> },
	) => {
		const { metaData: injectMetaData, innerRef, id: preId, nodeTreeSort, detectDisabled } = props;
		const id = preId ?? useId();
		const currentNodeAtom = useCreation(
			() =>
				atom<IStateNode>({
					id,
					injectMetaData,
					nodeTreeSort: !!nodeTreeSort,
				}),
			[],
		);
		const setCurrentNode = useSetAtom(currentNodeAtom);
		const setHovered = useSetAtom(hoveredNodeAtom);
		const setActivated = useSetAtom(activatedNodeAtom);
		const setNodesAtoms = useSetAtom(nodesAtomsAtom);
		const divRef = useRef<Element>(null);
		const mergedRef = useMergeRefs([divRef, innerRef]);
		const { isPreview } = useMode();

		const mapCompared = (v?: StaticMetaData.InjectMetaData) => ({
			type: v?.type,
			index: v?.index,
			operations: v?.operations?.map((o) => o.key ?? "") ?? [],
		});
		const comparedInjectMetaData = isArray(injectMetaData)
			? injectMetaData.map(mapCompared)
			: mapCompared(injectMetaData);

		useEffect(() => {
			if (divRef.current) {
				setNodesAtoms((prev) => {
					prev[id] = currentNodeAtom;
					return { ...prev };
				});
			}
			return () => {
				setNodesAtoms((prev) => {
					delete prev[id];
					return { ...prev };
				});
				if (getActivatedNodeValueSnapshot() === id) {
					setActivated(null);
				}
			};
		}, []);

		useUpdateEffect(() => {
			setCurrentNode((pv) => ({
				...pv,
				injectMetaData,
			}));
		}, [JSON.stringify(comparedInjectMetaData)]);

		const onClick = useCallback((ev: MouseEvent) => {
			ev.stopPropagation();
			setActivated(id);
		}, []);

		const onMouseLeave = useCallback((ev: MouseEvent) => {
			if (Sortable.active) return;
			ev.stopPropagation();
			setHovered(null);
		}, []);

		const onMouseOver = useCallback((ev: MouseEvent) => {
			if (Sortable.active) return;
			ev.stopPropagation();
			setHovered(id);
		}, []);

		const fp = omit(props, ["metaData", "innerRef", "nodeTreeSort", "detectDisabled"]);

		if (isPreview || detectDisabled) {
			return component({
				...(fp as T & HTMLAttributes<void>),
				ref: mergedRef,
				id,
				"nd-id": id,
			}) as JSX.Element;
		}

		return component({
			...(fp as T & HTMLAttributes<void>),
			ref: mergedRef,
			"nd-id": id,
			id,
			onMouseLeave,
			onMouseOver,
			onClick,
		}) as JSX.Element;
	};

	NodeDetected.displayName = `NodeDetected(${componentName})`;

	const wrappedComponent = propsAreEqual === false ? NodeDetected : memo(NodeDetected);

	return wrappedComponent as typeof NodeDetected;
}

canBeDetected.div = canBeDetected((props) => <div {...props} />);
canBeDetected.section = canBeDetected((props) => <section {...props} />);
canBeDetected.span = canBeDetected((props) => <span {...props} />);

export { canBeDetected };
