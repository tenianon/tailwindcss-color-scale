<div align="center">

# Tailwind CSS Color Scale

**Provides extended color scales for Tailwind CSS**

[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-v4+-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com)

</div>

## ✨ Features

- Supports all color scales from 0 to 1000, in addition to the default 50, 100, 200, ..., 900, 950 scales
- Supports transparency settings `bg-red-25/10`
- Supports custom colors `bg-[@theme color]-25`
- Generates utility classes on-demand, avoiding a large number of `suggest` statements that could cause **IDE lag**

## 📦 Installation

```bash
# Using npm
npm install tailwindcss-color-scale -D

# Using yarn
yarn add tailwindcss-color-scale -D

# Using pnpm
pnpm add tailwindcss-color-scale -D

# Using bun
bun add tailwindcss-color-scale -D
```

## 🚀 Quick Start

Include the plugin in your CSS file:

```css
@import "tailwindcss";

@plugin "tailwindcss-color-scale";
```

Now you can use any color scale value from 0 to 1000:

```html
<!-- Default color scale -->
<div class="bg-red-500">Standard Red</div>

<!-- Custom color scales -->
<div class="bg-red-123">Custom Red 123</div>
<div class="bg-blue-567">Custom Blue 567</div>
<div class="bg-green-789">Custom Green 789</div>
```

## 🎨 How it Works

### Color Scale Range

- **0-50**: Interpolates between white and `color-50`
- **50-950**: Interpolates between adjacent standard color scales (e.g., `color-100` and `color-200`)
- **950-1000**: Interpolates between `color-950` and black

### Color Interpolation Algorithm

The plugin uses the CSS `color-mix()` function and the OKLCH color space to generate smooth color transitions:

```typescript
// Example: bg-red-123
// Interpolate between red-100 and red-200
color-mix(in oklch, var(--color-red-200) 23%, var(--color-red-100))
```

## 📚 Supported Utility Classes

The plugin supports all Tailwind CSS color-related utility classes:

```html
<!-- bg -->
<p class="bg-red-56"></p>
<p class="from-red-56"></p>
<p class="to-red-56"></p>
<p class="via-red-56"></p>

<!-- text -->
<p class="text-red-56"></p>
<p class="placeholder-red-56"></p>
<!-- decoration -->
<p class="decoration-red-56"></p>
<!-- border -->
<p class="border-red-56"></p>
<p class="border-x-red-56"></p>
<p class="border-y-red-56"></p>
<p class="border-s-red-56"></p>
<p class="border-e-red-56"></p>
<p class="border-t-red-56"></p>
<p class="border-b-red-56"></p>
<p class="border-l-red-56"></p>
<p class="border-r-red-56"></p>
<!-- divide -->
<p class="divide-red-56"></p>
<!-- outline -->
<p class="outline-red-56"></p>
<!-- shadow -->
<p class="shadow-red-56/10"></p>
<p class="drop-shadow-red-56"></p>
<!-- inset-shadow -->
<p class="inset-shadow-red-56"></p>
<!-- ring -->
<p class="ring-red-56"></p>
<!-- ring-offset -->
<p class="ring-offset-red-56"></p>
<!-- accent -->
<p class="accent-red-56"></p>
<!-- caret -->
<p class="caret-red-56"></p>
<!-- fill -->
<p class="fill-red-56"></p>
<!-- stroke -->
<p class="stroke-red-56"></p>
```

### Custom Color Palette

```css
@theme {
  --color-brand-50: #f0f9ff;
  --color-brand-100: #e0f2fe;
  --color-brand-200: #bae6fd;
  --color-brand-300: #7dd3fc;
  --color-brand-400: #38bdf8;
  --color-brand-500: #0ea5e9;
  --color-brand-600: #0284c7;
  --color-brand-700: #0369a1;
  --color-brand-800: #075985;
  --color-brand-900: #0c4a6e;
  --color-brand-950: #082f49;
}
```

```html
<!-- Use any color scale with a custom color palette -->
<div class="bg-brand-375">Brand Color 375</div>
<div class="text-brand-625">Brand Color 625</div>
```

## 🔍 Technical Details

### Boundary Condition Handling

- `color-0`: `color-mix(in oklch, var(--color-red-50) 0%, white)` = pure white
- `color-1` ~ `color-49`: Interpolates between white and `color-50`
- `color-50`, `color-100`, ..., `color-950`: Uses Tailwind CSS standard color scales (plugin does not handle these)
- `color-51` ~ `color-949`: Interpolates between adjacent standard color scales
- `color-951` ~ `color-999`: Interpolates between `color-950` and black
- `color-1000`: `color-mix(in oklch, black 100%, var(--color-red-950))` = pure black

### Invalid Value Handling

The following cases will be ignored and fall back to Tailwind CSS default behavior:

- ❌ `bg-red-1001` (exceeding 1000)
- ❌ `bg-red-011` (leading zeros)
- ❌ `bg-red--123` (negative numbers)
- ❌ `bg-unknown-123` (non-existent color)

## 🙋 Q&A

#### Will so many color scales generate a large number of autocomplete suggestions, causing IDE lag?

- No, the plugin uses on-demand matching for utility classes, similar to the arbitrary value syntax `bg-[xxx]`.

#### Why doesn't the CSS preview tooltip appear when hovering over a class name?

- This seems to be an issue with the [Tailwind CSS Intellisense](https://github.com/tailwindlabs/tailwindcss-intellisense) extension plugin. You can add the following configuration to your editor settings:

```json
// settings.json
{
  "tailwindCSS.experimental.configFile": "your CSS file path"
}
```
