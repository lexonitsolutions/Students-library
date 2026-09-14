-- Migration: Add course and preferred_subjects columns to profiles
alter table public.profiles
  add column if not exists course text,
  add column if not exists preferred_subjects text[];
