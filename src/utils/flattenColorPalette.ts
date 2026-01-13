export const enum ThemeOptions {
  NONE = 0,
  INLINE = 1 << 0,
  REFERENCE = 1 << 1,
  DEFAULT = 1 << 2,

  STATIC = 1 << 3,
  USED = 1 << 4,
}

type Colors = {
  [key: string | number]: string | Colors
}

export default function flattenColorPalette(colors: Colors) {
  let result: Record<string, string> = {}

  for (let [root, children] of Object.entries(colors ?? {})) {
    if (root === '__CSS_VALUES__') continue
    if (typeof children === 'object' && children !== null) {
      for (let [parent, value] of Object.entries(flattenColorPalette(children))) {
        result[`${root}${parent === 'DEFAULT' ? '' : `-${parent}`}`] = value
      }
    } else {
      result[root] = children
    }
  }

  if ('__CSS_VALUES__' in colors) {
    for (let [key, value] of Object.entries(colors.__CSS_VALUES__)) {
      if ((Number(value) & ThemeOptions.DEFAULT) === 0) {
        result[key] = colors[key] as string
      }
    }
  }

  return result
}
