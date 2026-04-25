import os
import json
import re
import requests
from dotenv import load_dotenv
from google import genai

from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    Application,
    CommandHandler,
    MessageHandler,
    CallbackQueryHandler,
    ContextTypes,
    filters,
)

load_dotenv()

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
DEVTO_API_KEY = os.getenv("DEVTO_API_KEY", "").strip()

if not TELEGRAM_BOT_TOKEN:
    raise ValueError("TELEGRAM_BOT_TOKEN غير موجود في ملف .env")

if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY غير موجود في ملف .env")

if not DEVTO_API_KEY:
    raise ValueError("DEVTO_API_KEY غير موجود في ملف .env")

gemini_client = genai.Client(api_key=GEMINI_API_KEY)

USER_ARTICLES = {}


def clean_json_response(text: str) -> dict:
    """
    ينظف رد Gemini لو رجع JSON داخل ```json
    """
    text = text.strip()

    text = re.sub(r"^```json", "", text, flags=re.IGNORECASE).strip()
    text = re.sub(r"^```", "", text).strip()
    text = re.sub(r"```$", "", text).strip()

    return json.loads(text)


def normalize_tags(tags):
    """
    Dev.to يفضل tags قصيرة وبدون مسافات.
    نخليها انجليزية/حروف/أرقام فقط قدر الإمكان.
    """
    cleaned = []

    for tag in tags:
        tag = str(tag).lower().strip()
        tag = tag.replace("#", "")
        tag = re.sub(r"[^a-z0-9]", "", tag)

        if tag and tag not in cleaned:
            cleaned.append(tag)

    fallback = ["seo", "arabic", "webdev", "marketing"]

    for tag in fallback:
        if len(cleaned) >= 4:
            break
        if tag not in cleaned:
            cleaned.append(tag)

    return cleaned[:4]


def build_prompt(user_input: str) -> str:
    return f"""
أنت كاتب محتوى عربي محترف متخصص في SEO والمقالات التقنية.

حوّل طلب المستخدم إلى مقال عربي جاهز للنشر على Dev.to.

مدخل المستخدم:
{user_input}

مهم جدًا:
- اكتب بالعربي.
- المقال يكون مفيد وطبيعي وليس سبام.
- لو المستخدم أرسل رابط موقعه، ضعه داخل المقال مرة واحدة أو مرتين بشكل طبيعي.
- لا تبالغ في الوعود.
- لا تكرر الكلمات المفتاحية بشكل مزعج.
- Dev.to منصة تقنية، فخلي الأسلوب مناسب للمهتمين بالتقنية والتسويق الرقمي.
- أخرج النتيجة بصيغة JSON فقط بدون Markdown خارجي.

صيغة JSON المطلوبة:
{{
  "title": "عنوان المقال",
  "description": "وصف قصير للمقال",
  "tags": ["seo", "arabic", "webdev", "marketing"],
  "body_markdown": "محتوى المقال بصيغة Markdown"
}}

شروط body_markdown:
- يبدأ بمقدمة قوية.
- يحتوي عناوين ## و ###.
- يحتوي نقاط عملية.
- يحتوي خاتمة.
- لا تضع front matter.
"""


def generate_article(user_input: str) -> dict:
    response = gemini_client.models.generate_content(
        model="gemini-2.5-flash",
        contents=build_prompt(user_input),
    )

    raw_text = response.text or ""
    article = clean_json_response(raw_text)

    title = str(article.get("title", "مقال جديد")).strip()
    description = str(article.get("description", "")).strip()
    body_markdown = str(article.get("body_markdown", "")).strip()
    tags = normalize_tags(article.get("tags", []))

    if not title or not body_markdown:
        raise ValueError("Gemini رجع نتيجة ناقصة. جرّب أرسل تفاصيل أكثر.")

    return {
        "title": title,
        "description": description[:160],
        "tags": tags,
        "body_markdown": body_markdown,
    }


def publish_draft_to_devto(article: dict) -> str:
    headers = {
        "api-key": DEVTO_API_KEY,
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "TelegramDevtoAIWriter/1.0",
    }

    payload = {
        "article": {
            "title": article["title"],
            "published": False,
            "body_markdown": article["body_markdown"],
            "description": article["description"],
            "tags": article["tags"],
        }
    }

    response = requests.post(
        "https://dev.to/api/articles",
        headers=headers,
        json=payload,
        timeout=30,
    )

    if response.status_code not in [200, 201]:
        raise Exception(
            f"Dev.to رفض الطلب.\nStatus: {response.status_code}\nResponse: {response.text}"
        )

    data = response.json()
    return data.get("url", "تم إنشاء المسودة، لكن Dev.to ما رجع رابط.")


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    message = """
يا هلا 👋

أرسل لي عنوان المقال + النقاط، وأنا أكتب لك مقال عربي وأسويه مسودة على Dev.to.

مثال:

عنوان: كيف تحسن SEO لموقع عربي
النقاط:
- اختيار الكلمات المفتاحية
- تحسين العناوين
- الروابط الداخلية
- كتابة محتوى مفيد
- رابط موقعي: https://example.com

الأوامر:
/start - شرح الاستخدام
/help - مساعدة
"""
    await update.message.reply_text(message)


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "ارسل العنوان والنقاط ورابط موقعك إذا تبي أضيفه داخل المقال. بعدها اضغط زر إنشاء مسودة على Dev.to."
    )


async def handle_text(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    user_input = update.message.text.strip()

    if len(user_input) < 20:
        await update.message.reply_text(
            "اكتب تفاصيل أكثر شوي: عنوان، نقاط، ورابط موقعك لو تبي أضيفه."
        )
        return

    await update.message.reply_text("تمام، جاري كتابة المقال...")

    try:
        article = generate_article(user_input)
        USER_ARTICLES[user_id] = article

        preview = f"""
📝 العنوان:
{article["title"]}

📌 الوصف:
{article["description"]}

🏷️ الوسوم:
{", ".join(article["tags"])}

--------------------

{article["body_markdown"][:2500]}
"""

        keyboard = [
            [
                InlineKeyboardButton(
                    "✅ إنشاء مسودة على Dev.to",
                    callback_data="publish_devto",
                )
            ],
            [
                InlineKeyboardButton(
                    "📋 عرض المقال كامل",
                    callback_data="show_full",
                )
            ],
        ]

        await update.message.reply_text(
            preview,
            reply_markup=InlineKeyboardMarkup(keyboard),
        )

    except Exception as error:
        await update.message.reply_text(
            f"صار خطأ أثناء كتابة المقال:\n{error}"
        )


async def handle_button(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()

    user_id = query.from_user.id
    article = USER_ARTICLES.get(user_id)

    if not article:
        await query.edit_message_text(
            "ما لقيت مقال محفوظ. أرسل العنوان والنقاط من جديد."
        )
        return

    if query.data == "show_full":
        full_text = f"""# {article["title"]}

{article["description"]}

Tags: {", ".join(article["tags"])}

{article["body_markdown"]}
"""
        await query.edit_message_text("تمام، هذا المقال كامل:")

        chunks = [
            full_text[i:i + 3500]
            for i in range(0, len(full_text), 3500)
        ]

        for chunk in chunks:
            await context.bot.send_message(
                chat_id=query.message.chat_id,
                text=chunk,
            )

    elif query.data == "publish_devto":
        await query.edit_message_text("جاري إنشاء مسودة على Dev.to...")

        try:
            url = publish_draft_to_devto(article)

            await context.bot.send_message(
                chat_id=query.message.chat_id,
                text=f"تم إنشاء المسودة على Dev.to ✅\n{url}",
            )

        except Exception as error:
            await context.bot.send_message(
                chat_id=query.message.chat_id,
                text=f"ما قدرت أنشئ المسودة على Dev.to:\n{error}",
            )


def main():
    app = Application.builder().token(TELEGRAM_BOT_TOKEN).build()

    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("help", help_command))
    app.add_handler(CallbackQueryHandler(handle_button))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_text))

    print("Bot is running...")
    app.run_polling()


if __name__ == "__main__":
    main()