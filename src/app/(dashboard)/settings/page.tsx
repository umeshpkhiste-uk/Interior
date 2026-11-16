import { Settings } from "lucide-react";
import { getOrganizationProfile, requireCurrentUserContext } from "@/lib/data/organization";
import { listOrganizationMembers } from "@/lib/data/members";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StudioProfileForm } from "@/components/settings/studio-profile-form";
import { TeamMembersTable } from "@/components/settings/team-members-table";
import { InviteMemberDialog } from "@/components/settings/invite-member-dialog";
import { ModuleHeader } from "@/components/layout/module-header";
import { MODULE_HEADER_IMAGES } from "@/components/layout/module-header-images";

export default async function SettingsPage() {
  const ctx = await requireCurrentUserContext();
  const [organization, members] = await Promise.all([
    getOrganizationProfile(ctx.organizationId),
    listOrganizationMembers(ctx.organizationId),
  ]);
  const isOwner = ctx.role === "studio_owner";

  return (
    <div className="flex flex-col gap-6">
      <ModuleHeader
        icon={Settings}
        kitLabel="Preferences • Settings"
        title="Settings"
        subtitle="Studio profile, team members, and default billing rates."
        badges={["Profile", "Team", "Billing"]}
        image={MODULE_HEADER_IMAGES.livingRoom}
      />

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
