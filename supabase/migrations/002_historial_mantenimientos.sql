alter table public.economicos
  add column if not exists mantenimientos jsonb not null default '[]'::jsonb;

comment on column public.economicos.mantenimientos is
  'Historial de intervenciones: fecha, tipo, responsable, descripción y resultado.';
