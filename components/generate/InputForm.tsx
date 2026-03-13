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
  { value: "lace", label: "Lace (0)" },
  { value: "fingering", label: "Fingering (1)" },
  { value: "sport", label: "Sport (2)" },
  { value: "dk", label: "DK (3)" },
  { value: "worsted", label: "Worsted (4)" },
  { value: "bulky", label: "Bulky (5)" },
  { value: "super-bulky", label: "Super Bulky (6)" },
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

  const SKILL_LEVELS: { value: SkillLevel; label: string; desc: string }[] = [
    { value: "beginner", label: "Beginner", desc: "Basic stitches only" },
    { value: "intermediate", label: "Intermediate", desc: "Some shaping" },
    { value: "advanced", label: "Advanced", desc: "Complex techniques" },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Description textarea */}
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-semibold text-gray-700 mb-1.5"
        >
          What would you like to crochet?
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. a small amigurumi bear with a bow tie, a cozy winter hat for a toddler, a granny square tote bag..."
          rows={3}
          className="w-full rounded-xl border border-rose-200 bg-white px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent resize-none"
        />
      </div>

      {/* Image upload */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Or upload a photo <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <ImageUploader
          onImageReady={(data) => setImage(data)}
        />
      </div>

      {/* Skill level */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Skill level <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <div className="flex gap-2 flex-wrap">
          {SKILL_LEVELS.map(({ value, label, desc }) => (
            <button
              key={value}
              type="button"
              onClick={() => setSkillLevel(skillLevel === value ? "" : value)}
              className={`rounded-lg border px-4 py-2 text-sm transition-colors ${
                skillLevel === value
                  ? "border-rose-400 bg-rose-50 text-rose-700 font-semibold"
                  : "border-gray-200 bg-white text-gray-600 hover:border-rose-300"
              }`}
            >
              <div className="font-medium">{label}</div>
              <div className="text-xs opacity-70">{desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Yarn weight */}
      <div>
        <label
          htmlFor="yarnWeight"
          className="block text-sm font-semibold text-gray-700 mb-1.5"
        >
          Yarn weight <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <select
          id="yarnWeight"
          value={yarnWeight}
          onChange={(e) => setYarnWeight(e.target.value as YarnWeight | "")}
          className="rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-rose-400"
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
