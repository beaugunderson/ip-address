#!/usr/bin/env tsx

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as TypeDoc from 'typedoc';

const ROOT = path.resolve(__dirname, '..');
const TEMPLATE_PATH = path.join(ROOT, 'scripts/readme-template.md');
const README_PATH = path.join(ROOT, 'README.md');
const ENTRY_POINTS = [path.join(ROOT, 'src/ip-address.ts')];
const REPO_BLOB_BASE = 'https://github.com/beaugunderson/ip-address/blob/master';

const START_MARKER = '<!-- API:START -->';
const END_MARKER = '<!-- API:END -->';

type SourceRef = { fileName: string; line: number };

function summaryFor(reflection: TypeDoc.Reflection): string {
  const parts = reflection.comment?.summary;
  if (!parts || parts.length === 0) return '';
  return parts
    .map((p) => p.text)
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
}

function renderType(type: TypeDoc.SomeType | undefined): string {
  return type ? type.toString() : 'void';
}

function renderSignature(name: string, sig: TypeDoc.SignatureReflection): string {
  const params = (sig.parameters ?? [])
    .map((p) => {
      const optional = p.flags.isOptional ? '?' : '';
      const typeStr = renderType(p.type);
      return `${p.name}${optional}: ${typeStr}`;
    })
    .join(', ');
  const returnType = renderType(sig.type);
  return `${name}(${params}): ${returnType}`;
}

function sourceLink(sources: SourceRef[] | undefined): string {
  if (!sources || sources.length === 0) return '';
  const { fileName, line } = sources[0];
  const relativePath = fileName.startsWith('src/') ? fileName : `src/${fileName}`;
  return `[src](${REPO_BLOB_BASE}/${relativePath}#L${line})`;
}

function renderMethod(method: TypeDoc.DeclarationReflection): string[] {
  const { isStatic } = method.flags;
  const sigs = method.signatures ?? [];
  const lines: string[] = [];

  for (const sig of sigs) {
    const prefix = isStatic ? 'static ' : '';
    const code = `\`${prefix}${renderSignature(method.name, sig)}\``;
    const summary = summaryFor(sig) || summaryFor(method);
    const link = sourceLink(method.sources as SourceRef[] | undefined);
    const tail = [summary, link].filter(Boolean).join(' ');
    lines.push(`- ${code}${tail ? ` — ${tail}` : ''}`);
  }

  return lines;
}

function renderProperty(prop: TypeDoc.DeclarationReflection): string {
  const { isStatic } = prop.flags;
  const prefix = isStatic ? 'static ' : '';
  const typeStr = renderType(prop.type);
  const code = `\`${prefix}${prop.name}: ${typeStr}\``;
  const summary = summaryFor(prop);
  const link = sourceLink(prop.sources as SourceRef[] | undefined);
  const tail = [summary, link].filter(Boolean).join(' ');
  return `- ${code}${tail ? ` — ${tail}` : ''}`;
}

const CLASS_ORDER = ['Address4', 'Address6', 'AddressError'];

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * The one-line blurb shown next to the class name on the collapsed row. The
 * summary is markdown, but a `<summary>` element renders HTML rather than
 * markdown, so backtick spans become `<code>` and the rest is escaped.
 */
function renderSummaryLine(summary: string): string {
  return summary
    .split(/(`[^`]+`)/)
    .map((part) =>
      part.startsWith('`') && part.endsWith('`') && part.length > 1
        ? `<code>${escapeHtml(part.slice(1, -1))}</code>`
        : escapeHtml(part),
    )
    .join('');
}

function firstSentence(summary: string): string {
  const match = summary.match(/^(.*?[.!?])(\s|$)/);
  return match ? match[1] : summary;
}

function renderClass(cls: TypeDoc.DeclarationReflection): string {
  const out: string[] = [];
  const summary = summaryFor(cls);
  const anchor = cls.name.toLowerCase();

  // Each class is collapsed so the reader can open one at a time; the API
  // block is tens of thousands of characters when laid out flat. The anchor
  // keeps `README.md#address6` style deep links working now that the class
  // name lives in a `<summary>` rather than a markdown heading.
  const lead = summary ? firstSentence(summary) : '';
  const blurb = lead ? ` — ${renderSummaryLine(lead)}` : '';
  out.push('<details>');
  out.push(
    `<summary><a id="${anchor}"></a><strong>${escapeHtml(cls.name)}</strong>${blurb}</summary>`,
  );
  out.push('');

  // The collapsed row already carries the first sentence, so the body repeats
  // the summary only when there is more to it than that.
  if (summary && summary !== lead) {
    out.push(summary);
    out.push('');
  }

  const ctor = cls.children?.find((c) => c.kind === TypeDoc.ReflectionKind.Constructor);
  if (ctor && ctor.signatures) {
    out.push('**Constructor**');
    out.push('');
    for (const sig of ctor.signatures) {
      out.push(`- \`new ${renderSignature(cls.name, sig)}\``);
    }
    out.push('');
  }

  const staticMethods: string[] = [];
  const instanceMethods: string[] = [];
  const properties: string[] = [];

  for (const child of cls.children ?? []) {
    if (child.flags.isPrivate) continue;
    if (child.name.startsWith('_')) continue;

    if (child.kind === TypeDoc.ReflectionKind.Method) {
      const rendered = renderMethod(child);
      if (child.flags.isStatic) staticMethods.push(...rendered);
      else instanceMethods.push(...rendered);
    } else if (child.kind === TypeDoc.ReflectionKind.Property) {
      properties.push(renderProperty(child));
    }
  }

  if (staticMethods.length) {
    out.push('**Static methods**');
    out.push('');
    out.push(...staticMethods);
    out.push('');
  }
  if (instanceMethods.length) {
    out.push('**Instance methods**');
    out.push('');
    out.push(...instanceMethods);
    out.push('');
  }
  if (properties.length) {
    out.push('**Properties**');
    out.push('');
    out.push(...properties);
    out.push('');
  }

  out.push('</details>');
  out.push('');

  return out.join('\n');
}

async function main() {
  const app = await TypeDoc.Application.bootstrapWithPlugins({
    entryPoints: ENTRY_POINTS,
    tsconfig: path.join(ROOT, 'tsconfig.json'),
    excludePrivate: true,
    excludeInternal: true,
    excludeExternals: true,
    skipErrorChecking: true,
    sort: ['source-order'],
    logLevel: 'Error',
    blockTags: ['@param', '@returns', '@example', '@throws', '@deprecated', '@see'],
  });

  const project = await app.convert();
  if (!project) throw new Error('TypeDoc failed to convert the project');

  const classes = (project.children ?? [])
    .filter((c) => c.kind === TypeDoc.ReflectionKind.Class)
    .sort((a, b) => CLASS_ORDER.indexOf(a.name) - CLASS_ORDER.indexOf(b.name));

  const sections: string[] = [];
  for (const cls of classes) {
    sections.push(renderClass(cls));
  }

  const apiBlock = sections.join('\n').trimEnd();
  const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');

  const startIdx = template.indexOf(START_MARKER);
  const endIdx = template.indexOf(END_MARKER);
  if (startIdx === -1 || endIdx === -1) {
    throw new Error(`Markers ${START_MARKER} / ${END_MARKER} not found in template`);
  }

  const before = template.slice(0, startIdx + START_MARKER.length);
  const after = template.slice(endIdx);
  const next = `${before}\n\n${apiBlock}\n\n${after}`;

  fs.writeFileSync(README_PATH, next);
  console.log(`Wrote ${README_PATH} (${classes.length} classes, ${apiBlock.length} chars of API)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
