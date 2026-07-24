import {
  LayoutDashboard,
  Users,
  CalendarClock,
  CalendarRange,
  CalendarCheck2,
  ShieldCheck,
  Receipt,
  Clock,
  Sparkles,
  MessagesSquare,
  Inbox,
  Store,
  GraduationCap,
  MapPin,
  FileBarChart,
  Bell,
  BellRing,
  Wallet,
  Siren,
  FileCheck,
  HeartPulse,
  Settings,
  HeartHandshake,
  Building2,
  Home,
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
  { key: "availability", label: "Availability", href: "/availability", icon: CalendarCheck2, section: "operations" },
  { key: "timepay", label: "Time & Pay", href: "/timepay", icon: Clock, section: "operations" },
  { key: "arrivals", label: "KnockIn Arrivals", href: "/arrivals", icon: BellRing, section: "operations" },
  { key: "billing", label: "Billing & Claims", href: "/billing", icon: Receipt, section: "operations" },
  { key: "budgets", label: "Budget Guardian", href: "/budgets", icon: Wallet, section: "operations" },
  { key: "incidents", label: "Incidents", href: "/incidents", icon: Siren, section: "operations" },
  { key: "sites", label: "Homes & Sites", href: "/sites", icon: Home, section: "operations" },
  { key: "compliance", label: "Compliance", href: "/compliance", icon: ShieldCheck, section: "operations" },
  { key: "assistant", label: "AI Assistant", href: "/assistant", icon: Sparkles, section: "insight" },
  { key: "comms", label: "Comms Hub", href: "/comms", icon: Inbox, section: "insight" },
  { key: "support-circle", label: "Support Circle", href: "/support-circle", icon: MessagesSquare, section: "insight" },
  { key: "marketplace", label: "Marketplace", href: "/marketplace", icon: Store, section: "insight" },
  { key: "learning", label: "Learning Hub", href: "/learning", icon: GraduationCap, section: "insight" },
  { key: "community", label: "Community Planner", href: "/community", icon: MapPin, section: "insight" },
  { key: "review-ready", label: "Review Ready", href: "/review-ready", icon: FileCheck, section: "insight" },
  { key: "wellbeing", label: "Team Pulse", href: "/wellbeing", icon: HeartPulse, section: "insight" },
  { key: "reports", label: "Reports", href: "/reports", icon: FileBarChart, section: "insight" },
  { key: "notifications", label: "Notifications", href: "/notifications", icon: Bell, section: "system" },
  { key: "settings", label: "Settings", href: "/settings", icon: Settings, section: "system" },
  { key: "help", label: "Help Centre", href: "/help", icon: LifeBuoy, section: "system" },
];
