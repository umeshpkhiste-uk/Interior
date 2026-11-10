# Raw Excel Formula Analysis — Interior-Design-Business-Toolkit-0c1627a82e4e6161.xlsx

Internal reference document. This is the unedited sheet-by-sheet formula analysis produced during Phase 1, kept for engineers implementing `lib/calculations/*.ts` in later phases. The curated, decision-bearing version lives in `EXCEL_TO_WEBAPP_MAPPING.md` — read that first; come here only when you need the underlying Excel cell-level detail or want to re-verify a formula against the source workbook.

Source workbook: `Reference/Interior-Design-Business-Toolkit-0c1627a82e4e6161.xlsx` (16 sheets: Home + 15 tools). A full cell dump (every formula + computed value) was extracted via openpyxl; sheet boundaries in that dump: Home:7, 01 Room Area & Walls:146, 02 Modular Kitchen:425, 03 Wardrobe:911, 04 Ply & Laminate:2058, 05 False Ceiling:2532, 06 Paint & Wallpaper:2860, 07 Flooring & Tiles:3148, 08 Electrical Points:3457, 09 Full Home BOQ:3742, 10 Client Quotation:4382, 11 Design Fee:4961, 12 Material vs Labour:5214, 13 Package Compare:5571, 14 Rate Revision:6268, 15 Dashboard:7282–7443.

**Shared pattern across every sheet**: an inline Indian-currency-format expression (`IF(≥1e7, crores grouping, IF(≥1e5, lakhs grouping, plain))`) is repeated verbatim in every "Key Insights" narrative. Implement once as `formatINR()` in the app — never port the raw Excel expression.

**Shared disclaimer**: every sheet states "2026 India sample data... all rates are samples: type your own" — confirms workbook prices are non-canonical placeholders, exactly as the master prompt assumes.

## Sheet: Home
Pure navigation/landing page, no original logic. Pulls one KPI from each tool via direct refs (carpet area, kitchen price, BOQ total pre-GST, quotation total with GST, margin). → becomes the app's Dashboard headline cards, computed live, not linked cells.

## Sheet 01: Room Area & Walls
**Global inputs** (apply to ALL rooms, not per-opening): Door height/width (E15/E16), Window height/width (E17/E18). Every door in every room is assumed identical size, same for windows — there's no per-opening custom dimension even though the master prompt spec implies per-opening dims (see mapping doc decision #1).

Room table: 14 rows (31–44), per room: Length/Breadth/Height/Doors/Windows → `Floor=L×W`; `Perimeter=2(L+B)`; `GrossWall=Perimeter×Height`; `Openings=Doors×DoorH×DoorW + Windows×WinH×WinW`; `NetWall=MAX(0, GrossWall−Openings)`. Ceiling area = floor area (no separate calc). Totals via SUM; largest room via INDEX/MATCH on max floor area. Metric (sq m) conversion is display-only (×0.092903), never feeds downstream math. No money on this sheet. Room categories in sample data (Living, Dining, Kitchen, Master bed, Bed 2/3, Foyer, Balcony) are a subset of the master prompt's canonical list (which adds Bathroom/Utility/Passage/Other) — use the master prompt's list as the dropdown, not the Excel's sample labels.

## Sheet 02: Modular Kitchen
Inputs: layout (Straight/L-shape/U-shape/Parallel/Island), base/wall running ft, tall unit qty. Rates (admin-editable): base ₹/rft, wall ₹/rft, tall ₹/unit, corner-extra ₹/unit, countertop depth+rate, install labour %, **margin on price %**.

`CornerUnits = IF(layout="U-shape",2, IF(layout IN ("L-shape","Island"),1, 0))` (Straight/Parallel → 0, automatic from layout).
`Cabinets = Base×BaseRate + Wall×WallRate + Tall×TallRate + CornerUnits×CornerExtra`
`Countertop = (Base×Depth)×CountertopRate`
`Hardware = SUM(120-row qty×rate accessories table)`
`Material = Cabinets+Countertop+Hardware`; `Labour = Material×InstallLabour%`; `Cost = Material+Labour`
**`Price = IF(margin≥1, cost, ROUNDUP(ROUND(cost/(1-margin)/1000,6),0)×1000)`** — **margin is on selling price, not on cost** (price = cost/(1−margin)), rounded UP to nearest ₹1,000. This exact convention repeats (with varying rounding granularity) across every estimator — it is the single most consequential formula pattern in the workbook and must be replicated exactly, not approximated as cost×(1+margin).

120-row hardware/accessories table is pure qty×rate seed data (hinges, drawer channels, tandem boxes, pull-out baskets, bottle pull-outs, magic corners, handles, lift-ups, sink) → becomes a `materials`/hardware reference table scoped "kitchen accessories", org-editable. A sensitivity table recomputes price at other base-lengths (nice chart, not core state).

## Sheet 03: Wardrobe
Rates: Hinged ₹/sqft, Sliding ₹/sqft, Loft rate ₹/sqft, **global** Loft height (applies to every wardrobe with a loft, not per-wardrobe), install labour %, margin on price.

120 wardrobe rows: `SqFt=W×H`; `LoftSqFt=IF(Loft="Yes", W×GlobalLoftHeight, 0)`; `Material=SqFt×(Sliding?SlideRate:HingeRate) + LoftSqFt×LoftRate + Internals`; `Cost=Material×(1+Labour%)`; **`Price=IF(margin≥1,cost,ROUNDUP(ROUND(cost/(1-margin)/500,6),0)×500)`** — same margin-on-price convention as kitchen but rounds to nearest **₹500**, not ₹1,000.

**Internals asymmetry**: wardrobe #1's internals (J31) pull from a dedicated 120-row itemized sub-list (rows 154–273: drawers, hanging rods, trouser pull-out, tie rack, mirror, locker — same qty×rate pattern as kitchen hardware). Every other wardrobe's internals is a flat typed lump sum (see mapping doc decision #4).

Total price = `SUM` of **already individually-rounded** per-wardrobe prices, not one rounding applied to a total — the engine must round each wardrobe row and sum, matching Excel exactly (not re-derive from aggregate cost).

## Sheet 04: Ply & Laminate
Rates: sheet L×W (8×4 default), cutting wastage %, laminate rate/sheet, edge-band rate/rft, fixings % (share of boards+laminate).

Cut-list rows (40 lines): columns Qty, L(ft), W(ft), Board grade (text, matched against a 24-line rate table), Laminate faces (count: 0/1/2 — multiplies area for laminate sqft), Edge band? (Yes/No). `Area=Qty×L×W`; `LaminateSqft=Area×LaminateFaces`; `EdgeBandRft=IF(EdgeBand="Yes", Qty×2×(L+W), 0)` — full perimeter × qty when edge-banded, 0 otherwise.

Board rate table (24 lines, e.g. "18mm BWR ply" ₹3,400/sheet): area pulled via `SUMIFS` matching board-grade text against the cut list, then `Sheets=ROUNDUP((area×(1+wastage))/sheetArea)`, `Cost=Sheets×RatePerSheet`. Laminate sheets computed the same way as one pooled total (not per board grade). Fixings = (boards+laminate)×fixings%. This tool is never referenced from the BOQ sheet (09) in the sample — its cost is implicitly absorbed into BOQ's manual "Other carpentry" plug line in sheet 12 (see mapping doc decision #8).

## Sheet 05: False Ceiling
First real cross-sheet linkage via INDEX: room list + floor area pulled live from sheet 01, with an editable "Ceiling cover %" (0–1, lets a room be partially covered, e.g. peripheral ceiling = 0.6) and per-room Design (Cove/Peripheral/None), Cove length (rft), each overridable.

Ceiling type (dropdown) drives a lookup against a 24-line rate table (`INDEX/MATCH` → material ₹/sqft, labour ₹/sqft per type: Gypsum 55+30, POP 45+35, Grid 60+20, PVC 75+25). `CeilingSqft = SUM(FloorArea×CoverPct)`; `Boards = ROUNDUP(area×(1+wastage)/boardSize)`; `DownLights = ROUNDUP(area/areaPerLight)`; `Material = area×materialRate + lights×lightRate + coveLength×LEDstripRate`; `Labour = area×labourRate + coveLength×coveWorkRate`; `Cost=Material+Labour`; `Price=IF(margin≥1,cost,ROUNDUP(ROUND(cost/(1-margin)/500,6),0)×500)`.

## Sheet 06: Paint & Wallpaper
Wall/ceiling area pulled from sheet 01 (overridable), minus a "Feature wall" area treated as wallpaper-only (not painted). Per-room breakdown table (8 rows, same INDEX pattern from sheet 01) is informational/charting only — totals use the top-level area inputs, not a sum of the per-room table.

`AreaToPaint = MAX(0, WallArea−FeatureWall) + CeilingArea`; `Paint(L) = ROUNDUP(area×coats/coveragePerLitre)`; `Cans = ROUNDUP(litres/canSize)`; `Primer(L) = ROUNDUP(area/primerCoverage)` (one coat, fixed); `Putty(kg) = ROUNDUP((WallArea−FeatureWall)/puttyCoverage)` (walls only, excludes ceiling); `WallpaperRolls = ROUNDUP(featureWall×(1+wastage)/rollCover)`. `Labour = AreaToPaint×paintLabourRate + WallpaperRolls×fixingPerRoll`. Price rounds to nearest ₹500.

## Sheet 07: Flooring & Tiles
Per-room table pulls room+area from sheet 01, has a **"No work"** sentinel floor-type value that zeroes the room's cost entirely (skip room) (see mapping doc decision #14). Floor-type-specific tile L/W/pieces-per-box/rate-per-box are **per-room typed values**, not looked up from a shared floor-type rate table (unlike ceiling), though a summary table aggregates cost `SUMIFS` by floor-type label for charting.

`Tiles = IF(floorType="No work" OR tileArea=0, 0, ROUNDUP(roomArea×(1+wastage)/(tileL×tileW)))`; `Boxes = ROUNDUP(tiles/piecesPerBox)`; `TileCost = Boxes×ratePerBox`; `SkirtingRft` pulled from sheet 01's room perimeter column; `RoomCost = TileCost + roomArea×(layingLabour+adhesiveGrout) + skirtingRft×skirtingRate` (zeroed if "No work"). Price rounds to nearest ₹500.

## Sheet 08: Electrical Points
Point-type rates (Light/Fan/6A/16A/AC/TV-data/Profile-per-rft) are flat all-in rates (wiring+switch+box+labour bundled — not separately split at the point level). DB/MCB/earthing is a **lump sum**, added to material cost directly. Labour is NOT itemized per point type — instead a single global "Labour share in point rates" % (0.35 default) retroactively splits the already-bundled point cost into material/labour for Tool 12's reporting (`Material=PointsCost×(1-laborShare)+DB`; `Labour=PointsCost×laborShare`) (see mapping doc decision #6). Per-room table (rooms from sheet 01) has 6 point-type qty columns + profile-light-rft column; `RoomCost = Σ(qty×rate) for each type + profileRft×profileRate`. Price rounds to nearest ₹500.

## Sheet 09: Full Home BOQ
150-line flat BOQ: Room (free text, validated against a derived 15-room summary list), Item, Specification, Unit, Qty, Rate, Amount=Qty×Rate. Contingency % and GST % both top-level configurable inputs (not hardcoded).

**Critical sync-design finding**: the first ~6 BOQ rows don't compute their own rate — each is a single "lot" line whose Rate cell directly references a specific output cell of the matching estimator tool. **Wardrobes are referenced by ordinal position** (1st/2nd/3rd/4th wardrobe row by `INDEX` position) — a fragile position-based mapping, not stable-ID-based (see mapping doc decision #7). Ply & Laminate (Tool 04) has **no BOQ line at all** in the sample (decision #8). Remaining ~140 rows are free-typed manual line items that never sync from anywhere.

`BOQTotal=SUM(Amount)`; `Contingency=Total×%`; `BeforeGST=Total+Contingency`; `GST=BeforeGST×%`; `GrandTotal=BeforeGST+GST`; `PerSqFt=BeforeGST/CarpetArea` (before GST). A room-rollup table re-derives per-room totals via SUMIFS against the free-text Room column, with a reconciliation check (`✅ Rooms add up` if `|sum(rooms)−BOQtotal|<1`).

## Sheet 10: Client Quotation — richest sheet
Quotation number is a **static typed value, not a formula** — Excel has no automatic numbering (see mapping doc decision #11). Quote date = `TODAY()`; validity = date + validity-days input.

Room-wise lines on the quote are the **top-N rooms by a hidden sort key**, re-displaying sheet 09's room rollup, capped at rooms that have BOQ lines. `RoomsTotal = SUM(Tool09 room amounts)`; `Contingency = RoomsTotal × Tool09's contingency%` (re-pulled live, not a snapshot — the exact problem the master prompt warns against; see decision #9). `ExtraItems = SUM(120-line "not in BOQ" list)`; `Gross = RoomsTotal + Contingency + ExtraItems`; `Discount = Gross × discount%` (percentage only in the sample — see decision #10); `Taxable = Gross − Discount`; `GST = Taxable × GST%`; `RoundOff = ROUND(Taxable+GST,0) − (Taxable+GST)`; `GrandTotal = Taxable+GST+RoundOff`. 4-stage payment schedule (% shares validated to sum to 100%), each stage amount = `GrandTotal × stageShare%`.

## Sheet 11: Design Fee
Three bases (Percent of project-value / Per-sqft / Fixed), selected by dropdown — `DesignFee = IF(basis="Per sq ft", areaFee, IF(basis="Fixed", fixedFee, pctFee))`. Project value is pulled from **sheet 10's taxable value** (post-discount, pre-GST) — see decision #12. `ExtraVisits = (visitsUsed−visitsIncluded)×ratePerVisit` (only additive, never a credit). `FeeBeforeGST = DesignFee + ExtraVisits`; `GST = FeeBeforeGST×gst%`; `FeeWithGST = FeeBeforeGST+GST`. A 20-stage fee-split table (editable %, must sum to 100%) breaks the fee into billing milestones.

## Sheet 12: Material vs Labour & Profit — profitability core
30-row work-head table, each row linking Material/Labour straight from its own estimator sheet's output cells, with Quoted Price from that tool's final price cell. `Overhead = (Material+Labour)×overhead%` (uniform overhead % across all heads). `Cost = Material+Labour+Overhead`. `Margin₮ = QuotedPrice−Cost`; `Margin% = Margin₮/QuotedPrice`; status flag OK/Below-target per head vs a single target-margin% input.

**"Other carpentry and furniture" row is a plug/balancing line**: its quoted price = `MAX(0, BOQtotal − Kitchen − Wardrobes − Ceiling − Paint − Flooring − Electrical)` (where Ply&Laminate's cost and manual BOQ furniture lines land), material/labour for that row **typed manually**. `Supervision = supervisorMonthlySalary × projectDurationMonths` (added once, project-wide). `TotalCost = Σ(head costs) + Supervision + ContingencyAndExtras(at cost, pulled from Tool 10)`. `QuotedPrice(overall) = Σ(head quoted prices) + ContingencyAndExtras − Discount`. `OverallMargin = QuotedPrice − TotalCost`. This correctly implements the master prompt's requirement to compute actual profit, not quoted-price-minus-material.

## Sheet 13: Package Compare
Per-component (Wardrobes, Kitchen, Ceiling, Paint, Flooring, Electrical, Furniture, Decor) ₹/sqft rate for Basic/Premium/Luxury side by side; `PackageRatePerSqft = SUM(component rates for that tier)`; `PackagePrice = IF(roundStep≤0, area×rate, ROUNDUP(ROUND(area×rate/roundStep,6),0)×roundStep)` (default round step ₹5,000). One package is selected to quote; GST applied on top; comparison line shows delta vs actual BOQ total. A qualitative spec table (Shutters/Hardware/Countertop/Ceiling/Warranty text per tier) is descriptive only, not costed.

## Sheet 14: Rate Revision
120-line rate table: Work item, Unit, Current rate, Last-changed date, Market low/high, Planned increase % (global default, per-row overridable), Monthly volume (**business-wide**, not project-specific — decision #13), Months-since-change. `NewRate = ROUNDUP(ROUND(current×(1+increase%)/roundStep,6),0)×roundStep` (default round step ₹5). `WorkPerMonth = current×volume`; `ExtraPerMonth = (newRate−current)×volume`; status vs market by comparing NewRate against market low/high. Confirms the "immutable quotation snapshot" requirement is necessary because this sheet lets rates drift independently of any already-quoted project.

## Sheet 15: Dashboard
Pure aggregation/linking sheet — every cell pulls a single output cell from another tool. No original calculation logic. Direct blueprint for the web app's Dashboard summary cards.
