"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  ShoppingBag,
  Plus,
  Clock,
  CheckCircle2,
  TrendingUp,
  Star,
  ArrowRight,
  MapPin,
  Loader2,
  Search,
  Check,
  Wallet,
  Banknote,
  CreditCard,
  Briefcase,
  LayoutDashboard,
  Shield,
  FileText,
  Building2,
  Copy,
  ExternalLink,
  AlertCircle,
  RefreshCw,
  LogOut,
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
  requesterId: string;
  shopperId: string | null;
  requester: { id: string; name: string; estate: string | null; rating: number };
  shopper: { id: string; name: string; estate: string | null; rating: number } | null;
}

interface Transaction {
  id: string;
  amount: number;
  platformFee: number;
  shopperPayout: number;
  status: string;
  createdAt: string;
  errand: { id: string; title: string; market: string; createdAt: string };
}

interface WalletData {
  walletBalance: number;
  totalEarned: number;
  completedJobs: number;
  pendingPayout: number;
  transactions: Transaction[];
}

const statusColors: Record<string, string> = {
  OPEN: "bg-accent text-accent-foreground",
  ACCEPTED: "bg-secondary text-secondary-foreground",
  FUNDED: "bg-primary text-primary-foreground",
  SHOPPING: "bg-blue-500 text-white",
  DELIVERED: "bg-purple-500 text-white",
  COMPLETED: "bg-muted text-muted-foreground",
};

function formatTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
  return `${Math.floor(diffInMinutes / 1440)}d ago`;
}

const sidebarItems = [
  { key: "requester", label: "My Errands", icon: ShoppingBag },
  { key: "shopper", label: "My Jobs", icon: Briefcase },
  { key: "browse", label: "Find Errands", icon: Search },
  { key: "wallet", label: "Wallet", icon: Wallet },
  { key: "monnify", label: "Payment Infrastructure", icon: CreditCard },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("requester");
  const [myErrands, setMyErrands] = useState<Errand[]>([]);
  const [myJobs, setMyJobs] = useState<Errand[]>([]);
  const [openErrands, setOpenErrands] = useState<Errand[]>([]);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMarket, setSelectedMarket] = useState("all");
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState(0);
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);

  // Monnify features state
  const [reservedAccount, setReservedAccount] = useState<{ accountNumber?: string; bankName?: string; kycStatus?: string } | null>(null);
  const [bvnInput, setBvnInput] = useState("");
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [verifyingKyc, setVerifyingKyc] = useState(false);
  const [selectedErrandForInvoice, setSelectedErrandForInvoice] = useState<string>("");
  const [invoiceData, setInvoiceData] = useState<{ url?: string; id?: string } | null>(null);
  const [creatingInvoice, setCreatingInvoice] = useState(false);
  const [splitData, setSplitData] = useState<{ platformFee?: number; shopperPayout?: number } | null>(null);
  const [auditLogs, setAuditLogs] = useState<Array<{ id: string; action: string; entityType: string; createdAt: string; details?: string }>>([]);

  // Pagination state for Find Errands
  const [browsePage, setBrowsePage] = useState(1);
  const [browseTotalPages, setBrowseTotalPages] = useState(1);
  const [browseTotal, setBrowseTotal] = useState(0);
  const [loadingBrowse, setLoadingBrowse] = useState(false);

  useEffect(() => {
    if (user) fetchAll();
  }, [user]);

  useEffect(() => {
    if (activeTab === "browse") {
      fetchBrowseErrands(browsePage, searchQuery, selectedMarket);
    }
  }, [activeTab, browsePage]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const opts: RequestInit = { credentials: "include" };
      const [errandsRes, jobsRes, walletRes] = await Promise.all([
        fetch("/api/errands?mine=requester", opts),
        fetch("/api/errands?mine=shopper", opts),
        fetch("/api/wallet", opts),
      ]);
      const errandsData = await errandsRes.json();
      const jobsData = await jobsRes.json();
      const walletData = await walletRes.json();
      setMyErrands(errandsData.errands || (Array.isArray(errandsData) ? errandsData : []));
      setMyJobs(jobsData.errands || (Array.isArray(jobsData) ? jobsData : []));
      if (walletData.walletBalance !== undefined) setWallet(walletData);
    } catch {
      toast.error("Failed to load dashboard data");
    }
    setLoading(false);
  };

  const fetchBrowseErrands = async (page: number, search?: string, market?: string) => {
    setLoadingBrowse(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "12" });
      if (search) params.set("search", search);
      if (market && market !== "all") params.set("market", market);
      const res = await fetch(`/api/errands?${params.toString()}`, { credentials: "include" });
      const data = await res.json();
      setOpenErrands(data.errands || []);
      setBrowseTotalPages(data.pagination?.totalPages || 1);
      setBrowseTotal(data.pagination?.total || 0);
    } catch {
      toast.error("Failed to load errands");
    }
    setLoadingBrowse(false);
  };

  const handleAccept = async (errandId: string) => {
    if (!user) return;
    setAcceptingId(errandId);
    try {
      const res = await fetch(`/api/errands/${errandId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ shopperId: user.id }),
      });
      if (res.ok) {
        toast.success("Errand accepted! Start shopping when ready.");
        fetchAll();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to accept");
      }
    } catch {
      toast.error("Something went wrong");
    }
    setAcceptingId(null);
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || !bankName || !accountNumber || !accountName) {
      toast.error("Please fill in all fields");
      return;
    }
    if (withdrawAmount > (wallet?.walletBalance || 0)) {
      toast.error("Insufficient balance");
      return;
    }
    setWithdrawing(true);
    try {
      const res = await fetch("/api/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ amount: withdrawAmount, bankName, accountNumber, accountName }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setShowWithdraw(false);
        setWithdrawAmount(0);
        setBankName("");
        setAccountNumber("");
        setAccountName("");
        fetchAll();
      } else {
        toast.error(data.error || "Withdrawal failed");
      }
    } catch {
      toast.error("Something went wrong");
    }
    setWithdrawing(false);
  };

  // ============================================================
  // MONNIFY FEATURES
  // ============================================================

  const fetchMonnifyData = async () => {
    try {
      const opts: RequestInit = { credentials: "include" };
      const [reservedRes, auditRes] = await Promise.all([
        fetch("/api/reserved-account", opts),
        fetch("/api/audit?limit=20", opts),
      ]);
      if (reservedRes.ok) setReservedAccount(await reservedRes.json());
      if (auditRes.ok) setAuditLogs(await auditRes.json());
    } catch { /* ignore */ }
  };

  const handleCreateReservedAccount = async () => {
    if (!bvnInput || bvnInput.length !== 11) {
      toast.error("Please enter a valid 11-digit BVN");
      return;
    }
    setCreatingAccount(true);
    try {
      const res = await fetch("/api/reserved-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ bvn: bvnInput }),
      });
      const data = await res.json();
      if (res.ok) {
        setReservedAccount(data);
        setBvnInput("");
        toast.success("Reserved account created! You now have a personal bank account number.");
      } else {
        toast.error(data.error || "Failed to create account");
      }
    } catch {
      toast.error("Something went wrong");
    }
    setCreatingAccount(false);
  };

  const handleVerifyKyc = async () => {
    if (!bvnInput || bvnInput.length !== 11) {
      toast.error("Please enter a valid 11-digit BVN");
      return;
    }
    setVerifyingKyc(true);
    try {
      const res = await fetch("/api/kyc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ bvn: bvnInput }),
      });
      const data = await res.json();
      if (data.verified) {
        toast.success(`KYC verified! Name: ${data.fullName || "Confirmed"}`);
        fetchMonnifyData();
      } else {
        toast.error(data.message || "Verification failed");
      }
    } catch {
      toast.error("Verification failed");
    }
    setVerifyingKyc(false);
  };

  const handleCreateInvoice = async () => {
    if (!selectedErrandForInvoice) {
      toast.error("Please select an errand");
      return;
    }
    setCreatingInvoice(true);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ errandId: selectedErrandForInvoice }),
      });
      const data = await res.json();
      if (res.ok) {
        setInvoiceData(data.invoice);
        toast.success("Invoice created!");
      } else {
        toast.error(data.error || "Failed to create invoice");
      }
    } catch {
      toast.error("Something went wrong");
    }
    setCreatingInvoice(false);
  };

  const fetchSplitData = async (errandId: string) => {
    try {
      const res = await fetch(`/api/split?errandId=${errandId}`, { credentials: "include" });
      const data = await res.json();
      setSplitData(data);
    } catch { /* ignore */ }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  useEffect(() => {
    if (user && activeTab === "monnify") fetchMonnifyData();
  }, [user, activeTab]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setBrowsePage(1);
    fetchBrowseErrands(1, value, selectedMarket);
  };

  const handleMarketChange = (value: string) => {
    setSelectedMarket(value);
    setBrowsePage(1);
    fetchBrowseErrands(1, searchQuery, value);
  };

  const tabCounts: Record<string, number> = {
    requester: myErrands.length,
    shopper: myJobs.length,
    browse: browseTotal,
    wallet: wallet?.transactions.length || 0,
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Please log in</h1>
          <p className="text-muted-foreground mb-4">Log in to view your dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-card border-r border-border/50 sticky top-0 h-screen">
          <div className="p-6 border-b border-border/50">
            <div>
              <p className="font-semibold text-sm truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {sidebarItems.map((item) => {
              const isActive = activeTab === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setActiveTab(item.key)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {tabCounts[item.key] > 0 && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${isActive ? "bg-primary-foreground/20" : "bg-muted"}`}>
                      {tabCounts[item.key]}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="p-4 border-t border-border/50 space-y-2">
            <Link href="/create">
              <Button className="w-full bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" /> Post Errand
              </Button>
            </Link>
            <Button variant="outline" className="w-full" onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); window.location.href = "/"; }}>
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-h-screen">
          {/* Mobile Header */}
          <div className="lg:hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-6 px-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold">Dashboard</h1>
                <p className="text-sm text-muted-foreground">Welcome, {user.name.split(" ")[0]}</p>
              </div>
              <Link href="/create">
                <Button size="sm" className="bg-primary hover:bg-primary/90"><Plus className="w-4 h-4 mr-1" /> Post</Button>
              </Link>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {sidebarItems.map((item) => {
                const isActive = activeTab === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => setActiveTab(item.key)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Desktop Header */}
          <div className="hidden lg:block bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-8 px-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-1">
                  {sidebarItems.find((i) => i.key === activeTab)?.label}
                </h1>
                <p className="text-muted-foreground">
                  {activeTab === "requester" && "Errands you've posted for your community."}
                  {activeTab === "shopper" && "Errands you've accepted as a shopper."}
                  {activeTab === "browse" && "Find open errands to earn money."}
                  {activeTab === "wallet" && "Your earnings and withdrawals."}
                  {activeTab === "monnify" && "Monnify payment infrastructure and platform tools."}
                </p>
              </div>
              <Link href="/create">
                <Button className="bg-primary hover:bg-primary/90"><Plus className="w-4 h-4 mr-2" /> Post Errand</Button>
              </Link>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 lg:p-8">
            {loading ? (
              <div className="text-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Loading...</p>
              </div>
            ) : (
              <>
                {/* My Errands */}
                {activeTab === "requester" && (
                  <div className="space-y-4">
                    {myErrands.length === 0 ? (
                      <EmptyState icon={ShoppingBag} title="No errands yet" desc="Post your first errand to get started." actionLabel="Post Errand" actionHref="/create" />
                    ) : (
                      myErrands.map((errand, index) => (
                        <ErrandCard key={errand.id} errand={errand} index={index} role="requester" />
                      ))
                    )}
                  </div>
                )}

                {/* My Jobs */}
                {activeTab === "shopper" && (
                  <div className="space-y-4">
                    {myJobs.length === 0 ? (
                      <EmptyState icon={Briefcase} title="No jobs yet" desc="Find open errands to earn money as a shopper." actionLabel="Find Errands" onClick={() => setActiveTab("browse")} />
                    ) : (
                      myJobs.map((errand, index) => (
                        <ErrandCard key={errand.id} errand={errand} index={index} role="shopper" />
                      ))
                    )}
                  </div>
                )}

                {/* Find Errands */}
                {activeTab === "browse" && (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">Browse all errands across all markets. Help someone shop even if you're not in their area!</p>
                    <div className="flex flex-col md:flex-row gap-3 mb-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input placeholder="Search errands by title, description, or market..." value={searchQuery} onChange={(e) => handleSearchChange(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                      </div>
                      <select value={selectedMarket} onChange={(e) => handleMarketChange(e.target.value)} className="px-4 py-2.5 border border-border rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                        <option value="all">All Markets</option>
                        <option value="Balogun">Balogun Market</option>
                        <option value="Mile 12">Mile 12 Market</option>
                        <option value="Mile 3">Mile 3 Market</option>
                        <option value="Oshodi">Oshodi Market</option>
                        <option value="Alaba">Alaba Market</option>
                        <option value="Oyingbo">Oyingbo Market</option>
                      </select>
                    </div>
                    {loadingBrowse ? (
                      <div className="text-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                        <p className="text-muted-foreground">Loading errands...</p>
                      </div>
                    ) : openErrands.length === 0 ? (
                      <EmptyState icon={Search} title="No errands found" desc="Check back later or try a different search." />
                    ) : (
                      <>
                        <p className="text-xs text-muted-foreground">Showing {openErrands.length} of {browseTotal} errands</p>
                        {openErrands.filter((e: Errand) => e.requesterId !== user?.id).map((errand, index) => (
                          <motion.div key={errand.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
                            <Card className="border-border/50 card-hover">
                              <CardContent className="p-5">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                  <div className="flex items-start gap-4">
                                    <div className="w-11 h-11 bg-accent/10 rounded-xl flex items-center justify-center shrink-0">
                                      <ShoppingBag className="w-5 h-5 text-accent" />
                                    </div>
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <Link href={`/errands/${errand.id}`} className="font-semibold text-sm hover:text-primary transition-colors truncate">{errand.title}</Link>
                                        <Badge variant="secondary" className={`text-xs shrink-0 ${statusColors[errand.status]}`}>{errand.status}</Badge>
                                      </div>
                                      <p className="text-xs text-muted-foreground line-clamp-1">{errand.description}</p>
                                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{errand.market}</span>
                                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatTimeAgo(errand.createdAt)}</span>
                                        {errand.estate && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{errand.estate}</span>}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4 sm:shrink-0">
                                    <div className="text-right">
                                      <p className="text-xs text-muted-foreground">Reward</p>
                                      <p className="font-bold text-primary">₦{errand.reward.toLocaleString()}</p>
                                    </div>
                                    {errand.status === "OPEN" && (
                                      <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={() => handleAccept(errand.id)} disabled={acceptingId === errand.id}>
                                        {acceptingId === errand.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4 mr-1" /> Accept</>}
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                        {/* Pagination */}
                        {browseTotalPages > 1 && (
                          <div className="flex items-center justify-center gap-2 pt-4">
                            <Button variant="outline" size="sm" onClick={() => { setBrowsePage(p => Math.max(1, p - 1)); }} disabled={browsePage === 1}>
                              Previous
                            </Button>
                            <span className="text-sm text-muted-foreground px-3">Page {browsePage} of {browseTotalPages}</span>
                            <Button variant="outline" size="sm" onClick={() => { setBrowsePage(p => Math.min(browseTotalPages, p + 1)); }} disabled={browsePage === browseTotalPages}>
                              Next
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Wallet */}
                {activeTab === "wallet" && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <Card className="border-border/50">
                        <CardContent className="p-5">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center">
                              <Wallet className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Balance</p>
                              <p className="text-2xl font-bold">₦{(wallet?.walletBalance || 0).toLocaleString()}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="border-border/50">
                        <CardContent className="p-5">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 bg-secondary/10 rounded-xl flex items-center justify-center">
                              <TrendingUp className="w-5 h-5 text-secondary" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Total Earned</p>
                              <p className="text-2xl font-bold">₦{(wallet?.totalEarned || 0).toLocaleString()}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="border-border/50">
                        <CardContent className="p-5">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 bg-accent/10 rounded-xl flex items-center justify-center">
                              <Clock className="w-5 h-5 text-accent" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Pending</p>
                              <p className="text-2xl font-bold">₦{(wallet?.pendingPayout || 0).toLocaleString()}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="flex justify-end">
                      <Button className="bg-primary hover:bg-primary/90" onClick={() => setShowWithdraw(true)} disabled={!wallet || wallet.walletBalance <= 0}>
                        <Banknote className="w-4 h-4 mr-2" /> Withdraw Funds
                      </Button>
                    </div>

                    <Card className="border-border/50">
                      <CardContent className="p-5">
                        <h3 className="font-semibold mb-4">Transaction History</h3>
                        {!wallet || wallet.transactions.length === 0 ? (
                          <div className="text-center py-8">
                            <CreditCard className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">No transactions yet. Complete errands to start earning!</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {wallet.transactions.map((tx) => (
                              <div key={tx.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 bg-accent/10 rounded-full flex items-center justify-center">
                                    <TrendingUp className="w-4 h-4 text-accent" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-sm">{tx.errand.title}</p>
                                    <p className="text-xs text-muted-foreground">{tx.errand.market} · {new Date(tx.createdAt).toLocaleDateString()}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold text-accent text-sm">+₦{tx.shopperPayout.toLocaleString()}</p>
                                  <p className="text-xs text-muted-foreground">Fee: ₦{tx.platformFee.toLocaleString()}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Monnify Features */}
                {activeTab === "monnify" && (
                  <div className="space-y-6">
                    {/* Reserved Account */}
                    <Card className="border-border/50">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold">Reserved Account</h3>
                            <p className="text-sm text-muted-foreground">Your personal bank account number for receiving payments</p>
                          </div>
                        </div>
                        {reservedAccount?.accountNumber ? (
                          <div className="bg-muted/50 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-muted-foreground">Account Number</span>
                              <Button variant="ghost" size="sm" onClick={() => copyToClipboard(reservedAccount.accountNumber!)}>
                                <Copy className="w-4 h-4" />
                              </Button>
                            </div>
                            <p className="text-2xl font-bold font-mono">{reservedAccount.accountNumber}</p>
                            <p className="text-sm text-muted-foreground mt-1">{reservedAccount.bankName || "Moniepoint MFB"}</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <Input placeholder="Enter your 11-digit BVN" value={bvnInput} onChange={(e) => setBvnInput(e.target.value)} maxLength={11} />
                            <div className="flex gap-2">
                              <Button onClick={handleCreateReservedAccount} disabled={creatingAccount} className="bg-primary hover:bg-primary/90">
                                {creatingAccount ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Building2 className="w-4 h-4 mr-2" />}
                                Create Account
                              </Button>
                              <Button variant="outline" onClick={handleVerifyKyc} disabled={verifyingKyc}>
                                {verifyingKyc ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Shield className="w-4 h-4 mr-2" />}
                                Verify KYC
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Invoice Generator */}
                    <Card className="border-border/50">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center">
                            <FileText className="w-5 h-5 text-secondary" />
                          </div>
                          <div>
                            <h3 className="font-semibold">Dynamic Invoice</h3>
                            <p className="text-sm text-muted-foreground">Generate a payment invoice for any errand</p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <select value={selectedErrandForInvoice} onChange={(e) => { setSelectedErrandForInvoice(e.target.value); if (e.target.value) fetchSplitData(e.target.value); }} className="w-full px-4 py-2.5 border border-border rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                            <option value="">Select an errand...</option>
                            {myErrands.map((e) => (<option key={e.id} value={e.id}>{e.title} (₦{(e.budget + e.reward).toLocaleString()})</option>))}
                          </select>
                          <Button onClick={handleCreateInvoice} disabled={creatingInvoice || !selectedErrandForInvoice} className="w-full bg-primary hover:bg-primary/90">
                            {creatingInvoice ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
                            Generate Invoice
                          </Button>
                          {invoiceData && (
                            <div className="bg-muted/50 rounded-lg p-4">
                              <p className="text-sm font-medium mb-2">Invoice Created!</p>
                              <div className="flex items-center gap-2">
                                <code className="text-xs bg-background px-2 py-1 rounded flex-1 truncate">{invoiceData.id}</code>
                                <Button variant="ghost" size="sm" onClick={() => window.open(invoiceData.url, "_blank")}>
                                  <ExternalLink className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Split Payment */}
                    <Card className="border-border/50">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center">
                            <CreditCard className="w-5 h-5 text-accent" />
                          </div>
                          <div>
                            <h3 className="font-semibold">Transaction Splitting</h3>
                            <p className="text-sm text-muted-foreground">Automatic 90/10 split at the payment level</p>
                          </div>
                        </div>
                        {splitData ? (
                          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                            <div className="flex justify-between"><span className="text-sm text-muted-foreground">Platform Fee (10%)</span><span className="font-medium">₦{(splitData.platformFee || 0).toLocaleString()}</span></div>
                            <div className="flex justify-between"><span className="text-sm text-muted-foreground">Shopper Payout (90%)</span><span className="font-medium text-primary">₦{(splitData.shopperPayout || 0).toLocaleString()}</span></div>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">Select an errand above to see the split calculation.</p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Audit Trail */}
                    <Card className="border-border/50">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                            <RefreshCw className="w-5 h-5 text-blue-500" />
                          </div>
                          <div>
                            <h3 className="font-semibold">Audit Trail</h3>
                            <p className="text-sm text-muted-foreground">Every event tracked for transparency</p>
                          </div>
                        </div>
                        {auditLogs.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">No audit logs yet. Events will appear here as you use the platform.</p>
                        ) : (
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {auditLogs.map((log) => (
                              <div key={log.id} className="flex items-center justify-between p-2 bg-muted/30 rounded text-sm">
                                <div>
                                  <span className="font-medium">{log.action}</span>
                                  <span className="text-muted-foreground ml-2">{log.entityType}</span>
                                </div>
                                <span className="text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Withdraw Modal */}
      {showWithdraw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowWithdraw(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card rounded-2xl p-8 w-full max-w-md border border-border/50 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-2">Withdraw Funds</h2>
            <p className="text-muted-foreground mb-6">Available: ₦{(wallet?.walletBalance || 0).toLocaleString()}</p>
            <div className="space-y-4">
              <div>
                <Label>Amount (₦)</Label>
                <Input type="number" placeholder="0" value={withdrawAmount || ""} onChange={(e) => setWithdrawAmount(parseInt(e.target.value) || 0)} className="mt-1" />
              </div>
              <div>
                <Label>Bank Name</Label>
                <Input placeholder="e.g., GTBank" value={bankName} onChange={(e) => setBankName(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Account Number</Label>
                <Input placeholder="0123456789" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Account Name</Label>
                <Input placeholder="Kemi Adebanjo" value={accountName} onChange={(e) => setAccountName(e.target.value)} className="mt-1" />
              </div>
              <Separator />
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowWithdraw(false)}>Cancel</Button>
                <Button className="flex-1 bg-primary hover:bg-primary/90" onClick={handleWithdraw} disabled={withdrawing}>
                  {withdrawing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Withdraw
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ icon: Icon, title, desc, actionLabel, actionHref, onClick }: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  actionLabel?: string;
  actionHref?: string;
  onClick?: () => void;
}) {
  return (
    <div className="text-center py-16">
      <Icon className="w-14 h-14 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4">{desc}</p>
      {actionLabel && actionHref && (
        <Link href={actionHref}><Button className="bg-primary hover:bg-primary/90">{actionLabel}</Button></Link>
      )}
      {actionLabel && onClick && (
        <Button className="bg-primary hover:bg-primary/90" onClick={onClick}>{actionLabel}</Button>
      )}
    </div>
  );
}

function ErrandCard({ errand, index, role }: { errand: Errand; index: number; role: "requester" | "shopper" }) {
  const items: ErrandItem[] = JSON.parse(errand.items);
  const bgColor = role === "requester" ? "bg-primary/10" : "bg-secondary/10";
  const iconColor = role === "requester" ? "text-primary" : "text-secondary";

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
      <Link href={`/errands/${errand.id}`}>
        <Card className="border-border/50 card-hover cursor-pointer">
          <CardContent className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className={`w-11 h-11 ${bgColor} rounded-xl flex items-center justify-center shrink-0`}>
                  <ShoppingBag className={`w-5 h-5 ${iconColor}`} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm truncate">{errand.title}</h3>
                    <Badge variant="secondary" className={`text-xs shrink-0 ${statusColors[errand.status]}`}>{errand.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">{errand.description}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{errand.market}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{items.length} items</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 sm:shrink-0">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">{role === "shopper" ? "Earning" : "Reward"}</p>
                  <p className="font-bold text-primary">₦{errand.reward.toLocaleString()}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground hidden sm:block" />
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
