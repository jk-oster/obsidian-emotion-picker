import { Plugin } from "obsidian";
import { DefaultSettings, EmotionPickerSettings } from "src/settings/PluginSettings";
import { addSmileIcon } from "src/SmileIcon";
import { EmotionPickerModal } from "./src/Modal";
import { EmotionPickerSettingsTab } from "src/settings/SettingsTab";
import { EmotionNode } from "src/emotions/EmotionNode";
import { resolveEmotionTree } from "src/settings/migrate";
import { sanitizeLocaleTrees } from "src/settings/localeTrees";

export default class EmotionPickerPlugin extends Plugin {
	settings: EmotionPickerSettings;

	async onload() {
		// add new icon for ribbon item
		addSmileIcon();

		this.addRibbonIcon("smile", "Emotions Picker", (evt: MouseEvent) => {
			new EmotionPickerModal(this.app, this).open();
		});

		this.addCommand({
			id: "Open",
			name: "Open",
			callback: () => {
				new EmotionPickerModal(this.app, this).open();
			},
		});

		await this.loadSettings();

		this.addSettingTab(new EmotionPickerSettingsTab(this.app, this));
	}

	onunload() {}

	async loadSettings() {
		const loadedSettings = await this.loadData();
		const settings: EmotionPickerSettings = Object.assign(
			{},
			new DefaultSettings(),
			loadedSettings
		);
		settings.emotionTree = resolveEmotionTree(
			loadedSettings,
			settings.locale
		);
		settings.localeTrees = sanitizeLocaleTrees(
			loadedSettings?.localeTrees,
			settings.locale
		);
		this.settings = settings;
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	getEmotionTree(): EmotionNode[] {
		return this.settings.emotionTree;
	}
}
