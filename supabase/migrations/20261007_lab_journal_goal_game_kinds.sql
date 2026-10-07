-- Targets + Game Journal: ll_journal gains two new kinds ('goal', 'game').
-- Applied to the live project 2026-10-07 as migration lab_journal_goal_game_kinds.
alter table public.ll_journal drop constraint ll_journal_kind_check;
alter table public.ll_journal add constraint ll_journal_kind_check
  check (kind = any (array['mind'::text,'fuel'::text,'diary'::text,'goal'::text,'game'::text]));
