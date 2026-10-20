import html
import re
from dataclasses import dataclass, field

FLAGS = {
    'g': ('🟢', 'Direct translation', 'green'),
    'y': ('🟡', 'Same goal, different mechanics', 'yellow'),
    'r': ('🔴', 'New mental model', 'red'),
}


def inline(text: str) -> str:
    """Tiny inline markdown: `code`, **bold**, *em*, [text](url). Everything else is escaped."""
    out = []
    pos = 0
    pattern = re.compile(r'`([^`]+)`|\*\*(.+?)\*\*|\*(.+?)\*|\[([^\]]+)\]\(([^)]+)\)')
    for m in pattern.finditer(text):
        out.append(html.escape(text[pos:m.start()], quote=False))
        if m.group(1) is not None:
            out.append(f'<code>{html.escape(m.group(1), quote=False)}</code>')
        elif m.group(2) is not None:
            out.append(f'<strong>{inline(m.group(2))}</strong>')
        elif m.group(3) is not None:
            out.append(f'<em>{inline(m.group(3))}</em>')
        else:
            out.append(f'<a href="{html.escape(m.group(5))}">{inline(m.group(4))}</a>')
        pos = m.end()
    out.append(html.escape(text[pos:], quote=False))
    return ''.join(out)


def md(text: str) -> str:
    """Paragraphs separated by blank lines; '- ' lines become a list."""
    blocks = [b.strip('\n') for b in re.split(r'\n\s*\n', text.strip()) if b.strip()]
    out = []
    for block in blocks:
        lines = [l.strip() for l in block.split('\n')]
        if all(l.startswith('- ') for l in lines):
            out.append('<ul>' + ''.join(f'<li>{inline(l[2:])}</li>' for l in lines) + '</ul>')
        else:
            out.append(f'<p>{inline(" ".join(lines))}</p>')
    return '\n'.join(out)


def dedent(code: str) -> str:
    lines = code.strip('\n').split('\n')
    indent = min((len(l) - len(l.lstrip()) for l in lines if l.strip()), default=0)
    return '\n'.join(l[indent:] for l in lines)


@dataclass
class Concept:
    flag: str  # 'g' | 'y' | 'r'
    title: str
    body: str
    ember: str
    react: str
    ember_lang: str = 'handlebars'
    react_lang: str = 'tsx'
    ember_label: str = 'Ember'
    react_label: str = 'React'


@dataclass
class Exercise:
    files: list
    command: str
    criteria: list
    stretch: str
    intro: str = ''


@dataclass
class Day:
    n: int
    week: int
    title: str
    tagline: str
    concepts: list
    exercise: Exercise
    drill: list  # (question, answer_markdown)
    plan: tuple = ('Concepts', 'Hands-on', 'Interview drill')
    extra_html: str = ''
