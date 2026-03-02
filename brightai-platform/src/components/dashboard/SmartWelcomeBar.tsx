import { memo } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Plus } from "lucide-react";

type SmartWelcomeBarProps = {
  loading: boolean;
  userName: string;
  userAvatar: string;
  greeting: string;
  summaryText: string;
  smartBannerMessages: string[];
};

const SmartWelcomeBar = ({
  loading,
  userName,
  userAvatar,
  greeting,
  summaryText,
  smartBannerMessages,
}: SmartWelcomeBarProps) => {
  return (
    <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/40 p-4 shadow-2xl shadow-slate-950/30 md:p-6">
      {loading ? (
        <div className="grid gap-4">
          <div className="h-6 w-40 animate-pulse rounded-lg bg-slate-800" />
          <div className="h-10 w-72 animate-pulse rounded-lg bg-slate-800" />
          <div className="h-5 w-64 animate-pulse rounded-lg bg-slate-800" />
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              {userAvatar ? (
                <img
                  src={userAvatar}
                  alt="صورة المستخدم"
                  className="h-14 w-14 rounded-2xl border border-emerald-400/30 object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-400/15 text-lg font-bold text-emerald-200">
                  {userName.charAt(0)}
                </div>
              )}
              <div>
                <p className="text-sm text-emerald-300">{greeting}</p>
                <h1 className="text-2xl font-extrabold text-slate-100 md:text-3xl">{userName}</h1>
                <p className="text-sm text-slate-300">{summaryText}</p>
              </div>
            </div>

            <Link
              to="/agents/new"
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:-translate-y-0.5 hover:bg-emerald-300"
            >
              <Plus className="h-4 w-4" />
              إنشاء وكيل جديد
            </Link>
          </div>

          {smartBannerMessages.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-100">
              <AlertTriangle className="h-4 w-4" />
              {smartBannerMessages.map((message) => (
                <span key={message} className="rounded-full bg-slate-950/50 px-2 py-1 text-xs">
                  {message}
                </span>
              ))}
            </div>
          ) : null}
        </>
      )}
    </section>
  );
};

export default memo(SmartWelcomeBar);
