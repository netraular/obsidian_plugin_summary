import { requestUrl, RequestUrlParam, TFile, Vault } from 'obsidian';

export interface WebhookResponse {
    success: boolean;
    message: string;
    data?: any;
}

export class WebhookService {
    private webhookUrl: string;
    private apiKey: string;
    private vault: Vault | null = null;

    constructor(webhookUrl: string, apiKey: string) {
        this.webhookUrl = webhookUrl;
        this.apiKey = apiKey;
    }

    setVault(vault: Vault) {
        this.vault = vault;
    }

    /**
     * Test the connection to the n8n webhook
     */
    async testConnection(): Promise<WebhookResponse> {
        try {
            const requestParams: RequestUrlParam = {
                url: this.webhookUrl,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'obsidian_vault': this.apiKey
                },
                body: JSON.stringify({
                    action: 'test_connection',
                    timestamp: new Date().toISOString(),
                    message: 'Testing connection from Obsidian plugin'
                })
            };

            const response = await requestUrl(requestParams);

            if (response.status >= 200 && response.status < 300) {
                return {
                    success: true,
                    message: `Connection successful! Status: ${response.status}`,
                    data: response.json
                };
            } else {
                return {
                    success: false,
                    message: `Connection failed with status: ${response.status}`
                };
            }
        } catch (error) {
            return {
                success: false,
                message: `Connection error: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }

    /**
     * Send voice note data to the webhook (metadata only)
     */
    async sendVoiceNoteData(fileName: string, fileDate: string, content?: string): Promise<WebhookResponse> {
        try {
            const requestParams: RequestUrlParam = {
                url: this.webhookUrl,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'obsidian_vault': this.apiKey
                },
                body: JSON.stringify({
                    action: 'voice_note_recorded',
                    fileName: fileName,
                    fileDate: fileDate,
                    content: content,
                    timestamp: new Date().toISOString()
                })
            };

            const response = await requestUrl(requestParams);

            if (response.status >= 200 && response.status < 300) {
                return {
                    success: true,
                    message: 'Voice note data sent successfully!',
                    data: response.json
                };
            } else {
                return {
                    success: false,
                    message: `Failed to send voice note data. Status: ${response.status}`
                };
            }
        } catch (error) {
            return {
                success: false,
                message: `Error sending voice note data: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }

    /**
     * Send audio file to the webhook as FormData (multipart/form-data)
     */
    async sendAudioFile(audioFileName: string, noteFileName: string, noteDate: string, language: string): Promise<WebhookResponse> {
        if (!this.vault) {
            return {
                success: false,
                message: 'Vault not initialized'
            };
        }

        try {
            // Find the audio file in the vault
            const audioFile = this.vault.getFiles().find(f => f.name === audioFileName);
            
            if (!audioFile) {
                return {
                    success: false,
                    message: `Audio file not found: ${audioFileName}`
                };
            }

            // Read the audio file as binary
            const audioData = await this.vault.readBinary(audioFile);
            
            // Get the file extension to determine mime type
            const extension = audioFile.extension.toLowerCase();
            const mimeType = this.getMimeType(extension);

            // Create FormData with the audio file
            const formData = new FormData();
            const blob = new Blob([audioData], { type: mimeType });
            formData.append('audio', blob, audioFileName);
            formData.append('action', 'audio_file_upload');
            formData.append('audioFileName', audioFileName);
            formData.append('noteFileName', noteFileName);
            formData.append('noteDate', noteDate);
            formData.append('mimeType', mimeType);
            formData.append('language', language);
            formData.append('timestamp', new Date().toISOString());

            // Use fetch API for FormData (requestUrl doesn't support FormData well)
            const response = await fetch(this.webhookUrl, {
                method: 'POST',
                headers: {
                    'obsidian_vault': this.apiKey
                },
                body: formData
            });

            if (response.ok) {
                // Try to parse as JSON first, fall back to text if it fails
                const responseText = await response.text();
                let data: any;
                
                try {
                    data = JSON.parse(responseText);
                } catch {
                    // Response is plain text, wrap it in an object
                    data = { text: responseText };
                }
                
                return {
                    success: true,
                    message: 'Audio file sent successfully!',
                    data: data
                };
            } else {
                return {
                    success: false,
                    message: `Failed to send audio file. Status: ${response.status}`
                };
            }
        } catch (error) {
            return {
                success: false,
                message: `Error sending audio file: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }

    /**
     * Get MIME type based on file extension
     */
    private getMimeType(extension: string): string {
        const mimeTypes: Record<string, string> = {
            'm4a': 'audio/mp4',
            'mp3': 'audio/mpeg',
            'wav': 'audio/wav',
            'webm': 'audio/webm',
            'ogg': 'audio/ogg',
            'aac': 'audio/aac',
            'flac': 'audio/flac'
        };
        return mimeTypes[extension] || 'audio/mpeg';
    }

    updateConfig(webhookUrl: string, apiKey: string) {
        this.webhookUrl = webhookUrl;
        this.apiKey = apiKey;
    }
}
