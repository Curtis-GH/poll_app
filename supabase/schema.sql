-- Poll-App Datenbankschema
-- Im Supabase SQL-Editor ausfuehren (Project -> SQL Editor -> New Query)
-- Ersetzt das bisherige Schema: Umfragen koennen jetzt mehrere Fragen haben.

drop table if exists votes;
drop table if exists survey_options;
drop table if exists survey_questions;
drop table if exists surveys;

create table surveys (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  title text not null,
  description text,
  deadline timestamptz not null,
  created_at timestamptz not null default now()
);

create table survey_questions (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references surveys (id) on delete cascade,
  question_text text not null,
  allow_multiple_answers boolean not null default false,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create table survey_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references survey_questions (id) on delete cascade,
  label text not null,
  created_at timestamptz not null default now()
);

create table votes (
  id uuid primary key default gen_random_uuid(),
  option_id uuid not null references survey_options (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index votes_option_id_idx on votes (option_id);
create index survey_options_question_id_idx on survey_options (question_id);
create index survey_questions_survey_id_idx on survey_questions (survey_id);
create index surveys_deadline_idx on surveys (deadline);

-- Row Level Security: alle Tabellen sind oeffentlich lesbar, da die App ohne Login auskommt.
alter table surveys enable row level security;
alter table survey_questions enable row level security;
alter table survey_options enable row level security;
alter table votes enable row level security;

create policy "Public can read surveys"
  on surveys for select
  using (true);

create policy "Public can create surveys"
  on surveys for insert
  with check (true);

create policy "Public can read survey questions"
  on survey_questions for select
  using (true);

create policy "Public can create survey questions"
  on survey_questions for insert
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
