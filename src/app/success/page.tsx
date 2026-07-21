"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import confetti from "canvas-confetti";
import {
  CheckCircle2,
  Home,
  ShoppingBag,
  Share2,
  Loader2,
  AlertCircle,
} from "lucide-react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errandId, setErrandId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyPayment = async () => {
      const paymentRef = searchParams.get("paymentReference") || searchParams.get("paymentRef") || searchParams.get("reference") || searchParams.get("txnRef");
      const transactionRef = searchParams.get("transactionRef") || searchParams.get("transaction_reference");
      const ref = paymentRef || transactionRef;

      if (!ref) {
        setStatus("success");
        setMessage("Payment confirmed. Your errand is now live!");
        triggerConfetti();
        return;
      }

      try {
        const verifyRes = await fetch(`/api/monnify/verify?ref=${encodeURIComponent(ref)}`);
        const verifyData = await verifyRes.json();

        const paymentSuccessful = verifyData.paymentStatus === "PAID" || verifyData.paymentStatus === "OVERPAID";

        if (!verifyData || !paymentSuccessful) {
          setStatus("error");
          setMessage("Payment verification failed. Please contact support.");
          return;
        }

        const findRes = await fetch("/api/errands?mine=requester", { credentials: "include" });
        const myErrands = await findRes.json();
        const errand = Array.isArray(myErrands)
          ? myErrands.find((e: { paymentRef?: string; status: string }) => e.paymentRef === ref)
          : null;

        if (errand) {
          setErrandId(errand.id);
          if (errand.status === "OPEN") {
            await fetch(`/api/errands/${errand.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ status: "FUNDED", monnifyRef: ref }),
            });
          }
        }

        setStatus("success");
        setMessage("Payment confirmed! Your errand is now live and waiting for a shopper.");
        triggerConfetti();
      } catch {
        setStatus("error");
        setMessage("Something went wrong verifying your payment. Please contact support.");
      }
    };

    verifyPayment();
  }, [searchParams]);

  const triggerConfetti = () => {
    const duration = 3 * 1000;
    const end = Date.now() + duration;
    const frame = () => {
      confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors: ["#0A6847", "#10B981", "#F59E0B"] });
      confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors: ["#0A6847", "#10B981", "#F59E0B"] });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full">
        <Card className="border-border/50">
          <CardContent className="p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
                status === "loading" ? "bg-primary/10" : status === "success" ? "bg-accent/10" : "bg-destructive/10"
              }`}
            >
              {status === "loading" && <Loader2 className="w-10 h-10 text-primary animate-spin" />}
              {status === "success" && <CheckCircle2 className="w-10 h-10 text-accent" />}
              {status === "error" && <AlertCircle className="w-10 h-10 text-destructive" />}
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-2xl font-bold mb-2">
              {status === "loading" ? "Verifying Payment..." : status === "success" ? "Errand Posted Successfully!" : "Payment Issue"}
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-muted-foreground mb-6">
              {status === "loading" ? "Please wait while we confirm your payment with Monnify..." : message}
            </motion.p>

            {status === "success" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="text-left bg-primary/5 rounded-lg p-4 mb-6">
                <h3 className="font-semibold mb-2">What happens next?</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center shrink-0 mt-0.5"><span className="text-xs font-medium text-primary">1</span></span>
                    <span>A shopper from your community will accept your errand</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center shrink-0 mt-0.5"><span className="text-xs font-medium text-primary">2</span></span>
                    <span>The shopper will start purchasing your items</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center shrink-0 mt-0.5"><span className="text-xs font-medium text-primary">3</span></span>
                    <span>Confirm delivery to release payment to the shopper</span>
                  </li>
                </ul>
              </motion.div>
            )}

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="space-y-3">
              <Link href="/dashboard" className="block">
                <Button className="w-full" size="lg"><Home className="w-5 h-5 mr-2" /> Go to Dashboard</Button>
              </Link>
              {errandId && (
                <Link href={`/errands/${errandId}`} className="block">
                  <Button variant="outline" className="w-full" size="lg"><ShoppingBag className="w-5 h-5 mr-2" /> View Errand</Button>
                </Link>
              )}
              <Button variant="ghost" className="w-full"><Share2 className="w-4 h-4 mr-2" /> Share via WhatsApp</Button>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
