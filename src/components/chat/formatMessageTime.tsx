// utils/formatTimestamp.ts
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

export function formatMessageTime(timestamp: any, type: "clock" | "ago" = "clock") {
  if (!timestamp?.toDate) return "Sending...";

  const date = timestamp.toDate();
  if (type === "ago") return dayjs(date).fromNow(); // e.g., "3 min ago"

  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
