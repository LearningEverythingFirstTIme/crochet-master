"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageUploader } from "./ImageUploader";
import type { GenerateRequest, SkillLevel, YarnWeight } from "@/lib/types/pattern";

interface InputFormProps {
  onSubmit: (input: GenerateRequest) => void;
  isLoading: boolean;
}

const YARN_WEIGHTS: { value: YarnWeight; label: string }[] = [
  { value: "lace",        label: "Lace (0)" },
  { value: "fingering",   label: "Fingering (1)" },
  { value: "sport",       label: "Sport (2)" },
  { value: "dk",          label: "DK (3)" },
  { value: "worsted",     label: "Worsted (4)" },
  { value: "bulky",       label: "Bulky (5)" },
  { value: "super-bulky", label: "Super Bulky (6)" },
];

const SKILL_LEVELS: { value: SkillLevel; label: string; desc: string }[] = [
  { value: "beginner",     label: "Beginner",     desc: "Basic stitches only" },
  { value: "intermediate", label: "Intermediate", desc: "Some shaping" },
  { value: "advanced",     label: "Advanced",     desc: "Complex techniques" },
];

export function InputForm({ onSubmit, isLoading }: InputFormProps) {
  const [description, setDescription] = useState("");
  const [skillLevel, setSkillLevel] = useState<SkillLevel | "">("");
  const [yarnWeight, setYarnWeight] = useState<YarnWeight | "">("");
  const [image, setImage] = useState<{
    base64: string;
    mediaType: "image/jpeg" | "image/png" | "image/webp";
    preview: string;
  } | null>(null);

  const canSubmit = (description.trim().length > 0 || image !== null) && !isLoading;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    const input: GenerateRequest = {
      description: description.trim(),
      ...(skillLevel && { skillLevel }),
      ...(yarnWeight && { yarnWeight }),
      ...(image && {
        image: { base64: image.base64, mediaType: image.mediaType },
      }),
    };

    onSubmit(input);
  };

  const labelClass = "block text-sm font-semibold mb-1.5";
  const optionalClass = "font-normal text-xs";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Description */}
      <div>
        <label
          htmlFor="description"
          className={labelClass}
          style={{ color: "var(--text)" }}
        >
          What would you like to crochet?
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. a small amigurumi bear with a bow tie, a cozy winter hat for a toddler, a granny square tote bag..."
          rows={3}
          className="w-full rounded-xl border px-4 py-3 text-sm placeholder:text-[var(--text-placeholder)] focus:outline-none focus:ring-2 resize-none transition-colors"
          style={{
            backgroundColor: "var(--bg-input)",
            borderColor: "var(--border)",
            color: "var(--text)",
            "--tw-ring-color": "var(--primary)",
          } as React.CSSProperties}
        />
      </div>

      {/* Image upload */}
      <div>
        <label className={labelClass} style={{ color: "var(--text)" }}>
          Or upload a photo{" "}
          <span className={optionalClass} style={{ color: "var(--text-muted)" }}>
            (optional)
          </span>
        </label>
        <ImageUploader onImageReady={(data) => setImage(data)} />
      </div>

      {/* Skill level */}
      <div>
        <label className={labelClass} style={{ color: "var(--text)" }}>
          Skill level{" "}
          <span className={optionalClass} style={{ color: "var(--text-muted)" }}>
            (optional)
          </span>
        </label>
        <div className="flex gap-2 flex-wrap">
          {SKILL_LEVELS.map(({ value, label, desc }) => {
            const selected = skillLevel === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setSkillLevel(selected ? "" : value)}
                className="rounded-xl border px-4 py-2 text-sm text-left transition-all duration-200"
                style={{
                  backgroundColor: selected ? "var(--primary-muted)" : "var(--bg-input)",
                  borderColor: selected ? "var(--primary)" : "var(--border)",
                  color: selected ? "var(--primary)" : "var(--text)",
                  boxShadow: selected ? "0 0 0 1px var(--primary)" : "none",
                }}
              >
                <div className="font-semibold">{label}</div>
                <div className="text-xs opacity-60">{desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Yarn weight */}
      <div>
        <label
          htmlFor="yarnWeight"
          className={labelClass}
          style={{ color: "var(--text)" }}
        >
          Yarn weight{" "}
          <span className={optionalClass} style={{ color: "var(--text-muted)" }}>
            (optional)
          </span>
        </label>
        <select
          id="yarnWeight"
          value={yarnWeight}
          onChange={(e) => setYarnWeight(e.target.value as YarnWeight | "")}
          className="rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition-colors"
          style={{
            backgroundColor: "var(--bg-input)",
            borderColor: "var(--border)",
            color: "var(--text)",
            "--tw-ring-color": "var(--primary)",
          } as React.CSSProperties}
        >
          <option value="">Any weight</option>
          {YARN_WEIGHTS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Submit */}
      <Button
        type="submit"
        disabled={!canSubmit}
        size="lg"
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating pattern...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Generate Pattern
          </>
        )}
      </Button>
    </form>
  );
}
