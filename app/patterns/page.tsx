"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, BookOpen } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { PatternCard } from "@/components/patterns/PatternCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/hooks/useAuth";
import type { PatternSummary } from "@/lib/types/pattern";

export default function PatternsPage() {
  const { user, loading, isAnonymous, getIdToken } = useAuth();
  const [patterns, setPatterns] = useState<PatternSummary[]>([]);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading || isAnonymous || !user) return;

    const fetchPatterns = async () => {
      setFetching(true);
      try {
        const token = await getIdToken();
        const res = await fetch("/api/patterns", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch patterns");
        const data = await res.json();
        setPatterns(data.patterns);
      } catch (err) {
        setError("Could not load your patterns. Please try again.");
        console.error(err);
      } finally {
        setFetching(false);
      }
    };

    fetchPatterns();
  }, [user, loading, isAnonymous, getIdToken]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <div className="flex-1 mx-auto w-full max-w-3xl px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Patterns</h1>
            <p className="text-sm text-gray-500 mt-1">
              Your saved crochet patterns
            </p>
          </div>
          <Button asChild size="sm">
            <Link href="/generate">
              <Sparkles className="h-3.5 w-3.5" />
              New pattern
            </Link>
          </Button>
        </div>

        {loading || fetching ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-36 rounded-2xl bg-rose-50 animate-pulse"
              />
            ))}
          </div>
        ) : isAnonymous ? (
          <div className="text-center py-20 text-gray-500">
            <BookOpen className="h-10 w-10 mx-auto mb-3 text-rose-200" />
            <p className="font-medium">Sign in to view your saved patterns</p>
            <p className="text-sm mt-1">
              Your patterns are saved to your account.
            </p>
          </div>
        ) : error ? (
          <p className="text-red-500 text-sm">{error}</p>
        ) : patterns.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <BookOpen className="h-10 w-10 mx-auto mb-3 text-rose-200" />
            <p className="font-medium">No saved patterns yet</p>
            <p className="text-sm mt-1">
              Generate a pattern and save it to see it here.
            </p>
            <Button asChild className="mt-4">
              <Link href="/generate">Generate your first pattern</Link>
            </Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {patterns.map((p) => (
              <PatternCard key={p.id} pattern={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
