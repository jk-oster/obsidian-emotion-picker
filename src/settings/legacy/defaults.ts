import { EmotionSection } from "./EmotionSection";
import { DEFAULT_EMOTIONS } from "./en";
import { DEFAULT_SPANISH_EMOTIONS } from "./es";
import { DEFAULT_SWEDISH_EMOTIONS } from "./sv";

/**
 * Frozen copy of the flat default lists of plugin versions before the emotion wheel.
 * Migration compares a saved list with these to find users who never customized.
 * Do not edit these lists. `de` has no entry because it has no old data.
 */
export const LEGACY_DEFAULTS: Record<string, EmotionSection[]> = {
	en: DEFAULT_EMOTIONS,
	sv: DEFAULT_SWEDISH_EMOTIONS,
	es: DEFAULT_SPANISH_EMOTIONS,
};
