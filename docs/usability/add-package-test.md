# Usability Test Plan: Add Package Flow

## 1. Test Overview

This test plan is designed for the business owner or lead operator to evaluate the redesigned "Add package" flow in ParkDrop directly with front-line attendants under realistic field conditions.

Automated tests and browser simulation verify responsiveness and data persistence, but they cannot replace observing five real attendants working under the pressure of arriving buses, customer queues, bright sunlight, and budget Android hardware.

---

## 2. Test Setup & Equipment

- **Participants:** 5 real motor park attendants (mix of first-time and experienced mobile users).
- **Device:** Standard low-cost Android smartphone (e.g. Tecno, Infinix, or itel with 2GB–3GB RAM).
- **Environment:** Bright outdoor daylight / open bus park counter during active operating hours.
- **Network:** Flaky 3G or simulated offline (Airplane mode) for at least 2 of the saves.

---

## 3. The Core Task

Each participant is given 5 parcels to record in immediate succession:

1. **Package 1 (New customer, with name & amount):**
   - Phone: `0812 345 6789`
   - Name: `Emeka Nwosu`
   - Amount: `₦2,000`
2. **Package 2 (New customer, no name, zero amount):**
   - Phone: `0803 987 6543`
   - Name: *(skipped)*
   - Amount: `₦0` (tap "Nothing to pay" chip)
3. **Package 3 (Returning customer — previously recorded phone):**
   - Phone: `0812 345 6789` (system should recognise Emeka Nwosu, show match chip)
   - Amount: `₦2,000` (tap "Last ₦2,000" chip)
4. **Package 4 (New customer, quick amount chip):**
   - Phone: `0901 234 5678`
   - Name: `Amina Bello`
   - Amount: `₦1,000` (tap quick chip)
5. **Package 5 (Rapid next package):**
   - Direct transition via "Next package" without touching navigation.

---

## 4. Attendant Observation Sheet

| Attendant # | First Save Duration (Target: ~25s) | Later Saves Avg (Target: ~12s) | Hesitations / Help Requests | Unsaved Data Prompts Triggered | Notes / Hand Gestures |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Attendant 1** | | | | | |
| **Attendant 2** | | | | | |
| **Attendant 3** | | | | | |
| **Attendant 4** | | | | | |
| **Attendant 5** | | | | | |

---

## 5. Success Criteria & Quantitative Targets

1. **Returning Customer Flow:**
   - Attendant types phone digits, taps 1 amount chip, taps "Save package".
   - Target: **Under 12 seconds**.
2. **New Customer Flow:**
   - Attendant types phone, types name, taps amount chip, taps "Save package".
   - Target: **Under 25 seconds**.
3. **Next Package Flow:**
   - Tap "Next package" once; the keyboard is already open and phone field focused.
   - Target: **Zero clicks needed to focus input**.
4. **Friction Threshold:**
   - **Zero** moments where an attendant stops to ask "What do I do next?".
   - **Zero** accidental customer creation popups or blocking validation alerts.
   - Attendants immediately understand that "Name" is optional.

---

## 6. What Automated Tests Cannot Verify

While unit and browser tests verify:
- ✅ 11-digit phone auto-formatting (`0803 123 4567`)
- ✅ Returning customer instant match chip and duplicate warning notice
- ✅ Pinned 60px Save button remaining visible with soft keyboard open
- ✅ Offline Dexie saving without network latency

Only this field usability test can verify:
- ⚠️ Direct sunlight readability of font sizes and contrast.
- ⚠️ One-handed thumb reach on varied screen diagonal sizes (5.5" to 6.8").
- ⚠️ Real cellular carrier latency on WhatsApp message hand-off.
- ⚠️ Actual customer comprehension of the handwritten `PD-XXXX` parcel ID.
