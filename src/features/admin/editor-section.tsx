import { forwardRef, useId, useState, type HTMLAttributes, type ReactNode } from 'react';
import * as Collapsible from '@radix-ui/react-collapsible';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface EditorSectionProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  summary?: ReactNode;
  defaultOpen?: boolean;
}
/** Keyboard-accessible item editor; draft state belongs to the parent. */
export const EditorSection = forwardRef<HTMLDivElement, EditorSectionProps>(function EditorSection({ title, summary, defaultOpen = false, children, className, ...props }, ref) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return <Collapsible.Root ref={ref} open={open} onOpenChange={setOpen} {...props} className={cn('min-w-0 rounded-lg border border-surface-border bg-surface', className)}>
    <Collapsible.Trigger asChild><Button variant="ghost" aria-controls={id} className="h-auto w-full justify-between gap-3 rounded-lg px-4 py-3 text-left hover:bg-glass">
      <span className="min-w-0"><span className="block break-words text-base font-bold">{title}</span>{summary && <span className="mt-1 block whitespace-normal text-xs text-muted-foreground">{summary}</span>}</span>
      <ChevronDown aria-hidden="true" className={cn('shrink-0', open && 'rotate-180')} />
    </Button></Collapsible.Trigger>
    <Collapsible.Content id={id} className="border-t border-surface-border p-4">{children}</Collapsible.Content>
  </Collapsible.Root>;
});