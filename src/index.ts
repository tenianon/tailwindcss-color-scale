import plugin from "tailwindcss/plugin";
import flattenColorPalette from "./utils/flattenColorPalette";

const DEFAULT_SCALE = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

type NamedUtilityValue = {
  kind: "named";
  value: string;
  fraction: string | null;
};

type CssInJs = {
  [key: string]: string | string[] | CssInJs | CssInJs[];
};

const PLUGIN_PREFIX = "@";

function extractColorName(value: string): string {
  const match = value.match(/^(.+)-\d+$/);
  return match?.[1] ?? value;
}

function generateUtility(cssGen: (color: string) => CssInJs) {
  return (value: string) => {
    if (value?.[0] === PLUGIN_PREFIX) {
      return cssGen(value.slice(1));
    }
    return {};
  };
}

/**
 * generate color-mix expression based on scale value
 * @param color color name, like 'red', 'green'
 * @param scale scale value, 1-1000
 */
function generateColorMix(color: string, scale: number): string {
  // value < 50: color-mix(in oklch,var(--color-[color]-50) (val * 2)%,white)
  if (scale < 50) {
    return `${PLUGIN_PREFIX}color-mix(in oklch,var(--color-${color}-50) ${
      scale * 2
    }%,white)`;
  }

  // 950 < value < 1000: color-mix(in oklch,black (val - 950) * 2%,var(--color-[color]-950))
  if (scale > 950) {
    const percentage = (scale - 950) * 2;
    return `${PLUGIN_PREFIX}color-mix(in oklch,black ${percentage}%,var(--color-${color}-950))`;
  }

  // 50 <= value <= 950: interpolate between adjacent standard scale values
  // find the first standard scale value greater than or equal to scale
  const upperIndex = DEFAULT_SCALE.findIndex((s) => s >= scale);

  if (upperIndex === -1) {
    // should not be here,because scale <= 950
    return `${PLUGIN_PREFIX}var(--color-${color}-950)`;
  }

  const upper = DEFAULT_SCALE[upperIndex]!;

  // if scale is exactly a standard scale value,return directly
  if (scale === upper) {
    return `${PLUGIN_PREFIX}var(--color-${color}-${upper})`;
  }

  const lower = upperIndex === 0 ? 50 : DEFAULT_SCALE[upperIndex - 1]!;

  // calculate the percentage between the two scale values
  const range = upper - lower;
  const offset = scale - lower;

  // 50-100: multiply by 2
  // other intervals: according to the actual ratio
  const percentage =
    lower === 50 && upper === 100 ? offset * 2 : (offset / range) * 100;

  return `${PLUGIN_PREFIX}color-mix(in oklch,var(--color-${color}-${upper}) ${percentage}%,var(--color-${color}-${lower}))`;
}

export default plugin(({ matchUtilities, theme, addBase }) => {
  const allColorKeys = Object.keys(flattenColorPalette(theme("color")));

  const allColorKeysSet = new Set(allColorKeys);
  const defaultColorKeys = new Set(
    allColorKeys.map((key) => extractColorName(key))
  );

  matchUtilities(
    {
      bg: generateUtility((color) => ({ "background-color": color })),
      from: generateUtility((color) => ({
        "--tw-gradient-from": color,
        "--tw-gradient-stops":
          "var(--tw-gradient-via-stops,var(--tw-gradient-position),var(--tw-gradient-from) var(--tw-gradient-from-position),var(--tw-gradient-to) var(--tw-gradient-to-position))",
      })),
      to: generateUtility((color) => ({
        "--tw-gradient-to": color,
        "--tw-gradient-stops":
          "var(--tw-gradient-via-stops,var(--tw-gradient-position),var(--tw-gradient-from) var(--tw-gradient-from-position),var(--tw-gradient-to) var(--tw-gradient-to-position))",
      })),
      via: generateUtility((color) => ({
        "--tw-gradient-via": color,
        "--tw-gradient-via-stops":
          "var(--tw-gradient-position),var(--tw-gradient-from) var(--tw-gradient-from-position),var(--tw-gradient-via) var(--tw-gradient-via-position),var(--tw-gradient-to) var(--tw-gradient-to-position)",
        "--tw-gradient-stops": "var(--tw-gradient-via-stops)",
      })),
      text: generateUtility((color) => ({ color: color })),
      placeholder: generateUtility((color) => ({
        "&::placeholder": { color: color },
      })),
      decoration: generateUtility((color) => ({
        "text-decoration-color": color,
      })),
      border: generateUtility((color) => ({ "border-color": color })),
      "border-x": generateUtility((color) => ({
        "border-inline-color": color,
      })),
      "border-y": generateUtility((color) => ({ "border-block-color": color })),
      "border-s": generateUtility((color) => ({
        "border-inline-start-color": color,
      })),
      "border-e": generateUtility((color) => ({
        "border-inline-end-color": color,
      })),
      "border-t": generateUtility((color) => ({ "border-top-color": color })),
      "border-b": generateUtility((color) => ({
        "border-bottom-color": color,
      })),
      "border-l": generateUtility((color) => ({ "border-left-color": color })),
      "border-r": generateUtility((color) => ({ "border-right-color": color })),
      divide: generateUtility((color) => ({
        ":where(& > :not(:last-child))": { "border-color": color },
      })),
      outline: generateUtility((color) => ({ "outline-color": color })),
      shadow: generateUtility((color) => ({
        "--tw-shadow-color": `color-mix(in oklab,${color} var(--tw-shadow-alpha),transparent)`,
      })),
      "drop-shadow": generateUtility((color) => ({
        "--tw-drop-shadow-color": `color-mix(in oklab,${color} var(--tw-drop-shadow-alpha),transparent)`,
        "--tw-drop-shadow": "var(--tw-drop-shadow-size)",
      })),
      "inset-shadow": generateUtility((color) => ({
        "--tw-inset-shadow-color": `color-mix(in oklab,${color} var(--tw-inset-shadow-alpha),transparent)`,
      })),
      ring: generateUtility((color) => ({ "--tw-ring-color": color })),
      "ring-offset": generateUtility((color) => ({
        "--tw-ring-offset-color": color,
      })),
      accent: generateUtility((color) => ({ "accent-color": color })),
      caret: generateUtility((color) => ({ "caret-color": color })),
      fill: generateUtility((color) => ({ fill: color })),
      stroke: generateUtility((color) => ({ stroke: color })),
    },
    {
      type: "color",
      values: {
        __BARE_VALUE__: (bare: NamedUtilityValue) => {
          // red-123 => red 123
          const match = bare.value.match(/^(.+)-(\d+)$/);
          if (!match || !match[1] || !match[2]) {
            return undefined;
          }

          // red-011 => undefined (but red-0 is allowed)
          if (match[2].startsWith("0") && match[2].length > 1) {
            return undefined;
          }

          const color = match[1]; // red
          const scale = parseInt(match[2], 10); // 123

          // red-50 => undefined
          if (allColorKeysSet.has(bare.value)) {
            return undefined;
          }

          // [mismatch color]-123 => undefined
          if (!defaultColorKeys.has(color)) {
            return undefined;
          }

          // red-1001 or red--1 => undefined (only allow 0-1000)
          if (scale < 0 || scale > 1000) {
            return undefined;
          }

          return generateColorMix(color, scale);
        },
      } as any,
    }
  );
});
