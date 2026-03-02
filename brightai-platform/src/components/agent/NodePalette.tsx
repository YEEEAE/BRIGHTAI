import { useMemo, useState, type ReactNode } from "react";
import {
  Database,
  FileText,
  GitBranch,
  Globe,
  Link,
  MessageSquare,
  Repeat,
  Send,
  Settings,
  Sparkles,
  UploadCloud,
  User,
} from "lucide-react";

type PaletteNode = {
  id: string;
  type: string;
  label: string;
  description: string;
  category: string;
  icon: ReactNode;
  defaults?: Record<string, unknown>;
};

type NodePaletteProps = {
  onSelect?: (node: PaletteNode) => void;
};

const NodePalette = ({ onSelect }: NodePaletteProps) => {
  const [search, setSearch] = useState("");

  const nodes = useMemo<PaletteNode[]>(
    () => [
      {
        id: "user-input",
        type: "input",
        label: "إدخال المستخدم",
        description: "التقاط مدخلات المستخدم النصية",
        category: "مدخلات",
        icon: <User className="h-4 w-4" />,
        defaults: { label: "مدخل المستخدم" },
      },
      {
        id: "file-upload",
        type: "input",
        label: "رفع ملف",
        description: "استقبال ملف كمصدر بيانات",
        category: "مدخلات",
        icon: <UploadCloud className="h-4 w-4" />,
        defaults: { label: "ملف مرفوع" },
      },
      {
        id: "api-input",
        type: "input",
        label: "مدخل واجهة برمجة",
        description: "قراءة بيانات من واجهة برمجة خارجية",
        category: "مدخلات",
        icon: <Link className="h-4 w-4" />,
        defaults: { label: "مدخل واجهة" },
      },
      {
        id: "condition",
        type: "condition",
        label: "شرط",
        description: "تقييم شروط متعددة للتفرع",
        category: "منطق",
        icon: <GitBranch className="h-4 w-4" />,
        defaults: { label: "شرط" },
      },
      {
        id: "loop",
        type: "loop",
        label: "تكرار",
        description: "تكرار خطوة على مجموعة بيانات",
        category: "منطق",
        icon: <Repeat className="h-4 w-4" />,
        defaults: { label: "تكرار" },
      },
      {
        id: "variable",
        type: "variable",
        label: "متغير",
        description: "تخزين أو قراءة متغير",
        category: "منطق",
        icon: <Settings className="h-4 w-4" />,
        defaults: { label: "متغير" },
      },
      {
        id: "prompt",
        type: "prompt",
        label: "موجه نصي",
        description: "صياغة موجه مخصص للتنفيذ",
        category: "منطق",
        icon: <MessageSquare className="h-4 w-4" />,
        defaults: { label: "موجه" },
      },
      {
        id: "api-call",
        type: "action",
        label: "نداء واجهة برمجة",
        description: "تنفيذ طلب خارجي إلى خدمة",
        category: "إجراء",
        icon: <Globe className="h-4 w-4" />,
        defaults: { label: "نداء واجهة", actionType: "http" },
      },
      {
        id: "database",
        type: "action",
        label: "استعلام قاعدة بيانات",
        description: "قراءة أو كتابة بيانات داخلية",
        category: "إجراء",
        icon: <Database className="h-4 w-4" />,
        defaults: { label: "استعلام بيانات", actionType: "database" },
      },
      {
        id: "groq",
        type: "groq",
        label: "ذكاء غروك",
        description: "تنفيذ تحليل ذكاء اصطناعي",
        category: "إجراء",
        icon: <Sparkles className="h-4 w-4" />,
        defaults: { label: "ذكاء غروك", model: "llama-3.1-70b-versatile" },
      },
      {
        id: "transform",
        type: "action",
        label: "تحويل بيانات",
        description: "تنظيف أو تحويل البيانات قبل الإخراج",
        category: "إجراء",
        icon: <Settings className="h-4 w-4" />,
        defaults: { label: "تحويل بيانات", actionType: "transform" },
      },
      {
        id: "text-output",
        type: "output",
        label: "استجابة نصية",
        description: "مخرجات نصية مباشرة للمستخدم",
        category: "مخرجات",
        icon: <MessageSquare className="h-4 w-4" />,
        defaults: { label: "استجابة نصية", format: "text" },
      },
      {
        id: "file-output",
        type: "output",
        label: "ملف مخرجات",
        description: "توليد ملف ناتج من سير العمل",
        category: "مخرجات",
        icon: <FileText className="h-4 w-4" />,
        defaults: { label: "مخرجات ملف", format: "file" },
      },
      {
        id: "webhook",
        type: "output",
        label: "ويب هوك",
        description: "إرسال المخرجات إلى خدمة خارجية",
        category: "مخرجات",
        icon: <Send className="h-4 w-4" />,
        defaults: { label: "ويب هوك", format: "webhook" },
      },
    ],
    []
  );

  const filteredNodes = useMemo(() => {
    if (!search.trim()) {
      return nodes;
    }
    const keyword = search.trim();
    return nodes.filter((node) =>
      `${node.label} ${node.description} ${node.category}`.includes(keyword)
    );
  }, [search, nodes]);

  const grouped = useMemo(() => {
    const map = new Map<string, PaletteNode[]>();
    filteredNodes.forEach((node) => {
      const list = map.get(node.category) || [];
      list.push(node);
      map.set(node.category, list);
    });
    return Array.from(map.entries());
  }, [filteredNodes]);

  const handleDragStart = (event: React.DragEvent<HTMLButtonElement>, node: PaletteNode) => {
    event.dataTransfer.setData("application/reactflow", node.type);
    event.dataTransfer.setData("application/brightai", JSON.stringify(node));
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3">
        <label className="text-xs text-slate-400">بحث داخل العقد</label>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-100"
          placeholder="ابحث عن عقدة"
          aria-label="بحث عن عقدة"
        />
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto pb-4">
        {grouped.map(([category, items]) => (
          <div key={category} className="space-y-2">
            <p className="text-xs font-semibold text-emerald-300">{category}</p>
            <div className="grid gap-2">
              {items.map((node) => (
                <button
                  key={node.id}
                  type="button"
                  draggable
                  onDragStart={(event) => handleDragStart(event, node)}
                  onClick={() => onSelect?.(node)}
                  className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-right text-sm text-slate-100 hover:border-emerald-400/40"
                  title={node.description}
                  aria-label={`إضافة ${node.label}`}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-emerald-300">
                    {node.icon}
                  </span>
                  <div className="flex flex-col text-right">
                    <span className="font-semibold">{node.label}</span>
                    <span className="text-xs text-slate-400">{node.description}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NodePalette;
