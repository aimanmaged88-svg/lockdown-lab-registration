import {
  LayoutDashboard,
  Users,
  CalendarClock,
  CalendarRange,
  ShieldCheck,
  Receipt,
  Sparkles,
  Store,
  GraduationCap,
  MapPin,
  FileBarChart,
  Bell,
  Settings,
  HeartHandshake,
  Building2,
  LineChart,
  History,
  LifeBuoy,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
  section: "care" | "operations" | "insight" | "system";
}

/**
 * Primary navigation. Items are filtered per-role via lib/roles.ts —
 * every visible item always leads to a complete, living screen.
 */
export const navItems: NavItem[] = [
  { key: "dashboard", label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, section: "care" },
  { key: "family", label: "Family Portal", href: "/family", icon: HeartHandshake, section: "care" },
  { key: "executive", label: "Executive", href: "/executive", icon: LineChart, section: "care" },
  { key: "provider", label: "Provider", href: "/provider", icon: Building2, section: "care" },
  { key: "participants", label: "Participants", href: "/participants", icon: Users, section: "care" },
  { key: "shift", label: "Today's Shift", href: "/shift", icon: CalendarClock, section: "care" },
  { key: "timeline", label: "Timeline", href: "/timeline", icon: History, section: "care" },
  { key: "roster", label: "Rostering", href: "/roster", icon: CalendarRange, section: "operations" },
  { key: "compliance", label: "Compliance", href: "/compliance", icon: ShieldCheck, section: "operations" },
  { key: "billing", label: "Billing & Claims", href: "/billing", icon: Receipt, section: "operations" },
  { key: "assistant", label: "AI Assistant", href: "/assistant", icon: Sparkles, section: "insight" },
  { key: "marketplace", label: "Marketplace", href: "/marketplace", icon: Store, section: "insight" },
  { key: "learning", label: "Learning Hub", href: "/learning", icon: GraduationCap, section: "insight" },
  { key: "community", label: "Community Planner", href: "/community", icon: MapPin, section: "insight" },
  { key: "reports", label: "Reports", href: "/reports", icon: FileBarChart, section: "insight" },
  { key: "notifications", label: "Notifications", href: "/notifications", icon: Bell, section: "system" },
  { key: "settings", label: "Settings", href: "/settings", icon: Settings, section: "system" },
  { key: "help", label: "Help Centre", href: "/help", icon: LifeBuoy, section: "system" },
];
