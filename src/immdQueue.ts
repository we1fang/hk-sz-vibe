/**
 * 香港入境事务处「陆路边境管制站等候时间」开放数据（访港旅客 CPQueueTimeV.json）。
 * 数据字典：https://www.immd.gov.hk/opendata/hkt/transport/immigration_clearance/data_dictionary_for_land_boundary_control_points_waiting_time.pdf
 *
 * 浏览器只请求同源相对路径 /immd-data/*，由：
 * - 本地：vite.config.ts server.proxy
 * - 生产：vercel.json rewrites
 * 转发至 https://secure1.info.gov.hk/immd/mobileapps/2bb9ae17/data/
 * 避免直连外域触发 CORS。
 */

export const IMMD_CODES = [
  "HYW",
  "HZM",
  "LMC",
  "LSC",
  "LWS",
  "MKT",
  "SBC",
  "STK",
] as const;

export type ImmdCode = (typeof IMMD_CODES)[number];

export type ImmdQueuePayload = Record<
  ImmdCode,
  { arrQueue: number; depQueue: number }
>;

/** 与 App 内口岸 id 对应；无陆路 JSON 的口岸不配置。 */
export const PORT_ID_TO_IMMD: Record<string, ImmdCode | undefined> = {
  huanggang: "LMC",
  luohu: "LWS",
  futian: "LSC",
  shenzhenbay: "SBC",
  liantang: "HYW",
  wenjindu: "MKT",
};

export type CrossingDirection = "TO_HK" | "TO_SZ";

export type QueueStatusCode = 0 | 1 | 2 | 4 | 99;

export function normalizeQueueStatus(n: number): QueueStatusCode {
  if (n === 0 || n === 1 || n === 2 || n === 4 || n === 99) return n;
  return 4;
}

/**
 * TO_HK：抵港（香港入境侧）→ arrQueue
 * TO_SZ：离港（香港出境侧）→ depQueue
 */
export function pickQueueForDirection(
  payload: ImmdQueuePayload,
  code: ImmdCode,
  direction: CrossingDirection
): QueueStatusCode {
  const row = payload[code];
  const raw =
    direction === "TO_HK" ? row.arrQueue : row.depQueue;
  return normalizeQueueStatus(raw);
}

export function statusFromVisitorCode(code: QueueStatusCode): {
  label: string;
  officialWaitText: string;
  bandText: string;
  smoothness: number | null;
} {
  if (code === 99) {
    return {
      label: "非服务时间",
      officialWaitText: "非服务时间：当前为非服务时段（代码 99）。",
      bandText: "非服务时间",
      smoothness: null,
    };
  }
  if (code === 4) {
    return {
      label: "系统维护",
      officialWaitText: "系统维护中（代码 4）。",
      bandText: "系统维护中",
      smoothness: null,
    };
  }
  if (code === 0) {
    return {
      label: "正常",
      officialWaitText: "正常：一般少于 30 分钟（访港旅客口径）。",
      bandText: "一般少于 30 分钟（访港旅客）",
      smoothness: 88,
    };
  }
  if (code === 1) {
    return {
      label: "繁忙",
      officialWaitText: "繁忙：一般少于 45 分钟（访港旅客口径）。",
      bandText: "一般少于 45 分钟（访港旅客）",
      smoothness: 66,
    };
  }
  return {
    label: "非常繁忙",
    officialWaitText: "非常繁忙：一般 45 分钟或以上（访港旅客口径）。",
    bandText: "一般 45 分钟或以上（访港旅客）",
    smoothness: 38,
  };
}

/** 与访客口径分级对应的展示用「预计分钟」中位数，便于推荐组件一句话展示。 */
export function etaMinutesFromVisitorCode(
  code: QueueStatusCode
): number | null {
  if (code === 0) return 15;
  if (code === 1) return 38;
  if (code === 2) return 52;
  return null;
}

/** 开发与生产统一：仅使用同源前缀，由代理/重写转发（禁止在浏览器直连 secure1.info.gov.hk）。 */
export const IMMD_DATA_PREFIX = "/immd-data";

export function immdQueueFileUrl(fileName: string): string {
  const name = fileName.replace(/^\/+/, "");
  return `${IMMD_DATA_PREFIX}/${name}`;
}

/**
 * 浏览器实际请求的 URL（相对当前站点 origin）。
 * 上游 JSON 托管在 info.gov.hk，经代理后同源访问。
 */
export function getVisitorQueueJsonUrl(): string {
  return immdQueueFileUrl("CPQueueTimeV.json");
}

export async function fetchVisitorQueues(): Promise<ImmdQueuePayload> {
  const url = getVisitorQueueJsonUrl();
  let res: Response;

  try {
    res = await fetch(url);
  } catch (err) {
    console.error("[IMMD] Fetch Error (network)", {
      url,
      message: err instanceof Error ? err.message : String(err),
      err,
    });
    throw err instanceof Error ? err : new Error(String(err));
  }

  if (!res.ok) {
    let bodyPreview = "";
    try {
      bodyPreview = (await res.clone().text()).slice(0, 800);
    } catch (readErr) {
      bodyPreview = `(无法读取响应体: ${
        readErr instanceof Error ? readErr.message : String(readErr)
      })`;
    }
    console.error("[IMMD] Fetch Error (non-OK response)", {
      url,
      status: res.status,
      statusText: res.statusText,
      ok: res.ok,
      redirected: res.redirected,
      type: res.type,
      bodyPreview:
        bodyPreview || "(empty body)",
    });
    throw new Error(`HTTP ${res.status} ${res.statusText}`);
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch (err) {
    console.error("[IMMD] Fetch Error (JSON parse)", {
      url,
      message: err instanceof Error ? err.message : String(err),
      err,
    });
    throw err instanceof Error ? err : new Error("响应不是合法 JSON");
  }

  console.log("[IMMD] 请求成功（经同源代理）:", url);
  console.log("[IMMD] CPQueueTimeV 原始 JSON:", data);
  for (const code of IMMD_CODES) {
    const row = (data as ImmdQueuePayload)[code];
    if (row)
      console.log(
        `[IMMD] 管制站 ${code} 状态码 → arrQueue=${row.arrQueue} depQueue=${row.depQueue}`
      );
  }

  return data as ImmdQueuePayload;
}
