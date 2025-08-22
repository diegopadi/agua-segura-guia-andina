import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface AutosizeTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  minRows?: number;
  maxRows?: number;
}

const AutosizeTextarea = React.forwardRef<
  HTMLTextAreaElement,
  AutosizeTextareaProps
>(({ className, minRows = 1, maxRows = 6, ...props }, ref) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const resizeTextarea = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      
      const lineHeight = parseFloat(getComputedStyle(textarea).lineHeight) || 20;
      const minHeight = lineHeight * minRows;
      const maxHeight = lineHeight * maxRows;
      
      const scrollHeight = textarea.scrollHeight;
      const newHeight = Math.max(minHeight, Math.min(maxHeight, scrollHeight));
      
      textarea.style.height = `${newHeight}px`;
      textarea.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';
    }
  };

  useEffect(() => {
    resizeTextarea();
  }, [props.value]);

  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    resizeTextarea();
    props.onInput?.(e);
  };

  return (
    <textarea
      className={cn(
        "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none",
        className
      )}
      ref={(node) => {
        textareaRef.current = node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      }}
      onInput={handleInput}
      {...props}
    />
  );
});

AutosizeTextarea.displayName = "AutosizeTextarea";

export { AutosizeTextarea };