import { productForSlug } from './product-navigation.mjs';

const LAST_LAB_KEY = 'aigas:lab:last';

export function rememberLastLab(slug, getStorage = () => globalThis.sessionStorage) {
  if (!productForSlug(slug)) return false;
  try {
    getStorage().setItem(LAST_LAB_KEY, slug);
    return true;
  } catch {
    return false;
  }
}

export function readLastLab(getStorage = () => globalThis.sessionStorage) {
  try {
    return { available: true, product: productForSlug(getStorage().getItem(LAST_LAB_KEY)) };
  } catch {
    return { available: false, product: null };
  }
}
