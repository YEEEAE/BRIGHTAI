export const complaint = 'تأخرت شحنتي ثلاثة أيام. مرجع العميل الافتراضي DEMO-0000. متى تصل؟';

export const complaintStations = [
  { slug: 'firewall', question: 'نقّح الشكوى قبل صياغة الرد' },
  { slug: 'secure-chat', question: 'صغ مسودة من الشكوى المنقّحة' },
  { slug: 'risk-engine', question: 'قيّم خطر الوعد بالاسترجاع' },
  { slug: 'human-gate', question: 'راجع المسودة واتخذ قرارًا' },
  { slug: 'ledger', question: 'تتبّع ما حدث في هذه التجربة' },
] as const;

export function complaintPath(slug: string = complaintStations[0].slug) {
  return `/products/${slug}/complaint/#lab`;
}
