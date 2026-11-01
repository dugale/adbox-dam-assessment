import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { VariableDefinition } from "@/lib/dam/types";
export function VariableField({
  definition,
  id,
  value,
  onChange,
  label,
  hint,
}: {
  definition: VariableDefinition;
  id: string;
  value: string;
  onChange: (value: string) => void;
  label?: string;
  hint?: string;
}) {
  const Control = definition.multiline ? Textarea : Input;
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium">
        {label ?? definition.label}
      </label>
      <Control
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-describedby={hint ? `${id}-hint` : undefined}
      />
      {hint && (
        <p
          id={`${id}-hint`}
          className="text-xs leading-relaxed text-muted-foreground"
        >
          {hint}
        </p>
      )}
    </div>
  );
}
