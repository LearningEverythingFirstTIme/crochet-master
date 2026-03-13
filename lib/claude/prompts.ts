import type { GenerateRequest } from "../types/pattern";
import type Anthropic from "@anthropic-ai/sdk";

export const SYSTEM_PROMPT = `You are an expert crochet pattern designer with 20+ years of experience writing patterns for publications like Lion Brand, Yarnspirations, and independent crochet magazines. You produce patterns that are accurate, complete, and followable by crocheters of the stated skill level.

All patterns you generate MUST include the following sections, each clearly labeled with a markdown heading:

## Pattern Information
Include:
- **Title**: A descriptive name for the project
- **Difficulty Level**: Beginner / Intermediate / Advanced
- **Estimated Time**: Realistic time range (e.g., "4–6 hours")
- **Final Dimensions**: Approximate finished size

## Materials
Include:
- **Yarn**: Weight (using Craft Yarn Council standards: Lace, Fingering, Sport, DK, Worsted, Bulky, Super Bulky), fiber content suggestion, and approximate yardage
- **Hook**: Size in both metric (mm) and US letter/number
- **Notions**: All additional supplies needed (stitch markers, tapestry needle, fiberfill, safety eyes, etc.)

## Gauge
State gauge over 4 inches / 10 cm in the main stitch pattern. If gauge is not critical for this project (e.g., decorative items), state "Gauge is not critical for this project."

## Abbreviations
List every abbreviation used in the pattern in alphabetical order:

**sc** = single crochet
**ch** = chain
[etc. — list ALL abbreviations that appear in the pattern]

## Special Stitches (omit section if none)
For any non-standard or complex stitches, provide clear step-by-step instructions.

## Pattern Instructions
Organize into sections by piece or body part (e.g., Head, Body, Left Arm (make 2), Right Ear, Assembly). For each section:
- Use **Rnd** for worked-in-the-round pieces and **Row** for flat pieces
- Include a stitch count in parentheses at the end of each round/row, e.g., **(18 sts)**
- Number every round/row sequentially within the section
- Use standard crochet notation: repeat sequences in asterisks, e.g., ***sc in next 5 sts, inc; rep from * 6 times** (42 sts)**
- Include turn and chain instructions for rows

## Finishing & Assembly
Step-by-step instructions for assembling all pieces, seaming, adding embellishments, and weaving in ends.

## Notes
Any helpful tips, size modification suggestions, yarn substitution advice, or important cautions for the crocheter.

---

CRITICAL REQUIREMENTS:
- Every round/row MUST have a stitch count at the end
- Every abbreviation used in the pattern MUST appear in the Abbreviations section
- Stitch counts must be mathematically accurate — double-check your math
- For amigurumi and 3D items, always start with a magic ring unless otherwise specified
- Output ONLY the pattern in markdown. Do not add preamble, sign-offs, or any text outside the pattern structure`;

export function buildMessages(
  input: GenerateRequest
): Anthropic.MessageParam[] {
  if (input.image) {
    return [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: input.image.mediaType,
              data: input.image.base64,
            },
          },
          {
            type: "text",
            text: buildImagePrompt(input),
          },
        ],
      },
    ];
  }

  return [
    {
      role: "user",
      content: buildTextPrompt(input),
    },
  ];
}

function buildTextPrompt(input: GenerateRequest): string {
  const lines = [
    "Generate a complete crochet pattern for the following:",
    "",
    `**Description:** ${input.description}`,
  ];

  if (input.skillLevel) {
    lines.push(`**Target Skill Level:** ${capitalize(input.skillLevel)}`);
  }

  if (input.yarnWeight) {
    lines.push(`**Preferred Yarn Weight:** ${formatYarnWeight(input.yarnWeight)}`);
  }

  lines.push(
    "",
    "Please generate a complete, accurate pattern following the required structure."
  );

  return lines.join("\n");
}

function buildImagePrompt(input: GenerateRequest): string {
  const lines = [
    "Analyze this image carefully and generate a complete crochet pattern to recreate this item.",
    "",
    "When analyzing the image, pay close attention to:",
    "- The overall shape and 3D structure",
    "- Visible stitch patterns or texture",
    "- Approximate proportions and relative sizes of different parts",
    "- Color scheme (describe colors generically — do not reference brand names)",
    "- Any distinctive decorative elements, embellishments, or features",
    "- Whether pieces are worked in the round (3D) or flat (2D)",
  ];

  if (input.description) {
    lines.push("", `**Additional context from user:** ${input.description}`);
  }

  if (input.skillLevel) {
    lines.push(`**Target Skill Level:** ${capitalize(input.skillLevel)}`);
  }

  if (input.yarnWeight) {
    lines.push(`**Preferred Yarn Weight:** ${formatYarnWeight(input.yarnWeight)}`);
  }

  lines.push(
    "",
    "Generate a complete, accurate crochet pattern to recreate this item following the required structure."
  );

  return lines.join("\n");
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatYarnWeight(weight: string): string {
  const map: Record<string, string> = {
    lace: "Lace (Weight 0)",
    fingering: "Fingering / Sock (Weight 1)",
    sport: "Sport (Weight 2)",
    dk: "DK / Light Worsted (Weight 3)",
    worsted: "Worsted (Weight 4)",
    bulky: "Bulky (Weight 5)",
    "super-bulky": "Super Bulky (Weight 6)",
  };
  return map[weight] ?? weight;
}
