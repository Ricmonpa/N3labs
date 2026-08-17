import { Fragment, type ReactNode } from "react";

const HREF = "/#ia-fisica";
const LINK_CLASS =
  "text-red-400 underline decoration-red-500/40 underline-offset-2 hover:text-red-300 transition-colors";

// Whole-word "física"/"fisica" (accent optional), case-insensitive.
// Lookarounds avoid matching inside words like "metafísica" / "físicamente".
const RX = /(?<![\p{L}])(f[íi]sica)(?![\p{L}])/giu;

/**
 * Returns the given text with every standalone occurrence of the word
 * "física/fisica" turned into a link to the IA Física section. React owns the
 * output, so language switching keeps working.
 */
export function linkFisica(text: string): ReactNode {
  const out: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  RX.lastIndex = 0;
  let key = 0;
  while ((m = RX.exec(text))) {
    if (m.index > last) out.push(<Fragment key={key++}>{text.slice(last, m.index)}</Fragment>);
    out.push(
      <a key={key++} href={HREF} className={LINK_CLASS}>
        {m[0]}
      </a>
    );
    last = m.index + m[0].length;
  }
  if (out.length === 0) return text;
  if (last < text.length) out.push(<Fragment key={key++}>{text.slice(last)}</Fragment>);
  return out;
}
