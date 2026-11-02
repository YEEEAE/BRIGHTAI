import './polyfills.js';
import * as pdfjsLib from '../vendor/pdf.min.mjs';
import PDF_WORKER_CODE from './pdf-worker.generated.js';

window.__ModuleLoader__.load({
  id: '@local/paper-reader',
  factory(require) {
    const React = require('react');
    const {
      useCallback,
      useEffect,
      useMemo,
      useRef,
      useState,
      useSyncExternalStore,
    } = React;
    const h = React.createElement;

    const NS = 'paperReader';
    const ID = '@local/paper-reader';
    const KIND = 'paper-reader';
    const DB_NAME = 'dsh-paper-reader';
    const DB_VERSION = 1;
    const ACTIVE_KEY = 'dsh.paper-reader.active.v1';
    const MAX_BYTES = 100 * 1024 * 1024;
    const MAX_ASK_CHARS = 8000;

    const DICTS = {
      en: {
        tabTitle: 'Paper Reader',
        guideTitle: 'Paper Reader',
        guideDescription: 'Read PDFs with highlights, notes, and chat.',
        title: 'Paper Reader',
        subtitle: 'PDFs, originals preserved',
        addPaper: 'Add PDF',
        uploading: 'Saving paper…',
        backToLibrary: 'Back to library',
        page: 'Page',
        pageOf: '{current} / {total}',
        pagesCount: '{n} pages',
        pagesCountOne: '1 page',
        paperCount: '{n} papers',
        paperCountOne: '1 paper',
        yourPapers: 'Your papers',
        localOnly: 'Stored only in this browser',
        emptyTitle: 'No papers yet',
        emptyBody: 'Upload a PDF to start reading. Its original pages, fonts, images, and file are kept intact.',
        dropTitle: 'Drop a PDF here',
        dropBody: 'or choose a file from your device.',
        dropRelease: 'Release to add the paper',
        chooseFile: 'Choose PDF',
        features: 'Select any text to highlight it, add a note, or ask the conversation.',
        open: 'Open',
        deletePaper: 'Delete paper',
        confirmDelete: 'Delete this paper and every highlight and note?',
        downloadOriginal: 'Download original',
        deleteFailed: 'Could not delete the paper.',
        invalidPdf: 'This file is not a valid PDF.',
        tooLarge: 'This PDF is larger than 100 MB.',
        uploadFailed: 'Could not save the paper in this browser.',
        libraryLoadFailed: 'Could not load the paper library.',
        openFailed: 'Could not open this PDF.',
        pdfErrorTitle: 'This PDF could not be rendered',
        pdfErrorBody: 'The original file is safe. Try the original viewer or download it.',
        retry: 'Try again',
        loadingPaper: 'Opening paper…',
        loadingLibrary: 'Loading papers…',
        zoomOut: 'Zoom out',
        zoomIn: 'Zoom in',
        fitWidth: 'Fit width',
        zoomLevel: '{n}%',
        original: 'Original PDF',
        reader: 'Reader',
        originalHint: 'Native viewer with the untouched PDF.',
        readerHint: 'Selectable text with highlights and notes.',
        originalUnavailable: 'The original viewer is not available here. Download the file instead.',
        annotations: 'Annotations',
        annotationCount: '{n} annotations',
        noAnnotations: 'No highlights or notes yet',
        noAnnotationsBody: 'Select text in the paper to highlight it or add a note.',
        jump: 'Go to page',
        closeAnnotations: 'Close annotations',
        note: 'Note',
        highlight: 'Highlight',
        ask: 'Ask in chat',
        askShort: 'Ask',
        noteShort: 'Note',
        highlightShort: 'Highlight',
        menuLabel: 'Selected text actions',
        noteTitle: 'Add a note',
        notePlaceholder: 'Write what you want to remember…',
        saveNote: 'Save note',
        cancel: 'Cancel',
        deleteAnnotation: 'Delete annotation',
        quote: 'Selected text',
        characters: '{n} characters selected',
        savedHighlight: 'Highlight saved.',
        savedNote: 'Note saved.',
        deletedAnnotation: 'Annotation deleted.',
        questionSent: 'Question sent to the conversation.',
        questionFailed: 'Could not send the question.',
        questionCopied: 'Question copied to the clipboard.',
        readerFallback: 'Paper Reader could not load',
        readerFallbackBody: 'Close and reopen this tab to try again.',
        selectHint: 'Select text for actions',
        storageLocal: 'Original bytes preserved',
        annotationOnPage: 'Page {page}',
        createdOn: '{date}',
        annotationFailed: 'Could not save the annotation.',
        pageShort: 'p. {page}',
        size: '{size}',
        added: 'Added {date}',
        close: 'Close',
        fit: 'Fit',
        openAnnotations: 'Open annotations',
        menuHint: 'Highlight, note, or ask',
        askPrompt: 'Explain this passage from “{paper}” (page {page}). Respond in English.\n\n“{text}”',
      },
      ar: {
        tabTitle: 'قارئ الأوراق',
        guideTitle: 'قارئ الأوراق',
        guideDescription: 'اقرأ PDF مع التمييز والملاحظات والنقاش.',
        title: 'قارئ الأوراق',
        subtitle: 'ملفات PDF والأصل محفوظ',
        addPaper: 'أضف PDF',
        uploading: 'جارٍ حفظ الورقة…',
        backToLibrary: 'العودة إلى المكتبة',
        page: 'الصفحة',
        pageOf: '{current} / {total}',
        pagesCount: '{n} صفحات',
        pagesCountOne: 'صفحة واحدة',
        paperCount: '{n} أوراق',
        paperCountOne: 'ورقة واحدة',
        yourPapers: 'أوراقك',
        localOnly: 'محفوظة في هذا المتصفح فقط',
        emptyTitle: 'لا توجد أوراق بعد',
        emptyBody: 'ارفع ملف PDF لبدء القراءة. تبقى الصفحات والخطوط والصور والملف الأصلي كما هي.',
        dropTitle: 'أفلت ملف PDF هنا',
        dropBody: 'أو اختر ملفًا من جهازك.',
        dropRelease: 'أفلت لإضافة الورقة',
        chooseFile: 'اختر PDF',
        features: 'حدّد أي نص لتمييزه أو إضافة ملاحظة أو سؤال المحادثة عنه.',
        open: 'فتح',
        deletePaper: 'حذف الورقة',
        confirmDelete: 'حذف هذه الورقة وكل تمييزاتها وملاحظاتها؟',
        downloadOriginal: 'تنزيل الأصل',
        deleteFailed: 'تعذّر حذف الورقة.',
        invalidPdf: 'هذا الملف ليس PDF صالحًا.',
        tooLarge: 'حجم ملف PDF أكبر من 100 ميغابايت.',
        uploadFailed: 'تعذّر حفظ الورقة في هذا المتصفح.',
        libraryLoadFailed: 'تعذّر تحميل مكتبة الأوراق.',
        openFailed: 'تعذّر فتح ملف PDF هذا.',
        pdfErrorTitle: 'تعذّر عرض ملف PDF',
        pdfErrorBody: 'الملف الأصلي سليم. جرّب العارض الأصلي أو نزّله.',
        retry: 'إعادة المحاولة',
        loadingPaper: 'جارٍ فتح الورقة…',
        loadingLibrary: 'جارٍ تحميل الأوراق…',
        zoomOut: 'تصغير',
        zoomIn: 'تكبير',
        fitWidth: 'ملاءمة العرض',
        zoomLevel: '{n}٪',
        original: 'PDF الأصلي',
        reader: 'القارئ',
        originalHint: 'عارض أصلي للملف دون أي تغيير.',
        readerHint: 'نص قابل للتحديد مع التمييز والملاحظات.',
        originalUnavailable: 'العارض الأصلي غير متاح هنا. نزّل الملف بدلًا من ذلك.',
        annotations: 'التمييزات والملاحظات',
        annotationCount: '{n} تمييزات وملاحظات',
        noAnnotations: 'لا توجد تمييزات أو ملاحظات بعد',
        noAnnotationsBody: 'حدّد نصًا في الورقة لتمييزه أو إضافة ملاحظة.',
        jump: 'الانتقال إلى الصفحة',
        closeAnnotations: 'إغلاق التمييزات',
        note: 'ملاحظة',
        highlight: 'تمييز',
        ask: 'اسأل في المحادثة',
        askShort: 'اسأل',
        noteShort: 'ملاحظة',
        highlightShort: 'تمييز',
        menuLabel: 'إجراءات النص المحدد',
        noteTitle: 'إضافة ملاحظة',
        notePlaceholder: 'اكتب ما تريد تذكّره…',
        saveNote: 'حفظ الملاحظة',
        cancel: 'إلغاء',
        deleteAnnotation: 'حذف التمييز',
        quote: 'النص المحدد',
        characters: 'تم تحديد {n} حرفًا',
        savedHighlight: 'تم حفظ التمييز.',
        savedNote: 'تم حفظ الملاحظة.',
        deletedAnnotation: 'تم حذف التمييز.',
        questionSent: 'أُرسل السؤال إلى المحادثة.',
        questionFailed: 'تعذّر إرسال السؤال.',
        questionCopied: 'نُسخ السؤال إلى الحافظة.',
        readerFallback: 'تعذّر تحميل قارئ الأوراق',
        readerFallbackBody: 'أغلق هذه اللسان وأعد فتحه للمحاولة مجددًا.',
        selectHint: 'حدّد نصًا للإجراءات',
        storageLocal: 'بايتات الأصل محفوظة',
        annotationOnPage: 'الصفحة {page}',
        createdOn: '{date}',
        annotationFailed: 'تعذّر حفظ التمييز.',
        pageShort: 'ص {page}',
        size: '{size}',
        added: 'أُضيفت {date}',
        close: 'إغلاق',
        fit: 'ملاءمة',
        openAnnotations: 'فتح التمييزات',
        menuHint: 'تمييز أو ملاحظة أو سؤال',
        askPrompt: 'اشرح هذا المقطع من «{paper}» (الصفحة {page})، وأجب بالعربية.\n\n«{text}»',
      },
      zh: {
        tabTitle: '论文阅读器',
        guideTitle: '论文阅读器',
        guideDescription: '阅读 PDF，支持高亮、笔记和对话提问。',
        title: '论文阅读器',
        subtitle: 'PDF 原文完整保留',
        addPaper: '添加 PDF',
        uploading: '正在保存论文…',
        backToLibrary: '返回论文库',
        page: '页',
        pageOf: '{current} / {total}',
        pagesCount: '{n} 页',
        pagesCountOne: '1 页',
        paperCount: '{n} 篇论文',
        paperCountOne: '1 篇论文',
        yourPapers: '你的论文',
        localOnly: '仅保存在此浏览器',
        emptyTitle: '还没有论文',
        emptyBody: '上传 PDF 开始阅读。原始页面、字体、图像和文件都会完整保留。',
        dropTitle: '将 PDF 拖到这里',
        dropBody: '或从设备中选择文件。',
        dropRelease: '松手即可添加论文',
        chooseFile: '选择 PDF',
        features: '选中任意文字即可高亮、添加笔记，或向对话提问。',
        open: '打开',
        deletePaper: '删除论文',
        confirmDelete: '删除这篇论文及其所有高亮和笔记？',
        downloadOriginal: '下载原文件',
        deleteFailed: '无法删除论文。',
        invalidPdf: '这个文件不是有效的 PDF。',
        tooLarge: 'PDF 超过 100 MB。',
        uploadFailed: '无法在此浏览器中保存论文。',
        libraryLoadFailed: '无法加载论文库。',
        openFailed: '无法打开这个 PDF。',
        pdfErrorTitle: '无法渲染此 PDF',
        pdfErrorBody: '原始文件仍然安全。请尝试原始查看器或下载文件。',
        retry: '重试',
        loadingPaper: '正在打开论文…',
        loadingLibrary: '正在加载论文…',
        zoomOut: '缩小',
        zoomIn: '放大',
        fitWidth: '适应宽度',
        zoomLevel: '{n}%',
        original: '原始 PDF',
        reader: '阅读器',
        originalHint: '使用原生查看器显示未修改的 PDF。',
        readerHint: '可选文字，支持高亮和笔记。',
        originalUnavailable: '此处无法使用原始查看器，请下载文件。',
        annotations: '标注',
        annotationCount: '{n} 条标注',
        noAnnotations: '还没有高亮或笔记',
        noAnnotationsBody: '在论文中选中文字即可高亮或添加笔记。',
        jump: '跳转到页面',
        closeAnnotations: '关闭标注',
        note: '笔记',
        highlight: '高亮',
        ask: '在对话中提问',
        askShort: '提问',
        noteShort: '笔记',
        highlightShort: '高亮',
        menuLabel: '所选文字操作',
        noteTitle: '添加笔记',
        notePlaceholder: '写下你想记住的内容…',
        saveNote: '保存笔记',
        cancel: '取消',
        deleteAnnotation: '删除标注',
        quote: '所选文字',
        characters: '已选择 {n} 个字符',
        savedHighlight: '高亮已保存。',
        savedNote: '笔记已保存。',
        deletedAnnotation: '标注已删除。',
        questionSent: '问题已发送到对话。',
        questionFailed: '无法发送问题。',
        questionCopied: '问题已复制到剪贴板。',
        readerFallback: '论文阅读器无法加载',
        readerFallbackBody: '关闭并重新打开此标签页再试。',
        selectHint: '选中文字以操作',
        storageLocal: '原始字节完整保留',
        annotationOnPage: '第 {page} 页',
        createdOn: '{date}',
        annotationFailed: '无法保存标注。',
        pageShort: '第 {page} 页',
        size: '{size}',
        added: '添加于 {date}',
        close: '关闭',
        fit: '适应',
        openAnnotations: '打开标注',
        menuHint: '高亮、笔记或提问',
        askPrompt: '请解释《{paper}》第 {page} 页中的这段内容，并用中文回答。\n\n“{text}”',
      },
    };

    function interpolate(template, values) {
      return String(template).replace(/\{(\w+)\}/g, (match, key) => (
        values && values[key] !== undefined && values[key] !== null ? String(values[key]) : match
      ));
    }

    function translateFor(localeId, key, values) {
      const base = String(localeId || 'en').split('-')[0];
      const dict = DICTS[base] || DICTS.en;
      return interpolate(dict[key] || DICTS.en[key] || key, values);
    }

    function useLocale(localeService) {
      const subscribe = useCallback((fn) => localeService.subscribe(fn), [localeService]);
      const getRevision = useCallback(() => localeService.getSnapshot().revision, [localeService]);
      useSyncExternalStore(subscribe, getRevision, getRevision);
      const snapshot = localeService.getLocale();
      const active = snapshot.active || 'en';
      const t = useCallback((key, values) => translateFor(active, key, values), [active]);
      return { active, t, dir: String(active).split('-')[0] === 'ar' ? 'rtl' : 'ltr' };
    }

    function clamp(value, min, max) {
      return Math.min(max, Math.max(min, value));
    }

    function newId() {
      if (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') {
        return globalThis.crypto.randomUUID();
      }
      return `paper-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    }

    function sortPapers(list) {
      return [...list].sort((a, b) => (b.lastOpenedAt || b.addedAt || 0) - (a.lastOpenedAt || a.addedAt || 0));
    }

    function displayName(fileName) {
      return String(fileName || 'paper.pdf').replace(/\.pdf$/i, '') || 'paper';
    }

    function formatBytes(bytes, locale) {
      if (!Number.isFinite(bytes) || bytes <= 0) return '';
      const units = ['B', 'KB', 'MB', 'GB'];
      let value = bytes;
      let index = 0;
      while (value >= 1024 && index < units.length - 1) {
        value /= 1024;
        index += 1;
      }
      const number = new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : locale === 'zh' ? 'zh-CN' : 'en-US', {
        maximumFractionDigits: value >= 10 || index === 0 ? 0 : 1,
      }).format(value);
      return `${number} ${units[index]}`;
    }

    function formatDate(ts, locale) {
      if (!ts) return '';
      try {
        return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : locale === 'zh' ? 'zh-CN' : 'en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }).format(new Date(ts));
      } catch {
        return new Date(ts).toLocaleDateString();
      }
    }

    function pageRangeLabel(pages) {
      if (!pages || pages.length === 0) return '';
      const sorted = [...new Set(pages)].sort((a, b) => a - b);
      if (sorted.length === 1) return String(sorted[0]);
      return `${sorted[0]}–${sorted[sorted.length - 1]}`;
    }

    function isPdfBuffer(buffer) {
      if (!buffer || buffer.byteLength < 5) return false;
      const bytes = new Uint8Array(buffer, 0, 5);
      return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46 && bytes[4] === 0x2d;
    }

    class UserFacingError extends Error {
      constructor(message) {
        super(message);
        this.isUserFacing = true;
      }
    }

    // ---------------------------------------------------------------------
    // Local persistence: metadata in one store, untouched PDF bytes in another.
    // ---------------------------------------------------------------------

    let databasePromise = null;

    function openDatabase() {
      if (databasePromise) return databasePromise;
      databasePromise = new Promise((resolve, reject) => {
        if (!globalThis.indexedDB) {
          reject(new Error('IndexedDB is unavailable'));
          return;
        }
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains('papers')) db.createObjectStore('papers', { keyPath: 'id' });
          if (!db.objectStoreNames.contains('files')) db.createObjectStore('files', { keyPath: 'id' });
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => {
          databasePromise = null;
          reject(request.error || new Error('Could not open IndexedDB'));
        };
      });
      return databasePromise;
    }

    function requestResult(request) {
      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error || new Error('IndexedDB request failed'));
      });
    }

    function transactionDone(transaction) {
      return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error || new Error('IndexedDB transaction failed'));
        transaction.onabort = () => reject(transaction.error || new Error('IndexedDB transaction aborted'));
      });
    }

    async function listPaperRecords() {
      const db = await openDatabase();
      const store = db.transaction('papers', 'readonly').objectStore('papers');
      return requestResult(store.getAll());
    }

    async function getPaperRecord(id) {
      const db = await openDatabase();
      const store = db.transaction('papers', 'readonly').objectStore('papers');
      return requestResult(store.get(id));
    }

    async function getPaperFile(id) {
      const db = await openDatabase();
      const store = db.transaction('files', 'readonly').objectStore('files');
      const record = await requestResult(store.get(id));
      return record ? record.blob : null;
    }

    async function savePaperRecord(meta, blob) {
      const db = await openDatabase();
      const transaction = db.transaction(['papers', 'files'], 'readwrite');
      transaction.objectStore('papers').put(meta);
      transaction.objectStore('files').put({ id: meta.id, blob });
      await transactionDone(transaction);
    }

    async function updatePaperRecord(id, patch) {
      const db = await openDatabase();
      const transaction = db.transaction('papers', 'readwrite');
      const store = transaction.objectStore('papers');
      const record = await requestResult(store.get(id));
      if (!record) throw new Error('Paper record not found');
      store.put({ ...record, ...patch });
      await transactionDone(transaction);
    }

    async function removePaperRecord(id) {
      const db = await openDatabase();
      const transaction = db.transaction(['papers', 'files'], 'readwrite');
      transaction.objectStore('papers').delete(id);
      transaction.objectStore('files').delete(id);
      await transactionDone(transaction);
    }

    async function appendPaperAnnotation(id, annotation) {
      const db = await openDatabase();
      const transaction = db.transaction('papers', 'readwrite');
      const store = transaction.objectStore('papers');
      const record = await requestResult(store.get(id));
      if (!record) throw new Error('Paper record not found');
      const annotations = Array.isArray(record.annotations) ? [...record.annotations, annotation] : [annotation];
      store.put({ ...record, annotations });
      await transactionDone(transaction);
      return annotations;
    }

    async function deletePaperAnnotation(id, annotationId) {
      const db = await openDatabase();
      const transaction = db.transaction('papers', 'readwrite');
      const store = transaction.objectStore('papers');
      const record = await requestResult(store.get(id));
      if (!record) throw new Error('Paper record not found');
      const annotations = Array.isArray(record.annotations)
        ? record.annotations.filter((item) => item.id !== annotationId)
        : [];
      store.put({ ...record, annotations });
      await transactionDone(transaction);
      return annotations;
    }

    // ---------------------------------------------------------------------
    // PDF.js worker: keep the worker code in the bundle so the reader is offline.
    // ---------------------------------------------------------------------

    let pdfWorkerBlobUrl = null;
    const pdfWorkers = new Set();

    function createPdfWorker() {
      if (typeof Worker !== 'function') throw new Error('Web Workers are unavailable');
      if (!pdfWorkerBlobUrl) {
        const blob = new Blob([PDF_WORKER_CODE], { type: 'text/javascript' });
        pdfWorkerBlobUrl = URL.createObjectURL(blob);
      }
      const worker = new Worker(pdfWorkerBlobUrl, { type: 'module' });
      pdfWorkers.add(worker);
      pdfjsLib.GlobalWorkerOptions.workerPort = worker;
      return worker;
    }

    function releasePdfWorker(worker) {
      if (!worker) return;
      pdfWorkers.delete(worker);
      if (pdfjsLib.GlobalWorkerOptions.workerPort === worker) {
        pdfjsLib.GlobalWorkerOptions.workerPort = null;
      }
      try {
        worker.terminate();
      } catch {
        // Ignore teardown failures.
      }
    }

    function disposePdfWorkers() {
      for (const worker of [...pdfWorkers]) releasePdfWorker(worker);
      pdfjsLib.GlobalWorkerOptions.workerPort = null;
      if (pdfWorkerBlobUrl) {
        URL.revokeObjectURL(pdfWorkerBlobUrl);
        pdfWorkerBlobUrl = null;
      }
    }

    // ---------------------------------------------------------------------
    // Icons. Kept inline so the plugin has no runtime asset dependency.
    // ---------------------------------------------------------------------

    function Icon({ children, size = 16 }) {
      return h('svg', {
        width: size,
        height: size,
        viewBox: '0 0 24 24',
        fill: 'none',
        'aria-hidden': 'true',
        className: 'pr-icon',
      }, children);
    }

    function BookIcon({ size = 18 }) {
      return h(Icon, { size }, h('path', {
        d: 'M5.5 4.5h8.2A2.8 2.8 0 0 1 16.5 7.3v12.2H8.3a2.8 2.8 0 0 0-2.8 2.8V4.5Z',
        stroke: 'currentColor',
        strokeWidth: 1.6,
        strokeLinejoin: 'round',
      }), h('path', {
        d: 'M5.5 20.5A2.5 2.5 0 0 1 8 18h8.5M9 8h4.5M9 11h4.5',
        stroke: 'currentColor',
        strokeWidth: 1.5,
        strokeLinecap: 'round',
      }), h('path', {
        d: 'M17.8 8.5 21 10.2v8.3l-3.2 1.6',
        stroke: 'currentColor',
        strokeWidth: 1.4,
        strokeLinejoin: 'round',
        opacity: '.7',
      }));
    }

    function BackIcon() {
      return h(Icon, null, h('path', {
        d: 'M14.5 5.5 8 12l6.5 6.5',
        stroke: 'currentColor',
        strokeWidth: 1.8,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
      }));
    }

    function PlusIcon() {
      return h(Icon, null, h('path', {
        d: 'M12 5v14M5 12h14',
        stroke: 'currentColor',
        strokeWidth: 1.8,
        strokeLinecap: 'round',
      }));
    }

    function DownloadIcon() {
      return h(Icon, null, h('path', {
        d: 'M12 4.5v10m0 0 3.6-3.6M12 14.5l-3.6-3.6M5 17.5v2h14v-2',
        stroke: 'currentColor',
        strokeWidth: 1.6,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
      }));
    }

    function TrashIcon() {
      return h(Icon, null, h('path', {
        d: 'M5 7h14M9.2 7V4.8h5.6V7M7 7l.8 12.2h8.4L17 7M10 10.5v5.2M14 10.5v5.2',
        stroke: 'currentColor',
        strokeWidth: 1.5,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
      }));
    }

    function NoteIcon() {
      return h(Icon, null, h('path', {
        d: 'M5.5 4.5h13v15h-8l-5-5v-10Z',
        stroke: 'currentColor',
        strokeWidth: 1.5,
        strokeLinejoin: 'round',
      }), h('path', {
        d: 'M8.5 8h7M8.5 11h7M8.5 14h4',
        stroke: 'currentColor',
        strokeWidth: 1.5,
        strokeLinecap: 'round',
      }));
    }

    function MarkerIcon() {
      return h(Icon, null, h('path', {
        d: 'm9.2 5.4 7.8 7.8-3.8 3.8-7.8-7.8 3.8-3.8Z',
        stroke: 'currentColor',
        strokeWidth: 1.5,
        strokeLinejoin: 'round',
      }), h('path', {
        d: 'm13.2 16.8-2.6 2.6H5.8l2.9-2.9M5.5 20.5h13',
        stroke: 'currentColor',
        strokeWidth: 1.5,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
      }));
    }

    function ChatIcon() {
      return h(Icon, null, h('path', {
        d: 'M4.8 5.2h14.4v10.4H10l-5.2 4V5.2Z',
        stroke: 'currentColor',
        strokeWidth: 1.5,
        strokeLinejoin: 'round',
      }), h('path', {
        d: 'M8 9h8M8 12h5',
        stroke: 'currentColor',
        strokeWidth: 1.5,
        strokeLinecap: 'round',
      }));
    }

    function ExpandIcon() {
      return h(Icon, null, h('path', {
        d: 'M5 9V5h4M15 5h4v4M19 15v4h-4M9 19H5v-4',
        stroke: 'currentColor',
        strokeWidth: 1.6,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
      }));
    }

    function CloseIcon() {
      return h(Icon, null, h('path', {
        d: 'm6.5 6.5 11 11m0-11-11 11',
        stroke: 'currentColor',
        strokeWidth: 1.6,
        strokeLinecap: 'round',
      }));
    }

    function ReaderGlyph({ size = 18 }) {
      return h(Icon, { size }, h('path', {
        d: 'M5 4.5h9l5 5v10H5v-15Z',
        stroke: 'currentColor',
        strokeWidth: 1.5,
        strokeLinejoin: 'round',
      }), h('path', {
        d: 'M14 4.5v5h5M8.2 12.5h5.6M8.2 15.5h4.2',
        stroke: 'currentColor',
        strokeWidth: 1.5,
        strokeLinecap: 'round',
      }));
    }

    // ---------------------------------------------------------------------
    // PDF page. Canvas preserves the rendered page; the text layer provides
    // selection without changing the visual content.
    // ---------------------------------------------------------------------

    function HighlightLayer({ annotations, pageNumber }) {
      const segments = [];
      for (const annotation of annotations) {
        const segment = Array.isArray(annotation.segments)
          ? annotation.segments.find((item) => item.page === pageNumber)
          : null;
        if (!segment || !Array.isArray(segment.rects)) continue;
        for (let index = 0; index < segment.rects.length; index += 1) {
          const rect = segment.rects[index];
          segments.push(h('span', {
            key: `${annotation.id}-${index}`,
            className: `pr-hl ${annotation.color === 'note' ? 'is-note' : ''}`,
            style: {
              left: `${rect.x * 100}%`,
              top: `${rect.y * 100}%`,
              width: `${rect.w * 100}%`,
              height: `${rect.h * 100}%`,
            },
          }));
        }
      }
      return h('div', { className: 'pr-highlights', 'aria-hidden': 'true' }, segments);
    }

    function PdfPage({ pdf, pageNumber, width, pageAspect, annotations, registerPage, readerRef, t }) {
      const pageRef = useRef(null);
      const canvasRef = useRef(null);
      const textRef = useRef(null);
      const [visible, setVisible] = useState(pageNumber <= 2);
      const [height, setHeight] = useState(null);
      const [layerScale, setLayerScale] = useState(1);
      const [failed, setFailed] = useState(false);

      useEffect(() => {
        const element = pageRef.current;
        if (!element || typeof IntersectionObserver !== 'function') {
          setVisible(true);
          return undefined;
        }
        const observer = new IntersectionObserver((entries) => {
          const entry = entries[0];
          if (entry) setVisible(entry.isIntersecting);
        }, { root: readerRef.current || null, rootMargin: '700px 0px' });
        observer.observe(element);
        return () => observer.disconnect();
      }, [readerRef]);

      useEffect(() => {
        registerPage(pageNumber, pageRef.current);
        return () => registerPage(pageNumber, null);
      }, [pageNumber, registerPage]);

      useEffect(() => {
        if (!visible || !pdf || width <= 0) return undefined;
        let cancelled = false;
        let renderTask = null;
        let textLayer = null;

        const render = async () => {
          try {
            const page = await pdf.getPage(pageNumber);
            if (cancelled) return;
            const baseViewport = page.getViewport({ scale: 1 });
            const scale = width / baseViewport.width;
            const viewport = page.getViewport({ scale });
            const pixelRatio = Math.min(globalThis.devicePixelRatio || 1, 2.25);
            const canvas = canvasRef.current;
            const textContainer = textRef.current;
            if (!canvas || !textContainer || cancelled) return;

            setHeight(Math.round(viewport.height));
            setLayerScale(scale);
            canvas.width = Math.max(1, Math.floor(viewport.width * pixelRatio));
            canvas.height = Math.max(1, Math.floor(viewport.height * pixelRatio));
            canvas.style.width = `${viewport.width}px`;
            canvas.style.height = `${viewport.height}px`;

            const context = canvas.getContext('2d', { alpha: false });
            if (!context) throw new Error('Canvas 2D is unavailable');
            context.save();
            context.fillStyle = '#ffffff';
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.restore();

            renderTask = page.render({
              canvasContext: context,
              viewport,
              transform: pixelRatio !== 1 ? [pixelRatio, 0, 0, pixelRatio, 0, 0] : null,
              background: '#ffffff',
            });
            await renderTask.promise;
            if (cancelled) return;

            textContainer.replaceChildren();
            const textContent = await page.getTextContent();
            if (cancelled) return;
            textLayer = new pdfjsLib.TextLayer({
              textContentSource: textContent,
              container: textContainer,
              viewport,
            });
            await textLayer.render();
            if (cancelled) return;
            setFailed(false);
          } catch (error) {
            if (cancelled || error?.name === 'RenderingCancelledException' || error?.name === 'AbortException') return;
            console.error('[paper-reader] page render failed', error);
            setFailed(true);
          }
        };

        render();
        return () => {
          cancelled = true;
          try {
            renderTask?.cancel();
          } catch {
            // Rendering may already be complete.
          }
          try {
            textLayer?.cancel();
          } catch {
            // The text layer may already be settled.
          }
        };
      }, [pdf, pageNumber, width, visible]);

      const pageStyle = {
        width: `${width}px`,
        height: height ? `${height}px` : undefined,
        aspectRatio: height ? undefined : `1 / ${pageAspect || 1.414}`,
        '--total-scale-factor': String(layerScale || 1),
        '--scale-round-x': '1px',
        '--scale-round-y': '1px',
      };

      return h('div', {
        ref: pageRef,
        className: 'pr-page',
        'data-page': pageNumber,
        style: pageStyle,
        role: 'region',
        'aria-label': `${t('page')} ${pageNumber}`,
      },
        h('canvas', { ref: canvasRef, className: 'pr-canvas', 'aria-hidden': 'true' }),
        h(HighlightLayer, { annotations, pageNumber }),
        h('div', {
          ref: textRef,
          className: 'textLayer',
          style: {
            '--total-scale-factor': String(layerScale || 1),
            '--scale-round-x': '1px',
            '--scale-round-y': '1px',
          },
        }),
        failed ? h('div', { className: 'pr-page-failure', role: 'alert' }, t('pdfErrorTitle')) : null,
      );
    }

    function ReaderView({
      pdfDoc,
      pageCount,
      pageAspect,
      zoom,
      setZoom,
      readerRef,
      registerPage,
      pageElements,
      onScroll,
      annotations,
      t,
      currentPage,
      setCurrentPage,
    }) {
      const [readerWidth, setReaderWidth] = useState(560);
      const frame = useRef(0);

      useEffect(() => {
        const element = readerRef.current;
        if (!element) return undefined;
        const resize = () => setReaderWidth(element.clientWidth || 560);
        resize();
        if (typeof ResizeObserver === 'function') {
          const observer = new ResizeObserver(resize);
          observer.observe(element);
          return () => observer.disconnect();
        }
        window.addEventListener('resize', resize);
        return () => window.removeEventListener('resize', resize);
      }, [readerRef]);

      useEffect(() => {
        if (readerRef.current) readerRef.current.scrollTop = 0;
      }, [pdfDoc, readerRef]);

      const pageWidth = useMemo(() => {
        const available = Math.max(180, (readerWidth || 560) - 32);
        return Math.max(200, Math.min(940, Math.round(available * zoom)));
      }, [readerWidth, zoom]);

      const handleScroll = useCallback((event) => {
        onScroll();
        const element = event.currentTarget;
        if (frame.current) cancelAnimationFrame(frame.current);
        frame.current = requestAnimationFrame(() => {
          if (!element) return;
          const top = element.getBoundingClientRect().top + Math.min(130, element.clientHeight * 0.32);
          let page = 1;
          for (const [number, node] of pageElements.current) {
            if (!node) continue;
            if (node.getBoundingClientRect().top <= top) page = Math.max(page, number);
          }
          setCurrentPage(page);
        });
      }, [onScroll, pageElements, setCurrentPage]);

      useEffect(() => () => {
        if (frame.current) cancelAnimationFrame(frame.current);
      }, []);

      return h('div', {
        ref: readerRef,
        className: 'pr-reader',
        tabIndex: 0,
        onScroll: handleScroll,
        'aria-label': t('reader'),
      },
        h('div', { className: 'pr-pages' },
          Array.from({ length: pageCount }, (_, index) => {
            const pageNumber = index + 1;
            return h(PdfPage, {
              key: pageNumber,
              pdf: pdfDoc,
              pageNumber,
              width: pageWidth,
              pageAspect,
              annotations,
              registerPage,
              readerRef,
              t,
            });
          }),
        ),
      );
    }

    // ---------------------------------------------------------------------
    // Selection affordances.
    // ---------------------------------------------------------------------

    function SelectionMenu({ selection, t, onHighlight, onNote, onAsk, onClose }) {
      const placement = selection.anchor.placement;
      return h('div', {
        className: `pr-menu is-${placement}`,
        style: { top: `${selection.anchor.top}px`, left: `${selection.anchor.left}px` },
        role: 'toolbar',
        'aria-label': t('menuLabel'),
        onMouseDown: (event) => event.preventDefault(),
      },
        h('button', {
          type: 'button',
          className: 'pr-menu-btn',
          onClick: onHighlight,
          title: t('highlight'),
          'aria-label': t('highlight'),
        }, h(MarkerIcon), h('span', null, t('highlightShort'))),
        h('button', {
          type: 'button',
          className: 'pr-menu-btn',
          onClick: onNote,
          title: t('note'),
          'aria-label': t('note'),
        }, h(NoteIcon), h('span', null, t('noteShort'))),
        h('button', {
          type: 'button',
          className: 'pr-menu-btn is-accent',
          onClick: onAsk,
          title: t('ask'),
          'aria-label': t('ask'),
        }, h(ChatIcon), h('span', null, t('askShort'))),
        h('button', {
          type: 'button',
          className: 'pr-menu-close',
          onClick: onClose,
          title: t('close'),
          'aria-label': t('close'),
        }, h(CloseIcon)),
      );
    }

    function NoteSheet({ selection, t, value, onChange, onSave, onCancel, saving }) {
      const textareaRef = useRef(null);
      useEffect(() => {
        const timer = setTimeout(() => textareaRef.current?.focus(), 0);
        return () => clearTimeout(timer);
      }, []);
      return h(React.Fragment, null,
        h('div', { className: 'pr-note-backdrop', onClick: onCancel, 'aria-hidden': 'true' }),
        h('div', {
          className: 'pr-note-sheet',
          role: 'dialog',
          'aria-modal': 'false',
          'aria-labelledby': 'pr-note-title',
        },
          h('div', { className: 'pr-note-head' },
            h('div', null,
              h('strong', { id: 'pr-note-title' }, t('noteTitle')),
              h('span', { className: 'pr-note-count' }, t('characters', { n: selection.text.length })),
            ),
            h('button', {
              type: 'button',
              className: 'pr-icon-btn',
              onClick: onCancel,
              title: t('close'),
              'aria-label': t('close'),
            }, h(CloseIcon)),
          ),
          h('blockquote', { className: 'pr-note-quote', dir: 'auto' }, selection.text),
          h('textarea', {
            ref: textareaRef,
            className: 'pr-textarea',
            value,
            onChange: (event) => onChange(event.target.value),
            placeholder: t('notePlaceholder'),
            'aria-label': t('note'),
            rows: 4,
            dir: 'auto',
          }),
          h('div', { className: 'pr-note-actions' },
            h('button', { type: 'button', className: 'pr-btn', onClick: onCancel }, t('cancel')),
            h('button', {
              type: 'button',
              className: 'pr-btn is-primary',
              disabled: saving || value.trim().length === 0,
              onClick: onSave,
            }, t('saveNote')),
          ),
        ),
      );
    }

    function AnnotationsView({ annotations, t, locale, onClose, onJump, onDelete }) {
      const sectionRef = useRef(null);
      useEffect(() => {
        const onKeyDown = (event) => {
          if (event.key !== 'Tab' || !sectionRef.current) return;
          const focusable = [...sectionRef.current.querySelectorAll(
            'button:not([disabled]), [href], textarea, [tabindex]:not([tabindex="-1"])',
          )].filter((element) => element.getClientRects().length > 0);
          if (focusable.length === 0) return;
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
      }, []);
      return h('section', {
        ref: sectionRef,
        className: 'pr-annotations',
        role: 'dialog',
        'aria-modal': 'true',
        'aria-labelledby': 'pr-annotations-title',
      },
        h('header', { className: 'pr-annotations-head' },
          h('div', null,
            h('h2', { id: 'pr-annotations-title' }, t('annotations')),
            h('p', null, t('annotationCount', { n: annotations.length })),
          ),
          h('button', {
            type: 'button',
            className: 'pr-icon-btn',
            onClick: onClose,
            title: t('closeAnnotations'),
            'aria-label': t('closeAnnotations'),
            autoFocus: true,
          }, h(CloseIcon)),
        ),
        annotations.length === 0
          ? h('div', { className: 'pr-empty pr-empty-small' },
            h('div', { className: 'pr-empty-icon' }, h(NoteIcon)),
            h('h3', null, t('noAnnotations')),
            h('p', null, t('noAnnotationsBody')),
          )
          : h('div', { className: 'pr-annotation-list' },
            annotations.map((annotation) => {
              const page = annotation.segments?.[0]?.page || 1;
              const pages = annotation.segments?.map((segment) => segment.page) || [page];
              return h('article', { key: annotation.id, className: 'pr-annotation' },
                h('div', {
                  className: 'pr-annotation-main',
                  role: 'button',
                  tabIndex: 0,
                  onClick: () => onJump(page),
                  onKeyDown: (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      onJump(page);
                    }
                  },
                },
                  h('span', { className: 'pr-annotation-meta' },
                    h('span', { className: 'pr-page-badge' }, t('pageShort', { page: pageRangeLabel(pages) })),
                    h('span', null, formatDate(annotation.createdAt, locale)),
                  ),
                  h('blockquote', { dir: 'auto' }, annotation.text),
                  annotation.note
                    ? h('p', { className: 'pr-annotation-note', dir: 'auto' }, annotation.note)
                    : null,
                ),
                h('button', {
                  type: 'button',
                  className: 'pr-icon-btn pr-danger',
                  onClick: (event) => {
                    event.stopPropagation();
                    onDelete(annotation.id);
                  },
                  title: t('deleteAnnotation'),
                  'aria-label': t('deleteAnnotation'),
                }, h(TrashIcon)),
              );
            }),
          ),
      );
    }

    // ---------------------------------------------------------------------
    // Library and states.
    // ---------------------------------------------------------------------

    function PaperCard({ paper, t, locale, onOpen, onDownload, onDelete }) {
      const annotations = Array.isArray(paper.annotations) ? paper.annotations : [];
      return h('article', { className: 'pr-paper-card' },
        h('button', {
          type: 'button',
          className: 'pr-paper-main',
          onClick: () => onOpen(paper),
        },
          h('span', { className: 'pr-paper-art' }, h(ReaderGlyph, { size: 22 })),
          h('span', { className: 'pr-paper-body' },
            h('span', { className: 'pr-paper-title', dir: 'auto' }, paper.name || t('title')),
            h('span', { className: 'pr-paper-meta' },
              paper.pageCount
                ? h('span', null, paper.pageCount === 1 ? t('pagesCountOne') : t('pagesCount', { n: paper.pageCount }))
                : null,
              paper.size ? h('span', null, formatBytes(paper.size, locale)) : null,
              h('span', null, formatDate(paper.lastOpenedAt || paper.addedAt, locale)),
            ),
            annotations.length > 0
              ? h('span', { className: 'pr-paper-badges' },
                h('span', { className: 'pr-mini-badge' }, h(NoteIcon), String(annotations.length)),
              )
              : null,
          ),
        ),
        h('div', { className: 'pr-paper-actions' },
          h('button', {
            type: 'button',
            className: 'pr-icon-btn',
            onClick: (event) => {
              event.stopPropagation();
              onDownload(paper);
            },
            title: t('downloadOriginal'),
            'aria-label': t('downloadOriginal'),
          }, h(DownloadIcon)),
          h('button', {
            type: 'button',
            className: 'pr-icon-btn pr-danger',
            onClick: (event) => {
              event.stopPropagation();
              onDelete(paper);
            },
            title: t('deletePaper'),
            'aria-label': t('deletePaper'),
          }, h(TrashIcon)),
        ),
      );
    }

    function LibraryView({ papers, state, t, locale, uploading, onOpen, onAdd, onDownload, onDelete }) {
      if (state === 'loading') {
        return h('div', { className: 'pr-library-state' },
          h('span', { className: 'pr-spinner', 'aria-hidden': 'true' }),
          h('p', null, t('loadingLibrary')),
        );
      }
      if (state === 'error') {
        return h('div', { className: 'pr-library-state' },
          h('div', { className: 'pr-empty-icon is-error' }, h(BookIcon, { size: 26 })),
          h('h3', null, t('libraryLoadFailed')),
          h('p', null, t('localOnly')),
        );
      }
      if (papers.length === 0) {
        return h('div', { className: 'pr-library pr-library-empty' },
          h('div', { className: 'pr-empty pr-drop-card' },
            h('div', { className: 'pr-empty-art' }, h(ReaderGlyph, { size: 34 })),
            h('h3', null, t('emptyTitle')),
            h('p', null, t('emptyBody')),
            h('button', {
              type: 'button',
              className: 'pr-btn is-primary pr-empty-add',
              onClick: onAdd,
              disabled: uploading,
            }, h(PlusIcon), h('span', null, t('addPaper'))),
            h('div', { className: 'pr-drop-or' },
              h('span', null, t('dropTitle')),
              h('span', { className: 'pr-muted' }, t('dropBody')),
            ),
            h('p', { className: 'pr-feature-note' }, t('features')),
          ),
        );
      }
      return h('div', { className: 'pr-library' },
        h('div', { className: 'pr-library-head' },
          h('div', null,
            h('h2', null, t('yourPapers')),
            h('p', null, t('localOnly')),
          ),
          h('button', {
            type: 'button',
            className: 'pr-btn is-primary',
            onClick: onAdd,
            disabled: uploading,
          }, uploading ? h('span', { className: 'pr-spinner is-tiny', 'aria-hidden': 'true' }) : h(PlusIcon),
            h('span', null, uploading ? t('uploading') : t('addPaper'))),
        ),
        h('div', { className: 'pr-paper-list' },
          papers.map((paper) => h(PaperCard, {
            key: paper.id,
            paper,
            t,
            locale,
            onOpen,
            onDownload,
            onDelete,
          })),
        ),
        h('div', { className: 'pr-drop-strip' },
          h('span', { className: 'pr-drop-strip-dot', 'aria-hidden': 'true' }),
          h('span', null, t('dropTitle')),
          h('span', { className: 'pr-muted' }, t('dropBody')),
        ),
      );
    }

    function LoadingState({ t }) {
      return h('div', { className: 'pr-state' },
        h('span', { className: 'pr-spinner', 'aria-hidden': 'true' }),
        h('p', null, t('loadingPaper')),
      );
    }

    function ErrorState({ t, onRetry, onOriginal, originalAvailable }) {
      return h('div', { className: 'pr-state pr-state-error', role: 'alert' },
        h('div', { className: 'pr-empty-art is-error' }, h(ReaderGlyph, { size: 32 })),
        h('h3', null, t('pdfErrorTitle')),
        h('p', null, t('pdfErrorBody')),
        h('div', { className: 'pr-state-actions' },
          h('button', { type: 'button', className: 'pr-btn is-primary', onClick: onRetry }, h(ExpandIcon), h('span', null, t('retry'))),
          originalAvailable
            ? h('button', { type: 'button', className: 'pr-btn', onClick: onOriginal }, h(BookIcon), h('span', null, t('original')))
            : null,
        ),
      );
    }

    // ---------------------------------------------------------------------
    // Main application.
    // ---------------------------------------------------------------------

    function PaperReaderApp({ localeService, layout, inputActions, useInput }) {
      const { active: locale, t, dir } = useLocale(localeService);
      const draftSelector = typeof useInput === 'function' ? useInput : () => '';
      const currentDraft = draftSelector((state) => state?.draft || '');

      const [papers, setPapers] = useState([]);
      const [libraryState, setLibraryState] = useState('loading');
      const [activePaper, setActivePaper] = useState(null);
      const [pdfDoc, setPdfDoc] = useState(null);
      const [pdfState, setPdfState] = useState('idle');
      const [pdfError, setPdfError] = useState('');
      const [pdfReload, setPdfReload] = useState(0);
      const [pageCount, setPageCount] = useState(0);
      const [pageAspect, setPageAspect] = useState(1.414);
      const [view, setView] = useState('library');
      const [annotationsOpen, setAnnotationsOpen] = useState(false);
      const [original, setOriginal] = useState(false);
      const [originalUrl, setOriginalUrl] = useState(null);
      const [zoom, setZoom] = useState(1);
      const [currentPage, setCurrentPage] = useState(1);
      const [uploading, setUploading] = useState(false);
      const [dragActive, setDragActive] = useState(false);
      const [selection, setSelection] = useState(null);
      const [selectionStage, setSelectionStage] = useState('menu');
      const [noteText, setNoteText] = useState('');
      const [savingNote, setSavingNote] = useState(false);
      const [toast, setToast] = useState(null);

      const rootRef = useRef(null);
      const readerRef = useRef(null);
      const wrapRef = useRef(null);
      const fileInputRef = useRef(null);
      const pageElements = useRef(new Map());
      const toastTimer = useRef(null);
      const askTimer = useRef(null);

      const showToast = useCallback((message, tone = 'info') => {
        if (!message) return;
        if (toastTimer.current) clearTimeout(toastTimer.current);
        setToast({ message, tone, id: Date.now() });
        toastTimer.current = setTimeout(() => setToast(null), 3200);
      }, []);

      useEffect(() => () => {
        if (toastTimer.current) clearTimeout(toastTimer.current);
        if (askTimer.current) clearTimeout(askTimer.current);
      }, []);

      const clearTextSelection = useCallback(() => {
        try {
          const current = window.getSelection();
          const root = rootRef.current;
          if (current && root && current.rangeCount > 0) {
            const range = current.getRangeAt(0);
            if (root.contains(range.startContainer) || root.contains(range.endContainer)) {
              current.removeAllRanges();
            }
          }
        } catch {
          // Selection can be unavailable in a background frame.
        }
        setSelection(null);
        setSelectionStage('menu');
        setNoteText('');
      }, []);

      const registerPage = useCallback((pageNumber, element) => {
        if (element) pageElements.current.set(pageNumber, element);
        else pageElements.current.delete(pageNumber);
      }, []);

      const openPaper = useCallback(async (meta) => {
        if (!meta) return;
        setView('reader');
        setPdfState('loading');
        setPdfError('');
        setPdfDoc(null);
        setPageCount(0);
        setOriginal(false);
        setAnnotationsOpen(false);
        setCurrentPage(1);
        setZoom(1);
        clearTextSelection();
        try {
          const blob = await getPaperFile(meta.id);
          if (!blob) throw new Error('Missing PDF bytes');
          setActivePaper({ meta, blob });
          const now = Date.now();
          setPapers((previous) => sortPapers(previous.map((paper) => (
            paper.id === meta.id ? { ...paper, lastOpenedAt: now } : paper
          ))));
          try {
            localStorage.setItem(ACTIVE_KEY, meta.id);
          } catch {
            // A missing localStorage only loses the reopen hint.
          }
          updatePaperRecord(meta.id, { lastOpenedAt: now }).catch(() => {});
        } catch (error) {
          console.error('[paper-reader] open failed', error);
          setPdfState('error');
          setPdfError(translateFor(localeService.getLocale().active || 'en', 'openFailed'));
          setActivePaper(null);
        }
      }, [clearTextSelection, localeService]);

      useEffect(() => {
        let cancelled = false;
        (async () => {
          try {
            const records = await listPaperRecords();
            if (cancelled) return;
            const sorted = sortPapers(records);
            setPapers(sorted);
            setLibraryState('ready');
            let savedId = null;
            try {
              savedId = localStorage.getItem(ACTIVE_KEY);
            } catch {
              savedId = null;
            }
            const saved = savedId ? sorted.find((paper) => paper.id === savedId) : null;
            if (saved) openPaper(saved);
          } catch (error) {
            console.error('[paper-reader] library load failed', error);
            if (!cancelled) setLibraryState('error');
          }
        })();
        return () => {
          cancelled = true;
        };
      }, [openPaper]);

      useEffect(() => {
        let cancelled = false;
        let document = null;
        let loadingTask = null;
        let worker = null;
        if (!activePaper?.blob) {
          setPdfDoc(null);
          setPdfState('idle');
          setPageCount(0);
          return undefined;
        }
        setPdfState('loading');
        setPdfError('');
        setPdfDoc(null);
        setPageCount(0);
        setCurrentPage(1);

        (async () => {
          try {
            const data = new Uint8Array(await activePaper.blob.arrayBuffer());
            if (cancelled) return;
            worker = createPdfWorker();
            loadingTask = pdfjsLib.getDocument({
              data,
              isEvalSupported: false,
              useSystemFonts: true,
            });
            document = await loadingTask.promise;
            if (cancelled) {
              Promise.resolve(loadingTask.destroy()).catch(() => {}).finally(() => releasePdfWorker(worker));
              return;
            }
            setPdfDoc(document);
            setPageCount(document.numPages);
            setPdfState('ready');
            try {
              const firstPage = await document.getPage(1);
              const firstViewport = firstPage.getViewport({ scale: 1 });
              if (!cancelled && firstViewport.width > 0) setPageAspect(firstViewport.height / firstViewport.width);
            } catch {
              // The first page may be malformed; the A4 fallback is enough.
            }
            if (activePaper.meta.pageCount !== document.numPages) {
              setPapers((previous) => previous.map((paper) => (
                paper.id === activePaper.meta.id ? { ...paper, pageCount: document.numPages } : paper
              )));
              updatePaperRecord(activePaper.meta.id, { pageCount: document.numPages }).catch(() => {});
            }
          } catch (error) {
            if (worker) releasePdfWorker(worker);
            if (cancelled) return;
            console.error('[paper-reader] PDF load failed', error);
            setPdfError(translateFor(localeService.getLocale().active || 'en', 'pdfErrorTitle'));
            setPdfState('error');
          }
        })();

        return () => {
          cancelled = true;
          if (loadingTask) {
            Promise.resolve(loadingTask.destroy()).catch(() => {}).finally(() => releasePdfWorker(worker));
          } else if (worker) {
            releasePdfWorker(worker);
          }
        };
      }, [activePaper?.meta.id, activePaper?.blob, localeService, pdfReload]);

      useEffect(() => {
        if (!activePaper?.blob) {
          setOriginalUrl(null);
          return undefined;
        }
        const url = URL.createObjectURL(activePaper.blob);
        setOriginalUrl(url);
        return () => URL.revokeObjectURL(url);
      }, [activePaper?.blob]);

      useEffect(() => {
        if (!selection) return undefined;
        const onPointerDown = (event) => {
          if (event.target.closest('.pr-menu, .pr-note-sheet, .pr-note-backdrop')) return;
          setSelection(null);
          setSelectionStage('menu');
        };
        document.addEventListener('pointerdown', onPointerDown, true);
        return () => document.removeEventListener('pointerdown', onPointerDown, true);
      }, [selection]);

      useEffect(() => {
        const onKeyDown = (event) => {
          if (event.key !== 'Escape') return;
          if (selection) {
            if (selectionStage === 'note') {
              setSelectionStage('menu');
              setNoteText('');
            } else {
              clearTextSelection();
            }
          }
          if (annotationsOpen) setAnnotationsOpen(false);
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
      }, [annotationsOpen, clearTextSelection, selection, selectionStage]);

      const downloadPaper = useCallback(async (paper) => {
        try {
          const blob = activePaper?.meta.id === paper.id ? activePaper.blob : await getPaperFile(paper.id);
          if (!blob) throw new Error('Missing PDF bytes');
          const url = URL.createObjectURL(blob);
          const anchor = document.createElement('a');
          anchor.href = url;
          anchor.download = paper.fileName || `${paper.name || 'paper'}.pdf`;
          anchor.rel = 'noopener';
          document.body.appendChild(anchor);
          anchor.click();
          anchor.remove();
          setTimeout(() => URL.revokeObjectURL(url), 1500);
        } catch (error) {
          console.error('[paper-reader] download failed', error);
          showToast(translateFor(localeService.getLocale().active || 'en', 'openFailed'), 'error');
        }
      }, [activePaper, localeService, showToast]);

      const removePaper = useCallback(async (paper) => {
        const activeLocale = localeService.getLocale().active || 'en';
        const confirmed = globalThis.confirm
          ? globalThis.confirm(translateFor(activeLocale, 'confirmDelete'))
          : true;
        if (!confirmed) return;
        try {
          await removePaperRecord(paper.id);
          setPapers((previous) => previous.filter((item) => item.id !== paper.id));
          if (activePaper?.meta.id === paper.id) closePaper();
        } catch (error) {
          console.error('[paper-reader] delete failed', error);
          showToast(translateFor(activeLocale, 'deleteFailed'), 'error');
        }
      }, [activePaper, localeService, showToast]);

      const closePaper = useCallback(() => {
        setActivePaper(null);
        setPdfDoc(null);
        setPdfState('idle');
        setPdfError('');
        setPageCount(0);
        setView('library');
        setOriginal(false);
        setAnnotationsOpen(false);
        setCurrentPage(1);
        setZoom(1);
        clearTextSelection();
        try {
          localStorage.removeItem(ACTIVE_KEY);
        } catch {
          // Ignore unavailable storage.
        }
      }, [clearTextSelection]);

      const importFile = useCallback(async (file) => {
        if (!file) return;
        setUploading(true);
        const activeLocale = localeService.getLocale().active || 'en';
        try {
          if (file.size > MAX_BYTES) throw new UserFacingError(translateFor(activeLocale, 'tooLarge'));
          const buffer = await file.arrayBuffer();
          if (!isPdfBuffer(buffer)) throw new UserFacingError(translateFor(activeLocale, 'invalidPdf'));
          const id = newId();
          const now = Date.now();
          const meta = {
            id,
            name: displayName(file.name),
            fileName: file.name || `${displayName(file.name)}.pdf`,
            size: file.size,
            addedAt: now,
            lastOpenedAt: now,
            pageCount: 0,
            annotations: [],
          };
          const blob = new Blob([buffer], { type: 'application/pdf' });
          await savePaperRecord(meta, blob);
          setPapers((previous) => sortPapers([meta, ...previous]));
          await openPaper(meta);
        } catch (error) {
          console.error('[paper-reader] import failed', error);
          showToast(error?.isUserFacing
            ? error.message
            : translateFor(activeLocale, 'uploadFailed'), 'error');
        } finally {
          setUploading(false);
        }
      }, [localeService, openPaper, showToast]);

      const pickFile = useCallback(() => {
        fileInputRef.current?.click();
      }, []);

      const onFileInput = useCallback((event) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        importFile(file);
      }, [importFile]);

      const onDragOver = useCallback((event) => {
        if (!event.dataTransfer?.types?.includes('Files')) return;
        event.preventDefault();
        setDragActive(true);
      }, []);

      const onDragLeave = useCallback((event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setDragActive(false);
      }, []);

      const onDrop = useCallback((event) => {
        event.preventDefault();
        setDragActive(false);
        const file = event.dataTransfer?.files?.[0];
        if (file) importFile(file);
      }, [importFile]);

      const captureSelection = useCallback(() => {
        const reader = readerRef.current;
        const wrap = wrapRef.current;
        if (!reader || !wrap) return;
        const selectionObject = window.getSelection();
        if (!selectionObject || selectionObject.isCollapsed || selectionObject.rangeCount === 0) return;
        const range = selectionObject.getRangeAt(0);
        if (!reader.contains(range.startContainer) || !reader.contains(range.endContainer)) return;
        const text = selectionObject.toString().replace(/\s+/g, ' ').trim();
        if (!text) return;

        const readerRect = reader.getBoundingClientRect();
        const wrapRect = wrap.getBoundingClientRect();
        const segments = [];
        let anchorRect = null;

        for (const [pageNumber, pageNode] of pageElements.current) {
          if (!pageNode) continue;
          let intersects = false;
          try {
            intersects = range.intersectsNode(pageNode);
          } catch {
            intersects = false;
          }
          if (!intersects) continue;
          const pageRect = pageNode.getBoundingClientRect();
          const rects = [];
          for (const clientRect of Array.from(range.getClientRects())) {
            const left = Math.max(clientRect.left, pageRect.left);
            const top = Math.max(clientRect.top, pageRect.top);
            const right = Math.min(clientRect.right, pageRect.right);
            const bottom = Math.min(clientRect.bottom, pageRect.bottom);
            if (right - left < 1 || bottom - top < 1) continue;
            rects.push({
              x: clamp((left - pageRect.left) / pageRect.width, 0, 1),
              y: clamp((top - pageRect.top) / pageRect.height, 0, 1),
              w: clamp((right - left) / pageRect.width, 0, 1),
              h: clamp((bottom - top) / pageRect.height, 0, 1),
            });
            if (!anchorRect && bottom > readerRect.top + 2 && top < readerRect.bottom - 2) {
              anchorRect = clientRect;
            }
          }
          if (rects.length > 0) segments.push({ page: pageNumber, rects });
        }

        if (segments.length === 0) return;
        const rangeRect = anchorRect || range.getBoundingClientRect();
        const visibleTop = Math.max(rangeRect.top, readerRect.top + 8);
        const visibleBottom = Math.min(rangeRect.bottom, readerRect.bottom - 8);
        const above = visibleTop - wrapRect.top;
        const below = visibleBottom - wrapRect.top;
        const placement = above > 62 ? 'above' : 'below';
        const menuHalf = Math.min(122, Math.max(90, (wrapRect.width - 16) / 2));
        const left = clamp(
          rangeRect.left + rangeRect.width / 2 - wrapRect.left,
          menuHalf + 8,
          Math.max(menuHalf + 8, wrapRect.width - menuHalf - 8),
        );
        const top = placement === 'above'
          ? Math.max(8, above - 10)
          : Math.max(8, Math.min(wrapRect.height - 52, below + 10));

        setSelection({
          text,
          segments,
          pages: segments.map((segment) => segment.page),
          anchor: { top, left, placement },
        });
        setSelectionStage('menu');
        setNoteText('');
      }, []);

      useEffect(() => {
        let timer = 0;
        const onSelectionChange = () => {
          if (selectionStage === 'note') return;
          if (timer) window.clearTimeout(timer);
          timer = window.setTimeout(() => {
            const current = window.getSelection();
            const reader = readerRef.current;
            if (!current || current.isCollapsed || !reader) return;
            if (!reader.contains(current.anchorNode)) return;
            captureSelection();
          }, 120);
        };
        document.addEventListener('selectionchange', onSelectionChange);
        return () => {
          if (timer) window.clearTimeout(timer);
          document.removeEventListener('selectionchange', onSelectionChange);
        };
      }, [captureSelection, selectionStage]);

      const onRootMouseUp = useCallback((event) => {
        if (event.target.closest('.pr-menu, .pr-note-sheet, .pr-note-backdrop')) return;
        window.setTimeout(captureSelection, 0);
      }, [captureSelection]);

      const onRootKeyUp = useCallback((event) => {
        if (event.key === 'Escape') return;
        if (!event.shiftKey && !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
        window.setTimeout(captureSelection, 0);
      }, [captureSelection]);

      const onRootTouchEnd = useCallback((event) => {
        if (event.target.closest('.pr-menu, .pr-note-sheet, .pr-note-backdrop')) return;
        window.setTimeout(captureSelection, 0);
      }, [captureSelection]);

      const onReaderScroll = useCallback(() => {
        if (selection) {
          setSelection(null);
          setSelectionStage('menu');
        }
      }, [selection]);

      const persistAnnotation = useCallback(async (annotation) => {
        if (!activePaper) return false;
        const paperId = activePaper.meta.id;
        try {
          const annotations = await appendPaperAnnotation(paperId, annotation);
          setActivePaper((previous) => (
            previous && previous.meta.id === paperId
              ? { ...previous, meta: { ...previous.meta, annotations } }
              : previous
          ));
          setPapers((previous) => previous.map((paper) => (
            paper.id === paperId ? { ...paper, annotations } : paper
          )));
          return true;
        } catch (error) {
          console.error('[paper-reader] annotation save failed', error);
          showToast(translateFor(localeService.getLocale().active || 'en', 'annotationFailed'), 'error');
          return false;
        }
      }, [activePaper, localeService, showToast]);

      const saveHighlight = useCallback(async () => {
        if (!selection) return;
        const saved = await persistAnnotation({
          id: newId(),
          color: 'highlight',
          text: selection.text,
          note: '',
          createdAt: Date.now(),
          segments: selection.segments,
        });
        if (saved) {
          const activeLocale = localeService.getLocale().active || 'en';
          clearTextSelection();
          showToast(translateFor(activeLocale, 'savedHighlight'));
        }
      }, [clearTextSelection, localeService, persistAnnotation, selection, showToast]);

      const saveNote = useCallback(async () => {
        if (!selection || !noteText.trim()) return;
        setSavingNote(true);
        const saved = await persistAnnotation({
          id: newId(),
          color: 'note',
          text: selection.text,
          note: noteText.trim(),
          createdAt: Date.now(),
          segments: selection.segments,
        });
        setSavingNote(false);
        if (saved) {
          const activeLocale = localeService.getLocale().active || 'en';
          clearTextSelection();
          showToast(translateFor(activeLocale, 'savedNote'));
        }
      }, [clearTextSelection, localeService, noteText, persistAnnotation, selection, showToast]);

      const deleteAnnotation = useCallback(async (annotationId) => {
        if (!activePaper) return;
        const paperId = activePaper.meta.id;
        try {
          const annotations = await deletePaperAnnotation(paperId, annotationId);
          setActivePaper((previous) => (
            previous && previous.meta.id === paperId
              ? { ...previous, meta: { ...previous.meta, annotations } }
              : previous
          ));
          setPapers((previous) => previous.map((paper) => (
            paper.id === paperId ? { ...paper, annotations } : paper
          )));
          showToast(translateFor(localeService.getLocale().active || 'en', 'deletedAnnotation'));
        } catch (error) {
          console.error('[paper-reader] annotation delete failed', error);
          showToast(translateFor(localeService.getLocale().active || 'en', 'annotationFailed'), 'error');
        }
      }, [activePaper, localeService, showToast]);

      const askAboutSelection = useCallback(() => {
        if (!selection) return;
        const activeLocale = localeService.getLocale().active || 'en';
        const selectedText = selection.text.length > MAX_ASK_CHARS
          ? `${selection.text.slice(0, MAX_ASK_CHARS)}…`
          : selection.text;
        const prompt = translateFor(activeLocale, 'askPrompt', {
          paper: activePaper?.meta.name || translateFor(activeLocale, 'tabTitle'),
          page: pageRangeLabel(selection.pages),
          text: selectedText,
        });
        const existingDraft = (currentDraft || '').trim();
        const message = existingDraft ? `${existingDraft}\n\n${prompt}` : prompt;
        if (!inputActions || typeof inputActions.setDraft !== 'function' || typeof inputActions.submit !== 'function') {
          if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(prompt)
              .then(() => showToast(translateFor(activeLocale, 'questionCopied')))
              .catch(() => showToast(translateFor(activeLocale, 'questionFailed'), 'error'));
          } else {
            showToast(translateFor(activeLocale, 'questionFailed'), 'error');
          }
          clearTextSelection();
          return;
        }
        try {
          inputActions.setDraft(message);
          clearTextSelection();
          if (askTimer.current) clearTimeout(askTimer.current);
          askTimer.current = setTimeout(() => {
            try {
              inputActions.submit();
              if (layout && typeof layout.closeRightbar === 'function') layout.closeRightbar();
            } catch (error) {
              console.error('[paper-reader] ask failed', error);
              showToast(translateFor(activeLocale, 'questionFailed'), 'error');
            }
          }, 60);
        } catch (error) {
          console.error('[paper-reader] ask failed', error);
          showToast(translateFor(activeLocale, 'questionFailed'), 'error');
        }
      }, [activePaper, clearTextSelection, currentDraft, inputActions, layout, localeService, selection, showToast]);

      const jumpToPage = useCallback((page) => {
        setAnnotationsOpen(false);
        requestAnimationFrame(() => {
          const element = pageElements.current.get(page);
          if (element) {
            const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
            element.scrollIntoView({ block: 'start', behavior: reduceMotion ? 'auto' : 'smooth' });
          }
        });
      }, []);

      const annotations = Array.isArray(activePaper?.meta.annotations) ? activePaper.meta.annotations : [];
      const paperName = activePaper?.meta.name || t('title');
      const activeCount = annotations.length;

      useEffect(() => {
        if (!selection) return;
        if (view !== 'reader' || original || annotationsOpen) clearTextSelection();
      }, [annotationsOpen, clearTextSelection, original, selection, view]);

      return h('div', {
        ref: rootRef,
        className: 'pr-root',
        dir,
        lang: locale,
        onMouseUp: onRootMouseUp,
        onKeyUp: onRootKeyUp,
        onTouchEnd: onRootTouchEnd,
        onDragOver,
        onDragLeave,
        onDrop,
      },
        h('style', null, STYLES),
        h('input', {
          ref: fileInputRef,
          type: 'file',
          accept: 'application/pdf,.pdf',
          onChange: onFileInput,
          className: 'pr-file-input',
          tabIndex: -1,
          'aria-hidden': 'true',
        }),

        h('header', { className: 'pr-appbar' },
          view === 'reader'
            ? h('button', {
              type: 'button',
              className: 'pr-icon-btn',
              onClick: closePaper,
              title: t('backToLibrary'),
              'aria-label': t('backToLibrary'),
            }, h('span', { className: `pr-icon-wrap ${dir === 'rtl' ? 'is-flipped' : ''}` }, h(BackIcon)))
            : h('span', { className: 'pr-appmark', 'aria-hidden': 'true' }, h(BookIcon, { size: 19 })),
          h('div', { className: 'pr-heading' },
            h('strong', { className: 'pr-heading-title', dir: 'auto', title: paperName }, paperName),
            h('span', { className: 'pr-heading-sub' },
              view === 'reader'
                ? (pageCount
                  ? t('pageOf', { current: currentPage, total: pageCount })
                  : t('loadingPaper'))
                : t('subtitle'),
            ),
          ),
          h('div', { className: 'pr-actions' },
            view === 'library'
              ? h('button', {
                type: 'button',
                className: 'pr-btn is-primary pr-add-btn',
                onClick: pickFile,
                disabled: uploading || libraryState === 'loading',
              }, uploading
                ? h('span', { className: 'pr-spinner is-tiny', 'aria-hidden': 'true' })
                : h(PlusIcon),
                h('span', { className: 'pr-add-label' }, uploading ? t('uploading') : t('addPaper')))
              : h(React.Fragment, null,
                h('button', {
                  type: 'button',
                  className: `pr-icon-btn ${annotationsOpen ? 'is-active' : ''}`,
                  onClick: () => setAnnotationsOpen((open) => !open),
                  title: t('annotations'),
                  'aria-label': t('openAnnotations'),
                  'aria-expanded': annotationsOpen,
                }, h(NoteIcon),
                  activeCount > 0 ? h('span', { className: 'pr-count' }, String(activeCount)) : null),
                h('button', {
                  type: 'button',
                  className: `pr-icon-btn ${original ? 'is-active' : ''}`,
                  onClick: () => setOriginal((value) => !value),
                  title: original ? t('readerHint') : t('originalHint'),
                  'aria-label': original ? t('reader') : t('original'),
                  'aria-pressed': original,
                }, h(ReaderGlyph)),
                h('button', {
                  type: 'button',
                  className: 'pr-icon-btn',
                  onClick: () => downloadPaper(activePaper?.meta),
                  title: t('downloadOriginal'),
                  'aria-label': t('downloadOriginal'),
                  disabled: !activePaper,
                }, h(DownloadIcon)),
              ),
          ),
        ),

        h('main', { className: 'pr-main' },
          view === 'library'
            ? h(LibraryView, {
              papers,
              state: libraryState,
              t,
              locale,
              uploading,
              onOpen: openPaper,
              onAdd: pickFile,
              onDownload: downloadPaper,
              onDelete: removePaper,
            })
            : original
              ? h('div', { className: 'pr-original-wrap' },
                originalUrl
                  ? h('iframe', {
                    className: 'pr-original',
                    src: originalUrl,
                    title: t('original'),
                  })
                  : h('div', { className: 'pr-state' },
                    h('p', null, t('originalUnavailable')),
                    h('button', { type: 'button', className: 'pr-btn', onClick: () => downloadPaper(activePaper?.meta) }, t('downloadOriginal')),
                  ),
              )
              : pdfState === 'loading'
                ? h(LoadingState, { t })
                : pdfState === 'error'
                  ? h(ErrorState, {
                    t,
                    onRetry: () => {
                      if (activePaper) setPdfReload((value) => value + 1);
                      else closePaper();
                    },
                    onOriginal: () => setOriginal(true),
                    originalAvailable: Boolean(originalUrl),
                  })
                  : h('div', { className: 'pr-reader-shell', ref: wrapRef },
                    h('div', { className: 'pr-toolbar' },
                      h('div', { className: 'pr-toolbar-group' },
                        h('button', {
                          type: 'button',
                          className: 'pr-tool',
                          onClick: () => setZoom((value) => Math.max(0.6, Math.round((value - 0.1) * 10) / 10)),
                          title: t('zoomOut'),
                          'aria-label': t('zoomOut'),
                        }, h('span', { className: 'pr-zoom-glyph' }, '−')),
                        h('button', {
                          type: 'button',
                          className: 'pr-zoom-level',
                          onClick: () => setZoom(1),
                          title: t('fitWidth'),
                          'aria-label': t('fitWidth'),
                        }, t('fit')),
                        h('button', {
                          type: 'button',
                          className: 'pr-tool',
                          onClick: () => setZoom((value) => Math.min(2.2, Math.round((value + 0.1) * 10) / 10)),
                          title: t('zoomIn'),
                          'aria-label': t('zoomIn'),
                        }, h('span', { className: 'pr-zoom-glyph' }, '+')),
                      ),
                      h('div', { className: 'pr-toolbar-hint' }, t('selectHint')),
                      h('div', { className: 'pr-toolbar-page' }, t('pageOf', { current: currentPage, total: pageCount })),
                    ),
                    h(ReaderView, {
                      pdfDoc,
                      pageCount,
                      pageAspect,
                      zoom,
                      setZoom,
                      readerRef,
                      registerPage,
                      pageElements,
                      onScroll: onReaderScroll,
                      annotations,
                      t,
                      currentPage,
                      setCurrentPage,
                    }),
                    selection && selectionStage === 'menu' ? h(SelectionMenu, {
                      selection,
                      t,
                      onHighlight: saveHighlight,
                      onNote: () => setSelectionStage('note'),
                      onAsk: askAboutSelection,
                      onClose: clearTextSelection,
                    }) : null,
                    selection && selectionStage === 'note' ? h(NoteSheet, {
                      selection,
                      t,
                      value: noteText,
                      onChange: setNoteText,
                      onSave: saveNote,
                      onCancel: () => {
                        setSelectionStage('menu');
                        setNoteText('');
                      },
                      saving: savingNote,
                    }) : null,
                  ),
        ),

        annotationsOpen && view === 'reader'
          ? h(AnnotationsView, {
            annotations,
            t,
            locale,
            onClose: () => setAnnotationsOpen(false),
            onJump: jumpToPage,
            onDelete: deleteAnnotation,
          })
          : null,

        dragActive
          ? h('div', { className: 'pr-drop-overlay', 'aria-hidden': 'true' },
            h('div', { className: 'pr-drop-overlay-inner' },
              h(ReaderGlyph, { size: 34 }),
              h('strong', null, t('dropTitle')),
              h('span', null, t('dropRelease')),
            ),
          )
          : null,

        toast
          ? h('div', {
            key: toast.id,
            className: `pr-toast ${toast.tone === 'error' ? 'is-error' : ''}`,
            role: toast.tone === 'error' ? 'alert' : 'status',
            'aria-live': toast.tone === 'error' ? 'assertive' : 'polite',
          }, toast.message)
          : null,
      );
    }

    class ReaderBoundary extends React.Component {
      constructor(props) {
        super(props);
        this.state = { failed: false };
      }

      static getDerivedStateFromError() {
        return { failed: true };
      }

      componentDidCatch(error) {
        console.error('[paper-reader] panel error', error);
      }

      render() {
        if (!this.state.failed) return this.props.children;
        const active = this.props.localeService.getLocale().active || 'en';
        return h('div', { className: 'pr-root pr-fatal', dir: active === 'ar' ? 'rtl' : 'ltr' },
          h('div', { className: 'pr-state pr-state-error' },
            h('div', { className: 'pr-empty-art is-error' }, h(ReaderGlyph, { size: 32 })),
            h('h3', null, translateFor(active, 'readerFallback')),
            h('p', null, translateFor(active, 'readerFallbackBody')),
          ),
        );
      }
    }

    // ---------------------------------------------------------------------
    // Styles. All surfaces inherit the host tokens; the paper itself stays
    // white because it represents the original printed page.
    // ---------------------------------------------------------------------

    const STYLES = `
      .pr-root {
        --pr-focus: var(--dsw-alias-brand-primary, #8b7cf6);
        --pr-paper: #ffffff;
        position: relative;
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
        min-height: 0;
        overflow: hidden;
        background: var(--dsw-alias-bg-base);
        color: var(--dsw-alias-label-primary);
        font-family: inherit;
        font-size: 13px;
        line-height: 1.45;
      }
      .pr-root *, .pr-root *::before, .pr-root *::after { box-sizing: border-box; }
      .pr-root button, .pr-root textarea { font: inherit; }
      .pr-root button { -webkit-tap-highlight-color: transparent; }
      .pr-file-input { display: none; }
      .pr-icon { display: block; flex: none; }
      .pr-icon-wrap { display: inline-flex; }
      .pr-icon-wrap.is-flipped { transform: scaleX(-1); }

      .pr-appbar {
        flex: none;
        display: flex;
        align-items: center;
        gap: 8px;
        min-height: 48px;
        padding: 7px 10px;
        border-bottom: 1px solid var(--dsw-alias-border-l1);
        background: var(--dsw-alias-bg-base);
      }
      .pr-appmark {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 30px;
        height: 30px;
        flex: none;
        border-radius: 9px;
        background: var(--dsw-alias-bg-layer-1);
        color: var(--dsw-alias-label-primary);
      }
      .pr-heading {
        display: flex;
        flex-direction: column;
        gap: 1px;
        min-width: 0;
        flex: 1 1 auto;
      }
      .pr-heading-title {
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 13px;
        font-weight: 620;
        letter-spacing: -0.005em;
      }
      .pr-heading-sub {
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: var(--dsw-alias-label-secondary);
        font-size: 10.5px;
        font-weight: 450;
      }
      .pr-actions { display: flex; align-items: center; gap: 4px; flex: none; }

      .pr-icon-btn, .pr-tool, .pr-menu-btn, .pr-menu-close, .pr-zoom-level, .pr-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 5px;
        border: 1px solid transparent;
        background: transparent;
        color: var(--dsw-alias-label-primary);
        cursor: pointer;
        border-radius: 8px;
        transition: background 130ms ease, border-color 130ms ease, color 130ms ease;
      }
      .pr-icon-btn {
        position: relative;
        width: 30px;
        height: 30px;
        flex: none;
        color: var(--dsw-alias-label-secondary);
      }
      .pr-icon-btn:hover, .pr-tool:hover, .pr-menu-btn:hover, .pr-zoom-level:hover {
        background: var(--dsw-alias-bg-layer-2);
        color: var(--dsw-alias-label-primary);
      }
      .pr-icon-btn.is-active {
        background: color-mix(in srgb, var(--pr-focus) 15%, transparent);
        color: var(--dsw-alias-label-primary);
      }
      .pr-icon-btn:disabled { opacity: .45; cursor: default; }
      .pr-danger { color: color-mix(in srgb, #d45757 82%, var(--dsw-alias-label-primary)); }
      .pr-count {
        position: absolute;
        top: 1px;
        inset-inline-end: 0;
        min-width: 13px;
        height: 13px;
        padding: 0 3px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 999px;
        background: var(--pr-focus);
        color: var(--dsw-alias-bg-base);
        font-size: 8.5px;
        font-weight: 700;
        line-height: 1;
      }
      .pr-btn {
        min-height: 30px;
        padding: 0 10px;
        border-color: var(--dsw-alias-border-l1);
        background: var(--dsw-alias-bg-layer-1);
        font-size: 11.5px;
        font-weight: 550;
        white-space: nowrap;
      }
      .pr-btn:hover { background: var(--dsw-alias-bg-layer-2); border-color: var(--dsw-alias-border-l2); }
      .pr-btn.is-primary {
        border-color: transparent;
        background: var(--pr-focus);
        color: var(--dsw-alias-bg-base);
      }
      .pr-btn.is-primary:hover { filter: brightness(1.06); background: var(--pr-focus); }
      .pr-btn:disabled { opacity: .55; cursor: default; }
      .pr-add-btn { min-height: 31px; padding-inline: 9px; }
      .pr-add-label { display: inline; }
      .pr-icon-btn:focus-visible, .pr-tool:focus-visible, .pr-menu-btn:focus-visible, .pr-menu-close:focus-visible,
      .pr-zoom-level:focus-visible, .pr-btn:focus-visible, .pr-paper-main:focus-visible, .pr-annotation-main:focus-visible,
      .pr-drop-strip:focus-visible, .pr-textarea:focus-visible {
        outline: 2px solid var(--pr-focus);
        outline-offset: 2px;
      }

      .pr-main { position: relative; flex: 1 1 auto; min-height: 0; overflow: hidden; }
      .pr-reader-shell { position: absolute; inset: 0; display: flex; flex-direction: column; min-height: 0; }

      .pr-toolbar {
        flex: none;
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 4px 9px;
        border-bottom: 1px solid var(--dsw-alias-border-l1);
        background: var(--dsw-alias-bg-base);
      }
      .pr-toolbar-group { display: flex; align-items: center; gap: 1px; }
      .pr-tool {
        width: 26px;
        height: 26px;
        color: var(--dsw-alias-label-secondary);
      }
      .pr-zoom-glyph { font-size: 17px; line-height: 1; font-weight: 500; }
      .pr-zoom-level {
        height: 24px;
        padding: 0 7px;
        color: var(--dsw-alias-label-secondary);
        font-size: 10px;
        font-weight: 650;
        letter-spacing: .03em;
        text-transform: uppercase;
      }
      .pr-toolbar-hint {
        flex: 1 1 auto;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: var(--dsw-alias-label-secondary);
        font-size: 9.5px;
        text-align: center;
        opacity: .8;
      }
      .pr-toolbar-page {
        flex: none;
        color: var(--dsw-alias-label-secondary);
        font-size: 10px;
        font-variant-numeric: tabular-nums;
      }

      .pr-reader {
        flex: 1 1 auto;
        min-height: 0;
        overflow: auto;
        overscroll-behavior: contain;
        background:
          radial-gradient(circle at 50% 0%, color-mix(in srgb, var(--dsw-alias-label-primary) 4%, transparent), transparent 38%),
          var(--dsw-alias-bg-base);
        scrollbar-gutter: stable;
      }
      .pr-reader:focus-visible { outline: 2px solid var(--pr-focus); outline-offset: -2px; }
      .pr-pages {
        width: max-content;
        min-width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 18px;
        padding: 14px 16px 32px;
      }
      .pr-page {
        position: relative;
        flex: none;
        overflow: hidden;
        border: 0;
        border-radius: 2px;
        background: var(--pr-paper);
        box-shadow: 0 0 0 1px rgba(0,0,0,.08), 0 1px 2px rgba(0,0,0,.12), 0 10px 30px rgba(0,0,0,.16);
      }
      .pr-canvas { position: absolute; inset: 0; display: block; width: 100%; height: 100%; z-index: 0; }
      .pr-highlights { position: absolute; inset: 0; z-index: 1; pointer-events: none; }
      .pr-hl {
        position: absolute;
        border-radius: 2px;
        background: rgba(244, 183, 64, .38);
        box-shadow: inset 0 -1px 0 rgba(173, 107, 0, .28);
      }
      .pr-hl.is-note {
        background: color-mix(in srgb, #8b7cf6 33%, transparent);
        box-shadow: inset 0 -1px 0 rgba(94, 74, 220, .3);
      }
      .pr-page-failure {
        position: absolute;
        inset: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
        background: rgba(255,255,255,.94);
        color: #7a2e2e;
        font-size: 11px;
        text-align: center;
        padding: 12px;
      }

      .pr-page .textLayer {
        color-scheme: only light;
        position: absolute;
        text-align: initial;
        inset: 0;
        overflow: clip;
        opacity: 1;
        line-height: 1;
        letter-spacing: normal;
        word-spacing: normal;
        -webkit-text-size-adjust: none;
        text-size-adjust: none;
        forced-color-adjust: none;
        transform-origin: 0 0;
        caret-color: CanvasText;
        z-index: 2;
      }
      .pr-page .textLayer :is(span, br) {
        color: transparent;
        position: absolute;
        white-space: pre;
        cursor: text;
        transform-origin: 0% 0%;
        -webkit-user-select: text;
        user-select: text;
      }
      .pr-page .textLayer .markedContent { display: contents; }
      .pr-page .textLayer > :not(.markedContent),
      .pr-page .textLayer .markedContent span:not(.markedContent) {
        z-index: 1;
        --font-height: 0;
        font-size: calc(var(--text-scale-factor) * var(--font-height));
        --scale-x: 1;
        --rotate: 0deg;
        transform: rotate(var(--rotate)) scaleX(var(--scale-x)) scale(var(--min-font-size-inv));
      }
      .pr-page .textLayer ::selection {
        background: color-mix(in srgb, var(--pr-focus) 34%, transparent);
        color: transparent;
      }
      .pr-page .textLayer .endOfContent {
        display: block;
        position: absolute;
        inset: 100% 0 0;
        z-index: 0;
        cursor: default;
        user-select: none;
      }

      .pr-menu {
        position: absolute;
        z-index: 9;
        display: flex;
        align-items: center;
        gap: 2px;
        width: min(238px, calc(100% - 16px));
        padding: 4px;
        border: 1px solid var(--dsw-alias-border-l2);
        border-radius: 11px;
        background: var(--dsw-alias-bg-layer-2);
        box-shadow: 0 12px 36px rgba(0,0,0,.22), 0 2px 6px rgba(0,0,0,.12);
        transform: translateX(-50%);
      }
      .pr-menu.is-above { transform: translate(-50%, -100%); }
      .pr-menu-btn {
        flex: 1 1 0;
        min-width: 0;
        height: 30px;
        padding: 0 5px;
        font-size: 10.5px;
        font-weight: 550;
        color: var(--dsw-alias-label-primary);
        white-space: nowrap;
      }
      .pr-menu-btn.is-accent { color: var(--pr-focus); }
      .pr-menu-btn span { overflow: hidden; text-overflow: ellipsis; }
      .pr-menu-close {
        width: 24px;
        height: 30px;
        flex: none;
        color: var(--dsw-alias-label-secondary);
      }
      .pr-menu-close .pr-icon { width: 13px; height: 13px; }

      .pr-note-backdrop {
        position: absolute;
        inset: 0;
        z-index: 7;
        background: rgba(0,0,0,.14);
      }
      .pr-note-sheet {
        position: absolute;
        z-index: 8;
        inset-inline: 8px;
        bottom: 8px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 11px;
        border: 1px solid var(--dsw-alias-border-l2);
        border-radius: 13px;
        background: var(--dsw-alias-bg-layer-2);
        box-shadow: 0 18px 50px rgba(0,0,0,.3);
      }
      .pr-note-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
      .pr-note-head strong { display: block; font-size: 12px; font-weight: 650; }
      .pr-note-count { display: block; color: var(--dsw-alias-label-secondary); font-size: 9.5px; margin-top: 1px; }
      .pr-note-quote {
        margin: 0;
        max-height: 74px;
        overflow: auto;
        padding: 7px 8px;
        border-inline-start: 2px solid var(--pr-focus);
        border-radius: 4px;
        background: color-mix(in srgb, var(--pr-focus) 7%, transparent);
        color: var(--dsw-alias-label-secondary);
        font-size: 10.5px;
        line-height: 1.55;
      }
      .pr-textarea {
        width: 100%;
        min-height: 88px;
        max-height: 180px;
        resize: vertical;
        padding: 8px 9px;
        border: 1px solid var(--dsw-alias-border-l1);
        border-radius: 8px;
        background: var(--dsw-alias-bg-base);
        color: var(--dsw-alias-label-primary);
        font-size: 12px;
        line-height: 1.5;
      }
      .pr-textarea::placeholder { color: var(--dsw-alias-label-secondary); opacity: .72; }
      .pr-note-actions { display: flex; justify-content: flex-end; gap: 6px; }

      .pr-library { height: 100%; overflow: auto; padding: 12px; }
      .pr-library-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 10px;
        padding: 2px 2px 12px;
      }
      .pr-library-head h2 { margin: 0; font-size: 13px; font-weight: 650; }
      .pr-library-head p { margin: 2px 0 0; color: var(--dsw-alias-label-secondary); font-size: 9.5px; }
      .pr-paper-list { display: flex; flex-direction: column; gap: 7px; }
      .pr-paper-card {
        display: flex;
        align-items: stretch;
        gap: 2px;
        border: 1px solid var(--dsw-alias-border-l1);
        border-radius: 11px;
        background: var(--dsw-alias-bg-layer-1);
        overflow: hidden;
        transition: background 130ms ease, border-color 130ms ease, transform 130ms ease;
      }
      .pr-paper-card:hover {
        border-color: var(--dsw-alias-border-l2);
        background: var(--dsw-alias-bg-layer-2);
        transform: translateY(-1px);
      }
      .pr-paper-main {
        display: flex;
        align-items: flex-start;
        gap: 9px;
        flex: 1 1 auto;
        min-width: 0;
        padding: 10px;
        padding-inline-end: 4px;
        border: 0;
        background: transparent;
        color: inherit;
        text-align: start;
        cursor: pointer;
      }
      .pr-paper-art {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 33px;
        height: 41px;
        flex: none;
        border-radius: 5px;
        background: color-mix(in srgb, var(--pr-focus) 12%, var(--dsw-alias-bg-base));
        color: var(--pr-focus);
        box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--pr-focus) 18%, transparent);
      }
      .pr-paper-body { display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1 1 auto; }
      .pr-paper-title {
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 11.5px;
        font-weight: 570;
      }
      .pr-paper-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 0 6px;
        color: var(--dsw-alias-label-secondary);
        font-size: 9px;
      }
      .pr-paper-meta span + span::before { content: '·'; margin-inline-end: 6px; opacity: .5; }
      .pr-paper-badges { display: flex; gap: 4px; margin-top: 3px; }
      .pr-mini-badge {
        display: inline-flex;
        align-items: center;
        gap: 3px;
        min-height: 16px;
        padding: 0 5px;
        border-radius: 999px;
        background: color-mix(in srgb, var(--pr-focus) 12%, transparent);
        color: var(--pr-focus);
        font-size: 8.5px;
        font-weight: 650;
      }
      .pr-mini-badge .pr-icon { width: 10px; height: 10px; }
      .pr-paper-actions {
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 0;
        padding-inline-end: 3px;
        opacity: .72;
      }
      .pr-paper-card:hover .pr-paper-actions { opacity: 1; }
      .pr-paper-actions .pr-icon-btn { width: 26px; height: 26px; }
      .pr-paper-actions .pr-icon { width: 14px; height: 14px; }

      .pr-drop-strip {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-top: 12px;
        padding: 10px 11px;
        border: 1px dashed var(--dsw-alias-border-l1);
        border-radius: 10px;
        color: var(--dsw-alias-label-secondary);
        font-size: 9.5px;
      }
      .pr-drop-strip-dot { width: 5px; height: 5px; flex: none; border-radius: 999px; background: var(--pr-focus); }
      .pr-muted { color: var(--dsw-alias-label-secondary); opacity: .8; }

      .pr-library-empty { display: flex; align-items: center; justify-content: center; }
      .pr-empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        width: 100%;
        max-width: 360px;
        margin: auto;
      }
      .pr-drop-card {
        padding: 24px 18px;
        border: 1px dashed var(--dsw-alias-border-l2);
        border-radius: 15px;
        background:
          radial-gradient(circle at 50% 0%, color-mix(in srgb, var(--pr-focus) 10%, transparent), transparent 62%),
          var(--dsw-alias-bg-layer-1);
      }
      .pr-empty-art {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 58px;
        height: 58px;
        margin-bottom: 10px;
        border-radius: 16px;
        background: color-mix(in srgb, var(--pr-focus) 11%, var(--dsw-alias-bg-base));
        color: var(--pr-focus);
        box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--pr-focus) 16%, transparent);
      }
      .pr-empty-art.is-error { color: #d45757; background: rgba(212, 87, 87, .1); }
      .pr-empty h3 { margin: 0 0 4px; font-size: 14px; font-weight: 650; }
      .pr-empty p { margin: 0; max-width: 310px; color: var(--dsw-alias-label-secondary); font-size: 11px; line-height: 1.65; }
      .pr-empty-add { margin-top: 14px; }
      .pr-drop-or {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1px;
        margin-top: 18px;
        font-size: 10px;
        color: var(--dsw-alias-label-primary);
      }
      .pr-feature-note {
        margin-top: 18px !important;
        padding-top: 12px;
        border-top: 1px solid var(--dsw-alias-border-l1);
        font-size: 9.5px !important;
      }
      .pr-library-state {
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 10px;
        padding: 20px;
        text-align: center;
        color: var(--dsw-alias-label-secondary);
      }
      .pr-library-state p { margin: 0; font-size: 11px; }
      .pr-library-state h3 { margin: 0; color: var(--dsw-alias-label-primary); font-size: 13px; }
      .pr-empty-small { padding: 26px 18px; }

      .pr-state {
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 9px;
        padding: 22px;
        text-align: center;
        color: var(--dsw-alias-label-secondary);
      }
      .pr-state h3 { margin: 0; color: var(--dsw-alias-label-primary); font-size: 13px; }
      .pr-state p { margin: 0; max-width: 300px; font-size: 10.5px; line-height: 1.6; }
      .pr-state-actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; margin-top: 2px; }
      .pr-state-error .pr-empty-art { margin-bottom: 2px; }

      .pr-annotations {
        position: absolute;
        inset: 0;
        z-index: 12;
        display: flex;
        flex-direction: column;
        background: var(--dsw-alias-bg-base);
      }
      .pr-annotations-head {
        flex: none;
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 10px;
        padding: 12px 11px 9px;
        border-bottom: 1px solid var(--dsw-alias-border-l1);
      }
      .pr-annotations-head h2 { margin: 0; font-size: 13px; font-weight: 650; }
      .pr-annotations-head p { margin: 2px 0 0; color: var(--dsw-alias-label-secondary); font-size: 9.5px; }
      .pr-annotation-list { flex: 1 1 auto; min-height: 0; overflow: auto; padding: 10px; }
      .pr-annotation {
        display: flex;
        align-items: flex-start;
        gap: 2px;
        border: 1px solid var(--dsw-alias-border-l1);
        border-radius: 10px;
        background: var(--dsw-alias-bg-layer-1);
        margin-bottom: 7px;
        overflow: hidden;
      }
      .pr-annotation-main {
        flex: 1 1 auto;
        min-width: 0;
        padding: 9px;
        padding-inline-end: 4px;
        border: 0;
        background: transparent;
        color: inherit;
        text-align: start;
        cursor: pointer;
      }
      .pr-annotation-main:hover { background: var(--dsw-alias-bg-layer-2); }
      .pr-annotation-meta {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 4px;
        color: var(--dsw-alias-label-secondary);
        font-size: 8.5px;
      }
      .pr-page-badge {
        display: inline-flex;
        align-items: center;
        min-height: 16px;
        padding: 0 5px;
        border-radius: 4px;
        background: color-mix(in srgb, var(--pr-focus) 12%, transparent);
        color: var(--pr-focus);
        font-size: 8.5px;
        font-weight: 650;
      }
      .pr-annotation blockquote {
        margin: 0;
        color: var(--dsw-alias-label-primary);
        font-size: 10.5px;
        line-height: 1.55;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 3;
        overflow: hidden;
      }
      .pr-annotation-note {
        margin: 5px 0 0;
        padding-top: 5px;
        border-top: 1px solid var(--dsw-alias-border-l1);
        color: var(--dsw-alias-label-secondary);
        font-size: 10px;
        line-height: 1.55;
        white-space: pre-wrap;
      }
      .pr-annotation > .pr-icon-btn { margin-block-start: 7px; margin-inline-start: 5px; width: 26px; height: 26px; }
      .pr-annotation > .pr-icon-btn .pr-icon { width: 13px; height: 13px; }

      .pr-original-wrap { position: absolute; inset: 0; background: #fff; }
      .pr-original { width: 100%; height: 100%; border: 0; display: block; background: #fff; }

      .pr-spinner {
        width: 22px;
        height: 22px;
        border: 2px solid color-mix(in srgb, var(--dsw-alias-label-primary) 18%, transparent);
        border-top-color: var(--pr-focus);
        border-radius: 999px;
        animation: pr-spin .8s linear infinite;
      }
      .pr-spinner.is-tiny { width: 12px; height: 12px; border-width: 1.5px; }
      @keyframes pr-spin { to { transform: rotate(360deg); } }

      .pr-drop-overlay {
        position: absolute;
        inset: 0;
        z-index: 30;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        background: color-mix(in srgb, var(--dsw-alias-bg-base) 86%, transparent);
        backdrop-filter: blur(4px);
      }
      .pr-drop-overlay-inner {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        width: 100%;
        max-width: 330px;
        padding: 24px 16px;
        border: 1.5px dashed var(--pr-focus);
        border-radius: 16px;
        background: var(--dsw-alias-bg-layer-1);
        color: var(--pr-focus);
        text-align: center;
      }
      .pr-drop-overlay-inner strong { color: var(--dsw-alias-label-primary); font-size: 13px; }
      .pr-drop-overlay-inner span { color: var(--dsw-alias-label-secondary); font-size: 10px; }

      .pr-toast {
        position: absolute;
        z-index: 20;
        inset-inline: 10px;
        bottom: 10px;
        width: fit-content;
        max-width: calc(100% - 20px);
        margin-inline: auto;
        padding: 7px 11px;
        border: 1px solid var(--dsw-alias-border-l1);
        border-radius: 999px;
        background: var(--dsw-alias-bg-layer-2);
        color: var(--dsw-alias-label-primary);
        box-shadow: 0 8px 24px rgba(0,0,0,.2);
        font-size: 10px;
        text-align: center;
        pointer-events: none;
      }
      .pr-toast.is-error { border-color: color-mix(in srgb, #d45757 45%, transparent); color: color-mix(in srgb, #d45757 85%, var(--dsw-alias-label-primary)); }

      .pr-fatal { justify-content: center; }
      @media (max-width: 320px) {
        .pr-add-label { display: none; }
        .pr-toolbar-hint { display: none; }
        .pr-heading-sub { display: none; }
      }
      @media (prefers-reduced-motion: reduce) {
        .pr-root *, .pr-root *::before, .pr-root *::after {
          animation-duration: .01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: .01ms !important;
          scroll-behavior: auto !important;
        }
      }
    `;

    return {
      inject: ['slots', 'locale', 'sidebarRightTabs', 'layout'],
      apply(ctx) {
        ctx.effect(() => {
          const disposers = Object.keys(DICTS).map((language) => (
            ctx.locale.register(NS, language, DICTS[language])
          ));
          return () => disposers.forEach((dispose) => dispose());
        }, 'paper-reader: dictionaries');

        const definition = {
          id: ID,
          kind: KIND,
          priority: 'extension',
          keepMounted: true,
          title: () => translateFor(ctx.locale.getLocale().active || 'en', 'tabTitle'),
          guide: [{
            id: 'reader',
            order: 35,
            title: () => translateFor(ctx.locale.getLocale().active || 'en', 'guideTitle'),
            description: () => translateFor(ctx.locale.getLocale().active || 'en', 'guideDescription'),
            icon: ReaderGlyph,
          }],
        };

        ctx.effect(() => ctx.sidebarRightTabs.register(definition), 'paper-reader: rightbar tab type');

        ctx.effect(() => ctx.slots.inject('sidebar.right.pane.tab', () => ctx.slots.register({
          name: 'sidebar.right.pane.tab',
          key: ID,
          locale: NS,
        }, (props) => h(ReaderBoundary, { localeService: ctx.locale },
          h(PaperReaderApp, {
            ...props,
            localeService: ctx.locale,
            layout: ctx.layout,
          }),
        ))), 'paper-reader: rightbar tab body');

        ctx.effect(() => () => disposePdfWorkers(), 'paper-reader: worker cleanup');
      },
    };
  },
});
