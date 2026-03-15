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
- **Colors**: If the project uses multiple colors, list them as Color A, Color B, Color C, etc. with generic descriptions (e.g., "Color A: Brown (main body)", "Color B: Cream (belly)")

## Gauge
State gauge over 4 inches / 10 cm in the main stitch pattern. If gauge is not critical for this project (e.g., decorative items), state "Gauge is not critical for this project."

## Abbreviations
List every abbreviation used in the pattern in alphabetical order. Examples:

**ch** = chain
**dec** = decrease
**hdc** = half double crochet
**inc** = increase
**mr** = magic ring
**rep** = repeat
**rnd** = round
**sc** = single crochet
**sl st** = slip stitch
**st** = stitch
**sts** = stitches
**YO** = yarn over

[List ALL abbreviations that appear in the pattern, not just these examples]

## Special Stitches (omit section if none)
For any non-standard or complex stitches, provide clear step-by-step instructions.

## Pattern Instructions
Organize into sections by piece or body part. Use ### headings for each section.

**Section heading format:**
- Single pieces: ### Head
- Multiple identical pieces: ### Left Arm (make 2) or ### Ear (make 2, one reversed for left and right)
- Important: Write the instructions ONCE for pieces marked "(make 2)" — do NOT duplicate the instructions

**Row/Round format - CRITICAL:**
Every row/round must follow this exact format:
- Start with: **Rnd X:** or **Row X:** (bold, capitalized, with colon)
- Follow with the instruction text
- End with: **(Y sts)** (bold, in parentheses, number followed by "sts")

Example for rounds:
**Rnd 1:** 6 sc in magic ring. **(6 sts)**
**Rnd 2:** Inc in each st around. **(12 sts)**
**Rnd 3:** *Sc in next st, inc; rep from * around. **(18 sts)**

Example for rows:
**Row 1:** Ch 11, sc in 2nd ch from hook and in each ch across. **(10 sts)**
**Row 2:** Ch 1, turn, sc in each st across. **(10 sts)**

**Repeat notation format:**
For repeated sequences, use this exact format:
*instruction; rep from * X times**

- Start with single asterisk: *
- Write the instruction to repeat
- Semicolon, then "rep from *" 
- Number of times to repeat
- End with double asterisk: **
- Then stitch count in parentheses

Example: **Rnd 5:** *Sc in next 3 sts, inc; rep from * 6 times. **(30 sts)**

**Color changes:**
If changing colors mid-round, specify exactly where:
**Rnd 10:** Sc in next 5 sts with Color A, change to Color B, sc in next 5 sts. **(10 sts)**

Or if changing at the end of a round:
**Rnd 10:** Sc in each st around, change to Color B in last st. **(10 sts)**

**Turning and chaining:**
For flat pieces (rows), always specify:
- Ch 1 at beginning of row for sc height
- Ch 2 for hdc height
- Ch 3 for dc height
- Always include "turn" at end of instruction

Example: **Row 5:** Ch 1, turn, sc in each st across. **(10 sts)**

## Finishing & Assembly
Step-by-step instructions for assembling all pieces. Format as numbered list:

1. Align Head and Body pieces with right sides facing.
2. Whip stitch around the opening using matching yarn.
3. Stuff firmly before closing completely.
4. Attach Arms to Body sides using mattress stitch.
5. Embroider facial features using black yarn.
6. Weave in all ends using tapestry needle.

Specify stitch types:
- Use "whip stitch" for joining edges
- Use "mattress stitch" for invisible seams
- Use "slip stitch seam" for decorative edges
- Specify "wrong sides together" or "right sides facing" when relevant

## Notes
Any helpful tips, size modification suggestions, yarn substitution advice, or important cautions for the crocheter.

---

CRITICAL REQUIREMENTS:
- Every round/row MUST have a stitch count at the end: **(X sts)**
- Every abbreviation used in the pattern MUST appear in the Abbreviations section
- Stitch counts must be mathematically accurate — verify: (starting stitches + increases - decreases = ending stitches)
- For amigurumi and 3D items, always start with a magic ring unless otherwise specified
- For pieces marked "(make 2)", write instructions ONCE — do not duplicate
- Output ONLY the pattern in markdown. Do not add preamble, sign-offs, or any text outside the pattern structure
- Do NOT use copyrighted character names (Disney, Nintendo, Marvel, etc.). Use generic descriptions like "small bear" or "forest creature" instead.
- When the pattern is COMPLETELY FINISHED, end with this exact line on its own: **END OF PATTERN**
- Do not write "END OF PATTERN" until all sections are fully complete`;

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
    "INSTRUCTIONS FOR GENERATION:",
    "1. Based on the description, infer the project type (amigurumi/stuffed toy, wearable garment, home decor, accessory, blanket, etc.)",
    "2. Adjust the pattern structure to match the project type:",
    "   - Amigurumi: Use Rnd (round) notation, start with magic ring, include stuffing instructions",
    "   - Wearables: Use Row notation for flat pieces, include sizing notes",
    "   - Home decor: Specify gauge more precisely, include blocking instructions if needed",
    "3. Choose appropriate difficulty level based on complexity implied in description",
    "4. Select realistic time estimates based on project size",
    "5. Ensure all stitch counts are mathematically accurate",
    "6. Use generic color names (not brand names) in Materials section",
    "",
    "Please generate a complete, accurate pattern following ALL requirements in the system instructions."
  );

  return lines.join("\n");
}

function buildImagePrompt(input: GenerateRequest): string {
  const lines = [
    "Analyze this image carefully and generate a complete crochet pattern to recreate this item.",
    "",
    "IMAGE ANALYSIS INSTRUCTIONS:",
    "Examine the image and identify:",
    "1. PROJECT TYPE: Is this amigurumi/stuffed toy, a wearable, home decor, blanket, accessory, or something else?",
    "2. OVERALL SHAPE: Describe the 3D structure (spherical, cylindrical, flat, etc.)",
    "3. STITCH PATTERN: What stitch texture do you see? (single crochet, half double, bobble, shell, etc.)",
    "4. PIECES/COMPONENTS: How many separate pieces need to be made? (head, body, arms, legs, ears, etc.)",
    "5. PROPORTIONS: Estimate relative sizes (e.g., head is 1.5x diameter of body)",
    "6. COLOR SCHEME: List colors using generic names only (brown, cream, pink, navy — NO brand names)",
    "7. CONSTRUCTION METHOD: Worked in the round (3D) or flat (2D)?",
    "8. DISTINCTIVE FEATURES: Embellishments, facial features, texture elements, shaping details",
    "9. SIZE: Estimate approximate finished dimensions based on typical crochet gauge",
    "",
    "PATTERN GENERATION INSTRUCTIONS:",
    "- Based on your analysis, choose appropriate difficulty level",
    "- Select realistic time estimate for this project size",
    "- Determine if gauge is critical (wearables) or not (amigurumi)",
    "- Use Rnd notation for 3D/round pieces, Row notation for flat pieces",
    "- Include stitch counts that mathematically make sense for the observed proportions",
    "- If multiple identical pieces exist (two arms, two ears), use '(make 2)' notation — do NOT duplicate instructions",
    "- Choose appropriate yarn weight and hook size based on apparent scale and texture",
  ];

  if (input.description) {
    lines.push("", `**Additional context from user:** ${input.description}`);
  }

  if (input.skillLevel) {
    lines.push(`**Target Skill Level:** ${capitalize(input.skillLevel)}`);
    lines.push(`Adjust pattern complexity to match this skill level.`);
  }

  if (input.yarnWeight) {
    lines.push(`**Preferred Yarn Weight:** ${formatYarnWeight(input.yarnWeight)}`);
  }

  lines.push(
    "",
    "Generate a complete, accurate crochet pattern following ALL requirements in the system instructions."
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
