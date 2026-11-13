import { describe, expect, it } from "vitest";
import { getDefaultEmotionTree } from "../emotions/index";
import { LocaleTreeState, sanitizeLocaleTrees, switchLocale } from "./localeTrees";

const custom = [{ id: "mine", name: "Mine", color: "#112233" }];

describe("switchLocale", () => {
	it("saves the custom tree and restores it on the way back", () => {
		const start = { locale: "en", emotionTree: custom, localeTrees: {} };
		const inDe = switchLocale(start, "de");
		expect(inDe.emotionTree).toEqual(getDefaultEmotionTree("de"));
		expect(inDe.localeTrees).toEqual({ en: custom });

		const backInEn = switchLocale(inDe, "en");
		expect(backInEn.emotionTree).toEqual(custom);
		expect(backInEn.localeTrees).toEqual({});
	});

	it("keeps the edits of several locales", () => {
		const customDe = [{ id: "meins", name: "Meins", color: "#445566" }];
		let state: LocaleTreeState = { locale: "en", emotionTree: custom, localeTrees: {} };
		state = switchLocale(state, "de");
		state = { ...state, emotionTree: customDe };
		state = switchLocale(state, "es");
		expect(state.localeTrees).toEqual({ en: custom, de: customDe });
		state = switchLocale(state, "de");
		expect(state.emotionTree).toEqual(customDe);
		expect(state.localeTrees).toEqual({ en: custom });
	});

	it("does not save an unchanged default tree", () => {
		const start = { locale: "en", emotionTree: getDefaultEmotionTree("en"), localeTrees: {} };
		expect(switchLocale(start, "de").localeTrees).toEqual({});
	});

	it("does nothing for the same locale and does not change the input", () => {
		const start = { locale: "en", emotionTree: custom, localeTrees: {} };
		expect(switchLocale(start, "en")).toBe(start);
		switchLocale(start, "de");
		expect(start.localeTrees).toEqual({});
	});
});

describe("sanitizeLocaleTrees", () => {
	it("keeps valid trees and drops invalid ones and the active locale", () => {
		const result = sanitizeLocaleTrees(
			{ de: custom, es: [{ id: "x" }], en: custom, sv: "text" },
			"en"
		);
		expect(Object.keys(result)).toEqual(["de"]);
	});
	it("returns an empty object for bad input", () => {
		expect(sanitizeLocaleTrees(undefined, "en")).toEqual({});
		expect(sanitizeLocaleTrees([custom], "en")).toEqual({});
	});
});
