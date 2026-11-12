import { describe, expect, it } from "vitest";
import { EmotionNode } from "./EmotionNode";
import {
	countLeaves,
	depthOf,
	findNode,
	MAX_NODES,
	pathTo,
	shadeFor,
	validateTree,
} from "./tree";

const sample: EmotionNode[] = [
	{
		id: "joy",
		name: "Joy",
		color: "#c1e08d",
		children: [
			{
				id: "joy/proud",
				name: "Proud",
				children: [
					{ id: "joy/proud/confident", name: "Confident" },
					{ id: "joy/proud/triumphant", name: "Triumphant" },
				],
			},
			{ id: "joy/content", name: "Content" },
		],
	},
	{ id: "fear", name: "Fear", color: "#dbab4b" },
];

describe("tree helpers", () => {
	it("counts leaves", () => {
		expect(countLeaves(sample[0])).toBe(3);
		expect(countLeaves(sample[1])).toBe(1);
	});

	it("measures depth", () => {
		expect(depthOf(sample[0])).toBe(3);
		expect(depthOf(sample[1])).toBe(1);
	});

	it("finds a node and its path", () => {
		expect(findNode(sample, "joy/proud/confident")?.name).toBe("Confident");
		expect(findNode(sample, "missing")).toBeUndefined();
		expect(pathTo(sample, "joy/proud/confident").map((n) => n.name)).toEqual([
			"Joy",
			"Proud",
			"Confident",
		]);
		expect(pathTo(sample, "missing")).toEqual([]);
	});

	it("shades colors lighter by level", () => {
		expect(shadeFor("#000000", 1)).toBe("#000000");
		expect(shadeFor("#000000", 2)).toBe("#595959");
		expect(shadeFor("#000000", 3)).toBe("#999999");
		expect(shadeFor("not-a-color", 2)).toBe("not-a-color");
	});
});

describe("validateTree", () => {
	it("accepts a valid tree and returns a clean copy", () => {
		const input = [{ ...sample[1], extra: "drop me" }];
		const result = validateTree(input);
		expect(result.errors).toEqual([]);
		expect(result.tree).toEqual([sample[1]]);
	});

	it("rejects non-arrays and empty arrays", () => {
		expect(validateTree({}).errors).toHaveLength(1);
		expect(validateTree([]).errors).toHaveLength(1);
	});

	it("rejects a missing level-1 color", () => {
		expect(validateTree([{ id: "a", name: "A" }]).errors[0]).toContain("color");
	});

	it("rejects duplicate ids", () => {
		const result = validateTree([
			{ id: "a", name: "A", color: "#000000" },
			{ id: "a", name: "B", color: "#000000" },
		]);
		expect(result.errors[0]).toContain("not unique");
	});

	it("rejects a tree deeper than 3 levels", () => {
		const result = validateTree([
			{
				id: "a",
				name: "A",
				color: "#000000",
				children: [
					{
						id: "b",
						name: "B",
						children: [
							{ id: "c", name: "C", children: [{ id: "d", name: "D" }] },
						],
					},
				],
			},
		]);
		expect(result.errors[0]).toContain("deeper");
	});

	it("rejects too many nodes", () => {
		const children = Array.from({ length: MAX_NODES }, (_, i) => ({
			id: `n${i}`,
			name: `N${i}`,
		}));
		const result = validateTree([
			{ id: "root", name: "Root", color: "#000000", children },
		]);
		expect(result.errors.join(" ")).toContain(`${MAX_NODES} nodes`);
	});

	it("rejects long names and bad children", () => {
		expect(
			validateTree([{ id: "a", name: "x".repeat(41), color: "#000000" }])
				.errors[0]
		).toContain("longer");
		expect(
			validateTree([{ id: "a", name: "A", color: "#000000", children: "no" }])
				.errors[0]
		).toContain("array");
	});

	it("keeps HTML as plain text without changing it", () => {
		const html = "<img src=x onerror=alert(1)>";
		const result = validateTree([{ id: "a", name: html, color: "#000000" }]);
		expect(result.tree?.[0].name).toBe(html);
	});
});
