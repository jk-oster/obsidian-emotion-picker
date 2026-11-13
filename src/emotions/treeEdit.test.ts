import { describe, expect, it } from "vitest";
import { EmotionNode } from "./EmotionNode";
import {
	addNode,
	cleanName,
	makeId,
	moveNode,
	removeNode,
	renameNode,
	setColor,
} from "./treeEdit";
import { MAX_NODES, validateTree } from "./tree";

const base = (): EmotionNode[] => [
	{
		id: "joy",
		name: "Joy",
		color: "#c1e08d",
		children: [
			{ id: "joy/proud", name: "Proud", children: [{ id: "joy/proud/smug", name: "Smug" }] },
			{ id: "joy/calm", name: "Calm" },
		],
	},
	{ id: "fear", name: "Fear", color: "#8ecae6" },
];

function ok(result: ReturnType<typeof addNode>): EmotionNode[] {
	if (!result.ok) throw new Error(result.reason);
	return result.tree as EmotionNode[];
}

describe("makeId", () => {
	it("prefixes the parent id and adds a counter on collision", () => {
		expect(makeId(base(), "Happy", "joy")).toBe("joy/happy");
		expect(makeId(base(), "Calm", "joy")).toBe("joy/calm-2");
	});
	it("falls back to node for names without ASCII letters", () => {
		expect(makeId(base(), "!!!")).toBe("node");
	});
});

describe("cleanName", () => {
	it("trims and rejects empty or long names", () => {
		expect(cleanName("  Joy ")).toBe("Joy");
		expect(cleanName("   ")).toBeUndefined();
		expect(cleanName("x".repeat(41))).toBeUndefined();
	});
});

describe("addNode", () => {
	it("adds a level-1 node with a color and keeps the input unchanged", () => {
		const input = base();
		const tree = ok(addNode(input, null, "Anger"));
		expect(tree).toHaveLength(3);
		expect(tree[2].color).toMatch(/^#[0-9a-f]{6}$/);
		expect(input).toHaveLength(2);
		expect(validateTree(tree).errors).toEqual([]);
	});
	it("adds a child to a leaf", () => {
		const tree = ok(addNode(base(), "fear", "Panic"));
		expect(tree[1].children?.[0]).toEqual({ id: "fear/panic", name: "Panic" });
	});
	it("refuses a fourth level", () => {
		const result = addNode(base(), "joy/proud/smug", "Deeper");
		expect(result.ok).toBe(false);
	});
	it("refuses an unknown parent and an empty name", () => {
		expect(addNode(base(), "nope", "X").ok).toBe(false);
		expect(addNode(base(), "joy", " ").ok).toBe(false);
	});
	it("refuses more than the maximum node count", () => {
		const many: EmotionNode[] = Array.from({ length: MAX_NODES }, (_, i) => ({
			id: `n${i}`,
			name: `N${i}`,
			color: "#ffffff",
		}));
		expect(addNode(many, null, "One more").ok).toBe(false);
	});
});

describe("renameNode and setColor", () => {
	it("renames a deep node and keeps its id", () => {
		const tree = ok(renameNode(base(), "joy/proud/smug", " Pleased "));
		expect(tree[0].children?.[0].children?.[0]).toEqual({ id: "joy/proud/smug", name: "Pleased" });
	});
	it("sets a color on level 1 only", () => {
		expect(ok(setColor(base(), "joy", "#112233"))[0].color).toBe("#112233");
		expect(setColor(base(), "joy/calm", "#112233").ok).toBe(false);
		expect(setColor(base(), "joy", "red").ok).toBe(false);
	});
});

describe("removeNode", () => {
	it("removes a subtree", () => {
		const tree = ok(removeNode(base(), "joy/proud"));
		expect(tree[0].children?.map((c) => c.id)).toEqual(["joy/calm"]);
	});
	it("turns a parent without children into a leaf", () => {
		const tree = ok(removeNode(ok(removeNode(base(), "joy/proud")), "joy/calm"));
		expect(tree[0]).not.toHaveProperty("children");
		expect(validateTree(tree).errors).toEqual([]);
	});
	it("keeps the last level-1 node", () => {
		expect(removeNode([{ id: "a", name: "A", color: "#ffffff" }], "a").ok).toBe(false);
	});
});

describe("moveNode", () => {
	it("moves among siblings", () => {
		expect(ok(moveNode(base(), "fear", -1)).map((n) => n.id)).toEqual(["fear", "joy"]);
		expect(ok(moveNode(base(), "joy/proud", 1))[0].children?.map((c) => c.id)).toEqual([
			"joy/calm",
			"joy/proud",
		]);
	});
	it("refuses a move past the end", () => {
		expect(moveNode(base(), "joy", -1).ok).toBe(false);
		expect(moveNode(base(), "fear", 1).ok).toBe(false);
	});
});
