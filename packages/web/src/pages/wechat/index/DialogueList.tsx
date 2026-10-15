import { canBeDetected } from "@/components/NodeDetected";
import useMode from "@/components/useMode";
import { EMetaDataType, allNodesTreeAtom } from "@/stateV2/detectedNode";
import { dialogueListAtom, dialogueListEffect } from "@/stateV2/dialogueList";
import { useAtom, useSetAtom } from "jotai";
import { useMemo } from "react";
import { ReactSortable } from "react-sortablejs";
import DialogueItem from "./DialogueItem";
import DialogueLongPressMenu from "./DialogueLongPressMenu";

const DialogueList = () => {
	const { isEdit } = useMode();
	const [dialogueList, setDialogueList] = useAtom(dialogueListAtom);
	const rebuildTree = useSetAtom(allNodesTreeAtom);
	useAtom(dialogueListEffect);

	const mappedSortableListData = useMemo(() => {
		return dialogueList.map((item) => ({
			id: item.id,
		}));
	}, [dialogueList]);

	return (
		<canBeDetected.section
			metaData={{
				type: EMetaDataType.DialogueList,
				treeItemDisplayName: "对话列表",
				label: "从好友列表快速新建对话项",
			}}
			className="flex-1"
		>
			<ReactSortable
				disabled={!isEdit}
				list={mappedSortableListData}
				animation={400}
				setList={(v, sortable) => {
					if (isEdit && sortable) {
						const needUpdate = v.some((_, i) => v[i].id !== dialogueList[i].id);
						if (needUpdate) {
							setDialogueList(
								v.map((i) => {
									return dialogueList.find((d) => d.id === i.id)!;
								}),
							);
						}
					}
				}}
				onSort={() => {
					rebuildTree();
				}}
			>
				{dialogueList.map((item) => (
					<DialogueLongPressMenu
						key={item.id}
						itemId={item.id}
						friendId={item.friendId}
						disabled={isEdit}
					>
						<DialogueItem itemId={item.id} className={isEdit ? "cursor-grab" : ""} />
					</DialogueLongPressMenu>
				))}
			</ReactSortable>
		</canBeDetected.section>
	);
};

export default DialogueList;
