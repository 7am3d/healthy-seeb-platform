/**
 * The staff "Add post" form uses a plain text box with a small toolbar (as in the UI/UX design).
 * Its text uses a few simple marks, converted to and from Payload's rich text (Lexical) here:
 *
 *   **bold**    *italic*    - list item    ->centred line<-
 *
 * Each line becomes a paragraph; consecutive "- " lines become one bullet list.
 */

type TextNode = {
  type: 'text'
  version: 1
  text: string
  format: number
  detail: 0
  mode: 'normal'
  style: ''
}

type Direction = 'rtl' | 'ltr'

type ElementNode = {
  type: string
  version: 1
  direction: Direction | null
  format: '' | 'center' | 'left' | 'right' | 'start' | 'end' | 'justify'
  indent: 0
  children: Array<ElementNode | TextNode>
  [key: string]: unknown
}

export type LexicalState = { root: ElementNode }

const BOLD = 1
const ITALIC = 2

const CENTER = /^->\s?(.*?)\s?<-$/
const LIST_ITEM = /^\s*[-•]\s+(.*)$/
const INLINE = /(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*\s][^*]*\*)/

const directionOf = (text: string): Direction => (/[؀-ۿ]/.test(text) ? 'rtl' : 'ltr')

function inline(text: string): TextNode[] {
  return text
    .split(INLINE)
    .filter(Boolean)
    .map((part) => {
      let format = 0
      let value = part
      if (/^\*\*\*.+\*\*\*$/.test(part)) {
        format = BOLD | ITALIC
        value = part.slice(3, -3)
      } else if (/^\*\*.+\*\*$/.test(part)) {
        format = BOLD
        value = part.slice(2, -2)
      } else if (/^\*.+\*$/.test(part)) {
        format = ITALIC
        value = part.slice(1, -1)
      }
      return { type: 'text', version: 1, text: value, format, detail: 0, mode: 'normal', style: '' }
    })
}

/** Text from the post form → Payload rich text. */
export function textToLexical(text: string): LexicalState {
  const direction = directionOf(text)
  const children: ElementNode[] = []
  let list: ElementNode | null = null

  for (const raw of text.replace(/\r\n?/g, '\n').split('\n')) {
    const line = raw.trimEnd()
    if (!line.trim()) {
      list = null
      continue
    }

    const item = LIST_ITEM.exec(line)
    if (item) {
      if (!list) {
        list = {
          type: 'list',
          version: 1,
          direction,
          format: '',
          indent: 0,
          listType: 'bullet',
          start: 1,
          tag: 'ul',
          children: [],
        }
        children.push(list)
      }
      list.children.push({
        type: 'listitem',
        version: 1,
        direction,
        format: '',
        indent: 0,
        value: list.children.length + 1,
        children: inline(item[1]),
      })
      continue
    }

    list = null
    const centred = CENTER.exec(line.trim())
    children.push({
      type: 'paragraph',
      version: 1,
      direction,
      format: centred ? 'center' : '',
      indent: 0,
      textFormat: 0,
      textStyle: '',
      children: inline(centred ? centred[1] : line),
    })
  }

  return {
    root: { type: 'root', version: 1, direction, format: '', indent: 0, children },
  }
}

type AnyNode = {
  type?: string
  text?: string
  format?: number | string
  children?: AnyNode[]
}

function inlineText(nodes: AnyNode[] = []): string {
  return nodes
    .map((node) => {
      if (node.type === 'linebreak') return ' '
      if (node.type === 'text') {
        const text = node.text ?? ''
        const format = typeof node.format === 'number' ? node.format : 0
        if (!text.trim()) return text
        if ((format & BOLD) !== 0 && (format & ITALIC) !== 0) return `***${text}***`
        if ((format & BOLD) !== 0) return `**${text}**`
        if ((format & ITALIC) !== 0) return `*${text}*`
        return text
      }
      return inlineText(node.children)
    })
    .join('')
}

/** Payload rich text → text for the post form. */
export function lexicalToText(state: unknown): string {
  const root = (state as { root?: AnyNode } | null)?.root
  if (!root?.children) return ''

  const lines: string[] = []
  for (const node of root.children) {
    if (node.type === 'list') {
      for (const item of node.children ?? []) lines.push(`- ${inlineText(item.children)}`)
    } else {
      const text = inlineText(node.children)
      lines.push(node.format === 'center' && text ? `->${text}<-` : text)
    }
  }
  return lines.join('\n').trim()
}

/** The text without the formatting marks (used for the post summary). */
export const plainText = (text: string) =>
  text
    .split('\n')
    .map((line) =>
      line
        .replace(LIST_ITEM, '$1')
        .replace(CENTER, '$1')
        .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')
        .trim(),
    )
    .filter(Boolean)
    .join(' ')
