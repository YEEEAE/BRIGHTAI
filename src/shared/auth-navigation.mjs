import { productEntryPath, productForReturnTo } from './product-navigation.mjs';

const invitationPath = '/auth/accept-invitation/';
const invitationQuery = `${invitationPath}?invitationId=`;
const uuid = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;

export const invitationId = value => typeof value === 'string' && uuid.test(value) ? value : '';
export const invitationReturn = id => invitationId(id) ? `${invitationPath}?invitationId=${id}` : invitationPath;

export function authDestination(params) {
  const returnTo = params.get('returnTo');
  const id = returnTo?.startsWith(invitationQuery) ? invitationId(returnTo.slice(invitationQuery.length)) : '';
  if (returnTo === invitationPath || id) return { path: invitationReturn(id), auto: true, product: null };
  if (params.get('trial') === '48h' || returnTo === '/app/trial/') return { path: '/app/trial/', auto: true, product: null };
  if (returnTo === '/app/kernel/') return { path: returnTo, auto: true, product: null };
  const product = productForReturnTo(returnTo);
  return product
    ? { path: productEntryPath(product.slug), auto: true, product }
    : { path: '/app/kernel/', auto: false, product: null };
}
