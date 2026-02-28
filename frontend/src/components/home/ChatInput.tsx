import { useState, useCallback } from "react";

interface ChatInputProps {
  onSubmit: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSubmit, disabled = false }: ChatInputProps) {
  const [value, setValue] = useState("");

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
    setValue("");
  }, [value, disabled, onSubmit]);

  return (
    <div className="shrink-0 border-t border-border-subtle px-8 py-4">
      <div className="flex items-center gap-3">
        <span className="font-system text-red text-sm shrink-0 select-none">
          {">"}
        </span>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
          }}
          disabled={disabled}
          placeholder={disabled ? "PROCESSING..." : "Describe your story..."}
          className="flex-1 bg-transparent border-none outline-none font-system text-sm text-fg-bright placeholder:text-fg-muted disabled:opacity-40"
          autoFocus
        />
      </div>
    </div>
  );
}
