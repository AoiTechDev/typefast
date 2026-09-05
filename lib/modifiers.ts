export type ModifierKind = "input" | "visual";

export const MODIFIERS = [
  {
    id: "no-backspace",
    label: "No backspace",
    description: "Backspace is dead. Mistakes stay in forever.",
    kind: "input",
  },
  {
    id: "stop-on-error",
    label: "Stop on error",
    description: "The cursor only moves on once you hit the right character.",
    kind: "input",
  },
  {
    id: "fog",
    label: "Fog of war",
    description: "You see ten characters ahead. The rest is a blur.",
    kind: "visual",
  },
  {
    id: "mirror",
    label: "Mirror",
    description: "The text is rendered as a mirror image.",
    kind: "visual",
  },
] as const;

export type ModifierId = (typeof MODIFIERS)[number]["id"];

export const FOG_CHARS_AHEAD = 10;

export const parseModifiers = (value: unknown): ModifierId[] => {
  if (!Array.isArray(value)) return [];

  return MODIFIERS.filter((modifier) => value.includes(modifier.id)).map(
    (modifier) => modifier.id,
  );
};

export const hasModifier = (
  modifiers: readonly ModifierId[],
  id: ModifierId,
) => modifiers.includes(id);
