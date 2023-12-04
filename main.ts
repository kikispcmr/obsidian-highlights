import {
	App,
	TFile,
	Modal,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
} from "obsidian";

interface HighlightsSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: HighlightsSettings = {
	mySetting: "default",
};

export default class HighlightsPlugin extends Plugin {
	settings: HighlightsSettings;
	
	async onload() {
		await this.loadSettings();
		const ribbonIconEl = this.addRibbonIcon(
			"folder-heart",
			"Book Highlight",
			(evt: MouseEvent) => {
				let currentFileName: string;
				currentFileName = String(this.app.workspace.getActiveFile()?.name);
				new Notice("Record note at: " + currentFileName);
				new SampleModal(this.app, (highlight) => {
					console.log(highlight);
					const fileName = currentFileName.replace(/\.[^/.]+$/, "");
					console.log(fileName);
					this.appendToFile(this.settings.mySetting + fileName + ".md", highlight);
					new Notice("✅");
				}).open();
			}
		);

		ribbonIconEl.addClass("obsidian-highlights-ribbon-class");

		this.addSettingTab(new HighlightsSettingTab(this.app, this));
	}

	getSelectedText(): string {
		const selection = document.getSelection();
		return selection ? selection.toString() : "";
	}

	async appendToFile(
		filePath: string,
		contentToAppend: string
	): Promise<void> {
		try {
			let file = this.app.vault.getAbstractFileByPath(filePath) as TFile;
	
			// If file exists, read the existing content
			if (file) {
				
				const existingContent = await this.app.vault.read(file);
				const newContent = existingContent + "\n" + contentToAppend;
				await this.app.vault.modify(file, newContent);
			} else {
				await this.app.vault.create(filePath, contentToAppend);
			}
		} catch (error) {
			console.error("Error handling file:", error);
		}
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleModal extends Modal {
	highlight: string;
	onSubmit: (highlight: string) => void;

	constructor(app: App, onSubmit: (result: string) => void) {
		super(app);
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const { contentEl } = this;

		contentEl.createEl("h1", { text: "Highlight Contents" });

		new Setting(contentEl).setName("Highlights").addText((text) =>
			text.onChange((value) => {
				this.highlight = value;
			})
		);

		new Setting(contentEl).addButton((btn) =>
			btn
				.setButtonText("Submit")
				.setCta()
				.onClick(() => {
					this.close();
					this.onSubmit(this.highlight);
				})
		);
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class HighlightsSettingTab extends PluginSettingTab {
	plugin: HighlightsPlugin;

	constructor(app: App, plugin: HighlightsPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
            .setName("Vault Folder")
            .setDesc("Select a folder in the vault")
            .addText(text => 
                text
                    .setPlaceholder("Enter folder path")
                    .setValue(this.plugin.settings.mySetting)
                    .onChange(async (value) => {
                        this.plugin.settings.mySetting = value;
                        await this.plugin.saveSettings();
                    })
            );
	}
}
