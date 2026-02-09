# Notification Actions

Single source of truth for which actions create in-app notifications and for whom.

## Matrix

| Action | Patient | Doctor | Admin |
|--------|---------|--------|-------|
| **Appointment booked** (payment callback, webhook, or admin-create) | Yes – "Appointment Confirmed" | Yes – "New Appointment" | Yes – "New appointment booked" |
| **Appointment cancelled** (by patient via cancel API) | Yes – "Appointment Cancelled" | Yes – "A patient has cancelled…" | Yes – "Appointment cancelled" (refund vs no-refund in body) |
| **Appointment rescheduled** (by patient) | Yes – "Appointment Rescheduled" | Yes – "An appointment has been rescheduled…" | No |
| **Prescription created** | Yes – "New Prescription" | No | No |
| **Investigation requested** | Yes – "Investigation Requested" | No | No |
| **Investigation interpretation added** | No | Yes | No |
| **Investigation results uploaded** (patient) | No | Yes | No |
| **Admin books on behalf of patient** | Yes | Yes | No (acting admin excluded) |

## Admin recipients

- All users with `role IN ('admin', 'super_admin')`.
- When the action is performed by an admin (e.g. admin-create), the acting admin is excluded from notifications.

## Implementation

- Helpers: [lib/notifications/triggers.ts](lib/notifications/triggers.ts) (`notifyAppointmentConfirmed`, `notifyDoctorAppointmentBooked`, `notifyAdmins`, etc.).
- Create API: [app/api/notifications/create/route.ts](app/api/notifications/create/route.ts).
- Book flows: payment callback, webhook, admin-create.
- Cancel: [app/api/appointments/cancel/route.ts](app/api/appointments/cancel/route.ts).
- Reschedule: [RescheduleAppointmentDialog](components/patient/reschedule-appointment-dialog.tsx) via create API.
