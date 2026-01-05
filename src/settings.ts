import {App, PluginSettingTab, Setting} from "obsidian";
import MyPlugin from "./main";

export interface MyPluginSettings {
	webhookUrl: string;
	apiKey: string;
}

export const DEFAULT_SETTINGS: MyPluginSettings = {
	webhookUrl: 'https://n8n.raular.com/webhook/474b8804-ad6b-4181-ae0b-c889efd98b80',
	apiKey: 'obsidiansecretapipassword123'
}

export class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Voice Note Webhook Settings'});

		new Setting(containerEl)
			.setName('Webhook URL')
			.setDesc('The n8n webhook URL to send voice note data to')
			.addText(text => text
				.setPlaceholder('Enter webhook URL')
				.setValue(this.plugin.settings.webhookUrl)
				.onChange(async (value) => {
					this.plugin.settings.webhookUrl = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('API Key')
			.setDesc('The API key for authentication (obsidian_vault header)')
			.addText(text => text
				.setPlaceholder('Enter API key')
				.setValue(this.plugin.settings.apiKey)
				.onChange(async (value) => {
					this.plugin.settings.apiKey = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Test Connection')
			.setDesc('Test the webhook connection')
			.addButton(button => button
				.setButtonText('Test')
				.onClick(async () => {
					await this.plugin.testWebhookConnection();
				}));
	}
}
