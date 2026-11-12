import { EmotionNode } from "../EmotionNode";
import { slug } from "../tree";

/** A word is a plain string (id derived from the text) or a [key, name] pair. */
export type WordSpec = string | [string, string];

export interface GroupSpec {
	/** Stable id part. Defaults to the slug of `name`. Keep it equal across locales. */
	key?: string;
	name: string;
	words: WordSpec[];
}

export interface CoreSpec {
	key: string;
	name: string;
	color: string;
	groups: GroupSpec[];
}

/**
 * Default trees use lowercase names on every level.
 * The user can add the capital letter on insert with the "Capitalize" setting.
 * `toLowerCase` does not depend on the system locale.
 */
export const defaultName = (name: string): string => name.toLowerCase();

/**
 * Build a three-level tree from a compact spec.
 * Ids are paths: `core`, `core/group`, `core/group/word`.
 */
export function buildTree(cores: CoreSpec[]): EmotionNode[] {
	return cores.map((core) => ({
		id: core.key,
		name: defaultName(core.name),
		color: core.color,
		children: core.groups.map((group) => {
			const groupId = `${core.key}/${group.key ?? slug(group.name)}`;
			return {
				id: groupId,
				name: defaultName(group.name),
				children: group.words.map((word) => {
					const [key, name] =
						typeof word === "string" ? [slug(word), word] : word;
					return { id: `${groupId}/${key}`, name: defaultName(name) };
				}),
			};
		}),
	}));
}
