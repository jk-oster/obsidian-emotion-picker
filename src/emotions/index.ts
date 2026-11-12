import { EmotionNode } from "./EmotionNode";
import { deepCopy } from "./tree";
import { GERMAN_EMOTION_TREE } from "./trees/de";
import { DEFAULT_EMOTION_TREE } from "./trees/en";
import { SPANISH_EMOTION_TREE } from "./trees/es";
import { SWEDISH_EMOTION_TREE } from "./trees/sv";

const pickDefaultTree = (locale: string): EmotionNode[] => {
	switch (locale) {
		case "sv":
			return SWEDISH_EMOTION_TREE;
		case "es":
			return SPANISH_EMOTION_TREE;
		case "de":
			return GERMAN_EMOTION_TREE;
		default:
			return DEFAULT_EMOTION_TREE;
	}
};

/** Returns a copy. Edits never change the shared default trees. Unknown locales get English. */
const getDefaultEmotionTree = (locale: string): EmotionNode[] =>
	deepCopy(pickDefaultTree(locale));

export { getDefaultEmotionTree };
