import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { ProfilePanel } from "./ProfilePanel";
import { cloudConfigured } from "../lib/cloud";
export function LoginDialog({
  onSave,
  close,
}: {
  onSave: (username: string) => void;
  close: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const focused = document.activeElement as HTMLElement;
    const dialog = ref.current!;
    dialog.showModal();
    dialog.querySelector("input")?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      focused?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="login-dialog"
      aria-label="Accedi con nome utente"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onClick={(e) => {
        if (e.target === ref.current) close();
      }}
    >
      <button
        className="login-close icon-button"
        aria-label="Chiudi accesso"
        onClick={close}
      >
        <X size={20} />
      </button>
      <ProfilePanel
        username={null}
        status={cloudConfigured ? "local" : "unconfigured"}
        pending={0}
        error=""
        onRetry={() => {}}
        onSave={(name) => {
          onSave(name);
          close();
        }}
      />
    </dialog>
  );
}
