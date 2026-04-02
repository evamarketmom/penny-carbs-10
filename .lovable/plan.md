
Root cause confirmed from code + live data:

1) Home sections are rendered unconditionally in `src/pages/Index.tsx` (`PopularItems` for indoor events/cloud kitchen always mounted), so disabling modules does not hide those blocks.
2) `PopularItems` and `FeaturedItems` fetch from `food_items` using `service_type OR service_types` and then cloud filtering allows null slot IDs (`return !slotId || activeSlotIds.has(slotId)`), so cloud kitchen cards still appear for unassigned items.
3) In DB, `service_modules` already has `cloud_kitchen=false` and `indoor_events=false`, but UI still displays their item blocks because those checks are not applied to all customer sections.
4) There is no separate indoor-events “division table” in schema; indoor events visibility is controlled at module level (`service_modules`) and item/category active flags.

Implementation plan:

1) Enforce module-level visibility everywhere on customer home
- Update `src/pages/Index.tsx` to read `useActiveServiceTypes()`.
- Render `PopularItems` sections only if their `serviceType` is active.
- Gate `FeaturedItems` so it only shows items from active service modules.

2) Tighten PopularItems filtering (cloud + indoor)
- Update `src/components/customer/PopularItems.tsx`:
  - Add module-active guard: return nothing when `serviceType` is inactive.
  - For cloud kitchen: require `cloud_kitchen_slot_id` to be non-null AND in active slot IDs.
  - Keep homemade active-cook filtering as-is.
  - Wait for dependency readiness (active service types, active slots for cloud, allocated cook IDs for homemade) before finalizing list to prevent incorrect first render.

3) Tighten FeaturedItems filtering
- Update `src/components/customer/FeaturedItems.tsx`:
  - Filter featured list by active service modules.
  - Exclude cloud kitchen featured items unless `cloud_kitchen_slot_id` exists and slot is active.
  - Keep homemade “allocated cook only” filtering.
  - Prevent fallback behavior that shows disabled-module items during loading gaps.

4) Add route-level protection for disabled modules (prevents direct URL access)
- Add lightweight guard logic (shared helper/hook) and apply to:
  - `/cloud-kitchen` (`CloudKitchenOrder`)
  - `/indoor-events`, `/indoor-events/quick-booking`, `/indoor-events/planner`
  - `/menu/:serviceType` when requested module is inactive
- Behavior: redirect to `/` and show a toast like “This service is currently unavailable.”

5) Verification pass (manual, end-to-end)
- Disable Indoor Events + Cloud Kitchen in admin and verify:
  - Home shows no indoor/cloud “Popular” sections.
  - Featured section does not include indoor/cloud items.
  - Direct `/cloud-kitchen` or `/indoor-events` URL is blocked/redirected.
- Re-enable Cloud Kitchen and deactivate one slot:
  - Only items assigned to active slots are visible.
  - Items with `cloud_kitchen_slot_id = null` do not appear in cloud customer lists.
- Confirm homemade flow remains unchanged.

Technical notes:
- This plan intentionally fixes with UI + query filtering in existing React hooks/components.
- If you want stricter backend enforcement later, we can move cloud filtering to SQL joins (`cloud_kitchen_slots!inner(...).eq('cloud_kitchen_slots.is_active', true)`) so inactive-slot items never return to client at all.
