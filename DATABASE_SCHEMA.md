# Database Schema

PostgreSQL via Supabase. All tables use UUID primary keys (`gen_random_uuid()`), `created_at`/`updated_at` timestamps (`updated_at` maintained by a shared trigger), and are scoped to an `organization_id` for multi-tenancy except where noted. Full SQL migrations are written in Phase 3 (`app/supabase/migrations/`); this document is the design reference those migrations implement.

## Conventions

- **Soft delete**: tables users can "archive" (clients, projects, materials) get `archived_at timestamptz null` rather than hard delete, preserving referential history for quotations/reports.
- **Money**: `numeric(14,2)` for currency amounts, `numeric(6,4)` for percentages stored as fractions (e.g. `0.1800` for 18%), never `float`.
- **RLS**: every organization-scoped table has `organization_id` indexed and a policy restricting rows to `organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())`, further narrowed by role where the table holds financial data (see `ARCHITECTURE.md` → permission matrix).
- **Versioning**: every estimation table stores `rate_snapshot jsonb` (the rates actually used) + `calc_version text` alongside the live FK rates, so historical estimates remain reproducible even after rate revisions (master prompt §26).

## Core tenancy & identity

- **organizations** — id, name, logo_url, address, gstin, contact_phone, contact_email, quotation_prefix, default_gst_pct, default_contingency_pct, created_at
- **profiles** — id (= auth.users.id), full_name, avatar_url, phone, created_at
- **organization_members** — id, organization_id, user_id, role (`super_admin`/`studio_owner`/`manager`/`designer`/`accountant`/`viewer`), invited_at, accepted_at
- **organization_settings** — organization_id (PK), key-value settings not worth their own columns (rounding units per module, labour-share defaults, etc.) as `jsonb`
- **audit_logs** — id, organization_id, user_id, entity_type, entity_id, action, diff jsonb, created_at

## Clients & Projects

- **clients** — id, organization_id, name, mobile, email, alternate_contact, address, city, state, pin_code, property_type, notes, archived_at
- **projects** — id, organization_id, client_id, project_code (human-readable unique-per-org), name, property_address, property_type (apartment/villa/independent_house/office/commercial), bedrooms, bathrooms, carpet_area, built_up_area, start_date, expected_completion_date, status (enquiry/site_visit/measurements_pending/design_in_progress/estimation_in_progress/quotation_sent/approved/execution_started/completed/cancelled), description, assigned_designer_id (→ profiles), archived_at

## Room measurements

- **project_rooms** — id, project_id, room_name, room_category (living_room/dining_room/master_bedroom/bedroom_2/bedroom_3/kitchen/bathroom/balcony/utility/passage/other), length, width, height, unit_system (feet_inches/metric), length_ft, width_ft, height_ft (standardized calc values per master prompt §8), floor_area, gross_wall_area, net_wall_area, ceiling_area
- **room_openings** — id, room_id, opening_type (door/window/other), width, height, quantity, is_custom (false = uses project default size)
- **room_measurement_audit** — id, room_id, changed_by, field_name, old_value, new_value, changed_at (manual-adjustment audit trail per master prompt §8)

## Estimation modules

- **kitchen_estimations** — id, project_id, layout_type, base_rft, wall_rft, tall_qty, corner_qty, base_rate, wall_rate, tall_rate, corner_rate, countertop_area, countertop_rate, install_labour_pct, wastage_pct, margin_pct, rounding_unit, material_cost, labour_cost, total_cost, selling_price, rate_snapshot jsonb, calc_version
- **kitchen_accessories** — id, kitchen_estimation_id, name, qty, rate, amount
- **wardrobes** — id, project_id, room_id, name, width, height, depth, shutter_type (hinged/sliding/open), has_loft, loft_height, hinged_rate, sliding_rate, loft_rate, install_labour_pct, margin_pct, rounding_unit, material_cost, total_cost, selling_price
- **wardrobe_components** — id, wardrobe_id, component_name (drawer/hanging_rod/shelf/pull_out/mirror/other), qty, rate, amount
- **panel_cut_lists** — id, project_id, panel_length, panel_width, qty, board_grade, plywood_thickness, laminate_type, laminate_thickness, laminate_faces, has_edge_band, wastage_pct
- **plywood_rates** — id, organization_id, board_grade, rate_per_sheet, sheet_length, sheet_width — admin-editable reference table
- **ceiling_estimations** — id, room_id, ceiling_type (gypsum/pop/grid/pvc/wooden/other), cover_pct, design (cove/peripheral/none), cove_length, led_strip_length, downlight_qty, material_rate, labour_rate, board_dimensions, wastage_pct, lighting_rate, margin_pct, rounding_unit, material_cost, labour_cost, total_cost, selling_price
- **paint_estimations** — id, project_id, room_id nullable, net_wall_area, ceiling_area, feature_wall_area, coats, paint_coverage_per_litre, primer_coverage, putty_coverage, can_size, paint_rate, primer_rate, putty_rate, labour_rate, wallpaper_roll_length, wallpaper_roll_width, wallpaper_rate, wastage_pct, paint_brand, finish_type, material_cost, labour_cost, total_cost, selling_price
- **flooring_estimations** — id, room_id, flooring_type (vitrified/ceramic/marble/granite/wooden/vinyl/laminate/spc/no_work), tile_length, tile_width, price_per_box, pieces_per_box, wastage_pct, laying_labour_rate, adhesive_grout_rate, skirting_length, skirting_rate, material_cost, labour_cost, total_cost
- **electrical_estimations** — id, room_id, point_type (light/fan/socket_6a/socket_16a/ac/tv/data/geyser/profile_lighting/db_mcb/other), qty, all_in_rate, wiring_spec, amount
- **electrical_project_settings** — project_id (PK), db_mcb_cost, labour_share_pct

## Materials & rates

- **material_categories** — id, organization_id, name, parent_category_id nullable
- **materials** — id, organization_id, category_id, name, unit, description, is_active
- **suppliers** — id, organization_id, name, contact_phone, contact_email, address, notes
- **material_rates** — id, organization_id, material_id, supplier_id nullable, current_rate, previous_rate, revised_rate, effective_date, last_updated_at, notes
- **rate_history** — id, material_rate_id, old_rate, new_rate, changed_by, changed_at, reason

## BOQ, Quotations, Design Fees, Packages

- **boq_items** — id, project_id, room_id nullable, serial_no, work_category, item_description, specification, brand, unit, quantity, material_rate, labour_rate, total_rate, amount, is_manual, source_module nullable (kitchen/wardrobe/plywood/ceiling/paint/flooring/electrical), source_estimation_id nullable — unique constraint on (project_id, source_module, source_estimation_id) where source_module is not null, enabling idempotent sync
- **project_boq_settings** — project_id (PK), contingency_pct, gst_pct
- **quotations** — id, project_id, quotation_number (unique per org), status (draft/sent/viewed/approved/rejected/expired), quotation_date, validity_date, discount_type (percent/fixed), discount_value, gst_pct, subtotal, contingency_amount, gross_amount, discount_amount, taxable_amount, gst_amount, round_off, grand_total, version, parent_quotation_id nullable (for revisions), sent_at, approved_at
- **quotation_items** — id, quotation_id, room_label, item_description, specification, unit, quantity, rate, amount
- **quotation_snapshots** — id, quotation_id, snapshot jsonb (full BOQ + rates + percentages at send time), created_at — written once, never updated
- **quotation_payment_stages** — id, quotation_id, stage_name, stage_pct, stage_amount
- **design_fees** — id, project_id, basis (percent/per_sqft/fixed), fee_pct, fee_per_sqft, fixed_fee, included_visits, additional_visits, additional_visit_rate, gst_pct, design_fee_amount, extra_visit_amount, total_before_gst, total_with_gst
- **design_fee_stages** — id, design_fee_id, stage_name, stage_pct, stage_amount
- **project_packages** — id, project_id, tier (basic/premium/luxury), round_step, is_selected
- **package_components** — id, package_id, component (kitchen/wardrobe/ceiling/flooring/painting/electrical/lighting/other), rate_per_sqft, spec_text, brand_options

## Profitability & expenses

- **project_settings** — project_id (PK), overhead_pct, supervisor_monthly_cost, project_duration_months, target_margin_pct
- **project_expenses** — id, project_id, category (material_purchase/labour_payment/transportation/site_expense/misc), description, amount, expense_date, receipt_url nullable, recorded_by
- **project_payments** — id, project_id, direction (client_advance/client_payment/supplier_payment), amount, payment_date, method, reference_note, receipt_url nullable, recorded_by

## Inspiration library

- **moodboards** — id, project_id nullable, organization_id, name, description
- **inspiration_images** — id, moodboard_id nullable, project_id nullable, room_id nullable, category (living_room/bedroom/modular_kitchen/bathroom/dining_room/wardrobe/false_ceiling/lighting/flooring/wallpaper/office_interiors), image_url (Supabase Storage), notes, material_specification, uploaded_by

## Indexes (representative, full list in migration files)

- `organization_members(organization_id, user_id)` unique
- `projects(organization_id, status)`, `projects(client_id)`
- `boq_items(project_id, source_module, source_estimation_id)` unique partial index
- `quotations(organization_id, quotation_number)` unique
- `material_rates(organization_id, material_id)` 
- `rate_history(material_rate_id, changed_at)`

## RLS strategy

1. Every table has RLS enabled; default policy requires `organization_id` membership.
2. Financial tables (`quotations`, `project_expenses`, `project_payments`, `material_rates`) additionally require role in (`super_admin`, `studio_owner`, `manager`, `accountant`) for write access; `designer`/`viewer` get read-only or no access per the master prompt's role matrix (finalized in `ARCHITECTURE.md`).
3. `profiles` is readable by any authenticated user (for assigning designers across the UI) but only self-writable.
4. `super_admin` role bypasses organization scoping via a separate policy branch (platform-level support access), never via a client-exposed service-role key.
