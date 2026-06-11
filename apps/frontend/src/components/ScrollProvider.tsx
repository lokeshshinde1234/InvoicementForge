"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type Props = { children: React.ReactNode };

export default function ScrollProvider({ children }: Props) {
  const pathname = usePathname();
  const [routeLoading, setRouteLoading] = useState(false);

  useEffect(() => {
    setRouteLoading(true);
    const frame = window.requestAnimationFrame(() => {
      window.setTimeout(() => setRouteLoading(false), 220);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Smooth anchor scrolling (respect user prefers-reduced-motion)
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!prefersReduced) {
      document.documentElement.style.scrollBehavior = "smooth";
    }

    // IntersectionObserver for reveal animations using data-aos-like attributes
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const el = entry.target as HTMLElement;
          if (entry.isIntersecting) {
            el.classList.add("aos-animate");
            if (el.dataset.once === "true") io.unobserve(el);
          } else if (!el.dataset.once) {
            el.classList.remove("aos-animate");
          }
        });
      },
      { threshold: 0.12 }
    );

    const observed = new WeakSet<Element>();
    const selector = [
      "[data-aos]",
      "[data-if-fade-up]",
      "[data-if-slide-left]",
      "[data-if-soft-zoom]",
      ".marketing-reveal",
      ".hover-lift",
    ].join(", ");

    const observeNodes = () => {
      document.querySelectorAll(selector).forEach((node) => {
        if (observed.has(node)) return;
        const element = node as HTMLElement;
        if (!element.dataset.aos) {
          element.dataset.aos = "if-fade-up";
          element.dataset.once = "true";
        }
        observed.add(element);
        io.observe(element);
      });
    };

    observeNodes();

    const mutationObserver = new MutationObserver(() => observeNodes());
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    // Optional: progress bar for scroll
    const prog = document.createElement("div");
    prog.className = "fixed left-0 top-0 h-1 w-0 z-50 scroll-progress";
    document.body.appendChild(prog);

    const onScroll = () => {
      const doc = document.documentElement;
      const percent = (doc.scrollTop || document.body.scrollTop) / (doc.scrollHeight - doc.clientHeight);
      prog.style.width = `${Math.min(100, Math.max(0, percent * 100))}%`;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      io.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener("scroll", onScroll);
      prog.remove();
    };
  }, []);

  return (
    <>
      <div
        className={`route-loading-bar ${routeLoading ? "route-loading-bar-active" : ""}`}
        aria-hidden="true"
      />
      <div key={pathname} className="page-load-surface">
        {children}
      </div>
    </>
  );
}
