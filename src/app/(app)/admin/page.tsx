"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Shield, CheckCircle2, XCircle, Loader2, AlertTriangle,
  Eye, ChevronDown, ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface ModerationItem {
  id: string;
  listing_id: string;
  status: string;
  ai_score: number | null;
  ai_reason: string | null;
  human_notes: string | null;
  created_at: string;
  listing: {
    id: string;
    title: string;
    description: string;
    price: number;
    category: string;
    status: string;
    listing_images: { url_original: string }[];
  } | null;
}

export default function AdminPage() {
  const { locale } = useAppStore();
  const supabase = createClient();

  const [items, setItems] = useState<ModerationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  useEffect(() => {
    async function load() {
      let q = supabase
        .from("moderation_logs")
        .select("*, listing:listings(id, title, description, price, category, status, listing_images(url_original))")
        .order("created_at", { ascending: false })
        .limit(100);

      if (filter !== "all") {
        q = q.eq("status", filter);
      }

      const { data } = await q;
      setItems((data as unknown as ModerationItem[]) ?? []);
      setLoading(false);
    }
    load();
  }, [filter, supabase]);

  async function handleModerate(itemId: string, listingId: string, action: "approved" | "rejected") {
    const updateData: Record<string, unknown> = {
      status: action,
      reviewed_at: new Date().toISOString(),
      human_notes: action === "rejected" ? "Manually rejected by admin" : "Manually approved by admin",
    };
    const { error } = await supabase
      .from("moderation_logs")
      .update(updateData as never)
      .eq("id", itemId);

    if (error) {
      toast.error("Failed to update");
      return;
    }

    // Update listing status
    const listingStatus = action === "approved" ? "active" : "rejected";
    await supabase
      .from("listings")
      .update({ status: listingStatus } as never)
      .eq("id", listingId);

    setItems(prev =>
      prev.map(i => i.id === itemId ? { ...i, status: action } : i)
    );

    toast.success(action === "approved"
      ? (locale === "ru" ? "Одобрено" : "Approved")
      : (locale === "ru" ? "Отклонено" : "Rejected")
    );
  }

  const stats = {
    total: items.length,
    pending: items.filter(i => i.status === "pending").length,
    approved: items.filter(i => i.status === "approved").length,
    rejected: items.filter(i => i.status === "rejected").length,
  };

  return (
    <div className="px-4 py-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold flex items-center gap-2">
          <Shield className="h-5 w-5" />
          {locale === "ru" ? "Модерация" : "Moderation"}
        </h1>
        <Badge variant="secondary" className="text-xs">
          {stats.pending} {locale === "ru" ? "ожидают" : "pending"}
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { key: "all" as const, label: locale === "ru" ? "Все" : "All", val: stats.total, color: "text-foreground" },
          { key: "pending" as const, label: locale === "ru" ? "В ожидании" : "Pending", val: stats.pending, color: "text-yellow-400" },
          { key: "approved" as const, label: locale === "ru" ? "Одобрено" : "OK", val: stats.approved, color: "text-emerald-400" },
          { key: "rejected" as const, label: locale === "ru" ? "Отклонено" : "No", val: stats.rejected, color: "text-rose-400" },
        ].map(s => (
          <button key={s.key} onClick={() => setFilter(s.key)}
            className={`rounded-xl p-2.5 text-center transition-all ${
              filter === s.key ? "dark:bg-white/10 bg-black/10 border dark:border-white/10 border-black/10" : "dark:bg-white/5 bg-black/5"}`}>
            <p className={`text-lg font-bold ${s.color}`}>{s.val}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </button>
        ))}
      </div>

      {/* Items */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <Shield className="h-12 w-12 mx-auto mb-3 text-muted-foreground/20" />
          <p className="text-sm text-muted-foreground">{locale === "ru" ? "Нет записей" : "No records"}</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {items.map(item => (
              <motion.div key={item.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border dark:border-white/5 border-black/5 overflow-hidden">
                <button onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                  className="w-full flex items-center gap-3 p-3 text-left">
                  {item.listing?.listing_images?.[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.listing.listing_images[0].url_original} alt=""
                      className="w-12 h-12 rounded-lg object-cover" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{item.listing?.title || "?"}</p>
                    <p className="text-xs text-muted-foreground">₽{item.listing?.price?.toLocaleString() || "0"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`text-[10px] ${
                      item.status === "approved" ? "bg-emerald-500/20 text-emerald-400"
                        : item.status === "rejected" ? "bg-rose-500/20 text-rose-400"
                        : "bg-yellow-500/20 text-yellow-400"
                    }`}>
                      {item.status}
                    </Badge>
                    {expanded === item.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>

                {expanded === item.id && (
                  <motion.div initial={{ height: 0 }} animate={{ height: "auto" }}
                    className="border-t dark:border-white/5 border-black/5 p-3 space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="dark:bg-white/5 bg-black/5 rounded-lg p-2">
                        <span className="text-muted-foreground">AI Score:</span>
                        <span className="ml-1 font-bold">{item.ai_score?.toFixed(2) ?? "N/A"}</span>
                      </div>
                      <div className="dark:bg-white/5 bg-black/5 rounded-lg p-2">
                        <span className="text-muted-foreground">Category:</span>
                        <span className="ml-1 font-bold">{item.listing?.category}</span>
                      </div>
                    </div>

                    {item.ai_reason && (
                      <div className="flex items-start gap-2 text-xs p-2 rounded-lg dark:bg-white/5 bg-black/5">
                        <AlertTriangle className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{item.ai_reason}</span>
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground leading-relaxed">{item.listing?.description}</p>

                    {item.status === "pending" || item.status === "approved" ? (
                      <div className="flex gap-2">
                        {item.status === "pending" && (
                          <Button onClick={() => handleModerate(item.id, item.listing!.id, "approved")}
                            className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white">
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            {locale === "ru" ? "Одобрить" : "Approve"}
                          </Button>
                        )}
                        <Button variant="destructive" onClick={() => handleModerate(item.id, item.listing!.id, "rejected")}
                          className="flex-1 rounded-xl">
                          <XCircle className="h-4 w-4 mr-1" />
                          {locale === "ru" ? "Отклонить" : "Reject"}
                        </Button>
                        <Button variant="outline" size="icon" className="rounded-xl"
                          onClick={() => window.open(`/marketplace/${item.listing!.id}`, "_blank")}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : null}
                  </motion.div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
