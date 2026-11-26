import { useState, type FormEvent, type InputHTMLAttributes, type ReactNode } from 'react';
import { Check, Loader2, MessageCircle } from 'lucide-react';

import { ButtonAnchor } from '@/components/ui/Button';
import { usePublicSubmission } from '@/hooks/use-public-submission';
import {
  bookingFormSchema,
  contactFormSchema,
  enquiryFormSchema,
  submitAppointment,
  submitContactMessage,
  submitEnquiry,
  submitTestimonial,
  testimonialFormSchema,
  type BookingFormValues,
  type ContactFormValues,
  type EnquiryFormValues,
  type TestimonialFormValues,
} from '@/services/submissions';
import { cn } from '@/utils/cn';

const inputClass =
  'mt-2 w-full border border-brand-line bg-brand-ivory px-3 py-2.5 text-sm text-brand-indigo placeholder:text-brand-muted/70 focus:border-brand-gold focus:outline-none aria-invalid:border-red-700';

const labelClass = 'text-[0.62rem] font-medium tracking-[0.15em] text-brand-indigo uppercase';

function FieldShell({
  id,
  label,
  error,
  required,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
        {required ? (
          <span aria-hidden="true" className="ml-1 text-brand-gold-deep">
            *
          </span>
        ) : (
          <span className="ml-1 text-brand-muted normal-case">(optional)</span>
        )}
      </label>
      {children}
      {hint ? <p className="mt-1.5 text-xs text-brand-muted">{hint}</p> : null}
      {error ? (
        <p className="mt-1.5 text-xs text-red-700" id={`${id}-error`}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  error?: string;
  hint?: string;
};

function TextField({ id, label, error, hint, required, className, ...props }: TextFieldProps) {
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} required={required}>
      <input
        {...props}
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(inputClass, className)}
      />
    </FieldShell>
  );
}

function TextAreaField({
  id,
  label,
  error,
  hint,
  required,
  rows = 4,
  ...props
}: InputHTMLAttributes<HTMLTextAreaElement> & {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  rows?: number;
}) {
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} required={required}>
      <textarea
        {...props}
        id={id}
        rows={rows}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={inputClass}
      />
    </FieldShell>
  );
}

function ConsentField({
  id,
  checked,
  onChange,
  error,
  children,
}: {
  id: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="flex items-start gap-3">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className="mt-0.5 size-4 shrink-0 accent-brand-gold-deep"
        />
        <label htmlFor={id} className="text-xs leading-6 text-brand-muted">
          {children}
        </label>
      </div>
      {error ? (
        <p className="mt-1.5 text-xs text-red-700" id={`${id}-error`}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

function Honeypot({ onChange }: { onChange: (value: string) => void }) {
  return (
    <div aria-hidden="true" className="hidden">
      <label htmlFor="company-website">Company website</label>
      <input
        id="company-website"
        name="company"
        type="text"
        tabIndex={-1}
        autoComplete="off"
        defaultValue=""
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function FormError({ message }: { message: string }) {
  return (
    <p role="alert" className="border border-red-700/40 bg-red-50 px-4 py-3 text-xs text-red-800">
      {message}
    </p>
  );
}

function SubmitButton({ busy, label }: { busy: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="inline-flex min-h-11 w-full items-center justify-center gap-2 bg-brand-indigo px-6 py-3 text-[0.66rem] font-medium tracking-[0.15em] text-brand-ivory uppercase transition-colors hover:bg-brand-indigo/90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
    >
      {busy ? (
        <>
          <Loader2 aria-hidden="true" className="animate-spin" size={15} />
          Sending…
        </>
      ) : (
        <>
          {label}
          <Check aria-hidden="true" size={15} />
        </>
      )}
    </button>
  );
}

function SuccessPanel({
  title,
  children,
  reference,
  whatsappUrl,
  onReset,
}: {
  title: string;
  children: ReactNode;
  reference: string;
  whatsappUrl?: string | null;
  onReset: () => void;
}) {
  return (
    <div role="status" className="border border-brand-gold/60 bg-brand-porcelain p-6">
      <p className="text-[0.6rem] tracking-[0.16em] text-brand-gold-deep uppercase">Received</p>
      <h3 className="mt-3 font-display text-2xl text-brand-indigo">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-brand-muted">{children}</p>
      <p className="mt-4 border-t border-brand-line pt-3 text-xs text-brand-indigo">
        Reference <span className="font-medium">{reference}</span>
      </p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        {whatsappUrl ? (
          <ButtonAnchor href={whatsappUrl} external>
            <MessageCircle aria-hidden="true" size={15} />
            Continue on WhatsApp
          </ButtonAnchor>
        ) : null}
        <button
          type="button"
          onClick={onReset}
          className="inline-flex min-h-11 items-center justify-center border border-brand-line px-5 py-3 text-[0.62rem] font-medium tracking-[0.15em] text-brand-indigo uppercase transition-colors hover:border-brand-gold"
        >
          Send another
        </button>
      </div>
    </div>
  );
}

const emptyBooking: BookingFormValues = {
  fullName: '',
  phone: '',
  email: '',
  preferredDate: '',
  preferredTime: '',
  message: '',
  consentAccepted: false,
};

export function BookingForm({
  serviceSlug,
  serviceName,
}: {
  serviceSlug?: string;
  serviceName?: string;
}) {
  const [values, setValues] = useState<BookingFormValues>(emptyBooking);

  const { status, errors, formError, result, handleSubmit, reset, isSubmitting, honeypotRef } =
    usePublicSubmission({
      schema: bookingFormSchema,
      submit: (parsed, meta) =>
        submitAppointment({ ...parsed, serviceSlug: serviceSlug ?? null }, meta),
    });

  function update<K extends keyof BookingFormValues>(key: K, value: BookingFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  if (status === 'success' && result) {
    return (
      <SuccessPanel
        title="Request received"
        reference={result.reference}
        whatsappUrl={result.whatsappUrl}
        onReset={() => {
          setValues(emptyBooking);
          reset();
        }}
      >
        The clinic reviews every request before it is confirmed. Nothing is booked until the clinic
        replies — please keep your phone nearby.
      </SuccessPanel>
    );
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await handleSubmit(values);
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <Honeypot
        onChange={(value) => {
          honeypotRef.current = value;
        }}
      />

      {formError ? <FormError message={formError} /> : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          id="booking-name"
          label="Full name"
          required
          autoComplete="name"
          value={values.fullName}
          error={errors.fullName}
          onChange={(event) => update('fullName', event.target.value)}
        />
        <TextField
          id="booking-phone"
          label="Phone"
          required
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          value={values.phone}
          error={errors.phone}
          onChange={(event) => update('phone', event.target.value)}
        />
        <TextField
          id="booking-email"
          label="Email"
          type="email"
          autoComplete="email"
          value={values.email}
          error={errors.email}
          onChange={(event) => update('email', event.target.value)}
        />
        <TextField
          id="booking-service"
          label="Treatment"
          readOnly
          value={serviceName ?? 'No treatment selected'}
          hint={serviceName ? undefined : 'Choose a treatment page to attach one.'}
        />
        <TextField
          id="booking-date"
          label="Preferred date"
          required
          type="date"
          value={values.preferredDate}
          error={errors.preferredDate}
          onChange={(event) => update('preferredDate', event.target.value)}
        />
        <TextField
          id="booking-time"
          label="Preferred time"
          required
          type="time"
          value={values.preferredTime}
          error={errors.preferredTime}
          onChange={(event) => update('preferredTime', event.target.value)}
        />
      </div>

      <TextAreaField
        id="booking-message"
        label="Anything to add"
        rows={3}
        maxLength={1000}
        value={values.message}
        error={errors.message}
        onChange={(event) => update('message', event.target.value)}
        hint="Please do not include medical history. Suitability is discussed in consultation."
      />

      <ConsentField
        id="booking-consent"
        checked={values.consentAccepted}
        onChange={(checked) => update('consentAccepted', checked)}
        error={errors.consentAccepted}
      >
        I agree to be contacted about this request and have read the{' '}
        <a href="/privacy-policy/" className="border-b border-brand-gold pb-0.5 text-brand-indigo">
          privacy notice
        </a>
        .
      </ConsentField>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SubmitButton busy={isSubmitting} label="Send request" />
        <p className="text-[0.62rem] leading-5 tracking-[0.08em] text-brand-muted uppercase">
          Requests are reviewed — never auto-confirmed.
        </p>
      </div>
    </form>
  );
}

const emptyEnquiry: EnquiryFormValues = {
  name: '',
  phone: '',
  email: '',
  message: '',
  consentAccepted: false,
};

export function EnquiryForm({
  serviceSlug,
  serviceName,
}: {
  serviceSlug: string;
  serviceName: string;
}) {
  const [values, setValues] = useState<EnquiryFormValues>(emptyEnquiry);

  const { status, errors, formError, result, handleSubmit, reset, isSubmitting, honeypotRef } =
    usePublicSubmission({
      schema: enquiryFormSchema,
      submit: (parsed, meta) => submitEnquiry({ ...parsed, serviceSlug }, meta),
    });

  function update<K extends keyof EnquiryFormValues>(key: K, value: EnquiryFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  if (status === 'success' && result) {
    return (
      <SuccessPanel
        title="Question received"
        reference={result.reference}
        onReset={() => {
          setValues(emptyEnquiry);
          reset();
        }}
      >
        The clinic will reply using the details you provided. For urgent medical concerns, contact
        the clinic directly rather than using this form.
      </SuccessPanel>
    );
  }

  return (
    <form
      noValidate
      className="space-y-5"
      onSubmit={async (event) => {
        event.preventDefault();
        await handleSubmit(values);
      }}
    >
      <Honeypot
        onChange={(value) => {
          honeypotRef.current = value;
        }}
      />
      {formError ? <FormError message={formError} /> : null}

      <p className="text-xs leading-6 text-brand-muted">
        Asking about <span className="text-brand-indigo">{serviceName}</span>.
      </p>

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          id="enquiry-name"
          label="Name"
          required
          autoComplete="name"
          value={values.name}
          error={errors.name}
          onChange={(event) => update('name', event.target.value)}
        />
        <TextField
          id="enquiry-phone"
          label="Phone"
          required
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={values.phone}
          error={errors.phone}
          onChange={(event) => update('phone', event.target.value)}
        />
      </div>

      <TextField
        id="enquiry-email"
        label="Email"
        type="email"
        autoComplete="email"
        value={values.email}
        error={errors.email}
        onChange={(event) => update('email', event.target.value)}
      />

      <TextAreaField
        id="enquiry-message"
        label="Your question"
        required
        rows={4}
        maxLength={1000}
        value={values.message}
        error={errors.message}
        onChange={(event) => update('message', event.target.value)}
        hint="No medical history please — the clinic will ask what it needs privately."
      />

      <ConsentField
        id="enquiry-consent"
        checked={values.consentAccepted}
        onChange={(checked) => update('consentAccepted', checked)}
        error={errors.consentAccepted}
      >
        I agree to be contacted about this question and have read the{' '}
        <a href="/privacy-policy/" className="border-b border-brand-gold pb-0.5 text-brand-indigo">
          privacy notice
        </a>
        .
      </ConsentField>

      <SubmitButton busy={isSubmitting} label="Send question" />
    </form>
  );
}

const emptyContact: ContactFormValues = {
  name: '',
  email: '',
  phone: '',
  subject: '',
  message: '',
  consentAccepted: false,
};

export function ContactForm() {
  const [values, setValues] = useState<ContactFormValues>(emptyContact);

  const { status, errors, formError, result, handleSubmit, reset, isSubmitting, honeypotRef } =
    usePublicSubmission({ schema: contactFormSchema, submit: submitContactMessage });

  function update<K extends keyof ContactFormValues>(key: K, value: ContactFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  if (status === 'success' && result) {
    return (
      <SuccessPanel
        title="Message received"
        reference={result.reference}
        onReset={() => {
          setValues(emptyContact);
          reset();
        }}
      >
        The clinic will reply to the email address you provided. No appointment is booked by sending
        this message.
      </SuccessPanel>
    );
  }

  return (
    <form
      noValidate
      className="space-y-5"
      onSubmit={async (event) => {
        event.preventDefault();
        await handleSubmit(values);
      }}
    >
      <Honeypot
        onChange={(value) => {
          honeypotRef.current = value;
        }}
      />
      {formError ? <FormError message={formError} /> : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          id="contact-name"
          label="Name"
          required
          autoComplete="name"
          value={values.name}
          error={errors.name}
          onChange={(event) => update('name', event.target.value)}
        />
        <TextField
          id="contact-email"
          label="Email"
          required
          type="email"
          autoComplete="email"
          value={values.email}
          error={errors.email}
          onChange={(event) => update('email', event.target.value)}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          id="contact-phone"
          label="Phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={values.phone}
          error={errors.phone}
          onChange={(event) => update('phone', event.target.value)}
        />
        <TextField
          id="contact-subject"
          label="Subject"
          required
          value={values.subject}
          error={errors.subject}
          onChange={(event) => update('subject', event.target.value)}
        />
      </div>

      <TextAreaField
        id="contact-message"
        label="Message"
        required
        rows={5}
        maxLength={1000}
        value={values.message}
        error={errors.message}
        onChange={(event) => update('message', event.target.value)}
      />

      <ConsentField
        id="contact-consent"
        checked={values.consentAccepted}
        onChange={(checked) => update('consentAccepted', checked)}
        error={errors.consentAccepted}
      >
        I agree to be contacted and have read the{' '}
        <a href="/privacy-policy/" className="border-b border-brand-gold pb-0.5 text-brand-indigo">
          privacy notice
        </a>
        .
      </ConsentField>

      <SubmitButton busy={isSubmitting} label="Send message" />
    </form>
  );
}

const emptyTestimonial: TestimonialFormValues = {
  name: '',
  treatment: '',
  quote: '',
  consentAccepted: false,
};

export function TestimonialForm() {
  const [values, setValues] = useState<TestimonialFormValues>(emptyTestimonial);

  const { status, errors, formError, result, handleSubmit, reset, isSubmitting, honeypotRef } =
    usePublicSubmission({ schema: testimonialFormSchema, submit: submitTestimonial });

  function update<K extends keyof TestimonialFormValues>(key: K, value: TestimonialFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  if (status === 'success' && result) {
    return (
      <SuccessPanel
        title="Thank you"
        reference={result.reference}
        onReset={() => {
          setValues(emptyTestimonial);
          reset();
        }}
      >
        Your story is reviewed by the clinic before anything is published. Nothing appears on this
        page without that approval.
      </SuccessPanel>
    );
  }

  return (
    <form
      noValidate
      className="space-y-5"
      onSubmit={async (event) => {
        event.preventDefault();
        await handleSubmit(values);
      }}
    >
      <Honeypot
        onChange={(value) => {
          honeypotRef.current = value;
        }}
      />
      {formError ? <FormError message={formError} /> : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          id="testimonial-name"
          label="Name to display"
          required
          autoComplete="name"
          value={values.name}
          error={errors.name}
          onChange={(event) => update('name', event.target.value)}
          hint="Initials or a first name are fine."
        />
        <TextField
          id="testimonial-treatment"
          label="Treatment"
          value={values.treatment}
          error={errors.treatment}
          onChange={(event) => update('treatment', event.target.value)}
        />
      </div>

      <TextAreaField
        id="testimonial-quote"
        label="Your experience"
        required
        rows={5}
        maxLength={1200}
        value={values.quote}
        error={errors.quote}
        onChange={(event) => update('quote', event.target.value)}
      />

      <ConsentField
        id="testimonial-consent"
        checked={values.consentAccepted}
        onChange={(checked) => update('consentAccepted', checked)}
        error={errors.consentAccepted}
      >
        This is my own experience, and I consent to the clinic reviewing it for publication under
        the name I entered.
      </ConsentField>

      <SubmitButton busy={isSubmitting} label="Submit for review" />
    </form>
  );
}
