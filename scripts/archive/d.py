"""
Like4Like Bot — Instagram Follow
═══════════════════════════════════════════════════
التدفق:
  1. فتح كروم ببروفايل ثابت (يحفظ الكوكيز)
  2. تسجيل الدخول على Instagram (مرة واحدة فقط)
  3. تسجيل الدخول على Like4Like
  4. محاولة مهام Instagram Follow
  5. ضغط زر المهمة → فتح نافذة المنصة
  6. إذا طلب تسجيل دخول → يدخل البيانات
  7. ضغط Follow فعلياً
  8. إغلاق النافذة → ضغط Confirm فقط إذا نجح الفعل
  9. تكرار
"""

import time
import random
import ssl
import certifi
import os
import subprocess
import sys
import setuptools  # يجب استيراده قبل undetected_chromedriver لتوفير distutils في Python 3.14

import undetected_chromedriver as uc
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.keys import Keys
from selenium.common.exceptions import (
    TimeoutException, NoSuchElementException,
    NoSuchWindowException, WebDriverException
)

# ═══════════════════════════════════════════
#             الإعدادات
# ═══════════════════════════════════════════
LIKE4LIKE_USER = "d780476e9"
LIKE4LIKE_PASS = "jejbez-sIzdun-8biwjy"

INSTAGRAM_USER = "brightai_"
INSTAGRAM_PASS = "2708778--"

# مسار بروفايل الكروم الثابت — يحفظ الكوكيز بين التشغيلات
CHROME_PROFILE = os.path.expanduser("~/.like4like_chrome_profile")

# SSL fix
ssl._create_default_https_context = ssl.create_default_context
os.environ['SSL_CERT_FILE'] = certifi.where()
os.environ['REQUESTS_CA_BUNDLE'] = certifi.where()


class Like4LikeBot:
    """البوت الرئيسي — يتعامل مع like4like و Instagram"""

    def __init__(self):
        print("\n[⚙] تجهيز المتصفح ...")

        options = uc.ChromeOptions()
        options.add_argument("--disable-popup-blocking")
        options.add_argument(f"--user-data-dir={CHROME_PROFILE}")

        # ═══ كروم يشتغل خارج الشاشة — ما يظهر ولا يسحبك ═══
        options.add_argument("--window-size=1920,1080")
        # تم إزالة --window-position=-9999 لأنه يسبب (SIGTRAP/EXC_BREAKPOINT) في معالجات Apple Silicon (M3)
        options.add_argument("--no-first-run")
        options.add_argument("--no-default-browser-check")
        options.add_argument("--disable-features=IdentityStatusDialog,ProfilePicker")
        options.add_argument("--disable-gpu")
        options.add_argument("--disable-software-rasterizer")

        self.driver = uc.Chrome(options=options, use_sandbox=False, version_main=148)
        time.sleep(1.5)

        # نحرك النافذة برا الشاشة بطريقة آمنة لتفادي الكراش
        try:
            self.driver.minimize_window()  # التصغير أأمن بكثير من الإحداثيات السالبة جداً
            # macOS: نرجع الفوكس للتطبيق اللي كنت فيه
            subprocess.run(
                ["osascript", "-e",
                 'tell application "System Events" to set frontmost of '
                 'first process whose frontmost is false to true'],
                capture_output=True, timeout=3
            )
        except Exception:
            pass

        self.wait = WebDriverWait(self.driver, 15)
        print("[✔] المتصفح جاهز (خارج الشاشة — ما يقاطعك).\n")

    # ═══════════════════════════════════════════
    #   أدوات مساعدة
    # ═══════════════════════════════════════════

    def pause(self, mn=1.5, mx=3.0):
        time.sleep(random.uniform(mn, mx))

    def click(self, el):
        """ضغطة آمنة"""
        try:
            self.driver.execute_script(
                "arguments[0].scrollIntoView({block:'center'});", el)
            time.sleep(0.3)
            el.click()
        except Exception:
            try:
                self.driver.execute_script("arguments[0].click();", el)
            except Exception:
                pass

    def find(self, by, val, timeout=10):
        """بحث عن عنصر قابل للنقر — يرجع None عند الفشل"""
        try:
            return WebDriverWait(self.driver, timeout).until(
                EC.element_to_be_clickable((by, val)))
        except Exception:
            return None

    def find_present(self, by, val, timeout=10):
        """بحث عن عنصر موجود في الصفحة"""
        try:
            return WebDriverWait(self.driver, timeout).until(
                EC.presence_of_element_located((by, val)))
        except Exception:
            return None

    def close_extra_tabs(self, main_handle):
        """إغلاق جميع التابات ما عدا الرئيسية"""
        for h in self.driver.window_handles:
            if h != main_handle:
                try:
                    self.driver.switch_to.window(h)
                    self.driver.close()
                except Exception:
                    pass
        try:
            self.driver.switch_to.window(main_handle)
        except Exception:
            pass

    # ═══════════════════════════════════════════
    #   1. تسجيل الدخول على Instagram (مرة واحدة)
    # ═══════════════════════════════════════════

    def ensure_instagram_logged_in(self):
        """يتأكد إن الانستقرام مسجل دخول — تصفح مباشر بدون تابات"""
        print("[>>] التحقق من تسجيل دخول Instagram ...")

        # نفتح صفحة الدخول في نفس النافذة مباشرة
        self.driver.get("https://www.instagram.com/accounts/login/")
        self.pause(2, 4)

        # فحص مزدوج: URL + حقول
        still_on_login = "login" in self.driver.current_url.lower()
        login_field = self.find_present(By.NAME, "email", timeout=8)

        if login_field or still_on_login:
            print("[→] الانستقرام غير مسجل — جاري الدخول ...")
            if not login_field:
                self.pause(2, 3)
                login_field = self.find_present(By.NAME, "email", timeout=10)
            if not login_field:
                print("[!] حقل الدخول لم يظهر.")
                return
            
            login_field.clear()
            for ch in INSTAGRAM_USER:
                login_field.send_keys(ch)
                time.sleep(random.uniform(0.02, 0.05))
            print(f"[→] تم كتابة اليوزر: {INSTAGRAM_USER[:3]}***")
            self.pause(0.5, 1)

            pass_field = self.find_present(By.NAME, "pass", timeout=8)
            if not pass_field:
                print("[!] حقل الباسورد لم يظهر!")
                return
            pass_field.clear()
            for ch in INSTAGRAM_PASS:
                pass_field.send_keys(ch)
                time.sleep(random.uniform(0.02, 0.05))
            print("[→] تم كتابة الباسورد.")
            self.pause(0.5, 1)

            # ✅ ضغط Enter مباشرة من حقل الباسورد (أضمن طريقة)
            pass_field.send_keys(Keys.RETURN)
            print("[→] تم ضغط Enter للدخول ...")
            self.pause(4, 7)

            # تخطي رسائل "ليس الآن" و "Save Info"
            for _ in range(3):
                skip = self.find(By.XPATH,
                    "//button[contains(text(),'Not Now') or "
                    "contains(text(),'ليس الآن') or "
                    "contains(text(),'Not now') or "
                    "contains(text(),'لاحقاً')]", 3)
                if skip:
                    self.click(skip)
                    self.pause(1, 1.5)
                else:
                    break

            self.pause(1, 2)
            if "login" not in self.driver.current_url.lower():
                print("[✔] تم تسجيل الدخول على Instagram بنجاح! 🎉")
            else:
                print("[!] تسجيل الدخول فشل. تأكد من البيانات.")
                print("    URL: " + self.driver.current_url[:70])
        else:
            print("[✔] Instagram مسجل مسبقاً. ✅")

        self.pause(1)

    # ═══════════════════════════════════════════
    #   2. تسجيل الدخول على Like4Like
    # ═══════════════════════════════════════════

    def login_like4like(self):
        print("[>>] تسجيل الدخول على Like4Like ...")
        self.driver.get("https://www.like4like.org/login/")
        self.pause(2, 3)

        u = self.find_present(By.NAME, "username")
        p = self.find_present(By.NAME, "password")

        if not u or not p:
            print("[-] حقول الدخول غير موجودة!")
            return False

        u.clear(); u.send_keys(LIKE4LIKE_USER)
        p.clear(); p.send_keys(LIKE4LIKE_PASS)

        btn = (self.find(By.CSS_SELECTOR, "a.button", 3) or
               self.find(By.CSS_SELECTOR, "[type='submit']", 3) or
               self.find(By.CSS_SELECTOR, "input[type='submit']", 3))

        if btn:
            self.click(btn)
        else:
            p.send_keys(Keys.RETURN)

        self.pause(2, 3)

        if "login" not in self.driver.current_url.lower() or "user" in self.driver.current_url.lower():
            print("[✔] تم الدخول على Like4Like بنجاح!")
            return True
        else:
            print("[!] ربما فشل الدخول. نكمل على أي حال ...")
            return True

    # ═══════════════════════════════════════════
    #   3. تنفيذ مهمة واحدة
    # ═══════════════════════════════════════════

    def do_task(self, task_type):
        """التدفق الكامل لمهمة واحدة (محمي من الكراش)"""
        try:
            return self._do_task_inner(task_type)
        except NoSuchWindowException:
            print("  [!] النافذة انقفلت. نكمل ...")
            return "error"
        except WebDriverException as e:
            print(f"  [!] خطأ متصفح: {str(e)[:60]}")
            return "error"
        except Exception as e:
            print(f"  [!] خطأ: {str(e)[:60]}")
            return "error"

    def _do_task_inner(self, task_type):
        """
        التدفق الكامل لمهمة واحدة:
          ① ضغط زر Follow/Like على like4like
          ② الانتقال للنافذة المنبثقة (انستقرام)
          ③ إذا طلب تسجيل دخول → يدخل البيانات
          ④ ضغط Follow أو Like فعلياً
          ⑤ إغلاق النافذة والرجوع
          ⑥ ضغط Confirm فقط إذا نجح الفعل
        """
        main = self.driver.current_window_handle
        tabs_before = set(self.driver.window_handles)

        # ① ضغط زر المهمة (الزر الأخضر)
        task_btn = self.find(
            By.CSS_SELECTOR,
            "div[id^='likebutton'] a.earn_pages_button, "
            "a.earn_pages_button, "
            "a[onclick*='imageWin']",
            timeout=8)

        if not task_btn:
            return "no_tasks"

        print(f"  [→] ضغط زر المهمة ({task_type}) ...")
        self.click(task_btn)

        # ② انتظار فتح النافذة المنبثقة
        new_tab = None
        for _ in range(25):  # 5 ثوانٍ
            time.sleep(0.2)
            diff = set(self.driver.window_handles) - tabs_before
            if diff:
                new_tab = diff.pop()
                break

        if not new_tab:
            print("  [!] النافذة المنبثقة لم تظهر.")
            return "skip"

        self.driver.switch_to.window(new_tab)
        self.pause(2, 3)

        current_url = self.driver.current_url
        print(f"  [→] النافذة: {current_url[:70]}")

        # ③ تحقق من تسجيل الدخول على الانستقرام
        action_done = False

        if "instagram.com" in current_url:
            # فحص مزدوج: URL يحتوي login أو حقل username موجود
            needs_login = "login" in current_url.lower()
            login_field = self.find_present(By.NAME, "email", timeout=5)

            if login_field or needs_login:
                if not login_field:
                    self.pause(1.5, 2.5)
                    login_field = self.find_present(By.NAME, "email", timeout=7)
                print("  [!] انستقرام يطلب الدخول — جاري الإدخال ...")
                if not login_field:
                    print("  [!] حقول الدخول لم تظهر رغم الانتظار.")
                else:
                    login_field.clear()
                    for ch in INSTAGRAM_USER:
                        login_field.send_keys(ch)
                        time.sleep(random.uniform(0.02, 0.05))

                pass_field = self.find_present(By.NAME, "pass", timeout=5)
                if pass_field:
                    pass_field.clear()
                    for ch in INSTAGRAM_PASS:
                        pass_field.send_keys(ch)
                        time.sleep(random.uniform(0.02, 0.05))
                    self.pause(0.5, 1)
                    pass_field.send_keys(Keys.RETURN)
                    print("  [→] تم إرسال بيانات الدخول (Enter). ننتظر ...")
                    self.pause(4, 6)

                # تخطي رسائل مزعجة
                for _ in range(3):
                    skip = self.find(By.XPATH,
                        "//button[contains(text(),'Not Now') or "
                        "contains(text(),'ليس الآن') or "
                        "contains(text(),'Not now') or "
                        "contains(text(),'لاحقاً')]", 3)
                    if skip:
                        self.click(skip)
                        self.pause(0.5, 1)
                    else:
                        break

            # تنفيذ Follow
            self.pause(1, 2)
            action_done = self._do_follow()
            print("  [→] رابط خارجي — ننتظر ونقفل.")
            self.pause(1.5, 2.5)

        # ⑤ إغلاق النافذة والرجوع
        try:
            self.driver.close()
        except Exception:
            pass

        try:
            self.driver.switch_to.window(main)
        except Exception:
            self.close_extra_tabs(main)
            return "error"

        self.pause(1, 2)

        # ⑥ ضغط Confirm فقط إذا نجح الفعل
        if action_done:
            confirm = (
                self.find(By.CSS_SELECTOR,
                          "a[onclick*='brojim']", 10) or
                self.find(By.CSS_SELECTOR,
                          "img[src*='confirm']", 5) or
                self.find(By.XPATH,
                          "//*[contains(@onclick,'brojim')]", 5))

            if confirm:
                self.click(confirm)
                print("  [+💰] تم التأكيد! كريدت مجاني ✅")
                self.pause(2, 3)
                return "success"
            else:
                print("  [!] زر Confirm لم يظهر.")
                return "no_confirm"
        else:
            print("  [→] لم يتم الفعل — تخطي Confirm.")
            # ننتظر قليلاً ثم ننتقل للمهمة التالية
            self.pause(2, 3)
            return "skip"

    # ═══════════════════════════════════════════

    def _do_follow(self):
        """محاولة ضغط زر Follow على انستقرام"""
        btn = (
            self.find(By.XPATH,
                "//button[.//div[text()='Follow'] or "
                ".//div[text()='متابعة'] or "
                "text()='Follow' or text()='متابعة']", 8) or
            self.find(By.XPATH,
                "//div[@role='button' and "
                "(text()='Follow' or text()='متابعة')]", 4) or
            self.find(By.XPATH,
                "//header//button[contains(translate(., "
                "'ABCDEFGHIJKLMNOPQRSTUVWXYZ', "
                "'abcdefghijklmnopqrstuvwxyz'), 'follow')]", 4))

        if btn:
            btn_text = btn.text.strip().lower()
            # تأكد أنه "follow" وليس "following" أو "unfollow"
            if btn_text in ("follow", "متابعة", ""):
                self.click(btn)
                self.pause(1, 2)
                print("  [✔] تم ضغط Follow بنجاح! ✅")
                return True
            else:
                print(f"  [!] الزر يقول '{btn_text}' — ربما متابع مسبقاً.")
                return False
        else:
            print("  [!] زر Follow غير موجود.")
            return False


    def _do_like(self):
        """محاولة ضغط زر Like على انستقرام"""
        # 1. البحث عن الزر عبر عدة مستويات وتسميات
        btn = (
            self.find(By.XPATH,
                "//*[local-name()='svg'][translate(@aria-label, 'LIKE', 'like')='like' or "
                "@aria-label='إعجاب' or @aria-label='أعجبني']/ancestor::button[1]", 6) or
            self.find(By.XPATH,
                "//*[local-name()='svg'][translate(@aria-label, 'LIKE', 'like')='like' or "
                "@aria-label='إعجاب' or @aria-label='أعجبني']/ancestor::*[@role='button'][1]", 4) or
            self.find(By.XPATH,
                "//*[@aria-label='Like' or @aria-label='like' or @aria-label='إعجاب' or @aria-label='أعجبني']", 4)
        )

        if btn:
            self.click(btn)
            self.pause(1.5, 2.5)
            print("  [✔] تم ضغط Like بنجاح! ✅")
            return True
        else:
            # 2. ربما يكون البوست تم الإعجاب به مسبقاً
            unlike = self.find(By.XPATH,
                "//*[@aria-label='Unlike' or @aria-label='unlike' or @aria-label='إلغاء الإعجاب' or @aria-label='إلغاء إعجابي']", 2)
            if unlike:
                print("  [✔] الإعجاب موجود مسبقاً! ✅")
                return True
                
            print("  [!] زر Like غير موجود (تحقق من اللغة أو تسجيل الدخول).")
            return False

    # ═══════════════════════════════════════════
    #   4. المحرك الرئيسي
    # ═══════════════════════════════════════════

    def run(self):
        # الخطوة 1: التأكد من تسجيل الانستقرام
        self.ensure_instagram_logged_in()

        # الخطوة 2: الدخول على like4like
        if not self.login_like4like():
            print("[✘] فشل الدخول على Like4Like.")
            return

        cycles = [
            ("IG-Follow",
             "https://www.like4like.org/earn-credits.php?feature=instagramfol"),
        ]

        credits_earned = 0
        round_num = 1

        while True:
            print(f"\n{'═'*50}")
            print(f"  🏁  الجولة {round_num}  |  كريدت محصود: {credits_earned}")
            print(f"{'═'*50}")

            for t_type, url in cycles:
                # 💡 نحدد كل مرة عدد متاح من المهام بين 3 إلى 4 للتنويع وتفادي الحظر
                limit = random.randint(3, 4)
                print(f"\n[>>] التبديل إلى قسم: {t_type} ({limit} محاولات)")
                self.driver.get(url)
                self.pause(2, 3)

                done = 0
                for task_num in range(limit):
                    print(f"\n  --- مهمة {task_num + 1} من {limit} ({t_type}) ---")
                    result = self.do_task(t_type)

                    if result == "success":
                        done += 1
                        credits_earned += 1
                    elif result == "no_tasks":
                        print(f"  [-] لا مهام متاحة حالياً في {t_type}.")
                        break
                    elif result == "skip":
                        # نحدث الصفحة ونحاول المهمة التالية
                        self.driver.get(url)
                        self.pause(1, 2)
                    elif result == "error":
                        self.driver.get(url)
                        self.pause(2, 3)

                    self.pause(1, 2)

                print(f"  [✔] أُنجزت {done} مهام فعلية في {t_type}.")

            print(f"\n[⏳] استراحة قصيرة بين الجولات لتجنب الحظر ...")
            self.pause(8, 15)
            round_num += 1


# ═══════════════════════════════════════════
#   التشغيل
# ═══════════════════════════════════════════
if __name__ == "__main__":
    import shutil
    
    # 1. تنظيف أي عمليات ChromeDriver عالقة
    subprocess.run(["pkill", "-9", "-f", "chromedriver"], capture_output=True)
    
    # 2. إزالة ملف القفل (SingletonLock) لتفادي كراش المتصفح
    lock_file = os.path.join(CHROME_PROFILE, "SingletonLock")
    if os.path.exists(lock_file):
        try:
            os.remove(lock_file)
        except OSError:
            pass
            
    # 3. تنظيف كاش النسخة المعدلة لمتصفح undetected_chromedriver 
    # (النسخة التالفة تسبب توقف Mac وإغلاق مفاجئ - Code Signature)
    uc_cache_dir = os.path.expanduser("~/.local/share/undetected_chromedriver")
    if os.path.exists(uc_cache_dir):
        try:
            shutil.rmtree(uc_cache_dir)
        except OSError:
            pass

    time.sleep(1)

    bot = Like4LikeBot()
    try:
        bot.run()
    except KeyboardInterrupt:
        print("\n[!] إيقاف يدوي.")
    except Exception as e:
        print(f"\n[✘] خطأ: {e}")
    finally:
        try:
            bot.driver.quit()
        except Exception:
            pass