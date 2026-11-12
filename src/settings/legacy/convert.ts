import { EmotionNode } from "../../emotions/EmotionNode";
import { MAX_NAME_LENGTH, slug } from "../../emotions/tree";
import { EmotionSection } from "./EmotionSection";

const FALLBACK_COLOR = "#888888";
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

/**
 * Convert the old flat groups into a two-level tree.
 * Each group becomes a level-1 node. Each word becomes a leaf.
 */
export function convertLegacySections(sections: EmotionSection[]): EmotionNode[] {
	const usedIds = new Set<string>();
	const uniqueId = (base: string): string => {
		let id = base;
		let counter = 2;
		while (usedIds.has(id)) {
			id = `${base}-${counter}`;
			counter++;
		}
		usedIds.add(id);
		return id;
	};

	return sections.map((section, sectionIndex) => {
		const sectionId = uniqueId(
			slug(section.name ?? "") || `group-${sectionIndex + 1}`
		);
		const leaves: EmotionNode[] = (section.emotions ?? [])
			.map((word) => String(word).trim())
			.filter((word) => word !== "")
			.map((word, wordIndex) => ({
				id: uniqueId(`${sectionId}/${slug(word) || `item-${wordIndex + 1}`}`),
				name: word.slice(0, MAX_NAME_LENGTH),
			}));

		const node: EmotionNode = {
			id: sectionId,
			name: (section.name ?? "").trim().slice(0, MAX_NAME_LENGTH) || sectionId,
			color: HEX_COLOR.test(section.color) ? section.color : FALLBACK_COLOR,
		};
		if (leaves.length > 0) node.children = leaves;
		return node;
	});
}
