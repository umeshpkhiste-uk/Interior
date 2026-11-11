import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export type OrganizationMember = {
  memberId: string;
  userId: string;
  email: string | null;
  fullName: string | null;
  role: Database["public"]["Enums"]["org_role"];
  invitedAt: string | null;
  acceptedAt: string | null;
};

export async function listOrganizationMembers(organizationId: string): Promise<OrganizationMember[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_organization_members", {
    p_org_id: organizationId,
  });
  if (error) throw error;
  return (data ?? []).map((m) => ({
    memberId: m.member_id,
    userId: m.user_id,
    email: m.email,
    fullName: m.full_name,
    role: m.role,
    invitedAt: m.invited_at,
    acceptedAt: m.accepted_at,
  }));
}
