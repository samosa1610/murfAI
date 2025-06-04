"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CheckCircle, AlertCircle, Download, RotateCcw } from "lucide-react"
import type { SessionData } from "@/types"

interface SessionModalProps {
  sessionData: SessionData
  onClose: () => void
  onRetry: () => void
}

export function SessionModal({ sessionData, onClose, onRetry }: SessionModalProps) {
  const scorePercentage = (sessionData.score / 10) * 100

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">Session Summary & Feedback</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Score Display */}
          <div className="flex flex-col items-center">
            <div className="relative w-32 h-32 mb-4">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-gray-200 dark:text-gray-700"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="url(#gradient)"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${scorePercentage * 2.51} 251`}
                  className="transition-all duration-1000 ease-out"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#56707F" />
                    <stop offset="100%" stopColor="#E07A5F" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">{sessionData.score}</span>
              </div>
            </div>
            <p className="text-gray-500 text-center">
              Session completed in {sessionData.duration} • {sessionData.questionsAnswered} questions answered
            </p>
          </div>

          {/* Feedback Cards */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-green-800 dark:text-green-200">Strengths</h3>
              </div>
              <ul className="space-y-2">
                {sessionData.strengths.map((strength, index) => (
                  <li key={index} className="text-sm text-green-700 dark:text-green-300 flex items-start gap-2">
                    <span className="w-1 h-1 bg-green-600 rounded-full mt-2 flex-shrink-0" />
                    {strength}
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                <h3 className="font-semibold text-orange-800 dark:text-orange-200">Areas to Improve</h3>
              </div>
              <ul className="space-y-2">
                {sessionData.improvements.map((improvement, index) => (
                  <li key={index} className="text-sm text-orange-700 dark:text-orange-300 flex items-start gap-2">
                    <span className="w-1 h-1 bg-orange-600 rounded-full mt-2 flex-shrink-0" />
                    {improvement}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-center">
            <Button onClick={onRetry} className="gap-2 bg-[#56707F] hover:bg-[#56707F]/90">
              <RotateCcw className="w-4 h-4" />
              Retry Session
            </Button>
            <Button variant="outline" className="gap-2 border-[#56707F] text-[#56707F] hover:bg-[#56707F]/5">
              <Download className="w-4 h-4" />
              Download Report
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
