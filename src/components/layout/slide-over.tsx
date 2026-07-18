"use client";

import { useEffect } from "react";

export function SlideOver({
  open,
  onClose,
  side,
  ariaLabel,
  children,
}: {
  open: boolean;
  onClose: () => void;
  side: "left" | "right";
  ariaLabel: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) {
      return;
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const sideClass = side === "left" ? "left-0" : "right-0";
  const closedTransform = side === "left" ? "-translate-x-full" : "translate-x-full";

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`fixed inset-0 z-30 bg-black/40 transition-opacity duration-200 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        aria-hidden={!open}
        className={`fixed inset-y-0 ${sideClass} z-40 flex w-72 max-w-[85vw] flex-col gap-1 overflow-y-auto bg-white p-4 shadow-xl transition-transform duration-200 ease-out dark:bg-zinc-950 ${
          open ? "translate-x-0" : closedTransform
        }`}
      >
        {children}
      </div>
    </>
  );
}
