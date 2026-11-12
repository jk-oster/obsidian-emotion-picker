import { describe, expect, it } from "vitest";
import { EmotionNode } from "../emotions/EmotionNode";
import { DEFAULT_EMOTION_TREE } from "../emotions/trees/en";
import {
	arcPath,
	labelFits,
	labelFontSize,
	labelPlacement,
	layoutWheel,
	ringRadii,
	Segment,
	HOLE_RADIUS,
	textColorFor,
} from "./geometry";

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
					{ id: "joy/proud/a", name: "A" },
					{ id: "joy/proud/b", name: "B" },
				],
			},
			{ id: "joy/content", name: "Content" },
		],
	},
	{ id: "fear", name: "Fear", color: "#dbab4b" },
];

const TWO_PI = Math.PI * 2;
const byId = (segments: Segment[], id: string) =>
	segments.find((segment) => segment.node.id === id)!;

describe("layoutWheel", () => {
	it("splits the circle by leaf count and covers 2π", () => {
		const { segments, rings } = layoutWheel(sample);
		const roots = segments.filter((segment) => segment.level === 1);
		expect(rings).toBe(3);
		expect(roots[0].startAngle).toBe(0);
		expect(roots[0].endAngle).toBeCloseTo((3 / 4) * TWO_PI);
		expect(roots[1].startAngle).toBeCloseTo(roots[0].endAngle);
		expect(roots[1].endAngle).toBeCloseTo(TWO_PI);
	});

	it("keeps children inside the parent angles with equal leaf angles", () => {
		const { segments } = layoutWheel(sample);
		const parent = byId(segments, "joy/proud");
		const [a, b] = ["joy/proud/a", "joy/proud/b"].map((id) => byId(segments, id));
		expect(a.startAngle).toBeCloseTo(parent.startAngle);
		expect(b.endAngle).toBeCloseTo(parent.endAngle);
		expect(a.endAngle - a.startAngle).toBeCloseTo(b.endAngle - b.startAngle);
		expect(a.ring).toBe(2);
		expect(a.level).toBe(3);
	});

	it("derives lighter colors for deeper levels", () => {
		const { segments } = layoutWheel(sample);
		expect(byId(segments, "joy").color).toBe("#c1e08d");
		expect(byId(segments, "joy/proud").color).not.toBe("#c1e08d");
		expect(byId(segments, "joy/proud/a").color).not.toBe(
			byId(segments, "joy/proud").color
		);
	});

	it("uses the number of levels of a two-level tree for the rings", () => {
		const twoLevels: EmotionNode[] = [
			{ id: "x", name: "X", color: "#000000", children: [{ id: "x/y", name: "Y" }] },
		];
		expect(layoutWheel(twoLevels).rings).toBe(2);
		expect(layoutWheel([{ id: "x", name: "X", color: "#000000" }]).rings).toBe(1);
	});

	it("zooms into a branch and fills the full circle", () => {
		const { segments, rings, focus } = layoutWheel(sample, "joy");
		expect(focus?.id).toBe("joy");
		expect(rings).toBe(2);
		const first = segments.filter((segment) => segment.ring === 0);
		expect(first.map((segment) => segment.node.id)).toEqual([
			"joy/proud",
			"joy/content",
		]);
		expect(first[0].startAngle).toBe(0);
		expect(first[1].endAngle).toBeCloseTo(TWO_PI);
		expect(first[0].level).toBe(2);
	});

	it("falls back to the full layout for a leaf or an unknown focus", () => {
		const full = layoutWheel(sample);
		expect(layoutWheel(sample, "fear")).toEqual(full);
		expect(layoutWheel(sample, "missing")).toEqual(full);
	});

	it("handles an empty tree", () => {
		expect(layoutWheel([])).toEqual({ segments: [], rings: 1 });
	});

	it("lays out the default tree with 6 + 31 + 94 segments", () => {
		const { segments, rings } = layoutWheel(DEFAULT_EMOTION_TREE);
		expect(rings).toBe(3);
		expect(segments.filter((s) => s.level === 1)).toHaveLength(6);
		expect(segments.filter((s) => s.level === 2)).toHaveLength(31);
		expect(segments.filter((s) => s.level === 3)).toHaveLength(94);
	});
});

describe("ringRadii", () => {
	it("starts at the hole and has no gaps between rings", () => {
		for (const rings of [1, 2, 3]) {
			expect(ringRadii(0, rings).inner).toBe(HOLE_RADIUS);
			for (let ring = 1; ring < rings; ring++) {
				expect(ringRadii(ring, rings).inner).toBe(ringRadii(ring - 1, rings).outer);
			}
			expect(ringRadii(rings - 1, rings).outer).toBe(HOLE_RADIUS + 250);
		}
	});
});

describe("arcPath", () => {
	const quarter: Segment = {
		node: sample[1],
		level: 1,
		ring: 0,
		startAngle: 0,
		endAngle: Math.PI / 2,
		color: "#000000",
	};

	it("draws a quarter sector with exact points", () => {
		expect(arcPath(quarter, { inner: 100, outer: 200 })).toBe(
			"M 300 100 A 200 200 0 0 1 500 300 L 400 300 A 100 100 0 0 0 300 200 Z"
		);
	});

	it("sets the large-arc flag above 180 degrees", () => {
		const big = { ...quarter, endAngle: Math.PI * 1.5 };
		expect(arcPath(big, { inner: 100, outer: 200 })).toContain("A 200 200 0 1 1");
	});

	it("draws a full circle as a ring with two arcs per circle", () => {
		const full = { ...quarter, endAngle: TWO_PI };
		const path = arcPath(full, { inner: 100, outer: 200 });
		expect(path.match(/A /g)).toHaveLength(4);
		expect(path.match(/Z/g)).toHaveLength(2);
		expect(path).not.toContain("NaN");
	});
});

describe("textColorFor", () => {
	it("picks the text color with the higher contrast", () => {
		expect(textColorFor("#ffffff")).toBe("#1a1a1a");
		expect(textColorFor("#000000")).toBe("#ffffff");
		expect(textColorFor("#c1e08d")).toBe("#1a1a1a");
		expect(textColorFor("#b84444")).toBe("#ffffff");
		expect(textColorFor("#4e72a3")).toBe("#ffffff");
		expect(textColorFor("#dbab4b")).toBe("#1a1a1a");
	});
});

describe("labels", () => {
	it("keeps all labels upright", () => {
		for (let step = 0; step < 360; step += 7) {
			const angle = (step * Math.PI) / 180;
			const segment: Segment = {
				node: sample[1],
				level: 1,
				ring: 0,
				startAngle: angle,
				endAngle: angle + 0.1,
				color: "#000000",
			};
			const { rotate } = labelPlacement(segment, { inner: 100, outer: 200 });
			expect(rotate).toBeGreaterThanOrEqual(-90);
			expect(rotate).toBeLessThanOrEqual(90);
		}
	});

	it("rotates a label on the right side along the radius", () => {
		const segment: Segment = {
			node: sample[1],
			level: 1,
			ring: 0,
			startAngle: Math.PI / 2 - 0.05,
			endAngle: Math.PI / 2 + 0.05,
			color: "#000000",
		};
		const placement = labelPlacement(segment, { inner: 100, outer: 200 });
		expect(placement.rotate).toBe(0);
		expect(placement.x).toBe(450);
		expect(placement.y).toBe(300);
	});

	it("shrinks a long label to fit and hides it below the minimum size", () => {
		const radii = ringRadii(0, 3);
		const segment = (name: string, endAngle = 1): Segment => ({
			node: { id: "a", name },
			level: 1,
			ring: 0,
			startAngle: 0,
			endAngle,
			color: "#000000",
		});
		expect(labelFontSize(segment("Sadness"), radii, 13)).toBe(13);
		const shrunk = labelFontSize(segment("Überraschung"), radii, 13)!;
		expect(shrunk).toBeGreaterThanOrEqual(9);
		expect(shrunk).toBeLessThan(13);
		expect(labelFontSize(segment("x".repeat(40)), radii, 13)).toBeUndefined();
		expect(labelFontSize(segment("Joy", 0.01), radii, 13)).toBeUndefined();
	});

	it("hides labels that are too long or too narrow", () => {
		const radii = ringRadii(2, 3);
		const wide: Segment = {
			node: { id: "a", name: "happy" },
			level: 3,
			ring: 2,
			startAngle: 0,
			endAngle: 0.2,
			color: "#000000",
		};
		expect(labelFits(wide, radii, 11)).toBe(true);
		expect(labelFits({ ...wide, endAngle: 0.01 }, radii, 11)).toBe(false);
		expect(
			labelFits({ ...wide, node: { id: "b", name: "x".repeat(40) } }, radii, 11)
		).toBe(false);
	});
});
