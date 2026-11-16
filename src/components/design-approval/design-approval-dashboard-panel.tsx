import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ApprovalByItemChart } from "@/components/charts/approval-by-item-chart";
import { RevisionByDrawingChart } from "@/components/charts/revision-by-drawing-chart";
import { SnagByRoomChart } from "@/components/charts/snag-by-room-chart";
import { SnagStatusBoard } from "./snag-status-board";
import type { DesignApprovalDashboard } from "@/lib/data/design-approval";

export function DesignApprovalDashboardPanel({ dashboard }: { dashboard: DesignApprovalDashboard }) {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col gap-1.5 text-sm text-muted-foreground">
            {dashboard.insights.map((insight) => (
              <li key={insight}>💡 {insight}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Approvals: asked vs approved</CardTitle>
          </CardHeader>
          <CardContent>
            <ApprovalByItemChart data={dashboard.approvalsByItem} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Revisions by drawing</CardTitle>
          </CardHeader>
          <CardContent>
            <RevisionByDrawingChart data={dashboard.revisionsByDrawing} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Snags by room</CardTitle>
          </CardHeader>
          <CardContent>
            <SnagByRoomChart data={dashboard.snagsByRoom} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Warranties ending next</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {dashboard.warrantiesEndingNext.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">No active warranties.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Valid Till</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Item</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboard.warrantiesEndingNext.map((warranty) => (
                    <TableRow key={warranty.id}>
                      <TableCell className="text-muted-foreground">
                        {new Date(`${warranty.validTill}T00:00:00`).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="font-medium">{warranty.projectCode}</TableCell>
                      <TableCell>{warranty.item}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Snag status board</CardTitle>
        </CardHeader>
        <CardContent>
          <SnagStatusBoard board={dashboard.snagStatusBoard} />
        </CardContent>
      </Card>
    </div>
  );
}
