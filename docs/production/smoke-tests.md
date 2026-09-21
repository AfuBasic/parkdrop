# ParkDrop Production Smoke Testing Guide

This document defines the safe, non-destructive smoke testing runbook to verify production or staging environments after a deployment.

> [!CAUTION]
> **Production Smoke Boundary Rule:**
> NEVER execute destructive actions (such as marking real customer parcels collected, charging live cards, removing actual staff, or sending unexpected SMS to real motor park customers) during production verification. Always use a dedicated synthetic test business and test email.

---

## 1. Synthetic Test Setup
- Test Business: `ParkDrop Operations Verification Hub` (synthetic)
- Attendant Test Account: `test-attendant@parkdrop.com.ng`
- Customer Test Phone: `+2348000000001` (synthetic test number)

---

## 2. Sequential Verification Test Cases

### Test 1: Health Probes
```bash
curl -f https://api.parkdrop.com.ng/api/v1/health/live
# Expected: {"status":"healthy", "version":"1.0.0"}

curl -f https://api.parkdrop.com.ng/api/v1/health/ready
# Expected: {"status":"ready", "version":"1.0.0"}
```

### Test 2: App Shell & Authentication
1. Navigate to `https://app.parkdrop.com.ng`.
2. App shell renders Field Blue interface without white-screen or error boundaries.
3. Enter test email `test-attendant@parkdrop.com.ng`.
4. Receive and input OTP.
5. Home screen displays active business and operational counters.

### Test 3: Offline Package Creation & Sync
1. Open Chrome DevTools -> Network -> Offline.
2. Click **Add Package**.
3. Enter Customer `John Test` (`0800 000 0001`), amount `₦2,000`.
4. Tap **Save Package**.
5. Package appears in Waiting list with status pill `Saved locally`.
6. Restore network to Online.
7. Mutation sync triggers automatically; status changes to `Synced`.

### Test 4: Search & Retrieval
1. Tap **Search**.
2. Type `John Test` or the generated public package ID (`PD-...`).
3. Matching record appears in `<50ms` from IndexedDB.

### Test 5: Operational Payment Recording
1. Open Package Detail.
2. Tap **Record Payment**.
3. Record `₦1,000` via `CASH`.
4. Balance updates to `₦1,000` remaining; payment status transitions to `Part paid`.
5. Sync confirms payment receipt on server without duplicate entry.

### Test 6: Package Collection
1. On Package Detail, tap **Collect Package**.
2. Input the exact 7-character pickup code.
3. Confirm collection.
4. Package status transitions to `Collected` with green success badge.
5. Attempting to collect a second time is blocked by domain guard.
