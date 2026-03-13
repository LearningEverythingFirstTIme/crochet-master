"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, Copy, Printer, Check, Trash2 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/hooks/useAuth";
import { cn } from "@/lib/utils";
import type { Pattern } from "@/lib/types/pattern";

export default function PatternDetailPage() {
  const { patternId } = useParams<{ patternId: string }>();
  const router = useRouter();
  const { getIdToken } = useAuth();

  const [pattern, setPattern] = useState<Pattern | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchPattern = async () => {
      try {
        const token = await getIdToken();
        const res = await fetch(`/api/patterns/${patternId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          router.push("/patterns");
          return;
        }
        const data = await res.json();
        setPattern(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPattern();
  }, [patternId, getIdToken, router]);

  const handleCopy = async () => {
    const text = pattern?.pattern?.rawMarkdown ?? "";
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    if (!confirm("Delete this pattern? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const token = await getIdToken();
      await fetch(`/api/patterns/${patternId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      router.push("/patterns");
    } catch {
      setDeleting(false);
    }
  };

  const handlePrint = () => window.print();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 mx-auto w-full max-w-2xl px-4 py-8 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-rose-50 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!pattern) return null;

  const rawMarkdown = pattern.pattern?.rawMarkdown ?? "";

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <div className="flex-1 mx-auto w-full max-w-2xl px-4 py-8">
        {/* Top bar */}
        <div className="flex items-center gap-3 mb-6 print:hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/patterns")}
          >
            <ArrowLeft className="h-4 w-4" />
            My Patterns
          </Button>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {copied ? "Copied!" : "Copy"}
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-3.5 w-3.5" />
              Print
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
              className="text-red-500 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Title + badges */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {pattern.title}
          </h1>
          <div className="flex items-center gap-2 flex-wrap">
            {pattern.pattern?.difficultyLevel && (
              <Badge
                variant="difficulty"
                difficulty={pattern.pattern.difficultyLevel}
              >
                {pattern.pattern.difficultyLevel}
              </Badge>
            )}
            {pattern.pattern?.estimatedTime && (
              <Badge>{pattern.pattern.estimatedTime}</Badge>
            )}
            {pattern.pattern?.yarnWeight && (
              <Badge>{pattern.pattern.yarnWeight}</Badge>
            )}
          </div>
        </div>

        {/* Pattern content */}
        <div
          className={cn(
            "rounded-2xl border border-rose-100 bg-white shadow-sm px-6 py-5",
            "prose prose-sm max-w-none",
            "prose-headings:text-rose-800 prose-headings:font-semibold",
            "prose-h2:text-lg prose-h2:mt-6 prose-h2:mb-3 prose-h2:border-b prose-h2:border-rose-100 prose-h2:pb-1",
            "prose-h3:text-base prose-h3:mt-4 prose-h3:mb-2 prose-h3:text-rose-700",
            "prose-p:text-gray-700 prose-p:leading-relaxed",
            "prose-li:text-gray-700",
            "prose-strong:text-gray-800",
            "prose-code:bg-rose-50 prose-code:text-rose-700 prose-code:px-1 prose-code:rounded",
            "prose-table:text-sm",
            "prose-th:bg-rose-50 prose-th:text-rose-700"
          )}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {rawMarkdown}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
