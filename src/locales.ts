/**
 * 全站文案映射：简体中文 (sc)、繁体中文 (tc)、English (en)
 * 使用扁平 key，由 useI18n().t() 读取。
 */

import type { QueueStatusCode } from "./immdQueue";

export type AppLocale = "sc" | "tc" | "en";

export const LOCALE_STORAGE_KEY = "hk-sz-vibe-locale";

export const LOCALE_LABEL: Record<AppLocale, string> = {
  sc: "简",
  tc: "繁",
  en: "EN",
};

export function detectBrowserLocale(): AppLocale {
  if (typeof navigator === "undefined") return "sc";
  const langs = navigator.languages?.length
    ? navigator.languages
    : [navigator.language];
  for (const l of langs) {
    const low = l.toLowerCase();
    if (
      low === "zh-tw" ||
      low === "zh-hk" ||
      low === "zh-mo" ||
      low.startsWith("zh-tw") ||
      low.startsWith("zh-hk")
    )
      return "tc";
    if (low.startsWith("zh")) return "sc";
    if (low.startsWith("en")) return "en";
  }
  return "sc";
}

function loadStoredLocale(): AppLocale | null {
  if (typeof localStorage === "undefined") return null;
  const v = localStorage.getItem(LOCALE_STORAGE_KEY);
  if (v === "sc" || v === "tc" || v === "en") return v;
  return null;
}

export function getInitialLocale(): AppLocale {
  return loadStoredLocale() ?? detectBrowserLocale();
}

/** 扁平消息表 */
export type MessageDict = Record<string, string>;

const SC: MessageDict = {
  "header.badge": "HK ↔ SZ Commute",
  "header.title": "深港通勤丝滑度看板",
  "header.subtitle.before": "陆路口岸队列：由",
  "header.subtitle.dataGov": "data.gov.hk 登记的 JSON",
  "header.subtitle.mid": "（实际 URL 为",
  "header.subtitle.after":
    "）· 抵港 arrQueue / 离港 depQueue",
  "header.devPath": "数据请求路径（同源代理）：",

  "lang.switch": "语言",
  "lang.sc": "简体中文",
  "lang.tc": "繁體中文",
  "lang.en": "English",

  "recommend.title": "最快捷口岸推荐",
  "recommend.loading": "正在根据当前方向与队列数据计算…",
  "recommend.allClosed": "当前各口岸已关闸，暂无推荐。",
  "recommend.noRank": "暂无可比较数据（非服务时间 / 维护中 / 同步失败）。",
  "recommend.pickPrefix": "今日推荐：",
  "recommend.pickSuffix": "，预计 {eta} 分钟",
  "recommend.runnerFull":
    "次选（丝滑度第 2）：{name}，约 {eta} 分钟 · 当前方向：{dir}",
  "recommend.onlyOne": "当前方向：{dir}（仅一个在营口岸可比较）",

  "time.beijing": "北京时间",

  "direction.section": "通关方向",
  "direction.toHK": "🇭🇰 前往香港",
  "direction.toHKSub": "(Depart SZ)",
  "direction.toSZ": "🇨🇳 返回深圳",
  "direction.toSZSub": "(Arrive SZ)",
  "direction.current": "当前查看：",
  "direction.arrivalQueue": "抵港（arrQueue）",
  "direction.departureQueue": "离港（depQueue）",
  "direction.hint.arrival": "抵港方向",
  "direction.hint.departure": "离港方向",

  "sync.errorPrefix": "入境处数据同步失败：",
  "sync.prodHint":
    "。生产环境应通过 vercel.json 将 /immd-data/* 重写至港府 JSON；若仍失败请查看浏览器 Console 中 [IMMD] Fetch Error 详情。页面将使用离线保底模拟。",
  "sync.synced": "数据已同步（北京时间）",
  "sync.refreshing": " · 正在刷新…",
  "sync.allZeroHint":
    "提示：当前各口岸原始状态码多为 0，对应入境处定义的「正常（一般少于 30 分钟）」，因此丝滑度会显示为 88%。请按 F12 查看 Console 中的 [IMMD] 日志核对原始 arrQueue / depQueue。",

  "error.jsonIncomplete": "返回 JSON 结构不完整",
  "error.unknown": "未知错误",

  "port.name.huanggang": "皇岗口岸",
  "port.name.luohu": "罗湖口岸",
  "port.name.futian": "福田口岸",
  "port.name.shenzhenbay": "深圳湾口岸",
  "port.name.liantang": "莲塘口岸",
  "port.name.wenjindu": "文锦渡口岸",

  "port.hours.huanggang": "24 小时",
  "port.hours.luohu": "06:30—24:00",
  "port.hours.futian": "06:30—22:30",
  "port.hours.shenzhenbay": "06:30—24:00",
  "port.hours.liantang": "07:00—22:00",
  "port.hours.wenjindu": "07:00—22:00",

  "card.hoursPrefix": "运营时间（北京时间）：",
  "card.statusPrefix": "当前通关状态：",
  "card.closed": "已关闸",
  "card.queueSmoothness": "队列 / 丝滑度",
  "card.closedHint": "非运营时段，开闸后将显示队列与等候分级。",
  "card.syncing": "正在同步入境处数据…",
  "card.retrying": "正在重试连接港府 API…",
  "card.apiFail": "⚠️ 无法连接港府 API，请检查网络",
  "card.apiFailNoJsonSub":
    "本站不在 CPQueueTimeV 陆路 JSON 内；请直接查阅 i口岸 / 承运方公告。",
  "card.noLiveData": "实时数据暂不可用，请参考官方公告",
  "card.parseFail": "⚠️ 无法解析港府 API 返回，请检查网络或稍后重试",
  "card.fallbackDisclaimer": "以下为离线保底模拟，非政府发布数据。",
  "card.etaOfficial": "预计等候（官方分级）",
  "card.etaSim": "预计等候（离线模拟）",
  "card.etaMinutesSim": "约 {n} 分钟（模拟）",
  "card.linkIPort": "点击查看 i口岸 官方直播",

  "footer.body":
    "陆路口岸队列状态来自香港入境处 CPQueueTimeV.json（访港旅客）。「前往香港」对应香港侧抵港队列字段 arrQueue；「返回深圳」对应离港字段 depQueue。关闸仍按运营时间（北京时间）判断；顶部「最快捷推荐」按当前方向下各口岸丝滑度排序，取前两名展示。",
  "footer.sourcePrefix": "数据源自香港入境事务处 (",
  "footer.sourceSuffix": ")。",
  "footer.refresh": "刷新状态",

  "visitor.c0.label": "正常",
  "visitor.c0.official": "正常：一般少于 30 分钟（访港旅客口径）。",
  "visitor.c0.band": "一般少于 30 分钟（访港旅客）",
  "visitor.c1.label": "繁忙",
  "visitor.c1.official": "繁忙：一般少于 45 分钟（访港旅客口径）。",
  "visitor.c1.band": "一般少于 45 分钟（访港旅客）",
  "visitor.c2.label": "非常繁忙",
  "visitor.c2.official": "非常繁忙：一般 45 分钟或以上（访港旅客口径）。",
  "visitor.c2.band": "一般 45 分钟或以上（访港旅客）",
  "visitor.c4.label": "系统维护",
  "visitor.c4.official": "系统维护中（代码 4）。",
  "visitor.c4.band": "系统维护中",
  "visitor.c99.label": "非服务时间",
  "visitor.c99.official": "非服务时间：当前为非服务时段（代码 99）。",
  "visitor.c99.band": "非服务时间",

  "fallback.base": "网络不可用 · 情景模拟",
  "fallback.qingming": "（清明假期返程高峰假设）",
};

const TC: MessageDict = {
  ...SC,
  "header.title": "深港通勤絲滑度看板",
  "header.subtitle.before": "陸路口岸隊列：由",
  "header.subtitle.after": "）· 抵港 arrQueue / 離港 depQueue",
  "header.devPath": "資料請求路徑（同源代理）：",
  "lang.sc": "簡體中文",
  "lang.switch": "語言",
  "recommend.title": "最快捷口岸推薦",
  "recommend.loading": "正在根據目前方向與隊列資料計算…",
  "recommend.allClosed": "目前各口岸已關閘，暫無推薦。",
  "recommend.noRank": "暫無可比較資料（非服務時間／維護中／同步失敗）。",
  "recommend.pickPrefix": "今日推薦：",
  "recommend.pickSuffix": "，預計 {eta} 分鐘",
  "recommend.runnerFull":
    "次選（絲滑度第 2）：{name}，約 {eta} 分鐘 · 目前方向：{dir}",
  "recommend.onlyOne": "目前方向：{dir}（僅一個在營口岸可比較）",
  "time.beijing": "北京時間",
  "direction.section": "通關方向",
  "direction.toSZ": "🇨🇳 返回深圳",
  "direction.current": "目前查看：",
  "direction.departureQueue": "離港（depQueue）",
  "direction.hint.arrival": "抵港方向",
  "direction.hint.departure": "離港方向",
  "sync.errorPrefix": "入境處資料同步失敗：",
  "sync.prodHint":
    "。生產環境應透過 vercel.json 將 /immd-data/* 重寫至港府 JSON；若仍失敗請查看瀏覽器 Console 中 [IMMD] Fetch Error 詳情。頁面將使用離線保底模擬。",
  "sync.synced": "資料已同步（北京時間）",
  "sync.refreshing": " · 正在刷新…",
  "sync.allZeroHint":
    "提示：目前各口岸原始狀態碼多為 0，對應入境處定義的「正常（一般少於 30 分鐘）」，因此絲滑度會顯示為 88%。請按 F12 查看 Console 中的 [IMMD] 日誌核對原始 arrQueue / depQueue。",
  "error.jsonIncomplete": "返回 JSON 結構不完整",
  "error.unknown": "未知錯誤",
  "port.name.shenzhenbay": "深圳灣口岸",
  "card.hoursPrefix": "營運時間（北京時間）：",
  "card.statusPrefix": "目前通關狀態：",
  "card.closed": "已關閘",
  "card.queueSmoothness": "隊列 / 絲滑度",
  "card.closedHint": "非營運時段，開閘後將顯示隊列與等候分級。",
  "card.syncing": "正在同步入境處資料…",
  "card.retrying": "正在重試連接港府 API…",
  "card.apiFail": "⚠️ 無法連接港府 API，請檢查網絡",
  "card.apiFailNoJsonSub":
    "本站不在 CPQueueTimeV 陸路 JSON 內；請直接查閱 i口岸／承運方公告。",
  "card.noLiveData": "實時數據暫不可用，請參考官方公告",
  "card.parseFail": "⚠️ 無法解析港府 API 返回，請檢查網絡或稍後重試",
  "card.fallbackDisclaimer": "以下為離線保底模擬，非政府發布數據。",
  "card.etaOfficial": "預計等候（官方分級）",
  "card.etaSim": "預計等候（離線模擬）",
  "card.etaMinutesSim": "約 {n} 分鐘（模擬）",
  "card.linkIPort": "點擊查看 i口岸 官方直播",
  "footer.body":
    "陸路口岸隊列狀態來自香港入境處 CPQueueTimeV.json（訪港旅客）。「前往香港」對應香港側抵港隊列欄位 arrQueue；「返回深圳」對應離港欄位 depQueue。關閘仍按營運時間（北京時間）判斷；頂部「最快捷推薦」按目前方向下各口岸絲滑度排序，取前兩名展示。",
  "footer.sourcePrefix": "數據源自香港入境事務處 (",
  "footer.sourceSuffix": ")。",
  "footer.refresh": "刷新狀態",
  "visitor.c0.official": "正常：一般少於 30 分鐘（訪港旅客口徑）。",
  "visitor.c0.band": "一般少於 30 分鐘（訪港旅客）",
  "visitor.c1.official": "繁忙：一般少於 45 分鐘（訪港旅客口徑）。",
  "visitor.c1.band": "一般少於 45 分鐘（訪港旅客）",
  "visitor.c2.official": "非常繁忙：一般 45 分鐘或以上（訪港旅客口徑）。",
  "visitor.c2.band": "一般 45 分鐘或以上（訪港旅客）",
  "visitor.c4.official": "系統維護中（代碼 4）。",
  "visitor.c99.official": "非服務時間：目前為非服務時段（代碼 99）。",
  "visitor.c99.band": "非服務時間",
  "fallback.base": "網絡不可用 · 情景模擬",
  "fallback.qingming": "（清明假期返程高峰假設）",
};

const EN: MessageDict = {
  ...SC,
  "header.title": "HK–Shenzhen Commute Smoothness",
  "header.subtitle.before": "Land border queues: JSON listed on ",
  "header.subtitle.dataGov": "data.gov.hk",
  "header.subtitle.mid": " (hosted at ",
  "header.subtitle.after": ") · Arrival arrQueue / Departure depQueue",
  "header.devPath": "Request path (same-origin proxy):",
  "lang.switch": "Language",
  "lang.sc": "Simplified Chinese",
  "lang.tc": "Traditional Chinese",
  "recommend.title": "Fastest crossing picks",
  "recommend.loading": "Computing from current direction and queue data…",
  "recommend.allClosed": "All crossings are closed. No pick yet.",
  "recommend.noRank": "No comparable data (off-hours / maintenance / sync failed).",
  "recommend.pickPrefix": "Today's pick: ",
  "recommend.pickSuffix": ", est. {eta} min",
  "recommend.runnerFull":
    "Runner-up (2nd): {name}, ~{eta} min · Direction: {dir}",
  "recommend.onlyOne": "Direction: {dir} (only one crossing open)",
  "time.beijing": "Beijing time",
  "direction.section": "Direction",
  "direction.toHK": "🇭🇰 To Hong Kong",
  "direction.toSZ": "🇨🇳 Back to Shenzhen",
  "direction.current": "Viewing: ",
  "direction.arrivalQueue": "Arrival (arrQueue)",
  "direction.departureQueue": "Departure (depQueue)",
  "direction.hint.arrival": "Arrival (to HK)",
  "direction.hint.departure": "Departure (to Shenzhen)",
  "sync.errorPrefix": "IMMD sync failed: ",
  "sync.prodHint":
    ". In production, use vercel.json to rewrite /immd-data/* to the government JSON; if it still fails, check [IMMD] Fetch Error in the console. Offline fallback will be used.",
  "sync.synced": "Data synced (Beijing time) ",
  "sync.refreshing": " · Refreshing…",
  "sync.allZeroHint":
    "Note: status code 0 means “normal (under 30 min)” for visitors, so smoothness shows 88%. Press F12 and check [IMMD] logs for raw arrQueue / depQueue.",
  "error.jsonIncomplete": "Invalid or incomplete JSON",
  "error.unknown": "Unknown error",
  "port.name.huanggang": "Huanggang Port",
  "port.name.luohu": "Luohu Port",
  "port.name.futian": "Futian Port",
  "port.name.shenzhenbay": "Shenzhen Bay Port",
  "port.name.liantang": "Liantang Port",
  "port.name.wenjindu": "Wenjindu Port",
  "port.hours.huanggang": "24 hours",
  "port.hours.luohu": "06:30—24:00",
  "port.hours.futian": "06:30—22:30",
  "port.hours.shenzhenbay": "06:30—24:00",
  "port.hours.liantang": "07:00—22:00",
  "port.hours.wenjindu": "07:00—22:00",
  "card.hoursPrefix": "Hours (Beijing time): ",
  "card.statusPrefix": "Status: ",
  "card.closed": "Closed",
  "card.queueSmoothness": "Queue / smoothness",
  "card.closedHint": "Outside operating hours. Queue bands appear when open.",
  "card.syncing": "Syncing IMMD data…",
  "card.retrying": "Retrying government API…",
  "card.apiFail": "⚠️ Cannot reach HK government API. Check network.",
  "card.apiFailNoJsonSub":
    "Not in CPQueueTimeV land JSON; check iPort / operator notices.",
  "card.noLiveData": "Live data unavailable. See official notices.",
  "card.parseFail": "⚠️ Could not parse API response. Retry later.",
  "card.fallbackDisclaimer": "Offline scenario below — not official data.",
  "card.etaOfficial": "Wait (official band)",
  "card.etaSim": "Wait (offline sim)",
  "card.etaMinutesSim": "~{n} min (simulated)",
  "card.linkIPort": "iPort official info →",
  "footer.body":
    "Queue bands come from IMMD CPQueueTimeV.json (visitors). “To HK” uses arrQueue; “Back to Shenzhen” uses depQueue. Closed/open follows Beijing-time hours. Top banner ranks crossings by smoothness for the current direction.",
  "footer.sourcePrefix": "Data source: Hong Kong Immigration Department (",
  "footer.sourceSuffix": ").",
  "footer.refresh": "Refresh",
  "visitor.c0.label": "Normal",
  "visitor.c0.official": "Normal: generally under 30 minutes (visitor).",
  "visitor.c0.band": "Generally under 30 min (visitors)",
  "visitor.c1.label": "Busy",
  "visitor.c1.official": "Busy: generally under 45 minutes (visitor).",
  "visitor.c1.band": "Generally under 45 min (visitors)",
  "visitor.c2.label": "Very busy",
  "visitor.c2.official": "Very busy: generally 45 minutes or more (visitor).",
  "visitor.c2.band": "Generally 45+ min (visitors)",
  "visitor.c4.label": "Maintenance",
  "visitor.c4.official": "System maintenance (code 4).",
  "visitor.c4.band": "Maintenance",
  "visitor.c99.label": "Closed",
  "visitor.c99.official": "Non-service hours (code 99).",
  "visitor.c99.band": "Non-service hours",
  "fallback.base": "Offline · scenario",
  "fallback.qingming": " (Qingming return peak scenario)",
};

export const MESSAGES: Record<AppLocale, MessageDict> = {
  sc: SC,
  tc: TC,
  en: EN,
};

export function translate(
  locale: AppLocale,
  key: string,
  params?: Record<string, string | number>
): string {
  let s = MESSAGES[locale][key] ?? MESSAGES.sc[key] ?? key;
  if (params) {
    s = s.replace(/\{(\w+)\}/g, (_, k) =>
      params[k] !== undefined ? String(params[k]) : `{${k}}`
    );
  }
  return s;
}

export function visitorLabelsForCode(
  locale: AppLocale,
  code: QueueStatusCode
): {
  label: string;
  officialWaitText: string;
  bandText: string;
  smoothness: number | null;
} {
  const k =
    code === 99
      ? "c99"
      : code === 4
        ? "c4"
        : code === 0
          ? "c0"
          : code === 1
            ? "c1"
            : "c2";
  const smooth =
    code === 99 || code === 4 ? null : code === 0 ? 88 : code === 1 ? 66 : 38;
  return {
    label: translate(locale, `visitor.${k}.label`),
    officialWaitText: translate(locale, `visitor.${k}.official`),
    bandText: translate(locale, `visitor.${k}.band`),
    smoothness: smooth,
  };
}

export function fallbackScenarioLabel(
  locale: AppLocale,
  qingming: boolean
): string {
  const base = translate(locale, "fallback.base");
  return qingming
    ? base + translate(locale, "fallback.qingming")
    : base;
}
