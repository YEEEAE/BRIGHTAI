import { productForSlug } from './product-navigation.mjs';

export const accessTracks = Object.freeze({
  trial: { label: 'تجربة محدودة', request: 'طلب تجربة محدودة' },
  beta: { label: 'نسخة تجريبية مغلقة', request: 'طلب دعوة للنسخة التجريبية المغلقة' },
  production: { label: 'تشغيل مؤسسي', request: 'طلب مراجعة للتشغيل المؤسسي' },
});

export const accessTrack = value => Object.hasOwn(accessTracks, value) ? value : 'trial';

export function accessPath(slug, track = 'trial') {
  const query = new URLSearchParams();
  if (track !== 'trial') query.set('track', accessTrack(track));
  const product = productForSlug(slug);
  if (product) query.set('product', product.slug);
  return query.size ? `/request-access/?${query}` : '/request-access/';
}

export function trialPath(slug) {
  const product = productForSlug(slug);
  return product ? `/app/trial/?product=${product.slug}` : '/app/trial/';
}

export function trialAccountPath(slug) {
  const product = productForSlug(slug);
  return `/auth/sign-up/?trial=48h${product ? `&product=${product.slug}` : ''}`;
}
