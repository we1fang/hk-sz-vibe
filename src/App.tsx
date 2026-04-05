import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRightLeft,
  Clock3,
  ExternalLink,
  PlaneLanding,
  PlaneTakeoff,
  RefreshCw,
  Sparkles,
  Zap,
} from "lucide-react";
import {
  I_PORT_LIVE_URL,
  PORTS,
  isWithinOperatingHours,
} from "./portsConfig";
import {
  PORT_ID_TO_IMMD,
  type CrossingDirection,
  type ImmdCode,
  type ImmdQueuePayload,
  etaMinutesFromVisitorCode,
  fetchVisitorQueues,
  getVisitorQueueJsonUrl,
  pickQueueForDirection,
} from "./immdQueue";
import {
  beijingISODate,
  buildFallbackSimulation,
} from "./fallbackSimulation";
import type { AppLocale } from "./locales";
import { visitorLabelsForCode } from "./locales";
import { useI18n } from "./i18n";
import { LanguageSwitcher } from "./LanguageSwitcher";

function intlLocale(l: AppLocale): string {
  if (l === "en") return "en-GB";
  if (l === "tc") return "zh-TW";
  return "zh-CN";
}

function formatBeijingTime(d: Date, l: AppLocale): string {
  return new Intl.DateTimeFormat(intlLocale(l), {
    timeZone: "Asia/Shanghai",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(d);
}

function formatBeijingDate(d: Date, l: AppLocale): string {
  return new Intl.DateTimeFormat(intlLocale(l), {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(d);
}

function isPayloadComplete(p: ImmdQueuePayload): boolean {
  const codes = [
    ...new Set(
      Object.values(PORT_ID_TO_IMMD).filter(
        (c): c is ImmdCode => c !== undefined
      )
    ),
  ];
  return codes.every((k) => {
    const row = p[k];
    if (!row || typeof row !== "object") return false;
    return (
      typeof row.arrQueue === "number" && typeof row.depQueue === "number"
    );
  });
}

function isAllMappedQueuesZero(p: ImmdQueuePayload): boolean {
  const codes = [
    ...new Set(
      Object.values(PORT_ID_TO_IMMD).filter(
        (c): c is ImmdCode => c !== undefined
      )
    ),
  ];
  return codes.every((k) => p[k].arrQueue === 0 && p[k].depQueue === 0);
}

export default function App() {
  const { t, locale } = useI18n();
  const [now, setNow] = useState(() => new Date());
  const [direction, setDirection] = useState<CrossingDirection>("TO_HK");
  const [payload, setPayload] = useState<ImmdQueuePayload | null>(null);
  const [immdError, setImmdError] = useState<string | null>(null);
  const [immdLoading, setImmdLoading] = useState(true);
  const [fetchedAt, setFetchedAt] = useState<Date | null>(null);
  const [cardAnimating, setCardAnimating] = useState(false);
  const [fallbackRevision, setFallbackRevision] = useState(0);

  const loadImmd = useCallback(async () => {
    setImmdLoading(true);
    try {
      const data = await fetchVisitorQueues();
      if (!isPayloadComplete(data)) {
        throw new Error(t("error.jsonIncomplete"));
      }
      setPayload(data);
      setFetchedAt(new Date());
      setImmdError(null);
    } catch (e) {
      setPayload(null);
      setImmdError(
        e instanceof Error ? e.message : t("error.unknown")
      );
      setFallbackRevision((r) => r + 1);
    } finally {
      setImmdLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadImmd();
  }, [loadImmd]);

  useEffect(() => {
    const tick = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(tick);
  }, []);

  const handleRefresh = useCallback(() => {
    setCardAnimating(true);
    void loadImmd();
    window.setTimeout(() => setCardAnimating(false), 480);
  }, [loadImmd]);

  const timeStr = useMemo(
    () => formatBeijingTime(now, locale),
    [now, locale]
  );
  const dateStr = useMemo(
    () => formatBeijingDate(now, locale),
    [now, locale]
  );

  const directionHint =
    direction === "TO_HK"
      ? t("direction.hint.arrival")
      : t("direction.hint.departure");

  const fetchedLabel = fetchedAt
    ? new Intl.DateTimeFormat(intlLocale(locale), {
        timeZone: "Asia/Shanghai",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).format(fetchedAt)
    : null;

  const beijingDate = beijingISODate(now);

  const fallbackMap = useMemo(() => {
    if (!immdError) return null;
    const m: Record<
      string,
      ReturnType<typeof buildFallbackSimulation>
    > = {};
    for (const p of PORTS) {
      m[p.id] = buildFallbackSimulation(
        p.id,
        direction,
        beijingDate,
        fallbackRevision,
        locale
      );
    }
    return m;
  }, [immdError, direction, beijingDate, fallbackRevision, locale]);

  const allZeroNormal =
    payload && !immdError && isAllMappedQueuesZero(payload);

  const apiJsonUrl = getVisitorQueueJsonUrl();

  type QuickPickRow = {
    id: string;
    name: string;
    smoothness: number;
    eta: number;
  };

  const quickPick = useMemo(() => {
    const openPorts = PORTS.filter((p) =>
      isWithinOperatingHours(now, p.hours)
    );
    if (openPorts.length === 0) {
      return { kind: "all_closed" as const };
    }
    if (!immdError && (immdLoading || !payload)) {
      return { kind: "loading" as const };
    }

    const rows: QuickPickRow[] = [];

    for (const p of openPorts) {
      const immdCode = PORT_ID_TO_IMMD[p.id];
      if (!immdCode) continue;

      if (!immdError && payload) {
        try {
          const qc = pickQueueForDirection(payload, immdCode, direction);
          const meta = visitorLabelsForCode(locale, qc);
          if (meta.smoothness === null) continue;
          const eta = etaMinutesFromVisitorCode(qc);
          if (eta === null) continue;
          rows.push({
            id: p.id,
            name: t(`port.name.${p.id}`),
            smoothness: meta.smoothness,
            eta,
          });
        } catch {
          /* skip */
        }
      } else if (immdError && fallbackMap?.[p.id]) {
        const fb = fallbackMap[p.id]!;
        rows.push({
          id: p.id,
          name: t(`port.name.${p.id}`),
          smoothness: fb.smoothness,
          eta: fb.etaMinutes,
        });
      }
    }

    if (rows.length === 0) {
      return { kind: "no_rank" as const };
    }

    rows.sort((a, b) =>
      b.smoothness !== a.smoothness
        ? b.smoothness - a.smoothness
        : a.eta - b.eta
    );

    return {
      kind: "ready" as const,
      top: rows[0],
      runnerUp: rows[1],
    };
  }, [
    now,
    direction,
    payload,
    immdError,
    immdLoading,
    fallbackMap,
    locale,
    t,
  ]);

  return (
    <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-4 pb-12 pt-8 sm:px-6 lg:px-8">
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.12]"
        style={{
          backgroundImage: `linear-gradient(rgba(168, 85, 247, 0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(168, 85, 247, 0.15) 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
        }}
      />

      <header className="mb-8 text-center">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-fuchsia-500/30 bg-fuchsia-950/20 px-4 py-1 text-xs font-medium uppercase tracking-[0.2em] text-fuchsia-300/90 shadow-neon-sm">
          <Sparkles className="h-3.5 w-3.5 text-cyan-400" aria-hidden />
          {t("header.badge")}
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-white drop-shadow-[0_0_18px_rgba(168,85,247,0.45)] sm:text-4xl">
          {t("header.title")}
        </h1>
        <p className="mt-2 flex flex-wrap items-center justify-center gap-x-1 gap-y-1 text-sm text-slate-400">
          <ArrowRightLeft
            className="h-4 w-4 shrink-0 text-cyan-400/90"
            aria-hidden
          />
          <span>{t("header.subtitle.before")}</span>
          <span className="text-cyan-300/80">{t("header.subtitle.dataGov")}</span>
          <span>{t("header.subtitle.mid")}</span>
          <code className="rounded bg-slate-800/80 px-1 text-[11px] text-slate-300">
            info.gov.hk
          </code>
          <span>{t("header.subtitle.after")}</span>
        </p>
        <p className="mx-auto mt-1 max-w-2xl text-center text-[10px] text-slate-600">
          {t("header.devPath")}
          <code className="text-slate-500"> {apiJsonUrl}</code>
        </p>

        <div className="mx-auto mt-5 w-full max-w-2xl">
          <div className="relative overflow-hidden rounded-2xl border border-fuchsia-400/45 bg-gradient-to-br from-fuchsia-950/55 via-[#0f1538]/90 to-cyan-950/40 px-4 py-4 shadow-[0_0_32px_rgba(168,85,247,0.22),inset_0_1px_0_rgba(255,255,255,0.06)] transition-colors duration-300 sm:px-5 sm:py-4">
            <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-cyan-500/15 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-8 -left-4 h-28 w-28 rounded-full bg-fuchsia-600/15 blur-2xl" />
            <div className="relative flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-fuchsia-400/35 bg-fuchsia-500/15 text-fuchsia-200 shadow-neon-sm">
                <Zap className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0 flex-1 text-left">
                <p className="font-display text-[10px] font-bold uppercase tracking-[0.2em] text-fuchsia-300/90">
                  {t("recommend.title")}
                </p>
                {quickPick.kind === "loading" ? (
                  <p className="mt-2 animate-pulse text-sm text-slate-400">
                    {t("recommend.loading")}
                  </p>
                ) : quickPick.kind === "all_closed" ? (
                  <p className="mt-2 text-sm text-slate-500">
                    {t("recommend.allClosed")}
                  </p>
                ) : quickPick.kind === "no_rank" ? (
                  <p className="mt-2 text-sm text-slate-500">
                    {t("recommend.noRank")}
                  </p>
                ) : (
                  <>
                    <p className="mt-2 font-display text-lg font-bold leading-snug text-white sm:text-xl">
                      {t("recommend.pickPrefix")}
                      <span className="bg-gradient-to-r from-cyan-200 to-fuchsia-200 bg-clip-text text-transparent">
                        {quickPick.top.name}
                      </span>
                      {t("recommend.pickSuffix", { eta: quickPick.top.eta })}
                    </p>
                    {quickPick.runnerUp ? (
                      <p className="mt-2 text-xs leading-relaxed text-slate-400 sm:text-sm">
                        {t("recommend.runnerFull", {
                          name: quickPick.runnerUp.name,
                          eta: quickPick.runnerUp.eta,
                          dir: directionHint,
                        })}
                      </p>
                    ) : (
                      <p className="mt-2 text-xs text-slate-500">
                        {t("recommend.onlyOne", { dir: directionHint })}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <LanguageSwitcher />

        <div className="mt-6 flex flex-col items-center gap-1 rounded-2xl border border-cyan-500/20 bg-cyber-panel/60 px-6 py-5 shadow-neon backdrop-blur-sm transition-colors duration-300">
          <div className="flex items-center gap-2 text-cyan-400/90">
            <Clock3 className="h-5 w-5" aria-hidden />
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              {t("time.beijing")}
            </span>
          </div>
          <time
            dateTime={now.toISOString()}
            className="font-display text-4xl font-bold tabular-nums text-white sm:text-5xl"
          >
            {timeStr}
          </time>
          <p className="text-sm text-slate-500">{dateStr}</p>
        </div>

        <div className="mx-auto mt-6 w-full max-w-xl px-1">
          <p className="mb-2 text-center text-[10px] font-medium uppercase tracking-[0.25em] text-fuchsia-400/70">
            {t("direction.section")}
          </p>
          <div
            className="relative grid h-14 grid-cols-2 gap-1 rounded-2xl border border-fuchsia-500/35 bg-[#060818]/95 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
            role="tablist"
            aria-label={t("direction.section")}
          >
            <div
              className="pointer-events-none absolute inset-y-1 left-1 rounded-xl bg-gradient-to-r from-fuchsia-600/55 via-violet-600/45 to-cyan-500/40 shadow-[0_0_28px_rgba(168,85,247,0.35),0_0_1px_rgba(34,211,238,0.5)] ring-1 ring-fuchsia-400/25 transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{
                width: "calc(50% - 6px)",
                transform:
                  direction === "TO_HK"
                    ? "translateX(0)"
                    : "translateX(calc(100% + 8px))",
              }}
            />
            <button
              type="button"
              role="tab"
              aria-selected={direction === "TO_HK"}
              onClick={() => setDirection("TO_HK")}
              className={`relative z-10 flex items-center justify-center gap-2 rounded-xl px-2 text-[11px] font-semibold transition sm:text-sm ${
                direction === "TO_HK"
                  ? "text-white drop-shadow-[0_0_12px_rgba(168,85,247,0.5)]"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <PlaneTakeoff className="h-4 w-4 shrink-0 text-cyan-300" aria-hidden />
              <span className="flex flex-col items-center leading-tight sm:flex-row sm:gap-1.5">
                <span>{t("direction.toHK")}</span>
                <span className="font-mono text-[10px] text-slate-400">
                  {t("direction.toHKSub")}
                </span>
              </span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={direction === "TO_SZ"}
              onClick={() => setDirection("TO_SZ")}
              className={`relative z-10 flex items-center justify-center gap-2 rounded-xl px-2 text-[11px] font-semibold transition sm:text-sm ${
                direction === "TO_SZ"
                  ? "text-white drop-shadow-[0_0_12px_rgba(34,211,238,0.35)]"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <PlaneLanding className="h-4 w-4 shrink-0 text-fuchsia-300" aria-hidden />
              <span className="flex flex-col items-center leading-tight sm:flex-row sm:gap-1.5">
                <span>{t("direction.toSZ")}</span>
                <span className="font-mono text-[10px] text-slate-400">
                  {t("direction.toSZSub")}
                </span>
              </span>
            </button>
          </div>
          <p className="mt-2 text-center text-[11px] text-slate-500">
            {t("direction.current")}
            <span className="text-cyan-300/90">
              {direction === "TO_HK"
                ? t("direction.arrivalQueue")
                : t("direction.departureQueue")}
            </span>
          </p>
        </div>

        {(immdError || fetchedLabel) && (
          <div className="mx-auto mt-4 max-w-2xl rounded-xl border border-slate-600/50 bg-slate-900/40 px-4 py-3 text-left text-xs text-slate-300 sm:text-sm">
            {immdError ? (
              <p>
                <span className="text-amber-400">{t("sync.errorPrefix")}</span>
                {immdError}
                {import.meta.env.PROD ? t("sync.prodHint") : null}
              </p>
            ) : (
              <p className="text-slate-400">
                {t("sync.synced")}
                <span className="text-slate-200">{fetchedLabel}</span>
                {immdLoading ? t("sync.refreshing") : null}
              </p>
            )}
            {allZeroNormal ? (
              <p className="mt-2 text-[11px] leading-relaxed text-cyan-200/70">
                {t("sync.allZeroHint")}
              </p>
            ) : null}
          </div>
        )}
      </header>

      <main className="grid flex-1 grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-5">
        {PORTS.map((p) => {
          const Icon = p.icon;
          const open = isWithinOperatingHours(now, p.hours);
          const closed = !open;
          const immdCode = PORT_ID_TO_IMMD[p.id];

          const apiUnreachable = Boolean(immdError);
          const noJsonPort = immdCode === undefined;

          let queueMeta: ReturnType<typeof visitorLabelsForCode> | null =
            null;
          let queueCode: number | null = null;

          const liveReady =
            open &&
            !noJsonPort &&
            payload &&
            !apiUnreachable &&
            !immdLoading;

          if (liveReady) {
            try {
              queueCode = pickQueueForDirection(payload, immdCode, direction);
              queueMeta = visitorLabelsForCode(locale, queueCode);
            } catch {
              queueMeta = null;
            }
          }

          const fb = fallbackMap?.[p.id];
          const useFallbackLand =
            open && !noJsonPort && apiUnreachable && fb !== undefined;

          const showNoJsonHint =
            open &&
            noJsonPort &&
            !apiUnreachable;

          const showApiFailNoJson =
            open && noJsonPort && apiUnreachable;

          const showLiveBroken =
            open &&
            !noJsonPort &&
            !immdLoading &&
            !apiUnreachable &&
            payload &&
            !queueMeta;

          const smoothness = useFallbackLand
            ? fb.smoothness
            : (queueMeta?.smoothness ?? null);

          const hue = closed
            ? "from-slate-800/30 to-slate-900/40"
            : useFallbackLand || showApiFailNoJson
              ? "from-amber-900/25 to-slate-900/40"
              : showNoJsonHint || showLiveBroken
                ? "from-slate-700/25 to-slate-900/35"
                : smoothness === null
                  ? "from-slate-600/20 to-slate-900/30"
                  : smoothness >= 80
                    ? "from-emerald-500/20 to-cyan-500/10"
                    : smoothness >= 60
                      ? "from-amber-500/15 to-fuchsia-500/10"
                      : "from-rose-500/15 to-fuchsia-900/20";

          const portName = t(`port.name.${p.id}`);
          const hoursLabel = t(`port.hours.${p.id}`);

          return (
            <article
              key={p.id}
              className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-gradient-to-br bg-cyber-panel/80 p-4 shadow-[0_0_0_1px_rgba(168,85,247,0.08)_inset] backdrop-blur-md transition-all duration-300 sm:p-5 ${
                closed
                  ? "border-slate-600/50 grayscale opacity-[0.72]"
                  : "border-fuchsia-500/25 hover:border-fuchsia-400/40 hover:shadow-neon"
              } ${hue} ${cardAnimating ? "animate-card-refresh" : ""}`}
            >
              {!closed ? (
                <>
                  <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-fuchsia-600/10 blur-2xl" />
                  <div className="absolute -bottom-6 -left-6 h-20 w-20 rounded-full bg-cyan-500/10 blur-2xl" />
                </>
              ) : null}

              <div className="relative flex flex-1 flex-col">
                <div
                  className={`mb-3 inline-flex w-fit rounded-lg border p-2 ${
                    closed
                      ? "border-slate-600/50 bg-slate-800/40 text-slate-400"
                      : "border-fuchsia-500/30 bg-fuchsia-950/30 text-fuchsia-300"
                  }`}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <h2 className="font-display text-lg font-bold text-white sm:text-xl">
                  {portName}
                </h2>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-500 sm:text-xs">
                  {t("card.hoursPrefix")}
                  {hoursLabel}
                </p>

                <p
                  className={`mt-2 text-[11px] font-medium sm:text-xs ${
                    closed ? "text-slate-500" : "text-cyan-400/90"
                  }`}
                >
                  {t("card.statusPrefix")}
                  {closed ? t("card.closed") : directionHint}
                </p>

                <div className="relative mt-3 flex-1 space-y-3">
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500 sm:text-xs">
                      {t("card.queueSmoothness")}
                    </p>
                    {closed ? (
                      <p className="mt-2 text-[11px] leading-relaxed text-slate-500 sm:text-xs">
                        {t("card.closedHint")}
                      </p>
                    ) : immdLoading && !noJsonPort && !apiUnreachable ? (
                      <p className="mt-2 animate-pulse text-sm text-slate-400">
                        {t("card.syncing")}
                      </p>
                    ) : immdLoading && apiUnreachable && !noJsonPort ? (
                      <p className="mt-2 animate-pulse text-sm text-amber-200/80">
                        {t("card.retrying")}
                      </p>
                    ) : useFallbackLand && fb ? (
                      <>
                        <p className="mt-2 rounded-lg border border-rose-500/35 bg-rose-950/25 px-2 py-2 text-[11px] font-medium leading-relaxed text-rose-100/95 sm:text-xs">
                          {t("card.apiFail")}
                        </p>
                        <p className="mt-2 text-[10px] leading-relaxed text-amber-200/85 sm:text-[11px]">
                          {fb.scenarioLabel}
                        </p>
                        <div className="mt-2 flex items-baseline gap-1">
                          <span className="font-display text-4xl font-bold tabular-nums text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-white to-fuchsia-300 sm:text-5xl">
                            {fb.smoothness}
                          </span>
                          <span className="text-xl font-semibold text-amber-400/90 sm:text-2xl">
                            %
                          </span>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-900/80">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-amber-600 via-rose-500 to-fuchsia-600 transition-[width] duration-500 ease-out"
                            style={{ width: `${fb.smoothness}%` }}
                          />
                        </div>
                        <p className="mt-1 text-[10px] text-slate-500">
                          {t("card.fallbackDisclaimer")}
                        </p>
                      </>
                    ) : showApiFailNoJson ? (
                      <p className="mt-2 rounded-lg border border-rose-500/35 bg-rose-950/25 px-2 py-2 text-[11px] leading-relaxed text-rose-100/95 sm:text-xs">
                        {t("card.apiFail")}
                        <span className="mt-1 block text-[10px] font-normal text-rose-200/70">
                          {t("card.apiFailNoJsonSub")}
                        </span>
                      </p>
                    ) : showNoJsonHint ? (
                      <p className="mt-2 rounded-lg border border-amber-500/25 bg-amber-950/20 px-2 py-2 text-[11px] leading-relaxed text-amber-200/90 sm:text-xs">
                        {t("card.noLiveData")}
                      </p>
                    ) : showLiveBroken ? (
                      <p className="mt-2 rounded-lg border border-rose-500/30 bg-rose-950/20 px-2 py-2 text-[11px] leading-relaxed text-rose-100/90 sm:text-xs">
                        {t("card.parseFail")}
                      </p>
                    ) : queueMeta ? (
                      <>
                        <p className="mt-1 text-[11px] text-fuchsia-200/90 sm:text-xs">
                          {queueMeta.label}
                          {queueCode !== null ? (
                            <span className="ml-1.5 font-mono text-[10px] text-slate-500">
                              [{queueCode}]
                            </span>
                          ) : null}
                        </p>
                        <p className="mt-0.5 text-[10px] leading-relaxed text-slate-500 sm:text-[11px]">
                          {queueMeta.officialWaitText}
                        </p>
                        {smoothness !== null ? (
                          <>
                            <div className="mt-2 flex items-baseline gap-1">
                              <span className="font-display text-4xl font-bold tabular-nums text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-300 via-white to-cyan-300 sm:text-5xl">
                                {smoothness}
                              </span>
                              <span className="text-xl font-semibold text-fuchsia-400/80 sm:text-2xl">
                                %
                              </span>
                            </div>
                            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-900/80">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-fuchsia-600 via-purple-500 to-cyan-400 shadow-[0_0_12px_rgba(168,85,247,0.6)] transition-[width] duration-500 ease-out"
                                style={{ width: `${smoothness}%` }}
                              />
                            </div>
                          </>
                        ) : (
                          <p className="mt-2 font-display text-lg text-slate-500">
                            —
                          </p>
                        )}
                      </>
                    ) : null}
                  </div>

                  <div
                    className={`rounded-xl border px-3 py-2.5 text-[11px] sm:text-sm ${
                      closed
                        ? "border-slate-600/40 bg-slate-900/60 text-slate-500"
                        : "border-cyan-500/20 bg-cyan-950/20 text-slate-400"
                    }`}
                  >
                    <span className="block text-[10px] uppercase tracking-wider text-slate-500">
                      {useFallbackLand
                        ? t("card.etaSim")
                        : t("card.etaOfficial")}
                    </span>
                    <span
                      className={`mt-1 block font-display text-base font-semibold leading-snug sm:text-lg ${
                        closed ? "text-slate-500" : "text-cyan-200/90"
                      }`}
                    >
                      {closed
                        ? "—"
                        : useFallbackLand && fb
                          ? t("card.etaMinutesSim", { n: fb.etaMinutes })
                          : queueMeta
                            ? queueMeta.bandText
                            : "—"}
                    </span>
                  </div>
                </div>

                <a
                  href={I_PORT_LIVE_URL}
                  target="_blank"
                  rel="noreferrer"
                  className={`relative mt-4 inline-flex items-center gap-1 text-[10px] leading-snug transition sm:text-[11px] ${
                    closed
                      ? "text-slate-500 hover:text-slate-400"
                      : "text-cyan-500/80 hover:text-cyan-300"
                  }`}
                >
                  {t("card.linkIPort")}
                  <ExternalLink className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
                </a>
              </div>
            </article>
          );
        })}
      </main>

      <footer className="mt-10 space-y-6">
        <div className="mx-auto max-w-3xl rounded-2xl border border-fuchsia-500/20 bg-cyber-panel/50 p-5 text-left text-xs leading-relaxed text-slate-500 sm:text-sm">
          <p>{t("footer.body")}</p>
          <p className="mt-3">
            {t("footer.sourcePrefix")}
            <a
              href="https://www.data.gov.hk/"
              target="_blank"
              rel="noreferrer"
              className="text-cyan-400 transition hover:text-cyan-300 hover:underline"
            >
              data.gov.hk
            </a>
            {t("footer.sourceSuffix")}
          </p>
        </div>

        <div className="flex justify-center">
          <button
            type="button"
            disabled={immdLoading}
            onClick={handleRefresh}
            className="group inline-flex items-center gap-3 rounded-xl border border-fuchsia-500/40 bg-gradient-to-r from-fuchsia-950/80 to-indigo-950/80 px-8 py-4 font-display text-sm font-semibold uppercase tracking-widest text-fuchsia-100 shadow-neon-sm transition enabled:hover:border-fuchsia-400/60 enabled:hover:from-fuchsia-900/90 enabled:hover:to-indigo-900/90 enabled:hover:shadow-neon enabled:active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
          >
            <RefreshCw
              className={`h-5 w-5 text-cyan-400 transition group-hover:rotate-180 group-active:rotate-[360deg] duration-500 ${immdLoading ? "animate-spin" : ""}`}
              aria-hidden
            />
            {t("footer.refresh")}
          </button>
        </div>
      </footer>
    </div>
  );
}
