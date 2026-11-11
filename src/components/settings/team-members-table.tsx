"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { removeMember, updateMemberRole } from "@/lib/actions/organization";
import type { OrganizationMember } from "@/lib/data/members";
import type { Database } from "@/lib/supabase/types";

type OrgRole = Database["public"]["Enums"]["org_role"];
const ASSIGNABLE_ROLES: OrgRole[] = ["studio_owner", "manager", "designer", "accountant", "viewer"];

export function TeamMembersTable({
  members,
  currentUserId,
  isOwner,
}: {
  members: OrganizationMember[];
  currentUserId: string;
  isOwner: boolean;
}) {
  const router = useRouter();

  async function handleRoleChange(member: OrganizationMember, role: OrgRole) {
    const result = await updateMemberRole(member.memberId, role);
    if (result.error) toast.error(result.error);
    else router.refresh();
  }

  async function handleRemove(member: OrganizationMember) {
    const result = await removeMember(member.memberId);
    if (result.error) toast.error(result.error);
    else {
      toast.success(`Removed ${member.fullName ?? member.email}`);
      router.refresh();
    }
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Member</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
          {isOwner && <TableHead className="text-right">Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((member) => (
          <TableRow key={member.memberId}>
            <TableCell className="font-medium">
              {member.fullName ?? "—"}
              {member.userId === currentUserId && (
                <Badge variant="outline" className="ml-2">
                  You
                </Badge>
              )}
            </TableCell>
            <TableCell className="text-muted-foreground">{member.email}</TableCell>
            <TableCell>
              {isOwner ? (
                <Select
                  value={member.role}
                  onValueChange={(role) => handleRoleChange(member, role as OrgRole)}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue>
                      {(value: string | null) => (value ?? "").replace("_", " ")}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {ASSIGNABLE_ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Badge variant="secondary" className="capitalize">
                  {member.role.replace("_", " ")}
                </Badge>
              )}
            </TableCell>
            <TableCell>
              {member.acceptedAt ? (
                <Badge variant="secondary">Active</Badge>
              ) : (
                <Badge variant="outline">Invited</Badge>
              )}
            </TableCell>
            {isOwner && (
              <TableCell className="text-right">
                {member.userId !== currentUserId && (
                  <Button variant="ghost" size="sm" onClick={() => handleRemove(member)}>
                    Remove
                  </Button>
                )}
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
