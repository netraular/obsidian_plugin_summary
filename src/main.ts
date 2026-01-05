import {App, Editor, MarkdownView, Modal, Notice, Plugin, TFile} from 'obsidian';
import {DEFAULT_SETTINGS, MyPluginSettings, SampleSettingTab} from "./settings";
import {WebhookService} from "./services/webhookService";

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;
	webhookService: WebhookService;
	// Track file contents to detect new audio recordings
	private fileContentCache: Map<string, string> = new Map();

	async onload() {
		await this.loadSettings();

		// Initialize webhook service
		this.webhookService = new WebhookService(
			this.settings.webhookUrl,
			this.settings.apiKey
		);

		// This creates an icon in the left ribbon - clicking it tests the webhook
		this.addRibbonIcon('dice', 'Test webhook connection', async (evt: MouseEvent) => {
			await this.testWebhookConnection();
		});

		// This adds a command to test the webhook connection
		this.addCommand({
			id: 'test-webhook-connection',
			name: 'Test webhook connection',
			callback: async () => {
				await this.testWebhookConnection();
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// Register event to monitor file modifications (for voice notes)
		this.registerEvent(
			this.app.vault.on('modify', async (file) => {
				if (file instanceof TFile) {
					await this.handleFileModify(file);
				}
			})
		);

		// Initialize cache for existing files with date names
		this.app.workspace.onLayoutReady(async () => {
			await this.initializeFileCache();
		});
	}

	onunload() {
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<MyPluginSettings>);
	}

	async saveSettings() {
		await this.saveData(this.settings);
		// Update webhook service with new settings
		if (this.webhookService) {
			this.webhookService.updateConfig(this.settings.webhookUrl, this.settings.apiKey);
		}
	}

	async testWebhookConnection() {
		new Notice('Testing webhook connection...');
		const result = await this.webhookService.testConnection();
		if (result.success) {
			// Check for the "answer" field in the response
			const answer = result.data?.answer || result.message;
			new Notice(`✅ ${answer}`);
			console.log('Webhook test response:', result.data);
		} else {
			new Notice(`❌ ${result.message}`);
			console.error('Webhook test error:', result.message);
		}
	}

	/**
	 * Check if a filename matches the date format YYYY-MM-DD
	 */
	isDateFileName(fileName: string): boolean {
		const datePattern = /^\d{4}-\d{2}-\d{2}$/;
		const baseName = fileName.replace(/\.md$/, '');
		return datePattern.test(baseName);
	}

	/**
	 * Initialize the file content cache for date-named files
	 */
	async initializeFileCache() {
		const files = this.app.vault.getMarkdownFiles();
		for (const file of files) {
			if (this.isDateFileName(file.basename)) {
				const content = await this.app.vault.read(file);
				this.fileContentCache.set(file.path, content);
			}
		}
	}

	/**
	 * Extract audio recording embeds from content
	 * Matches patterns like: ![[Recording 20260105012858.m4a]]
	 */
	extractAudioRecordings(content: string): string[] {
		const audioPattern = /!\[\[Recording[^\]]+\.(m4a|mp3|wav|webm|ogg)\]\]/gi;
		const matches = content.match(audioPattern);
		return matches || [];
	}

	/**
	 * Handle file modifications - detect new audio recordings in date-titled files
	 */
	async handleFileModify(file: TFile) {
		if (file.extension !== 'md') return;
		
		const baseName = file.basename;
		if (!this.isDateFileName(baseName)) return;

		const newContent = await this.app.vault.read(file);
		const oldContent = this.fileContentCache.get(file.path) || '';
		
		// Get audio recordings from old and new content
		const oldRecordings = this.extractAudioRecordings(oldContent);
		const newRecordings = this.extractAudioRecordings(newContent);
		
		// Find newly added recordings
		const addedRecordings = newRecordings.filter(rec => !oldRecordings.includes(rec));
		
		// Update cache
		this.fileContentCache.set(file.path, newContent);
		
		// If new audio recordings were added, trigger webhook
		if (addedRecordings.length > 0) {
			console.log(`New audio recording(s) detected in ${baseName}:`, addedRecordings);
			await this.sendAudioRecordingWebhook(file, addedRecordings);
		}
	}

	/**
	 * Send webhook notification for new audio recordings
	 */
	async sendAudioRecordingWebhook(file: TFile, recordings: string[]) {
		new Notice(`🎙️ Audio recording detected, sending to webhook...`);
		
		const result = await this.webhookService.sendVoiceNoteData(
			file.basename,
			file.basename, // The date is the filename
			recordings.join(', ')
		);
		
		if (result.success) {
			const answer = result.data?.answer || result.message;
			new Notice(`✅ ${answer}`);
			console.log('Webhook response:', result.data);
		} else {
			new Notice(`❌ ${result.message}`);
			console.error('Webhook error:', result.message);
		}
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		let {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}
