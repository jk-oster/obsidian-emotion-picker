import { EmotionNode } from "./EmotionNode";

export const MAX_DEPTH = 3;
export const MAX_NODES = 500;
export const MAX_NAME_LENGTH = 40;
const MAX_ERRORS = 10;
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export interface ValidationResult {
	tree?: EmotionNode[];
	errors: string[];
}

/** Lowercase ASCII id part from any text. Can return an empty string. */
export function slug(text: string): string {
	return text
		.toLowerCase()
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

export function countLeaves(node: EmotionNode): number {
	if (!node.children || node.children.length === 0) return 1;
	return node.children.reduce((sum, child) => sum + countLeaves(child), 0);
}

/** Count all nodes of all levels. */
export function countNodes(roots: EmotionNode[]): number {
	return roots.reduce(
		(sum, node) => sum + 1 + countNodes(node.children ?? []),
		0
	);
}

export function depthOf(node: EmotionNode): number {
	if (!node.children || node.children.length === 0) return 1;
	return 1 + Math.max(...node.children.map(depthOf));
}

export function findNode(
	roots: EmotionNode[],
	id: string
): EmotionNode | undefined {
	for (const root of roots) {
		if (root.id === id) return root;
		const found = findNode(root.children ?? [], id);
		if (found) return found;
	}
	return undefined;
}

/** Return the path of nodes from a root down to the node with the given id. */
export function pathTo(roots: EmotionNode[], id: string): EmotionNode[] {
	for (const root of roots) {
		if (root.id === id) return [root];
		const rest = pathTo(root.children ?? [], id);
		if (rest.length > 0) return [root, ...rest];
	}
	return [];
}

/** Mix a #rrggbb color with white. Level 1 stays unchanged. */
export function shadeFor(color: string, level: number): string {
	if (!HEX_COLOR.test(color) || level <= 1) return color;
	const whiteShare = level === 2 ? 0.35 : 0.6;
	const channels = [1, 3, 5].map((start) =>
		parseInt(color.slice(start, start + 2), 16)
	);
	const mixed = channels.map((channel) =>
		Math.round(channel + (255 - channel) * whiteShare)
	);
	const toHex = (channel: number) =>
		(channel < 16 ? "0" : "") + channel.toString(16);
	return "#" + mixed.map(toHex).join("");
}

/**
 * Check untrusted input (for example imported JSON) and return a clean copy.
 * The copy contains only the known fields.
 */
export function validateTree(input: unknown): ValidationResult {
	const errors: string[] = [];
	const seenIds = new Set<string>();
	let nodeCount = 0;

	const addError = (message: string) => {
		if (errors.length < MAX_ERRORS) errors.push(message);
	};

	const visit = (raw: unknown, level: number, path: string): EmotionNode | undefined => {
		nodeCount++;
		if (nodeCount > MAX_NODES) {
			if (nodeCount === MAX_NODES + 1)
				addError(`The tree has more than ${MAX_NODES} nodes.`);
			return undefined;
		}
		if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
			addError(`${path}: node must be an object.`);
			return undefined;
		}
		const candidate = raw as Record<string, unknown>;
		const { id, name, color, children } = candidate;

		if (typeof id !== "string" || id.trim() === "") {
			addError(`${path}: "id" must be a non-empty string.`);
			return undefined;
		}
		if (seenIds.has(id)) addError(`${path}: id "${id}" is not unique.`);
		seenIds.add(id);

		if (typeof name !== "string" || name.trim() === "") {
			addError(`${path}: "name" must be a non-empty string.`);
			return undefined;
		}
		if (name.length > MAX_NAME_LENGTH)
			addError(`${path}: "name" is longer than ${MAX_NAME_LENGTH} characters.`);

		const node: EmotionNode = { id, name };

		if (level === 1) {
			if (typeof color !== "string" || !HEX_COLOR.test(color))
				addError(`${path}: level-1 "color" must look like #rrggbb.`);
			else node.color = color;
		}

		if (children !== undefined) {
			if (!Array.isArray(children)) {
				addError(`${path}: "children" must be an array.`);
				return node;
			}
			if (children.length > 0 && level >= MAX_DEPTH) {
				addError(`${path}: the tree is deeper than ${MAX_DEPTH} levels.`);
				return node;
			}
			const cleanChildren: EmotionNode[] = [];
			children.forEach((child, index) => {
				const clean = visit(child, level + 1, `${path}/${id}[${index}]`);
				if (clean) cleanChildren.push(clean);
			});
			if (cleanChildren.length > 0) node.children = cleanChildren;
		}
		return node;
	};

	if (!Array.isArray(input) || input.length === 0) {
		return { errors: ["The tree must be a non-empty array."] };
	}

	const tree: EmotionNode[] = [];
	input.forEach((root, index) => {
		const clean = visit(root, 1, `root[${index}]`);
		if (clean) tree.push(clean);
	});

	return errors.length > 0 ? { errors } : { tree, errors };
}

/** Deep copy of plain JSON data, so that edits never change a shared default. */
export function deepCopy<T>(value: T): T {
	return JSON.parse(JSON.stringify(value));
}
