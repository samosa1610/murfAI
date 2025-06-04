"use client";

import { useState } from "react";
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { ChatCanvas } from "@/components/chat-canvas";
import { SessionModal } from "@/components/session-modal";
import type { Character, InterviewType, Message, SessionData } from "@/types";

const characters: Character[] = [
  {
    id: "jane",
    name: "Jane Doe",
    role: "Tech Lead",
    avatar: "/placeholder.svg?height=48&width=48",
    description:
      "Experienced frontend architect with 8+ years at top tech companies",
  },
  {
    id: "mike",
    name: "Mike Chen",
    role: "HR Manager",
    avatar: "/placeholder.svg?height=48&width=48",
    description: "People-focused leader specializing in behavioral interviews",
  },
  {
    id: "sarah",
    name: "Sarah Wilson",
    role: "Product Manager",
    avatar: "/placeholder.svg?height=48&width=48",
    description: "Strategic thinker with expertise in case study interviews",
  },
];

const interviewTypes: InterviewType[] = [
  {
    id: "technical",
    name: "Technical",
    icon: "💻",
    description: "Coding challenges and system design",
  },
  {
    id: "behavioral",
    name: "Behavioral",
    icon: "🤝",
    description: "Situational and experience-based questions",
  },
  {
    id: "case-study",
    name: "Case Study",
    icon: "📊",
    description: "Problem-solving and analytical thinking",
  },
];

export default function MockInterviewAI() {
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(
    null
  );
  const [selectedType, setSelectedType] = useState<InterviewType | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const getInterviewerIntroduction = (character: Character, type: InterviewType) => {
    return `Hi, I'm ${character.name}, ${character.role} for the AI team. I'll be conducting the ${type.name.toLowerCase()} interview today, focusing on your problem-solving and coding approach.`;
  };

  const initializeSession = async (character: Character, type: InterviewType) => {
    const welcomeMessage = `Hello! I'm ${character.name}, your ${
      character.role
    }. Today we'll be conducting a ${type.name.toLowerCase()} interview. Feel free to start by introducing yourself.`;

    try {
      // Generate audio for welcome message
      const response = await fetch("/api/process-message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: welcomeMessage,
          character: character,
          interviewType: type,
          currentQuestion: 1,
        }),
      });

      const data = await response.json();

      const message: Message = {
        id: "1",
        type: "interviewer",
        content: data.success ? data.processedMessage : welcomeMessage,
        timestamp: new Date(),
        character: character,
        hasAudio: true,
        audioFile: data.audioFile,
      };

      setMessages([message]);
      setCurrentQuestion(1);
    } catch (error) {
      console.error('Error generating welcome message audio:', error);
      // Fallback to message without audio if generation fails
      const message: Message = {
        id: "1",
        type: "interviewer",
        content: welcomeMessage,
        timestamp: new Date(),
        character: character,
        hasAudio: false,
      };
      setMessages([message]);
      setCurrentQuestion(1);
    }
  };

  const handleCharacterSelect = async (character: Character) => {
    setSelectedCharacter(character);
  };

  const handleTypeSelect = async (type: InterviewType) => {
    setSelectedType(type);
  };

  const handleVoiceInput = async (transcript: string) => {
    if (!selectedCharacter || !selectedType) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: transcript,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      // Create a prompt for Gemini based on the character and interview type
      const prompt = `You are ${selectedCharacter.name}, a ${
        selectedCharacter.role
      } conducting a ${selectedType.name.toLowerCase()} interview. 
      The candidate just said: "${transcript}"
      
      Based on this response and the interview context:
      - Character: ${selectedCharacter.name} (${selectedCharacter.role})
      - Interview Type: ${selectedType.name}
      - Current Question Number: ${currentQuestion} of 5
      
      Generate a relevant follow-up question that:
      1. Is specific to the ${selectedType.name.toLowerCase()} interview type
      2. Shows expertise in ${selectedCharacter.role} role
      3. Builds upon the candidate's previous response
      4. Helps assess their skills and experience
      
      Keep the question concise and professional.`;

      const response = await fetch("/api/process-message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: prompt,
          character: selectedCharacter,
          interviewType: selectedType,
          currentQuestion,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: "interviewer",
          content: data.processedMessage,
          timestamp: new Date(),
          character: selectedCharacter,
          hasAudio: true,
          audioFile: data.audioFile
        };

        setMessages((prev) => [...prev, aiMessage]);
        setCurrentQuestion((prev) => prev + 1);

        if (currentQuestion >= 5) {
          // Generate final feedback using Gemini
          const feedbackPrompt = `As ${selectedCharacter.name}, a ${selectedCharacter.role}, provide a comprehensive interview feedback based on the candidate's responses.
          Include:
          1. Overall score (out of 10)
          2. Key strengths (3 points)
          3. Areas for improvement (3 points)
          4. Interview duration
          5. Number of questions answered
          
          Format the response as a JSON object with these fields:
          {
            "score": number,
            "strengths": string[],
            "improvements": string[],
            "duration": string,
            "questionsAnswered": number
          }`;

          const feedbackResponse = await fetch("/api/process-message", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              message: feedbackPrompt,
              character: selectedCharacter,
              interviewType: selectedType,
              isFeedback: true,
            }),
          });

          const feedbackData = await feedbackResponse.json();

          if (feedbackData.success) {
            try {
              const feedback = JSON.parse(feedbackData.processedMessage);
              setSessionData(feedback);
              setSessionComplete(true);
            } catch (error) {
              console.error("Error parsing feedback:", error);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error processing message:", error);
    }
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isDarkMode ? "dark bg-gray-900" : "bg-[#F7F7F9]"
      }`}
    >
      <Header
        selectedType={selectedType}
        onTypeSelect={handleTypeSelect}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
      />

      <div className="flex h-[calc(100vh-64px)]">
        <Sidebar
          characters={characters}
          interviewTypes={interviewTypes}
          selectedCharacter={selectedCharacter}
          selectedType={selectedType}
          onCharacterSelect={handleCharacterSelect}
          onTypeSelect={handleTypeSelect}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        <ChatCanvas
          messages={messages}
          selectedCharacter={selectedCharacter}
          selectedType={selectedType}
          isRecording={isRecording}
          onRecordingChange={setIsRecording}
          onVoiceInput={handleVoiceInput}
          currentQuestion={currentQuestion}
          totalQuestions={5}
          sidebarCollapsed={sidebarCollapsed}
        />
      </div>

      {sessionComplete && sessionData && (
        <SessionModal
          sessionData={sessionData}
          onClose={() => setSessionComplete(false)}
          onRetry={() => {
            setSessionComplete(false);
            setMessages([]);
            setCurrentQuestion(1);
            if (selectedCharacter && selectedType) {
              initializeSession(selectedCharacter, selectedType);
            }
          }}
        />
      )}
    </div>
  );
}
