import { describe, expect, it } from "vitest";
import { getDefaultEmotionTree } from "../emotions/index";
import { importTree } from "./importTree";

describe("importTree", () => {
	it("accepts exported JSON and returns an identical tree", () => {
		const tree = getDefaultEmotionTree("en");
		const result = importTree(JSON.stringify(tree, null, 2));
		expect(result.errors).toEqual([]);
		expect(result.tree).toEqual(tree);
	});

	it("reports broken JSON without throwing", () => {
		const result = importTree("{ not json");
		expect(result.tree).toBeUndefined();
		expect(result.errors[0]).toContain("not valid JSON");
	});

	it("reports an empty text", () => {
		expect(importTree("").errors).toHaveLength(1);
	});

	it("rejects a valid JSON value that is no tree", () => {
		expect(importTree('{"a":1}').tree).toBeUndefined();
		expect(importTree("null").tree).toBeUndefined();
	});
});
