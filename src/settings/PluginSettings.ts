import { EmotionSection } from "./legacy/EmotionSection";
import { EmotionNode } from "../emotions/EmotionNode";

export type EmotionPickerLocaleOverride = "en" | string;
export type ViewMode = "wheel" | "list";

export interface EmotionPickerSettings {
	modalHeaderText: string;
	useCommaInSeparator: boolean;
	addAsLink: boolean;
	addAsTag: boolean;
	capitalize: boolean;
	/** Legacy flat list from old versions. Read only for migration. Never written. */
	emotions?: EmotionSection[];
	emotionTree: EmotionNode[];
	/** Saved trees of the other locales. Restored when the user switches back. */
	localeTrees: Record<string, EmotionNode[]>;
	viewMode: ViewMode;
	locale: EmotionPickerLocaleOverride;
}

export class DefaultSettings implements EmotionPickerSettings {
	modalHeaderText = "What do you feel?";
	useCommaInSeparator = false;
	addAsLink = false;
	addAsTag = false;
	capitalize = false;
	emotionTree: EmotionNode[] = [];
	localeTrees: Record<string, EmotionNode[]> = {};
	viewMode: ViewMode = "wheel";
	locale: EmotionPickerLocaleOverride = "en";
}
