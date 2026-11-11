"use client";

import { ChevronsUpDown, FolderKanban } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export type ProjectOption = { id: string; name: string; status: string };

export function ProjectSelector({ projects }: { projects: ProjectOption[] }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-md border bg-card px-3 py-1.5 text-sm font-medium outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring">
        <FolderKanban className="size-4 text-muted-foreground" />
        <span className="hidden sm:inline">
          {projects.length > 0 ? "Switch project" : "No projects yet"}
        </span>
        <ChevronsUpDown className="size-3.5 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Projects</DropdownMenuLabel>
          {projects.length === 0 ? (
            <p className="px-2 py-4 text-center text-sm text-muted-foreground">
              No projects yet.
            </p>
          ) : (
            projects.map((project) => (
              <DropdownMenuItem
                key={project.id}
                render={
                  <Link
                    href={`/projects/${project.id}`}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="truncate">{project.name}</span>
                    <Badge variant="secondary" className="shrink-0 capitalize">
                      {project.status.replace(/_/g, " ")}
                    </Badge>
                  </Link>
                }
              />
            ))
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/projects">View all projects</Link>} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
