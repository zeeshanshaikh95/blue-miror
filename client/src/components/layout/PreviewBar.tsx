import { Container } from '@/components/ui/Container';

export function PreviewBar() {
  return (
    <div className="border-b border-brand-gold/25 bg-brand-indigo-deep text-brand-ivory">
      <Container className="flex min-h-8 items-center justify-center gap-2.5 py-2 text-center">
        <span aria-hidden="true" className="size-1 shrink-0 rotate-45 bg-brand-gold" />
        <p className="text-center text-[0.6rem] leading-4 tracking-[0.12em] uppercase sm:text-[0.625rem]">
          Preview build · final clinic details and photography pending
        </p>
      </Container>
    </div>
  );
}
