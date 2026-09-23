# ParkDrop Copy Glossary

A supporting note to `02-design-plan.md` §3.4 and §3.7. This file is the
authority on individual words. The plan is the authority on sentences.

The test for every word here: **would a person who has never used a smartphone
app, reading English slowly, standing in sunlight with a customer waiting,
understand this on the first try without asking anyone?**

---

## 1. Banned words, and what to say instead

Words are banned because they are borrowed from software, not because they are
long. "Confirmation" is long and fine. "Auth" is short and banned.

### 1.1 Software and network vocabulary

| Never write | Write instead |
|---|---|
| sync, syncing, synced, unsynced | send / sending / sent — or "saved on this phone" |
| offline-first, offline mode | "You can use ParkDrop without internet" |
| offline (as a state noun) | "No internet" |
| online | "when you have internet" |
| connectivity, connection status | "internet" |
| network, network error | "internet" |
| server | (do not mention it; say what the person gets) |
| local, locally, local data | "on this phone" |
| device | "this phone" |
| database, IndexedDB, storage | "this phone" |
| cache, cached | (do not mention it) |
| queue, queued, pending | "waiting to send" |
| mutation, operation, transaction | the thing itself: "the package", "the payment" |
| record (verb, for data) | "save" |
| record (noun) | "package" / "payment" |
| entity | the thing itself |
| sync conflict | "This package was changed on another phone" |
| retry | "Try again" |
| refresh | "Check again" |
| load, loading (as a noun) | "Getting your packages" |
| fetch | (do not mention it) |
| timeout | "That took too long" |
| API, endpoint, request, response | (never appears in the interface) |
| bandwidth, data usage | "your data" |

### 1.2 Security and identity vocabulary

| Never write | Write instead |
|---|---|
| authenticate, authentication, auth | "sign in" |
| authorise, authorisation, authorized | "let you in" / "allowed" |
| credentials | "your PIN" or "the code we sent you" |
| OTP, one-time passcode, passcode | "the 6-digit code" or "the code" |
| verify, verification, validate | "check" |
| token, session, session expired | "You need to sign in again" |
| identity, device identity | "you" / "this phone" |
| log in, login, log out | "sign in" / "sign out" (two words, sentence case) |
| register, sign-up, create an account | (never asked; the flow decides) |
| reset device identity | "Sign out and forget me on this phone" |
| secure, encryption, encrypted | "Only you can see this" — and only when true |
| PIN code | "PIN" |

### 1.3 Domain vocabulary

| Never write | Write instead |
|---|---|
| parcel, consignment, item, goods | **package** |
| intake, receive-in, log a package | "add a package" |
| release (alone, as a noun) | "give the package to the customer" |
| collection, collected (to the operator) | "collected" is fine as a status label only |
| terminal action, terminal state | "This package is finished" |
| lifecycle | (do not mention it) |
| void, voided | "cancelled" |
| customer notification | "the SMS we send your customer" |
| SMS credits | "SMS credits" — keep; explained on first use |
| wallet, balance (of credits) | "how many SMS you have left" |
| public package ID | "package number" |
| pickup code | "pickup code" — keep; it is the customer-facing word |
| pickup point | "your shop" when talking to the operator about themselves |
| business, workspace, tenant | "your shop" |
| membership, role | "what {name} can do" |
| attendant, manager, owner | keep as role names; always explained where shown |
| reconciliation, net activity | "money you took in" |
| revenue, sales, earnings, profit | **banned outright** — ParkDrop does not know these |
| metrics, analytics, dashboard, report | "Your day" |
| CSV, export | "Save a copy you can open on a computer" |

### 1.4 Interface vocabulary

| Never write | Write instead |
|---|---|
| submit | "Save" / "Send" / the specific verb |
| enter (as in "enter your PIN") | "type" |
| input, field, form | (do not name them; label the thing) |
| select, choose an option | "Tap" / "Pick" |
| toggle, switch (verb) | "Turn on" / "Turn off" |
| navigate, go to screen | "Open" |
| tab, modal, sheet, dialog, drawer | (never named in copy) |
| swipe, long-press, drag | (never instructed — see §3.6 of the plan) |
| menu, overflow, options, more actions | "More things you can do" |
| dismiss, close, cancel (ambiguous) | say what happens: "Not yet", "Stay", "Leave" |
| OK | say what OK does |
| error, invalid, failed, exception | say what happened and what to do |
| required field, mandatory | "We need this to send the SMS" |
| character limit, max length | "Shorten this so it fits in one SMS" |
| filter, sort, query | "Show only…", "Show newest first", "Search" |
| settings, preferences, configuration | "Settings" is acceptable; "configuration" is not |
| diagnostics, diagnostic code | "A code for our support team" |
| beta, alpha, preview | (never shown to this audience) |

### 1.5 Tone traps

| Never write | Why | Write instead |
|---|---|---|
| Oops! | infantilising; wastes the one line that matters | say what happened |
| Sorry about that! | hollow; delays the fix | say what happened |
| Something went wrong | tells the person nothing | name the thing and the next step |
| Please try again later | "later" is not an instruction | give a real next step |
| You entered an invalid… | blames the person | "That code is not right. Check the SMS and try again." |
| Are you sure? | asks for confidence, not a decision | ask the actual question: "Leave without saving?" |
| Easy! / Simple! / Just… | if it were easy they would not be stuck | remove the word |
| Awesome! Great job! 🎉 | the person is at work with a queue | "Saved." |
| Don't worry | worry is a reasonable response to money moving | say why it is safe |
| Unfortunately | padding before bad news | lead with the fact |

---

## 2. Words ParkDrop does use, and their fixed meanings

Each of these is used in exactly one sense, everywhere, forever.

| Word | Means, always | Never means |
|---|---|---|
| **Package** | One physical thing held for one customer | a bundle of SMS credits |
| **SMS bundle** | A quantity of SMS credits for sale | a package |
| **Pickup code** | The 7-character code the customer shows | the package number |
| **Package number** | `PD-` + 5 characters, written on the parcel | the pickup code |
| **PIN** | The 4 digits that open ParkDrop on this phone | a bank PIN, a code from an SMS |
| **Code** | The 6 digits we send to sign in | the pickup code, the PIN |
| **Waiting** | On the shelf, not yet given out | unpaid |
| **Collected** | Given to the customer | paid |
| **Returned** | Sent back to whoever brought it | cancelled |
| **Cancelled** | Added by mistake; never really here | returned |
| **Unpaid** | ₦0 of the amount has been paid | Nothing to pay |
| **Part paid** | Some but not all has been paid | Unpaid |
| **Paid** | The whole amount has been paid | Nothing to pay |
| **Nothing to pay** | The amount was ₦0 from the start | Paid |
| **Saved** | It is on this phone and cannot be lost | it reached ParkDrop |
| **Sent** | It reached ParkDrop | it is on the phone |
| **Your shop** | This operator's pickup point | the park |
| **The park** | The motor park the shop sits in | the shop |

**The Saved / Sent distinction is the honesty rule of the whole product.** A
package is *Saved* the instant it is on the phone. It is *Sent* only once the
server has acknowledged it. The interface may never use one word for the other
state, and may never show "Sent" while a mutation is still `PENDING`.

---

## 3. Numbers, money, dates, phones and codes

One convention each. No screen deviates.

### 3.1 Money

- Always `₦` immediately before the digits, no space: `₦3,500`.
- Always thousands separators: `₦12,000`, not `₦12000`.
- **Never** show kobo. Whole naira only: `₦3,500`, never `₦3,500.00`.
- Zero is written **"Nothing to pay"** in any sentence, and `₦0` only inside a
  numeric field the person is typing into.
- Negative amounts never appear. A reversal is described in words.
- Amounts are always tabular-figure aligned when stacked in a list, so columns
  of naira line up digit for digit.
- Never abbreviate: `₦12,000`, never `₦12k`.

### 3.2 Phone numbers

- Always displayed `0803 123 4567` — eleven digits, grouped 4-3-4, with spaces.
- Never `+234...` in the interface. `+234` is a storage and API format only.
- Never run together as `08031234567`.
- Always tabular figures, so a person can read one digit at a time aloud.
- When a customer has no name, the interface says **"No name yet"** in the name
  position and shows the number below it. It never uses the number *as* the
  name. (This is a change from today; see plan §3.3.)

### 3.3 Codes

- Pickup code: 7 characters, monospace, upper case, letter-spaced, shown at the
  largest size on the screen it appears on: `K4M7P2Q`.
- Package number: `PD-8K42Q`, monospace, upper case, always with the `PD-`.
- Sign-in code: 6 digits, one per box, tabular figures.
- Never break a code across two lines.
- Never say "your code" without saying which code it is.

### 3.4 Counts

- Digits, not words, from zero up: `0 packages`, `1 package`, `7 packages`.
- Always singular/plural correct. Never "1 packages", never "package(s)".
- Never `99+` where the exact number is known and fits. Attention counts are
  small by design.

### 3.5 Dates and times

- Today's things say **"Today"**, never the date.
- Yesterday's say **"Yesterday"**.
- Two to six days ago: **"3 days ago"**.
- Seven days and older: the date, written `12 Sep`, never `12/09` (ambiguous to
  a reader used to a different order) and never `2026-09-12`.
- Times: 12-hour with a space and lower-case meridiem: `8:10 pm`. Never 24-hour.
- Combined: `Today, 8:10 pm` / `12 Sep, 8:10 pm`.
- A date shown in a report header is written in full: `Monday, 12 September`.
- Time zone is never shown to the operator. Everything is already their local
  time. (Today the reports header prints "Africa/Lagos (WAT)"; that is removed.)

### 3.6 Durations and countdowns

- `Send again in 28 seconds` — full word, counting down, singular at 1.
- `Undo (7)` for the short undo window, because the word would not fit and the
  button is already labelled.

---

## 4. Sentence rules

1. **Sentence case everywhere.** Headings, buttons, labels, section titles,
   toasts. `Add package`, never `Add Package`. The only capitals are the first
   letter, proper nouns, and ParkDrop.
2. **One idea per sentence.** If a sentence has "and" joining two instructions,
   it is two sentences.
3. **Under 12 words per sentence** in buttons, labels and errors. Under 20 in
   explanatory text.
4. **Active voice, second person.** "We sent a code to your phone", not "A code
   has been sent".
5. **The verb the person performs, on the button.** `Save package`, `Send
   again`, `Release package` — never `OK`, `Confirm`, `Submit`, `Done`.
6. **Numbers as digits**, always.
7. **No exclamation marks.** None. Anywhere.
8. **No emoji** in product copy. (Icons are drawn, labelled, and separate.)
9. **No ellipsis except to mean "still working"**: `Saving…`, `Sending…`. Never
   as a trailing-off tone.
10. **No parentheses carrying required meaning.** "Name (you can skip this)" is
    the one sanctioned exception, kept because it tested as the clearest way to
    mark a field optional at a glance. Everything else parenthetical is cut.
11. **Never use "click".** People tap.
12. **Never name the interface.** "Tap Save", not "Tap the Save button at the
    bottom of the screen".

---

## 5. Error sentence pattern

Every error message in ParkDrop is built from exactly three parts, in order,
and at least two must be present:

```
[what happened, plainly]  [why, only if it helps]  [what to do next]
```

It never contains: the word "error", a code, a blame, or a dead end.

Worked examples, all of them real strings from the product:

| Situation | Message |
|---|---|
| Empty phone field | `Type your phone number to continue.` |
| Short phone number | `Enter your 11-digit number, like 0803 123 4567.` |
| Wrong sign-in code | `That code is not right. Check the SMS and try again.` |
| Incomplete code | `Type all 6 numbers from the SMS.` |
| Guessable PIN | `That PIN is too easy to guess. Try another.` |
| PINs differ | `The two PINs are not the same. Try again.` |
| Wrong PIN | `That PIN is not right. Try again.` |
| Too many PIN tries | `For your safety, type the code we sent you instead.` |
| Names too long for one SMS | `These names are a bit long. Shorten them so your customers get one SMS.` |
| Unsupported characters | `Phones cannot send those characters in an SMS. Please use normal letters and numbers.` |
| Example name left in | `That is the example name. Type the real name your customers know.` |
| Slow request | `Slow network. Still trying.` |
| Request gave up | `That took too long. Check your data and try again.` |
| No internet, blocking | `You are offline. Turn on your data to continue.` |
| No internet, non-blocking | `No internet. You can still add and find packages.` |

Note what none of them do: none says "invalid", none says "failed", none says
"please try again later", and none ends without telling the person what to do.

---

## 6. Words for the states of a thing being saved

The four words the app may use about a package's journey to ParkDrop, and the
only conditions under which each may appear:

| Words shown | Shown when | Icon paired with it |
|---|---|---|
| `All saved` | nothing is waiting to send | a tick |
| `Sending…` | at least one thing is being sent now | a moving arrow |
| `Waiting to send` | things are saved on the phone but not sent | a small clock |
| `No internet` | the phone has no connection | a struck-through cloud |
| `Needs a look` | something failed or clashed and a person must decide | a filled warning triangle |

Nothing else. In particular there is no "Synced", no "Up to date", no green
"Online", and no silent success state — because a person who cannot tell the
difference between "on my phone" and "reached ParkDrop" cannot judge whether it
is safe to close the app, and that judgement is the whole reason the chip
exists.
