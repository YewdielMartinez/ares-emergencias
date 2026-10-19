import { useRef } from 'react';
import type { ReactNode } from 'react';
import { useDetails } from '@yewdiel21/motion-kit/react';
import { ChevronDown } from 'lucide-react';

/** Divulgación progresiva con la receta details y su movimiento del kit. */
export default function Disclosure({ title, children }: { title: string; children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  useDetails(root);
  return (
    <div ref={root} data-mk="details" className="disclosure">
      <details>
        <summary>
          <span>{title}</span>
          <ChevronDown data-mk-chevron="" size={18} aria-hidden="true" />
        </summary>
        <div className="disclosure-content">{children}</div>
      </details>
    </div>
  );
}
