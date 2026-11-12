import { EmotionNode } from "../emotions/EmotionNode";
import { countLeaves, depthOf, MAX_DEPTH, pathTo, shadeFor } from "../emotions/tree";

/** The wheel uses a square viewBox. Angle 0 points up. Angles grow clockwise. */
export const WHEEL_SIZE = 600;
export const CENTER = WHEEL_SIZE / 2;
/** Radius of the center disc. It shows the focused node in zoom mode. */
export const HOLE_RADIUS = 45;
const RING_WIDTHS: Record<number, number[]> = {
	1: [250],
	2: [100, 150],
	3: [80, 80, 90],
};
const FALLBACK_COLOR = "#888888";
const FULL_CIRCLE = Math.PI * 2;

export interface Radii {
	inner: number;
	outer: number;
}

export interface Segment {
	node: EmotionNode;
	/** Level in the tree (1 to 3), not the ring position. */
	level: number;
	/** Ring position from the center, starting at 0. */
	ring: number;
	startAngle: number;
	endAngle: number;
	color: string;
}

export interface WheelLayout {
	segments: Segment[];
	rings: number;
	/** Set when the layout shows one branch zoomed to 360 degrees. */
	focus?: EmotionNode;
}

const round = (value: number): number => Math.round(value * 100) / 100;

export function ringRadii(ring: number, rings: number): Radii {
	const widths = RING_WIDTHS[Math.min(Math.max(rings, 1), 3)];
	let inner = HOLE_RADIUS;
	for (let index = 0; index < ring; index++) inner += widths[index];
	return { inner, outer: inner + widths[Math.min(ring, widths.length - 1)] };
}

/**
 * Lay out the tree as rings. Each leaf gets the same angle.
 * A parent spans the angles of its children.
 * With `focusId`, the children of that node fill the full circle.
 * A focus on a leaf, or on an unknown id, gives the full layout.
 */
export function layoutWheel(roots: EmotionNode[], focusId?: string): WheelLayout {
	const segments: Segment[] = [];

	const place = (
		nodes: EmotionNode[],
		startAngle: number,
		endAngle: number,
		level: number,
		ring: number,
		baseColor?: string
	): void => {
		if (ring >= MAX_DEPTH) return;
		const total = nodes.reduce((sum, node) => sum + countLeaves(node), 0);
		let cursor = startAngle;
		nodes.forEach((node) => {
			const share = (countLeaves(node) / total) * (endAngle - startAngle);
			const nodeBase = baseColor ?? node.color ?? FALLBACK_COLOR;
			const segment: Segment = {
				node,
				level,
				ring,
				startAngle: cursor,
				endAngle: cursor + share,
				color: shadeFor(nodeBase, level),
			};
			segments.push(segment);
			if (node.children && node.children.length > 0) {
				place(node.children, cursor, cursor + share, level + 1, ring + 1, nodeBase);
			}
			cursor += share;
		});
	};

	const focusPath = focusId ? pathTo(roots, focusId) : [];
	const focus = focusPath[focusPath.length - 1];
	if (focus && focus.children && focus.children.length > 0) {
		const baseColor = focusPath[0].color ?? FALLBACK_COLOR;
		const rings = Math.min(depthOf(focus) - 1, MAX_DEPTH);
		place(focus.children, 0, FULL_CIRCLE, focusPath.length + 1, 0, baseColor);
		return { segments, rings, focus };
	}

	const rings = Math.min(
		Math.max(1, ...roots.map((root) => depthOf(root))),
		MAX_DEPTH
	);
	place(roots, 0, FULL_CIRCLE, 1, 0);
	return { segments, rings };
}

const point = (angle: number, radius: number): [number, number] => [
	round(CENTER + radius * Math.sin(angle)),
	round(CENTER - radius * Math.cos(angle)),
];

/** SVG path data for an annular sector. Use with `fill-rule="evenodd"`. */
export function arcPath(segment: Segment, radii: Radii): string {
	const { startAngle, endAngle } = segment;
	const { inner, outer } = radii;
	const sweep = endAngle - startAngle;

	if (sweep >= FULL_CIRCLE - 1e-6) {
		const [topX, topY] = point(0, outer);
		const [bottomX, bottomY] = point(Math.PI, outer);
		let path =
			`M ${topX} ${topY} A ${outer} ${outer} 0 1 1 ${bottomX} ${bottomY} ` +
			`A ${outer} ${outer} 0 1 1 ${topX} ${topY} Z`;
		if (inner > 0) {
			const [innerTopX, innerTopY] = point(0, inner);
			const [innerBottomX, innerBottomY] = point(Math.PI, inner);
			path +=
				` M ${innerTopX} ${innerTopY} A ${inner} ${inner} 0 1 0 ${innerBottomX} ${innerBottomY} ` +
				`A ${inner} ${inner} 0 1 0 ${innerTopX} ${innerTopY} Z`;
		}
		return path;
	}

	const largeArc = sweep > Math.PI ? 1 : 0;
	const [outerStartX, outerStartY] = point(startAngle, outer);
	const [outerEndX, outerEndY] = point(endAngle, outer);
	const [innerEndX, innerEndY] = point(endAngle, inner);
	const [innerStartX, innerStartY] = point(startAngle, inner);
	return (
		`M ${outerStartX} ${outerStartY} ` +
		`A ${outer} ${outer} 0 ${largeArc} 1 ${outerEndX} ${outerEndY} ` +
		`L ${innerEndX} ${innerEndY} ` +
		`A ${inner} ${inner} 0 ${largeArc} 0 ${innerStartX} ${innerStartY} Z`
	);
}

const linearChannel = (channel: number): number => {
	const value = channel / 255;
	return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
};

/** Dark or white text, whichever has the higher contrast on the given #rrggbb color. */
export function textColorFor(hex: string): string {
	const [red, green, blue] = [1, 3, 5].map((start) =>
		linearChannel(parseInt(hex.slice(start, start + 2), 16))
	);
	const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
	// White wins when 1.05 / (L + 0.05) > (L + 0.05) / 0.06 (dark text #1a1a1a).
	return luminance < 0.2 ? "#ffffff" : "#1a1a1a";
}

export interface LabelPlacement {
	x: number;
	y: number;
	/** Rotation in degrees, always between -90 and 90 so text is never upside down. */
	rotate: number;
}

/** Radial label at the middle of the segment. Text on the left half is flipped. */
export function labelPlacement(segment: Segment, radii: Radii): LabelPlacement {
	const middleAngle = (segment.startAngle + segment.endAngle) / 2;
	const [x, y] = point(middleAngle, (radii.inner + radii.outer) / 2);
	const degrees = (middleAngle * 180) / Math.PI;
	let rotate = degrees - 90;
	if (degrees > 180) rotate += 180;
	if (rotate > 90) rotate -= 360;
	return { x, y, rotate: round(rotate) };
}

/** Smallest font size (in viewBox units) the wheel shows. Smaller labels stay hidden. */
export const MIN_FONT_SIZE = 9;
/** Average glyph width as a share of the font size. A rough estimate for sans-serif text. */
const GLYPH_WIDTH = 0.56;

/**
 * Does the label fit inside the segment at this font size?
 * Radial text must be short enough for the ring width.
 * The text height must fit the arc length at the middle radius.
 */
export function labelFits(
	segment: Segment,
	radii: Radii,
	fontSize: number
): boolean {
	const middleRadius = (radii.inner + radii.outer) / 2;
	const arcLength = (segment.endAngle - segment.startAngle) * middleRadius;
	const textLength = segment.node.name.length * fontSize * GLYPH_WIDTH;
	return arcLength >= fontSize * 1.1 && textLength <= (radii.outer - radii.inner) * 0.9;
}

/**
 * Largest font size up to `baseSize` at which the label fits.
 * Returns undefined when even `MIN_FONT_SIZE` is too large. The tooltip still shows the name.
 */
export function labelFontSize(
	segment: Segment,
	radii: Radii,
	baseSize: number
): number | undefined {
	const middleRadius = (radii.inner + radii.outer) / 2;
	const arcLength = (segment.endAngle - segment.startAngle) * middleRadius;
	const byWidth = ((radii.outer - radii.inner) * 0.9) / (Math.max(segment.node.name.length, 1) * GLYPH_WIDTH);
	const byArc = arcLength / 1.1;
	const size = Math.floor(Math.min(baseSize, byWidth, byArc) * 2) / 2;
	return size >= MIN_FONT_SIZE ? size : undefined;
}
