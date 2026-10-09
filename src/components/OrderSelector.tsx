import { CalendarDays, GitBranch, Compass } from "lucide-react";
import { orderLabels } from "../lib/catalog";
import type { Order } from "../types";
export function OrderSelector({
  value,
  onChange,
}: {
  value: Order;
  onChange: (o: Order) => void;
}) {
  return (
    <div className="order-selector" aria-label="Ordine di visione">
      {(["release", "chronology", "recommended"] as Order[]).map((o, i) => {
        const Icon = [CalendarDays, GitBranch, Compass][i];
        return (
          <button
            key={o}
            aria-label={orderLabels[o]}
            aria-pressed={value === o}
            className={value === o ? "selected" : ""}
            onClick={() => onChange(o)}
          >
            <Icon size={17} />
            {orderLabels[o]}
            {o === "recommended" && (
              <span className="editorial-label">FAN EDIT</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
