"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  User,
  MapPin,
  Star,
  Wallet,
  CreditCard,
  Copy,
  CheckCircle2,
  Shield,
  Building2,
  Loader2,
  Sparkles,
  History,
  Briefcase,
  ShoppingBag,
} from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "account" | "activity">("overview");

  const handleCreateAccount = async () => {
    setCreatingAccount(true);
    try {
      const res = await fetch("/api/reserved-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ bvn: "22222222222" }),
      });
      const data = await res.json();
      if (res.ok && data.accountNumber) {
        toast.success("Virtual account created!");
        refreshUser();
      } else {
        toast.error(data.error || "Failed to create account");
      }
    } catch {
      toast.error("Something went wrong");
    }
    setCreatingAccount(false);
  };

  const copyAccountNumber = () => {
    if (user?.reservedAccountNumber) {
      navigator.clipboard.writeText(user.reservedAccountNumber);
      setCopied(true);
      toast.success("Account number copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Please log in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">{user.name.charAt(0)}</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold">{user.name}</h1>
                <p className="text-muted-foreground">{user.email}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-2 mb-8 overflow-x-auto">
          {[
            { key: "overview", label: "Overview", icon: User },
            { key: "account", label: "Virtual Account", icon: CreditCard },
            { key: "activity", label: "Activity", icon: History },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-border/50">
                <CardContent className="p-6">
                  <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" /> Personal Info
                  </h2>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name</span>
                      <span className="font-medium">{user.name}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email</span>
                      <span className="font-medium">{user.email}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Location</span>
                      <span className="font-medium flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {user.estate || "Not set"}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Role</span>
                      <Badge variant="secondary" className="capitalize">{user.role}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardContent className="p-6">
                  <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-primary" /> Wallet
                  </h2>
                  <div className="space-y-4">
                    <div className="p-4 bg-primary/5 rounded-xl">
                      <p className="text-sm text-muted-foreground mb-1">Available Balance</p>
                      <p className="text-3xl font-bold text-primary">₦{(user.walletBalance || 0).toLocaleString()}</p>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Earned</span>
                      <span className="font-medium text-primary">₦{(user.totalEarned || 0).toLocaleString()}</span>
                    </div>
                    <Separator />
                    <Link href="/dashboard">
                      <Button className="w-full" variant="outline">
                        <Wallet className="w-4 h-4 mr-2" /> Go to Wallet
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardContent className="p-6">
                  <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Star className="w-5 h-5 text-secondary" /> Reputation
                  </h2>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-6 h-6 ${s <= Math.round(user.rating || 0) ? "fill-secondary text-secondary" : "text-muted-foreground"}`}
                          />
                        ))}
                      </div>
                      <span className="text-2xl font-bold">{user.rating || 0}</span>
                      <span className="text-muted-foreground">/ 5.0</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">KYC Status</span>
                      <Badge variant={user.kycStatus === "VERIFIED" ? "default" : "secondary"}>
                        <Shield className="w-3 h-3 mr-1" />
                        {user.kycStatus || "UNVERIFIED"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardContent className="p-6">
                  <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-primary" /> Quick Stats
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-muted/50 rounded-xl text-center">
                      <ShoppingBag className="w-6 h-6 text-primary mx-auto mb-2" />
                      <p className="text-2xl font-bold">{user.role === "shopper" ? "Shopper" : "Requester"}</p>
                      <p className="text-xs text-muted-foreground">Current Role</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-xl text-center">
                      <Star className="w-6 h-6 text-secondary mx-auto mb-2" />
                      <p className="text-2xl font-bold">{user.rating || 0}</p>
                      <p className="text-xs text-muted-foreground">Rating</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}

        {activeTab === "account" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-border/50">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Your Virtual Account</h2>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    This is your personal bank account powered by Monnify. Share this account number with anyone who wants to send money to your wallet.
                  </p>
                </div>

                {user.reservedAccountNumber ? (
                  <div className="space-y-6">
                    <div className="p-6 bg-primary/5 border border-primary/20 rounded-2xl">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-2">Account Number</p>
                        <p className="text-4xl font-bold tracking-widest text-primary mb-2">{user.reservedAccountNumber}</p>
                        <p className="text-sm text-muted-foreground mb-4">{user.reservedAccountBank || "Moniepoint MFB"}</p>
                        <Button onClick={copyAccountNumber} className="bg-primary hover:bg-primary/90">
                          {copied ? (
                            <><CheckCircle2 className="w-4 h-4 mr-2" /> Copied!</>
                          ) : (
                            <><Copy className="w-4 h-4 mr-2" /> Copy Account Number</>
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="p-4 bg-muted/50 rounded-xl">
                      <h3 className="font-semibold mb-2 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" /> How to Fund Your Wallet
                      </h3>
                      <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                        <li>Copy your account number above</li>
                        <li>Open your banking app (OPay, PalmPay, GTBank, etc.)</li>
                        <li>Transfer any amount to this account number</li>
                        <li>Your wallet balance updates automatically via Monnify webhook</li>
                      </ol>
                    </div>

                    <div className="p-4 bg-muted/50 rounded-xl">
                      <h3 className="font-semibold mb-2 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-primary" /> Account Details
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Bank Name</span>
                          <span className="font-medium">{user.reservedAccountBank || "Moniepoint MFB"}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Account Number</span>
                          <span className="font-medium">{user.reservedAccountNumber}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Account Name</span>
                          <span className="font-medium">MarketRun - {user.name}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">KYC Status</span>
                          <Badge variant={user.kycStatus === "VERIFIED" ? "default" : "secondary"}>
                            {user.kycStatus || "UNVERIFIED"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="p-8 border-2 border-dashed border-border rounded-2xl mb-6">
                      <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Virtual Account Yet</h3>
                      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                        Create a free virtual account to receive payments. This account is linked to your MarketRun wallet.
                      </p>
                      <Button onClick={handleCreateAccount} disabled={creatingAccount} size="lg" className="bg-primary hover:bg-primary/90">
                        {creatingAccount ? (
                          <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Creating Account...</>
                        ) : (
                          <><CreditCard className="w-5 h-5 mr-2" /> Create Virtual Account</>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeTab === "activity" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-border/50">
              <CardContent className="p-6">
                <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <History className="w-5 h-5 text-primary" /> Recent Activity
                </h2>
                <p className="text-muted-foreground mb-6">Your errand history and transactions.</p>
                <div className="text-center py-8">
                  <History className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">View your full activity on the <Link href="/dashboard" className="text-primary underline">Dashboard</Link>.</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
