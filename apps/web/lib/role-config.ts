export const appRoles = ["operator", "merchant", "rider"] as const;

export type AppRole = (typeof appRoles)[number];

export const roleConfig: Record<
  AppRole,
  {
    label: string;
    shortLabel: string;
    description: string;
    signInPath: string;
    homePath: string;
    signUpPath?: string;
  }
> = {
  operator: {
    label: "Admin / Operator",
    shortLabel: "Admin",
    description:
      "Run intake, dispatch, live operations, and merchant setup from the control plane.",
    signInPath: "/sign-in/operator",
    homePath: "/operator",
    signUpPath: "/sign-up/operator",
  },
  merchant: {
    label: "Merchant",
    shortLabel: "Merchant",
    description:
      "Review parcel status, remittance visibility, and merchant-facing request access.",
    signInPath: "/sign-in/merchant",
    homePath: "/merchant",
  },
  rider: {
    label: "Rider",
    shortLabel: "Rider",
    description:
      "Open the shift worklist, see assigned manifests, and handle delivery execution.",
    signInPath: "/sign-in/rider",
    homePath: "/rider",
  },
};

export function isAppRole(value: string): value is AppRole {
  return appRoles.includes(value as AppRole);
}

export function getRoleHome(role?: string | null) {
  if (role === "merchant") return roleConfig.merchant.homePath;
  if (role === "rider") return roleConfig.rider.homePath;
  return roleConfig.operator.homePath;
}
