import type { ShellNavItem } from "@/components/app-shell";

/**
 * Canonical merchant sidebar nav items.
 * Used by both the `/merchant` layout and the `/m/[token]` pages
 * so the sidebar stays consistent across all merchant surfaces.
 */
export function getMerchantNavItems(merchantToken: string): ShellNavItem[] {
  return [
    {
      href: "/merchant",
      label: "Overview",
      caption:
        "Track parcel flow, delivery outcomes, and remittance visibility.",
      icon: "dashboard",
      section: "Workspace",
    },
    {
      href: `/m/${merchantToken}`,
      label: "Request portal",
      caption: "Submit a new delivery request without operator re-entry.",
      icon: "send",
      matchPrefix: `/m/${merchantToken}`,
      section: "Workspace",
    },
    {
      href: `/m/${merchantToken}/orders`,
      label: "Orders",
      caption: "Create single or bulk delivery orders.",
      icon: "package",
      section: "Workspace",
    },
    {
      href: `/m/${merchantToken}/tracking`,
      label: "Tracking",
      caption: "Search and track all your delivery requests.",
      icon: "search",
      section: "Workspace",
    },
    {
      href: `/m/${merchantToken}/finance`,
      label: "Finance",
      caption: "Review earnings, fees, and download statements.",
      icon: "wallet",
      section: "Workspace",
    },
    {
      href: "/merchant/settings",
      label: "Settings",
      caption: "Profile, fees, and platform defaults.",
      icon: "settings",
      section: "Account",
    },
  ];
}

/**
 * Minimal nav for unauthenticated visitors on the public portal.
 */
export function getPublicPortalNavItems(merchantToken: string): ShellNavItem[] {
  return [
    {
      href: `/m/${merchantToken}`,
      label: "Request portal",
      caption: "Create orders and follow live status",
      icon: "send",
      matchPrefix: `/m/${merchantToken}`,
    },
    {
      href: `/m/${merchantToken}/orders`,
      label: "Orders",
      caption: "Create single or bulk delivery orders",
      icon: "package",
    },
    {
      href: `/m/${merchantToken}/tracking`,
      label: "Tracking",
      caption: "Search and track delivery requests",
      icon: "search",
    },
    {
      href: `/m/${merchantToken}/finance`,
      label: "Finance",
      caption: "Review earnings, fees, and statements",
      icon: "wallet",
    },
  ];
}
