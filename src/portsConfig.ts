import type { LucideIcon } from "lucide-react";
import { Bus, MapPin, TrainFront, Truck, Waypoints } from "lucide-react";

/** 北京时间下的「从 0:00 起的分钟数」，用于区间判断。 */
function M(h: number, m: number): number {
  return h * 60 + m;
}

export type OperatingHours =
  | { kind: "24h" }
  | {
      kind: "daily";
      /** 含首分钟 */
      open: number;
      /** 不含末刻：例如 24:00 关 = 1440，表示 [open, 1440) */
      close: number;
    };

export type PortDef = {
  id: string;
  hours: OperatingHours;
  icon: LucideIcon;
};

export const PORTS: PortDef[] = [
  {
    id: "huanggang",
    hours: { kind: "24h" },
    icon: Bus,
  },
  {
    id: "luohu",
    hours: { kind: "daily", open: M(6, 30), close: M(24, 0) },
    icon: TrainFront,
  },
  {
    id: "futian",
    hours: { kind: "daily", open: M(6, 30), close: M(22, 30) },
    icon: TrainFront,
  },
  {
    id: "shenzhenbay",
    hours: { kind: "daily", open: M(6, 30), close: M(24, 0) },
    icon: MapPin,
  },
  {
    id: "liantang",
    hours: { kind: "daily", open: M(7, 0), close: M(22, 0) },
    icon: Waypoints,
  },
  {
    id: "wenjindu",
    hours: { kind: "daily", open: M(7, 0), close: M(22, 0) },
    icon: Truck,
  },
];

export const I_PORT_LIVE_URL = "https://ka.sz.gov.cn/";

export function beijingMinutesSinceMidnight(now: Date): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Shanghai",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const num = (t: string) =>
    Number(parts.find((p) => p.type === t)?.value ?? "0");
  return num("hour") * 60 + num("minute");
}

export function isWithinOperatingHours(now: Date, hours: OperatingHours): boolean {
  if (hours.kind === "24h") return true;
  const m = beijingMinutesSinceMidnight(now);
  return m >= hours.open && m < hours.close;
}
