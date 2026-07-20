"use client";

import { use, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  AlertCircle,
  MessageSquare,
  Send,
  XCircle,
  DollarSign,
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
  paymentRef?: string;
  paymentStatus?: string;
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
  PRICE_REVIEW: "bg-orange-500 text-white",
  DELIVERED: "bg-purple-500 text-white",
  COMPLETED: "bg-muted text-muted-foreground",
  CANCELLED: "bg-red-500 text-white",
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
  const [refundLoading, setRefundLoading] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundReason, setRefundReason] = useState("");
  const [messages, setMessages] = useState<Array<{ id: string; content: string; senderId: string; sender: { id: string; name: string }; createdAt: string }>>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [existingReview, setExistingReview] = useState<{ rating: number; comment: string | null; reviewer: { name: string } } | null>(null);
  const [showPriceIssueModal, setShowPriceIssueModal] = useState(false);
  const [priceIssueItems, setPriceIssueItems] = useState<Array<{ name: string; quantity: string; maxBudget: number; actualPrice: number; note: string }>>([]);
  const [submittingPriceIssue, setSubmittingPriceIssue] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellingErrand, setCancellingErrand] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchErrand();
  }, [id]);

  useEffect(() => {
    if (showChat && errand) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [showChat, errand]);

  const fetchErrand = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/errands/${id}`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setErrand(data);
        if (data.status === "COMPLETED" && user && data.requesterId === user.id) {
          const reviewRes = await fetch(`/api/reviews?errandId=${data.id}`, { credentials: "include" });
          if (reviewRes.ok) {
            const reviewData = await reviewRes.json();
            if (reviewData.reviews && reviewData.reviews.length > 0) {
              setExistingReview(reviewData.reviews[0]);
            }
          }
        }
      }
    } catch {
      toast.error("Failed to load errand");
    }
    setLoading(false);
  };

  const fetchMessages = async () => {
    if (!errand) return;
    try {
      const res = await fetch(`/api/messages?errandId=${errand.id}`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      }
    } catch {}
  };

  const sendMessage = async () => {
    if (!errand || !newMessage.trim()) return;
    const content = newMessage.trim();
    setNewMessage("");
    setSendingMessage(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ errandId: errand.id, content }),
      });
      if (res.ok) {
        fetchMessages();
      }
    } catch {
      toast.error("Failed to send");
      setNewMessage(content);
    }
    setSendingMessage(false);
  };

  const fetchReview = async () => {
    if (!errand) return;
    try {
      const res = await fetch(`/api/reviews?errandId=${errand.id}`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        if (data.reviews && data.reviews.length > 0) {
          setExistingReview(data.reviews[0]);
        }
      }
    } catch {}
  };

  const submitReview = async () => {
    if (!errand) return;
    setSubmittingReview(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ errandId: errand.id, rating: reviewRating, comment: reviewComment }),
      });
      if (res.ok) {
        toast.success("Review submitted!");
        setShowReviewModal(false);
        fetchReview();
        fetchErrand();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to submit review");
      }
    } catch {
      toast.error("Something went wrong");
    }
    setSubmittingReview(false);
  };

  const handleFund = async () => {
    if (!errand || !user) return;
    setIsFunding(true);

    try {
      const totalAmount = errand.budget + errand.reward;
      const paymentRef = errand.paymentRef || `MRN-${Date.now()}`;

      // Update errand with paymentRef if it doesn't have one
      if (!errand.paymentRef) {
        await fetch(`/api/errands/${errand.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ status: errand.status, paymentRef }),
        });
      }

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

  const handleRefund = async () => {
    if (!errand || !refundReason) return;
    setRefundLoading(true);
    try {
      const res = await fetch("/api/refunds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ errandId: errand.id, reason: refundReason }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setShowRefundModal(false);
        setRefundReason("");
        fetchErrand();
      } else {
        toast.error(data.error || "Refund failed");
      }
    } catch {
      toast.error("Something went wrong");
    }
    setRefundLoading(false);
  };

  const handleWhatsApp = () => {
    if (!errand) return;
    const text = encodeURIComponent(`Hi! I saw your errand "${errand.title}" on MarketRun. I can help!`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const initPriceIssue = () => {
    const currentItems: ErrandItem[] = JSON.parse(errand!.items);
    setPriceIssueItems(
      currentItems.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        maxBudget: item.maxBudget,
        actualPrice: item.maxBudget,
        note: "",
      }))
    );
    setShowPriceIssueModal(true);
  };

  const handlePriceIssue = async () => {
    if (!errand) return;
    setSubmittingPriceIssue(true);
    try {
      // Update items with actual prices
      const updatedItems = priceIssueItems.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        maxBudget: item.actualPrice,
      }));
      const newBudget = updatedItems.reduce((sum, item) => sum + item.maxBudget, 0);

      const res = await fetch(`/api/errands/${errand.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          status: "PRICE_REVIEW",
          items: JSON.stringify(updatedItems),
          budget: newBudget,
        }),
      });

      if (res.ok) {
        // Send a message about the price issue
        const priceNotes = priceIssueItems
          .filter((item) => item.note || item.actualPrice !== item.maxBudget)
          .map((item) => `${item.name}: ₦${item.maxBudget.toLocaleString()} → ₦${item.actualPrice.toLocaleString()}${item.note ? ` (${item.note})` : ""}`)
          .join("\n");

        await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            errandId: errand.id,
            content: `Price update request:\n${priceNotes}\n\nNew total budget: ₦${newBudget.toLocaleString()}`,
          }),
        });

        toast.success("Price issue reported. Waiting for requester approval.");
        setShowPriceIssueModal(false);
        fetchErrand();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to report price issue");
      }
    } catch {
      toast.error("Something went wrong");
    }
    setSubmittingPriceIssue(false);
  };

  const handleApprovePrice = async () => {
    if (!errand) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/errands/${errand.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "APPROVE_PRICE" }),
      });
      if (res.ok) {
        toast.success("Price approved! Shopping continues.");
        fetchErrand();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to approve");
      }
    } catch {
      toast.error("Something went wrong");
    }
    setActionLoading(false);
  };

  const handleRejectPrice = async () => {
    if (!errand) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/errands/${errand.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "REJECT_PRICE" }),
      });
      if (res.ok) {
        toast.success("Price rejected. Please negotiate via chat.");
        fetchErrand();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to reject");
      }
    } catch {
      toast.error("Something went wrong");
    }
    setActionLoading(false);
  };

  const handleCancelErrand = async () => {
    if (!errand) return;
    setCancellingErrand(true);
    try {
      const res = await fetch(`/api/errands/${errand.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      if (res.ok) {
        toast.success("Errand cancelled.");
        setShowCancelModal(false);
        fetchErrand();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to cancel");
      }
    } catch {
      toast.error("Something went wrong");
    }
    setCancellingErrand(false);
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
  const canReportPriceIssue = isShopper && errand.status === "SHOPPING";
  const canApproveRejectPrice = isRequester && errand.status === "PRICE_REVIEW";
  const canCancel = isRequester && ["OPEN", "ACCEPTED", "FUNDED"].includes(errand.status);

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
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

            {(isRequester || isShopper) && errand.status !== "OPEN" && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <Card className="border-border/50">
                  <CardContent className="p-6">
                    <button onClick={() => setShowChat(!showChat)} className="flex items-center gap-3 w-full text-left">
                      <MessageSquare className="w-5 h-5 text-primary" />
                      <h2 className="font-semibold text-lg flex-1">Conversation</h2>
                      <span className="text-sm text-muted-foreground">{showChat ? "Hide" : "Show"}</span>
                    </button>
                    {showChat && (
                      <div className="mt-4">
                        <div className="h-80 overflow-y-auto border border-border rounded-xl p-4 mb-4 bg-muted/20 space-y-3">
                          {messages.length === 0 && (
                            <p className="text-center text-muted-foreground text-sm py-8">No messages yet. Say hello!</p>
                          )}
                          {messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.senderId === user?.id ? "justify-end" : "justify-start"}`}>
                              <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${msg.senderId === user?.id ? "bg-primary text-primary-foreground" : "bg-card border border-border"}`}>
                                <p className="text-sm font-medium mb-0.5">{msg.sender.name}</p>
                                <p className="text-sm">{msg.content}</p>
                                <p className={`text-xs mt-1 ${msg.senderId === user?.id ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </p>
                              </div>
                            </div>
                          ))}
                          <div ref={messagesEndRef} />
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                            placeholder="Type a message..."
                            className="flex-1 px-4 py-2.5 border border-border rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                          />
                          <Button size="sm" onClick={sendMessage} disabled={sendingMessage || !newMessage.trim()}>
                            <Send className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
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

                  {canReportPriceIssue && (
                    <Button className="w-full" size="lg" variant="outline" onClick={initPriceIssue} disabled={actionLoading}>
                      <DollarSign className="w-5 h-5 mr-2" /> Report Price Issue
                    </Button>
                  )}

                  {canApproveRejectPrice && (
                    <div className="space-y-2">
                      <Button className="w-full bg-accent hover:bg-accent/90" size="lg" onClick={handleApprovePrice} disabled={actionLoading}>
                        {actionLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <CheckCircle2 className="w-5 h-5 mr-2" />}
                        Approve New Prices
                      </Button>
                      <Button className="w-full" size="lg" variant="outline" onClick={handleRejectPrice} disabled={actionLoading}>
                        <XCircle className="w-5 h-5 mr-2" /> Reject Prices
                      </Button>
                    </div>
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

                  {isRequester && errand.status === "COMPLETED" && !existingReview && (
                    <Button className="w-full" size="lg" onClick={() => setShowReviewModal(true)}>
                      <Star className="w-5 h-5 mr-2" /> Rate Shopper
                    </Button>
                  )}

                  {existingReview && (
                    <div className="p-4 bg-muted/50 rounded-xl mt-2">
                      <p className="text-sm font-medium mb-1">Your Review</p>
                      <div className="flex items-center gap-1 mb-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={`w-4 h-4 ${s <= existingReview.rating ? "fill-secondary text-secondary" : "text-muted-foreground"}`} />
                        ))}
                      </div>
                      {existingReview.comment && <p className="text-sm text-muted-foreground">{existingReview.comment}</p>}
                    </div>
                  )}

                  {isRequester && (errand.status === "COMPLETED" || errand.status === "DELIVERED") && (
                    <Button className="w-full mt-2" variant="destructive" onClick={() => setShowRefundModal(true)}>
                      <AlertCircle className="w-4 h-4 mr-2" /> Request Refund
                    </Button>
                  )}

                  {canCancel && (
                    <Button className="w-full mt-2" variant="destructive" onClick={() => setShowCancelModal(true)}>
                      <XCircle className="w-4 h-4 mr-2" /> Cancel Errand
                    </Button>
                  )}

                  {errand.status === "CANCELLED" && (
                    <div className="text-center py-4">
                      <XCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
                      <p className="font-semibold text-red-500">Cancelled</p>
                      <p className="text-sm text-muted-foreground">This errand has been cancelled.</p>
                    </div>
                  )}

                  {errand.status === "PRICE_REVIEW" && (
                    <div className="p-4 bg-orange-500/10 rounded-xl mt-2">
                      <p className="font-semibold text-orange-600 flex items-center gap-2">
                        <DollarSign className="w-4 h-4" /> Price Review in Progress
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {isShopper ? "Waiting for requester to review new prices." : "Shopper reported different prices. Please review."}
                      </p>
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

      {/* Refund Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowRefundModal(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card rounded-2xl p-8 w-full max-w-md border border-border/50 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-2">Request Refund</h2>
            <p className="text-muted-foreground mb-6">Refund amount: ₦{(errand.budget + errand.reward).toLocaleString()}</p>
            <div className="space-y-4">
              <div>
                <Label>Reason for refund</Label>
                <select value={refundReason} onChange={(e) => setRefundReason(e.target.value)} className="w-full mt-1 px-4 py-2.5 border border-border rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                  <option value="">Select a reason...</option>
                  <option value="Wrong items delivered">Wrong items delivered</option>
                  <option value="Items damaged">Items damaged</option>
                  <option value="Items not as described">Items not as described</option>
                  <option value="Partial delivery">Partial delivery</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowRefundModal(false)}>Cancel</Button>
                <Button variant="destructive" className="flex-1" onClick={handleRefund} disabled={refundLoading || !refundReason}>
                  {refundLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Submit Refund
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowReviewModal(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card rounded-2xl p-8 w-full max-w-md border border-border/50 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-2">Rate Your Shopper</h2>
            <p className="text-muted-foreground mb-6">How was your experience with {errand.shopper?.name || "your shopper"}?</p>
            <div className="space-y-4">
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} onClick={() => setReviewRating(s)} className="p-1">
                    <Star className={`w-10 h-10 transition-colors ${s <= reviewRating ? "fill-secondary text-secondary" : "text-muted-foreground hover:text-secondary/50"}`} />
                  </button>
                ))}
              </div>
              <p className="text-center text-sm text-muted-foreground">
                {reviewRating === 1 && "Poor"}{reviewRating === 2 && "Fair"}{reviewRating === 3 && "Good"}{reviewRating === 4 && "Very Good"}{reviewRating === 5 && "Excellent"}
              </p>
              <div>
                <Label>Comment (optional)</Label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Tell others about your experience..."
                  rows={3}
                  className="w-full mt-1 px-4 py-2.5 border border-border rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowReviewModal(false)}>Cancel</Button>
                <Button className="flex-1 bg-secondary hover:bg-secondary/90 text-secondary-foreground" onClick={submitReview} disabled={submittingReview}>
                  {submittingReview && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Submit Review
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Price Issue Modal */}
      {showPriceIssueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowPriceIssueModal(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card rounded-2xl p-8 w-full max-w-lg border border-border/50 shadow-xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-2">Report Price Issue</h2>
            <p className="text-muted-foreground mb-6">Update the actual prices you found at the market. The requester will review and approve.</p>
            <div className="space-y-4">
              {priceIssueItems.map((item, index) => (
                <div key={index} className="p-4 bg-muted/50 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">Budget: ₦{item.maxBudget.toLocaleString()}</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <Label className="text-xs">Actual Price (₦)</Label>
                      <Input
                        type="number"
                        value={item.actualPrice}
                        onChange={(e) => {
                          const newItems = [...priceIssueItems];
                          newItems[index].actualPrice = parseInt(e.target.value) || 0;
                          setPriceIssueItems(newItems);
                        }}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs">Note (optional)</Label>
                      <Input
                        value={item.note}
                        onChange={(e) => {
                          const newItems = [...priceIssueItems];
                          newItems[index].note = e.target.value;
                          setPriceIssueItems(newItems);
                        }}
                        placeholder="e.g., sold out"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <div className="p-4 bg-orange-500/10 rounded-lg">
                <p className="text-sm font-medium">
                  New Total: ₦{priceIssueItems.reduce((sum, item) => sum + item.actualPrice, 0).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  Original: ₦{items.reduce((sum, item) => sum + item.maxBudget, 0).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowPriceIssueModal(false)}>Cancel</Button>
                <Button className="flex-1 bg-primary hover:bg-primary/90" onClick={handlePriceIssue} disabled={submittingPriceIssue}>
                  {submittingPriceIssue && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Submit Price Update
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Cancel Errand Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowCancelModal(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card rounded-2xl p-8 w-full max-w-md border border-border/50 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-2">Cancel Errand</h2>
            <p className="text-muted-foreground mb-6">Are you sure you want to cancel this errand? This action cannot be undone.</p>
            {errand.paymentStatus === "PAID" && (
              <div className="p-4 bg-blue-500/10 rounded-lg mb-4">
                <p className="text-sm font-medium text-blue-600">Refund Notice</p>
                <p className="text-sm text-muted-foreground">Since this errand was funded, a refund will be processed to your original payment method.</p>
              </div>
            )}
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowCancelModal(false)}>Keep Errand</Button>
              <Button variant="destructive" className="flex-1" onClick={handleCancelErrand} disabled={cancellingErrand}>
                {cancellingErrand && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Yes, Cancel
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
