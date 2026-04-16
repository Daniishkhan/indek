import { getMerchantPortalData } from "@indek/domain";
import { notFound } from "next/navigation";
import type { Parcel } from "@indek/shared";
import { updateMerchantParcelAction } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { getCurrentSession } from "@/lib/session";
import {
  getMerchantNavItems,
  getPublicPortalNavItems,
} from "@/lib/merchant-nav";
import { TrackingSearch } from "./tracking-search";

export const dynamic = "force-dynamic";

const REVIEW_STATE_LABEL: Record<Parcel["reviewState"], string> = {
  under_review: "Under ops review",
  needs_clarification: "Needs your input",
  on_hold: "On hold",
  dispatch_ready: "Approved for dispatch",
};

const REVIEW_STATE_TONE: Record<Parcel["reviewState"], string> = {
  under_review: "warn",
  needs_clarification: "primary",
  on_hold: "danger",
  dispatch_ready: "success",
};

function parcelStatusChip(parcel: Parcel) {
  if (parcel.state === "unassigned") {
    return {
      tone: REVIEW_STATE_TONE[parcel.reviewState],
      label: REVIEW_STATE_LABEL[parcel.reviewState],
    };
  }
  return { tone: "", label: parcel.state.replace("_", " ") };
}

function canMerchantEdit(parcel: Parcel) {
  return (
    parcel.state === "unassigned" &&
    (parcel.reviewState === "under_review" ||
      parcel.reviewState === "needs_clarification")
  );
}

export default async function TrackingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const [portal, session] = await Promise.all([
    getMerchantPortalData(token),
    getCurrentSession(),
  ]);

  if (!portal) {
    notFound();
  }

  const { merchant, parcels } = portal;
  const sessionRole = (session?.user as { role?: string } | undefined)?.role;
  const userLabel =
    sessionRole === "merchant"
      ? (session?.user.name ?? session?.user.email ?? undefined)
      : undefined;
  const actions =
    sessionRole === "merchant"
      ? [
          { href: "/merchant", label: "Workspace", tone: "secondary" as const },
          { href: "/sign-out", label: "Sign out", tone: "secondary" as const },
        ]
      : [
          {
            href: "/sign-in/merchant",
            label: "Merchant sign in",
            tone: "secondary" as const,
          },
          { href: "/", label: "Site home", tone: "secondary" as const },
        ];

  const serializedParcels = parcels.map((parcel) => ({
    ...parcel,
    chip: parcelStatusChip(parcel),
    editable: canMerchantEdit(parcel),
    showFollowUp:
      parcel.latestFollowUp?.status === "open" &&
      parcel.state === "unassigned" &&
      (parcel.reviewState === "needs_clarification" ||
        parcel.reviewState === "on_hold"),
  }));

  return (
    <AppShell
      actions={actions}
      navItems={
        sessionRole === "merchant"
          ? getMerchantNavItems(merchant.token)
          : getPublicPortalNavItems(merchant.token)
      }
      role="merchant"
      title={`${merchant.name} portal`}
      userLabel={userLabel}
    >
      <TrackingSearch
        parcels={serializedParcels}
        merchant={merchant}
        updateAction={updateMerchantParcelAction}
      />
    </AppShell>
  );
}
