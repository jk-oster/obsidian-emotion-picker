import { describe, expect, it } from "vitest";
import { countLeaves, depthOf, validateTree } from "../tree";
import { DEFAULT_EMOTION_TREE } from "./en";

describe("English default tree", () => {
	it("passes validation", () => {
		const result = validateTree(DEFAULT_EMOTION_TREE);
		expect(result.errors).toEqual([]);
	});

	it("has six core emotions with three levels each", () => {
		expect(DEFAULT_EMOTION_TREE).toHaveLength(6);
		DEFAULT_EMOTION_TREE.forEach((core) => {
			expect(depthOf(core)).toBe(3);
			expect(core.color).toMatch(/^#[0-9a-f]{6}$/);
		});
	});

	it("has about 100 leaves", () => {
		const leaves = DEFAULT_EMOTION_TREE.reduce(
			(sum, core) => sum + countLeaves(core),
			0
		);
		expect(leaves).toBe(94);
	});
});
