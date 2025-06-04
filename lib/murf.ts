export interface MurfConfig {
  apiKey: string;
}

export class MurfService {
  private apiKey: string;
  private baseUrl = 'https://api.murf.ai/v1';

  // Voice IDs for different characters
  private voiceMap = {
    'jane': 'claire', // Female voice for Jane
    'mike': 'james',  // Male voice for Mike
    'sarah': 'emma',  // Female voice for Sarah
  };

  constructor(config: MurfConfig) {
    if (!config.apiKey) {
      throw new Error('Murf API key is required');
    }
    this.apiKey = config.apiKey;
    console.log('🎙️ MurfService initialized with API key:', this.apiKey.substring(0, 5) + '...');
  }

  async generateSpeech(text: string, characterId: string = 'jane'): Promise<string> {
    try {
      console.log('🔊 Starting speech generation...');
      console.log('📝 Text to convert:', text);
      console.log('👤 Character ID:', characterId);
      
      const voiceId = this.voiceMap[characterId as keyof typeof this.voiceMap] || 'claire';
      console.log('🎙️ Selected voice ID:', voiceId);
      
      const requestBody = {
        text,
        voice_id: voiceId,
        speed: 1.0,
        pitch: 1.0
      };
      
      console.log('📤 Sending request to Murf API:', {
        url: `${this.baseUrl}/speech/generate`,
        method: 'POST',
        headers: {
          'api-key': this.apiKey.substring(0, 5) + '...',
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: requestBody,
      });
      
      const response = await fetch(`${this.baseUrl}/speech/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.apiKey,
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📥 Received response from Murf API:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
      });

      if (!response.ok) {
        const responseText = await response.text();
        console.error('❌ Murf API error response:', responseText);
        throw new Error(`Murf API error: ${response.status} ${response.statusText}\n${responseText}`);
      }

      const data = await response.json();
      console.log('✅ Audio generated successfully:', data);

      return data.audioFile; // Return the audio URL directly
    } catch (error) {
      console.error('❌ Error generating speech:', error);
      throw error;
    }
  }

  async saveAudioToFile(audioContent: Buffer, filename: string): Promise<void> {
    try {
      console.log('💾 Saving audio file...');
      console.log('📁 Target file:', filename);
      console.log('📊 File size:', audioContent.length, 'bytes');
      
      const fs = require('fs');
      await fs.promises.writeFile(filename, audioContent);
      console.log('✅ Audio saved successfully to:', filename);
    } catch (error) {
      console.error('❌ Error saving audio file:', error);
      throw error;
    }
  }
} 