import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProfileSettings from "../components/settings/ProfileSettings";
import ApiKeysSettings from "../components/settings/ApiKeysSettings";
import PlanBillingSettings from "../components/settings/PlanBillingSettings";
import NotificationsSettings from "../components/settings/NotificationsSettings";
import SecuritySettings from "../components/settings/SecuritySettings";
import PreferencesSettings from "../components/settings/PreferencesSettings";
import supabase from "../lib/supabase";

const tabs = [
  { id: "profile", label: "الملف الشخصي" },
  { id: "keys", label: "مفاتيح البرمجة" },
  { id: "plan", label: "الخطة والفوترة" },
  { id: "notifications", label: "الإشعارات" },
  { id: "security", label: "الأمان" },
  { id: "preferences", label: "التفضيلات" },
];

const Settings = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    document.title = "الإعدادات | منصة برايت أي آي";
    const ensureSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        navigate("/login", { replace: true });
      }
    };
    ensureSession();
  }, [navigate]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">الإعدادات</h1>
        <p className="mt-1 text-sm text-slate-400">
          اضبط تفضيلات المنصة وبيانات الحساب.
        </p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="w-full max-w-xs rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="grid gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-xl px-4 py-2 text-right text-sm font-semibold transition ${
                  activeTab === tab.id
                    ? "bg-emerald-400/20 text-emerald-200"
                    : "text-slate-300 hover:bg-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </aside>

        <section className="flex-1 rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
          {activeTab === "profile" ? <ProfileSettings /> : null}
          {activeTab === "keys" ? <ApiKeysSettings /> : null}
          {activeTab === "plan" ? <PlanBillingSettings /> : null}
          {activeTab === "notifications" ? <NotificationsSettings /> : null}
          {activeTab === "security" ? <SecuritySettings /> : null}
          {activeTab === "preferences" ? <PreferencesSettings /> : null}
        </section>
      </div>
    </div>
  );
};

export default Settings;
