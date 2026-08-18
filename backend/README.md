# Lexon Backend (Supabase)

Lexon's frontend is a Vite + React SPA with no server of its own. Supabase is
the entire backend: Postgres database, Auth, and file Storage, accessed
directly from the browser via `src/lib/supabaseClient.ts` and the service
layer in `src/services/`. This folder holds the SQL that defines that backend.

## Architecture

```
Lexon Web (Vite SPA)
   |
   v
Supabase
 ├─ Auth            email/password, Google OAuth, email OTP
 ├─ Postgres        profiles, materials, bookmarks, downloads, reports, notifications
 └─ Storage         "materials" bucket (PDFs), "avatars" bucket (profile pictures)
```

Files are never stored in the database. A client uploads a PDF to the
`materials` storage bucket, gets back a public URL, then inserts a row into
`public.materials` with that URL plus the title/subject/etc. Admins flip
`status` from `pending` to `approved` before the material becomes visible to
everyone else.

## Applying the migrations

This session has no database credentials for your Supabase project, so these
migrations need to be applied by you, once, via either method below.

**Option A — SQL Editor (fastest, no install needed)**
In the Supabase dashboard, open SQL Editor and run each file in
`supabase/migrations/` **in filename order** (they're numbered/timestamped
and depend on each other — profiles before materials, materials before
bookmarks, etc).

**Option B — Supabase CLI**
```bash
npx supabase login
npx supabase link --project-ref qrznzjxqsklyzutvumtq
npx supabase db push
```
This pushes every file in `supabase/migrations/` in order.

## What's in each migration

| File | Creates |
|---|---|
| `..._profiles.sql` | `profiles` table (mirrors `auth.users`), `is_admin()` helper, auto-create-profile trigger on signup, role-escalation guard, `public_profiles` view |
| `..._materials.sql` | `materials` table, RLS (approved rows public, owners/admins see their own), status-change guard (only admins can approve/reject) |
| `..._bookmarks.sql` | `bookmarks` table + trigger keeping `materials.saves_count` in sync |
| `..._downloads.sql` | `downloads` table (history) + trigger keeping `materials.downloads_count` in sync |
| `..._reports.sql` | `reports` table for flagged content |
| `..._notifications.sql` | `notifications` table + trigger that notifies an uploader when their material is approved/rejected |
| `..._rpc_and_stats.sql` | `increment_material_views()` RPC, `profile_stats` view (uploads/downloads/saved counts per user) |
| `..._storage.sql` | `materials` and `avatars` storage buckets + per-user folder policies |
| `..._admin_workspace.sql` | `admin_allowlist` table, `check_account_status()` RPC, role-sync triggers, seeds the root admin email |
| `..._fix_admin_role_guard.sql` | Fixes `protect_profile_role` so it only blocks role changes from an authenticated non-admin user (not migrations/SQL Editor), and re-promotes `hr@lexonit.com` if it got silently reverted by the bug |

## Admin workspace

There is no separate login system for admins — an admin is just a normal
Supabase Auth account (same `profiles` table, same `role` column) whose email
is listed in `public.admin_allowlist`. This keeps one email tied to exactly
one account, which is a hard constraint of Supabase Auth (it won't let the
same email register twice), while still letting that single account use
either the admin workspace or the regular student experience — the frontend
just asks which one to land in after sign-in (see `WorkspaceChoicePage` and
`useWorkspace`).

- `..._admin_workspace.sql` seeds `hr@lexonit.com` into `admin_allowlist` as
  the root admin (protected from removal by a trigger). **This only
  authorizes the email — it does not create the Supabase Auth user**, since
  auth users can't be created directly via SQL migration. To activate it,
  open the app's sign-in page, enter `hr@lexonit.com`, and follow the "Set
  your admin password" flow using `SandyMahi@2026`. Once that's done it's a
  real account and signs in normally from then on.
- Any existing admin can authorize more emails from **Admin Workspace →
  Manage Admins** (`/admin/admins`), which just inserts into
  `admin_allowlist`. A `sync_profile_role_from_allowlist()` trigger promotes
  the matching profile to `admin` immediately if the account already exists,
  or the new admin gets promoted automatically by `handle_new_user()` the
  moment they sign up.
- `check_account_status(email)` is a `SECURITY DEFINER` RPC (granted to
  `anon`) the sign-in page calls before authenticating, so it can decide
  whether to show a normal password field or the "set your admin password"
  form — without ever exposing `auth.users` or password hashes to the
  client.

## Environment variables

The frontend reads these from `.env.local` (already created, gitignored):

```
VITE_SUPABASE_URL=https://qrznzjxqsklyzutvumtq.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Note: Vite only exposes env vars prefixed with `VITE_` to client code — the
`NEXT_PUBLIC_` prefix is a Next.js convention and does nothing here.

## Auth methods to enable in the dashboard

The frontend calls email/password, Google OAuth, and email OTP. Enable each
under **Authentication → Providers** in the Supabase dashboard:
- Email (with "Confirm email" as you prefer)
- Google (needs a Google OAuth client ID/secret)

## Known gap: full account deletion

`deleteAccount()` in the frontend deletes the user's own data (materials,
bookmarks, notifications all cascade off `profiles.id`) and signs them out,
but it cannot delete the underlying `auth.users` row from the browser —
that requires the `service_role` key, which must never ship to a client
bundle. Do that with a Supabase Edge Function (using
`supabase.auth.admin.deleteUser`) invoked by the client, or handle it
manually from the dashboard for now.

## Skills CLI

You mentioned `npx skills add supabase/agent-skills` — that downloads and
runs a third-party package, so run it yourself once you've reviewed it
rather than have it executed on your behalf.
