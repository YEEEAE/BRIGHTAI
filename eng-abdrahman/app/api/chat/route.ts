import { createGroq } from '@ai-sdk/groq';
import { streamText } from 'ai';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();
const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
    try {
        const { messages } = await req.json();

        // Fetch aggregated data
        const records = await prisma.qCRecord.findMany({
            orderBy: { date: 'desc' },
            take: 1000 // Get latest 1000 for context
        });

        // Compute critical KPIs
        const critical = records.filter((r: any) => r.rejectPct > 5);

        const contextStr = `
    أنت مستشار جودة متقدم عبر الذكاء الاصطناعي مهندس بيانات (Senior Manufacturing Quality Engineer AI Agent).
    مهمتك هي الإجابة بمهنية تامة وباللغة العربية الفصحى على استفسارات مدير المصنع فيما يخص الجودة ونسب الرفض (Reject Rates).
    
    بيانات الماكينات التي تواجه مشاكل حديثة (نسبة رفضها أعلى من 5٪): 
    ${JSON.stringify(critical.slice(0, 30).map((r: any) => ({ موقع_الماكينة: r.machineName, الصنف: r.itemName, نسبة_الرفض: r.rejectPct, التالف: r.rejectedQty })))}
    
    إرشادات:
    1. اعتمد بشكل كلي على البيانات التي تم تزويدك بها.
    2. استخدم أسلوباً احترافياً وتحدث بصفتك موظفاً كبيراً في قسم الجودة، مع تقديم حلول وتوصيات جذرية.
    3. راعي أن تكون إجاباتك مدعومة بالأرقام وتفصيلية لكن بدون ملل.
    4. إذا سئلت عن شيء غير موجود في البيانات، وضح برقي أن البيانات الحالية تركز على حالات الرفض الحرجة.
    `;

        const result = streamText({
            model: groq('llama3-70b-8192'),
            system: contextStr,
            messages,
            temperature: 0.3,
        });

        return result.toDataStreamResponse();
    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}
