import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, Check, Info, Loader2, X } from 'lucide-react';

import { cn } from '@/utils/cn';

import { ToastContext, type ToastMessage, type ToastTone } from '../toast';

// ---------------------------------------------------------------------------
// Layout primitives
// ---------------------------------------------------------------------------

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5 border-b border-brand-line pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? (
          <p className="text-[0.625rem] font-medium tracking-[0.22em] text-brand-gold-deep uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-2 font-display text-3xl leading-tight text-brand-indigo sm:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-brand-muted">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
    </div>
  );
}

export function Panel({
  title,
  description,
  actions,
  children,
  className,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('border border-brand-line bg-brand-porcelain', className)}>
      {title || actions ? (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-brand-line px-5 py-4">
          <div>
            {title ? <h2 className="font-display text-xl text-brand-indigo">{title}</h2> : null}
            {description ? (
              <p className="mt-1 text-xs leading-5 text-brand-muted">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
      <div className="p-5">{children}</div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Buttons
// ---------------------------------------------------------------------------

type AdminButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

const buttonVariants: Record<AdminButtonVariant, string> = {
  primary:
    'border-brand-indigo bg-brand-indigo text-brand-ivory hover:border-brand-indigo-deep hover:bg-brand-indigo-deep',
  secondary:
    'border-brand-line bg-brand-porcelain text-brand-indigo hover:border-brand-indigo/50 hover:bg-brand-ivory',
  ghost: 'border-transparent bg-transparent text-brand-indigo hover:bg-brand-ivory',
  danger:
    'border-[#8a3b34]/40 bg-transparent text-[#8a3b34] hover:border-[#8a3b34] hover:bg-[#8a3b34]/5',
};

export function AdminButton({
  variant = 'primary',
  size = 'md',
  className,
  busy = false,
  children,
  ...props
}: ComponentProps<'button'> & {
  variant?: AdminButtonVariant;
  size?: 'sm' | 'md';
  busy?: boolean;
}) {
  return (
    <button
      {...props}
      disabled={props.disabled || busy}
      aria-busy={busy || undefined}
      className={cn(
        'inline-flex items-center justify-center gap-2 border font-medium tracking-[0.12em] uppercase transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50',
        size === 'sm' ? 'min-h-9 px-3 text-[0.625rem]' : 'min-h-11 px-5 text-[0.6875rem]',
        buttonVariants[variant],
        className,
      )}
    >
      {busy ? <Loader2 aria-hidden="true" className="animate-spin" size={14} /> : null}
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Form controls
// ---------------------------------------------------------------------------

const controlClasses =
  'w-full min-h-11 border border-brand-line bg-brand-porcelain px-3 py-2 text-sm text-brand-ink placeholder:text-brand-muted/70 focus:border-brand-azure focus:outline-none disabled:bg-brand-ivory disabled:text-brand-muted';

export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label
        htmlFor={htmlFor}
        className="text-[0.6875rem] font-medium tracking-[0.14em] text-brand-indigo uppercase"
      >
        {label}
        {required ? (
          <span aria-hidden="true" className="ml-1 text-brand-gold-deep">
            *
          </span>
        ) : null}
      </label>
      {children}
      {hint && !error ? (
        <p id={`${htmlFor}-hint`} className="text-xs leading-5 text-brand-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="text-xs leading-5 text-[#8a3b34]">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function TextInput({
  invalid,
  className,
  ...props
}: ComponentProps<'input'> & { invalid?: boolean }) {
  return (
    <input
      {...props}
      aria-invalid={invalid || undefined}
      className={cn(controlClasses, invalid && 'border-[#8a3b34]', className)}
    />
  );
}

export function TextArea({
  invalid,
  className,
  ...props
}: ComponentProps<'textarea'> & { invalid?: boolean }) {
  return (
    <textarea
      {...props}
      aria-invalid={invalid || undefined}
      className={cn(controlClasses, 'min-h-24 leading-6', invalid && 'border-[#8a3b34]', className)}
    />
  );
}

export function Select({ className, children, ...props }: ComponentProps<'select'>) {
  return (
    <select {...props} className={cn(controlClasses, 'cursor-pointer', className)}>
      {children}
    </select>
  );
}

export function Checkbox({
  label,
  description,
  ...props
}: ComponentProps<'input'> & { label: string; description?: string }) {
  const id = props.id ?? `checkbox-${label.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div className="flex items-start gap-3">
      <input
        {...props}
        id={id}
        type="checkbox"
        className="mt-1 size-4 shrink-0 accent-brand-indigo"
      />
      <div className="text-sm leading-6">
        <label htmlFor={id} className="font-medium text-brand-indigo">
          {label}
        </label>
        {description ? <p className="text-xs leading-5 text-brand-muted">{description}</p> : null}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Status + feedback
// ---------------------------------------------------------------------------

export function Badge({
  tone = 'neutral',
  children,
}: {
  tone?: 'published' | 'draft' | 'neutral' | 'featured';
  children: ReactNode;
}) {
  const tones = {
    published: 'border-[#2f6b4f]/30 bg-[#2f6b4f]/8 text-[#2f6b4f]',
    draft: 'border-brand-gold/40 bg-brand-gold/10 text-brand-gold-800',
    neutral: 'border-brand-line bg-brand-ivory text-brand-muted',
    featured: 'border-brand-azure/30 bg-brand-azure/8 text-brand-azure-deep',
  } as const;

  return (
    <span
      className={cn(
        'inline-flex items-center border px-2 py-0.5 text-[0.5625rem] font-medium tracking-[0.14em] uppercase',
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

export function Alert({
  tone = 'error',
  children,
}: {
  tone?: 'error' | 'info' | 'success';
  children: ReactNode;
}) {
  const Icon = tone === 'error' ? AlertCircle : tone === 'success' ? Check : Info;
  const styles = {
    error: 'border-[#8a3b34]/30 bg-[#8a3b34]/5 text-[#7a332d]',
    info: 'border-brand-azure/30 bg-brand-azure/5 text-brand-azure-deep',
    success: 'border-[#2f6b4f]/30 bg-[#2f6b4f]/5 text-[#2f6b4f]',
  } as const;

  return (
    <div role="alert" className={cn('flex gap-3 border px-4 py-3 text-sm', styles[tone])}>
      <Icon aria-hidden="true" className="mt-0.5 shrink-0" size={16} strokeWidth={1.75} />
      <div className="leading-6">{children}</div>
    </div>
  );
}

export function Spinner({ label = 'Loading' }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-3 py-10 text-brand-muted"
    >
      <Loader2 aria-hidden="true" className="animate-spin" size={18} />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Loading content" className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="h-14 animate-pulse border border-brand-line bg-brand-ivory" />
      ))}
    </div>
  );
}

export function EmptyNotice({
  title,
  children,
  action,
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="border border-dashed border-brand-line bg-brand-ivory/60 px-6 py-10 text-center">
      <p className="font-display text-2xl text-brand-indigo">{title}</p>
      {children ? (
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-brand-muted">{children}</p>
      ) : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Modal + confirmation
// ---------------------------------------------------------------------------

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onCloseRef.current();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // Focus the panel once when the dialog opens. Keeping onClose out of the
    // effect dependencies prevents an inline callback from re-running this on
    // every keystroke and stealing focus from the active input.
    panelRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  const widths = { sm: 'max-w-md', md: 'max-w-2xl', lg: 'max-w-4xl' } as const;
  const titleId = 'admin-modal-title';

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-brand-indigo-deep/45 p-4 py-10 backdrop-blur-[2px]">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          'w-full border border-brand-line bg-brand-porcelain shadow-[0_24px_60px_-24px_rgba(38,37,75,0.45)] outline-none',
          widths[size],
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-brand-line px-5 py-4">
          <div>
            <h2 id={titleId} className="font-display text-2xl text-brand-indigo">
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-xs leading-5 text-brand-muted">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="mt-1 text-brand-muted transition-colors hover:text-brand-indigo"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-5">{children}</div>
        {footer ? (
          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-brand-line bg-brand-ivory/60 px-5 py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  busy = false,
  tone = 'danger',
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  busy?: boolean;
  tone?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      footer={
        <>
          <AdminButton variant="secondary" onClick={onCancel} disabled={busy}>
            Cancel
          </AdminButton>
          <AdminButton
            variant={tone === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            busy={busy}
          >
            {confirmLabel}
          </AdminButton>
        </>
      }
    >
      <p className="text-sm leading-7 text-brand-muted">{message}</p>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Toasts
// ---------------------------------------------------------------------------

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const pending = timers.current;

    return () => {
      pending.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  const push = useCallback<ToastApiPush>(({ title, description, tone = 'info' }) => {
    const id = `toast-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((current) => [...current, { id, title, description, tone }]);

    const timer = window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 4500);

    timers.current.push(timer);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const api = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-4 top-4 z-[60] flex flex-col items-end gap-2 sm:left-auto sm:w-96"
      >
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onDismiss={() => dismiss(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

type ToastApiPush = (toast: { title: string; description?: string; tone?: ToastTone }) => void;

const toastToneStyles: Record<ToastTone, string> = {
  success: 'border-l-[#2f6b4f]',
  error: 'border-l-[#8a3b34]',
  info: 'border-l-brand-azure',
};

function ToastCard({ toast, onDismiss }: { toast: ToastMessage; onDismiss: () => void }) {
  return (
    <div
      role="status"
      className={cn(
        'pointer-events-auto w-full border border-brand-line border-l-4 bg-brand-porcelain px-4 py-3 shadow-lg',
        toastToneStyles[toast.tone],
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-brand-indigo">{toast.title}</p>
          {toast.description ? (
            <p className="mt-1 text-xs leading-5 text-brand-muted">{toast.description}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss notification"
          className="text-brand-muted hover:text-brand-indigo"
        >
          <X aria-hidden="true" size={14} />
        </button>
      </div>
    </div>
  );
}
