import { useState } from "react";
import supabase from "../../lib/supabase";

type OAuthProvider = "google" | "github" | "azure";

type OAuthButtonsProps = {
  showMicrosoft?: boolean;
  showGithub?: boolean;
};

const OAuthButtons = ({
  showMicrosoft = true,
  showGithub = true,
}: OAuthButtonsProps) => {
  const [loadingProvider, setLoadingProvider] = useState<OAuthProvider | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleOAuth = async (provider: OAuthProvider) => {
    setErrorMessage(null);
    setLoadingProvider(provider);

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });

    if (error) {
      setErrorMessage("تعذر بدء تسجيل الدخول عبر المزود.");
      setLoadingProvider(null);
      return;
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        className="flex items-center justify-center gap-3 rounded-xl border border-slate-800 bg-white px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
        onClick={() => handleOAuth("google")}
        disabled={loadingProvider !== null}
        aria-label="تسجيل الدخول عبر جوجل"
      >
        <span
          className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-500 via-red-500 to-emerald-500"
          aria-hidden="true"
        />
        {loadingProvider === "google" ? "جارٍ التحويل..." : "الدخول عبر جوجل"}
      </button>

      {showMicrosoft ? (
        <button
          type="button"
          className="flex items-center justify-center gap-3 rounded-xl border border-slate-800 bg-[#2f2f2f] px-4 py-3 text-sm font-semibold text-white hover:bg-[#3c3c3c] disabled:cursor-not-allowed disabled:opacity-60"
          onClick={() => handleOAuth("azure")}
          disabled={loadingProvider !== null}
          aria-label="تسجيل الدخول عبر مايكروسوفت"
        >
          <span
            className="h-6 w-6 rounded bg-white"
            aria-hidden="true"
          />
          {loadingProvider === "azure"
            ? "جارٍ التحويل..."
            : "الدخول عبر مايكروسوفت"}
        </button>
      ) : null}

      {showGithub ? (
        <button
          type="button"
          className="flex items-center justify-center gap-3 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={() => handleOAuth("github")}
          disabled={loadingProvider !== null}
          aria-label="تسجيل الدخول عبر جيت هب"
        >
          <span
            className="h-6 w-6 rounded-full bg-slate-800"
            aria-hidden="true"
          />
          {loadingProvider === "github" ? "جارٍ التحويل..." : "الدخول عبر جيت هب"}
        </button>
      ) : null}

      {errorMessage ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs text-red-200">
          {errorMessage}
        </div>
      ) : null}
    </div>
  );
};

export default OAuthButtons;
