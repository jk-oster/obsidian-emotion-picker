import { EmotionNode } from "../emotions/EmotionNode";
import { getDefaultEmotionTree } from "../emotions/index";
import { validateTree } from "../emotions/tree";

/** Saved trees of the locales that are not active. The active tree lives in `emotionTree`. */
export type LocaleTrees = Record<string, EmotionNode[]>;

export interface LocaleTreeState {
	locale: string;
	emotionTree: EmotionNode[];
	localeTrees: LocaleTrees;
}

const sameJson = (a: unknown, b: unknown): boolean =>
	JSON.stringify(a) === JSON.stringify(b);

/**
 * Keep only valid trees from stored data. Data comes from data.json, which a user can edit.
 * An invalid entry is dropped. The entry of the active locale is dropped too,
 * because `emotionTree` holds that tree.
 */
export function sanitizeLocaleTrees(raw: unknown, activeLocale: string): LocaleTrees {
	const clean: LocaleTrees = {};
	if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return clean;
	for (const [locale, tree] of Object.entries(raw as Record<string, unknown>)) {
		if (locale === activeLocale) continue;
		const result = validateTree(tree);
		if (result.tree) clean[locale] = result.tree;
	}
	return clean;
}

/**
 * Switch the locale. Save the current tree for the old locale and restore the saved tree
 * of the new locale. Without a saved tree, use the default tree of the new locale.
 * A tree that equals the default tree is not saved, so that new defaults of a
 * later plugin version still reach the user. The input stays unchanged.
 */
export function switchLocale(
	state: LocaleTreeState,
	newLocale: string
): LocaleTreeState {
	if (newLocale === state.locale) return state;

	const localeTrees: LocaleTrees = { ...state.localeTrees };
	if (sameJson(state.emotionTree, getDefaultEmotionTree(state.locale))) {
		delete localeTrees[state.locale];
	} else {
		localeTrees[state.locale] = state.emotionTree;
	}

	const saved = localeTrees[newLocale];
	delete localeTrees[newLocale];

	return {
		locale: newLocale,
		emotionTree: saved ?? getDefaultEmotionTree(newLocale),
		localeTrees,
	};
}
