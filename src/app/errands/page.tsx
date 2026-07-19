"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Search,
  MapPin,
  Clock,
  Star,
  ShoppingBag,
  ArrowRight,
  Loader2,
  Check,
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

const statusColors: Record<string, string> = {
  OPEN: "bg-accent text-accent-foreground",
  ACCEPTED: "bg-secondary text-secondary-foreground",
  FUNDED: "bg-primary text-primary-foreground",
  SHOPPING: "bg-blue-500 text-white",
  DELIVERED: "bg-purple-500 text-white",
  COMPLETED: "bg-muted text-muted-foreground",
};

const statusLabels: Record<string, string> = {
  OPEN: "Active",
  ACCEPTED: "Accepted",
  FUNDED: "Funded",
  SHOPPING: "Shopping",
  DELIVERED: "Delivered",
  COMPLETED: "Completed",
};

function formatTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
  return `${Math.floor(diffInMinutes / 1440)}d ago`;
}

export default function ErrandsPage() {
  const { user } = useAuth();
  const [errands, setErrands] = useState<Errand[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMarket, setSelectedMarket] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchErrands(1);
  }, []);

  const fetchErrands = async (pageNum: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(pageNum), limit: "12" });
      const res = await fetch(`/api/errands?${params.toString()}`);
      const data = await res.json();
      setErrands(data.errands || (Array.isArray(data) ? data : []));
      setTotalPages(data.pagination?.totalPages || 1);
      setTotal(data.pagination?.total || 0);
    } catch {
      toast.error("Failed to load errands");
    }
    setLoading(false);
  };

  const handleAccept = async (errandId: string) => {
    if (!user) {
      toast.error("Please log in to accept errands");
      return;
    }
    setAcceptingId(errandId);
    try {
      const res = await fetch(`/api/errands/${errandId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ shopperId: user.id }),
      });
      if (res.ok) {
        toast.success("Errand accepted! Check your dashboard.");
        fetchErrands(page);
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to accept errand");
      }
    } catch {
      toast.error("Something went wrong");
    }
    setAcceptingId(null);
  };

  const handleSearch = () => {
    setPage(1);
    fetchErrands(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchErrands(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const filteredErrands = errands.filter((errand) => {
    const matchesSearch =
      errand.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      errand.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      errand.market.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMarket = selectedMarket === "all" || errand.market.includes(selectedMarket);
    const matchesStatus = selectedStatus === "all" || errand.status === selectedStatus;
    return matchesSearch && matchesMarket && matchesStatus;
  });

  const canAccept = (errand: Errand) => {
    return user && errand.status === "OPEN" && errand.requesterId !== user.id && !errand.shopperId;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Browse Errands</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Find errands from any community and help someone shop. You don&apos;t have to be in the same area!
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-col md:flex-row gap-4 max-w-4xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search by title, description, or market..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-10 h-12"
              />
            </div>
            <select
              value={selectedMarket}
              onChange={(e) => { setSelectedMarket(e.target.value); setPage(1); }}
              className="px-4 h-12 border border-border rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">All Markets</option>
              <option value="Balogun">Balogun Market</option>
              <option value="Mile 12">Mile 12 Market</option>
              <option value="Mile 3">Mile 3 Market</option>
              <option value="Oshodi">Oshodi Market</option>
              <option value="Alaba">Alaba Market</option>
              <option value="Oyingbo">Oyingbo Market</option>
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
              className="px-4 h-12 border border-border rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">All Status</option>
              <option value="OPEN">Active</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="FUNDED">Funded</option>
              <option value="SHOPPING">Shopping</option>
            </select>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-muted-foreground">
            <span className="font-semibold text-foreground">{total}</span> errands found
          </p>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading errands...</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredErrands.map((errand, index) => {
              const items: ErrandItem[] = JSON.parse(errand.items);
              return (
                <motion.div key={errand.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: index * 0.05 }}>
                  <Card className="h-full card-hover cursor-pointer border-border/50">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-2">
                          {errand.status === "OPEN" && <span className="w-2 h-2 bg-accent rounded-full status-pulse" />}
                          <Badge variant="secondary" className={statusColors[errand.status]}>{statusLabels[errand.status]}</Badge>
                        </div>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTimeAgo(errand.createdAt)}
                        </span>
                      </div>

                      <Link href={`/errands/${errand.id}`}>
                        <h3 className="font-semibold text-lg mb-2 line-clamp-2 hover:text-primary transition-colors">{errand.title}</h3>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{errand.description}</p>
                      </Link>

                      <div className="flex items-center gap-4 mb-4 text-sm">
                        <span className="flex items-center gap-1 text-muted-foreground"><MapPin className="w-4 h-4" />{errand.market}</span>
                        <span className="flex items-center gap-1 text-muted-foreground"><ShoppingBag className="w-4 h-4" />{items.length} items</span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg mb-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Budget</p>
                          <p className="font-semibold">₦{errand.budget.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Reward</p>
                          <p className="font-semibold text-primary">₦{errand.reward.toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-primary">{errand.requester.name.charAt(0)}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium">{errand.requester.name}</p>
                            <p className="text-xs text-muted-foreground">{errand.requester.estate}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          <Star className="w-4 h-4 fill-secondary text-secondary" />
                          <span className="font-medium">{errand.requester.rating}</span>
                        </div>
                      </div>

                      {canAccept(errand) ? (
                        <Button className="w-full bg-primary hover:bg-primary/90" onClick={() => handleAccept(errand.id)} disabled={acceptingId === errand.id}>
                          {acceptingId === errand.id ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Accepting...</>
                          ) : (
                            <><Check className="w-4 h-4 mr-2" /> Accept Errand</>
                          )}
                        </Button>
                      ) : (
                        <Link href={`/errands/${errand.id}`} className="block">
                          <Button className="w-full" variant="outline">
                            View Details <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </Link>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        {!loading && filteredErrands.length === 0 && (
          <div className="text-center py-16">
            <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No errands found</h3>
            <p className="text-muted-foreground">Try adjusting your filters or search query.</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-8">
            <Button variant="outline" onClick={() => handlePageChange(page - 1)} disabled={page === 1}>
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={page === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                    className={page === pageNum ? "bg-primary" : ""}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button variant="outline" onClick={() => handlePageChange(page + 1)} disabled={page === totalPages}>
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
