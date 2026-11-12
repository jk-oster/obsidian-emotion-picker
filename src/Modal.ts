import EmotionPickerPlugin from "main";
import {
	App,
	Modal,
	MarkdownView,
	Notice,
	EditorPosition,
	Editor,
	Platform,
} from "obsidian";
import { EmotionNode } from "./emotions/EmotionNode";
import { getDefaultEmotionTree } from "./emotions/index";
import { localeNames, locales } from "./emotions/locale/Locales";
import { EmotionPickerSettings, ViewMode } from "./settings/PluginSettings";
import { WheelView } from "./wheel/WheelView";

export class EmotionPickerModal extends Modal {
	app: App;
	plugin: EmotionPickerPlugin;
	content: HTMLElement;
	tree: EmotionNode[];
	editor: Editor;
	initialCursorPosition: EditorPosition;
	// current settings
	state: EmotionPickerSettings;
	/** The row with all controls: toggles, view switch, language dropdown. */
	controlsEl: HTMLElement;
	viewEl: HTMLElement;
	viewSwitchEl: HTMLElement;
	wheel: WheelView | undefined;

	constructor(app: App, plugin: EmotionPickerPlugin) {
		super(app);
		this.app = app;
		this.plugin = plugin;
		this.tree = plugin.getEmotionTree();
	}

	onOpen() {
		const { contentEl } = this;
		this.state = this.plugin.settings;
		this.modalEl.addClass("emotion-picker-modal");
		contentEl.classList.add("modal-body");

		this.generateHeading();
		this.generateToggles();
		this.generateViewSwitch();
		this.viewEl = contentEl.createDiv();
		this.renderView();

		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (view) {
			this.editor = view.editor;
			this.initialCursorPosition = this.editor.getCursor();
		} else {
			new Notice(`Error getting cursor position.`);
			this.close();
		}
	}

	onClose() {
		const { contentEl } = this;
		this.wheel?.destroy();
		this.wheel = undefined;
		contentEl.empty();
		this.initialCursorPosition = undefined;
	}

	/**
	 * Language of the default setting, or English when the saved value is unknown.
	 * The language switch preselects it.
	 */
	getDefaultLocale(): string {
		return locales.indexOf(this.state.locale) >= 0 ? this.state.locale : "en";
	}

	/**
	 * Dropdown to look at the default tree of another language.
	 * The default language shows the saved tree, so custom emotions stay visible.
	 * The choice lasts until the picker closes. It never changes the saved settings.
	 */
	generateLanguageSwitch(baseEl: HTMLElement): void {
		const defaultLocale = this.getDefaultLocale();
		const select = baseEl.createEl("select", { cls: "dropdown emotion-language-switch" });
		select.setAttribute("aria-label", "Language");
		locales.forEach((locale) => {
			const option = select.createEl("option", {
				text: localeNames[locale] ?? locale,
			});
			option.value = locale;
		});
		select.value = defaultLocale;
		select.addEventListener("change", () => {
			this.tree =
				select.value === defaultLocale
					? this.plugin.getEmotionTree()
					: getDefaultEmotionTree(select.value);
			this.renderView();
		});
	}

	/** Two buttons that switch between wheel and list, and the language dropdown. */
	generateViewSwitch(): void {
		// Same row as the toggles. The row wraps on a narrow window.
		this.viewSwitchEl = this.controlsEl.createDiv({ cls: "emotion-view-switch" });
		const modes: { mode: ViewMode; label: string }[] = [
			{ mode: "wheel", label: "Wheel" },
			{ mode: "list", label: "List" },
		];
		modes.forEach(({ mode, label }) => {
			const button = this.viewSwitchEl.createEl("button", { text: label });
			button.dataset.mode = mode;
			button.onClickEvent(async () => {
				if (this.state.viewMode === mode) return;
				this.state.viewMode = mode;
				await this.plugin.saveSettings();
				this.renderView();
			});
		});
		this.generateLanguageSwitch(this.viewSwitchEl);
	}

	renderView(): void {
		this.wheel?.destroy();
		this.wheel = undefined;
		this.viewEl.empty();

		const isWheel = this.state.viewMode !== "list";
		this.viewEl.toggleClass("emotion-wheel-container", isWheel);
		this.viewSwitchEl.querySelectorAll("button").forEach((button) => {
			button.setAttribute(
				"aria-pressed",
				String((button.dataset.mode === "wheel") === isWheel)
			);
		});

		if (isWheel) {
			this.wheel = new WheelView(this.viewEl, {
				tree: this.tree,
				onSelect: (node) => this.selectEmotion(node),
				zoomOnTap: Platform.isMobile,
			});
		} else {
			this.generateContentFromEmotions(this.viewEl);
		}
	}

	generateHeading(): void {
		const headingEl = this.contentEl.createEl("h3");
		headingEl.innerText = this.plugin.settings.modalHeaderText;
	}

	generateToggles(): void {
		const togglesEl = this.contentEl.createDiv();
		togglesEl.addClass("toggles-section");
		this.controlsEl = togglesEl;

		const useCommaToggleEl = this.generateToggleElement(
			togglesEl,
			"add comma after",
			this.state.useCommaInSeparator
		);
		useCommaToggleEl.onClickEvent(() => {
			this.state.useCommaInSeparator = !this.state.useCommaInSeparator;
		});

		const addAsLinkToggleEl = this.generateToggleElement(
			togglesEl,
			"add as [[link]]",
			this.state.addAsLink
		);
		addAsLinkToggleEl.onClickEvent(() => {
			this.state.addAsLink = !this.state.addAsLink;
		});

		const addAsTagToggleEl = this.generateToggleElement(
			togglesEl,
			"add as #tag",
			this.state.addAsTag
		);
		addAsTagToggleEl.onClickEvent(() => {
			this.state.addAsTag = !this.state.addAsTag;
		});
	}

	generateContentFromEmotions(baseEl: HTMLElement): void {
		this.tree.forEach((coreNode) => {
			this.generateElementFromEmotionSection(coreNode, baseEl);
		});
	}

	/** List view: a level-1 node is a heading. Its descendants are clickable words. */
	generateElementFromEmotionSection(
		coreNode: EmotionNode,
		baseEl: HTMLElement
	): void {
		const sectionEl = baseEl.createDiv();
		sectionEl.classList.add("emotion-section");

		const heading = sectionEl.createEl("h4");
		heading.textContent = coreNode.name;
		heading.style.color = coreNode.color;
		heading.style.fontWeight = "bold";

		this.generateWordElements(coreNode.children ?? [], sectionEl, coreNode.color);
	}

	generateWordElements(
		nodes: EmotionNode[],
		baseEl: HTMLElement,
		color: string
	): void {
		nodes.forEach((node) => {
			const emotionEl = baseEl.createDiv();
			// textContent, never innerHTML: node names can come from imported JSON.
			emotionEl.textContent = node.name;
			emotionEl.style.textDecorationColor = color;
			emotionEl.classList.add("emotion-element");
			if (node.children && node.children.length > 0) {
				emotionEl.classList.add("emotion-element-group");
			}
			emotionEl.onClickEvent(() => this.selectEmotion(node));

			if (node.children && node.children.length > 0) {
				this.generateWordElements(node.children, baseEl, color);
			}
		});
	}

	/** One entry point for list view and wheel view. */
	selectEmotion(node: EmotionNode): void {
		this.insertText(this.getFinalText(node.name));
	}

	insertText(text: string): void {
		if (this.editor) {
			this.editor.replaceRange(text, this.initialCursorPosition);
			this.initialCursorPosition.ch += text.length;
		}

		new Notice(`Inserted '${text}'.`);
	}

	generateToggleElement(
		baseEl: HTMLElement,
		text: string,
		initialState = false
	): HTMLDivElement {
		const toggleContainerEl = baseEl.createDiv();

		const toggleEl = toggleContainerEl.createDiv();
		toggleEl.classList.add("checkbox-container");
		toggleEl.onClickEvent(() => toggleEl.classList.toggle("is-enabled"));

		if (initialState == true) {
			toggleEl.classList.add("is-enabled");
		}

		const labelEl = toggleContainerEl.createEl("span");
		labelEl.classList.add("emotion-toggle-label");
		labelEl.textContent = text;

		return toggleContainerEl;
	}

	getFinalText(text: string): string {
		if (this.state.capitalize) text = this.capitalize(text);
		if (this.state.addAsTag) text = `#${text}`;
		if (this.state.addAsLink) text = `[[${text}]]`;
		if (this.state.useCommaInSeparator) text = text + ", ";
		text = " " + text;
		return text;
	}

	capitalize(text: string): string {
		return text.charAt(0).toUpperCase() + text.slice(1);
	}
}
