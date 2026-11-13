import { App, Notice, PluginSettingTab, Setting } from "obsidian";
import { localeNames, locales } from "../emotions/locale/Locales";
import EmotionPickerPlugin from "../../main";
import { EmotionPickerLocaleOverride, ViewMode } from "./PluginSettings";
import { getDefaultEmotionTree } from "src/emotions";
import { countLeaves } from "../emotions/tree";
import { importTree } from "./importTree";
import { TreeEditor } from "./TreeEditor";
import { switchLocale } from "./localeTrees";

export class EmotionPickerSettingsTab extends PluginSettingTab {
	plugin: EmotionPickerPlugin;
	importText = "";

	constructor(app: App, plugin: EmotionPickerPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	refresh(): void {
		this.display();
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl("h2", { text: "Emotion Picker Settings" });

		new Setting(containerEl)
			.setName("Modal header text")
			.setDesc("Customize modal header text")
			.addText((textField) => {
				textField.setValue(this.plugin.settings.modalHeaderText);
				textField.onChange((newValue) => {
					this.plugin.settings.modalHeaderText = newValue;
					this.plugin.saveSettings();
				});
			});

		new Setting(containerEl)
			.setName("Add comma after")
			.setDesc("Add a comma after pasted emotion")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.useCommaInSeparator)
					.onChange(async (value) => {
						this.plugin.settings.useCommaInSeparator = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Insert as link")
			.setDesc("Insert emotion as a [[link]]")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.addAsLink)
					.onChange(async (value) => {
						this.plugin.settings.addAsLink = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Insert as tag")
			.setDesc("Insert emotion as a #tag")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.addAsTag)
					.onChange(async (value) => {
						this.plugin.settings.addAsTag = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Capitalize")
			.setDesc("Capitalize (useful if inserting emotion as link or tag)")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.capitalize)
					.onChange(async (value) => {
						this.plugin.settings.capitalize = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Default view")
			.setDesc("Show the emotion wheel or the plain list when the picker opens")
			.addDropdown((dropdown) => {
				dropdown.addOption("wheel", "Wheel");
				dropdown.addOption("list", "List");
				dropdown.setValue(this.plugin.settings.viewMode);
				dropdown.onChange(async (value) => {
					this.plugin.settings.viewMode = value as ViewMode;
					await this.plugin.saveSettings();
				});
			});

		new Setting(this.containerEl)
			.setName("Override locale:")
			.setDesc(
				"Set this if you want to use a locale different from the default. The plugin saves your edits for each language. Switch back to restore them."
			)
			.addDropdown((dropdown) => {
				locales.forEach((locale) => {
					dropdown.addOption(locale, localeNames[locale] ?? locale);
				});
				dropdown.setValue(this.plugin.settings.locale);
				dropdown.onChange(async (value) => {
					const isLocaleChanged = value !== this.plugin.settings.locale;
					if (isLocaleChanged) {
						const next = switchLocale(this.plugin.settings, value);
						this.plugin.settings.locale = next.locale as EmotionPickerLocaleOverride;
						this.plugin.settings.emotionTree = next.emotionTree;
						this.plugin.settings.localeTrees = next.localeTrees;
						await this.plugin.saveSettings();
						this.refresh();
					}
				});
			});

		this.displayTreeSettings(containerEl);
	}

	private displayTreeSettings(containerEl: HTMLElement): void {
		containerEl.createEl("h3", { text: "Emotion tree" });

		const summaryEl = containerEl.createEl("p");
		const updateSummary = () => {
			const tree = this.plugin.settings.emotionTree;
			const leafCount = tree.reduce((sum, node) => sum + countLeaves(node), 0);
			summaryEl.setText(
				`Current tree: ${tree.length} core emotions, ${leafCount} outer words. Edits save at once.`
			);
		};
		updateSummary();

		const editorEl = containerEl.createDiv();
		new TreeEditor(
			editorEl,
			() => this.plugin.settings.emotionTree,
			async (tree) => {
				this.plugin.settings.emotionTree = tree;
				await this.plugin.saveSettings();
			},
			updateSummary
		).render();

		const advanced = containerEl.createEl("details", { cls: "emotion-tree-advanced" });
		advanced.createEl("summary", { text: "Advanced: import, export, and reset" });
		this.displayJsonSettings(advanced);
	}

	private displayJsonSettings(containerEl: HTMLElement): void {
		new Setting(containerEl)
			.setName("Custom tree (JSON)")
			.setDesc(
				'Paste a JSON array. Each node needs "id" and "name". Level-1 nodes also need a "color" like #c1e08d. Use "children" for up to 3 levels. Tip: export the current tree first and edit it.'
			)
			.addTextArea((textArea) => {
				textArea.inputEl.rows = 10;
				textArea.inputEl.addClass("emotion-import-textarea");
				textArea
					.setPlaceholder(
						'[{"id":"joy","name":"Joy","color":"#c1e08d","children":[{"id":"joy/proud","name":"Proud"}]}]'
					)
					.setValue(this.importText)
					.onChange((value) => {
						this.importText = value;
					});
			});

		new Setting(containerEl)
			.addButton((button) => {
				button.setButtonText("Import tree");
				button.setCta();
				button.onClick(async () => {
					const { tree, errors } = importTree(this.importText);
					if (!tree) {
						new Notice(
							`Import failed. Nothing was changed.\n${errors.join("\n")}`,
							10000
						);
						return;
					}
					this.plugin.settings.emotionTree = tree;
					await this.plugin.saveSettings();
					this.importText = "";
					new Notice("Emotion tree imported.");
					this.refresh();
				});
			})
			.addButton((button) => {
				button.setButtonText("Copy current tree as JSON");
				button.onClick(async () => {
					await navigator.clipboard.writeText(
						JSON.stringify(this.plugin.settings.emotionTree, null, 2)
					);
					new Notice("Emotion tree copied to the clipboard.");
				});
			})
			.addButton((button) => {
				button.setButtonText("Reset to locale default");
				button.setWarning();
				button.onClick(async () => {
					this.plugin.settings.emotionTree = getDefaultEmotionTree(
						this.plugin.settings.locale
					);
					await this.plugin.saveSettings();
					new Notice("Emotion tree reset to the default.");
					this.refresh();
				});
			});
	}
}
