# Realtime Updates

## الهدف
توضيح تحديثات Excel الحية عبر Socket.io و`backend/watchers/excelWatcher.js`.

## الحالة
Status: Implemented جزئياً. الكود يحتوي watcher وSocket events مثل `data:updated` و`data:update_failed`.

## السيناريو
عند تغير Excel، Backend يعيد التحميل، يبطل AI cache، ثم يرسل event للواجهة. لازم نختبر هذا على الملف الأسبوعي الحقيقي.

## Related Docs
- [Excel Data Source](./excel-data-source.md)
- [Data API](../04-api/data-api.md)
- [Excel Update Test](../06-testing/excel-update-test.md)
- [Troubleshooting](../07-deployment/troubleshooting.md)

