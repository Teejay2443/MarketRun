"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  X,
  Send,
  Sparkles,
  ShoppingBag,
  Loader2,
  Plus,
  Check,
  MessageCircle,
  Trash2,
} from "lucide-react";

interface SuggestedItem {
  name: string;
  quantity: string;
  maxBudget: number;
  category: string;
  note: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  items?: SuggestedItem[];
  totalEstimate?: number;
  marketTip?: string;
}

interface AIChatProps {
  open: boolean;
  onClose: () => void;
}

export function AIChat({ open, onClose }: AIChatProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Hi! I'm your MarketRun AI shopping assistant. Tell me what you need and I'll suggest items with current prices. For example:\n\n- \"What can I get for a birthday party?\"\n- \"I need items for weekend cooking\"\n- \"Help me shop for baby items\"",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState<SuggestedItem[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const history = messages.map((msg) => ({
        role: msg.role === "assistant" ? "model" : "user",
        content: msg.content,
      }));

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, history }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.response,
            items: data.items,
            totalEstimate: data.totalEstimate,
            marketTip: data.marketTip,
          },
        ]);
      } else {
        const errData = await res.json().catch(() => ({}));
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: errData.error || "Sorry, I had trouble processing that. Please try again." },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Something went wrong. Please try again." },
      ]);
    }
    setLoading(false);
  };

  const toggleItem = (item: SuggestedItem) => {
    setSelectedItems((prev) => {
      const exists = prev.find((i) => i.name === item.name);
      if (exists) {
        return prev.filter((i) => i.name !== item.name);
      }
      return [...prev, item];
    });
  };

  const addAllItems = (items: SuggestedItem[]) => {
    setSelectedItems((prev) => {
      const newItems = items.filter((item) => !prev.find((i) => i.name === item.name));
      return [...prev, ...newItems];
    });
    toast.success(`Added ${items.length} items to your list`);
  };

  const proceedToErrand = () => {
    if (selectedItems.length === 0) {
      toast.error("Please select at least one item");
      return;
    }

    // Generate a title from the selected items
    const itemNames = selectedItems.map((i) => i.name);
    const autoTitle = itemNames.length <= 3
      ? `Buy ${itemNames.join(", ")}`
      : `Buy ${itemNames.slice(0, 3).join(", ")} and ${itemNames.length - 3} more items`;

    const autoDescription = selectedItems
      .map((i) => `${i.name} - ${i.quantity}${i.note ? ` (${i.note})` : ""}`)
      .join("\n");

    const totalEstimate = selectedItems.reduce((sum, i) => sum + (i.maxBudget || 0), 0);

    // Store selected items + auto-filled details for the create page
    sessionStorage.setItem(
      "ai-selected-items",
      JSON.stringify({
        items: selectedItems,
        title: autoTitle,
        description: autoDescription,
        market: selectedItems[0]?.category || "",
        budget: totalEstimate,
      })
    );

    router.push("/create?ai=true&from=chat");
    onClose();
  };

  const clearChat = () => {
    setMessages([
      {
        role: "assistant",
        content: "Hi! I'm your MarketRun AI shopping assistant. Tell me what you need and I'll suggest items with current prices.",
      },
    ]);
    setSelectedItems([]);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-card rounded-2xl w-full max-w-lg h-[90dvh] sm:h-[85vh] flex flex-col border border-border/50 shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/50 bg-primary/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold">AI Shopping Assistant</h2>
                  <p className="text-xs text-muted-foreground">Powered by Gemini</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={clearChat}>
                  <Trash2 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, index) => (
                <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] ${msg.role === "user" ? "" : "space-y-2"}`}>
                    {msg.role === "assistant" && (
                      <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="w-3 h-3 text-primary" />
                        <span className="text-xs font-medium text-primary">MarketRun AI</span>
                      </div>
                    )}
                    <div
                      className={`rounded-2xl px-4 py-3 ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>

                    {/* Items suggested */}
                    {msg.items && msg.items.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-muted-foreground">
                            Suggested Items (₦{msg.totalEstimate?.toLocaleString()} est.)
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 text-xs"
                            onClick={() => addAllItems(msg.items!)}
                          >
                            <Plus className="w-3 h-3 mr-1" /> Add All
                          </Button>
                        </div>
                        {msg.items.map((item, itemIndex) => {
                          const isSelected = selectedItems.some((i) => i.name === item.name);
                          return (
                            <button
                              key={itemIndex}
                              onClick={() => toggleItem(item)}
                              className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                                isSelected
                                  ? "bg-primary/10 border-primary/30"
                                  : "bg-card border-border/50 hover:border-primary/20"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                    isSelected
                                      ? "bg-primary text-primary-foreground"
                                      : "bg-muted"
                                  }`}
                                >
                                  {isSelected && <Check className="w-3 h-3" />}
                                </div>
                                <div className="text-left">
                                  <p className="font-medium text-sm">{item.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {item.quantity}
                                    {item.note && ` · ${item.note}`}
                                  </p>
                                </div>
                              </div>
                              <p className="font-medium text-sm text-primary">
                                ₦{item.maxBudget.toLocaleString()}
                              </p>
                            </button>
                          );
                        })}
                        {msg.marketTip && (
                          <p className="text-xs text-muted-foreground italic">
                            💡 {msg.marketTip}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      <span className="text-sm text-muted-foreground">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Selected Items Summary */}
            {selectedItems.length > 0 && (
              <div className="px-4 py-3 border-t border-border/50 bg-primary/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">
                    {selectedItems.length} item{selectedItems.length > 1 ? "s" : ""} selected
                  </span>
                  <span className="text-sm font-bold text-primary">
                    ₦{selectedItems.reduce((sum, item) => sum + item.maxBudget, 0).toLocaleString()}
                  </span>
                </div>
                <Button
                  className="w-full bg-primary hover:bg-primary/90"
                  onClick={proceedToErrand}
                >
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Continue to Post Errand
                </Button>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-border/50">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="What do you need to shop for?"
                  disabled={loading}
                  className="flex-1"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!input.trim() || loading}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
