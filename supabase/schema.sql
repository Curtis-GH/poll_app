-- Poll-App Datenbankschema
-- Im Supabase SQL-Editor ausfuehren (Project -> SQL Editor -> New Query)

create table surveys (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  title text not null,
  description text,
  deadline timestamptz not null,
  created_at timestamptz not null default now()
);

create table survey_options (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references surveys (id) on delete cascade,
  label text not null,
  created_at timestamptz not null default now()
);

create table votes (
  id uuid primary key default gen_random_uuid(),
  option_id uuid not null references survey_options (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index votes_option_id_idx on votes (option_id);
create index survey_options_survey_id_idx on survey_options (survey_id);
create index surveys_deadline_idx on surveys (deadline);

-- Row Level Security: alle Tabellen sind oeffentlich lesbar, da die App ohne Login auskommt.
alter table surveys enable row level security;
alter table survey_options enable row level security;
alter table votes enable row level security;

create policy "Public can read surveys"
  on surveys for select
  using (true);

create policy "Public can create surveys"
  on surveys for insert
  with check (true);

create policy "Public can read survey options"
  on survey_options for select
  using (true);

create policy "Public can create survey options"
  on survey_options for insert
  with check (true);

create policy "Public can read votes"
  on votes for select
  using (true);

create policy "Public can cast votes"
  on votes for insert
  with check (true);
