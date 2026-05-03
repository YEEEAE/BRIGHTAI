"use client";

import type { CSSProperties } from "react";
import { useMemo, useRef, useState } from "react";
import { CheckCircle2, FileText, Loader2, UploadCloud, XCircle } from "lucide-react";
import type { OcrResult } from "@/lib/demo/ocr";
import { OCR_SAMPLE_INPUT, SUPPORTED_OCR_FILE_MIME_TYPES } from "@/lib/demo/ocr";
import { ExportPDFButton } from "./ExportPDFButton";
import { GeminiStreamRenderer } from "./GeminiStreamRenderer";
import { PlaygroundShell } from "./PlaygroundShell";
import { RateLimitGuard } from "./RateLimitGuard";
import { ScenarioPicker } from "./ScenarioPicker";

type ApiResponse = {
  ok?: boolean;
  model?: string;
  result?: OcrResult;
  error?: string;
};

const scenarios = [
  {
    id: "invoice",
    title: "فاتورة مورد",
    description: "حقول ضريبة وسداد وربط مالي",
    prompt: OCR_SAMPLE_INPUT
  },
  {
    id: "contract",
    title: "عقد خدمات",
    description: "أطراف، مدة، التزامات ومخاطر",
    prompt:
      "عقد خدمات رقم CON-778 بين شركة برايت اي آي وشركة نماء للتشغيل. يبدأ في 1447/09/01 وينتهي في 1448/02/30. قيمة العقد 180,000 ريال تدفع على ثلاث دفعات. يتضمن العقد دعم منصة أتمتة الموافقات وتدريب المستخدمين، مع بند جزائي عند التأخير يتطلب مراجعة قانونية."
  },
  {
    id: "receipt",
    title: "إيصال مشتريات",
    description: "تصنيف سريع وتجهيز CSV",
    prompt:
      "إيصال دفع رقم RC-4092 بتاريخ 2026/04/22 من متجر حلول مكتبية. المبلغ 3,450 ريال شامل الضريبة. طريقة الدفع بطاقة شركة. البنود: أجهزة ماسح ضوئي، ورق أرشفة، اشتراك تخزين سحابي."
  }
];

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const SUPPORTED_FILE_MIME_TYPES = new Set<string>(SUPPORTED_OCR_FILE_MIME_TYPES);

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const value = String(reader.result ?? "");
      resolve(value.includes(",") ? value.split(",")[1] ?? "" : value);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function ConfidenceRing({ value }: { value: number }) {
  const percentage = Math.round(value * 100);
  return (
    <div className="confidence-ring" style={{ "--score": `${percentage * 3.6}deg` } as CSSProperties}>
      <strong>{percentage}%</strong>
      <span>ثقة الاستخراج</span>
    </div>
  );
}

export function OcrDemoClient() {
  const [selectedScenario, setSelectedScenario] = useState(scenarios[0]?.id ?? "invoice");
  const [prompt, setPrompt] = useState(OCR_SAMPLE_INPUT);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<OcrResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [model, setModel] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const summary = useMemo(() => result?.summary ?? "ارفع مستنداً أو استخدم سيناريو جاهزاً لمشاهدة الاستخراج المتحرك.", [result]);

  async function handleFileChange(nextFile: File | null) {
    if (!nextFile) return;
    if (!SUPPORTED_FILE_MIME_TYPES.has(nextFile.type)) {
      setError("نوع الملف غير مدعوم في الديمو العام. ارفع صورة PNG أو JPG أو WEBP أو ملف PDF.");
      setFile(null);
      return;
    }
    if (nextFile.size > MAX_FILE_BYTES) {
      setError("حجم الملف يتجاوز 5 ميجابايت. استخدم عينة أصغر للديمو العام.");
      setFile(null);
      return;
    }
    setFile(nextFile);
    setError(null);
  }

  async function runAnalysis() {
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const fileBase64 = file ? await readFileAsBase64(file) : undefined;
      const response = await fetch("/api/demo/ocr/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentKind: selectedScenario,
          prompt,
          fileName: file?.name,
          fileMime: file?.type,
          fileBase64
        })
      });
      const payload = (await response.json()) as ApiResponse;
      if (!response.ok || !payload.result) throw new Error(payload.error ?? "تعذر تحليل المستند.");
      setResult(payload.result);
      setModel(payload.model ?? null);
      window.dispatchEvent(new CustomEvent("posthog-demo-event", { detail: { name: "demo_completed", slug: "ocr-demo" } }));
    } catch (analysisError) {
      setError(analysisError instanceof Error ? analysisError.message : "تعذر تحليل المستند.");
    } finally {
      setIsLoading(false);
    }
  }

  const input = (
    <form
      className="ocr-form"
      onSubmit={(event) => {
        event.preventDefault();
        void runAnalysis();
      }}
    >
      <ScenarioPicker
        scenarios={scenarios}
        selectedId={selectedScenario}
        onSelect={(scenario) => {
          setSelectedScenario(scenario.id);
          setPrompt(scenario.prompt);
          setResult(null);
          setError(null);
        }}
      />

      <label className="field-label" htmlFor="ocr-prompt">
        نص المستند أو وصفه
      </label>
      <textarea id="ocr-prompt" value={prompt} onChange={(event) => setPrompt(event.target.value)} rows={9} />

      <button
        className="drop-zone focus-ring"
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          void handleFileChange(event.dataTransfer.files.item(0));
        }}
      >
        <UploadCloud aria-hidden="true" />
        <span>{file ? file.name : "اسحب صورة أو PDF لفاتورة أو عقد هنا"}</span>
        <small>يدعم صور PNG وJPG وWEBP وملفات PDF حتى 5 ميجابايت. لا ترفع بيانات حساسة في الديمو العام.</small>
      </button>
      <input
        ref={inputRef}
        className="sr-only"
        type="file"
        accept={SUPPORTED_OCR_FILE_MIME_TYPES.join(",")}
        onChange={(event) => void handleFileChange(event.target.files?.item(0) ?? null)}
      />

      <RateLimitGuard message={error} />

      <button className="demo-button demo-button--primary focus-ring" type="submit" disabled={isLoading || prompt.trim().length < 8}>
        {isLoading ? <Loader2 className="spin" aria-hidden="true" /> : <FileText aria-hidden="true" />}
        تحليل المستند
      </button>
    </form>
  );

  const output = (
    <div className="ocr-output">
      <div className="ocr-output__header">
        <div>
          <p className="demo-eyebrow">Gemini Vision</p>
          <h3>{result?.documentType ?? "استخراج جاهز للمراجعة"}</h3>
        </div>
        {result ? <ConfidenceRing value={result.confidence} /> : null}
      </div>

      <GeminiStreamRenderer text={summary} isStreaming={isLoading} />

      {isLoading ? (
        <div className="processing-steps" aria-live="polite">
          {["قراءة الملف", "تصنيف المستند", "استخراج الحقول", "تجهيز ERP payload"].map((step) => (
            <span key={step}>
              <Loader2 className="spin" aria-hidden="true" />
              {step}
            </span>
          ))}
        </div>
      ) : null}

      {result ? (
        <>
          <div className="field-grid">
            {result.extractedFields.map((field) => (
              <article key={field.key} className="field-card">
                <div>
                  <strong>{field.label}</strong>
                  <span>{field.source}</span>
                </div>
                <p>{field.value}</p>
                <meter min="0" max="1" value={field.confidence} aria-label={`ثقة ${field.label}`} />
              </article>
            ))}
          </div>

          <div className="result-columns">
            <section>
              <h4>نواقص المراجعة</h4>
              <ul>
                {result.missingFields.map((field) => (
                  <li key={field}>
                    <XCircle aria-hidden="true" />
                    {field}
                  </li>
                ))}
              </ul>
            </section>
            <section>
              <h4>قواعد التحقق</h4>
              <ul>
                {result.validationRules.map((rule) => (
                  <li key={rule}>
                    <CheckCircle2 aria-hidden="true" />
                    {rule}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <pre className="json-preview" dir="ltr">
            {JSON.stringify(result.erpPayload, null, 2)}
          </pre>

          <div className="output-actions">
            <ExportPDFButton result={result} />
            <span dir="ltr">{model}</span>
          </div>
        </>
      ) : null}
    </div>
  );

  return (
    <PlaygroundShell
      title="اسحب مستنداً وشاهد الحقول تتحول إلى بيانات تشغيلية"
      description="التجربة تحلل الوصف أو الصورة، ثم تعرض حقولاً موثوقة وقواعد تحقق وبيانات جاهزة للربط مع الأنظمة."
      input={input}
      output={output}
    />
  );
}
