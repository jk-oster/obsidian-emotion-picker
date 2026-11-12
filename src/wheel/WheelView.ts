import { EmotionNode } from "../emotions/EmotionNode";
import { pathTo } from "../emotions/tree";
import {
	arcPath,
	CENTER,
	HOLE_RADIUS,
	labelFontSize,
	labelPlacement,
	layoutWheel,
	ringRadii,
	Segment,
	textColorFor,
	WHEEL_SIZE,
	WheelLayout,
} from "./geometry";

const SVG_NS = "http://www.w3.org/2000/svg";
const FONT_SIZE_BY_LEVEL: Record<number, number> = { 1: 13, 2: 11, 3: 11 };
const CENTER_LABEL_LIMIT = 9;

export interface WheelOptions {
	tree: EmotionNode[];
	/** Called when the user picks a node. */
	onSelect: (node: EmotionNode) => void;
	/** Tap on a node with children zooms into it instead of picking it (mobile). */
	zoomOnTap: boolean;
}

function svgElement<K extends keyof SVGElementTagNameMap>(
	tag: K,
	attributes: Record<string, string> = {}
): SVGElementTagNameMap[K] {
	const element = document.createElementNS(SVG_NS, tag);
	Object.keys(attributes).forEach((name) => element.setAttribute(name, attributes[name]));
	return element;
}

/**
 * Sunburst wheel drawn with plain SVG.
 * All text goes through textContent. Node names can come from imported JSON.
 */
export class WheelView {
	private readonly container: HTMLElement;
	private readonly options: WheelOptions;
	private readonly parents = new Map<string, EmotionNode | undefined>();
	private focusId: string | undefined;
	private layout: WheelLayout;
	private segmentElements = new Map<string, SVGGElement>();
	private currentId: string | undefined;
	private wrapper: HTMLElement | undefined;

	constructor(container: HTMLElement, options: WheelOptions) {
		this.container = container;
		this.options = options;
		this.indexParents(options.tree, undefined);
		this.render();
	}

	destroy(): void {
		this.container.empty();
		this.segmentElements.clear();
	}

	private indexParents(nodes: EmotionNode[], parent: EmotionNode | undefined): void {
		nodes.forEach((node) => {
			this.parents.set(node.id, parent);
			this.indexParents(node.children ?? [], node);
		});
	}

	private hasChildren(node: EmotionNode): boolean {
		return !!node.children && node.children.length > 0;
	}

	/** Keyboard focus moves into the new layout only after a keyboard action. */
	private setFocus(id: string | undefined, viaKeyboard = false): void {
		this.focusId = id;
		this.render(viaKeyboard);
	}

	private activate(node: EmotionNode, viaKeyboard = false): void {
		if (this.options.zoomOnTap && this.hasChildren(node)) {
			this.setFocus(node.id, viaKeyboard);
			return;
		}
		this.options.onSelect(node);
	}

	private render(restoreKeyboardFocus = false): void {
		this.container.empty();
		this.segmentElements.clear();
		this.layout = layoutWheel(this.options.tree, this.focusId);
		this.focusId = this.layout.focus?.id;

		this.wrapper = this.container.createDiv({ cls: "emotion-wheel" });
		if (this.layout.focus) this.renderBackButton(this.wrapper);

		const svg = svgElement("svg", {
			viewBox: `0 0 ${WHEEL_SIZE} ${WHEEL_SIZE}`,
			role: "group",
			"aria-label": "Emotion wheel",
			class: "emotion-wheel-svg",
		});
		this.wrapper.appendChild(svg);

		this.layout.segments.forEach((segment) => svg.appendChild(this.renderSegment(segment)));
		svg.appendChild(this.renderCenter());
		svg.addEventListener("keydown", (event) => this.onKeyDown(event));

		const first = this.layout.segments[0];
		this.currentId = first?.node.id;
		this.updateTabStops();
		if (restoreKeyboardFocus) this.focusCurrent();
	}

	private renderBackButton(parentEl: HTMLElement): void {
		const button = parentEl.createEl("button", {
			cls: "emotion-wheel-back",
			text: "← Back",
		});
		button.addEventListener("click", () => {
			const focus = this.layout.focus;
			this.setFocus(focus ? this.parents.get(focus.id)?.id : undefined);
		});
	}

	private renderSegment(segment: Segment): SVGGElement {
		const radii = ringRadii(segment.ring, this.layout.rings);
		const path = pathTo(this.options.tree, segment.node.id);
		const fullName = path.map((node) => node.name).join(", ");

		const group = svgElement("g", {
			class: "emotion-wheel-segment",
			role: "button",
			tabindex: "-1",
			"aria-label": fullName,
		});
		const title = svgElement("title");
		title.textContent = fullName;
		group.appendChild(title);

		group.appendChild(
			svgElement("path", {
				d: arcPath(segment, radii),
				fill: segment.color,
				"fill-rule": "evenodd",
			})
		);

		const fontSize = labelFontSize(segment, radii, FONT_SIZE_BY_LEVEL[segment.level] ?? 11);
		if (fontSize !== undefined) {
			const { x, y, rotate } = labelPlacement(segment, radii);
			const label = svgElement("text", {
				transform: `translate(${x} ${y}) rotate(${rotate})`,
				"text-anchor": "middle",
				"dominant-baseline": "central",
				"font-size": String(fontSize),
				fill: textColorFor(segment.color),
				class: "emotion-wheel-label",
			});
			label.textContent = segment.node.name;
			group.appendChild(label);
		}

		group.addEventListener("click", () => this.activate(segment.node));
		group.addEventListener("focus", () => {
			this.currentId = segment.node.id;
			this.updateTabStops();
		});
		this.segmentElements.set(segment.node.id, group);
		return group;
	}

	/** Center disc. In zoom mode it shows the focused node and picks it on click. */
	private renderCenter(): SVGGElement {
		const focus = this.layout.focus;
		const group = svgElement("g", { class: "emotion-wheel-center" });
		group.appendChild(svgElement("circle", { cx: String(CENTER), cy: String(CENTER), r: String(HOLE_RADIUS) }));

		if (focus) {
			group.setAttribute("role", "button");
			group.setAttribute("tabindex", "0");
			group.setAttribute("aria-label", `Insert ${focus.name}`);
			const title = svgElement("title");
			title.textContent = `Insert ${focus.name}`;
			group.appendChild(title);

			const text = svgElement("text", {
				x: String(CENTER),
				y: String(CENTER),
				"text-anchor": "middle",
				"dominant-baseline": "central",
				"font-size": "11",
				class: "emotion-wheel-label",
			});
			text.textContent =
				focus.name.length > CENTER_LABEL_LIMIT
					? focus.name.slice(0, CENTER_LABEL_LIMIT - 1) + "…"
					: focus.name;
			group.appendChild(text);
			group.addEventListener("click", () => this.options.onSelect(focus));
			group.addEventListener("keydown", (event) => {
				if (event.key === "Enter" || event.key === " ") {
					event.preventDefault();
					event.stopPropagation();
					this.options.onSelect(focus);
				}
			});
		} else {
			group.setAttribute("aria-hidden", "true");
		}
		return group;
	}

	/** Roving tabindex: one tab stop for the whole wheel. */
	private updateTabStops(): void {
		this.segmentElements.forEach((element, id) => {
			element.setAttribute("tabindex", id === this.currentId ? "0" : "-1");
		});
	}

	private focusCurrent(): void {
		if (this.currentId) this.segmentElements.get(this.currentId)?.focus();
	}

	private visibleSiblings(node: EmotionNode): EmotionNode[] {
		const parent = this.parents.get(node.id);
		const siblings = parent ? parent.children ?? [] : this.options.tree;
		return siblings.filter((sibling) => this.segmentElements.has(sibling.id));
	}

	private onKeyDown(event: KeyboardEvent): void {
		const currentId = this.currentId;
		if (!currentId) return;
		const current = pathTo(this.options.tree, currentId).pop();
		if (!current) return;

		let target: EmotionNode | undefined;
		switch (event.key) {
			case "ArrowRight":
			case "ArrowLeft": {
				const siblings = this.visibleSiblings(current);
				const step = event.key === "ArrowRight" ? 1 : -1;
				const index = siblings.findIndex((node) => node.id === current.id);
				target = siblings[(index + step + siblings.length) % siblings.length];
				break;
			}
			case "ArrowDown":
				target = (current.children ?? []).find((child) => this.segmentElements.has(child.id));
				break;
			case "ArrowUp": {
				const parent = this.parents.get(current.id);
				if (parent && this.segmentElements.has(parent.id)) target = parent;
				break;
			}
			case "Enter":
			case " ":
				event.preventDefault();
				this.activate(current, true);
				return;
			default:
				return;
		}

		event.preventDefault();
		if (target) {
			this.currentId = target.id;
			this.updateTabStops();
			this.focusCurrent();
		}
	}
}
