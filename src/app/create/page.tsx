"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
  ShoppingBag,
  MapPin,
  CreditCard,
  CheckCircle2,
  Sparkles,
  Loader2,
} from "lucide-react";

interface ShoppingItem {
  name: string;
  quantity: string;
  brand: string;
  maxBudget: number;
}

const popularMarkets = [
  "Balogun Market",
  "Mile 12 Market",
  "Mile 3 Market",
  "Oshodi Market",
  "Aspamda Market",
  "Oyingbo Market",
  "Alaba International Market",
  "Trade Fair Complex",
];

const steps = [
  { id: 1, title: "Details", icon: ShoppingBag },
  { id: 2, title: "Items", icon: Plus },
  { id: 3, title: "Location", icon: MapPin },
  { id: 4, title: "Payment", icon: CreditCard },
];

export default function CreateErrandPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<Array<{ name: string; quantity: string; maxBudget: number; confidence: number; category: string }>>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    market: "",
    address: "",
    estate: "",
    items: [{ name: "", quantity: "", brand: "", maxBudget: 0 }] as ShoppingItem[],
    reward: 0,
  });

  const updateFormData = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { name: "", quantity: "", brand: "", maxBudget: 0 }],
    }));
  };

  const removeItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const updateItem = (index: number, field: keyof ShoppingItem, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + (item.maxBudget || 0), 0);
  };

  const fetchSuggestions = async () => {
    if (!formData.title && !formData.market) return;
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          market: formData.market,
          existingItems: formData.items,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiSuggestions(data.suggestions || []);
        setAiMessage(data.message || "");
      }
    } catch {}
    setAiLoading(false);
  };

  const addSuggestion = (suggestion: { name: string; quantity: string; maxBudget: number }) => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { name: suggestion.name, quantity: suggestion.quantity, brand: "", maxBudget: suggestion.maxBudget }],
    }));
    setAiSuggestions((prev) => prev.filter((s) => s.name !== suggestion.name));
  };

  const addAllSuggestions = () => {
    const newItems = aiSuggestions.map((s) => ({
      name: s.name,
      quantity: s.quantity,
      brand: "",
      maxBudget: s.maxBudget,
    }));
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, ...newItems],
    }));
    setAiSuggestions([]);
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Please log in to post an errand");
      return;
    }

    setIsSubmitting(true);

    try {
      const totalAmount = calculateTotal() + formData.reward;
      const paymentRef = `MRN-${Date.now()}`;

      const errandRes = await fetch("/api/errands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          market: formData.market,
          items: formData.items,
          budget: calculateTotal(),
          reward: formData.reward,
          address: formData.address,
          estate: formData.estate,
          paymentRef,
        }),
      });

      if (!errandRes.ok) {
        const errData = await errandRes.json();
        toast.error(errData.error || "Failed to create errand");
        setIsSubmitting(false);
        return;
      }

      const response = await fetch("/api/monnify/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: totalAmount,
          paymentReference: paymentRef,
          customerName: user.name,
          customerEmail: user.email,
          description: `Fund errand: ${formData.title}`,
        }),
      });

      const data = await response.json();

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        toast.error("Payment initialization failed. Please try again.");
        setIsSubmitting(false);
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.title && formData.description && formData.market;
      case 2:
        return formData.items.length > 0 && formData.items.every((item) => item.name && item.maxBudget > 0);
      case 3:
        return formData.address && formData.estate;
      case 4:
        return formData.reward > 0;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl font-bold mb-2">Post an Errand</h1>
            <p className="text-muted-foreground">Tell us what you need and we&apos;ll match you with a trusted shopper.</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-8">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className="flex items-center gap-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      currentStep >= step.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}>
                      {currentStep > step.id ? <CheckCircle2 className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
                    </div>
                    <span className={`hidden sm:block text-sm font-medium ${currentStep >= step.id ? "text-foreground" : "text-muted-foreground"}`}>
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`hidden sm:block w-12 md:w-24 h-0.5 mx-2 ${currentStep > step.id ? "bg-primary" : "bg-border"}`} />
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Card className="border-border/50">
                <CardContent className="p-6 space-y-6">
                  <h2 className="text-xl font-semibold">Errand Details</h2>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Title *</Label>
                      <Input id="title" placeholder="e.g., Fresh tomatoes and peppers for weekend cooking" value={formData.title} onChange={(e) => updateFormData("title", e.target.value)} className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="description">Description *</Label>
                      <Textarea id="description" placeholder="Describe what you need in detail..." value={formData.description} onChange={(e) => updateFormData("description", e.target.value)} className="mt-1" rows={4} />
                    </div>
                    <div>
                      <Label>Market *</Label>
                      <Input
                        id="market"
                        placeholder="e.g., Balogun Market, or type any market name"
                        value={formData.market}
                        onChange={(e) => updateFormData("market", e.target.value)}
                        className="mt-1"
                        list="markets-list"
                      />
                      <datalist id="markets-list">
                        {popularMarkets.map((m) => (<option key={m} value={m} />))}
                      </datalist>
                      <p className="text-xs text-muted-foreground mt-1">Type any market name or select from popular markets</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Card className="border-border/50">
                <CardContent className="p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Shopping List</h2>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={fetchSuggestions} disabled={aiLoading || (!formData.title && !formData.market)}>
                        {aiLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                        AI Suggest
                      </Button>
                      <Button variant="outline" size="sm" onClick={addItem}><Plus className="w-4 h-4 mr-2" /> Add Item</Button>
                    </div>
                  </div>

                  {aiSuggestions.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-primary">AI Suggestions</span>
                        <span className="text-xs text-muted-foreground ml-auto">{aiMessage}</span>
                      </div>
                      <div className="space-y-2 mb-3">
                        {aiSuggestions.map((s) => (
                          <div key={s.name} className="flex items-center justify-between p-2 bg-card rounded-lg border border-border/50">
                            <div className="flex-1">
                              <span className="font-medium text-sm">{s.name}</span>
                              <span className="text-xs text-muted-foreground ml-2">{s.quantity}</span>
                              <span className="text-xs text-primary ml-2">~₦{s.maxBudget.toLocaleString()}</span>
                            </div>
                            <Button size="sm" variant="ghost" onClick={() => addSuggestion(s)} className="h-7 px-2">
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      <Button size="sm" onClick={addAllSuggestions} className="w-full bg-primary/10 text-primary hover:bg-primary/20">
                        <Plus className="w-4 h-4 mr-2" /> Add All Suggestions
                      </Button>
                    </motion.div>
                  )}
                  <div className="space-y-4">
                    {formData.items.map((item, index) => (
                      <div key={index} className="p-4 bg-muted/50 rounded-lg space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Item {index + 1}</span>
                          {formData.items.length > 1 && (
                            <Button variant="ghost" size="sm" onClick={() => removeItem(index)} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div><Label>Name *</Label><Input placeholder="e.g., Tomatoes" value={item.name} onChange={(e) => updateItem(index, "name", e.target.value)} className="mt-1" /></div>
                          <div><Label>Quantity *</Label><Input placeholder="e.g., 2kg" value={item.quantity} onChange={(e) => updateItem(index, "quantity", e.target.value)} className="mt-1" /></div>
                          <div><Label>Preferred Brand</Label><Input placeholder="e.g., Dangote" value={item.brand} onChange={(e) => updateItem(index, "brand", e.target.value)} className="mt-1" /></div>
                          <div><Label>Max Budget (₦) *</Label><Input type="number" placeholder="0" value={item.maxBudget || ""} onChange={(e) => updateItem(index, "maxBudget", parseInt(e.target.value) || 0)} className="mt-1" /></div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 bg-primary/5 rounded-lg">
                    <div className="flex justify-between text-lg">
                      <span className="font-semibold">Total Budget</span>
                      <span className="font-bold text-primary">₦{calculateTotal().toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Card className="border-border/50">
                <CardContent className="p-6 space-y-6">
                  <h2 className="text-xl font-semibold">Delivery Location</h2>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="address">Delivery Address *</Label>
                      <Input id="address" placeholder="e.g., 12 Admiralty Way, Lekki Phase 1" value={formData.address} onChange={(e) => updateFormData("address", e.target.value)} className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="estate">Estate / Community *</Label>
                      <Input id="estate" placeholder="e.g., Lekki Gardens Phase 3" value={formData.estate} onChange={(e) => updateFormData("estate", e.target.value)} className="mt-1" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {currentStep === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Card className="border-border/50">
                <CardContent className="p-6 space-y-6">
                  <h2 className="text-xl font-semibold">Set Your Reward</h2>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="reward">Shopper Reward (₦) *</Label>
                      <Input id="reward" type="number" placeholder="1500" value={formData.reward || ""} onChange={(e) => updateFormData("reward", parseInt(e.target.value) || 0)} className="mt-1" />
                      <p className="text-sm text-muted-foreground mt-2">This is the amount the shopper will earn for completing your errand.</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-4">
                    <h3 className="font-semibold">Order Summary</h3>
                    <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Shopping Items ({formData.items.length})</span>
                        <span className="font-medium">₦{calculateTotal().toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Shopper Reward</span>
                        <span className="font-medium text-primary">₦{formData.reward.toLocaleString()}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-lg">
                        <span className="font-semibold">Total to Fund</span>
                        <span className="font-bold">₦{(calculateTotal() + formData.reward).toLocaleString()}</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">Payment is secured via Monnify escrow. Your money is held safely until you confirm delivery.</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between mt-6">
          <Button variant="outline" onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))} disabled={currentStep === 1}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          {currentStep < 4 ? (
            <Button onClick={() => setCurrentStep((prev) => prev + 1)} disabled={!canProceed()}>
              Next <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={!canProceed() || isSubmitting} className="bg-primary hover:bg-primary/90">
              {isSubmitting ? (
                <><div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" /> Processing...</>
              ) : (
                <><CreditCard className="w-4 h-4 mr-2" /> Fund & Post Errand</>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
