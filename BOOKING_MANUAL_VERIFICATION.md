# Photographer booking manual verification

The repository has no test script or booking integration-test setup. Use this checklist with a connected PostgreSQL database and separate verified test accounts. Do not run the concurrent booking check against real customer slots.

## Apply the additive schema migration first

Apply `migrations/0017_client_booking_preferences_and_notification_links.sql` to the application database before deploying this version. It adds client booking preferences and notification destination links to the existing tables. The migration is additive and safe to re-run. This checkout has no general migration command, and the configured PostgreSQL host was unreachable from the verification environment, so the migration has not been applied here.

## 1. Confirm identity mapping and discovery

1. Sign in as a photographer and open `/api/photographers/me`. Record the profile `id` and `user_id`.
2. Open `/photographers`, select that photographer, and inspect `GET /api/photographers/{profile-id}`. The returned `id` should equal the profile ID and `user_id` should equal the authenticated user ID.
3. Confirm the profile's booking link opens `/book/{profile-id}` and the booking page loads that same photographer.
4. Confirm requests to `/api/availability` use `photographerId={user_id}`. Availability and booking rows are keyed by the photographer's user ID in the current repository queries.

## 2. Confirm availability persistence and visibility

1. As that photographer, add a future date and a valid start/end time on `/photographer/availability`. Include one date more than 90 days ahead.
2. Confirm the response is `201` and `data.id` plus `data.photographer_id` are present; `photographer_id` must match the profile `user_id`.
3. Reload the availability dashboard. Confirm the slot remains present.
4. Open the public profile and the booking page. Confirm the slot appears in upcoming availability and can be selected, including the date more than 90 days ahead. On the booking page, advance the calendar to that month.
5. Mark an unbooked slot unavailable, reload, and confirm it no longer appears as bookable. Restore it and confirm it appears again.
6. Inspect PostgreSQL using the deployed schema: verify the slot row in `photographer_availability` and compare its ID, photographer ID, date, times, and `is_available` value with the API response.

## 3. Confirm client booking and overlap protection

1. Sign in as a client, select the slot, complete all required booking fields including the message, and submit.
2. Confirm the page redirects only after a `201` response containing a server-generated booking number.
3. Confirm the booking appears in `/account/bookings` with `PENDING` status and the correct photographer summary.
4. Inspect PostgreSQL: verify one `bookings` row with the authenticated client user ID, photographer user ID, selected schedule, and `PENDING` status. Confirm a photographer notification row was created.
5. Confirm the photographer receives a booking request email at the account email address. Verify it includes the request details and a link to `/photographer/bookings/{booking-id}`.
6. In two separate client sessions, submit requests for the same photographer/date and overlapping time at nearly the same time. Expect exactly one `201`; the other request should receive `409`. Inspect PostgreSQL and confirm only one active overlapping booking exists.
7. Try an unauthenticated request, a photographer account, an unknown photographer, a past date, an unavailable time, a reversed time range, a negative budget, malformed JSON, and an invalid UUID. Expect rejection with an appropriate `4xx` response and no booking row.

## 4. Confirm photographer and client actions

1. As the booked photographer, open `/photographer/bookings`; confirm the request and client profile summary are visible.
2. Accept the booking. Confirm the persisted status is `ACCEPTED`, the photographer list reflects it, and the client receives a notification.
3. As the client, open the booking detail, confirm the accepted request, and verify the persisted status becomes `CONFIRMED`.
4. Cancel an eligible booking as its owner and verify `CANCELLED` in the API, dashboard, database, and notification list.
5. Create another pending request and reject it as the assigned photographer. Confirm `REJECTED` and the client's notification.
6. Attempt accept/reject as a different photographer and view/cancel as another client. Expect `403` or the privacy-preserving `404`, with no status or notification change.
7. Try an invalid transition (for example `REJECTED` to `CONFIRMED`). Expect `409` and no database change.
8. After cancelling or rejecting a request, confirm that the same available time can be requested again.

## 5. Record results

Record each result as passed, failed, or blocked. Include the HTTP status and response code, relevant row IDs/statuses, and notification and email results. A successful build or type check does not replace these database-backed checks.

## 6. Confirm client profile, dashboard, notification, and conversation flows

1. As a client, save personal details, organization/billing details, preferred services, contact method, and booking notes in `/account/profile`. Reload and confirm the saved values and completion indicator. Confirm the account email is read-only and avatar upload updates the profile image.
2. Open `/account` and confirm summary counts, upcoming sessions, recent booking/notification activity, and recommended photographers load from the signed-in client's data. Check the mobile navigation and quick actions.
3. Open a booking draft, enter session details and a required booking message, select a future available slot, then refresh. Confirm the draft is restored for that same signed-in client and photographer. Sign out or change client accounts and confirm the previous client's draft is not shown.
4. Create a booking request and confirm the photographer's notification links to the request. Confirm it appears in the photographer's booking inbox, and the client appears with profile details. Accept or reject it and confirm the client is notified with a link to the booking.
5. Open the booking conversation as either participant. Send a message and confirm only the other participant receives a notification. Confirm the conversation refreshes within 15 seconds, pauses while the page is hidden, and resumes when visible. Reload and confirm the messages persist.
6. Open the notification center as both roles. Confirm unread counts appear in desktop and mobile navigation, clicking a notification opens its booking/conversation, and mark-all-read clears the count.

## Verification run (2026-11-29)

- Passed: `npx tsc --noEmit`, `npm run build`, and targeted ESLint on the changed application files (0 errors; image and unused-import warnings remain).
- Failed: full `npm run lint` reports 7 errors in pre-existing admin pages and shared UI files (`app/admin/(protected)/events/page.client.tsx`, `app/admin/(protected)/exhibitions/page.client.tsx`, `components/admin/cover-image-field.tsx`, `components/admin/homepage-featured-photos-editor.tsx`, and `components/ui/empty-state.tsx`).
- Passed: local unauthenticated `GET /api/bookings` smoke check returned HTTP `401`.
- Blocked: a read-only PostgreSQL connectivity check was denied with `EACCES` in this environment, so the migration could not be applied and no real booking/status workflow could be created or verified.
- Blocked: SMTP verification could not resolve the provider (`EDNS`), so delivery could not be confirmed and no test email was sent.
