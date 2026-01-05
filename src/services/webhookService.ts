import { requestUrl, RequestUrlParam } from 'obsidian';

export interface WebhookResponse {
    success: boolean;
    message: string;
    data?: any;
}

export class WebhookService {
    private webhookUrl: string;
    private apiKey: string;

    constructor(webhookUrl: string, apiKey: string) {
        this.webhookUrl = webhookUrl;
        this.apiKey = apiKey;
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
     * Send voice note data to the webhook
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

    updateConfig(webhookUrl: string, apiKey: string) {
        this.webhookUrl = webhookUrl;
        this.apiKey = apiKey;
    }
}
