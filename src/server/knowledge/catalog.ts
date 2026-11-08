import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { articles, products } from '../../data/knowledge';
import { newGuides } from '../../data/knowledge-guides';
import { summarizeDocument } from './document.mjs';

const pages = import.meta.glob('../../pages/knowledge/*.astro');
// Render actual pages at build time, including their dynamic sections and components.
export async function knowledgeCatalog() {
  const container = await AstroContainer.create();
  const entries = [];
  for (const article of articles) {
    const slug = article.href.split('/')[2];
    const guide = newGuides.find(item => item.slug === slug);
    const loader = pages[`../../pages/knowledge/${slug}.astro`] ?? pages['../../pages/knowledge/[article].astro'];
    if (!loader || (!pages[`../../pages/knowledge/${slug}.astro`] && !guide)) throw new Error(`Missing knowledge page: ${slug}`);
    const page = await loader();
    const html = await container.renderToString((page as { default: any }).default, {
      request: new Request(`https://brightai.live${article.href}`),
      props: guide ? { guide } : {},
    });
    const summary = summarizeDocument(html);
    const linkedProducts = products.filter(([id]) => id === 'kernel'
      ? /href=["']\/app\/kernel\/|AIGAS Kernel|AIGAS\s+Kernel/.test(summary.body)
      : summary.body.includes(`/products/${id}/`)).map(([id]) => id);
    const extraTopics = [
      ...(/الشفافية|المساءلة/.test(summary.text) ? ['transparency'] : []),
      ...(summary.headings.some(h => /أسئلة شائعة|الأسئلة الشائعة/.test(h.title)) ? ['faq'] : []),
    ];
    entries.push({ ...article, products: linkedProducts, topics: [...new Set([article.topic, ...extraTopics])], headings: summary.headings, minutes: summary.minutes });
  }
  return entries;
}
