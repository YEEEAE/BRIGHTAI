const labels: Record<string, string> = {
  'available': 'متاح',
  'not configured': 'غير مهيأ',
  'degraded': 'يعمل بقدرة محدودة',
  'blocked': 'محجوب',
  'access denied': 'الوصول غير متاح',
  'expired': 'انتهت الصلاحية',
  'temporarily unavailable': 'غير متاح مؤقتًا',
};
const products: Record<string, string> = {
  'kernel-policy': 'سياسة Kernel',
  'human-gate': 'Human Gate',
  'risk-engine': 'Risk Engine',
  'ledger': 'Ledger',
};
type Dependency = { product: string; status?: string; evaluated?: boolean; required?: boolean; blocking?: boolean };

export function dependencyStatusLabel(status?: string) {
  return status ? labels[status] ?? 'غير مؤكدة' : '';
}

export function dependencyMessages(dependencies?: Record<string, Dependency>) {
  return Object.values(dependencies ?? {}).map(dependency => {
    const status = dependency.evaluated === false ? 'خارج مسار العملية' : dependencyStatusLabel(dependency.status) || 'غير مؤكدة';
    const effect = dependency.blocking ? ' · يحجب المسار' : dependency.required ? ' · مطلوب' : '';
    return `${products[dependency.product] ?? dependency.product} — ${status}${effect}`;
  });
}

export function dependencyErrorMessage(message: string, status?: string) {
  const label = dependencyStatusLabel(status);
  return label ? `${message} حالة الاعتماد: ${label}.` : message;
}
