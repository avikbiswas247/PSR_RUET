# Photographer booking manual verification

The repository has no test script or booking integration-test setup. Use this checklist with a connected PostgreSQL database and separate verified test accounts. Do not run the concurrent booking check against real customer slots.

## 1. Confirm identity mapping and discovery

1. Sign in as a photographer and open `/api/photographers/me`. Record the profile `id` and `user_id`.
2. Open `/photographers`, select that photographer, and inspect `GET /api/photographers/{profile-id}`. The returned `id` should equal the profile ID and `user_id` should equal the authenticated user ID.
3. Confirm the profile's booking link opens `/book/{profile-id}` and the booking page loads that same photographer.
4. Confirm requests to `/api/availability` use `photographerId={user_id}`. Availability and booking rows are keyed by the photographer's user ID in the current repository queries.

## 2. Confirm availability persistence and visibility

1. As that photographer, add a future date and a valid start/end time on `/photographer/availability`.
2. Confirm the response is `201` and `data.id` plus `data.photographer_id` are present; `photographer_id` must match the profile `user_id`.
3. Reload the availability dashboard. Confirm the slot remains present.
4. Open the public profile and the booking page. Confirm the slot appears in upcoming availability and can be selected.
5. Mark an unbooked slot unavailable, reload, and confirm it no longer appears as bookable. Restore it and confirm it appears again.
6. Inspect PostgreSQL using the deployed schema: verify the slot row in `photographer_availability` and compare its ID, photographer ID, date, times, and `is_available` value with the API response.

## 3. Confirm client booking and overlap protection

1. Sign in as a client, select the slot, complete all required booking fields including the message, and submit.
2. Confirm the page redirects only after a `201` response containing a server-generated booking number.
3. Confirm the booking appears in `/account/bookings` with `PENDING` status and the correct photographer summary.
4. Inspect PostgreSQL: verify one `bookings` row with the authenticated client user ID, photographer user ID, selected schedule, and `PENDING` status. Confirm a photographer notification row was created.
5. In two separate client sessions, submit requests for the same photographer/date and overlapping time at nearly the same time. Expect exactly one `201`; the other request should receive `409`. Inspect PostgreSQL and confirm only one active overlapping booking exists.
6. Try an unauthenticated request, a photographer account, an unknown photographer, a past date, an unavailable time, a reversed time range, a negative budget, malformed JSON, and an invalid UUID. Expect rejection with an appropriate `4xx` response and no booking row.

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

Record each result as passed, failed, or blocked. Include the HTTP status and response code, relevant row IDs/statuses, and notification result. A successful build or type check does not replace these database-backed checks. The local environment used for the code repair could not connect to PostgreSQL, so none of these runtime scenarios are marked as passed here.
