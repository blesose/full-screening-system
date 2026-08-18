import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { toast } from "sonner";

interface UseUnsavedChangesOptions {
  /** Whether there are unsaved changes */
  hasChanges: boolean;
  /** Message to show in the confirmation dialog */
  message?: string;
  /** Callback when changes are discarded */
  onDiscard?: () => void;
  /** Callback when changes are saved */
  onSave?: () => void;
  /** Enable/disable the hook */
  enabled?: boolean;
}

interface UseUnsavedChangesReturn {
  /** Show the confirmation dialog */
  showPrompt: boolean;
  /** Confirm discarding changes */
  confirmDiscard: () => void;
  /** Cancel navigation and keep changes */
  cancelNavigation: () => void;
  /** Save changes and proceed */
  saveAndProceed: () => void;
  /** Manually trigger the confirmation dialog */
  triggerPrompt: (callback: () => void) => void;
  /** Reset the prompt state */
  resetPrompt: () => void;
  /** Set a specific action to execute on confirm */
  setPendingAction: (action: () => void) => void;
}

export function useUnsavedChanges({
  hasChanges,
  message = "You have unsaved changes. Are you sure you want to leave?",
  onDiscard,
  onSave,
  enabled = true,
}: UseUnsavedChangesOptions): UseUnsavedChangesReturn {
  const [showPrompt, setShowPrompt] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const hasChangesRef = useRef(hasChanges);

  // Keep ref in sync
  useEffect(() => {
    hasChangesRef.current = hasChanges;
  }, [hasChanges]);

  // Browser beforeunload event
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChangesRef.current) {
        e.preventDefault();
        e.returnValue = message;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [enabled, message]);

  // Handle navigation attempts
  const triggerPrompt = useCallback((callback: () => void) => {
    if (!enabled || !hasChangesRef.current) {
      callback();
      return;
    }

    setPendingAction(() => callback);
    setShowPrompt(true);
  }, [enabled]);

  const confirmDiscard = useCallback(() => {
    setShowPrompt(false);
    if (pendingAction) {
      onDiscard?.();
      pendingAction();
      setPendingAction(null);
    }
    toast.info("Changes discarded");
  }, [pendingAction, onDiscard]);

  const cancelNavigation = useCallback(() => {
    setShowPrompt(false);
    setPendingAction(null);
    toast.info("Changes kept");
  }, []);

  const saveAndProceed = useCallback(() => {
    setShowPrompt(false);
    if (pendingAction) {
      onSave?.();
      // Give time for save to complete before navigating
      setTimeout(() => {
        pendingAction();
        setPendingAction(null);
      }, 300);
    }
    toast.success("Changes saved");
  }, [pendingAction, onSave]);

  const resetPrompt = useCallback(() => {
    setShowPrompt(false);
    setPendingAction(null);
  }, []);

  const setPendingActionCallback = useCallback((action: () => void) => {
    setPendingAction(() => action);
  }, []);

  return {
    showPrompt,
    confirmDiscard,
    cancelNavigation,
    saveAndProceed,
    triggerPrompt,
    resetPrompt,
    setPendingAction: setPendingActionCallback,
  };
}

/**
 * Hook for detecting unsaved changes in form data
 * Uses useMemo instead of useEffect to avoid the setState-in-effect warning
 */
export function useFormChanges<T extends Record<string, unknown>>(
  data: T,
  initialData: T
): {
  hasChanges: boolean;
  resetChanges: () => void;
} {
  // Use useMemo to compute changes without setting state in an effect
  const hasChanges = useMemo(() => {
    return JSON.stringify(data) !== JSON.stringify(initialData);
  }, [data, initialData]);

  const resetChanges = useCallback(() => {
    // This would need to be implemented by the component
    // to reset the form to initial state
  }, []);

  return { hasChanges, resetChanges };
}