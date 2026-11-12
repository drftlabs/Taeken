-- Taeken migration 6: WhatsApp OTP for pure-COD orders. Safe to run more than once.
create table if not exists public.otp_codes (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  ip text,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts int not null default 0,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists otp_codes_phone_idx on public.otp_codes (phone, created_at desc);
alter table public.otp_codes enable row level security;   -- no policies: only the server (service role) can touch it
alter table public.orders add column if not exists phone_verified boolean not null default false;
