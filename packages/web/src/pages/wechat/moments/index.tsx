import { canBeDetected } from "@/components/NodeDetected";
import useMode from "@/components/useMode";
import { EMetaDataType, allNodesTreeAtom } from "@/stateV2/detectedNode";
import { feedListAtom } from "@/stateV2/moments";
import { useAtom, useSetAtom } from "jotai";
import { useMemo } from "react";
import { ReactSortable } from "react-sortablejs";
import Feed from "./Feed";

const MomentsIndex = () => {
	const [feedList, setFeedList] = useAtom(feedListAtom);
	const { isEdit } = useMode();
	const rebuildTree = useSetAtom(allNodesTreeAtom);

	const mappedSortableListData = useMemo(() => {
		return feedList.map((v) => ({ id: v.id }));
	}, [feedList]);

	// 预览模式下按发布时间倒序展示，编辑模式保留手动拖拽排序
	const displayFeedList = useMemo(() => {
		if (isEdit) return feedList;
		return feedList.slice().sort((a, b) => b.sendTimestamp - a.sendTimestamp);
	}, [feedList, isEdit]);

	const feedClassNames = useMemo(() => {
		return {
			container: isEdit ? "cursor-grab" : "",
		};
	}, [isEdit]);

	return (
		<canBeDetected.div
			className="mt-12 flex flex-col"
			metaData={{
				type: EMetaDataType.AllFeeds,
				treeItemDisplayName: "所有朋友圈",
				label: "新增朋友圈",
			}}
		>
			<ReactSortable
				disabled={!isEdit}
				list={mappedSortableListData}
				animation={400}
				setList={(v, sortable) => {
					if (isEdit && sortable) {
						const needUpdate = v.some((_, i) => v[i].id !== feedList[i].id);
						if (needUpdate) {
							setFeedList(v.map((i) => feedList.find((d) => d.id === i.id)!));
						}
					}
				}}
				onSort={() => {
					rebuildTree();
				}}
			>
				{displayFeedList.map((feed) => (
					<Feed key={feed.id} id={feed.id} userId={feed.userId} classNames={feedClassNames} />
				))}
			</ReactSortable>
		</canBeDetected.div>
	);
};

export default MomentsIndex;
