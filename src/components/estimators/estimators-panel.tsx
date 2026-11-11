import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requireCurrentUserContext } from "@/lib/data/organization";
import { listRoomsForProject, listRoomOptions } from "@/lib/data/rooms";
import { getKitchenEstimation } from "@/lib/data/kitchen";
import { listWardrobes } from "@/lib/data/wardrobes";
import { listCutListRows, listPlywoodRates, getPlywoodProjectSettings } from "@/lib/data/plywood";
import { listCeilingEstimationsForProject } from "@/lib/data/false-ceiling";
import { listPaintEstimations } from "@/lib/data/paint";
import { listFlooringEstimationsForProject } from "@/lib/data/flooring";
import { listElectricalPointsForProject, getElectricalProjectSettings } from "@/lib/data/electrical";
import { KitchenPanel } from "./kitchen/kitchen-panel";
import { WardrobePanel } from "./wardrobe/wardrobe-panel";
import { PlywoodPanel } from "./plywood/plywood-panel";
import { CeilingPanel } from "./false-ceiling/ceiling-panel";
import { PaintPanel } from "./paint/paint-panel";
import { FlooringPanel } from "./flooring/flooring-panel";
import { ElectricalPanel } from "./electrical/electrical-panel";
import type { ElectricalPointRow } from "@/lib/data/electrical";

export async function EstimatorsPanel({ projectId }: { projectId: string }) {
  const ctx = await requireCurrentUserContext();
  const orgId = ctx.organizationId;

  const [rooms, roomOptions, kitchen, wardrobes, cutList, plywoodRates, plywoodSettings, ceilingEstimations, paintEstimations, flooringEstimations, electricalPoints, electricalSettings] =
    await Promise.all([
      listRoomsForProject(orgId, projectId),
      listRoomOptions(orgId, projectId),
      getKitchenEstimation(orgId, projectId),
      listWardrobes(orgId, projectId),
      listCutListRows(orgId, projectId),
      listPlywoodRates(orgId),
      getPlywoodProjectSettings(orgId, projectId),
      listCeilingEstimationsForProject(orgId, projectId),
      listPaintEstimations(orgId, projectId),
      listFlooringEstimationsForProject(orgId, projectId),
      listElectricalPointsForProject(orgId, projectId),
      getElectricalProjectSettings(orgId, projectId),
    ]);

  const ceilingByRoom = new Map(ceilingEstimations.map((e) => [e.room_id, e]));
  const flooringByRoom = new Map(flooringEstimations.map((e) => [e.room_id, e]));
  const pointsByRoom = new Map<string, ElectricalPointRow[]>();
  for (const point of electricalPoints) {
    const list = pointsByRoom.get(point.room_id) ?? [];
    list.push(point);
    pointsByRoom.set(point.room_id, list);
  }

  return (
    <Tabs defaultValue="kitchen">
      <TabsList className="flex-wrap">
        <TabsTrigger value="kitchen">Kitchen</TabsTrigger>
        <TabsTrigger value="wardrobe">Wardrobe</TabsTrigger>
        <TabsTrigger value="plywood">Ply & Laminate</TabsTrigger>
        <TabsTrigger value="ceiling">False Ceiling</TabsTrigger>
        <TabsTrigger value="paint">Paint & Wallpaper</TabsTrigger>
        <TabsTrigger value="flooring">Flooring</TabsTrigger>
        <TabsTrigger value="electrical">Electrical</TabsTrigger>
      </TabsList>

      <TabsContent value="kitchen" className="pt-4">
        <KitchenPanel projectId={projectId} estimation={kitchen} />
      </TabsContent>
      <TabsContent value="wardrobe" className="pt-4">
        <WardrobePanel projectId={projectId} wardrobes={wardrobes} rooms={roomOptions} />
      </TabsContent>
      <TabsContent value="plywood" className="pt-4">
        <PlywoodPanel projectId={projectId} cutList={cutList} rates={plywoodRates} settings={plywoodSettings} />
      </TabsContent>
      <TabsContent value="ceiling" className="pt-4">
        <CeilingPanel projectId={projectId} rooms={rooms} estimationsByRoom={ceilingByRoom} />
      </TabsContent>
      <TabsContent value="paint" className="pt-4">
        <PaintPanel projectId={projectId} estimations={paintEstimations} rooms={roomOptions} />
      </TabsContent>
      <TabsContent value="flooring" className="pt-4">
        <FlooringPanel projectId={projectId} rooms={rooms} estimationsByRoom={flooringByRoom} />
      </TabsContent>
      <TabsContent value="electrical" className="pt-4">
        <ElectricalPanel projectId={projectId} rooms={rooms} pointsByRoom={pointsByRoom} settings={electricalSettings} />
      </TabsContent>
    </Tabs>
  );
}
