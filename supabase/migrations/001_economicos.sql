create table if not exists public.economicos (
  id text primary key,
  economico text not null unique,
  marca text not null,
  modelo text not null,
  serie text not null,
  categoria text not null check (categoria in ('1', '2', '3')),
  folio text not null,
  monto numeric(14, 2),
  area text not null,
  fecha date not null,
  estado text not null check (estado in ('operativo', 'mantenimiento')),
  observaciones text not null default '',
  photos jsonb not null default '[]'::jsonb,
  actualizado_en timestamptz not null default now()
);

alter table public.economicos enable row level security;

-- La función de Netlify usa la Service Role Key, que no está expuesta al navegador
-- y puede operar aunque RLS esté activado. No se crean políticas públicas.
