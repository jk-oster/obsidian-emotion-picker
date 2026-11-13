import { EmotionNode } from "./EmotionNode";
import {
	countNodes,
	deepCopy,
	findNode,
	MAX_DEPTH,
	MAX_NAME_LENGTH,
	MAX_NODES,
	pathTo,
	slug,
} from "./tree";

/** Colors for new level-1 nodes. The editor takes them in turn. */
export const NEW_ROOT_COLORS = [
	"#f4a261",
	"#8ecae6",
	"#c1e08d",
	"#e9c46a",
	"#cdb4db",
	"#ef959d",
];

/**
 * Flat result type, because tsconfig has no strict null checks and
 * TypeScript then does not narrow a union by the `ok` flag.
 * `tree` is set when `ok` is true. `reason` is set when `ok` is false.
 */
export interface EditResult {
	ok: boolean;
	tree?: EmotionNode[];
	id?: string;
	reason?: string;
}

const fail = (reason: string): EditResult => ({ ok: false, reason });

function collectIds(roots: EmotionNode[], into = new Set<string>()): Set<string> {
	for (const node of roots) {
		into.add(node.id);
		collectIds(node.children ?? [], into);
	}
	return into;
}

/** Build an id that no node in the tree uses. Child ids start with the parent id. */
export function makeId(
	roots: EmotionNode[],
	name: string,
	parentId?: string
): string {
	const used = collectIds(roots);
	const base = (parentId ? parentId + "/" : "") + (slug(name) || "node");
	let candidate = base;
	for (let counter = 2; used.has(candidate); counter++) {
		candidate = `${base}-${counter}`;
	}
	return candidate;
}

/** Return a trimmed name, or undefined when the name is not valid. */
export function cleanName(name: string): string | undefined {
	const trimmed = name.trim();
	if (trimmed === "" || trimmed.length > MAX_NAME_LENGTH) return undefined;
	return trimmed;
}

/** Find the array that holds the node, and the position of the node in it. */
function locate(
	roots: EmotionNode[],
	id: string
): { siblings: EmotionNode[]; index: number } | undefined {
	const index = roots.findIndex((node) => node.id === id);
	if (index >= 0) return { siblings: roots, index };
	for (const node of roots) {
		const found = locate(node.children ?? [], id);
		if (found) return found;
	}
	return undefined;
}

/** Add a node. `parentId` null adds a level-1 node. */
export function addNode(
	roots: EmotionNode[],
	parentId: string | null,
	rawName: string
): EditResult {
	const name = cleanName(rawName);
	if (!name) return fail(`The name must have 1 to ${MAX_NAME_LENGTH} characters.`);
	if (countNodes(roots) >= MAX_NODES)
		return fail(`The tree can have ${MAX_NODES} nodes at most.`);

	const tree = deepCopy(roots);
	const id = makeId(tree, name, parentId ?? undefined);

	if (parentId === null) {
		const color = NEW_ROOT_COLORS[tree.length % NEW_ROOT_COLORS.length];
		tree.push({ id, name, color });
		return { ok: true, tree, id };
	}

	const parent = findNode(tree, parentId);
	if (!parent) return fail("The parent node does not exist.");
	if (pathTo(tree, parentId).length >= MAX_DEPTH)
		return fail(`The tree can have ${MAX_DEPTH} levels at most.`);
	parent.children = [...(parent.children ?? []), { id, name }];
	return { ok: true, tree, id };
}

export function renameNode(
	roots: EmotionNode[],
	id: string,
	rawName: string
): EditResult {
	const name = cleanName(rawName);
	if (!name) return fail(`The name must have 1 to ${MAX_NAME_LENGTH} characters.`);
	const tree = deepCopy(roots);
	const node = findNode(tree, id);
	if (!node) return fail("The node does not exist.");
	node.name = name;
	return { ok: true, tree };
}

export function setColor(
	roots: EmotionNode[],
	id: string,
	color: string
): EditResult {
	if (!/^#[0-9a-fA-F]{6}$/.test(color)) return fail("The color must look like #rrggbb.");
	const tree = deepCopy(roots);
	const node = tree.find((root) => root.id === id);
	if (!node) return fail("Only level-1 nodes have a color.");
	node.color = color;
	return { ok: true, tree };
}

export function removeNode(roots: EmotionNode[], id: string): EditResult {
	const tree = deepCopy(roots);
	const place = locate(tree, id);
	if (!place) return fail("The node does not exist.");
	if (place.siblings === tree && tree.length === 1)
		return fail("The tree needs at least 1 core emotion.");
	place.siblings.splice(place.index, 1);
	// A node without children becomes a leaf. Remove the empty array.
	return { ok: true, tree: pruneEmptyChildren(tree) };
}

function pruneEmptyChildren(nodes: EmotionNode[]): EmotionNode[] {
	for (const node of nodes) {
		if (node.children) {
			if (node.children.length === 0) delete node.children;
			else pruneEmptyChildren(node.children);
		}
	}
	return nodes;
}

/** Move a node among its siblings. `delta` is -1 (up) or 1 (down). */
export function moveNode(
	roots: EmotionNode[],
	id: string,
	delta: -1 | 1
): EditResult {
	const tree = deepCopy(roots);
	const place = locate(tree, id);
	if (!place) return fail("The node does not exist.");
	const target = place.index + delta;
	if (target < 0 || target >= place.siblings.length)
		return fail("The node cannot move further.");
	const [node] = place.siblings.splice(place.index, 1);
	place.siblings.splice(target, 0, node);
	return { ok: true, tree };
}
