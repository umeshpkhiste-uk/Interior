# Excel → Web App Mapping

This document maps every sheet of `Interior-Design-Business-Toolkit-0c1627a82e4e6161.xlsx` to the corresponding web application feature, database table, and calculation-engine module. The underlying cell-level formula analysis is in `docs/EXCEL_ANALYSIS_RAW.md` — read that for the raw Excel math; this document is the authoritative, decision-bearing reference for implementation.

Per the master prompt: workbook formulas are preserved exactly where they define real business logic; workbook *layout* (cell positions, sheet-local hacks like ordinal references) is not copied. Every place where the Excel was ambiguous, inconsistent, or used a spreadsheet-specific workaround is listed below with the decision taken and the reasoning — nothing was silently guessed.

## Resolved design decisions

These items were flagged during formula analysis as unclear, inconsistent, or Excel-layout-specific. Each is resolved here with a stated rationale, consistent with "all default prices must be editable" and "do not invent missing formulas" — none of these decisions invents a calculation; they decide *data modeling* and *UI/sync behavior* the spreadsheet couldn't express.

| # | Issue | Decision | Rationale |
|---|-------|----------|-----------|
| 15 | `ceiling_estimations` (created in Phase 3) had a `lighting_rate` for downlights but no distinct rate for LED cove-strip lighting, a different per-rft cost basis | Added `led_strip_rate numeric` column (Phase 6 migration); `Material` now adds `coveLength × ledStripRate` alongside `downlightQty × lightingRate` | Matches the source sheet's formula exactly (`+ coveLength×LEDstripRate`); the two lighting costs are priced differently in the workbook and must not share one rate |
| 16 | `paint_estimations` had no `margin_pct`/`rounding_unit` (every other estimator has a cost→price step) and no distinct rate for wallpaper *installation* (per roll) separate from wall-paint labour (per sqft) | Added `margin_pct`, `rounding_unit` (default ₹500, matching the source sheet), and `wallpaper_fixing_rate` columns | Without these, paint/wallpaper would be the only module with no sellable price, and wallpaper fixing would be incorrectly costed at the wall-paint per-sqft labour rate |
| 17 | `flooring_estimations` had `material_cost`/`labour_cost`/`total_cost` but no `margin_pct`, `rounding_unit`, or `selling_price`, despite the source sheet explicitly rounding flooring price to the nearest ₹500 | Added `margin_pct`, `rounding_unit`, `selling_price` columns | Same reasoning as #16 — flooring must be sellable at a price, not just a cost |
| 19 | `material_rates` had no fields for planned increase %, round step, business-wide expected monthly volume (decision #13), or market low/high — all needed by the Rate Revision calculator (sheet 14) | Added `planned_increase_pct`, `round_step` (default ₹5, matching the source sheet), `monthly_volume`, `market_low`, `market_high` columns | These are real inputs the source sheet uses; there was simply nowhere to store them yet |
| 20 | `electrical_project_settings` stored `material_cost`/`total_cost` but no `labour_cost`, so the Material vs Labour report (the entire point of decision #6's labour-share %) couldn't show electrical's labour split | Added `labour_cost` column, now persisted alongside `material_cost` | Without it, electrical would be the one head profitability reporting couldn't break down |
| 21 | The source sheet's profitability table (sheet 12) has one manually-typed plug row, "Other carpentry and furniture" — quoted price is derived (`MAX(0, BOQtotal − named heads)`), but its material/labour cost is typed by hand, with nowhere to store that input | Added `other_head_material_cost`/`other_head_labour_cost` to `project_settings` | Matches the source sheet exactly: every other number on that row is derived, only this one is a manual entry |
| 22 | The source sheet's Rate Revision "Project Impact" recomputes a specific project's BOQ using revised rates — but BOQ/estimator line items are never linked to the generic `materials`/`material_rates` catalog (each estimator module stores its own embedded rate fields, not a material FK) | Scoped out for now: only the business-wide "Estimated Monthly Impact" (decision #13) is implemented. Per-project impact would require inventing a materials↔BOQ-line linkage the workbook and this app's estimator modules don't have | Implementing it would mean fabricating a mapping that doesn't exist anywhere in the schema or the source sheet's actual cell references — flagged here rather than guessed |
| 18b | The source sheet's ceiling labour formula is `area×labourRate + coveLength×coveWorkRate` — a separate per-rft labour rate for cove construction distinct from the flat area-based labour rate, missed on the first Phase 6 pass | Added `cove_labour_rate` column | Same reasoning as #15 — cove construction and flat-ceiling labour are priced differently in the source sheet |
| 18 | Ply & Laminate has no first-class pricing home: `panel_cut_lists` is a per-row cut list, not a place to hold one project-wide laminate rate, edge-band rate, fixings %, margin, or resulting price | Added `plywood_project_settings` (one row per project), mirroring the existing `electrical_project_settings` pattern | Decision #8 already gives Ply & Laminate its own BOQ line; it needs the same cost→price mechanics as every other module to produce that line's amount |
| 23 | Master prompt §24 asks for a "Material Requirement Report," but `boq_items` is not linked to the `materials` catalog (same gap as decision #22) — there is no table of "material X, quantity Y needed" anywhere | Built it from the BOQ's own material-cost columns instead: one row per BOQ line showing item description, specification, brand, quantity, unit, material rate, and material amount (`quantity × material_rate`) | This is real data the schema already has, honestly presented as "the material-cost portion of the BOQ" rather than inventing a materials-catalog linkage that doesn't exist |
| 24 | The Phase 3 schema scaffold already created `moodboards`/`inspiration_images` (master prompt §22) with column names `image_url` and `uploaded_by`, before Phase 9 built the feature | Kept the existing columns rather than renaming: `image_url` stores the private Supabase Storage **object path** (not a public URL) — a signed URL is generated on each read via `createSignedUrls`, since the `inspiration` bucket is private and scoped by organization folder prefix, matching every other tenant-scoped resource's RLS approach | Avoided a destructive rename of already-migrated columns; the private-bucket + signed-URL approach is what "image_url" needs to mean once the bucket can't be public |
| 25 | All 10 report types (master prompt §24) need both a PDF and an Excel rendering, but building 20 bespoke documents would duplicate the same tabular layout 20 times | Built one generic `ReportTable` shape (title/header/columns/rows/totals) that every report builder fills in, rendered by one generic `@react-pdf/renderer` document and one generic `exceljs` workbook builder; row values are pre-formatted display strings (e.g. already run through `formatINR`) rather than raw numbers | Keeps all 10 reports visually consistent and avoids 20 near-duplicate render functions; the one real tradeoff — Excel cells hold formatted strings instead of native numbers a studio could re-sum — was accepted for consistency since every report already states its own totals |

| # | Issue | Decision | Rationale |
|---|-------|----------|-----------|
| 1 | Excel uses one global door size + one global window size for every room, not per-opening dimensions | Support both: a default door/window size per project (quick entry), with optional per-opening override stored in `room_openings` | Master prompt explicitly lists "door dimensions" / "window dimensions" as per-item inputs; this is a strict upgrade over the Excel simplification |
| 2 | `price = cost / (1 − margin)`, i.e. margin is *on selling price*, not cost-plus | Replicate exactly via `applyMarginOnPrice(cost, marginPct)` in the calc engine | This is real business logic (how the studio prices jobs), not a layout artifact — changing the formula would silently alter every quoted price |
| 3 | Rounding granularity differs per tool with no stated rule (Kitchen ₹1,000; Wardrobe/Ceiling/Paint/Flooring/Electrical ₹500; Package ₹5,000; Rate Revision ₹5) | Keep each module's own default rounding unit, but make it an editable numeric field in Rate Management / Settings, never hardcoded | Preserves existing behavior out of the box while fixing the inconsistency going forward |
| 4 | Wardrobe #1 gets an itemized internals list; wardrobes 2+ get one flat typed number — an Excel single-sheet layout limitation | Generalize: every wardrobe gets its own itemized internal-fittings list (many-to-many `wardrobes` ↔ `wardrobe_components`) | Master prompt explicitly asks for "drawers, hanging rods, shelves, pull-out accessories and mirrors" support for wardrobes generally, not just the first one |
| 5 | Wardrobe total price = sum of *already individually rounded* per-wardrobe prices | Preserve exactly: round each wardrobe's price, then sum for the project total | Re-deriving from an aggregate cost would produce a different (wrong, by Excel's own standard) total |
| 6 | Electrical labour cost is a retroactive % split of bundled all-in point rates, not a true bottom-up calc | Keep all-in point rates with an editable "labour share %" used only for the Material-vs-Labour report | This is the real workbook convention (point rates are genuinely quoted all-in in this trade); inventing a bottom-up split would contradict the source data |
| 7 | BOQ↔estimator sync uses direct one-off cell references; wardrobes are linked by ordinal position (1st/2nd/3rd/4th) | Real FK-based sync: `boq_items.source_module` + `source_estimation_id`; a "Sync from Estimators" action upserts on that pair so re-running sync never duplicates rows | Master prompt explicitly requires "no duplicate entries during synchronization" — ordinal position is not stable once estimates are edited/reordered |
| 8 | Ply & Laminate (Tool 04) has no first-class BOQ line in the sample; its cost is absorbed into a manual "Other carpentry" plug line | Give Ply & Laminate its own BOQ line, auto-synced like the other 6 modules | Strict improvement; nothing in the master prompt says this module's cost should be hidden inside another line |
| 9 | Quotation's contingency % and GST % are live-linked to Tool 09/14, so editing them after sending a quote would silently change it | **Must snapshot** all rate/percentage inputs into `quotation_snapshots` at send/approval time; snapshot is immutable thereafter | Master prompt is explicit and non-negotiable on this: "previously approved quotations must preserve their original rates... use immutable quotation snapshots" |
| 10 | Excel only implements percentage discount; master prompt asks for percentage OR fixed | Implement both via `discount_type: 'percent' \| 'fixed'` on quotations | Directly requested by the master prompt, not an invented formula |
| 11 | Quotation number in Excel is a static typed string, no auto-increment formula exists | Design fresh: per-organization sequence, format `{PREFIX}/{FY}/{seq}` (e.g. `QT/2026-27/0143`), prefix configurable in org settings | No Excel logic to preserve here; master prompt explicitly requires automatic numbering |
| 12 | Design fee's "project value" (percentage basis) = Tool 10's **taxable value**, i.e. post-discount, pre-GST — not the raw BOQ total | Replicate exactly: when a quotation exists, use its taxable amount; otherwise fall back to the project's current BOQ grand total (pre-GST) | Getting the base number wrong would misstate every percentage-based design fee |
| 13 | Rate Revision's "monthly volume" is business-wide (expected usage across all projects), not tied to one project, despite living next to a "project impact" concept | Keep as "Estimated Monthly Business Impact" (org-level), clearly separate from "Project Impact" (a recalculation of one specific project's BOQ using revised rates, computed on demand) | Prevents mislabeling a business-wide estimate as a project-specific one |
| 14 | Flooring's "No work" option must zero a room's cost entirely, not just leave rates blank | Model as an explicit `flooring_type = 'no_work'` sentinel per room-flooring row; excluded from cost but still listed in the UI for completeness | Keeps the room visible/auditable rather than silently missing |

## Sheet-by-sheet mapping

### Home → Dashboard (headline links only)
No original logic; superseded entirely by the live Dashboard (see Sheet 15 below).

### 01 Room Area & Walls → Room Measurements module
- **DB**: `project_rooms` (room_name, room_category, length, width, height, unit_system, length_std/width_std/height_std in feet for calculation), `room_openings` (room_id, opening_type: door/window/other, width, height, quantity, is_custom)
- **Calc engine**: `lib/calculations/area.ts` — `floorArea`, `grossWallArea`, `openingArea`, `netWallArea`, `ceilingArea` (= floor area), room/project totals, largest-room lookup
- Formulas preserved exactly: `Floor = L×W`; `GrossWall = 2(L+W)×H`; `Openings = Σ(qty × width × height)` per opening type; `NetWall = MAX(0, GrossWall − Openings)`; `Ceiling = Floor`
- Both feet/inch and metric units supported; original input + standardized feet value both stored (per master prompt §8) to avoid repeated conversion drift

### 02 Modular Kitchen → Interior Estimators / Kitchen
- **DB**: `kitchen_estimations` (layout_type, base_rft, wall_rft, tall_qty, corner_qty [auto-derived from layout_type but overridable], rates, countertop_depth/rate/material, install_labour_pct, margin_pct, rounding_unit), `kitchen_accessories` (org-level reusable rate list + per-estimation line qty)
- **Calc engine**: `lib/calculations/kitchen.ts`
- Corner unit auto-rule preserved: U-Shaped → 2, L-Shaped/Island → 1, Straight/Parallel → 0 (user-overridable)
- `Material = Cabinets + Countertop + Hardware`; `Labour = Material × installLabourPct`; `Cost = Material + Labour`; `Price = applyMarginOnPrice(Cost, marginPct)` rounded to `roundingUnit` (default ₹1,000)

### 03 Wardrobe → Interior Estimators / Wardrobe
- **DB**: `wardrobes` (project_id, room_id, name, width, height, depth, shutter_type: hinged/sliding/open, has_loft, loft_height, margin_pct, rounding_unit [default ₹500]), `wardrobe_components` (wardrobe_id, component_name, qty, rate) — every wardrobe, not just the first
- **Calc engine**: `lib/calculations/wardrobe.ts`
- `SqFt = W×H`; `LoftSqFt = hasLoft ? W×loftHeight : 0`; `Material = SqFt×shutterRate + LoftSqFt×loftRate + Σ(components)`; `Cost = Material×(1+labourPct)`; `Price = applyMarginOnPrice(Cost, marginPct)` rounded per-wardrobe, **then summed** for project total (decision #5)

### 04 Ply & Laminate → Interior Estimators / Plywood & Laminate
- **DB**: `panel_cut_lists` (project_id, panel_length, panel_width, qty, board_grade, laminate_faces [0/1/2], has_edge_band), `materials` rows scoped category `plywood`/`laminate` for board/laminate/edge-band rates
- **Calc engine**: `lib/calculations/plywood.ts`
- `Area = Qty×L×W`; `LaminateSqft = Area×laminateFaces`; `EdgeBandRft = hasEdgeBand ? Qty×2×(L+W) : 0`; sheets required per board grade `= ROUNDUP(Area×(1+wastage)/sheetArea)`; `Cost = Σ(sheets×rate) + laminateSheets×laminateRate + edgeBandRft×edgeBandRate + fixingsPct×(boards+laminate)`
- Gets its own BOQ line (decision #8)

### 05 False Ceiling → Interior Estimators / False Ceiling
- **DB**: `ceiling_estimations` (room_id, ceiling_type, cover_pct, design: cove/peripheral/none, cove_length, downlight_qty, rates, margin_pct)
- **Calc engine**: `lib/calculations/false-ceiling.ts`
- Pulls room floor area from `project_rooms` (live reference, not a snapshot — pre-quotation estimates are expected to track current measurements)
- `CeilingSqft = FloorArea×coverPct`; `Boards = ROUNDUP(area×(1+wastage)/boardSize)`; `Material = area×materialRate + lights×lightRate + coveLength×ledRate`; `Labour = area×labourRate + coveLength×coveWorkRate`; `Price = applyMarginOnPrice(Material+Labour, marginPct)` rounded to ₹500 default

### 06 Paint & Wallpaper → Interior Estimators / Paint & Wallpaper
- **DB**: `paint_estimations` (room_id or project-level, wall_area, ceiling_area, feature_wall_area, coats, coverage rates, can_size, wallpaper roll dims/rate)
- **Calc engine**: `lib/calculations/paint.ts`
- `AreaToPaint = MAX(0, WallArea−FeatureWall) + CeilingArea`; `PaintLitres = ROUNDUP(area×coats/coveragePerLitre)`; `Cans = ROUNDUP(litres/canSize)`; `Primer = ROUNDUP(area/primerCoverage)`; `Putty = ROUNDUP((WallArea−FeatureWall)/puttyCoverage)`; `WallpaperRolls = ROUNDUP(featureWall×(1+wastage)/rollCoverage)`

### 07 Flooring & Tiles → Interior Estimators / Flooring
- **DB**: `flooring_estimations` (room_id, flooring_type [incl. `no_work` sentinel, decision #14], tile_length, tile_width, price_per_box, pieces_per_box, wastage_pct, laying_labour_rate, adhesive_grout_rate, skirting_rft)
- **Calc engine**: `lib/calculations/flooring.ts`
- `Tiles = flooringType==='no_work' ? 0 : ROUNDUP(roomArea×(1+wastage)/(tileL×tileW))`; `Boxes = ROUNDUP(tiles/piecesPerBox)`; `Cost = Boxes×pricePerBox + roomArea×(layingLabour+adhesiveGrout) + skirtingRft×skirtingRate`

### 08 Electrical Points → Interior Estimators / Electrical & Lighting
- **DB**: `electrical_estimations` (room_id, point_type, qty, all_in_rate), project-level `db_mcb_cost`, `labour_share_pct` (default 0.35, decision #6)
- **Calc engine**: `lib/calculations/electrical.ts`
- `RoomCost = Σ(qty×allInRate) + profileRft×profileRate`; `TotalMaterial = PointsCost×(1−labourSharePct) + DB`; `TotalLabour = PointsCost×labourSharePct` (reporting split only, per decision #6)

### 09 Full Home BOQ → BOQ Management
- **DB**: `boq_items` (project_id, room_id nullable, work_category, item_description, specification, brand, unit, quantity, material_rate, labour_rate, amount, is_manual, source_module nullable, source_estimation_id nullable)
- **Calc engine**: `lib/calculations/boq.ts`
- Sync action: for each of the 7 estimator modules, upsert BOQ rows keyed on `(project_id, source_module, source_estimation_id)` — fixes decision #7/#8, never duplicates
- `Subtotal = Σ(amount)`; `Contingency = Subtotal×contingencyPct`; `GST = (Subtotal+Contingency)×gstPct`; `GrandTotal = Subtotal+Contingency+GST`; `PerSqFt = (Subtotal+Contingency)/carpetArea`
- Both contingency % and GST % are per-project editable fields, never hardcoded

### 10 Client Quotation → Quotations module
- **DB**: `quotations` (quotation_number [auto-generated, decision #11], status, dates, discount_type/discount_value [decision #10]), `quotation_items` (room/item/qty/rate/amount), `quotation_snapshots` (full JSON snapshot of BOQ + rates + percentages at send time, decision #9)
- **Calc engine**: `lib/calculations/quotation.ts`
- `Gross = RoomsTotal + Contingency + ExtraItems`; `Discount = discountType==='percent' ? Gross×value : value`; `Taxable = Gross−Discount`; `GST = Taxable×gstPct`; `RoundOff = ROUND(Taxable+GST,0)−(Taxable+GST)`; `GrandTotal = Taxable+GST+RoundOff`
- On transition to status `Sent`, write an immutable `quotation_snapshots` row; all later display of that quotation reads from the snapshot, not live BOQ/rate tables
- PDF generation per master prompt §17 (A4, Indian currency formatting via shared `formatINR()`)

### 11 Design Fee → Design Fees module
- **DB**: `design_fees` (project_id, basis: percent/per_sqft/fixed, fee_pct, fee_per_sqft, fixed_fee, included_visits, additional_visits, additional_visit_rate, gst_pct), `design_fee_stages` (stage name, pct)
- **Calc engine**: `lib/calculations/design-fee.ts`
- `ProjectValue` sourced per decision #12; `Fee = basis==='per_sqft' ? carpetArea×feePerSqft : basis==='fixed' ? fixedFee : projectValue×feePct`; `ExtraVisits = MAX(0, visitsUsed−included)×rate`; `TotalBeforeGST = Fee+ExtraVisits`; `TotalWithGST = TotalBeforeGST×(1+gstPct)`

### 12 Material vs Labour & Profit Analysis → Cost & Profit Analysis module
- **DB**: `project_expenses` (categorized), computed view combining BOQ work-category totals + `project_settings.overhead_pct`, `supervisor_monthly_cost`, `project_duration_months`, `target_margin_pct`
- **Calc engine**: `lib/calculations/profitability.ts`
- `Overhead = (Material+Labour)×overheadPct`; `Cost = Material+Labour+Overhead`; `Margin = QuotedPrice−Cost`; `MarginPct = Margin/QuotedPrice`
- Project-level: `Supervision = supervisorMonthlyCost×durationMonths`; `TotalCost = Σ(headCosts)+Supervision+ContingencyAtCost`; `TotalQuoted = Σ(headQuoted)+Contingency−Discount`; `ActualProfit = TotalQuoted−TotalCost` (never `quotedPrice − materialCost`, per master prompt §19)

### 13 Package Compare → Package Comparison module
- **DB**: `project_packages` (tier: basic/premium/luxury, component rates per sqft, round_step [default ₹5,000], spec_text fields per component)
- **Calc engine**: `lib/calculations/packages.ts`
- `TierRatePerSqft = Σ(componentRates)`; `TierPrice = roundStep>0 ? ROUNDUP(area×rate/roundStep)×roundStep : area×rate`; qualitative spec fields are plain text, not calculated
- Selecting a tier can generate a quotation directly (pre-fills `quotations`/`quotation_items` from the package)

### 14 Rate Revision → Rate Management module
- **DB**: `materials`, `suppliers`, `material_rates` (current/previous/revised, effective_date), `rate_history` (append-only audit of every change)
- **Calc engine**: `lib/calculations/rate-revision.ts`
- `NewRate = ROUNDUP(current×(1+increasePct)/roundStep)×roundStep`; business-wide `EstimatedMonthlyImpact = (newRate−current)×expectedMonthlyVolume` (decision #13, org-level, not project-level); separate on-demand `ProjectImpact(projectId)` recomputes that project's BOQ with revised rates for comparison
- Changing a rate here **never** mutates an existing `quotation_snapshots` row (decision #9)

### 15 Dashboard → Dashboard module
Every summary card and chart (master prompt §5) is computed live from real Supabase aggregates across `projects`, `clients`, `quotations`, `project_expenses`, `boq_items` — no linked cells, no hardcoded numbers, matching the master prompt's explicit "no mock data" rule.

## Not in the Excel workbook, but required by the master prompt

- **Multi-tenancy / organizations / roles** (master prompt §4) — no Excel equivalent; pure application design, covered in `ARCHITECTURE.md`
- **Inspiration library** (§22) — explicitly kept separate from cost calculations
- **Project expense & payment tracking** (§23) — informed additionally by `Reference/Labour-Carpenter-Payment-Kit`, `Reference/Material-Purchase-Vendor-Kit`, and `Reference/Project-Profit-Billing-Kit` for field-level detail, mined in Phase 8
- **Reports module** (§24) — PDF/Excel export wrapper over the calculation engine's outputs, not a new calculation
