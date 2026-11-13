import { Notice, setIcon } from "obsidian";
import { EmotionNode } from "../emotions/EmotionNode";
import { countLeaves, MAX_DEPTH, MAX_NAME_LENGTH, shadeFor } from "../emotions/tree";
import {
	addNode,
	cleanName,
	EditResult,
	moveNode,
	removeNode,
	renameNode,
	setColor,
} from "../emotions/treeEdit";

const DELETE_CONFIRM_MS = 3000;

/**
 * Editor for the emotion tree in the settings tab.
 * It renders into its own container and re-renders only that container.
 * Every change goes through the pure functions in `treeEdit.ts`.
 */
export class TreeEditor {
	private expanded = new Set<string>();
	private pendingDelete: string | undefined;
	private pendingTimer: number | undefined;
	/** Id of a new node. Its name input gets the focus after the next render. */
	private focusId: string | undefined;

	constructor(
		private container: HTMLElement,
		private getTree: () => EmotionNode[],
		private saveTree: (tree: EmotionNode[]) => Promise<void>,
		/** Called after a structural change, so that the counters can update. */
		private onStructureChange: () => void
	) {}

	render(): void {
		this.container.empty();
		const list = this.container.createDiv({ cls: "emotion-tree-editor" });
		this.getTree().forEach((node, index, siblings) =>
			this.renderNode(list, node, 1, index, siblings.length)
		);

		const footer = this.container.createDiv({ cls: "emotion-tree-footer" });
		const add = footer.createEl("button", { text: "Add core emotion" });
		add.addEventListener("click", () => this.apply(addNode(this.getTree(), null, "New emotion")));

		if (this.focusId) {
			const input = this.container.querySelector<HTMLInputElement>(
				`input[data-node-id="${CSS.escape(this.focusId)}"]`
			);
			input?.focus();
			input?.select();
			this.focusId = undefined;
		}
	}

	private renderNode(
		parentEl: HTMLElement,
		node: EmotionNode,
		level: number,
		index: number,
		siblingCount: number,
		rootColor?: string
	): void {
		const color = level === 1 ? node.color : rootColor;
		const hasChildren = (node.children?.length ?? 0) > 0;
		const isOpen = this.expanded.has(node.id);

		const wrapper = parentEl.createDiv({ cls: "emotion-tree-node" });
		const row = wrapper.createDiv({ cls: "emotion-tree-row" });
		row.style.paddingLeft = `${(level - 1) * 1.5}rem`;

		const toggle = row.createEl("button", {
			cls: "clickable-icon emotion-tree-toggle",
			attr: { "aria-label": isOpen ? "Collapse" : "Expand" },
		});
		if (hasChildren) {
			setIcon(toggle, isOpen ? "chevron-down" : "chevron-right");
			toggle.addEventListener("click", () => {
				if (isOpen) this.expanded.delete(node.id);
				else this.expanded.add(node.id);
				this.render();
			});
		} else {
			toggle.disabled = true;
			toggle.addClass("is-placeholder");
		}

		if (level === 1) {
			const picker = row.createEl("input", {
				type: "color",
				cls: "emotion-tree-color",
				attr: { "aria-label": `Color of ${node.name}` },
			});
			picker.value = node.color ?? "#cccccc";
			picker.addEventListener("change", () =>
				this.apply(setColor(this.getTree(), node.id, picker.value))
			);
		} else {
			const swatch = row.createDiv({ cls: "emotion-tree-swatch" });
			swatch.style.backgroundColor = shadeFor(color ?? "#cccccc", level);
		}

		const nameInput = row.createEl("input", {
			type: "text",
			cls: "emotion-tree-name",
			attr: {
				"data-node-id": node.id,
				"aria-label": `Name of ${node.name}`,
				maxlength: String(MAX_NAME_LENGTH),
			},
		});
		nameInput.value = node.name;
		nameInput.addEventListener("change", () => {
			if (!cleanName(nameInput.value)) {
				new Notice(`The name must have 1 to ${MAX_NAME_LENGTH} characters.`);
				nameInput.value = node.name;
				return;
			}
			this.apply(renameNode(this.getTree(), node.id, nameInput.value), false);
		});

		if (hasChildren) {
			row.createSpan({
				cls: "emotion-tree-count",
				text: `${countLeaves(node)}`,
				attr: { "aria-label": "Outer words" },
			});
		}

		const actions = row.createDiv({ cls: "emotion-tree-actions" });
		this.iconButton(actions, "arrow-up", `Move ${node.name} up`, index === 0, () =>
			this.apply(moveNode(this.getTree(), node.id, -1), false, true)
		);
		this.iconButton(
			actions,
			"arrow-down",
			`Move ${node.name} down`,
			index === siblingCount - 1,
			() => this.apply(moveNode(this.getTree(), node.id, 1), false, true)
		);
		if (level < MAX_DEPTH) {
			this.iconButton(actions, "plus", `Add a word under ${node.name}`, false, () => {
				this.expanded.add(node.id);
				this.apply(addNode(this.getTree(), node.id, "New word"));
			});
		}
		const confirming = this.pendingDelete === node.id;
		const del = this.iconButton(
			actions,
			confirming ? "check" : "trash-2",
			confirming
				? `Click again to delete ${node.name}`
				: `Delete ${node.name}${hasChildren ? " and its words" : ""}`,
			false,
			() => this.onDelete(node, hasChildren)
		);
		if (confirming) del.addClass("mod-warning");

		if (hasChildren && isOpen) {
			const childrenEl = wrapper.createDiv({ cls: "emotion-tree-children" });
			node.children?.forEach((child, childIndex, siblings) =>
				this.renderNode(childrenEl, child, level + 1, childIndex, siblings.length, color)
			);
		}
	}

	private iconButton(
		parent: HTMLElement,
		icon: string,
		label: string,
		disabled: boolean,
		onClick: () => void
	): HTMLButtonElement {
		const button = parent.createEl("button", {
			cls: "clickable-icon",
			attr: { "aria-label": label },
		});
		setIcon(button, icon);
		button.disabled = disabled;
		button.addEventListener("click", onClick);
		return button;
	}

	/** A node with children needs a second click within a short time. */
	private onDelete(node: EmotionNode, hasChildren: boolean): void {
		if (hasChildren && this.pendingDelete !== node.id) {
			this.pendingDelete = node.id;
			window.clearTimeout(this.pendingTimer);
			this.pendingTimer = window.setTimeout(() => {
				this.pendingDelete = undefined;
				this.render();
			}, DELETE_CONFIRM_MS);
			this.render();
			return;
		}
		window.clearTimeout(this.pendingTimer);
		this.pendingDelete = undefined;
		this.apply(removeNode(this.getTree(), node.id));
	}

	/**
	 * Save a successful edit. A failed edit shows the reason.
	 * `rerender` is false for edits that the input already shows (rename, color).
	 * `structure` is true when the order changes. The counters stay unchanged then.
	 */
	private apply(result: EditResult, rerender = true, structure = false): void {
		if (!result.ok || !result.tree) {
			new Notice(result.reason ?? "The change failed.");
			return;
		}
		if (result.id) this.focusId = result.id;
		void this.saveTree(result.tree).then(() => {
			if (rerender || structure) this.render();
			if (rerender) this.onStructureChange();
		});
	}
}
