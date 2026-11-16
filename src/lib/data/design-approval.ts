import { listDesignRevisions } from "@/lib/data/design-revisions";
import { listClientApprovals } from "@/lib/data/client-approvals";
import { listSnags } from "@/lib/data/snags";
import { listHandoverChecks } from "@/lib/data/handover-checks";
import { listWarranties, type WarrantyListItem } from "@/lib/data/warranties";

export type DesignApprovalKpis = {
  approvalsDone: number;
  toChase: number;
  revisions: number;
  openSnags: number;
  checksDonePct: number | null;
  underWarranty: number;
};

export async function getDesignApprovalKpis(organizationId: string): Promise<DesignApprovalKpis> {
  const [revisions, approvals, snags, checks, warranties] = await Promise.all([
    listDesignRevisions(organizationId),
    listClientApprovals(organizationId),
    listSnags(organizationId),
    listHandoverChecks(organizationId),
    listWarranties(organizationId),
  ]);

  const approvalsDone = approvals.filter((a) => a.statusLabel === "Approved").length;
  const toChase =
    approvals.filter((a) => a.statusLabel === "To chase").length +
    revisions.filter((r) => r.statusLabel === "To chase").length;
  const openSnags = snags.filter((s) => s.statusLabel !== "Fixed").length;
  const checksDone = checks.filter((c) => c.statusLabel === "Done").length;
  const checksDonePct = checks.length > 0 ? checksDone / checks.length : null;
  const underWarranty = warranties.filter((w) => w.statusLabel !== "Over").length;

  return {
    approvalsDone,
    toChase,
    revisions: revisions.length,
    openSnags,
    checksDonePct,
    underWarranty,
  };
}

export type DesignApprovalDashboard = {
  approvalsByItem: { label: string; asked: number; approved: number }[];
  revisionsByDrawing: { label: string; sent: number; changesAsked: number }[];
  snagsByRoom: { label: string; found: number; fixed: number }[];
  snagStatusBoard: { label: string; overdue: number; dueSoon: number; open: number; fixed: number; total: number }[];
  warrantiesEndingNext: WarrantyListItem[];
  insights: string[];
};

export async function getDesignApprovalDashboard(organizationId: string): Promise<DesignApprovalDashboard> {
  const [revisions, approvals, snags, warranties] = await Promise.all([
    listDesignRevisions(organizationId),
    listClientApprovals(organizationId),
    listSnags(organizationId),
    listWarranties(organizationId),
  ]);

  const byItem = new Map<string, { asked: number; approved: number }>();
  for (const a of approvals) {
    const entry = byItem.get(a.approval_for) ?? { asked: 0, approved: 0 };
    entry.asked += 1;
    if (a.statusLabel === "Approved") entry.approved += 1;
    byItem.set(a.approval_for, entry);
  }

  const byDrawing = new Map<string, { sent: number; changesAsked: number }>();
  for (const r of revisions) {
    const entry = byDrawing.get(r.drawing) ?? { sent: 0, changesAsked: 0 };
    entry.sent += 1;
    if (r.reply_status === "changes_requested") entry.changesAsked += 1;
    byDrawing.set(r.drawing, entry);
  }

  const byRoom = new Map<string, { found: number; fixed: number }>();
  const statusByRoom = new Map<string, { overdue: number; dueSoon: number; open: number; fixed: number }>();
  for (const s of snags) {
    const label = s.room_area ?? "Other areas";
    const entry = byRoom.get(label) ?? { found: 0, fixed: 0 };
    entry.found += 1;
    if (s.statusLabel === "Fixed") entry.fixed += 1;
    byRoom.set(label, entry);

    const statusEntry = statusByRoom.get(label) ?? { overdue: 0, dueSoon: 0, open: 0, fixed: 0 };
    if (s.statusLabel === "Fixed") statusEntry.fixed += 1;
    else if (s.statusLabel === "Overdue") statusEntry.overdue += 1;
    else if (s.statusLabel === "Due soon") statusEntry.dueSoon += 1;
    else statusEntry.open += 1;
    statusByRoom.set(label, statusEntry);
  }

  const totalApprovals = approvals.length;
  const approvedCount = approvals.filter((a) => a.statusLabel === "Approved").length;
  const waitingDrawings = revisions.filter((r) => r.isLatestVersion && r.statusLabel !== "Approved").length;
  const mostChanges = [...byDrawing.entries()].sort((a, b) => b[1].changesAsked - a[1].changesAsked)[0];
  const totalSnags = snags.length;
  const fixedSnags = snags.filter((s) => s.statusLabel === "Fixed").length;
  const mostSnagRoom = [...byRoom.entries()].sort((a, b) => b[1].found - a[1].found)[0];
  const nextWarranty = [...warranties].filter((w) => w.statusLabel !== "Over").sort((a, b) => a.validTill.localeCompare(b.validTill))[0];

  const insights: string[] = [
    `${approvedCount} of ${totalApprovals} approvals done; ${waitingDrawings} drawing${waitingDrawings === 1 ? "" : "s"} waiting for a reply.`,
    mostChanges ? `Most changes asked on: ${mostChanges[0]} (${mostChanges[1].changesAsked}).` : "No revisions yet.",
    `Snags: ${totalSnags} found, ${fixedSnags} fixed${mostSnagRoom ? `; most in the ${mostSnagRoom[0]}` : ""}.`,
    nextWarranty
      ? `Next warranty to end: ${nextWarranty.item} of ${nextWarranty.projectCode} on ${new Date(`${nextWarranty.validTill}T00:00:00`).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}: call the client for a check-up.`
      : "No warranties on the register yet.",
  ];

  return {
    approvalsByItem: [...byItem.entries()].map(([label, v]) => ({ label, ...v })),
    revisionsByDrawing: [...byDrawing.entries()].map(([label, v]) => ({ label, ...v })),
    snagsByRoom: [...byRoom.entries()].map(([label, v]) => ({ label, ...v })),
    snagStatusBoard: [...statusByRoom.entries()].map(([label, v]) => ({
      label,
      ...v,
      total: v.overdue + v.dueSoon + v.open + v.fixed,
    })),
    warrantiesEndingNext: [...warranties].filter((w) => w.statusLabel !== "Over").slice(0, 6),
    insights,
  };
}
