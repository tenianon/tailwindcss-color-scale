import plugin from "tailwindcss/plugin";
import flattenColorPalette from "./utils/flattenColorPalette";

const DEFAULT_SCALE = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

type NamedUtilityValue = {
  kind: "named";
  value: string;
  fraction: string | null;
};

function extractColorName(value: string): string {
  const match = value.match(/^(.+)-\d+$/);
  return match?.[1] ?? value;
}

/**
 * generate color-mix expression based on scale value
 * @param color color name, like 'red', 'green'
 * @param scale scale value, 1-1000
 */
function generateColorMix(color: string, scale: number): string {
  // value < 50: color-mix(in oklch,var(--color-[color]-50) (val * 2)%,white)
  if (scale < 50) {
    return `color-mix(in oklch,var(--color-${color}-50) ${scale * 2}%,white)`;
  }

  // 950 < value < 1000: color-mix(in oklch,black (val - 950) * 2%,var(--color-[color]-950))
  if (scale > 950) {
    const percentage = (scale - 950) * 2;
    return `color-mix(in oklch,black ${percentage}%,var(--color-${color}-950))`;
  }

  // 50 <= value <= 950: interpolate between adjacent standard scale values
  // find the first standard scale value greater than or equal to scale
  const upperIndex = DEFAULT_SCALE.findIndex((s) => s >= scale);

  if (upperIndex === -1) {
    // should not be here,because scale <= 950
    return `var(--color-${color}-950)`;
  }

  const upper = DEFAULT_SCALE[upperIndex]!;

  // if scale is exactly a standard scale value,return directly
  if (scale === upper) {
    return `var(--color-${color}-${upper})`;
  }

  const lower = upperIndex === 0 ? 50 : DEFAULT_SCALE[upperIndex - 1]!;

  // calculate the percentage between the two scale values
  const range = upper - lower;
  const offset = scale - lower;

  // 50-100: multiply by 2
  // other intervals: according to the actual ratio
  const percentage =
    lower === 50 && upper === 100 ? offset * 2 : (offset / range) * 100;

  return `color-mix(in oklch,var(--color-${color}-${upper}) ${percentage}%,var(--color-${color}-${lower}))`;
}

export default plugin(({ matchUtilities, theme }) => {
  const allColorKeys = Object.keys(flattenColorPalette(theme("color")));

  const allColorKeysSet = new Set(allColorKeys);
  const defaultColorKeys = new Set(
    allColorKeys.map((key) => extractColorName(key))
  );

  matchUtilities(
    {
      bg: (value) => {
        return {
          "background-color": value,
        };
      },
      from: (value) => ({
        "--tw-gradient-from": value,
        "--tw-gradient-stops":
          "var(--tw-gradient-via-stops,var(--tw-gradient-position),var(--tw-gradient-from) var(--tw-gradient-from-position),var(--tw-gradient-to) var(--tw-gradient-to-position))",
      }),
      to: (value) => ({
        "--tw-gradient-to": value,
        "--tw-gradient-stops":
          "var(--tw-gradient-via-stops,var(--tw-gradient-position),var(--tw-gradient-from) var(--tw-gradient-from-position),var(--tw-gradient-to) var(--tw-gradient-to-position))",
      }),
      via: (value) => ({
        "--tw-gradient-via": value,
        "--tw-gradient-via-stops":
          "var(--tw-gradient-position),var(--tw-gradient-from) var(--tw-gradient-from-position),var(--tw-gradient-via) var(--tw-gradient-via-position),var(--tw-gradient-to) var(--tw-gradient-to-position)",
        "--tw-gradient-stops": "var(--tw-gradient-via-stops)",
      }),
      text: (value) => ({
        color: value,
      }),
      placeholder: (value) => ({
        "&::placeholder": {
          color: value,
        },
      }),
      decoration: (value) => ({
        "text-decoration-color": value,
      }),
      border: (value) => ({
        "border-color": value,
      }),
      "border-x": (value) => ({
        "border-inline-color": value,
      }),
      "border-y": (value) => ({
        "border-block-color": value,
      }),
      "border-s": (value) => ({
        "border-inline-start-color": value,
      }),
      "border-e": (value) => ({
        "border-inline-end-color": value,
      }),
      "border-t": (value) => ({
        "border-top-color": value,
      }),
      "border-b": (value) => ({
        "border-bottom-color": value,
      }),
      "border-l": (value) => ({
        "border-left-color": value,
      }),
      "border-r": (value) => ({
        "border-right-color": value,
      }),
      divide: (value) => ({
        ":where(& > :not(:last-child))": {
          "border-color": value,
        },
      }),
      outline: (value) => ({
        "outline-color": value,
      }),
      shadow: (value) => ({
        "--tw-shadow-color": `color-mix(in oklab,${value} var(--tw-shadow-alpha),transparent)`,
      }),
      "drop-shadow": (value) => ({
        "--tw-drop-shadow-color": `color-mix(in oklab,${value} var(--tw-drop-shadow-alpha),transparent)`,
        "--tw-drop-shadow": "var(--tw-drop-shadow-size)",
      }),
      "inset-shadow": (value) => ({
        "--tw-inset-shadow-color": `color-mix(in oklab,${value} var(--tw-inset-shadow-alpha),transparent)`,
      }),
      ring: (value) => ({
        "--tw-ring-color": value,
      }),
      "ring-offset": (value) => ({
        "--tw-ring-offset-color": value,
      }),
      accent: (value) => ({
        "accent-color": value,
      }),
      caret: (value) => ({
        "caret-color": value,
      }),
      fill: (value) => ({
        fill: value,
      }),
      stroke: (value) => ({
        stroke: value,
      }),
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
