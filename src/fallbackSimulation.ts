import type { CrossingDirection } from "./immdQueue";
import type { AppLocale } from "./locales";
import { fallbackScenarioLabel } from "./locales";

/** 北京日期 YYYY-MM-DD */
export function beijingISODate(now: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** 2026 清明前后返程窗口（4–6 日，北京时间）。 */
export function isQingming2026ReturnWindow(dateKey: string): boolean {
  return dateKey >= "2026-04-04" && dateKey <= "2026-04-06";
}

function stable01(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function intRange(seed: number, min: number, max: number): number {
  const r = stable01(seed);
  return min + Math.floor(r * (max - min + 1));
}

const HEAVY_RETURN_SZ_PORTS = new Set(["luohu", "futian", "shenzhenbay"]);

export type FallbackPortSim = {
  smoothness: number;
  etaMinutes: number;
  scenarioLabel: string;
};

/**
 * API 不可用时的保底模拟（稳定到同一次 revision + 方向 + 日期）。
 */
export function buildFallbackSimulation(
  portId: string,
  direction: CrossingDirection,
  dateKey: string,
  revision: number,
  locale: AppLocale
): FallbackPortSim {
  const qm = isQingming2026ReturnWindow(dateKey);
  const seedBase =
    revision * 9973 +
    portId.split("").reduce((a, c) => a + c.charCodeAt(0), 0) * 131 +
    (direction === "TO_SZ" ? 17 : 29) +
    (qm ? 1009 : 0);

  const scenarioLabel = fallbackScenarioLabel(locale, qm);

  if (
    qm &&
    direction === "TO_SZ" &&
    HEAVY_RETURN_SZ_PORTS.has(portId)
  ) {
    return {
      smoothness: intRange(seedBase, 30, 50),
      etaMinutes: intRange(seedBase + 1, 45, 60),
      scenarioLabel,
    };
  }

  if (qm && direction === "TO_SZ") {
    return {
      smoothness: intRange(seedBase, 35, 55),
      etaMinutes: intRange(seedBase + 1, 35, 55),
      scenarioLabel,
    };
  }

  if (qm && direction === "TO_HK") {
    return {
      smoothness: intRange(seedBase, 48, 72),
      etaMinutes: intRange(seedBase + 1, 18, 40),
      scenarioLabel,
    };
  }

  return {
    smoothness: intRange(seedBase, 55, 82),
    etaMinutes: intRange(seedBase + 1, 15, 38),
    scenarioLabel,
  };
}
