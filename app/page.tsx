import Link from "next/link";
import { Scissors, Sparkles, BookOpen, ArrowRight, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-2 font-bold text-rose-600 text-lg">
          <Scissors className="h-5 w-5" />
          CrochetAI
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/generate">Get started</Link>
        </Button>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center text-center px-6 py-20 max-w-3xl mx-auto">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100">
          <Scissors className="h-8 w-8 text-rose-500" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-4">
          Turn any idea into a{" "}
          <span className="text-rose-500">crochet pattern</span>
        </h1>
        <p className="text-lg text-gray-500 mb-8 max-w-xl">
          Describe what you want to make, or upload a photo — and get a
          complete, row-by-row crochet pattern in seconds.
        </p>
        <Button asChild size="lg">
          <Link href="/generate" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Generate your first pattern
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </section>

      {/* Features */}
      <section className="max-w-4xl mx-auto px-6 py-12 grid md:grid-cols-3 gap-6">
        {[
          {
            icon: <Sparkles className="h-5 w-5 text-rose-500" />,
            title: "Text to pattern",
            desc: "Just describe what you want to make in plain language and get a complete pattern.",
          },
          {
            icon: <ImageIcon className="h-5 w-5 text-rose-500" />,
            title: "Photo to pattern",
            desc: "Upload a photo of anything — our AI analyzes it and writes a pattern to recreate it.",
          },
          {
            icon: <BookOpen className="h-5 w-5 text-rose-500" />,
            title: "Save & revisit",
            desc: "Your patterns are saved to your library so you can come back to them any time.",
          },
        ].map(({ icon, title, desc }) => (
          <div
            key={title}
            className="rounded-2xl bg-white border border-rose-100 p-6 shadow-sm"
          >
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50">
              {icon}
            </div>
            <h3 className="font-semibold text-gray-800 mb-1">{title}</h3>
            <p className="text-sm text-gray-500">{desc}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
