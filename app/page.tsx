import Link from "next/link";
import {
  Scissors,
  Sparkles,
  BookOpen,
  ArrowRight,
  ImageIcon,
  Wand2,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export default function HomePage() {
  return (
    <main
      className="flex min-h-screen flex-col"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >

      {/* ════════════════════════════════
          Nav
      ════════════════════════════════ */}
      <nav
        className="
          sticky top-0 z-40 w-full
          border-b border-[var(--border)]
          bg-[var(--bg-card)]/90 backdrop-blur-md
        "
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
          <div className="flex items-center gap-2 font-bold text-[var(--primary)]">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--primary)] shadow-sm">
              <Scissors className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm tracking-wide">CrochetAI</span>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild variant="outline" size="sm">
              <Link href="/generate">Get started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* ════════════════════════════════
          Hero
      ════════════════════════════════ */}
      <section className="relative overflow-hidden">
        {/* Decorative dot grid background */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "radial-gradient(circle, var(--text) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        {/* Soft radial glow behind hero text */}
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/4 rounded-full opacity-[0.12] blur-3xl"
          style={{ backgroundColor: "var(--primary)" }}
        />

        <div className="relative mx-auto flex max-w-4xl flex-col items-center px-5 pb-20 pt-24 text-center">
          {/* Pill badge */}
          <div
            className="
              mb-6 inline-flex items-center gap-2 rounded-full
              border border-[var(--border)] bg-[var(--bg-card)]
              px-4 py-1.5 text-xs font-medium
              text-[var(--text-muted)] shadow-sm
            "
          >
            <Sparkles className="h-3 w-3 text-[var(--primary)]" />
            AI-powered crochet pattern generation
          </div>

          {/* Headline — Playfair Display */}
          <h1
            className="mb-6 text-5xl font-bold leading-[1.1] tracking-tight md:text-6xl lg:text-7xl"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            Turn any idea into a{" "}
            <span
              className="relative inline-block"
              style={{ color: "var(--primary)" }}
            >
              crochet pattern
              {/* Underline squiggle */}
              <svg
                className="absolute -bottom-2 left-0 w-full"
                viewBox="0 0 200 8"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="none"
                aria-hidden
              >
                <path
                  d="M2 6 Q25 2, 50 5 T100 4 T150 5 T198 3"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  fill="none"
                  opacity="0.5"
                />
              </svg>
            </span>
          </h1>

          <p
            className="mb-10 max-w-xl text-lg leading-relaxed"
            style={{ color: "var(--text-muted)" }}
          >
            Describe what you want to make, or upload a photo — and get a
            complete, row-by-row crochet pattern in seconds. No experience
            required.
          </p>

          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="group gap-2 px-8">
              <Link href="/generate">
                <Wand2 className="h-4 w-4 transition-transform group-hover:rotate-12" />
                Generate a pattern
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Button asChild variant="ghost" size="lg" className="gap-2">
              <Link href="/patterns">
                <BookOpen className="h-4 w-4" />
                Browse patterns
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════
          Feature cards
      ════════════════════════════════ */}
      <section className="mx-auto w-full max-w-5xl px-5 py-10">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              icon: <Sparkles className="h-5 w-5" />,
              title: "Text to Pattern",
              desc: "Describe your project in plain language — yarns, size, style — and receive a full stitch-by-stitch pattern.",
              accent: "from-rose-500/10 to-rose-500/0",
            },
            {
              icon: <ImageIcon className="h-5 w-5" />,
              title: "Photo to Pattern",
              desc: "Upload any photo and our AI analyzes the shape, texture, and structure to write a pattern that recreates it.",
              accent: "from-violet-500/10 to-violet-500/0",
            },
            {
              icon: <BookOpen className="h-5 w-5" />,
              title: "Save & Revisit",
              desc: "Every pattern you generate can be saved to your personal library, printed, or copied to your clipboard.",
              accent: "from-amber-500/10 to-amber-500/0",
            },
          ].map(({ icon, title, desc, accent }) => (
            <div
              key={title}
              className="
                group relative overflow-hidden rounded-2xl p-6
                border border-[var(--border)]
                bg-[var(--bg-card)]
                shadow-sm transition-all duration-300
                hover:-translate-y-0.5 hover:shadow-md
                hover:border-[var(--border-strong)]
              "
            >
              {/* Gradient wash */}
              <div
                className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accent} opacity-60`}
              />

              <div className="relative">
                <div
                  className="
                    mb-4 flex h-10 w-10 items-center justify-center
                    rounded-xl bg-[var(--primary-muted)]
                    text-[var(--primary)] transition-transform
                    duration-300 group-hover:scale-110
                  "
                >
                  {icon}
                </div>
                <h3
                  className="mb-2 font-semibold"
                  style={{ color: "var(--text)" }}
                >
                  {title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  {desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════
          How it works
      ════════════════════════════════ */}
      <section
        className="mx-auto w-full max-w-5xl px-5 py-12"
      >
        <div
          className="rounded-3xl border border-[var(--border)] bg-[var(--bg-card)] px-8 py-12"
        >
          <h2
            className="mb-2 text-center text-3xl font-bold"
            style={{
              fontFamily: "var(--font-playfair)",
              color: "var(--text)",
            }}
          >
            How it works
          </h2>
          <p
            className="mb-12 text-center text-sm"
            style={{ color: "var(--text-muted)" }}
          >
            From idea to finished pattern in three steps
          </p>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                step: "01",
                icon: <Wand2 className="h-5 w-5" />,
                title: "Describe or upload",
                desc: "Type a description of what you'd like to crochet, or drop in a photo for inspiration.",
              },
              {
                step: "02",
                icon: <Sparkles className="h-5 w-5" />,
                title: "AI generates",
                desc: "Our AI crafts a complete pattern — materials, gauge, abbreviations, and row-by-row instructions.",
              },
              {
                step: "03",
                icon: <Layers className="h-5 w-5" />,
                title: "Start crocheting",
                desc: "Follow along, save to your library, and print or share whenever you're ready.",
              },
            ].map(({ step, icon, title, desc }) => (
              <div key={step} className="flex flex-col items-center text-center">
                <div className="relative mb-5">
                  <div
                    className="
                      flex h-14 w-14 items-center justify-center
                      rounded-2xl bg-[var(--primary-muted)]
                      text-[var(--primary)]
                    "
                  >
                    {icon}
                  </div>
                  <span
                    className="
                      absolute -right-1 -top-1 flex h-5 w-5 items-center
                      justify-center rounded-full text-[10px] font-bold
                      bg-[var(--primary)] text-white
                    "
                  >
                    {step.replace("0", "")}
                  </span>
                </div>
                <h3
                  className="mb-2 font-semibold"
                  style={{ color: "var(--text)" }}
                >
                  {title}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--text-muted)" }}
                >
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════
          CTA
      ════════════════════════════════ */}
      <section className="mx-auto w-full max-w-5xl px-5 pb-20 pt-4">
        <div
          className="
            relative overflow-hidden rounded-3xl
            border border-[var(--primary)] px-8 py-14 text-center
          "
          style={{ backgroundColor: "var(--primary-muted)" }}
        >
          <div
            className="pointer-events-none absolute left-1/2 top-0 h-48 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20 blur-3xl"
            style={{ backgroundColor: "var(--primary)" }}
          />
          <h2
            className="relative mb-3 text-3xl font-bold md:text-4xl"
            style={{
              fontFamily: "var(--font-playfair)",
              color: "var(--text)",
            }}
          >
            Ready to start creating?
          </h2>
          <p className="relative mb-8 text-sm" style={{ color: "var(--text-muted)" }}>
            Free to use — no account required to generate your first pattern.
          </p>
          <Button asChild size="lg" className="relative gap-2 px-8">
            <Link href="/generate">
              <Sparkles className="h-4 w-4" />
              Generate your first pattern
            </Link>
          </Button>
        </div>
      </section>

      {/* ════════════════════════════════
          Footer
      ════════════════════════════════ */}
      <footer
        className="border-t border-[var(--border)] py-6 text-center text-xs"
        style={{ color: "var(--text-muted)" }}
      >
        <div className="flex items-center justify-center gap-1.5">
          <Scissors className="h-3 w-3" />
          <span>CrochetAI — made with love for crafters</span>
        </div>
      </footer>
    </main>
  );
}
