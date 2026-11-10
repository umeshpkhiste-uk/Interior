-- Additional organization_id indexes. Every RLS policy filters on
-- organization_id, so every table benefits from an index on it even where
-- a more specific composite index already exists on a parent FK.

create index idx_kitchen_estimations_org on public.kitchen_estimations(organization_id);
create index idx_kitchen_accessories_org on public.kitchen_accessories(organization_id);
create index idx_wardrobes_org on public.wardrobes(organization_id);
create index idx_wardrobe_components_org on public.wardrobe_components(organization_id);
create index idx_panel_cut_lists_org on public.panel_cut_lists(organization_id);
create index idx_ceiling_estimations_org on public.ceiling_estimations(organization_id);
create index idx_paint_estimations_org on public.paint_estimations(organization_id);
create index idx_flooring_estimations_org on public.flooring_estimations(organization_id);
create index idx_electrical_estimations_org on public.electrical_estimations(organization_id);
create index idx_electrical_project_settings_org on public.electrical_project_settings(organization_id);
create index idx_boq_items_org on public.boq_items(organization_id);
create index idx_project_boq_settings_org on public.project_boq_settings(organization_id);
create index idx_quotations_org on public.quotations(organization_id);
create index idx_quotation_items_org on public.quotation_items(organization_id);
create index idx_quotation_snapshots_org on public.quotation_snapshots(organization_id);
create index idx_quotation_payment_stages_org on public.quotation_payment_stages(organization_id);
create index idx_design_fees_org on public.design_fees(organization_id);
create index idx_design_fee_stages_org on public.design_fee_stages(organization_id);
create index idx_project_packages_org on public.project_packages(organization_id);
create index idx_package_components_org on public.package_components(organization_id);
create index idx_project_settings_org on public.project_settings(organization_id);
create index idx_project_expenses_org on public.project_expenses(organization_id);
create index idx_project_payments_org on public.project_payments(organization_id);
create index idx_inspiration_images_org on public.inspiration_images(organization_id);
create index idx_rate_history_org on public.rate_history(organization_id);
create index idx_room_measurement_audit_org on public.room_measurement_audit(organization_id);
