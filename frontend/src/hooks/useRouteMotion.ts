import { useEffect } from 'react';
import type { RefObject } from 'react';
import gsap from 'gsap';

/** La animación comunica dirección; las posiciones siempre vienen de Python. */
export function useRouteMotion(root: RefObject<SVGSVGElement | null>, signature: string) {
  useEffect(() => {
    if (!root.current) return;
    const media = gsap.matchMedia();
    media.add(
      '(prefers-reduced-motion: no-preference)',
      () => {
        const flows = root.current?.querySelectorAll('.route-flow');
        if (flows?.length)
          gsap.to(flows, { strokeDashoffset: -18, duration: 1.2, ease: 'none', repeat: -1 });
      },
      root,
    );
    return () => media.revert();
  }, [root, signature]);
}
