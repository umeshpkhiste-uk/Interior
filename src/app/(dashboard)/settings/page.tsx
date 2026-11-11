import { getOrganizationProfile, requireCurrentUserContext } from "@/lib/data/organization";
import { listOrganizationMembers } from "@/lib/data/members";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StudioProfileForm } from "@/components/settings/studio-profile-form";
import { TeamMembersTable } from "@/components/settings/team-members-table";
import { InviteMemberDialog } from "@/components/settings/invite-member-dialog";

export default async function SettingsPage() {
  const ctx = await requireCurrentUserContext();
  const [organization, members] = await Promise.all([
    getOrganizationProfile(ctx.organizationId),
    listOrganizationMembers(ctx.organizationId),
  ]);
  const isOwner = ctx.role === "studio_owner";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Studio profile, team members, and default billing rates.
        </p>
      </div>

      <StudioProfileForm organization={organization} canEdit={isOwner} />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium">Team members</CardTitle>
          {isOwner && <InviteMemberDialog />}
        </CardHeader>
        <CardContent className="p-0">
          <TeamMembersTable members={members} currentUserId={ctx.userId} isOwner={isOwner} />
        </CardContent>
      </Card>
    </div>
  );
}
