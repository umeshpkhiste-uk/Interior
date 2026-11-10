import { GlobalSearch } from "./global-search";
import { NotificationsMenu } from "./notifications-menu";
import { UserMenu } from "./user-menu";
import { ProjectSelector, type ProjectOption } from "./project-selector";
import { MobileNav } from "./mobile-nav";

export function Topbar({
  fullName,
  email,
  role,
  organizationName,
  projects,
}: {
  fullName: string | null;
  email: string;
  role: string;
  organizationName: string;
  projects: ProjectOption[];
}) {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/80 md:px-6">
      <MobileNav organizationName={organizationName} />
      <ProjectSelector projects={projects} />
      <GlobalSearch />
      <div className="ml-auto flex items-center gap-1">
        <NotificationsMenu />
        <UserMenu fullName={fullName} email={email} role={role} />
      </div>
    </header>
  );
}
