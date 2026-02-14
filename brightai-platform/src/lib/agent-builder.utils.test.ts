import { clampKnowledgeContext, extractKnowledgeContext } from "./agent-builder.utils";

describe("استرجاع معرفة المصمم", () => {
  it("يرتب المقاطع ذات الصلة بالسؤال التجاري قبل غيرها", () => {
    const question = "أريد تفاصيل تكلفة الخطة الشهرية";
    const context = extractKnowledgeContext(
      question,
      "",
      [
        {
          id: "u1",
          url: "https://example.com/pricing",
          words: 10,
          tokens: 10,
          status: "جاهز",
          updatedAt: new Date().toISOString(),
          content: "هذه الصفحة تشرح الخطة الشهرية والسعر والتكلفة والاشتراك السنوي.",
          chunksData: [],
        },
      ],
      [
        {
          id: "f1",
          name: "دليل عام",
          size: 100,
          type: "text/plain",
          words: 10,
          tokens: 10,
          chunks: 1,
          updatedAt: new Date().toISOString(),
          content: "هذا مستند عام عن الاستخدام اليومي دون تفاصيل مالية.",
          chunksData: [],
        },
      ],
      2
    );

    expect(context).toContain("الخطة");
    expect(context).toContain("التكلفة");
  });

  it("يختصر السياق الطويل حسب سعة النموذج", () => {
    const longText = `${"أ".repeat(20000)}\n${"ب".repeat(20000)}`;
    const clamped = clampKnowledgeContext(longText, "gemma2-9b-it", 3000);
    expect(clamped.length).toBeLessThan(longText.length);
    expect(clamped).toContain("اختصار");
  });
});

