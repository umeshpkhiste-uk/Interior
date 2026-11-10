-- Row Level Security for every table, implementing DATABASE_SCHEMA.md's
-- "RLS strategy" section and the role/permission matrix in ARCHITECTURE.md.
--
-- Conventions used throughout:
--   app.is_org_member(organization_id)            -- any role, or super_admin
--   app.has_org_role(organization_id, ARRAY[...])  -- role in list, or super_admin
--
-- JUDGMENT CALLS (flagged for review, not silently decided):
--   1. The permission matrix doesn't give a row for "Package Comparison" as
--      its own capability; it's treated like the other estimator modules
--      (studio_owner/manager/designer write, all members read).
--   2. Rate/material reference tables (materials, suppliers, material_rates,
--      material_categories, plywood_rates) are readable by ALL org members
--      (designers/accountants/viewers need read access to build estimates
--      and read quotes), even though the matrix's "Rate Management" row
--      only marks studio_owner/manager — that row is interpreted as
--      covering *edit* rights only, consistent with how the mapping doc's
--      decision #3 treats rates as something every estimate reads.
--   3. Non-financial estimator/BOQ/room tables are NOT further restricted
--      for the accountant role (the matrix leaves those cells blank, which
--      most plausibly means "not part of their job," not "actively
--      blocked" — unlike project_settings/project_expenses/quotations,
--      where blank cells are paired with other rows that explicitly scope
--      those tables). Double-check this interpretation before shipping
--      real customer data.
--   4. Designers can create/update quotations only while status = 'draft'
--      ("request-only" in the matrix); only studio_owner/manager can move
--      a quotation to sent/approved/etc., and only studio_owner/manager can
--      write quotation_snapshots (i.e. only they can "send").

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.organization_members enable row level security;
alter table public.organization_settings enable row level security;
alter table public.audit_logs enable row level security;
alter table public.clients enable row level security;
alter table public.projects enable row level security;
alter table public.project_rooms enable row level security;
alter table public.room_openings enable row level security;
alter table public.room_measurement_audit enable row level security;
alter table public.kitchen_estimations enable row level security;
alter table public.kitchen_accessories enable row level security;
alter table public.wardrobes enable row level security;
alter table public.wardrobe_components enable row level security;
alter table public.panel_cut_lists enable row level security;
alter table public.plywood_rates enable row level security;
alter table public.ceiling_estimations enable row level security;
alter table public.paint_estimations enable row level security;
alter table public.flooring_estimations enable row level security;
alter table public.electrical_estimations enable row level security;
alter table public.electrical_project_settings enable row level security;
alter table public.material_categories enable row level security;
alter table public.materials enable row level security;
alter table public.suppliers enable row level security;
alter table public.material_rates enable row level security;
alter table public.rate_history enable row level security;
alter table public.boq_items enable row level security;
alter table public.project_boq_settings enable row level security;
alter table public.quotations enable row level security;
alter table public.quotation_items enable row level security;
alter table public.quotation_snapshots enable row level security;
alter table public.quotation_payment_stages enable row level security;
alter table public.design_fees enable row level security;
alter table public.design_fee_stages enable row level security;
alter table public.project_packages enable row level security;
alter table public.package_components enable row level security;
alter table public.project_settings enable row level security;
alter table public.project_expenses enable row level security;
alter table public.project_payments enable row level security;
alter table public.moodboards enable row level security;
alter table public.inspiration_images enable row level security;

-- =========================================================================
-- organizations / profiles / members / settings / audit
-- =========================================================================

create policy organizations_select on public.organizations
  for select using (app.is_org_member(id));
create policy organizations_update on public.organizations
  for update using (app.has_org_role(id, array['studio_owner']::public.org_role[]))
  with check (app.has_org_role(id, array['studio_owner']::public.org_role[]));
-- organizations are created by a server action (signup flow) using the
-- user's own session before any organization_members row exists yet, so
-- insert is allowed for any authenticated user; app code immediately
-- inserts the creator as studio_owner in the same transaction.
create policy organizations_insert on public.organizations
  for insert with check (auth.uid() is not null);

create policy profiles_select on public.profiles
  for select using (auth.uid() is not null);
create policy profiles_update on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_insert on public.profiles
  for insert with check (id = auth.uid());

create policy organization_members_select on public.organization_members
  for select using (app.is_org_member(organization_id));
create policy organization_members_write on public.organization_members
  for all using (app.has_org_role(organization_id, array['studio_owner']::public.org_role[]))
  with check (app.has_org_role(organization_id, array['studio_owner']::public.org_role[]));

create policy organization_settings_select on public.organization_settings
  for select using (app.is_org_member(organization_id));
create policy organization_settings_write on public.organization_settings
  for all using (app.has_org_role(organization_id, array['studio_owner']::public.org_role[]))
  with check (app.has_org_role(organization_id, array['studio_owner']::public.org_role[]));

create policy audit_logs_select on public.audit_logs
  for select using (app.has_org_role(organization_id, array['studio_owner', 'manager']::public.org_role[]));
create policy audit_logs_insert on public.audit_logs
  for insert with check (app.is_org_member(organization_id));

-- =========================================================================
-- clients & projects
-- =========================================================================

create policy clients_select on public.clients
  for select using (app.is_org_member(organization_id));
create policy clients_write on public.clients
  for all using (app.has_org_role(organization_id, array['studio_owner', 'manager']::public.org_role[]))
  with check (app.has_org_role(organization_id, array['studio_owner', 'manager']::public.org_role[]));

create policy projects_select on public.projects
  for select using (app.is_org_member(organization_id));
create policy projects_insert on public.projects
  for insert with check (
    app.has_org_role(organization_id, array['studio_owner', 'manager']::public.org_role[])
    or (
      app.user_role(organization_id) = 'designer'
      and assigned_designer_id = auth.uid()
    )
  );
create policy projects_update on public.projects
  for update using (
    app.has_org_role(organization_id, array['studio_owner', 'manager']::public.org_role[])
    or (app.user_role(organization_id) = 'designer' and assigned_designer_id = auth.uid())
  )
  with check (
    app.has_org_role(organization_id, array['studio_owner', 'manager']::public.org_role[])
    or (app.user_role(organization_id) = 'designer' and assigned_designer_id = auth.uid())
  );
create policy projects_delete on public.projects
  for delete using (app.has_org_role(organization_id, array['studio_owner', 'manager']::public.org_role[]));

-- =========================================================================
-- rooms, estimators, BOQ: studio_owner/manager/designer write, everyone
-- in the org can read (viewers included). See judgment call #3 above.
-- =========================================================================

create policy project_rooms_select on public.project_rooms
  for select using (app.is_org_member(organization_id));
create policy project_rooms_write on public.project_rooms
  for all using (app.has_org_role(organization_id, array['studio_owner', 'manager', 'designer']::public.org_role[]))
  with check (app.has_org_role(organization_id, array['studio_owner', 'manager', 'designer']::public.org_role[]));

create policy room_openings_select on public.room_openings
  for select using (app.is_org_member(organization_id));
create policy room_openings_write on public.room_openings
  for all using (app.has_org_role(organization_id, array['studio_owner', 'manager', 'designer']::public.org_role[]))
  with check (app.has_org_role(organization_id, array['studio_owner', 'manager', 'designer']::public.org_role[]));

create policy room_measurement_audit_select on public.room_measurement_audit
  for select using (app.is_org_member(organization_id));
create policy room_measurement_audit_insert on public.room_measurement_audit
  for insert with check (app.has_org_role(organization_id, array['studio_owner', 'manager', 'designer']::public.org_role[]));

create policy kitchen_estimations_select on public.kitchen_estimations
  for select using (app.is_org_member(organization_id));
create policy kitchen_estimations_write on public.kitchen_estimations
  for all using (app.has_org_role(organization_id, array['studio_owner', 'manager', 'designer']::public.org_role[]))
  with check (app.has_org_role(organization_id, array['studio_owner', 'manager', 'designer']::public.org_role[]));

create policy kitchen_accessories_select on public.kitchen_accessories
  for select using (app.is_org_member(organization_id));
create policy kitchen_accessories_write on public.kitchen_accessories
  for all using (app.has_org_role(organization_id, array['studio_owner', 'manager', 'designer']::public.org_role[]))
  with check (app.has_org_role(organization_id, array['studio_owner', 'manager', 'designer']::public.org_role[]));

create policy wardrobes_select on public.wardrobes
  for select using (app.is_org_member(organization_id));
create policy wardrobes_write on public.wardrobes
  for all using (app.has_org_role(organization_id, array['studio_owner', 'manager', 'designer']::public.org_role[]))
  with check (app.has_org_role(organization_id, array['studio_owner', 'manager', 'designer']::public.org_role[]));

create policy wardrobe_components_select on public.wardrobe_components
  for select using (app.is_org_member(organization_id));
create policy wardrobe_components_write on public.wardrobe_components
  for all using (app.has_org_role(organization_id, array['studio_owner', 'manager', 'designer']::public.org_role[]))
  with check (app.has_org_role(organization_id, array['studio_owner', 'manager', 'designer']::public.org_role[]));

create policy panel_cut_lists_select on public.panel_cut_lists
  for select using (app.is_org_member(organization_id));
create policy panel_cut_lists_write on public.panel_cut_lists
  for all using (app.has_org_role(organization_id, array['studio_owner', 'manager', 'designer']::public.org_role[]))
  with check (app.has_org_role(organization_id, array['studio_owner', 'manager', 'designer']::public.org_role[]));

create policy ceiling_estimations_select on public.ceiling_estimations
  for select using (app.is_org_member(organization_id));
create policy ceiling_estimations_write on public.ceiling_estimations
  for all using (app.has_org_role(organization_id, array['studio_owner', 'manager', 'designer']::public.org_role[]))
  with check (app.has_org_role(organization_id, array['studio_owner', 'manager', 'designer']::public.org_role[]));

create policy paint_estimations_select on public.paint_estimations
  for select using (app.is_org_member(organization_id));
create policy paint_estimations_write on public.paint_estimations
  for all using (app.has_org_role(organization_id, array['studio_owner', 'manager', 'designer']::public.org_role[]))
  with check (app.has_org_role(organization_id, array['studio_owner', 'manager', 'designer']::public.org_role[]));

create policy flooring_estimations_select on public.flooring_estimations
  for select using (app.is_org_member(organization_id));
create policy flooring_estimations_write on public.flooring_estimations
  for all using (app.has_org_role(organization_id, array['studio_owner', 'manager', 'designer']::public.org_role[]))
  with check (app.has_org_role(organization_id, array['studio_owner', 'manager', 'designer']::public.org_role[]));

create policy electrical_estimations_select on public.electrical_estimations
  for select using (app.is_org_member(organization_id));
create policy electrical_estimations_write on public.electrical_estimations
  for all using (app.has_org_role(organization_id, array['studio_owner', 'manager', 'designer']::public.org_role[]))
  with check (app.has_org_role(organization_id, array['studio_owner', 'manager', 'designer']::public.org_role[]));

create policy electrical_project_settings_select on public.electrical_project_settings
  for select using (app.is_org_member(organization_id));
create policy electrical_project_settings_write on public.electrical_project_settings
  for all using (app.has_org_role(organization_id, array['studio_owner', 'manager', 'designer']::public.org_role[]))
  with check (app.has_org_role(organization_id, array['studio_owner', 'manager', 'designer']::public.org_role[]));

create policy boq_items_select on public.boq_items
  for select using (app.is_org_member(organization_id));
create policy boq_items_write on public.boq_items
  for all using (app.has_org_role(organization_id, array['studio_owner', 'manager', 'designer']::public.org_role[]))
  with check (app.has_org_role(organization_id, array['studio_owner', 'manager', 'designer']::public.org_role[]));

create policy project_boq_settings_select on public.project_boq_settings
  for select using (app.is_org_member(organization_id));
create policy project_boq_settings_write on public.project_boq_settings
  for all using (app.has_org_role(organization_id, array['studio_owner', 'manager', 'designer']::public.org_role[]))
  with check (app.has_org_role(organization_id, array['studio_owner', 'manager', 'designer']::public.org_role[]));

-- =========================================================================
-- materials & rates: read for all org members, write for owner/manager
-- only (see judgment call #2 above)
-- =========================================================================

create policy material_categories_select on public.material_categories
  for select using (app.is_org_member(organization_id));
create policy material_categories_write on public.material_categories
  for all using (app.has_org_role(organization_id, array['studio_owner', 'manager']::public.org_role[]))
  with check (app.has_org_role(organization_id, array['studio_owner', 'manager']::public.org_role[]));

create policy materials_select on public.materials
  for select using (app.is_org_member(organization_id));
create policy materials_write on public.materials
  for all using (app.has_org_role(organization_id, array['studio_owner', 'manager']::public.org_role[]))
  with check (app.has_org_role(organization_id, array['studio_owner', 'manager']::public.org_role[]));

create policy suppliers_select on public.suppliers
  for select using (app.is_org_member(organization_id));
create policy suppliers_write on public.suppliers
  for all using (app.has_org_role(organization_id, array['studio_owner', 'manager']::public.org_role[]))
  with check (app.has_org_role(organization_id, array['studio_owner', 'manager']::public.org_role[]));

create policy material_rates_select on public.material_rates
  for select using (app.is_org_member(organization_id));
create policy material_rates_write on public.material_rates
  for all using (app.has_org_role(organization_id, array['studio_owner', 'manager']::public.org_role[]))
  with check (app.has_org_role(organization_id, array['studio_owner', 'manager']::public.org_role[]));

create policy plywood_rates_select on public.plywood_rates
  for select using (app.is_org_member(organization_id));
create policy plywood_rates_write on public.plywood_rates
  for all using (app.has_org_role(organization_id, array['studio_owner', 'manager']::public.org_role[]))
  with check (app.has_org_role(organization_id, array['studio_owner', 'manager']::public.org_role[]));

create policy rate_history_select on public.rate_history
  for select using (app.is_org_member(organization_id));
create policy rate_history_insert on public.rate_history
  for insert with check (app.has_org_role(organization_id, array['studio_owner', 'manager']::public.org_role[]));
-- no update/delete policy: rate_history is append-only by convention.

-- =========================================================================
-- quotations: read = studio_owner/manager/designer/viewer (accountant
-- excluded — matrix leaves "Create/send quotations" blank for accountant).
-- Designers may only touch rows/children while status = 'draft'.
-- =========================================================================

create policy quotations_select on public.quotations
  for select using (
    app.has_org_role(organization_id, array['studio_owner', 'manager', 'designer', 'viewer']::public.org_role[])
  );
create policy quotations_insert on public.quotations
  for insert with check (
    app.has_org_role(organization_id, array['studio_owner', 'manager']::public.org_role[])
    or (app.user_role(organization_id) = 'designer' and status = 'draft')
  );
create policy quotations_update on public.quotations
  for update using (
    app.has_org_role(organization_id, array['studio_owner', 'manager']::public.org_role[])
    or (app.user_role(organization_id) = 'designer' and status = 'draft')
  )
  with check (
    app.has_org_role(organization_id, array['studio_owner', 'manager']::public.org_role[])
    or (app.user_role(organization_id) = 'designer' and status = 'draft')
  );
create policy quotations_delete on public.quotations
  for delete using (
    app.has_org_role(organization_id, array['studio_owner', 'manager']::public.org_role[])
    or (app.user_role(organization_id) = 'designer' and status = 'draft')
  );

create policy quotation_items_select on public.quotation_items
  for select using (
    app.has_org_role(organization_id, array['studio_owner', 'manager', 'designer', 'viewer']::public.org_role[])
  );
create policy quotation_items_write on public.quotation_items
  for all using (
    app.has_org_role(organization_id, array['studio_owner', 'manager']::public.org_role[])
    or (
      app.user_role(organization_id) = 'designer'
      and exists (
        select 1 from public.quotations q
        where q.id = quotation_items.quotation_id and q.status = 'draft'
      )
    )
  )
  with check (
    app.has_org_role(organization_id, array['studio_owner', 'manager']::public.org_role[])
    or (
      app.user_role(organization_id) = 'designer'
      and exists (
        select 1 from public.quotations q
        where q.id = quotation_items.quotation_id and q.status = 'draft'
      )
    )
  );

-- Only studio_owner/manager may "send" a quotation, i.e. write its
-- snapshot. No update/delete policy exists at all for this table — see
-- trg_quotation_snapshots_immutable for the defense-in-depth backstop.
create policy quotation_snapshots_select on public.quotation_snapshots
  for select using (
    app.has_org_role(organization_id, array['studio_owner', 'manager', 'designer', 'viewer']::public.org_role[])
  );
create policy quotation_snapshots_insert on public.quotation_snapshots
  for insert with check (app.has_org_role(organization_id, array['studio_owner', 'manager']::public.org_role[]));

create policy quotation_payment_stages_select on public.quotation_payment_stages
  for select using (
    app.has_org_role(organization_id, array['studio_owner', 'manager', 'designer', 'viewer']::public.org_role[])
  );
create policy quotation_payment_stages_write on public.quotation_payment_stages
  for all using (app.has_org_role(organization_id, array['studio_owner', 'manager']::public.org_role[]))
  with check (app.has_org_role(organization_id, array['studio_owner', 'manager']::public.org_role[]));

-- =========================================================================
-- design fees & packages: treated like the other estimator modules.
-- =========================================================================

create policy design_fees_select on public.design_fees
  for select using (app.is_org_member(organization_id));
create policy design_fees_write on public.design_fees
  for all using (app.has_org_role(organization_id, array['studio_owner', 'manager', 'designer']::public.org_role[]))
  with check (app.has_org_role(organization_id, array['studio_owner', 'manager', 'designer']::public.org_role[]));

create policy design_fee_stages_select on public.design_fee_stages
  for select using (app.is_org_member(organization_id));
create policy design_fee_stages_write on public.design_fee_stages
  for all using (app.has_org_role(organization_id, array['studio_owner', 'manager', 'designer']::public.org_role[]))
  with check (app.has_org_role(organization_id, array['studio_owner', 'manager', 'designer']::public.org_role[]));

create policy project_packages_select on public.project_packages
  for select using (app.is_org_member(organization_id));
create policy project_packages_write on public.project_packages
  for all using (app.has_org_role(organization_id, array['studio_owner', 'manager', 'designer']::public.org_role[]))
  with check (app.has_org_role(organization_id, array['studio_owner', 'manager', 'designer']::public.org_role[]));

create policy package_components_select on public.package_components
  for select using (app.is_org_member(organization_id));
create policy package_components_write on public.package_components
  for all using (app.has_org_role(organization_id, array['studio_owner', 'manager', 'designer']::public.org_role[]))
  with check (app.has_org_role(organization_id, array['studio_owner', 'manager', 'designer']::public.org_role[]));

-- =========================================================================
-- profitability & expenses: designer has NO access at all. project_settings
-- additionally excludes viewer (matrix: "View profitability/margins" is
-- blank for both designer and viewer).
-- =========================================================================

create policy project_settings_select on public.project_settings
  for select using (
    app.has_org_role(organization_id, array['studio_owner', 'manager', 'accountant']::public.org_role[])
  );
create policy project_settings_write on public.project_settings
  for all using (app.has_org_role(organization_id, array['studio_owner', 'manager']::public.org_role[]))
  with check (app.has_org_role(organization_id, array['studio_owner', 'manager']::public.org_role[]));

create policy project_expenses_select on public.project_expenses
  for select using (
    app.has_org_role(organization_id, array['studio_owner', 'manager', 'accountant', 'viewer']::public.org_role[])
  );
create policy project_expenses_write on public.project_expenses
  for all using (app.has_org_role(organization_id, array['studio_owner', 'manager', 'accountant']::public.org_role[]))
  with check (app.has_org_role(organization_id, array['studio_owner', 'manager', 'accountant']::public.org_role[]));

create policy project_payments_select on public.project_payments
  for select using (
    app.has_org_role(organization_id, array['studio_owner', 'manager', 'accountant', 'viewer']::public.org_role[])
  );
create policy project_payments_write on public.project_payments
  for all using (app.has_org_role(organization_id, array['studio_owner', 'manager', 'accountant']::public.org_role[]))
  with check (app.has_org_role(organization_id, array['studio_owner', 'manager', 'accountant']::public.org_role[]));

-- =========================================================================
-- inspiration library: accountant excluded (matrix leaves that row blank
-- for accountant); everyone else per the matrix.
-- =========================================================================

create policy moodboards_select on public.moodboards
  for select using (
    app.has_org_role(organization_id, array['studio_owner', 'manager', 'designer', 'viewer']::public.org_role[])
  );
create policy moodboards_write on public.moodboards
  for all using (app.has_org_role(organization_id, array['studio_owner', 'manager', 'designer']::public.org_role[]))
  with check (app.has_org_role(organization_id, array['studio_owner', 'manager', 'designer']::public.org_role[]));

create policy inspiration_images_select on public.inspiration_images
  for select using (
    app.has_org_role(organization_id, array['studio_owner', 'manager', 'designer', 'viewer']::public.org_role[])
  );
create policy inspiration_images_write on public.inspiration_images
  for all using (app.has_org_role(organization_id, array['studio_owner', 'manager', 'designer']::public.org_role[]))
  with check (app.has_org_role(organization_id, array['studio_owner', 'manager', 'designer']::public.org_role[]));
