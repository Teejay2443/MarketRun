"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  MapPin,
  Clock,
  Star,
  ShoppingBag,
  CheckCircle2,
  Circle,
  CreditCard,
  Share2,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/lib/auth";

interface ErrandItem {
  name: string;
  quantity: string;
  brand?: string;
  maxBudget: number;
}

interface Errand {
  id: string;
  title: string;
  description: string;
  market: string;
  items: string;
  budget: number;
  reward: number;
  status: string;
  address: string;
  estate: string | null;
  createdAt: string;
  requester: { id: string; name: string; estate: string | null; rating: number };
  shopper: { id: string; name: string; estate: string | null; rating: number } | null;
  requesterId: string;
  shopperId: string | null;
}

const statusSteps = [
  { key: "OPEN", label: "Errand Posted", icon: ShoppingBag },
  { key: "ACCEPTED", label: "Shopper Accepted", icon: CheckCircle2 },
  { key: "FUNDED", label: "Funded via Monnify", icon: CreditCard },
  { key: "SHOPPING", label: "Shopping in Progress", icon: ShoppingBag },
  { key: "DELIVERED", label: "Delivered", icon: CheckCircle2 },
  { key: "COMPLETED", label: "Confirmed & Complete", icon: CheckCircle2 },
];

const statusOrder = ["OPEN", "ACCEPTED", "FUNDED", "SHOPPING", "DELIVERED", "COMPLETED"];

const statusColors: Record<string, string> = {
  OPEN: "bg-accent text-accent-foreground",
  ACCEPTED: "bg-secondary text-secondary-foreground",
  FUNDED: "bg-primary text-primary-foreground",
  SHOPPING: "bg-blue-500 text-white",
  DELIVERED: "bg-purple-500 text-white",
  COMPLETED: "bg-muted text-muted-foreground",
};

export default function ErrandDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const [errand, setErrand] = useState<Errand | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFunding, setIsFunding] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchErrand();
  }, [id]);

  const fetchErrand = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/errands/${id}`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setErrand(data);
      }
    } catch {
      toast.error("Failed to load errand");
    }
    setLoading(false);
  };

  const handleFund = async () => {
    if (!errand || !user) return;
    setIsFunding(true);

    try {
      const totalAmount = errand.budget + errand.reward;
      const paymentRef = `MRN-${Date.now()}`;

      const response = await fetch("/api/monnify/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: totalAmount,
          paymentReference: paymentRef,
          customerName: user.name,
          customerEmail: user.email,
          description: `Fund errand: ${errand.title}`,
        }),
      });

      const data = await response.json();

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        toast.error("Failed to initialize payment.");
        setIsFunding(false);
      }
    } catch {
      toast.error("Something went wrong.");
      setIsFunding(false);
    }
  };

  const handleAccept = async () => {
    if (!errand || !user) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/errands/${errand.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ shopperId: user.id }),
      });
      if (res.ok) {
        toast.success("Errand accepted!");
        fetchErrand();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to accept");
      }
    } catch {
      toast.error("Something went wrong");
    }
    setActionLoading(false);
  };

  const handleStatusUpdate = async (status: string) => {
    if (!errand || !user) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/errands/${errand.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        toast.success(`Status updated to ${status}`);
        fetchErrand();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update");
      }
    } catch {
      toast.error("Something went wrong");
    }
    setActionLoading(false);
  };

  const handleWhatsApp = () => {
    if (!errand) return;
    const text = encodeURIComponent(`Hi! I saw your errand "${errand.title}" on MarketRun. I can help!`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!errand) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Errand not found</h1>
          <p className="text-muted-foreground mb-4">The errand you&apos;re looking for doesn&apos;t exist or has been removed.</p>
          <Link href="/errands"><Button>Browse Errands</Button></Link>
        </div>
      </div>
    );
  }

  const items: ErrandItem[] = JSON.parse(errand.items);
  const currentStatusIndex = statusOrder.indexOf(errand.status);
  const isRequester = user && errand.requesterId === user.id;
  const isShopper = user && errand.shopperId === user.id;
  const canFund = isRequester && (errand.status === "OPEN" || errand.status === "ACCEPTED");
  const canMarkShopping = isShopper && errand.status === "ACCEPTED";
  const canMarkDelivered = isShopper && errand.status === "SHOPPING";
  const canConfirm = isRequester && errand.status === "DELIVERED";

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/errands" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Errands
          </Link>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-4">
              {errand.status === "OPEN" && <span className="w-3 h-3 bg-accent rounded-full status-pulse" />}
              <Badge variant="secondary" className={statusColors[errand.status]}>{errand.status}</Badge>
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="w-4 h-4" /> Posted {new Date(errand.createdAt).toLocaleDateString()}
              </span>
              {isRequester && <Badge className="bg-primary/10 text-primary">Your Errand</Badge>}
              {isShopper && <Badge className="bg-secondary/10 text-secondary">Your Job</Badge>}
            </div>
            <h1 className="text-3xl font-bold mb-4">{errand.title}</h1>
            <p className="text-lg text-muted-foreground">{errand.description}</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="border-border/50">
                <CardContent className="p-6">
                  <h2 className="font-semibold text-lg mb-4">Location Details</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Market</p>
                        <p className="font-medium">{errand.market}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-accent mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Delivery Address</p>
                        <p className="font-medium">{errand.address}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="border-border/50">
                <CardContent className="p-6">
                  <h2 className="font-semibold text-lg mb-4">Shopping List</h2>
                  <div className="space-y-3">
                    {items.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                            <ShoppingBag className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {item.quantity}{item.brand && ` • ${item.brand}`}
                            </p>
                          </div>
                        </div>
                        <p className="font-medium">₦{item.maxBudget.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="border-border/50">
                <CardContent className="p-6">
                  <h2 className="font-semibold text-lg mb-6">Order Status</h2>
                  <div className="space-y-0">
                    {statusSteps.map((step, index) => {
                      const isCompleted = index <= currentStatusIndex;
                      const isCurrent = index === currentStatusIndex;
                      return (
                        <div key={step.key} className="relative">
                          {index < statusSteps.length - 1 && (
                            <div className={`absolute left-4 top-8 w-0.5 h-8 ${isCompleted ? "bg-primary" : "bg-border"}`} />
                          )}
                          <div className="flex items-start gap-4 pb-6">
                            <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center ${isCompleted ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"} ${isCurrent ? "ring-4 ring-primary/20" : ""}`}>
                              {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                            </div>
                            <div className="flex-1">
                              <p className={`font-medium ${isCompleted ? "text-foreground" : "text-muted-foreground"}`}>{step.label}</p>
                              {isCurrent && <p className="text-sm text-primary mt-1">Current status</p>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <Card className="border-border/50 sticky top-24">
                <CardContent className="p-6">
                  <h2 className="font-semibold text-lg mb-4">Order Summary</h2>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Shopping Items</span>
                      <span className="font-medium">₦{errand.budget.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Shopper Reward</span>
                      <span className="font-medium text-primary">₦{errand.reward.toLocaleString()}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg">
                      <span className="font-semibold">Total</span>
                      <span className="font-bold">₦{(errand.budget + errand.reward).toLocaleString()}</span>
                    </div>
                  </div>

                  {canFund && (
                    <Button className="w-full" size="lg" onClick={handleFund} disabled={isFunding}>
                      {isFunding ? (
                        <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Initializing...</>
                      ) : (
                        <><CreditCard className="w-5 h-5 mr-2" /> Fund This Errand</>
                      )}
                    </Button>
                  )}

                  {isShopper && canMarkShopping && (
                    <Button className="w-full" size="lg" onClick={() => handleStatusUpdate("SHOPPING")} disabled={actionLoading}>
                      {actionLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <ShoppingBag className="w-5 h-5 mr-2" />}
                      Start Shopping
                    </Button>
                  )}

                  {isShopper && canMarkDelivered && (
                    <Button className="w-full" size="lg" onClick={() => handleStatusUpdate("DELIVERED")} disabled={actionLoading}>
                      {actionLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <CheckCircle2 className="w-5 h-5 mr-2" />}
                      Mark as Delivered
                    </Button>
                  )}

                  {canConfirm && (
                    <Button className="w-full bg-accent hover:bg-accent/90" size="lg" onClick={() => handleStatusUpdate("COMPLETED")} disabled={actionLoading}>
                      {actionLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <CheckCircle2 className="w-5 h-5 mr-2" />}
                      Confirm Delivery
                    </Button>
                  )}

                  {errand.status === "COMPLETED" && (
                    <div className="text-center py-4">
                      <CheckCircle2 className="w-12 h-12 text-accent mx-auto mb-2" />
                      <p className="font-semibold text-accent">Completed!</p>
                    </div>
                  )}

                  <Button className="w-full mt-3" variant="outline" onClick={handleWhatsApp}>
                    <Share2 className="w-4 h-4 mr-2" /> Share via WhatsApp
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
              <Card className="border-border/50">
                <CardContent className="p-6">
                  <h2 className="font-semibold text-lg mb-4">Requester</h2>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-xl font-bold text-primary">{errand.requester.name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-lg">{errand.requester.name}</p>
                      <p className="text-muted-foreground">{errand.requester.estate}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-4 h-4 fill-secondary text-secondary" />
                        <span className="font-medium">{errand.requester.rating}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {errand.shopper && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
                <Card className="border-border/50">
                  <CardContent className="p-6">
                    <h2 className="font-semibold text-lg mb-4">Shopper</h2>
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-secondary/10 rounded-full flex items-center justify-center">
                        <span className="text-xl font-bold text-secondary">{errand.shopper.name.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-lg">{errand.shopper.name}</p>
                        <p className="text-muted-foreground">{errand.shopper.estate}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="w-4 h-4 fill-secondary text-secondary" />
                          <span className="font-medium">{errand.shopper.rating}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
