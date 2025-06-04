"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Mic, MicOff, Play, Square, Settings } from "lucide-react"
import type { Character, InterviewType, Message } from "@/types"
import { VoiceWaveform } from "@/components/voice-waveform"

interface ChatCanvasProps {
  messages: Message[]
  selectedCharacter: Character | null
  selectedType: InterviewType | null
  isRecording: boolean
  onRecordingChange: (recording: boolean) => void
  onVoiceInput: (transcript: string) => void
  currentQuestion: number
  totalQuestions: number
  sidebarCollapsed: boolean
}

export function ChatCanvas({
  messages,
  selectedCharacter,
  selectedType,
  isRecording,
  onRecordingChange,
  onVoiceInput,
  currentQuestion,
  totalQuestions,
  sidebarCollapsed,
}: ChatCanvasProps) {
  const [transcript, setTranscript] = useState("")
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [playingAudio, setPlayingAudio] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)

  // Initialize audio element on client side only
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio();
      audioRef.current.addEventListener('ended', () => {
        setPlayingAudio(null);
      });
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  // Auto-play new interviewer messages
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.type === 'interviewer' && lastMessage.audioFile) {
      handlePlayAudio(lastMessage.id);
    }
  }, [messages]);

  useEffect(() => {
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = "en-US"

      recognitionRef.current.onstart = () => {
        setIsTranscribing(true)
      }

      recognitionRef.current.onresult = (event: any) => {
        const current = event.resultIndex
        const transcript = event.results[current][0].transcript
        setTranscript(transcript)

        if (event.results[current].isFinal) {
          onVoiceInput(transcript)
          setTranscript("")
          setIsTranscribing(false)
        }
      }

      recognitionRef.current.onend = () => {
        setIsTranscribing(false)
        onRecordingChange(false)
      }

      recognitionRef.current.onerror = () => {
        setIsTranscribing(false)
        onRecordingChange(false)
      }
    }
  }, [onVoiceInput, onRecordingChange])

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const handleRecordToggle = () => {
    if (!recognitionRef.current) return

    if (isRecording) {
      recognitionRef.current.stop()
    } else {
      recognitionRef.current.start()
      onRecordingChange(true)
    }
  }

  const handlePlayAudio = async (messageId: string) => {
    if (!audioRef.current) return;

    if (playingAudio === messageId) {
      audioRef.current.pause();
      setPlayingAudio(null);
    } else {
      // Stop any currently playing audio
      if (playingAudio) {
        audioRef.current.pause();
      }

      // Find the message with the audio
      const message = messages.find(m => m.id === messageId);
      if (!message?.audioFile) return;

      try {
        // Set the audio source directly to the URL from Murf API
        audioRef.current.src = message.audioFile;
        await audioRef.current.play();
        setPlayingAudio(messageId);
      } catch (error) {
        console.error('Error playing audio:', error);
        setPlayingAudio(null);
      }
    }
  };

  const getSessionTitle = () => {
    if (!selectedCharacter || !selectedType) return "MockInterviewAI"
    return `${selectedType.name} Interview: ${selectedCharacter.role}`
  }

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-white/30 to-gray-50/30 dark:from-gray-800/30 dark:to-gray-900/30">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200/50 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{getSessionTitle()}</h2>
            {selectedCharacter && selectedType && (
              <p className="text-sm text-gray-500">
                Question {currentQuestion} of {totalQuestions}
              </p>
            )}
          </div>
          {selectedCharacter && selectedType && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#56707F] rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">{currentQuestion}</span>
              </div>
              <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#E07A5F] transition-all duration-300"
                  style={{ width: `${(currentQuestion / totalQuestions) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-8 bg-white/50 dark:bg-gray-800/50 rounded-2xl backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
              <div className="w-16 h-16 bg-[#E07A5F] rounded-full flex items-center justify-center mx-auto mb-4">
                <Mic className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Welcome to MockInterviewAI!</h3>
              <p className="text-gray-500 mb-4">
                Select a character and interview type to begin your practice session.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl p-4 shadow-sm backdrop-blur-sm border ${
                    message.type === "user"
                      ? "bg-[#FFF5F3] border-[#E07A5F]/20 ml-auto"
                      : "bg-white/80 dark:bg-gray-800/80 border-gray-200/50 dark:border-gray-700/50"
                  }`}
                >
                  {message.type === "interviewer" && message.character && (
                    <div className="flex items-center gap-3 mb-2">
                      <img
                        src={message.character.avatar || "/placeholder.svg"}
                        alt={message.character.name}
                        className="w-8 h-8 rounded-full"
                      />
                      <span className="font-medium text-[#56707F]">{message.character.name}</span>
                    </div>
                  )}
                  <p className="text-gray-900 dark:text-white leading-relaxed">{message.content}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">{message.timestamp.toLocaleTimeString()}</span>
                    {message.hasAudio && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePlayAudio(message.id)}
                        className="h-6 w-6 p-0 hover:bg-[#56707F]/10"
                      >
                        {playingAudio === message.id ? (
                          <Square className="w-3 h-3 text-[#56707F]" />
                        ) : (
                          <Play className="w-3 h-3 text-[#56707F]" />
                        )}
                      </Button>
                    )}
                  </div>
                  {playingAudio === message.id && (
                    <div className="mt-2">
                      <VoiceWaveform isPlaying={true} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Transcription Preview */}
      {(isTranscribing || transcript) && (
        <div className="px-4 py-2 bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-sm border-t border-gray-200/50 dark:border-gray-700/50">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {isTranscribing ? "Transcribing..." : "Preview:"}
          </div>
          <div className="text-gray-900 dark:text-white">{transcript || "Listening..."}</div>
        </div>
      )}

      {/* Control Bar */}
      <div className="p-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-t border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center justify-center gap-4">
          <Button
            onClick={handleRecordToggle}
            disabled={!selectedCharacter || !selectedType}
            className={`w-16 h-16 rounded-full transition-all duration-300 ${
              isRecording
                ? "bg-[#E07A5F] hover:bg-[#E07A5F]/90 scale-110 shadow-lg shadow-[#E07A5F]/25"
                : "bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-[#E07A5F]/50 shadow-md hover:shadow-lg"
            }`}
          >
            {isRecording ? (
              <MicOff className="w-6 h-6 text-white" />
            ) : (
              <Mic className={`w-6 h-6 ${isRecording ? "text-white" : "text-[#56707F]"}`} />
            )}
          </Button>

          {isRecording && (
            <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2">
              <VoiceWaveform isPlaying={isRecording} />
            </div>
          )}

          <Button variant="ghost" size="icon" className="w-10 h-10">
            <Settings className="w-4 h-4" />
          </Button>
        </div>

        {!selectedCharacter || !selectedType ? (
          <p className="text-center text-sm text-gray-500 mt-2">
            Select a character and interview type to start recording
          </p>
        ) : (
          <p className="text-center text-sm text-gray-500 mt-2">
            {isRecording ? "Recording... Click to stop" : "Click to start recording"}
          </p>
        )}
      </div>
    </div>
  )
}
