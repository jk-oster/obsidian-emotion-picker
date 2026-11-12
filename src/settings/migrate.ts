import { EmotionNode } from "../emotions/EmotionNode";
import { getDefaultEmotionTree } from "../emotions/index";
import { convertLegacySections } from "./legacy/convert";
import { LEGACY_DEFAULTS } from "./legacy/defaults";
import { EmotionPickerSettings } from "./PluginSettings";

const sameJson = (a: unknown, b: unknown): boolean =>
	JSON.stringify(a) === JSON.stringify(b);

/**
 * Decide which emotion tree the plugin uses after loading data.json.
 * This function never changes or deletes the old `emotions` key.
 *
 * 1. A stored `emotionTree` wins.
 * 2. An old list that equals a default list becomes the default tree of that locale.
 * 3. Any other old list is converted to a two-level tree.
 * 4. Without data, use the default tree of the locale.
 */
export function resolveEmotionTree(
	loaded: Partial<EmotionPickerSettings> | null | undefined,
	locale: string
): EmotionNode[] {
	const stored = loaded?.emotionTree;
	if (Array.isArray(stored) && stored.length > 0) return stored;

	const legacy = loaded?.emotions;
	if (Array.isArray(legacy) && legacy.length > 0) {
		const matchedLocale = Object.keys(LEGACY_DEFAULTS).find((candidate) =>
			sameJson(legacy, LEGACY_DEFAULTS[candidate])
		);
		if (matchedLocale) return getDefaultEmotionTree(matchedLocale);
		return convertLegacySections(legacy);
	}

	return getDefaultEmotionTree(locale);
}
