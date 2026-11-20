/**
 * React hook for Hands-Free / Voice-Activated Safety Assistant.
 *
 * Coordinates earphone voice listening, zero-latency distress scanning,
 * and Gemini 3.8 Flash navigation command understanding.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import * as Haptics from "expo-haptics";
import {
  processVoiceSafetyCommand,
  checkInstantDistress,
  type VoiceAssistantResult,
  type VoiceCommandContext,
} from "@/services/geminiVoiceSafetyAssistant";

export type UseVoiceSafetyAssistantOptions = {
  context?: VoiceCommandContext;
  onEmergencyTriggered?: (result: VoiceAssistantResult) => void;
  onRerouteRequested?: () => void;
  onFindPoliceRequested?: () => void;
};

/**
 * React hook managing hands-free voice safety assistant state and execution.
 *
 * Provides earphone-first voice listening, 0ms instant distress detection,
 * haptic responses, and Gemini 3.8 Flash navigation command dispatching.
 *
 * @param options - Navigation context and callback handlers for emergencies, rerouting, and police searches.
 * @returns State flags and handlers for toggling hands-free mode, dispatching commands, and dismissing alerts.
 */
export function useVoiceSafetyAssistant(options?: UseVoiceSafetyAssistantOptions) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [lastResult, setLastResult] = useState<VoiceAssistantResult | null>(null);
  const [isDistressTriggered, setIsDistressTriggered] = useState(false);

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const executeVoiceCommand = useCallback(
    async (spokenText: string) => {
      if (!spokenText.trim()) return null;
      setTranscript(spokenText);
      setIsProcessing(true);

      // 0ms instant distress scanner check
      const instant = checkInstantDistress(spokenText);
      if (instant) {
        setLastResult(instant);
        setIsDistressTriggered(true);
        setIsProcessing(false);
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        optionsRef.current?.onEmergencyTriggered?.(instant);
        return instant;
      }

      try {
        const result = await processVoiceSafetyCommand(
          spokenText,
          optionsRef.current?.context,
        );
        setLastResult(result);

        if (result.isEmergency) {
          setIsDistressTriggered(true);
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          optionsRef.current?.onEmergencyTriggered?.(result);
        } else if (result.actionRequired === "reroute_safest") {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          optionsRef.current?.onRerouteRequested?.();
        } else if (result.actionRequired === "find_police") {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          optionsRef.current?.onFindPoliceRequested?.();
        } else {
          void Haptics.selectionAsync();
        }

        return result;
      } finally {
        setIsProcessing(false);
      }
    },
    [],
  );

  const toggleHandsFreeMode = useCallback(() => {
    setIsEnabled((prev) => {
      const next = !prev;
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      if (next) {
        setIsListening(true);
      } else {
        setIsListening(false);
        setTranscript("");
      }
      return next;
    });
  }, []);

  const dismissDistress = useCallback(() => {
    setIsDistressTriggered(false);
  }, []);

  return {
    isEnabled,
    isListening,
    isProcessing,
    transcript,
    lastResult,
    isDistressTriggered,
    toggleHandsFreeMode,
    executeVoiceCommand,
    dismissDistress,
  };
}
