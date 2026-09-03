/**
 * Remove the legacy FAQ microdata attributes from blog HTML.
 *
 * The old articles marked FAQPage on a wrapper and put acceptedAnswer on a
 * sibling of the Question node. That is invalid Schema.org microdata and
 * causes Semrush error 45 (missing mainEntity / unrecognised acceptedAnswer).
 * FAQ JSON-LD emitted by the blog page remains the canonical structured data.
 */
export function rehypeStripLegacyFaqMicrodata() {
  return function transform(tree) {
    const visit = (node) => {
      if (!node || typeof node !== 'object') return;
      if (node.type === 'element' && node.properties) {
        delete node.properties.itemScope;
        delete node.properties.itemType;
        delete node.properties.itemProp;
      }
      if (Array.isArray(node.children)) node.children.forEach(visit);
    };
    visit(tree);
  };
}
