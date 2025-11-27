import { useEffect, useRef, useCallback, useState } from "react";
import { useToast } from "./use-toast";

interface AutoSaveConfig {
  debounceMs?: number;
  onSave: () => Promise<boolean | undefined>;
  enabled?: boolean;
}

export function useCNPIEAutoSave({
  debounceMs = 3000,
  onSave,
  enabled = true,
}: AutoSaveConfig) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingSaveRef = useRef(false);

  const triggerSave = useCallback(async () => {
    if (!enabled) return;
    
    setIsSaving(true);
    try {
      const result = await onSave();
      if (result !== false) {
        setLastSaved(new Date());
      }
    } catch (error) {
      console.error("Auto-save error:", error);
    } finally {
      setIsSaving(false);
      pendingSaveRef.current = false;
    }
  }, [onSave, enabled]);

  const debouncedSave = useCallback(() => {
    if (!enabled) return;
    
    pendingSaveRef.current = true;
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      triggerSave();
    }, debounceMs);
  }, [debounceMs, triggerSave, enabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      // Save pending changes on unmount
      if (pendingSaveRef.current) {
        triggerSave();
      }
    };
  }, [triggerSave]);

  // Save immediately
  const saveNow = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    await triggerSave();
  }, [triggerSave]);

  return {
    debouncedSave,
    saveNow,
    isSaving,
    lastSaved,
  };
}

// Helper to format last saved time
export function formatLastSaved(date: Date | null): string {
  if (!date) return "";
  
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  if (diff < 60000) {
    return "Guardado hace un momento";
  } else if (diff < 3600000) {
    const mins = Math.floor(diff / 60000);
    return `Guardado hace ${mins} min`;
  } else {
    return `Guardado a las ${date.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}`;
  }
}
