import { type FormEvent, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type TextInputDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  heading: string;
  inputLabel: string;
  placeholder?: string;
  initialValue?: string;
  submitLabel: string;
  onConfirm: (value: string) => void;
};

type PanelProps = Omit<TextInputDialogProps, "open">;

function TextInputDialogPanel({
  onOpenChange,
  heading,
  inputLabel,
  placeholder,
  initialValue,
  submitLabel,
  onConfirm,
}: PanelProps) {
  const [value, setValue] = useState(() => initialValue ?? "");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const headingId = useId();
  const inputId = useId();
  const errorId = useId();

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onOpenChange(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onOpenChange]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) {
      setError("Please enter a value.");
      return;
    }
    onConfirm(trimmed);
    onOpenChange(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60"
        aria-hidden={true}
        onClick={() => onOpenChange(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        className="relative z-10 w-full max-w-md rounded-xl border border-neutral-700 bg-neutral-900 p-6 shadow-xl"
      >
        <h2 id={headingId} className="text-lg font-semibold text-neutral-50">
          {heading}
        </h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label
              htmlFor={inputId}
              className="mb-1 block text-sm font-medium text-neutral-300"
            >
              {inputLabel}
            </label>
            <input
              ref={inputRef}
              id={inputId}
              type="text"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                if (error) setError(null);
              }}
              placeholder={placeholder}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? errorId : undefined}
              className="w-full rounded-lg border border-neutral-600 bg-neutral-950 px-3 py-2 text-neutral-100 outline-none ring-blue-500 focus:ring-2"
            />
            {error ? (
              <p
                id={errorId}
                className="mt-1 text-sm text-red-400"
                role="alert"
              >
                {error}
              </p>
            ) : null}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-lg border border-neutral-600 px-4 py-2 text-sm font-medium text-neutral-200 hover:bg-neutral-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
            >
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function TextInputDialog({ open, ...rest }: TextInputDialogProps) {
  if (!open) return null;
  return createPortal(<TextInputDialogPanel {...rest} />, document.body);
}
