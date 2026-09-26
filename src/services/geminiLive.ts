import { GoogleGenAI, Modality } from "@google/genai";

export type LiveState =
  | "idle"
  | "requesting_permission"
  | "connecting"
  | "connected"
  | "speaking"
  | "stopping"
  | "disconnected"
  | "error";

export interface LiveClientCallbacks {
  onStateChange?: (state: LiveState) => void;
  onTranscript?: (text: string, isUser: boolean) => void;
  onSubtitle?: (text: string) => void;
  onError?: (error: string) => void;
  onEmiAnalyserCreated?: (node: AnalyserNode | null) => void;
  onUserAnalyserCreated?: (node: AnalyserNode | null) => void;
}

export interface LiveClientConfig {
  voiceName?: string;
  userLevel?: string;
  systemInstruction?: string;
}

function convertFloat32ToInt16PCM(float32Array: Float32Array): ArrayBuffer {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < float32Array.length; i++) {
    let s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
  return buffer;
}

function downsampleBuffer(
  buffer: Float32Array,
  inputRate: number,
  outputRate: number = 16000,
): Float32Array {
  if (inputRate === outputRate) return buffer;
  const ratio = inputRate / outputRate;
  const newLength = Math.round(buffer.length / ratio);
  const result = new Float32Array(newLength);
  let offsetResult = 0;
  let offsetBuffer = 0;
  while (offsetResult < result.length) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * ratio);
    let accum = 0;
    let count = 0;
    for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
      accum += buffer[i];
      count++;
    }
    result[offsetResult] = count > 0 ? accum / count : 0;
    offsetResult++;
    offsetBuffer = nextOffsetBuffer;
  }
  return result;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToFloat32PCM(base64: string): Float32Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const int16 = new Int16Array(bytes.buffer);
  const float32 = new Float32Array(int16.length);
  for (let i = 0; i < int16.length; i++) {
    float32[i] = int16[i] / 32768.0;
  }
  return float32;
}

export class GeminiLiveService {
  private state: LiveState = "idle";
  private callbacks: LiveClientCallbacks = {};
  private config: LiveClientConfig = {};

  private session: any = null;
  private isConnecting: boolean = false;
  private isMuted: boolean = false;

  private mediaStream: MediaStream | null = null;
  private inputAudioCtx: AudioContext | null = null;
  private scriptNode: ScriptProcessorNode | null = null;
  private userAnalyser: AnalyserNode | null = null;

  private outputAudioCtx: AudioContext | null = null;
  private emiAnalyser: AnalyserNode | null = null;
  private nextStartTime: number = 0;
  private activeAudioSources: AudioBufferSourceNode[] = [];

  private currentTextAccumulator: string = "";

  constructor(config: LiveClientConfig, callbacks: LiveClientCallbacks) {
    this.config = config;
    this.callbacks = callbacks;
  }

  public getState(): LiveState {
    return this.state;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.mediaStream) {
      this.mediaStream.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
      });
    }
  }

  private setState(newState: LiveState) {
    if (this.state === newState) return;
    this.state = newState;
    if (this.callbacks.onStateChange) {
      this.callbacks.onStateChange(newState);
    }
  }

  public async startSession(): Promise<void> {
    if (this.isConnecting || this.session) {
      return;
    }

    try {
      this.isConnecting = true;
      this.setState("requesting_permission");

      // 1. Request Microphone Access
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
      } catch (micErr: any) {
        console.error("Microphone access error:", micErr);
        const msg =
          micErr.name === "NotAllowedError" || micErr.name === "PermissionDeniedError"
            ? "Microphone permission was denied. Please allow microphone access in your browser settings."
            : "Could not access microphone. Please check your audio inputs.";
        this.setState("error");
        if (this.callbacks.onError) this.callbacks.onError(msg);
        this.isConnecting = false;
        return;
      }

      this.mediaStream = stream;
      this.setState("connecting");

      // 2. Fetch Ephemeral Token from Server Endpoint
      const tokenRes = await fetch("/api/gemini/token");
      if (!tokenRes.ok) {
        throw new Error("Failed to authenticate with live voice server");
      }
      const tokenData = await tokenRes.json();
      if (!tokenData.token) {
        throw new Error("No live audio token returned by server");
      }

      // 3. Initialize Output Audio Context
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.outputAudioCtx = new AudioCtx({ sampleRate: 24000 });
      await this.outputAudioCtx.resume().catch(() => {});

      this.emiAnalyser = this.outputAudioCtx.createAnalyser();
      this.emiAnalyser.fftSize = 256;
      if (this.callbacks.onEmiAnalyserCreated) {
        this.callbacks.onEmiAnalyserCreated(this.emiAnalyser);
      }

      this.nextStartTime = this.outputAudioCtx.currentTime;

      // 4. Connect to Gemini Live via SDK using Ephemeral Token
      const ai = new GoogleGenAI({
        apiKey: tokenData.token,
        httpOptions: { apiVersion: "v1alpha" },
      });

      const voiceMapping: Record<string, string> = {
        Aoede: "Zephyr",
        Kore: "Kore",
        Puck: "Puck",
        Charon: "Charon",
        Fenrir: "Fenrir",
        Zephyr: "Zephyr",
      };
      const targetVoice = voiceMapping[this.config.voiceName || ""] || "Kore";

      const systemInstructionText =
        this.config.systemInstruction ||
        `You are Emi, an elite AI study tutor for JCE and MSCE secondary school students in Malawi from Educate Malawi (Educate MW).
You are currently on a live voice call with a student.
${this.config.userLevel ? `The student is studying in ${this.config.userLevel}.` : ""}
SPOKEN DIALOGUE RULES:
1. Speak naturally, warmly, and concisely like a supportive teacher on a phone call.
2. Keep responses short (1-3 clear sentences) so spoken dialogue stays fast and conversational.
3. Do NOT use asterisks (*), markdown formatting, hashtags, or emojis.
4. If asked who created you, say you were built for Malawian students by the Educate Malawi team led by S. Lifa.`;

      const session = await ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: targetVoice,
              },
            },
          },
          systemInstruction: systemInstructionText,
        },
        callbacks: {
          onopen: () => {
            this.setState("connected");
            this.setupMicrophoneProcessor();
          },
          onmessage: (msg: any) => {
            this.handleServerMessage(msg);
          },
          onerror: (err: any) => {
            console.error("Gemini Live error:", err);
            this.setState("error");
            if (this.callbacks.onError) {
              this.callbacks.onError("Voice connection error occurred. Reconnecting...");
            }
          },
          onclose: (e: any) => {
            console.log("Gemini Live closed:", e?.code, e?.reason);
            if (this.state !== "stopping" && this.state !== "idle") {
              this.setState("disconnected");
            }
          },
        },
      });

      this.session = session;
    } catch (err: any) {
      console.error("Live session start failed:", err);
      this.setState("error");
      if (this.callbacks.onError) {
        this.callbacks.onError(
          err.message || "Failed to establish live voice connection.",
        );
      }
    } finally {
      this.isConnecting = false;
    }
  }

  private setupMicrophoneProcessor() {
    if (!this.mediaStream) return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.inputAudioCtx = new AudioCtx();
      this.inputAudioCtx.resume().catch(() => {});

      this.userAnalyser = this.inputAudioCtx.createAnalyser();
      this.userAnalyser.fftSize = 256;
      if (this.callbacks.onUserAnalyserCreated) {
        this.callbacks.onUserAnalyserCreated(this.userAnalyser);
      }

      const micSource = this.inputAudioCtx.createMediaStreamSource(this.mediaStream);
      micSource.connect(this.userAnalyser);

      // ScriptProcessorNode for wide browser compatibility across mobile & desktop
      const bufferSize = 4096;
      this.scriptNode = this.inputAudioCtx.createScriptProcessor(bufferSize, 1, 1);

      this.scriptNode.onaudioprocess = (e: AudioProcessingEvent) => {
        if (!this.session || this.isMuted || this.state === "stopping" || this.state === "idle") {
          return;
        }

        const inputBuffer = e.inputBuffer.getChannelData(0);
        const inputSampleRate = e.inputBuffer.sampleRate;

        // Downsample to 16000Hz PCM
        const downsampled = downsampleBuffer(inputBuffer, inputSampleRate, 16000);
        const pcmArrayBuffer = convertFloat32ToInt16PCM(downsampled);
        const base64Pcm = arrayBufferToBase64(pcmArrayBuffer);

        try {
          this.session.sendRealtimeInput({
            mediaChunks: [
              {
                mimeType: "audio/pcm;rate=16000",
                data: base64Pcm,
              },
            ],
          });
        } catch (sendErr) {
          console.warn("Error sending audio chunk:", sendErr);
        }
      };

      micSource.connect(this.scriptNode);
      // Connect to destination to keep audio processing graph active in Chrome
      this.scriptNode.connect(this.inputAudioCtx.destination);
    } catch (err) {
      console.error("Error setting up microphone processor:", err);
    }
  }

  private handleServerMessage(message: any) {
    if (!message) return;

    // Check for interruption signal
    if (message.serverContent?.interrupted) {
      this.stopAudioPlayback();
      return;
    }

    // Check model turn content
    const parts = message.serverContent?.modelTurn?.parts || [];
    for (const part of parts) {
      // Audio Response Part
      if (part.inlineData?.data) {
        this.enqueueAudioChunk(part.inlineData.data);
      }

      // Text / Transcript Response Part
      if (part.text) {
        this.currentTextAccumulator += part.text;
        const cleanText = this.currentTextAccumulator.replace(/[*#$]/g, "").trim();
        if (this.callbacks.onSubtitle) {
          this.callbacks.onSubtitle(cleanText);
        }
        if (this.callbacks.onTranscript) {
          this.callbacks.onTranscript(cleanText, false);
        }
      }
    }

    if (message.serverContent?.turnComplete) {
      this.currentTextAccumulator = "";
    }
  }

  private enqueueAudioChunk(base64Pcm: string) {
    if (!this.outputAudioCtx || this.outputAudioCtx.state === "closed") return;

    try {
      const float32Data = base64ToFloat32PCM(base64Pcm);
      if (float32Data.length === 0) return;

      const audioBuffer = this.outputAudioCtx.createBuffer(1, float32Data.length, 24000);
      audioBuffer.getChannelData(0).set(float32Data);

      const source = this.outputAudioCtx.createBufferSource();
      source.buffer = audioBuffer;

      if (this.emiAnalyser) {
        source.connect(this.emiAnalyser);
        this.emiAnalyser.connect(this.outputAudioCtx.destination);
      } else {
        source.connect(this.outputAudioCtx.destination);
      }

      const currentTime = this.outputAudioCtx.currentTime;
      const startTime = Math.max(currentTime, this.nextStartTime);
      source.start(startTime);
      this.nextStartTime = startTime + audioBuffer.duration;

      this.activeAudioSources.push(source);
      this.setState("speaking");

      source.onended = () => {
        this.activeAudioSources = this.activeAudioSources.filter((s) => s !== source);
        if (this.activeAudioSources.length === 0) {
          if (this.state === "speaking") {
            this.setState("connected");
          }
        }
      };
    } catch (err) {
      console.error("Audio playback chunk error:", err);
    }
  }

  public stopAudioPlayback() {
    this.activeAudioSources.forEach((src) => {
      try {
        src.stop();
      } catch (e) {}
    });
    this.activeAudioSources = [];
    if (this.outputAudioCtx) {
      this.nextStartTime = this.outputAudioCtx.currentTime;
    }
    if (this.state === "speaking") {
      this.setState("connected");
    }
  }

  public sendText(text: string) {
    if (!this.session || !text.trim()) return;
    this.stopAudioPlayback();
    try {
      this.session.sendRealtimeInput({ text: text.trim() });
      if (this.callbacks.onTranscript) {
        this.callbacks.onTranscript(text.trim(), true);
      }
    } catch (err) {
      console.error("Error sending text to Live session:", err);
    }
  }

  public async stopSession(): Promise<void> {
    this.setState("stopping");

    this.stopAudioPlayback();

    if (this.scriptNode) {
      try {
        this.scriptNode.disconnect();
      } catch (e) {}
      this.scriptNode = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.inputAudioCtx) {
      try {
        await this.inputAudioCtx.close();
      } catch (e) {}
      this.inputAudioCtx = null;
    }

    if (this.outputAudioCtx) {
      try {
        await this.outputAudioCtx.close();
      } catch (e) {}
      this.outputAudioCtx = null;
    }

    if (this.session) {
      try {
        await this.session.close();
      } catch (e) {}
      this.session = null;
    }

    this.setState("idle");
  }
}
