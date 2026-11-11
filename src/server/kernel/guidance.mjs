// Presentation derived from the guarded dashboard, never an authorization grant.
export function workspaceGuidance(tenant, products = []) {
  if (!tenant) return { message: 'اطلب الانضمام إلى مؤسسة من مسؤولها؛ تسجيل الدخول وحده لا يمنح وصولًا.', productSlug: null };
  const available = products.find(product => product.enabled === true && product.href === `/app/${product.slug}/`);
  if (available) return {
    message: available.accessSource === 'INTERNAL_EXPLORATION_48H'
      ? 'ابدأ بتصفح المنتج ضمن منحة الاستكشاف. تنفيذ العمليات يحتاج صلاحية مستقلة.'
      : 'افتح المنتج المتاح لمؤسستك؛ يتحقق الخادم من صلاحية كل عملية عند تنفيذها.',
    productSlug: available.slug,
  };
  return { message: ['OWNER', 'ADMIN'].includes(tenant.role)
    ? 'راجع قرارات إتاحة المنتجات مع مشغّل التجارب. دورك في المؤسسة لا يمنح صلاحية المشغّل.'
    : 'اطلب من مسؤول مؤسستك مراجعة إتاحة المنتج المطلوب؛ لا توجد مساحة منتج متاحة الآن.', productSlug: null };
}
