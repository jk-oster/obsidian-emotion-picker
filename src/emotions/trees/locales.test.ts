import { describe, expect, it } from "vitest";
import { EmotionNode } from "../EmotionNode";
import { getDefaultEmotionTree } from "../index";
import { localeNames, locales } from "../locale/Locales";
import { countLeaves, validateTree } from "../tree";
import { DEFAULT_EMOTION_TREE } from "./en";
import { GERMAN_NAMES, GERMAN_NOUN_IDS } from "./de";
import { SPANISH_NAMES } from "./es";
import { SWEDISH_NAMES } from "./sv";
import { missingNames } from "./translate";

const collect = (nodes: EmotionNode[], out: EmotionNode[] = []): EmotionNode[] => {
	nodes.forEach((node) => {
		out.push(node);
		collect(node.children ?? [], out);
	});
	return out;
};

describe("locale trees", () => {
	it("registers de in the locale list", () => {
		expect(locales).toEqual(["en", "sv", "es", "de"]);
	});

	it("has a display name for every locale", () => {
		locales.forEach((locale) => expect(localeNames[locale]).toBeTruthy());
	});

	it.each([
		["es", SPANISH_NAMES],
		["sv", SWEDISH_NAMES],
		["de", GERMAN_NAMES],
	])("%s has a name for every node of the English tree", (_locale, names) => {
		expect(missingNames(DEFAULT_EMOTION_TREE, names)).toEqual([]);
	});

	it("detects a missing name", () => {
		const incomplete = JSON.parse(JSON.stringify(SPANISH_NAMES));
		delete incomplete.joy[1].proud[1].confident;
		expect(missingNames(DEFAULT_EMOTION_TREE, incomplete)).toEqual([
			"joy/proud/confident",
		]);
	});

	it.each(locales)("%s passes validation", (locale) => {
		expect(validateTree(getDefaultEmotionTree(locale)).errors).toEqual([]);
	});

	it.each(locales)("%s has the same ids, colors, and leaf count as English", (locale) => {
		const tree = getDefaultEmotionTree(locale);
		const english = DEFAULT_EMOTION_TREE;
		expect(collect(tree).map((n) => [n.id, n.color])).toEqual(
			collect(english).map((n) => [n.id, n.color])
		);
		expect(tree.reduce((sum, core) => sum + countLeaves(core), 0)).toBe(94);
	});

	it.each(["es", "sv", "de"])("%s translates names and has no empty name", (locale) => {
		const tree = collect(getDefaultEmotionTree(locale));
		const english = collect(DEFAULT_EMOTION_TREE);
		tree.forEach((node) => expect(node.name.trim()).not.toBe(""));
		const unchanged = tree.filter((node, index) => node.name === english[index].name);
		// Some words are the same in two languages (for example "sentimental").
		expect(unchanged.length).toBeLessThan(10);
	});

	it.each(locales)("%s uses lowercase names on every level, except German nouns", (locale) => {
		const nounIds = locale === "de" ? GERMAN_NOUN_IDS : [];
		collect(getDefaultEmotionTree(locale)).forEach((node) => {
			if (nounIds.indexOf(node.id) >= 0) return;
			expect(node.name).toBe(node.name.toLowerCase());
		});
	});

	it("keeps exactly the German nouns capitalized", () => {
		const german = collect(getDefaultEmotionTree("de"));
		GERMAN_NOUN_IDS.forEach((id) => {
			const node = german.find((candidate) => candidate.id === id)!;
			expect(node.name.charAt(0)).toBe(node.name.charAt(0).toUpperCase());
			expect(node.name.charAt(0)).not.toBe(node.name.charAt(0).toLowerCase());
		});
		const capitalized = german.filter(
			(node) => node.name.charAt(0) !== node.name.charAt(0).toLowerCase()
		);
		expect(capitalized.map((node) => node.id).sort()).toEqual([...GERMAN_NOUN_IDS].sort());
	});

	it.each(locales)("%s has no duplicate names among siblings", (locale) => {
		const check = (nodes: EmotionNode[]) => {
			const names = nodes.map((node) => node.name.toLowerCase());
			expect(new Set(names).size).toBe(names.length);
			nodes.forEach((node) => check(node.children ?? []));
		};
		check(getDefaultEmotionTree(locale));
	});
});
