import { useEffect, useRef } from "react";
import { ChevronDown, Check } from "lucide-react";
export function MultiSelect({
  label,
  options,
  values,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  values: string[];
  onChange: (v: string[]) => void;
}) {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const close = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node) && ref.current)
        ref.current.open = false;
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);
  const text =
    values.length === 0
      ? "Tutti"
      : values.length === 1
        ? (options.find((o) => o.value === values[0])?.label ?? values[0])
        : `${values.length} selezionati`;
  return (
    <details
      ref={ref}
      className="multi-select"
      onKeyDown={(e) => {
        if (e.key === "Escape" && ref.current) {
          ref.current.open = false;
          ref.current.querySelector("summary")?.focus();
        }
      }}
    >
      <summary aria-label={`${label}: ${text}`}>
        {label}: <b>{text}</b>
        <ChevronDown size={14} />
      </summary>
      <div className="multi-options">
        <fieldset>
          <legend className="sr-only">{label}</legend>
          <label className="multi-all">
            <input
              type="checkbox"
              checked={!values.length}
              onChange={() => onChange([])}
            />
            <span>Tutti · nessun filtro</span>
          </label>
          {options.map((o) => (
            <label key={o.value}>
              <input
                type="checkbox"
                checked={values.includes(o.value)}
                onChange={() =>
                  onChange(
                    values.includes(o.value)
                      ? values.filter((v) => v !== o.value)
                      : [...values, o.value],
                  )
                }
              />
              <span>{o.label}</span>
              {values.includes(o.value) && <Check size={12} />}
            </label>
          ))}
        </fieldset>
      </div>
    </details>
  );
}
