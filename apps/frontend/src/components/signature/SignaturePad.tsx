"use client";

import { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";

type SignaturePadProps = {
  onSign: (base64DataUrl: string) => Promise<void> | void;
  disabled?: boolean;
};

export function SignaturePad({ onSign, disabled = false }: SignaturePadProps) {
  const signatureRef = useRef<SignatureCanvas | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitSignature() {
    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSign(signatureRef.current.toDataURL("image/png"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="overflow-hidden rounded-md border border-slate-200 bg-slate-50">
        <SignatureCanvas
          ref={signatureRef}
          canvasProps={{
            className: "h-48 w-full bg-white",
          }}
        />
      </div>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Button
          variant="outline"
          onClick={() => signatureRef.current?.clear()}
          disabled={disabled || isSubmitting}
        >
          Clear
        </Button>
        <Button onClick={submitSignature} disabled={disabled || isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit signature"}
        </Button>
      </div>
    </div>
  );
}
