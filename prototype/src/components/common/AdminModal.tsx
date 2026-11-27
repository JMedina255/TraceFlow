import React, { useEffect, useId, useRef } from 'react';
import { AlertCircle, X } from 'lucide-react';

interface AdminModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  maxWidthClass?: string;
  closedBy?: 'closerequest' | 'any' | 'none';
  error?: string | null;
  children: React.ReactNode;
}

/**
 * Diálogo modal accesible basado en el elemento nativo <dialog> (top layer, Esc, inert y retorno de foco).
 */
export const AdminModal: React.FC<AdminModalProps> = ({
  open,
  onClose,
  title,
  subtitle,
  maxWidthClass = 'max-w-md',
  closedBy = 'closerequest',
  error,
  children,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
      const focusTarget = dialog.querySelector<HTMLElement>('[data-autofocus="true"], [autofocus]');
      focusTarget?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      {...({ closedby: closedBy } as Record<string, unknown>)}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClose={onClose}
      className={`${maxWidthClass} w-[calc(100%-2rem)] p-0 bg-transparent border-0 rounded-2xl shadow-2xl overflow-visible`}
    >
      <div className="bg-upt-surface border border-upt-border rounded-2xl max-h-[90vh] overflow-y-auto p-6 space-y-4 text-xs text-upt-text">
        <div className="flex items-start justify-between gap-3 border-b border-upt-border pb-3">
          <div>
            <h2 id={titleId} className="text-base font-bold text-upt-primary">
              {title}
            </h2>
            {subtitle && <p className="text-[11px] text-upt-muted mt-0.5">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana"
            className="p-1 rounded-lg text-upt-muted hover:text-upt-text hover:bg-upt-bg cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2 font-medium"
          >
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {children}
      </div>
    </dialog>
  );
};
