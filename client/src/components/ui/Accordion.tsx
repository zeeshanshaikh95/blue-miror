import { Minus, Plus } from 'lucide-react';
import { useId, useState } from 'react';

export type AccordionItem = {
  id: string;
  question: string;
  answer: string;
};

type AccordionProps = {
  items: AccordionItem[];
};

export function Accordion({ items }: AccordionProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const baseId = useId().replace(/:/g, '');

  return (
    <div className="border-t border-brand-line">
      {items.map((item) => {
        const isOpen = openId === item.id;
        const buttonId = `${baseId}-${item.id}-button`;
        const panelId = `${baseId}-${item.id}-panel`;

        return (
          <div key={item.id} className="border-b border-brand-line">
            <h3>
              <button
                type="button"
                id={buttonId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenId(isOpen ? null : item.id)}
                className="flex w-full items-start justify-between gap-6 py-5 text-left transition-colors hover:text-brand-gold-deep sm:py-6"
              >
                <span className="font-display text-xl leading-snug text-brand-indigo sm:text-2xl">
                  {item.question}
                </span>
                <span
                  aria-hidden="true"
                  className="mt-1 flex size-7 shrink-0 items-center justify-center border border-brand-line text-brand-indigo"
                >
                  {isOpen ? (
                    <Minus size={14} strokeWidth={1.5} />
                  ) : (
                    <Plus size={14} strokeWidth={1.5} />
                  )}
                </span>
              </button>
            </h3>

            {isOpen ? (
              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                className="max-w-2xl pb-6 text-sm leading-7 text-brand-muted"
              >
                {item.answer}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
