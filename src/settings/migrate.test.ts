import { describe, expect, it } from "vitest";
import { getDefaultEmotionTree } from "../emotions/index";
import { depthOf } from "../emotions/tree";
import { convertLegacySections } from "./legacy/convert";
import { LEGACY_DEFAULTS } from "./legacy/defaults";
import { resolveEmotionTree } from "./migrate";

describe("resolveEmotionTree", () => {
	it("uses the default tree without data", () => {
		expect(resolveEmotionTree(null, "en")).toEqual(getDefaultEmotionTree("en"));
		expect(resolveEmotionTree(undefined, "de")).toEqual(
			getDefaultEmotionTree("de")
		);
	});

	it("keeps a stored tree unchanged", () => {
		const stored = [{ id: "a", name: "A", color: "#000000" }];
		expect(resolveEmotionTree({ emotionTree: stored }, "en")).toBe(stored);
	});

	it("prefers the stored tree over the old list", () => {
		const stored = [{ id: "a", name: "A", color: "#000000" }];
		const result = resolveEmotionTree(
			{ emotionTree: stored, emotions: LEGACY_DEFAULTS.en },
			"en"
		);
		expect(result).toBe(stored);
	});

	it.each(["en", "sv", "es"])(
		"maps an unchanged old %s default list to the three-level default tree",
		(locale) => {
			const result = resolveEmotionTree(
				{ emotions: JSON.parse(JSON.stringify(LEGACY_DEFAULTS[locale])) },
				"en"
			);
			expect(result).toEqual(getDefaultEmotionTree(locale));
			expect(depthOf(result[0])).toBe(3);
		}
	);

	it("converts a customized list to a two-level tree", () => {
		const custom = [
			{ id: 1, name: "Calm", color: "#112233", emotions: ["relaxed", "still"] },
		];
		const result = resolveEmotionTree({ emotions: custom }, "en");
		expect(result).toEqual([
			{
				id: "calm",
				name: "Calm",
				color: "#112233",
				children: [
					{ id: "calm/relaxed", name: "relaxed" },
					{ id: "calm/still", name: "still" },
				],
			},
		]);
	});

	it("treats a default list with one extra word as customized", () => {
		const changed = JSON.parse(JSON.stringify(LEGACY_DEFAULTS.en));
		changed[0].emotions.push("my own word");
		const result = resolveEmotionTree({ emotions: changed }, "en");
		expect(depthOf(result[0])).toBe(2);
		expect(result[0].children?.some((leaf) => leaf.name === "my own word")).toBe(true);
	});

	it("falls back to the default tree for an empty old list", () => {
		expect(resolveEmotionTree({ emotions: [] }, "en")).toEqual(
			getDefaultEmotionTree("en")
		);
	});

	it("does not change the input data", () => {
		const loaded = { emotions: JSON.parse(JSON.stringify(LEGACY_DEFAULTS.en)) };
		const before = JSON.stringify(loaded);
		resolveEmotionTree(loaded, "en");
		expect(JSON.stringify(loaded)).toBe(before);
	});
});

describe("convertLegacySections", () => {
	it("creates unique ids for duplicate names", () => {
		const tree = convertLegacySections([
			{ id: 1, name: "Joy", color: "#000000", emotions: ["calm", "calm"] },
			{ id: 2, name: "Joy", color: "#000000", emotions: ["calm"] },
		]);
		const ids = [
			tree[0].id,
			...tree[0].children!.map((child) => child.id),
			tree[1].id,
			...tree[1].children!.map((child) => child.id),
		];
		expect(new Set(ids).size).toBe(ids.length);
	});

	it("skips empty words and falls back for names without latin letters", () => {
		const tree = convertLegacySections([
			{ id: 1, name: "喜び", color: "bad", emotions: ["", "  ", "嬉しい"] },
		]);
		expect(tree[0].id).toBe("group-1");
		expect(tree[0].color).toBe("#888888");
		expect(tree[0].children).toEqual([
			{ id: "group-1/item-1", name: "嬉しい" },
		]);
	});

	it("shortens names to the maximum length", () => {
		const tree = convertLegacySections([
			{ id: 1, name: "x".repeat(60), color: "#000000", emotions: ["y".repeat(60)] },
		]);
		expect(tree[0].name).toHaveLength(40);
		expect(tree[0].children![0].name).toHaveLength(40);
	});
});

describe("getDefaultEmotionTree", () => {
	it("returns copies, not the shared default trees", () => {
		const copy = getDefaultEmotionTree("en");
		copy[0].name = "changed";
		expect(getDefaultEmotionTree("en")[0].name).toBe("joy");
	});

	it("uses English for an unknown locale", () => {
		expect(getDefaultEmotionTree("xx")).toEqual(getDefaultEmotionTree("en"));
	});
});
