import type { Snippet } from 'svelte'
import type * as CSS from 'csstype'

export type StyleProperties = CSS.Properties & {
  // Allow any CSS Custom Properties
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [str: `--${string}`]: any
}

export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, 'children'> : T
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, 'child'> : T
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null }

export type WithChild<
  /**
   * The props that the component accepts.
   */
  Props extends Record<PropertyKey, unknown> = {},
  /**
   * The props that are passed to the `child` and `children` snippets. The `ElementProps` are
   * merged with these props for the `child` snippet.
   */
  SnippetProps extends Record<PropertyKey, unknown> = { _default: never },
  /**
   * The underlying DOM element being rendered. You can bind to this prop to
   * programmatically interact with the element.
   */
  Ref = HTMLElement,
> = Omit<Props, 'child' | 'children'> & {
  child?: SnippetProps extends { _default: never }
    ? Snippet<[{ props: Record<string, unknown> }]>
    : Snippet<[SnippetProps & { props: Record<string, unknown> }]>
  children?: SnippetProps extends { _default: never } ? Snippet : Snippet<[SnippetProps]>
  style?: StyleProperties | string | null | undefined
  ref?: Ref | null | undefined
}

export type WithChildNoChildrenSnippetProps<
  /**
   * The props that the component accepts.
   */
  Props extends Record<PropertyKey, unknown> = {},
  /**
   * The props that are passed to the `child` and `children` snippets. The `ElementProps` are
   * merged with these props for the `child` snippet.
   */
  SnippetProps extends Record<PropertyKey, unknown> = { _default: never },
  /**
   * The underlying DOM element being rendered. You can bind to this prop to
   * programmatically interact with the element.
   */
  Ref = HTMLElement,
> = Omit<Props, 'child' | 'children'> & {
  child?: SnippetProps extends { _default: never }
    ? Snippet<[{ props: Record<string, unknown> }]>
    : Snippet<[SnippetProps & { props: Record<string, unknown> }]>
  children?: Snippet
  style?: StyleProperties | string | null | undefined
  ref?: Ref | null | undefined
}

export type WithChildren<Props = {}> = Props & {
  children?: Snippet | undefined
}

/**
 * Constructs a new type by omitting properties from type
 * 'T' that exist in type 'U'.
 *
 * @template T - The base object type from which properties will be omitted.
 * @template U - The object type whose properties will be omitted from 'T'.
 * @example
 * type Result = Without<{ a: number; b: string; }, { b: string; }>;
 * // Result type will be { a: number; }
 */
export type Without<T extends object, U extends object> = Omit<T, keyof U>
