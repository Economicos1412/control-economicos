alter table public.economicos
  add column if not exists historial_cambios jsonb not null default '[]'::jsonb;

comment on column public.economicos.historial_cambios is
  'Bitácora de movimientos por económico: fecha, título y detalle.';
