import { EmotionNode } from "../EmotionNode";
import { defaultName } from "./build";

/**
 * Names of one locale, keyed like the English tree:
 * core key -> [core name, { group key -> [group name, { word key -> word }] }].
 */
export type TreeNames = Record<
	string,
	[string, Record<string, [string, Record<string, string>]>]
>;

const lastKey = (id: string): string => id.slice(id.lastIndexOf("/") + 1);

/**
 * Copy the structure, ids, and colors of the source tree. Replace the names.
 * All names become lowercase. `keepCaseIds` lists the node ids that keep their spelling.
 * German uses it for nouns.
 * A missing name falls back to the source name. Use `missingNames` in tests.
 */
export function translateTree(
	source: EmotionNode[],
	names: TreeNames,
	keepCaseIds: string[] = []
): EmotionNode[] {
	const spell = (id: string, name: string): string =>
		keepCaseIds.indexOf(id) >= 0 ? name : defaultName(name);

	return source.map((core) => {
		const [coreName, groupNames] = names[lastKey(core.id)] ?? [core.name, {}];
		return {
			...core,
			name: spell(core.id, coreName),
			children: (core.children ?? []).map((group) => {
				const [groupName, wordNames] = groupNames[lastKey(group.id)] ?? [group.name, {}];
				return {
					...group,
					name: spell(group.id, groupName),
					children: (group.children ?? []).map((word) => ({
						...word,
						name: spell(word.id, wordNames[lastKey(word.id)] ?? word.name),
					})),
				};
			}),
		};
	});
}

/** List the ids of the source tree that have no name in `names`. */
export function missingNames(source: EmotionNode[], names: TreeNames): string[] {
	const missing: string[] = [];
	source.forEach((core) => {
		const coreEntry = names[lastKey(core.id)];
		if (!coreEntry) missing.push(core.id);
		(core.children ?? []).forEach((group) => {
			const groupEntry = coreEntry?.[1][lastKey(group.id)];
			if (!groupEntry) missing.push(group.id);
			(group.children ?? []).forEach((word) => {
				if (!groupEntry?.[1][lastKey(word.id)]) missing.push(word.id);
			});
		});
	});
	return missing;
}
