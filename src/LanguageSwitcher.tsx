import { Languages } from "lucide-react";
import type { AppLocale } from "./locales";
import { LOCALE_LABEL } from "./locales";
import { useI18n } from "./i18n";

const MODES: AppLocale[] = ["sc", "tc", "en"];

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();

  return (
    <div className="mx-auto mt-5 flex w-full max-w-lg flex-col items-center gap-2">
      <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.2em] text-fuchsia-400/60">
        <Languages className="h-3.5 w-3.5 text-cyan-400/70" aria-hidden />
        <span>{t("lang.switch")}</span>
      </div>
      <div
        className="flex w-full flex-wrap justify-center gap-2 sm:gap-3"
        role="group"
        aria-label={t("lang.switch")}
      >
        {MODES.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setLocale(m)}
            className={`min-w-[5.5rem] rounded-xl border px-4 py-2.5 text-center transition-all duration-300 ease-out sm:min-w-[6.5rem] ${
              locale === m
                ? "border-fuchsia-400/55 bg-gradient-to-br from-fuchsia-950/70 to-cyan-950/50 text-white shadow-[0_0_24px_rgba(168,85,247,0.25)] ring-1 ring-cyan-400/25"
                : "border-slate-600/50 bg-slate-900/40 text-slate-500 hover:border-slate-500 hover:text-slate-300"
            }`}
            aria-pressed={locale === m}
            title={
              m === "sc"
                ? t("lang.sc")
                : m === "tc"
                  ? t("lang.tc")
                  : t("lang.en")
            }
          >
            <span className="block font-display text-sm font-bold tracking-wide">
              {LOCALE_LABEL[m]}
            </span>
            <span className="mt-0.5 block max-w-[7rem] truncate text-[10px] font-normal opacity-80 sm:max-w-none">
              {m === "sc" ? t("lang.sc") : m === "tc" ? t("lang.tc") : t("lang.en")}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
