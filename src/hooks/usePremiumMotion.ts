import { useEffect } from "react";

/** One observer for scroll reveals, including cards added by filters or pagination. */
export function usePremiumMotion(page: string) {
  useEffect(() => {
    const root = document.querySelector("main");
    if (!root) return;
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    let observer: IntersectionObserver | undefined;
    const selector =
      ".movie-card, .stats-panel, .editorial-strip, .discover-banner, .social-panel, .continue-card, .progress-universes > div, .export-panel, .earth-navigation, .tva-closing-strip";
    const scan = () => {
      root.querySelectorAll<HTMLElement>(selector).forEach((node, i) => {
        if (node.dataset.reveal) return;
        node.dataset.reveal = media.matches ? "visible" : "pending";
        node.style.setProperty(
          "--reveal-delay",
          `${Math.min(i % 6, 4) * 35}ms`,
        );
        if (!media.matches) observer?.observe(node);
      });
    };
    const apply = () => {
      observer?.disconnect();
      if (media.matches)
        root
          .querySelectorAll<HTMLElement>("[data-reveal]")
          .forEach((n) => (n.dataset.reveal = "visible"));
      else {
        observer = new IntersectionObserver(
          (entries) => {
            entries.forEach(({ target, isIntersecting }) => {
              if (isIntersecting) {
                (target as HTMLElement).dataset.reveal = "visible";
                observer?.unobserve(target);
              }
            });
          },
          { threshold: 0.05, rootMargin: "0px 0px 35px 0px" },
        );
      }
      scan();
    };
    apply();
    const changes = new MutationObserver(scan);
    changes.observe(root, { childList: true, subtree: true });
    media.addEventListener("change", apply);
    return () => {
      changes.disconnect();
      observer?.disconnect();
      media.removeEventListener("change", apply);
      root
        .querySelectorAll<HTMLElement>("[data-reveal]")
        .forEach((n) => delete n.dataset.reveal);
    };
  }, [page]);
}
