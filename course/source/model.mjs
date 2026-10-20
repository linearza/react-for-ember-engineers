export const FLAGS = {
  g: ['🟢', 'Direct translation', 'green'],
  y: ['🟡', 'Same goal, different mechanics', 'yellow'],
  r: ['🔴', 'New mental model', 'red'],
};

/** HTML-escape like Python's html.escape: quotes too unless quote is false. */
export function escape(s, quote = true) {
  s = s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return quote ? s.replace(/"/g, '&quot;').replace(/'/g, '&#x27;') : s;
}

/** Tiny inline markdown: `code`, **bold**, *em*, [text](url). Everything else is escaped. */
export function inline(text) {
  const pattern = /`([^`]+)`|\*\*(.+?)\*\*|\*(.+?)\*|\[([^\]]+)\]\(([^)]+)\)/g;
  let out = '';
  let pos = 0;
  for (const m of text.matchAll(pattern)) {
    out += escape(text.slice(pos, m.index), false);
    if (m[1] !== undefined) out += `<code>${escape(m[1], false)}</code>`;
    else if (m[2] !== undefined) out += `<strong>${inline(m[2])}</strong>`;
    else if (m[3] !== undefined) out += `<em>${inline(m[3])}</em>`;
    else out += `<a href="${escape(m[5])}">${inline(m[4])}</a>`;
    pos = m.index + m[0].length;
  }
  return out + escape(text.slice(pos), false);
}

/** Paragraphs separated by blank lines; '- ' lines become a list. */
export function md(text) {
  const blocks = text.trim().split(/\n\s*\n/).filter((b) => b.trim()).map((b) => b.replace(/^\n+|\n+$/g, ''));
  return blocks.map((block) => {
    const lines = block.split('\n').map((l) => l.trim());
    if (lines.every((l) => l.startsWith('- '))) return '<ul>' + lines.map((l) => `<li>${inline(l.slice(2))}</li>`).join('') + '</ul>';
    return `<p>${inline(lines.join(' '))}</p>`;
  }).join('\n');
}

export function dedent(code) {
  const lines = code.replace(/^\n+|\n+$/g, '').split('\n');
  const indents = lines.filter((l) => l.trim()).map((l) => l.length - l.trimStart().length);
  const indent = indents.length ? Math.min(...indents) : 0;
  return lines.map((l) => l.slice(indent)).join('\n');
}

/** A concept section. flag: 'g' | 'y' | 'r' */
export function C(flag, title, body, ember, react, { emberLang = 'handlebars', reactLang = 'tsx', emberLabel = 'Ember', reactLabel = 'React' } = {}) {
  return { flag, title, body, ember, react, emberLang, reactLang, emberLabel, reactLabel };
}

/** A day. drill is a list of [question, answerMarkdown]; quiz.mjs adds the multiple-choice options. */
export function Day({ plan = ['Concepts', 'Hands-on', 'Check yourself'], exercise, ...rest }) {
  return { ...rest, plan, exercise: { intro: '', ...exercise } };
}
