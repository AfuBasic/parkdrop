# ParkDrop — Design Plan (Phase 2)

Companion documents: `01-current-state.md` (what exists today, descriptive) and
`copy-glossary.md` (word-level authority).

This is a specification. Someone who has never seen ParkDrop should be able to
build the screens described here without asking a question. Where a decision
genuinely needs the product owner, it is flagged in §9 rather than guessed at
quietly.

No code, no pseudocode, no component names, no file paths, no libraries. Those
belong to a build brief written after this plan is agreed.

---

## 1. Who this is for

> **Adaeze has never used a smartphone app before.** She reads English slowly.
> She is standing at a counter in a motor park at 1pm in November. The sun is
> directly on her screen. A customer is in front of her and two more are behind
> him. A bus is idling. Her phone is a ₦45,000 Android with 3GB of RAM and one
> bar of signal that keeps dropping. There is nobody to ask.

Every decision in this plan is tested against Adaeze. Not as an edge case to
accommodate — as the default user.

Three consequences follow, and they run through everything below.

**First, "obvious" is not a thing a designer can assess about their own work.**
The consistent finding across low-literacy and novice-smartphone interface
research is that designers and engineers systematically overestimate what reads
as self-explanatory. An interface that seems plainly clear to its author is
routinely unusable to a first-time user. So this plan does not accept "this
screen is obviously easy" as a reason to skip specifying it. Every screen gets
the full treatment, including the ones that look trivial.

**Second, app conventions are learned, not innate.** Swiping to reveal, long
pressing to open a menu, pulling to refresh, pinching, a bare "⋯", a hamburger,
a floating circle with a plus in it — none of these are discoverable. A person
who has used apps for a decade reads them instantly; a person who has not sees
nothing there at all. §6 rules them out explicitly so they cannot creep back.

**Third, being unable to read fluently and being unfamiliar with apps are two
different problems with two different fixes**, and ParkDrop's users often have
both. §4 addresses them separately.

A note on how the research is used here. Where this plan says "research
supports", it means the broad, well-established direction of published work on
low-literacy and novice-smartphone interface design — that icons must be
paired with words rather than replacing them, that hidden gestures are not
discoverable, that recognition beats recall, that larger targets reduce error
under stress, that numeric and spatial memory often outlast text fluency.
**No specific study, statistic or figure is cited, because none has been
consulted for this document.** Everything else is inference from general
interaction-design principles plus what the ParkDrop codebase itself already
demonstrates its team has learned. Both are labelled where it matters, and
where a claim needs real evidence before it drives a build decision, §9 says so.

---

## 2. Design principles

Ten principles. Everything later in this plan is an application of one of them.
If a future screen contradicts one of these, the screen is wrong.

### P1 — One task, one screen, one obvious next action

A screen exists to let a person finish one job. Everything on it either advances
that job or is cut. If a screen needs two sentences to explain what it is for,
it is two screens.

Concretely: no screen in ParkDrop presents more than one blue button. A screen
with two things of equal weight has no primary action, and a person who cannot
find the primary action stops.

### P2 — Never more than one primary action visible at a time

There is exactly one primary treatment in the product: a solid blue, full-width,
60px-tall button with white 20px bold text. It may appear once per screen.

Everything else is explicitly secondary and looks it:

| Rank | Treatment | Used for |
|---|---|---|
| Primary | Solid blue fill, full width, 60px, white 20px bold | The one action |
| Secondary | White fill, 2px blue border, full width, 56px, blue 18px bold | A real alternative with different consequences |
| Tertiary | Blue 17px bold text on the page, 48px tap area, no box | A way out, or a rarely-needed variant |
| Destructive | White fill, 2px red border, red 18px bold, 56px | Only after a confirmation step |

A bottom sheet may show one primary and at most one secondary, plus one
tertiary way out. Three boxes maximum, ever.

### P3 — Every icon is paired with a word, and nothing is carried by colour alone

No icon-only control exists in ParkDrop. Not the back arrow, not the phone
button, not the clear-search X, not the refresh. Every one carries a visible
word next to it or directly beneath it at 15px minimum.

This is not only an accessibility floor. An icon is a picture of a convention,
and a person who does not know the convention sees a shape. A magnifying glass
does not mean "search" to someone who has never used a search box.

Every status is carried by **three** channels at once: a shape (icon), a word,
and a colour. Colour is the last of the three, never the only one. This is
stated as a rule already in the codebase's own token file and it holds:

| State | Icon | Word | Colour |
|---|---|---|---|
| Good | tick in a circle | the specific word | green |
| Attention needed | filled triangle | the specific word | amber |
| Bad | filled circle with `!` | the specific word | red |
| Nothing to do | outline circle | the specific word | grey |

Bright sunlight collapses colour discrimination long before it collapses shape
discrimination. A green and an amber pill look identical on a cheap LCD at 1pm.

### P4 — Every state a person can end up in is designed

For every screen, all of these are specified, with words, before it is built:

`default` · `loading` · `empty (first time)` · `empty (no results)` ·
`error` · `offline` · `success` · `partial success` · `permission denied` ·
`stale data`

"That shouldn't happen" is not a state. If it can happen it gets words.

The most commonly skipped, and therefore explicitly required here:

- **Partial success.** The package saved but the SMS did not send. Both facts
  are shown; neither is hidden behind the other.
- **Stale data.** The screen is showing what the phone knew an hour ago. It
  says so, with the age, rather than presenting old numbers as current.
- **Permission denied by role.** An attendant does not see a Reports row that
  then 403s. The row is absent, and if the person arrives by another path they
  are told plainly whose permission is needed.

### P5 — Plain language, roughly a Grade 5 reading level

Full word list in `copy-glossary.md`. The rules in brief: sentence case; one
idea per sentence; under 12 words in a button, label or error; active voice,
second person; digits not words; the verb the person performs written on the
button; no exclamation marks; no emoji; never "click".

The banned-word list is long and it is enforced by making it impossible to add
a string without passing through a shared strings file per feature. Four
features already work this way and read visibly better than the eleven that do
not.

### P6 — Stated minimums for every tap target and every text size

These are floors, not targets. A design may exceed them; nothing may go under.

| Thing | Minimum | Preferred | Why this number |
|---|---|---|---|
| Any tappable thing | 48 × 48px | 56px | An adult index finger pad is roughly 45–57px of screen at typical density. 44px is the common minimum; 48 is chosen because the user is standing, rushed, possibly one-handed, and may have damp or dusty hands. |
| Primary button height | 60px | 60px | Already the product's standard. Large enough to hit without looking. |
| Gap between adjacent targets | 12px | 16px | Prevents the mis-tap that 48px targets otherwise invite when stacked. |
| Any text at all | **15px** | — | The absolute floor. Below this, a cheap LCD in sunlight with an anti-glare-free screen protector stops resolving letterforms. |
| Body text | 18px | 18px | |
| Anything read aloud (codes, phones, amounts) | 22px | 25–32px | These are transcribed to paper and spoken down a phone line. |
| Screen question / title | 28–30px | 30px | |
| Label above a field | 16px | 16px | |

**The 15px floor is the single most consequential number in this plan.** It
retires the 12px caption token, `text-xs`, `text-[11px]` and `text-[10px]`
entirely. Section headings in Settings, row subtitles, badges, helper text and
status pills all move to 15px or 16px. Screens get taller. That is the correct
trade: a taller screen scrolls; unreadable text does not.

Contrast floor: **4.5:1 for all text including large text**, and 3:1 for the
boundary of any control. WCAG 2.1 AA permits 3:1 for large text; ParkDrop does
not take that allowance, because AA's contrast thresholds assume indoor
lighting and this product is used outdoors in direct sun.

### P7 — Nothing a person types is ever silently lost

Every value is persisted the moment it is typed, keyed to where the person was,
and restored when they come back — whether they left via Back, a phone call, a
battery death, an app kill, or a crash.

This already works in the sign-in flow, where every step's values are written to
disk on every change. It is extended here to Add package, Record payment, the
invite form, and every settings edit.

A person never sees a blank form they had already filled in, and never sees a
"discard?" question unless they are about to lose something real.

### P8 — Honest on a slow network and offline

"Honest" has an exact meaning here: **the app never claims something succeeded
before it did, and never claims something failed that might still succeed.**

Three distinct facts, three distinct words, never interchangeable:

- **Saved** — it is on this phone. It cannot be lost. This is true immediately.
- **Sending / Waiting to send** — it is on this phone and ParkDrop has not
  confirmed receipt yet.
- **Sent** — ParkDrop has confirmed it.

A package is *Saved* the instant the attendant taps Save, and the interface says
so instantly, because that is true and because waiting on a spinner with a
customer at the counter is the failure mode this whole architecture exists to
prevent. It becomes *Sent* later, quietly.

Corollaries:
- No screen shows a spinner for something that is already done locally.
- No success toast fires on a network response when the local write already
  succeeded — it fires on the local write.
- Offline never greys out the app. Only genuinely online-only actions explain
  themselves; everything else keeps working.
- Where the phone cannot know something (e.g. a report date it never held), it
  says it cannot know rather than showing zero. Showing `0 packages` for a day
  that had 40 is a lie the operator may act on.

### P9 — Errors are never the person's fault and always end in a next step

Pattern: *what happened · why, if it helps · what to do now.* Never the word
"error", never a code in the sentence, never a dead end, never "please try
again later".

Where a genuine dead end exists — an account removed from a business, a device
that cannot recover — the next step is a person: "Call us" with a real number.

### P10 — Trust is design material, not decoration

This audience is being asked to put other people's money and other people's
phone numbers into an app, on a phone they may share, from a company they have
not heard of. Wariness here is correct judgement, not a barrier to overcome.

Trust is built by five concrete things, each of which is specified later:

1. **Saying what will happen before it happens.** The SMS preview on the setup
   screen shows the exact message the customer will receive, rendered live from
   the same template that sends it. Nothing is promised that is not shown.
2. **Never asking for what is not needed.** No date of birth, no address, no
   bank details, no "optional" marketing consent. Name is optional even for
   customers.
3. **Saying plainly what ParkDrop does not do.** "ParkDrop never takes any of
   this money" appears on the payment screen. "This PIN is only for ParkDrop.
   Do not use your ATM PIN" already appears at PIN setup and stays.
4. **A visible, constant route to a human.** Not a chatbot. A WhatsApp number
   and a phone number that a person answers.
5. **Never showing a control that does not work.** The codebase already refuses
   to show a "Call me with the code" button the backend cannot serve. That
   instinct is made a rule.

---

## 3. Information architecture

### 3.1 The shape of the app

Four destinations, permanently, in a bottom bar. Every destination is one word
and one icon.

```
Home        Packages        Customers        More
```

This confirms the change already made in the codebase and contradicts three
older documents that specify a five-item bar with `Add` in the middle.

**Why four and not five.** `Add` is an action, not a place. Putting it in a bar
of places teaches a person that the bar is a mixed bag, which makes the other
four items harder to reason about. More practically: with `Add` in the bar,
adding a package had three entry points on a single screen (the bar, the Home
tile, and the empty-state button), and a first-time user faced with three doors
to the same room assumes they lead to different rooms. The component comment in
the codebase records exactly this reasoning and it is adopted here.

`ASSUMPTION` Removing `Add` from the bar slows down an experienced attendant by
one tap when they are deep in the Packages list. This is judged acceptable
because the Add tile on Home is enormous, Home is one tap away, and the flow
after a save ("Next package") means a run of intakes never returns to a list at
all. **What would change this:** field observation showing attendants routinely
add packages from the Packages list. This is exactly what the existing
`docs/usability/add-package-test.md` protocol would reveal. See §9.

### 3.2 Depth

**No flow is more than three levels deep. Most are two.**

```
Home                                              (level 1)
  └ Add package                                   (2)
      └ Package saved                             (3, terminal)
  └ Find package                                  (2)
      └ Package                                   (3, terminal)
Packages                                          (1)
  └ Package                                       (2)
      └ Release / Return / Cancel / Payment sheet (3, terminal)
Customers                                         (1)
  └ Customer                                      (2)
      └ Package                                   (3, terminal)
More                                              (1)
  └ Any settings screen                           (2)
      └ One editing sheet                         (3, terminal)
```

At level 3 the only ways onward are *finish* or *go back*. Nothing at level 3
opens a level 4. A person therefore never needs to hold more than "I came from
the list" in their head.

Buying SMS credits is the one flow that risks depth, because it hands off to a
payment provider. It is treated as a single screen with internal steps and one
Back, never a stack. See §3.3.30.

### 3.3.0 What is constant everywhere

These four things are present on every screen in the signed-in app, in the same
place, in the same form. They are the fixed points a person navigates by.

| Constant | Where | Behaviour |
|---|---|---|
| **A way back** | Top left, always a left arrow **and the word "Back"**, 48px tall, 16px from the edge | On level-1 screens it is absent (there is nowhere back to); the bottom bar is the way. Never a bare chevron. |
| **A way to a person** | Top right, the word **"Help"** with a question-mark-in-circle icon | Opens the help sheet described in §3.3.37. Never buried in More. |
| **Where your work is** | Directly under the title on Home; as a one-line strip at the top of Packages, Customers and every list | The saved/sending/waiting/no-internet/needs-a-look chip of `copy-glossary.md` §6. Tappable, 48px. |
| **The bottom bar** | Bottom, 64px + safe area | Present on Home, Packages, Customers, More, and on every settings screen. **Absent** on Add package, Package saved, Package detail, Find package, and Buy SMS credits. |

Why the bar is absent on those five: each is a task with a specific end, and a
visible bar during a task is an invitation to abandon it half-finished, which
under P7 means recovering a draft the person did not mean to create. This is a
change from today, where every `/more/*` screen keeps the bar, including the
payment flow.

Rule for the future: **the bar is present on places and absent during tasks.**

What is allowed to change screen to screen: the header treatment (blue band on
Home and task screens, plain on list screens), the presence of a search field,
the presence of filters, and the illustration.

### 3.3.0b Brand presence

The ParkDrop wordmark appears in exactly two places: the blue header on Home,
and the sign-in screens. Nowhere else. A logo on every screen is noise; a logo
in one consistent place is a landmark.

### 3.3.0c New person versus returning person

The app decides, and says which it has decided, rather than asking.

| Situation | How the app knows | What the person sees |
|---|---|---|
| Never used ParkDrop on this phone, no account | backend returns `new_user` after the code | The 7-step first-run flow |
| Has an account, new phone | backend returns `authenticated`, no local device record | Code → straight to Home, plus a one-time PIN setup |
| Same phone, app closed and reopened | local device record + valid PIN | Unlock screen: "Welcome back, {name}" |
| Same phone, session expired | remembered identity cached | One-tap re-confirm, never a retyped email |
| First day of use, zero packages ever | local package count is 0 | Home shows the teaching card, no stat strip |
| Has used it before | package count > 0 | Home shows the stats and the waiting list |

The person is never asked "do you have an account?". They are never shown a
"Sign up" link next to a "Sign in" link. This is an existing, good decision and
it is kept.

**The first-day signal is the important one.** A brand-new operator on Home
sees a card that teaches the job in three steps, not a dashboard of zeros. A
grid reading `0 · ₦0 · 0` on day one tells a nervous first-time user that the
app is broken or that they have already failed.

---

## 3.3 Screen-by-screen specification

Every screen from the Phase 1 inventory appears below. Nothing is dropped
silently; the two that are proposed for removal are named and justified.

Format for each: **Purpose · Content and hierarchy · Primary and secondary ·
States · Copy · What happens next · What changes and why.**

Where a screen is correct today, this says "keep as is" explicitly rather than
leaving it ambiguous whether it was considered.

---

### 3.3.1 Boot splash

**Purpose.** Hold the screen for the second or two while the app works out who
this is, without looking broken.

**Content and hierarchy.** Centred: the ParkDrop mark at 64px, then 24px below
it the word `ParkDrop` at 22px bold, then 20px below that a small spinner.
Nothing else. The background is the page blue-grey.

**Primary action.** None. Nothing is tappable.

**States.**

| State | After | Shows |
|---|---|---|
| default | 0–3s | mark, wordmark, spinner |
| slow | 3s | adds, 24px below: `Still opening. One moment.` |
| stuck | 10s | replaces the spinner with: `ParkDrop is taking longer than usual.` and a secondary button `Try again` which reloads, plus a tertiary `Call us` |

**Copy.**
- `ParkDrop`
- (3s) `Still opening. One moment.`
- (10s) `ParkDrop is taking longer than usual.` / `Try again` / `Call us`

**What happens next.** Resolves automatically into sign-in, unlock, recovery or
Home.

**What changes and why.** Today the splash is a pulsing icon and a spinner with
a screen-reader label, and it has no slow or stuck state — a person on a dying
phone sees an animation forever with no way out. A spinner with no words after
three seconds is the clearest case of P4 being skipped. Three seconds is the
chosen threshold because it is roughly where a wait stops reading as "the app
is working" and starts reading as "the app is frozen"; it is a judgement, not a
measured figure. The mark is kept.

---

### 3.3.2 Sign-in — identifier

**Purpose.** Collect the one piece of information that lets ParkDrop work out
who this is.

**Content and hierarchy.**

1. Blue header band, roughly a quarter of the screen: the ParkDrop wordmark
   centred, `Back` at the left if there is anywhere back to, `Help` at the
   right, and the kraft-brown parcel illustration sitting at the bottom edge.
2. White sheet with a 28px rounded top edge covering the rest.
3. Step indicator: four short bars, the first filled. Beneath, `Step 1 of 7` at
   16px.
4. The question at 30px bold: `What is your phone number?`
5. The field, 68px tall, 25px bold text inside, label `Your phone number` above
   it at 16px, placeholder `0803 123 4567`, a `Clear` word-button inside the
   right edge once there is text. Number pad keyboard.
6. Three trust lines at 16px, each with a small tick: free, how the code
   arrives, and that the number is not sold.
7. The primary button `Continue`, pinned above the keyboard.
8. Below it at 15px: `By continuing you accept our Privacy Notice.` with the
   last two words underlined and tappable.

**Primary action.** `Continue`. **Secondary.** None. **Tertiary.** `Help`.

**States.** default · typing (Continue stays enabled; validation happens on tap,
not while typing, so the button never appears broken) · empty-on-submit ·
invalid-on-submit · sending · slow · timed out · offline.

**Copy.**
- Title (phone mode): `What is your phone number?`
- Title (email mode): `What is your email address?`
- Label: `Your phone number` / `Your email address`
- Placeholder: `0803 123 4567` / `chinedu@gmail.com`
- Trust: `ParkDrop is free.` · `We will send you a code by SMS.` /
  `We will email you a code.` · `We never sell your number.` /
  `We never sell your email.`
- Empty: `Type your phone number to continue.` /
  `Type your email address to continue.`
- Invalid: `Enter your 11-digit number, like 0803 123 4567.` /
  `Check your email. It should look like name@gmail.com.`
- Busy: `Sending your code…`
- Slow: `Slow network. Still trying.`
- Timeout: `That took too long. Check your data and try again.` / `Try again`
- Offline: `You are offline. Turn on your data to continue.`

**What happens next.** Success → the code screen, with the identifier carried
across and shown there. Failure → the message appears under the field, the
field keeps focus and its content, nothing is cleared.

**What changes and why.** **Keep as is.** This screen already meets every
principle here. The one addition: the *trust* lines are currently
mode-dependent strings; they stay exactly as written.

`ASSUMPTION` The product intends to move to phone + SMS as the identifier as
soon as the backend can deliver it; every screen already branches on a single
switch. This plan assumes phone becomes the default. **What would change it:**
SMS delivery cost per sign-in exceeding what the business will carry. See §9.

---

### 3.3.3 Sign-in — code

**Purpose.** Confirm the person controls the phone number or inbox they gave.

**Content and hierarchy.** Same header and sheet. Then:

1. `Step 2 of 7`
2. Title 30px: `Enter the code`
3. 18px: `We sent a 6-digit code by SMS to` then the identifier on its own line
   at 18px bold with tabular figures, and `Change` as a tertiary word-button
   next to it.
4. Six boxes, each 70px tall, one digit each, tabular figures, numeric keyboard,
   auto-advance, auto-submit on the sixth digit, and one-time-code autofill.
5. 16px hint: `The SMS can take up to a minute.` / `It can take a minute. Check
   Spam too.`
6. The resend block: while cooling down, `Send the code again` with
   `You can ask again in 28 seconds.` Once ready, `No code yet? Send it again`
   with a secondary button `Send again`.
7. If, and only if, the backend can serve them: `Still no code?` with
   `Get the code on WhatsApp` and `Call me with the code`.

**Primary action.** None visible — the screen submits itself on the sixth digit.
This is the one screen in the app without a primary button, and it is justified:
a person who has just typed six digits has finished the task, and asking them
to find and press a button afterwards is a step with no purpose.
**Secondary.** `Send again`. **Tertiary.** `Change`, `Back`, `Help`.

**States.** default · typing · checking · wrong code · too few digits · cooling
down · resend ready · resent · too many attempts · offline · slow · timed out.

**Copy.**
- `Enter the code` · `We sent a 6-digit code by SMS to` · `Change`
- `The 6-digit code` (the boxes' group label, for screen readers)
- `Checking…`
- `That code is not right. Check the SMS and try again.`
- `Type all 6 numbers from the SMS.`
- `Send the code again` · `You can ask again in 28 seconds.` ·
  `No code yet? Send it again` · `Send again`
- On resend: `We sent a new code.`

**What happens next.** Correct + existing user → Home. Correct + new user →
`What should we call you?`. Wrong → boxes shake once (120ms, disabled under
reduced motion), the message appears beneath, the boxes clear and focus returns
to the first.

**What changes and why.** **Keep as is**, with one addition: an explicit
confirmation line when a resend succeeds. Today a person taps `Send again` and
the only feedback is the countdown restarting — which a first-time user reads as
nothing having happened.

---

### 3.3.4 Sign-in — name

**Purpose.** Learn what to call this person, so the app can greet them by name.

**Content.** `Step 3 of 7` · `What should we call you?` ·
`Just your first name is fine.` · one field, label `Your first name`,
placeholder `Chinedu` · `Continue`.

**Primary.** `Continue`. **Secondary.** None.

**States.** default · empty-on-submit · saving.

**Copy.** `What should we call you?` · `Just your first name is fine.` ·
`Your first name` · `Chinedu` · `Type your first name.`

**What happens next.** → PIN setup.

**What changes and why.** **Keep as is.** The subtitle is doing real work: it
pre-empts the "do I need my full legal name?" hesitation that stops people on
forms.

---

### 3.3.5 Sign-in — PIN setup and confirm

**Purpose.** Set the four digits that will open ParkDrop on this phone.

**Content.** `Step 4 of 7` · `Choose a PIN` · `4 numbers you will remember. You
use it to open ParkDrop on this phone.` · four large dots that fill as digits
are entered · an on-screen number pad with 64px keys (50px on short screens) and
a `Delete` key labelled with the word · an amber notice: `This PIN is only for
ParkDrop. Do not use your ATM PIN.`

Then the confirm step: `Type it again` · `Type the same 4 numbers.`

**Primary.** None; the pad advances automatically at four digits.
**Secondary.** None. **Tertiary.** `Back`, `Help`.

**States.** entering · too easy · confirming · mismatch · saving.

**Copy.** `Choose a PIN` · `4 numbers you will remember. You use it to open
ParkDrop on this phone.` · `This PIN is only for ParkDrop. Do not use your ATM
PIN.` · `Type it again` · `Type the same 4 numbers.` ·
`That PIN is too easy to guess. Try another.` ·
`The two PINs are not the same. Try again.` · `Delete` · `Number keypad`

**What happens next.** Match → pickup point setup. Mismatch → back to the first
entry, cleared, with the message.

**What changes and why.** **Keep as is.** The ATM warning is exactly the kind of
trust material P10 describes: it names the specific fear (that this app wants
their bank PIN) and disposes of it before it forms. The custom on-screen pad
rather than the system keyboard is also correct — it guarantees digits, guarantees
key size, and cannot be switched to a letter layout by a confused tap.

---

### 3.3.6 Sign-in — pickup point

**Purpose.** Capture the two names the customer will read in their SMS.

**Content and hierarchy.**

1. `Step 5 of 7`
2. `Your pickup point`
3. `Your customers see these names in their SMS.`
4. Field 1: label `Name of your pickup point`, placeholder
   `Chima Parcel Services`
5. Field 2: label `Name of the park`, placeholder `Peace Park`
6. **The SMS preview**, the most important element on the screen: a white card
   shaped like a message bubble, headed `Your customers will get this SMS:` at
   16px, containing the live-rendered message at 18px, with a character count
   beneath it that turns amber as the budget runs out.
7. Primary `Save and continue`.

**Primary.** `Save and continue`. **Secondary.** None.

**States.** default · typing (preview updates live) · either name empty ·
combined names too long · unsupported characters · example name left in place ·
junk name · saving.

**Copy.**
- `Your pickup point` · `Your customers see these names in their SMS.`
- `Name of your pickup point` · `Name of the park`
- `Your customers will get this SMS:`
- `Save and continue` · `Saving…`
- `Type the name of your pickup point.` · `Type the name of the park.`
- `These names are a bit long. Shorten them so your customers get one SMS.`
- `Phones cannot send those characters in an SMS. Please use normal letters and
  numbers.`
- `That is the example name. Type the real name your customers know.`

**What happens next.** → business phone number.

**What changes and why.** **Keep as is.** This screen is the best single piece
of design in the product. It shows the person the exact consequence of what
they are typing, at the moment they type it, rendered from the same template
that actually sends. That is P10 made literal. The length and character rules
are not arbitrary validation — they are the SMS costing the business money and
the customer receiving a broken message, explained in those terms.

---

### 3.3.7 Sign-in — business phone

**Purpose.** Capture the number a customer will ring when their package arrives.

**Content.** `Step 6 of 7` · `What number should customers call?` ·
`This number goes in the arrival SMS so customers can reach your shop.` · one
phone field · an amber-bordered notice: `Check it twice. Your customers will
call this number when their package arrives.` · `Save and continue`.

**States.** default · empty · invalid · saving.

**Copy.** As above, plus `Type your phone number to continue.` and
`Enter your 11-digit number, like 0803 123 4567.`

**What changes and why.** **Keep as is.** "Check it twice" earns its place: this
is the one field where a typo is invisible to the operator and only discovered
by customers who cannot reach them.

---

### 3.3.8 Sign-in — ready

**Purpose.** Confirm setup is finished and hand over to the first real task.

**Content.**

1. A tick that pops in once, 64px, green.
2. `You are ready, Chinedu.` at 30px.
3. `Your pickup point is set up.` at 18px.
4. A white summary card: `Your pickup point` with both names and an `Edit`
   word-button; `Customer contact phone` with the number, formatted, and `Edit`.
5. A second card: `Put ParkDrop on your phone screen` /
   `So it opens in one tap.` / secondary button `Show me how`.
6. Primary: `Add your first package`.

**Primary.** `Add your first package`. **Secondary.** `Show me how`.
**Tertiary.** Two `Edit` links.

**States.** default · install prompt unavailable (the card is simply absent —
never a disabled button).

**Copy.** `You are ready, Chinedu.` · `Your pickup point is set up.` ·
`Your pickup point` · `Customer contact phone` · `Edit` ·
`Put ParkDrop on your phone screen` · `So it opens in one tap.` ·
`Show me how` · `Add your first package`

**What happens next.** Primary → Add package, not Home. A person who has just
finished setting up should land in the thing the app is for, not in a dashboard
of zeros.

**What changes and why.** **Keep as is.**

---

### 3.3.9 Unlock

**Purpose.** Let a known person back in quickly.

**Content.** Blue header with the mark. `Welcome back, Chinedu` at 30px.
`Type your PIN to open ParkDrop.` at 18px. Four dots. The number pad.
At the bottom, two tertiary word-buttons side by side with a clear gap:
`Forgot PIN?` and `Not you?`.

**Primary.** None; auto-submits at four digits. **Tertiary.** `Forgot PIN?`,
`Not you?`, `Help`.

**States.** default · checking · wrong PIN · attempts exhausted · offline (the
PIN still works — unlocking is local; this must be true and must be visible).

**Copy.** `Welcome back, Chinedu` · `Type your PIN to open ParkDrop.` ·
`That PIN is not right. Try again.` ·
`For your safety, type the code we sent you instead.` · `Forgot PIN?` ·
`Not you?`

**What happens next.** Correct → Home. Five wrong → the code flow, **not** a
lockout. `Not you?` → a confirmation, then the sign-in flow.

**What changes and why.** **Keep as is**, with one addition: `Not you?` must
open a confirmation before forgetting the identity, because on a shared phone an
accidental tap currently discards the remembered profile. Proposed confirmation:
title `Sign out of ParkDrop on this phone?`, body `Your packages stay safe.
You will need your email and a new code to sign in again.`, primary
`Stay signed in`, destructive secondary `Sign out`.

---

### 3.3.10 Remembered re-confirm

**Purpose.** Get a returning owner back in without retyping anything.

**Content.** `Welcome back, Chinedu` · the remembered identifier and business
name in a card · `We will send a new code to your phone.` /
`...to your email.` · primary `Send me a code` · tertiary `Use a different
account`.

**States.** default · sending · slow · offline · timed out.

**Copy.** As above plus the shared waiting strings.

**What changes and why.** **Keep as is.** One-tap re-confirmation instead of a
retyped address is genuinely the right call for this audience and it already
exists.

---

### 3.3.11 Forgot PIN

**Purpose.** Restore access without a support call.

**Content.** `Reset your PIN` · an explanation of what will happen · a code
step reusing §3.3.3 exactly · then `Choose a new PIN` /
`4 numbers you will remember.` reusing §3.3.5.

**Copy.** `Reset your PIN` · `Choose a new PIN` ·
`4 numbers you will remember.` — plus, new: `Your packages are safe. This only
changes how you open ParkDrop on this phone.`

**What changes and why.** The reassurance line is added. A person resetting a
PIN under pressure with a customer waiting will assume the worst about what
they are about to lose. One sentence removes that.

---

### 3.3.12 Recovery

**Purpose.** Repair the data on this phone without losing work, and be
completely honest about what is at risk.

**Content and hierarchy.**

1. Full screen. No bottom bar, no Back — this blocks the app deliberately.
2. An illustration of a parcel being set right, not a warning triangle. Tone:
   *we are fixing this*, not *something is broken*.
3. Title 30px: `ParkDrop needs to tidy up on this phone.`
4. Body 18px: `Your packages are safe. This takes about a minute.`
5. Primary: `Start`.
6. Tertiary: `Call us`.
7. Below, at 15px: `Code for support: PD-RCV-8K42` with a `Copy` word-button.

**Primary.** `Start`. **Tertiary.** `Call us`, `Copy`.

**States.**

| State | Copy |
|---|---|
| ready | `ParkDrop needs to tidy up on this phone.` / `Your packages are safe. This takes about a minute.` / `Start` |
| working | `Checking your work on this phone…` then `Putting your packages back…` — each with a determinate progress bar, never an indefinite spinner |
| done | `All tidy.` / `Everything is back.` / `Open ParkDrop` |
| blocked, fixable online | `ParkDrop needs internet to finish this.` / `Turn on your data, then tap Try again.` / `Try again` |
| blocked, needs a person | `We could not finish. Please call us and read out the code below.` / `Call us` / the code |
| last resort | the reset dialog, §3.3.13 |

**What changes and why.** Three changes.
1. "repair data stored on this device" becomes "tidy up on this phone".
   *Repair*, *data* and *device* are three words from the banned list in one
   sentence, and *repair* implies damage the person may have caused.
2. "Your packages are safe" moves to the top. It is the only question the
   person actually has.
3. The `alert()` fallback is removed entirely. A native browser alert is the one
   piece of interface ParkDrop cannot word, style or make reassuring, and it
   fires at the single most frightening moment in the product.

---

### 3.3.13 Safe reset dialog

**Purpose.** Let a person deliberately destroy the data on this phone when
nothing else works, without ever letting them do it by accident.

**Content.** A dialog that cannot be dismissed by tapping outside it.

Title: `Clear ParkDrop from this phone?`
Body: `Anything already sent to ParkDrop is safe and will come back when you
sign in again.` then, **only when true**, in amber with a warning icon:
`3 packages on this phone have not been sent yet. They will be lost.`
Then: a field labelled `Type CLEAR to continue`.
Primary: `Keep my work` (this is the primary — the safe choice always is).
Destructive secondary, disabled until the word is typed: `Clear this phone`.

**States.** nothing unsent (the amber block is absent) · unsent work present ·
typing · clearing.

**What changes and why.** The typed-confirmation gate is added, and the unsent
count is made explicit and specific. A person is never told they will lose
"data"; they are told they will lose three packages. The safe option being the
primary button is deliberate and applies to every destructive dialog in the app.

---

### 3.3.14 Home

**Purpose.** Answer, without a tap, "what do I do now, and is everything all
right?" — and put the two things done all day within one thumb-reach.

**Content and hierarchy.**

1. **Blue header band.** The ParkDrop wordmark. Beneath it, the greeting at
   22px: `Good afternoon, Chinedu`. Beneath that, the pickup point name at 22px
   bold and the park name at 16px. At the right, the work chip. The band
   collapses when the keyboard opens.
2. **White sheet**, 28px rounded top edge.
3. **Two action tiles**, side by side, climbing 56px up into the blue band so
   they read as the most important things on the screen. Each is 112px tall,
   20px rounded, white, with a 32px icon, a 20px bold label and a 16px subline:

   | Tile | Label | Subline |
   |---|---|---|
   | left | `Add package` | `A package arrived` |
   | right | `Find package` | `A customer is here` |

   The sublines are the design. They label the *situation*, not the function, so
   a person matches what is happening in front of them to a tile instead of
   translating an abstraction.
4. **Setup banner**, only if something from first-run is still missing.
5. **Offline strip**, only when there is no internet.
6. **Stat strip**, three tiles: `Waiting` (count), `Unpaid` (amount, with the
   package count beneath), `Today` (collected count). Hidden entirely on day
   one.
7. **Waiting list**: heading `Waiting for pickup`, two filter chips `All` and
   `Unpaid`, then rows, then `See all 23 packages`.
8. On day one, in place of 6 and 7: the teaching card.

**Primary action.** The `Add package` tile. It is the largest, leftmost,
thumb-nearest element. **Secondary.** The `Find package` tile.
**Tertiary.** Stat tiles, filter chips, rows, `See all`, the work chip.

`P2 check` Two tiles of equal size looks like two primary actions. It is
permitted here, and only here, because they are not alternatives — they
correspond to two different events in the world, and the person always knows
which has happened. Weighting one would slow down half of all uses. This is a
deliberate, single exception and it is not to be generalised.

**States.**

| State | What the person sees |
|---|---|
| loading | Skeleton shapes matching the real layout. Tiles render immediately — they need no data. |
| first day | Teaching card, no stats, no list |
| ready | Stats + list |
| filtered empty | `Nothing unpaid` / `Every package waiting for pickup has been paid for.` |
| error | `Could not load your packages.` / `Try again` — tiles still work |
| offline | Amber strip; everything else still works |
| needs setup | Setup banner above everything else |
| work waiting to send | chip reads `Waiting to send` |
| something needs a decision | chip reads `Needs a look` and goes straight to it |

**Copy.**
- `Good morning` / `Good afternoon` / `Good evening`, with `, {name}` appended
  only when the name is known
- `Add package` / `A package arrived` · `Find package` / `A customer is here`
- `Waiting` · `Unpaid` · `Today` · `1 package` / `7 packages`
- `See packages waiting for pickup` · `See packages that still owe money` ·
  `See packages collected today` (screen-reader descriptions)
- `Waiting for pickup` · `All` · `Unpaid` · `See all 23 packages` ·
  `Open Chinedu's package`
- `Unpaid` · `Part paid` · `Paid` · `Today` · `Yesterday` · `3 days`
- Teaching card: `Your first package` / `Type the customer's phone number.` /
  `Type the amount.` / `Tap Save.` /
  `ParkDrop texts your customer their pickup code.`
- `Nothing unpaid` / `Every package waiting for pickup has been paid for.`
- `Loading your packages` · `Could not load your packages.` / `Try again`
- `No internet. You can still add and find packages.`
- Setup: `Add your park name. Customers see it in the SMS.` /
  `Add your pickup point name. Customers see it in the SMS.` /
  `Add your shop phone number so customers can call you.` / `Add now`
- Work chip: `All saved` · `Sending…` · `Waiting to send` · `No internet` ·
  `Needs a look` · hint `Where your packages are kept`

**What happens next.** Add tile → Add package. Find tile → Find package.
`Waiting` → Packages, Waiting tab. `Today` → Packages, Collected tab.
`Unpaid` → **see below**. A row → that package. `See all` → Packages, Waiting.
Chip → the work sheet, or straight to Attention when something needs a decision.

**What changes and why.** Home is largely right and is kept. Three changes:

1. **`Unpaid` must navigate like its neighbours.** Today it silently narrows the
   list in place, because the Packages screen filters by status and unpaid is a
   payment state. Two tiles that go somewhere and one that does something else
   teaches a person that tapping is unpredictable. The fix is on the Packages
   screen (§3.3.17): `Unpaid` becomes a first-class filter that can be arrived
   at directly, and the Home tile then navigates like the others.
2. **The chip gains a fourth word, `Waiting to send`.** Today "All saved" covers
   both "everything has reached ParkDrop" and "everything is safely on this
   phone", which are different facts and P8 forbids merging them.
3. **The `#FDE68A` hard-coded border on the offline strip** moves to the warning
   border token.

---

### 3.3.15 Add package

**Purpose.** Get a package onto the shelf and the customer texted, in under
twenty-five seconds, with a customer watching.

**Content and hierarchy.** One screen, revealing progressively. Blue header with
`Close` and `Help`. White sheet. Pinned Save button.

1. **Phone**, focused on open, number pad up. Label
   `Customer's phone number`, placeholder `0803 123 4567`, formatting as they
   type into `0803 123 4567`, a `Clear` word-button.
2. **Suggestions**, from the third digit: up to four known customers, each row
   48px, name at 18px and number at 16px.
3. **Who**, once the number is complete:
   - Known customer → a chip: their name at 18px bold, and beneath at 16px
     `Collected 3 before` or `Has 1 package waiting`, with a `Change`
     word-button. The name field never appears.
   - Unknown → the name field, labelled `Name (you can skip this)`.
4. **Amount.** Label `Amount to pay`, a large field with `₦` fixed at the left,
   decimal keypad, helper `Type 0 if there is nothing to pay.`
5. **Amount chips**: `Nothing to pay`, `Last ₦2,000`, then the two most frequent
   amounts. 48px, 16px text.
6. **Photo**, optional: a dashed-outline button reading `Add photo (optional)`
   with a camera icon. Once taken: a thumbnail, the words `Photo added`, and
   `Retake` / `Remove`.
7. **Duplicate notice**, if applicable, amber, non-blocking.
8. **Save**, pinned: `Save package`, 60px, full width.

**Primary.** `Save package`. **Secondary.** None. **Tertiary.** `Close`,
`Change`, `Clear`, `Retake`, `Remove`, the chips, the suggestions.

**States.** empty · typing phone · suggestions showing · known customer matched
· unknown customer · amount empty on save · phone incomplete on save ·
photo processing · duplicate waiting · saving · save failed · leaving with
unsaved work · offline (unchanged — this screen is fully offline-capable and
says nothing about the network, because nothing about it is different).

**Copy.**
- `Add package` · `Close`
- `Customer's phone number` · `0803 123 4567` · `Clear phone number`
- `Enter the 11-digit phone number, like 0803 123 4567.`
- `Known customers`
- `Collected 1 before` / `Collected 3 before` · `Has 1 package waiting` /
  `Has 2 packages waiting` · `Change`
- `Name (you can skip this)` · `Chinedu Okafor` · `Clear name`
- `Amount to pay` · `Type 0 if there is nothing to pay.` ·
  `Type the amount. Type 0 if there is nothing to pay.`
- `Nothing to pay` · `Last ₦2,000`
- `Add photo (optional)` · `Photo added` · `Retake` · `Remove`
- `Chinedu already has 1 package waiting.` /
  `Chinedu already has 2 packages waiting.`
- `Save package` · `Saving…`
- Save failed: `Could not save. Your details are still here. Tap Save package
  again.`
- Leaving: `Leave without saving?` / `Your entered details haven't been saved
  yet.` / `Stay` / `Leave`

**What happens next.** Save → the Saved screen, immediately, on the local write.
Close with typed data → the leave dialog. Close with nothing → back.

**What changes and why.** This screen is very good and is largely kept. Four
changes:

1. **The photo label.** Today the button reads `Package photo (optional)`, which
   labels a noun. It becomes `Add photo (optional)` — the verb the person
   performs, per §4 of the glossary.
2. **The save-failure message** moves into the feature's strings file and is
   rewritten. The current `Could not save package. Please try again.` breaks P9:
   it does not say the typed work is safe, which is the person's actual fear.
3. **The `Photo added` confirmation** is currently a hard-coded green hex. It
   moves to the success token and gains a tick icon, per P3.
4. **The nameless-customer rule changes.** Today, skipping the name stores the
   phone number *as* the name, so the person later appears everywhere as
   `08031234567` — including in the heading `Release to 08031234567?`. Instead,
   a customer with no name is displayed as `No name yet` with the number
   beneath, and the release dialog reads `Release to this customer?`. This is a
   display rule; whether the stored value changes is an engineering decision.

---

### 3.3.16 Package saved

**Purpose.** Tell the attendant the exact thing to write on the parcel, confirm
the customer has been texted, and get them straight to the next package.

**Content and hierarchy.**

1. A green tick that pops once, 64px.
2. `Saved` at 30px.
3. `Write this on the package:` at 18px.
4. **The pickup code**, the largest thing on any screen in the product:
   monospace, 48px, letter-spaced, near-black on white, in a bordered card.
5. Beneath it, 18px: `Package number PD-8K42Q`.
6. **SMS state**, with an icon and words:
   - `SMS sent to 0803 123 4567` with a tick
   - `Sending SMS…` with a moving arrow
   - `SMS will send when you are online.` with a clock
   - `No SMS credits left. Your customer was not texted.` with a filled warning
     and a secondary button `Buy SMS credits`
7. Primary: `Next package`.
8. Tertiary: `Go home`, `Tell customer on WhatsApp`, `Add photo`.
9. For a short window, a tertiary `Undo (7)`.

**Primary.** `Next package`. **Secondary.** `Buy SMS credits`, only in the
zero-credit state. **Tertiary.** the rest.

**States.** saved + SMS sent · saved + SMS sending · saved + offline ·
saved + no credits (partial success) · undone.

**Copy.** As listed, plus `Package cancelled.` after an undo, and `Go home`.

**What happens next.** `Next package` → a clean Add package with the keyboard
already up and the phone field focused, without a screen transition that costs
time. `Undo` → cancels the package and returns to Home.

**What changes and why.** Two changes.

1. **The zero-credit partial-success state is added.** Today the screen can say
   the package is saved while the customer was silently not texted, which is the
   precise failure P4 and P8 exist to prevent — the attendant tells the customer
   "you'll get a text", and no text comes.
2. **The pickup code gets bigger and gains the `Write this on the package:`
   instruction above it rather than beside it.** The instruction is already
   there and is good; the hierarchy makes it unmissable.

---

### 3.3.17 Packages list

**Purpose.** Answer "what is physically on my shelf right now?" and let the
attendant narrow it without setting anything up.

**Content and hierarchy.**

1. Header: title `Packages` at 30px, the work chip beneath it.
2. A search field, 56px, `Search name, phone or code`, with a `Clear`
   word-button.
3. **Status tabs**, each showing an exact live count:
   `Waiting 23` · `Collected 8` · `Other 2`. 56px tall, the selected one with a
   4px blue underline **and** bold text **and** a filled background — three
   channels, per P3.
4. **Filter chips** for the current tab, 48px:
   - Waiting: `Unpaid` · `3+ days` · `7+ days`
   - Collected: `Today` · `This week` · `Owing`
   - Other: `Returned` · `Cancelled`
5. A summary line: `23 packages` or `4 of 23 packages` when filtered, with a
   `Clear` word-button beside it when filters are on.
6. `Newest first` as a tertiary word-button opening the sort sheet.
7. **Age group headings** where they apply: `7 days or more` · `3 to 6 days` ·
   `Today and yesterday`.
8. **Rows**, 84px each, the whole row tappable:
   - Line 1: customer name at 18px bold, left; payment chip right
   - Line 2: phone at 16px, then `·`, then the package number in monospace
   - Line 3: age at 16px left; amount at 18px bold right
   - A small `Waiting to send` clock at the far right of line 1 if unsent
9. `Show 30 more` as a secondary button at the end.

**Primary.** None — this is a place, not a task. The rows are the content.
**Tertiary.** Everything else.

**States.** loading · has results · filtered to nothing · tab empty first time ·
search no results · error · offline · partially unsent.

**Copy.**
- `Packages` · `Search name, phone or code` · `Clear search`
- `Waiting` · `Collected` · `Other` · `Returned` · `Cancelled`
- `Unpaid` · `3+ days` · `7+ days` · `Today` · `This week` · `Owing`
- `Clear` · `Newest first` · `Oldest first` · `Highest amount` ·
  `Sort packages`
- `7 days or more` · `3 to 6 days` · `Today and yesterday`
- `Unpaid` · `Part paid` · `Paid` · `Nothing to pay` · `Waiting to send`
- `Today` · `Yesterday` · `3 days`
- Empties: `No unpaid packages. Everyone has paid.` ·
  `Nothing has waited 7 days or more.` · `No packages here yet.` ·
  `Nothing found.` / `Check the number, or add a new package.`
- `Could not load your packages. Tap Try again.` / `Try again`
- `Show 30 more` · `Add package`

**What happens next.** A row → that package. `Add package` (in the empty state)
→ Add package. Search → filters in place across tabs.

**What changes and why.** Three changes.

1. **`Unpaid` becomes arrivable from outside**, so the Home stat tile can
   navigate here instead of behaving differently from its neighbours (§3.3.14).
2. **Tab selection gains a third channel.** Today it is carried by colour and
   an underline; bold weight is added.
3. **An `Add package` route from a non-empty list is added** as a tertiary
   word-button beside the summary line. Today, with results on screen, there is
   no way to add a package without returning to Home. This is a small tax on an
   experienced attendant and a dead end for a new one.

---

### 3.3.18 Sort sheet

**Purpose.** Change the order of the list.

**Content.** A bottom sheet. Title `Sort packages` at 22px. Three full-width
48px rows, each a word plus a tick on the selected one: `Oldest first`,
`Newest first`, `Highest amount`. One tertiary `Close`.

**States.** open · closed. No loading, no error — it changes nothing remote.

**What happens next.** Tapping a row applies the order and closes the sheet
immediately. No "Apply" button; an extra confirmation for a reversible,
immediately-visible change is a step with no purpose.

**What changes and why.** Keep, with the selected state carrying a tick as well
as colour.

---

### 3.3.19 Find package

**Purpose.** Put a specific customer's package on screen in seconds while they
stand there.

**Content and hierarchy.**

1. Blue header: `Back`, the title `Find package` at 30px, `Help`.
2. White sheet.
3. One field, 68px, focused on open, 25px text:
   `Name, phone, code or package number`, with a `Clear` word-button.
4. Before typing: three example lines at 16px showing what can be typed —
   `Chinedu` · `0803 123 4567` · `K4M7P2Q` · `PD-8K42Q`. Recognition, not recall.
5. Results as rows, identical in shape to §3.3.17's rows.
6. Cross-shelf results carry a 16px line: `At {other pickup point}`.
7. Unsent results carry the `Waiting to send` clock.

**Primary.** None; the field is the screen. **Tertiary.** `Back`, `Clear`,
`Add package` in the no-results state.

**States.** empty (examples showing) · typing · results · no results ·
no results while offline · error.

**Copy.**
- `Find package` · `Name, phone, code or package number` · `Clear search`
- `You can type:` then the four examples
- `Nothing found.` / `Check the number, or add a new package.` /
  `Add package`
- Offline no-results, which must **not** claim the package does not exist:
  `Nothing found on this phone.` / `You have no internet, so ParkDrop can only
  look at what is saved here. Check again when you are online.`
- `At Ojota Park counter`

**What happens next.** A result → that package. `Add package` → Add package with
the typed phone number carried over, if the query looked like a phone number.

**What changes and why.** This screen is the clearest half-migrated surface in
the app and it needs the most work of any screen that is not being redesigned
outright:

1. **It has no background colour.** Its class name is invalid, so the page
   renders on whatever is behind it.
2. **Its header is the old white sticky bar with a bare back chevron**, while
   its result rows are new. Both move to the blue-header-and-sheet pattern.
3. **The examples-before-typing block is new.** An empty search screen with a
   blinking cursor is a blank wall to someone who has never used one. Showing
   four things they could type converts recall into recognition, which is one of
   the few places where the low-literacy research direction is unambiguous.
4. **The offline no-results copy is made explicit.** The classifier and ranking
   logic behind this screen are excellent and unchanged.

---

### 3.3.20 Package detail

**Purpose.** Show everything known about one package and carry out the one
thing that is due to happen to it next.

**Content and hierarchy.** Top to bottom, in this order, because it matches the
order the attendant needs it while facing a customer:

1. Blue header: `Back`, `Package` at 22px, `Help`.
2. **Identity**: customer name at 30px bold (or `No name yet`), phone at 18px
   tabular beneath it, and the status word as a chip with icon at the right.
3. **Pickup code card** — the thing being checked against the customer's phone.
   Label `Customer's pickup code` at 16px, the code in monospace at 40px,
   caption `Ask the customer to show this code.` at 16px.
4. **Payment card.** `Payment` at 18px. Three rows at 18px, right-aligned
   figures: `Amount ₦3,500` · `Paid ₦1,000` · `Balance ₦2,500` — the balance
   in bold and, when non-zero, amber. A tertiary `Record payment`.
5. **Customer card.** Two secondary buttons side by side, each with icon **and**
   word: `Call` and `WhatsApp`.
6. **Photo card**, if present: the image, tappable to full screen, with
   `Add photo` / `Retake` / `Remove`.
7. **Package info.** `Received` with the real date and time · `Received by`
   with the staff name · `Package number` · `Pickup point`.
8. **Activity**: a short list of what has happened, each line a plain sentence
   with a real time.
9. **The pinned action bar**, always visible above the safe area.

**Primary action**, exactly one, decided by state:

| Package state | Primary | Secondary | Tertiary |
|---|---|---|---|
| Waiting, money owed | `Collect ₦2,500 and release` | — | `Record payment only`, `More` |
| Waiting, nothing owed | `Release package` | — | `More` |
| Collected | *(none — a green banner instead)* | — | `Undo release` |
| Returned | *(none — a grey banner)* | — | — |
| Cancelled | *(none — a red banner)* | — | — |

`More` opens a sheet with the two rare, deliberate actions:
`Mark as returned to sender` and `Cancel this package (entered by mistake)`.
They live behind a labelled word, never behind a `⋯`.

**States.** loading · ready (×4 by status) · not found · offline · unsent ·
photo upload failed · SMS failed · sync conflict.

**Copy.**
- `Package` · `Back` · `More`
- `Customer's pickup code` · `Ask the customer to show this code.`
- `Payment` · `Amount` · `Paid` · `Balance` · `Record payment`
- `Call` · `WhatsApp`
- `Photo` · `Add photo` · `Retake` · `Remove` · `Photo attached`
- `Package info` · `Received date and time` · `Received by` ·
  `Package number` · `Pickup point`
- `Finish pickup point setup to show the location name.`
- `Saved on this phone. It sends when you are online.`
- `Activity` · `See all` · `Received 10:42 am by Chinedu` ·
  `Released 4:18 pm by Amina`
- `SMS sent` · `Sending SMS…` · `SMS not sent. Tap to try again` ·
  `SMS will send when you are online.`
- `Collect ₦2,500 and release` · `Release package` ·
  `Record payment only` · `Undo release`
- Banners: `Collected on 12 Sep, 4:18 pm by Amina` · `Owing ₦2,500` ·
  `Returned on 12 Sep` · `Cancelled on 12 Sep`
- Not found: `Package not found` /
  `This package is not on this phone. If you are offline, connect and check
  again.` / `Back`
- New, conflict: `This package was changed on another phone.` /
  `Another phone collected this package at 4:18 pm. That is the version
  ParkDrop kept.` / `OK, I understand`

**What happens next.** Primary → the release dialog (§3.3.21).
`Record payment only` → the payment sheet (§3.3.22). `More` → the more sheet.
`Call` → the dialler. `WhatsApp` → WhatsApp with a pre-filled message.
`Undo release` → returns the package to Waiting and says so.

**What changes and why.** Three changes, one of them urgent.

1. **The banners must show the real date and time.** Today they display
   hard-coded literals: every collected package claims it was collected *today
   at 8:10 pm*, and every returned or cancelled package claims *today*,
   regardless of the truth, which the record holds. In a product whose only
   purpose is to be the trustworthy account of what happened to someone else's
   parcel, a screen that states a confident falsehood about when it was handed
   over is the most serious defect in the app. It is a small fix and it is the
   first thing to do.
2. **The hard-coded hex colours in the action bar** (nine of them) move to
   tokens. The bar is the one place in the product where colour currently
   carries meaning on its own; each banner also gains an icon, per P3.
3. **The not-found copy gains the offline explanation.** "Could not be found in
   your active account" tells a person nothing they can act on and quietly
   implies the package does not exist, which the phone cannot know while
   offline.

**Explicitly kept:** the state-driven single primary action; the
`Collect ₦X and release` label that puts the amount *in the button*, which is
the single best piece of copy in the product for preventing a package being
handed over unpaid; the append-only payment model; and the decision to show the
pickup code for visual comparison rather than requiring it to be typed (see
§9.3).

---

### 3.3.21 Release dialog

**Purpose.** Make the attendant check the code against the customer's phone, and
make the money owed impossible to miss, before a package leaves the shelf.

**Content.** A dialog, not dismissible by tapping outside.

1. Title 22px: `Release to Chinedu Okafor?` — or `Release to this customer?`
   when there is no name.
2. A card: `Check the customer's pickup code` at 16px, then the code in
   monospace at 32px.
3. If money is owed: an amber block with a warning icon, `Balance` and the
   amount at 18px bold.
4. Actions:
   - owed: primary `Collect ₦2,500 and release`, secondary
     `Release without payment`, tertiary `Not yet`
   - clear: primary `Yes, release`, tertiary `Not yet`

**States.** open · submitting · failed · conflict (another phone already
collected it).

**Copy.** As above, plus `Released PD-8K42Q` as the confirmation, `Undo (7)`,
and the conflict message from §3.3.20.

**What happens next.** Release → the dialog closes, the detail screen shows the
collected banner, and a confirmation appears with an undo window.

**What changes and why.** **Keep as is**, except that `Release without payment`
is a genuinely consequential act and gains one more line of copy above the
button: `The customer will still owe ₦2,500.` The dead, unused release sheet
elsewhere in the codebase — which required the code to be *typed* — is discussed
in §9.3.

---

### 3.3.22 Record payment sheet

**Purpose.** Record money handed over, correctly, in one tap where possible.

**Content.**

1. Title `Record payment` at 22px.
2. A summary line: `Balance ₦2,500` at 18px.
3. A one-tap chip: `Full balance ₦2,500`, 56px, prominent.
4. `Part payment` as a tertiary word-button, which reveals the amount field.
5. When revealed: an amount field with `₦` fixed, decimal keypad.
6. **How the money came**, four chips at 48px, each icon + word:
   `Cash` · `Transfer` · `POS` · `Other`. Cash is pre-selected.
7. Primary `Record ₦2,500`, the amount in the button.
8. Tertiary `Close`.
9. At 15px beneath: `ParkDrop never takes any of this money.`

**States.** default · part payment revealed · amount over balance · amount zero
· saving · saved · offline (works normally; the sheet says nothing about the
network).

**Copy.** `Record payment` · `Balance ₦2,500` · `Full balance ₦2,500` ·
`Part payment` · `Cash` · `Transfer` · `POS` · `Other` · `Record ₦2,500` ·
`Payment recorded` · `Close` · `ParkDrop never takes any of this money.` ·
over-balance: `That is more than the ₦2,500 owed. Type ₦2,500 or less.` ·
zero: `Type how much the customer gave you.`

**What happens next.** Record → the sheet closes, the payment card updates, a
confirmation appears. If the balance reaches zero, the action bar's primary
changes to `Release package` in the same moment, visibly.

**What changes and why.** The trust line is new, and it is the most important
addition in this plan after the date bug. An operator handling other people's
money on an app they did not choose will assume, reasonably, that the app takes
a cut. The Help content already says ParkDrop does not — buried in an article
nobody reads. It belongs at the point of fear. The four method chips gain icons,
and `Cash` is pre-selected because it is overwhelmingly the common case in a
motor park.

`ASSUMPTION` Cash is the right default. **What would change it:** the product
owner's own transaction data. See §9.

---

### 3.3.23 Return and cancel sheets

**Purpose.** Let an attendant deliberately take a package off the shelf for a
reason that is neither collection nor mistake — and separately, correct a
mistake.

**Content (return).** Title `Send this package back?` · body
`Use this when the package is going back to whoever brought it.` · a labelled
list of reasons as 48px rows with a tick on selection · an optional note field
labelled `Anything else? (you can skip this)` · primary `Send it back` ·
tertiary `Not yet` · an amber block if money has already been paid.

**Content (cancel).** Title `Cancel this package?` · body
`Use this only if the package was never really here — you added it by
mistake.` · reasons · note · primary `Yes, cancel it` · tertiary `Keep it`.

**States.** open · reason not chosen (the primary is disabled and a 16px line
reads `Pick a reason to continue.`) · payment already made · saving · conflict.

**Copy.** As above, plus `This customer already paid ₦1,000. You will need to
give it back yourself. ParkDrop cannot do it.` — which is the honest statement
of what the app can and cannot do, and belongs exactly here.

**What happens next.** Confirm → back to the detail screen with the appropriate
banner.

**What changes and why.** Titles change from `Mark as returned to sender` and
`Cancel this package (entered by mistake)` — which are labels for a menu, not
questions for a dialog — into questions with the distinction between the two
spelled out in one sentence each. The two actions are easy to confuse and have
very different meanings in the record.

---

### 3.3.24 Customers list

**Purpose.** Find a person, when the attendant knows the person but not the
package.

**Content.** Title `Customers` at 30px with the count beneath at 16px
(`124 customers`). A 56px search field, `Search name or phone`. Rows at 84px:
name at 18px bold, phone at 16px tabular, and a third line `2 waiting · 7 in
total` at 16px. `Show 50 more` as a secondary button.

**Primary.** None — a place. **Tertiary.** search, `Clear`, rows, `Show 50 more`.

**States.** loading · has results · no search results · no customers at all ·
error · offline.

**Copy.** `Customers` · `124 customers` · `Search name or phone` ·
`Clear search` · `2 waiting · 7 in total` · `No customers found` /
`Try another name or phone number.` / `Clear search` · `No customers yet` /
`Customers appear here when you add packages.` / `Add package` ·
`Show 50 more`

**What happens next.** A row → that customer.

**What changes and why.** Four changes, all of them the general Language B
corrections applied here:

1. The count moves out of a 12px pill and becomes a readable line.
2. Row subtitles move from 12px to 16px.
3. The bare `X` clear button gains the word `Clear`.
4. The `Add package` button in the header is **removed**. Adding a package from
   a customer *list* is adding it for nobody in particular; the useful place for
   that button is the customer *detail* screen, where it already is and where it
   carries the customer with it. The empty state keeps its `Add package`, which
   is a teaching prompt rather than a shortcut.
5. "when you record packages" → "when you add packages" (`record` is banned).

---

### 3.3.25 Customer detail

**Purpose.** Show one person's packages so an attendant can act on the right one.

**Content and hierarchy.**

1. Blue header: `Back`, `Help`.
2. Name at 30px bold (or `No name yet`), phone at 18px tabular beneath.
3. Two secondary buttons side by side, icon **and** word: `Call`, `WhatsApp`.
4. A line at 16px: `2 waiting · 7 in total`.
5. **Waiting packages**, heading `Waiting for pickup (2)` at 18px, then package
   cards identical in shape to the list rows in §3.3.17.
6. **Earlier packages**, heading `Earlier packages (5)`, then compact rows with
   status chips.
7. Primary, pinned: `Add package for this customer`.

**Primary.** `Add package for this customer`. **Secondary.** `Call`, `WhatsApp`.

**States.** loading · ready · no waiting packages · not found · offline.

**Copy.** `Back` · `No name yet` · `Call` · `WhatsApp` ·
`2 waiting · 7 in total` · `Waiting for pickup (2)` · `Earlier packages (5)` ·
`No packages waiting` / `New packages for this customer will show here.` ·
`Add package for this customer` · `Customer not found` /
`This customer is not on this phone. If you are offline, connect and check
again.` / `Back`

**What happens next.** A package → that package. Primary → Add package with this
customer already filled in.

**What changes and why.** Five changes: the bare phone icon gains the word
`Call`; the `Add package` chip becomes a full pinned primary button with a
label that says *for this customer*; the uppercase letter-spaced section
headings become sentence case at 18px; the 10px `Local` badge becomes the
standard `Waiting to send` clock-and-words treatment; and `Recent history`
becomes `Earlier packages`.

---

### 3.3.26 More / Settings

**Purpose.** Reach the things that are not part of serving a customer.

**Content and hierarchy.** This screen is rebuilt.

1. Title `Settings` at 30px.
2. **Who you are** card: `Signed in as` at 16px, the name at 22px bold, the
   email at 16px, then `You are the owner here` / `You are a manager here` /
   `You are an attendant here` at 16px. The business name at 18px with the label
   `Your shop`.
3. **Rows**, each 64px, each with a 28px icon, an 18px label, a 16px subtitle,
   and a right chevron. Grouped under 18px sentence-case headings:

   **Your day**
   - `Things to check` — `Anything that needs you to decide` — with a count
   - `Your day` — `What happened today` *(owner and manager only)*

   **Messages to customers**
   - `SMS credits` — `How many SMS you have left` — with the balance

   **Your shop** *(owner and manager only)*
   - `Your team` — `Who can use ParkDrop here`
   - `Shop details` — `Your name, your park, your phone number`

   **This phone**
   - `This phone` — `Which phones are signed in`

   **Getting help**
   - `How to use ParkDrop` — `Step-by-step guides`
   - `About ParkDrop` — `Version and privacy`

4. At the bottom, separated by a gap: a secondary `Sign out` and, beneath a
   further gap, a destructive `Sign out and forget me on this phone`.

**Primary.** None. **Secondary.** `Sign out`. **Destructive.** the forget action.

**States.** default · attendant (four rows hidden entirely, never disabled) ·
offline (rows that need internet carry a 16px `Needs internet` line rather than
failing on tap) · loading a badge.

**Copy.** As listed. In particular, gone: `Settings & More`,
`Business Administration`, `Support & Guides`, `Workspace:`,
`Operational exceptions & retries`, `Customer notification balance`,
`Offline-ready instructions & best practices`, `Account & Security`,
`Reset Device Identity`, `Version 1.0.0, diagnostics, and privacy`.

**What happens next.** Each row opens its screen. `Sign out` → a confirmation.
The forget action → the confirmation in §3.3.9.

**What changes and why.** This is the largest single change in the plan, and the
most necessary. As it stands, More is where the app stops being the app the
person learned during sign-in:

1. **Every size goes up.** Section headings from 12px uppercase to 18px sentence
   case; row labels from 14px to 18px; subtitles from 12px to 16px; rows from
   52px to 64px; the sign-out buttons from 12px text at 44px to 18px at 56px.
   The settings area of an app for people reading slowly in sunlight is
   currently set at 10–12px throughout.
2. **Every heading and every subtitle is rewritten.** The current copy is the
   densest concentration of banned vocabulary in the product: *Operations*,
   *Business Administration*, *Operational exceptions & retries*, *Workspace*,
   *Customer notification balance*, *Offline-ready*, *diagnostics*,
   *Reset Device Identity*. `Reset Device Identity` in particular is a
   destructive, irreversible-feeling action, given no explanation, styled in red,
   sitting directly beneath `Sign Out` with no confirmation — a first-time user
   has no way to tell which of the two red-ish buttons is the safe one.
3. **Title Case goes.** `Settings & More` → `Settings`. The screen is not two
   things.
4. **Role is stated in a sentence**, not carried by an uppercase pill reading
   `OWNER`, which means nothing to a person who was never told what a role is.
5. **This screen is live in two places.** The version the user sees is an inline
   copy inside the app's navigation file; the extracted Settings screen is dead
   behind the unwired router. Both must be reconciled before this is built, or
   the work will be done to the file nobody sees.

---

### 3.3.27 Things to check (Attention)

**Purpose.** Show the small number of things that actually need a decision, and
nothing else.

**Content.** Blue header, `Back`, title `Things to check`, `Help`. A line:
`2 things need you.` Then cards, each 18px title, 16px explanation, and one
secondary button. An offline strip when applicable. The empty state is the
normal case and should feel like one.

**Primary.** None at screen level; each card has its own single action.

**States.** loading · has items · empty · offline · action blocked offline.

**Copy.**
- `Things to check` · `1 thing needs you.` / `2 things need you.`
- Empty: a calm illustration, `Nothing to check.` /
  `Everything is going fine. We will tell you here if that changes.`
- Photo failed: `A photo did not send.` /
  `Chinedu's package photo is still on this phone.` / `Send it again`
- Zero credits: `You have no SMS credits.` /
  `Your customers are not being texted when their packages arrive.` /
  `Buy SMS credits` *(owner/manager)* or `See SMS credits` *(attendant)*
- Low credits: `You have 3 SMS credits left.` /
  `When they run out, your customers stop being texted.` / `Buy SMS credits`
- Collection clash: `This package was collected on another phone.` /
  `Amina collected Chinedu's package at 4:18 pm. ParkDrop kept that.` /
  `See the package`
- Purchase pending: `We are still checking your payment.` /
  `This can take a few minutes.` / `Check again`
- Offline strip: `No internet. Showing what is saved on this phone.`
- Blocked offline, shown **on the card** rather than as a toast:
  `You need internet to do this.`

**What happens next.** Each action goes to the one place that resolves it. Items
disappear by themselves when the underlying situation resolves.

**What changes and why.** Three changes.

1. **`Attention` becomes `Things to check`.** *Attention* as a noun labelling a
   screen is an abstraction; it does not tell a person what they will find.
2. **Offline blocking moves from toasts onto the cards.** A toast that appears
   at the bottom of the screen after a tap at the top is missed by a person who
   is looking at their finger, and it disappears before a slow reader finishes
   it. The card itself should say the action needs internet, *before* it is
   tapped.
3. **Every message is rewritten from a system event into a consequence.** "Photo
   upload failed" is a fact about the app; "A photo did not send — Chinedu's
   package photo is still on this phone" is a fact about the person's work.

**Explicitly kept:** the entire underlying philosophy — a projection over real
state, no notification bell, no unread counts, no "Clear all", automatic
resolution, and complete silence when things are going well. It is the best
architectural decision in the product and the copy should live up to it.

---

### 3.3.28 Your day (Daily operations)

**Purpose.** Tell the owner what happened today, in facts, without pretending to
be analytics.

**Content.**

1. Blue header, `Back`, `Your day`, `Help`.
2. A date strip: `‹ Today ›` with the full date beneath at 16px
   (`Monday, 12 September`). Forward is disabled and, when tapped, says
   `Tomorrow has not happened yet.`
3. A scope choice, two 48px chips: `This shop` / `All my shops` — only when
   there is more than one pickup point.
4. **Packages** section, four big figures with words beneath, 18px labels and
   30px numbers: `Came in` · `Collected` · `Sent back` · `Cancelled`. For today
   only, a fifth line: `Still waiting now: 23`.
5. **Money** section: `Money recorded today` at 30px, then a breakdown by
   method, each a row with the word and the amount.
6. **What happened** — a plain list of the day's events in time order.
7. A secondary button: `Save a copy for your computer`.

**Primary.** None. **Secondary.** the export.

**States.** loading · ready · empty day · offline showing local · date not held
on this phone · export running · export failed · attendant arriving here
somehow.

**Copy.**
- `Your day` · `Today` · `Yesterday` · `Monday, 12 September` ·
  `Tomorrow has not happened yet.`
- `This shop` · `All my shops`
- `Packages` · `Came in` · `Collected` · `Sent back` · `Cancelled` ·
  `Still waiting now: 23`
- `Money` · `Money recorded today` · `Cash` · `Transfer` · `POS` · `Other`
- `What happened`
- Empty: `Nothing happened on this day.`
- Offline: `No internet. Showing what is saved on this phone.`
- Not held: `This day is not saved on this phone.` /
  `Connect to the internet to see it.`
- `Save a copy for your computer` · `Making your copy…` /
  `Could not make the copy. Check your internet and try again.`
- Denied: `Only the owner or a manager can see this.` /
  `Ask them to show you.`

**What changes and why.** Four changes.

1. **`Daily Operations & Reports` becomes `Your day`.** *Report* is a word that
   makes people who are not sure of their literacy stop reading.
2. **`Received` becomes `Came in`** and **`Returned` becomes `Sent back`**.
3. **`Export CSV` becomes `Save a copy for your computer`.** CSV is a file
   format; it is not a thing a person wants.
4. **`Africa/Lagos (WAT)` is removed from the header.** It is already the
   person's own time.

**Explicitly kept:** the refusal to call any of this revenue, sales, profit or
earnings; the refusal to draw charts; the refusal to show zeros for a day the
phone does not hold; and the CSV's omission of customer phone numbers and
pickup codes.

---

### 3.3.29 SMS credits

**Purpose.** Say how many customer texts are left and make it easy to get more.

**Content.** Blue header, `Back`, `SMS credits`, `Help`. Then the number
enormous — 64px — with `SMS left` beneath it at 18px. Then a plain sentence:
`Each package you add uses 1 SMS.` Then, by state, a coloured block. Then the
primary `Buy SMS credits`. Then `What you used them on`, a list of 64px rows
each reading e.g. `12 Sep · 1 SMS · Chinedu's package` or
`10 Sep · +50 SMS · You bought credits`.

**Primary.** `Buy SMS credits` (owner and manager). For an attendant there is no
primary; instead: `Ask your manager to buy more.`

**States.** healthy · low (1–4) · zero · loading · offline showing last known ·
attendant.

**Copy.**
- `SMS credits` · `47` · `SMS left` · `Each package you add uses 1 SMS.`
- Low: `You are running low.` /
  `When these run out, your customers stop getting a text with their pickup
  code.`
- Zero: `You have no SMS left.` /
  `Your customers are not getting their pickup code by text. You can still add
  and find packages.`
- `Buy SMS credits` · `Ask your manager to buy more.`
- `What you used them on`
- Offline: `No internet. This was 2 hours ago.`
- Empty history: `Nothing yet.`

**What changes and why.** Three changes. `Each package you add uses 1 SMS` is
new and is the sentence that makes the whole number mean something — a balance
of 47 is meaningless until it is 47 *packages*. The zero state now says what
still works, not only what does not. And the offline line says *how old* the
number is, rather than the current `Showing last synced balance. Will refresh
when connected.`, which uses a banned word and gives no age.

`ASSUMPTION` One SMS per package. **What would change it:** a reminder SMS
feature, or long names splitting a message into two segments — which the 130
character budget exists to prevent. See §9.

---

### 3.3.30 Buy SMS credits

**Purpose.** Take a person through a payment, with a clear head, and tell them
truthfully where it got to.

**Content.** A task screen — no bottom bar. Blue header with `Back` and `Help`.
Title `Buy SMS credits` at 30px. The current balance as one 16px line. Then
bundle cards, each 96px: the number of SMS at 30px bold, the price at 22px, and
a plain third line `Enough for about 200 packages`. Selection is shown by a
tick, a border and a fill. Then the primary `Continue to payment`. Then, at
15px: `You pay on the next screen. ParkDrop never sees your card.`

**Primary.** `Continue to payment`. **Tertiary.** `Back`.

**States.**

| State | What the person sees |
|---|---|
| loading bundles | skeletons |
| choosing | as above |
| nothing selected | primary disabled, with `Pick a bundle to continue.` |
| offline | the whole choice is replaced by: `You need internet to buy SMS credits.` / `Turn on your data and come back.` — bundles are not shown greyed |
| starting | `Getting your payment ready…` with the primary busy |
| at the provider | handed off |
| confirming | `Checking your payment…` / `Please wait. Do not close ParkDrop.` |
| pending | `We are still checking your payment.` / `This can take a few minutes. Your SMS will appear here when it is done. You can close ParkDrop.` / `Check again` |
| success | a tick, `Done. You now have 247 SMS.` / `Go back` |
| failed to start | `Could not start the payment. Try again.` / `Try again` |
| paid but unconfirmed | `Your payment went through. We are still adding your SMS.` / `This can take a few minutes.` / `Call us` |

**Copy.** As listed above.

**What happens next.** Success → back to SMS credits with the new balance
already showing. Pending → back to SMS credits, with a `Things to check` item
created so the person is not left wondering.

**What changes and why.** Three changes. The bottom bar is removed, because a
payment flow with five visible ways out is a flow people abandon half-finished.
`Enough for about 200 packages` is added, for the same reason as §3.3.29. And
the "paid but unconfirmed" state is specified, because it is the state that
actually frightens people — money has left and nothing has arrived — and it
currently has no words at all.

---

### 3.3.31 Your team (Staff)

**Purpose.** Let an owner or manager see who can use ParkDrop here, and change
that.

**Content.** Blue header, `Back`, `Your team`, `Help`. A count line. Then member
rows, 72px: name at 18px, email at 16px, and the role written as a sentence
fragment at 16px — `Can do everything` / `Can run the shop` /
`Can add and give out packages`. Then, if any: `Waiting to join` rows with the
email, when it was sent, and a `Send again` word-button. Primary:
`Invite someone`.

**Primary.** `Invite someone`. **Tertiary.** rows, `Send again`.

**States.** loading · ready · no team yet · offline (read-only, with a clear
line) · inviting · removing · last-owner guard.

**Copy.**
- `Your team` · `3 people` · `Can do everything` · `Can run the shop` ·
  `Can add and give out packages`
- `Waiting to join` · `Sent 2 days ago` · `Send again`
- `Invite someone`
- Offline: `No internet. You can see your team but not change it.` /
  `Turn on your data to invite or remove someone.`
- Last owner: `You cannot remove the last owner.` /
  `Make someone else an owner first, then you can remove yourself.`
- Empty: `It is just you for now.` /
  `Invite someone if you want help running this shop.`

**What happens next.** A row → the member actions sheet. Primary → the invite
sheet.

**What changes and why.** Roles are written as capabilities rather than as job
titles, because `ATTENDANT` in an uppercase pill tells a person nothing about
what that person can do, and the permission matrix is the only thing the reader
actually wants to know. The offline read-only state is made explicit rather than
letting a tap fail.

---

### 3.3.32 Invite someone

**Purpose.** Add one person to the team.

**Content.** A sheet. Title `Invite someone` at 22px. One email field, labelled
`Their email address`. Then `What can they do?` and role options as 64px rows,
each a title and a one-line explanation, with a tick on selection. Primary
`Send the invite`. Tertiary `Close`.

**States.** default · email empty · email malformed · already a member ·
already invited · sending · sent · offline · role not permitted (a manager sees
only the attendant option, with no greyed rows).

**Copy.** `Invite someone` · `Their email address` ·
`Type their email address.` · `Check the email. It should look like
name@gmail.com.` · `What can they do?` ·
`Add and give out packages` / `The everyday work at the counter.` ·
`Run the shop` / `Everything above, plus see your day and invite helpers.` ·
`Own the shop` / `Everything, including changing your shop's details.` ·
`Send the invite` · `Sending…` ·
`Invite sent. {name} will get an email.` ·
`{email} is already on your team.` ·
`You already invited {email}. You can send it again.` ·
`You need internet to invite someone.` · `Close`

**What changes and why.** Specified fully; the role explanations are the new
part.

---

### 3.3.33 Team member actions

**Purpose.** Change or remove one person.

**Content.** A sheet headed with their name at 22px and their email at 16px,
then up to two rows: `Change what they can do` and, destructively,
`Remove from your team`. Tertiary `Close`.

**States.** default · changing role · removing · last-owner guard · offline.

**Copy.** `Change what they can do` · `Remove from your team` ·
Confirmation: `Remove {name} from your team?` /
`They will not be able to open ParkDrop for this shop. Nothing they have
already done is deleted.` / primary `Keep them` / destructive `Remove them` ·
`{name} was removed.`

**What changes and why.** The confirmation's body is the important part: it
answers the real fear, which is that removing a person deletes their history.

---

### 3.3.34 Shop details (Business details)

**Purpose.** Let an owner correct the things a customer sees.

**Content.** Blue header, `Back`, `Shop details`, `Help`. Then grouped cards,
each with a label, the current value at 18px, and an `Edit` word-button:

- `Your shop's name` — the business name
- `Your pickup point` — the pickup point name
- `The park` — the park name
- `The number customers call` — the phone

Then, and this is the point of the screen, **the live SMS preview** — the same
component as first-run: `Your customers get this SMS:` with the message rendered
live from the current values.

If there is more than one pickup point, a list of them with their names and
which is active.

**Primary.** None at rest. Inside an edit sheet: `Save`.

**States.** loading · ready · editing · saving · saved · offline (read-only,
stated) · not permitted · validation failures identical to §3.3.6.

**Copy.** As above, plus the full set of pickup-point validation strings from
§3.3.6 reused verbatim, plus `No internet. You can see this but not change it.`
and `Only the owner can change this.`

**What changes and why.** The single significant change is **bringing the live
SMS preview onto this screen**. Today the preview exists only during first-run,
which means the one time a person can see the consequence of these names is the
one time they have never seen the product. An owner changing their park name six
months later currently gets no preview at all, and these fields are the ones the
customer reads. Everything else is the general Language B correction.

This is also by far the largest screen in the codebase at ~600 lines, and it
should be considered for splitting into the four editing sheets described.

---

### 3.3.35 This phone (Account & Security)

**Purpose.** Show which phones are signed in, and let a person sign one out.

**Content.** Blue header, `Back`, `This phone`, `Help`.

1. **Who you are**: name, email, and how you sign in — `You sign in with a code
   we send to your email.` No password section, because there is no password.
2. **This phone**: the device name, when it was first used, and a note that the
   PIN opens ParkDrop here. A tertiary `Change my PIN`.
3. **Other phones**: rows with a name and `Last used 12 Sep`, each with a
   `Sign this phone out` word-button.
4. At the bottom, the two sign-out actions from §3.3.26.

**Primary.** None. **Tertiary.** `Change my PIN`, per-device sign-out.

**States.** loading · ready · only this phone · offline (list shown with an age;
sign-out disabled with a reason) · signing out · lease expiring.

**Copy.**
- `This phone` · `You sign in with a code we send to your email.` ·
  `Your PIN opens ParkDrop on this phone.` · `Change my PIN`
- `Other phones` · `Last used 12 Sep` · `Sign this phone out`
- `Only this phone is signed in.`
- Confirmation: `Sign out {phone name}?` / `Whoever is using it will need a new
  code to sign in again.` / `Keep it signed in` / `Sign it out`
- Offline: `No internet. This list was 2 hours ago. You need internet to sign a
  phone out.`
- Lease: `ParkDrop needs to check who you are.` /
  `Connect to the internet in the next 3 days to keep using ParkDrop without
  signing in again.`

**What changes and why.** `Account & Security` becomes `This phone`, because
*account*, *security*, *session* and *device* are four abstractions where one
concrete noun does the job. The offline authorisation lease gets real words: it
is a thing that can lock a person out of their livelihood and it currently
expires without a warning a user would understand.

---

### 3.3.36 How to use ParkDrop (Help)

**Purpose.** Answer, offline, the questions a person actually stops on — and
never contradict the app.

**Content.**

1. Blue header, `Back`, `How to use ParkDrop`, and at the right, instead of
   `Help`, the words `Call us`.
2. **A person, first.** Before any article: a card reading `Talk to a real
   person.` / `We can see which screen you are on.` with two secondary buttons,
   `Chat on WhatsApp` and `Call us`. This is at the top, not the bottom,
   because someone who has opened Help has already failed to solve it alone.
3. **Guides**, as 72px rows with a 32px picture, an 18px title and a 16px line:

   | Title | Line |
   |---|---|
   | `Add a package` | `When a package arrives at your shop` |
   | `Give a package to a customer` | `When the customer comes to collect` |
   | `Take money` | `Cash, transfer, POS` |
   | `Find a package` | `By name, phone, code or number` |
   | `Pickup codes` | `What they are and why they matter` |
   | `When there is no internet` | `What still works, and what waits` |
   | `SMS credits` | `Why your customers get a text, and what it costs` |
   | `Send a package back` | `When it cannot stay on your shelf` |
   | `Your team` | `Who can do what` |

4. Each guide is one screen: a title, a short paragraph, then numbered steps
   written as instructions matching the real interface word for word, then, if
   useful, one `Good to know` note.

**Primary.** None. **Secondary.** `Chat on WhatsApp`, `Call us`.

**States.** default · a guide open · offline (everything works; Help is bundled,
and it says so once: `This works without internet.`).

**Copy.** Titles as above. Guide bodies are to be written against the final
interface, and every quoted button label must match the real one exactly.

**What changes and why.** This screen is rewritten completely. In its current
form it is the most damaging screen in the product, because it is where people
go when lost and it tells them things that are not true:

1. It says package numbers look like `PKG-1234`. They look like `PD-8K42Q`.
2. It tells the attendant to type the customer's pickup code and tap
   `Confirm package collected`. There is no such field and no such button; the
   live flow shows the code for comparison and the button reads
   `Collect ₦2,500 and release`. The Help is describing an unused component that
   is still in the codebase.
3. It tells them to tap `Add package` from the bottom navigation bar. There is
   no Add item in the bottom bar.
4. Its language is the densest jargon in the app: *offline-first*, *OTP*,
   *intake*, *authenticate*, *sync*, *device database*, *parcel*, and a raw
   `COLLECTED` enum.

Two standing rules follow. **Help copy quotes the real interface verbatim**, and
if a label changes the guide changes in the same change. And **help offers a
person before it offers an article**, at the top of the screen.

---

### 3.3.36b About ParkDrop

**Purpose.** Say which version this is, who is signed in, where the privacy
terms are, and give support a code to work from.

**Content and hierarchy.**

1. Blue header, `Back`, `About ParkDrop`, `Help`.
2. The ParkDrop mark at 64px, the wordmark at 22px, and the version at 16px
   written plainly: `Version 1.0.0`.
3. A card, each row a 16px label and an 18px value:
   - `Your shop` — the business name
   - `Signed in as` — the name and email
4. A card: `Code for support` with the diagnostic string in monospace at 22px
   and a `Copy` word-button. Beneath, at 16px:
   `If you call us, read out this code. It helps us find what went wrong.`
5. A row: `How we look after your information` with a chevron, opening the
   privacy notice.

**Primary action.** None — this is a reference screen, not a task.
**Tertiary.** `Copy`, the privacy row, `Back`.

**States.** default · copied (the button reads `Copied` for six seconds) ·
copy unavailable (the code stays selectable and the button is absent, never
present-but-broken) · privacy notice unreachable offline:
`You need internet to read this.`

**Copy.** `About ParkDrop` · `Version 1.0.0` · `Your shop` · `Signed in as` ·
`Code for support` · `Copy` · `Copied` · `If you call us, read out this code.
It helps us find what went wrong.` · `How we look after your information` ·
`You need internet to read this.`

**What happens next.** `Copy` puts the code on the clipboard and says so. The
privacy row opens the notice.

**What changes and why.** Three changes. `Data Protection & Privacy` becomes
`How we look after your information` — *data protection* is a legal term of art
and this audience will not read past it. The bare `Copy diagnostic code` icon
button gains the word `Copy` and an explanation of what the code is for, since
a copyable string with no stated purpose is noise. And the version, business and
account lines move from 12px to 16–18px with the rest of the type floor.

---

### 3.3.37 Help sheet (available everywhere)

**Purpose.** Reach a person from any screen without losing the screen.

**Content.** A bottom sheet. `Talk to a real person.` at 22px.
`We can see which screen you are on.` at 18px. Two secondary buttons:
`Chat on WhatsApp`, `Call us`. A tertiary `How to use ParkDrop`. A tertiary
`Close`.

**States.** default · offline (`You need internet for WhatsApp. You can still
call us.` — the call button stays, because a phone call does not need data,
which is exactly the point).

**What changes and why.** **Keep**, extended from the sign-in flow to the whole
app, and given the offline distinction between WhatsApp and a voice call. The
existing sheet already says *we can see which screen you are on*, which is a
small, good piece of trust-building: it tells the person they will not have to
explain where they are.

`ASSUMPTION` The support numbers in the code (`2348000000000`) are placeholders.
A `Help` link that reaches nobody is worse than none. See §9.

---

### 3.3.38 Install prompt sheet

**Purpose.** Get ParkDrop onto the home screen so it opens in one tap.

**Content.** `Put ParkDrop on your phone screen` at 22px. `So it opens in one
tap.` Then the two or three real steps for this browser, each with a picture of
the actual menu item. Primary `Add it` where the browser supports a prompt;
otherwise no primary and the steps carry it. Tertiary `Not now`.

**States.** prompt available · manual steps only · already installed (the sheet
never appears).

**What changes and why.** Keep. Add the explicit `Not now`, so declining is an
action rather than a dismissal — a person who does not know a sheet can be
dismissed by tapping outside it has no way out otherwise.

---

### 3.3.39 Leaving-with-unsaved-work dialog

Specified once here because it appears in several places.

**Content.** Title `Leave without saving?` · body `Your entered details haven't
been saved yet.` · primary `Stay` · destructive secondary `Leave`.

The **primary is `Stay`**, always. The safe option gets the strong treatment
everywhere in this product.

**What changes and why.** Keep. One rule added: this dialog may only appear when
something would actually be lost. A dialog that fires on an empty form teaches
people to dismiss dialogs without reading them, which is how they later lose
real work.

---

### 3.3.40 Screens proposed for removal

Two, both named rather than dropped silently.

**`/theme` — the theme demo.** A developer page reachable in production by
anyone who types the URL. It should be gated behind the same development check
as the Home preview harness. Nothing a user needs is on it.

**`/home-preview` — the Home state harness.** **Kept**, unchanged. It is already
dev-gated and dropped from the production bundle, and it is a genuinely valuable
tool: it lets the team look at Home in every state, which is precisely the
discipline P4 demands. It should be extended to the other screens rather than
removed.

---

## 4. Novice-user specifics

### 4.1 Reading level and vocabulary

The full banned-word list, the replacements, the fixed meanings of ParkDrop's
own words, the number and date conventions and the error pattern are in
`copy-glossary.md`. It is a separate file because it is long, because it will
grow, and because a writer needs it open beside them while a designer does not.

The enforcement mechanism matters as much as the list. **Every feature keeps all
of its user-visible words in one place, with the house rules written at the top
of that place.** Four features already do this and read visibly better than the
eleven that do not. The rule becomes universal: a screen may not contain a
hard-coded sentence.

### 4.2 Two different problems

Being unable to read fluently and being unfamiliar with apps are different
failure modes. ParkDrop's users often have both, but the fixes differ and
conflating them produces designs that help neither.

**Someone who reads slowly or with difficulty** needs:

- Fewer words, not simpler-looking ones. A short sentence beats a long sentence
  with easy words.
- Numbers, which are usually retained far better than text — hence codes,
  amounts and counts at the largest sizes on their screens.
- A picture beside every word, so the picture can be learned as a label for the
  word over repeated use. This is why P3 requires icon **and** word, not icon
  **or** word: over time the icon becomes readable *because* it has always
  appeared with its word.
- Consistent position. The same action in the same place on every screen means
  it can be found by location rather than by reading.
- No text that must be read under time pressure. This is why toasts are never
  the only carrier of important information (§3.3.27) — a message that vanishes
  in four seconds is a message that excludes slow readers by design.

**Someone who reads fine but has never used an app** needs:

- Every control to look like a control. A word that is tappable is in blue and
  has a 48px target; a word that is not, is not blue. No exceptions.
- No hidden affordances at all (§4.3).
- Explicit consequences before an action, not after.
- Back to mean back, reliably, including the hardware button.
- No assumption that a screen "obviously" scrolls. Where content continues below
  the fold, something is visibly cut off at the fold rather than ending neatly.

**Where the two conflict**, the reading difficulty wins, because it is the
harder constraint and the one that cannot be learned away in a week.

### 4.3 Interaction patterns excluded outright

These are not discoverable to a first-time user, and are therefore not permitted
anywhere in ParkDrop. A future builder must not reintroduce them.

| Excluded | Why |
|---|---|
| Swipe to reveal or delete | Invisible. No affordance at all. A person who never discovers it never knows the action exists; a person who discovers it by accident has destroyed something. |
| Long press for a menu | Invisible, and requires knowing to hold rather than tap. |
| Pull to refresh | Invisible, and unnecessary here: the data is local and live. A visible `Check again` word-button is used where refreshing is meaningful. |
| Pinch, two-finger gestures | Not one-handed. The attendant's other hand is holding a parcel. |
| Edge-swipe back | Invisible, and conflicts with the visible `Back`. |
| Bare `⋯` or `⋮` | A punctuation mark is not a label. Use the word `More`. |
| Hamburger `≡` | Same. The bottom bar carries `More` as a word. |
| Floating action button | A circle with a `+` and no word. Already removed from this product, deliberately; it stays removed. |
| Tooltips on long press or hover | Requires a hover state that does not exist on a phone. |
| Double tap | Undiscoverable and easy to trigger by accident. |
| Carousels with dot indicators | Dots are not a control a first-time user recognises. |
| Toast-only information | A message that disappears excludes slow readers. |
| Disabled controls with no explanation | A greyed button with no reason is a dead end. Either explain beside it or remove it. |

**The one sanctioned exception:** a bottom sheet may be dismissed by swiping it
down *in addition to* its visible `Close`. The swipe is a bonus for people who
already know it; the button is the route for everyone else. No function is ever
reachable only by the gesture.

### 4.4 How help is always reachable, and what it offers

`Help` appears as a word in the top right of every screen in the signed-in app
and every screen in the sign-in flow.

What it concretely offers, at every point:

1. **A real person, first.** WhatsApp and a phone number, at the top, above any
   article. The sheet tells the person that support can see which screen they
   are on, so they do not have to explain.
2. **A guide written for this screen**, where one exists, offered second.
3. **All the guides**, third.

Help is bundled with the app and works with no internet. The WhatsApp option
explains that it needs internet; the call option does not, and that distinction
is stated, because a phone call is the one channel that works in a park with no
data.

### 4.5 Building trust around money and other people's data

Concrete commitments, each of which appears as real copy on a real screen:

| Fear | Where it is answered | The words |
|---|---|---|
| "Does this app take my money?" | Record payment sheet | `ParkDrop never takes any of this money.` |
| "Is this app going to take my bank PIN?" | PIN setup | `This PIN is only for ParkDrop. Do not use your ATM PIN.` |
| "Will you sell my number?" | Sign-in | `We never sell your number.` |
| "Will you sell my customers' numbers?" | Add package, beneath the phone field, 15px | `We only use this number to text your customer about this package.` |
| "Does this cost money?" | Sign-in | `ParkDrop is free.` |
| "What will my customer actually receive?" | Setup and Shop details | the live SMS preview |
| "Will I see my card details go somewhere strange?" | Buy SMS credits | `You pay on the next screen. ParkDrop never sees your card.` |
| "If I lose my phone, do I lose everything?" | Recovery, and the work chip sheet | `Your packages are safe.` |
| "If I remove someone, do I lose their work?" | Remove confirmation | `Nothing they have already done is deleted.` |

Two structural trust rules:

- **Never show a control that does not work.** The codebase already refuses to
  render a "Call me with the code" button the backend cannot serve. That becomes
  a rule: a feature that is not real is absent, never greyed out, never
  "coming soon".
- **Never ask for what is not needed.** No date of birth, no address, no bank
  details, no marketing opt-in. The customer's name is optional. Every field
  that survives must be defensible in one sentence to the person filling it in.

### 4.6 What the research does and does not support

Stated plainly, because §5 of the brief forbids inventing evidence.

**Consistent with the broad direction of published work** on low-literacy and
novice-smartphone interface design, as generally understood rather than as
cited from any specific source consulted here:

- Icons must accompany words, not replace them. Icon-only interfaces perform
  badly with novice users; icon-plus-word performs well and improves with
  exposure.
- Hidden gestures are not discovered. Swipe and long-press actions are
  effectively invisible to people who have not learned the convention.
- Recognition outperforms recall. Showing examples of valid input beats an empty
  field.
- Numeric and spatial memory frequently outlast text fluency, which supports
  large numerals, consistent placement, and codes as the visual anchor.
- Larger targets reduce error under time pressure and physical stress.
- Voice and pictorial input help low-literacy users, though both carry real
  costs — see §9.

**Inferred from general interaction-design principles, not sourced:** the
specific 48px and 15px floors; the 4.5:1 contrast floor applied to large text;
the three-second splash threshold; the claim that two equal tiles are acceptable
on Home; the claim that removing `Add` from the bottom bar is net positive.
These are reasoned positions, and each says above what would change it.

**Not verified at all, and requiring real users:** whether `Collect ₦2,500 and
release` is understood on first reading; whether the pickup code is understood
as the customer's proof rather than the attendant's; whether `Things to check`
reads better than `Attention`; and whether the two-tile Home is read as two
choices or as two buttons that might do the same thing. The repository already
contains a field test protocol for exactly this kind of question. It has, as far
as the repository shows, never been run. See §9.

---

## 5. Visual design direction

### 5.1 The feeling, named

**Steady and plain-spoken. Not clever, not corporate, not playful.**

The nearest everyday object is a well-kept paper ledger under a counter: the
thing that has the answer, that does not editorialise, and that does not lose
your place. The app should feel like it is doing its job quietly on the user's
behalf.

What it must never feel like: a bank app (intimidating, full of terms), a
consumer social app (animated, congratulatory, attention-seeking), or a
developer tool (dense, abbreviated, monochrome).

There are no exclamation marks, no confetti, no streaks, no badges and no
"Great job!" anywhere in ParkDrop. The reward for doing the work is that the
work is done and visible.

### 5.2 Colour, and what each colour says

One brand colour, one ink, one page, three status colours, one illustration
family. Nothing else.

| Role | Value | Says | Where |
|---|---|---|---|
| Brand blue | `#2563EB` | *this is ParkDrop; this is the thing to tap* | Header bands, the primary button, links, selected states |
| Blue pressed | `#1D4ED8` / `#163B8C` | *your tap landed* | Hover and active |
| Ink | `#0D1B2A` | *read this* | All primary text |
| Muted ink | `#475569` | *supporting detail* | Labels, sublines, metadata |
| Page | `#F8FAFC` | *the surface you work on* | Signed-in background |
| Sign-in page | `#E8EEF7` | *you are not in yet* | Sign-in backdrop only |
| Card | `#FFFFFF` | *one thing, grouped* | Cards, sheets, rows |
| Line | `#E2E8F0` / `#CBD5E1` | *separate, do not shout* | Borders, dividers |
| Good | `#15803D` on `#F0FDF4` | *this worked* | Collected, paid, sent |
| Attention | `#92400E` on `#FFFBEB` | *you may need to act; nothing is broken* | Offline, waiting to send, unpaid, low credits, returned |
| Bad | `#B91C1C` on `#FEF2F2` | *this needs a decision now* | Failed, cancelled, zero credits, destructive |
| Kraft | `#E2B46E`, `#CF9A4D`, `#D9A45A`, `#F4E4BF` | *a real cardboard parcel* | **Illustration only.** Never text, never a control, never a border. |

Rules:

1. **Colour is never the only carrier of meaning.** Every coloured state also
   has an icon and a word (P3). In direct sun on a cheap LCD, green and amber
   pills are indistinguishable; a tick and a triangle are not.
2. **Blue means tappable.** Nothing blue is decorative, and nothing tappable is
   the same colour as body text. This is the single rule that makes the app
   navigable by someone who does not know what a button looks like.
3. **Amber is for "you may need to do something", not for "danger".** Offline is
   amber, because offline is normal here. Red is reserved for a decision the
   person must actually make.
4. **Kraft never leaves illustration.** It is the warmth in the product and it
   would stop reading as a parcel the moment it became a border.
5. **No new colours.** A screen that "needs" one has a hierarchy problem.

**Changes from today.** Three token corrections are needed:
`status-danger-border` is currently the fully saturated `#B91C1C` where the
written design system specifies the pale `#FECACA`, which makes every red-edged
surface louder than intended; `surface-page` in code and in the written design
system disagree (`#E8EEF7` vs `#F8FAFC`) and the table above settles it — the
darker one is the sign-in backdrop, the lighter one is the signed-in page; and
the `--color-proto-*` namespace, which is the actual source of every semantic
colour in the app, should be renamed, since a production design system should
not be built on a layer called "prototype".

### 5.3 Type

**Manrope**, weights 600, 700, 800. Chosen and kept for its open apertures,
generous x-height and unambiguous figures, all of which survive glare better
than a tighter grotesque.

Two consequences follow. **The font must be bundled with the app, not fetched
from a font service.** A first-time user opening ParkDrop in a park with no
signal currently sees the very first screen in a system fallback, at different
metrics, which is the worst possible first impression and the one over which the
app has the least excuse. And **the older reference document instructing `Inter`
is out of date** and must be corrected, or the next builder will introduce a
second typeface.

The scale, named for what it sizes so a row and a tile cannot drift apart:

| px | Weight | Used for |
|---|---|---|
| 48–64 | 800 | A pickup code being written down; an SMS balance |
| 30 | 800 | The screen's question or title |
| 28 | 800 | The same on a short screen |
| 25 | 700 | What the person has typed into a field |
| 22 | 800 | A sheet title; a name at the top of a detail screen |
| 20 | 700 | A primary button label; an action tile label |
| 18 | 600/700 | Body; a customer's name in a row; a section heading |
| 16 | 600 | Labels, helper text, metadata, chips |
| **15** | 600 | **The floor. Nothing goes below this, anywhere.** |

**Why the type is this large.** Three compounding reasons, and they compound
rather than overlap: the screen is in direct sunlight, which reduces effective
contrast; the reader may be reading slowly, which means every glyph is resolved
individually rather than a word being recognised as a shape; and the reader is
standing at arm's length with a customer waiting, not holding the phone at
comfortable reading distance. Any one of these would justify 18px body text.
Together they justify the whole scale.

**This retires the 12px caption token, `text-xs`, `text-[11px]` and
`text-[10px]` from the product.** Settings, Customers, Attention and the shared
notices are all currently built at those sizes. Screens will get taller. That is
correct.

Also: **tabular figures on anything read digit by digit** — phone numbers,
codes, PINs, amounts, counts, countdowns — so digits align in a column and a
person reading aloud does not lose their place.

### 5.4 Spacing

An 8px base. Gaps are 8, 12, 16, 24, 32, 48 and nothing else.

- 16px page margin at 360px. Never less — content touching the bezel is hard to
  read and hard to tap.
- 16px between cards.
- 12px between a label and its field.
- 24px between sections.
- 48px above a pinned primary button, so no content sits under a thumb resting
  on it.
- 12px minimum between adjacent tap targets.

Radii: 28px on sheets, 20px on cards and tiles, 16px on fields and buttons, 12px
on chips, full on status pills. (`--radius-2xl` is referenced in two components
and does not exist; those corners currently fall back to square.)

Shadows are used only to say "this floats above that" — sheets, the pinned
action bar, the action tiles crossing the header boundary. Never for decoration,
and never as the only indication of a boundary, since a soft shadow disappears
entirely in sunlight. Anything that floats also has an edge.

### 5.5 Icons

One family, consistently weighted: 2.25–2.5 stroke, 24px in rows, 28px in
settings, 32px in tiles, 64px in empty states.

Every icon has a word. No exceptions, including Back, Call, Clear, Close and
Refresh — all of which are currently bare in at least one place.

Icons carry meaning only in combination with their word; a person who learns
that the clock-with-an-arrow always sits beside "Waiting to send" can later read
the clock alone in a dense row, but the word must have been there to teach it.

### 5.6 Illustration

In-house SVG only. No stock art, no photography, no animation files, no video.

Vocabulary: kraft parcels, shelf lines, pickup tags, the counter, the canopy,
parcel labels. Warm brown against the blue, which is the whole visual identity
in one sentence: *a cardboard box on a blue counter.*

Illustration appears in exactly four places and nowhere else:
1. The sign-in header.
2. The Home first-day teaching card.
3. Empty states, one per screen.
4. Recovery.

It is always `aria-hidden` and never tappable. It is never used to fill space —
a screen that looks empty without an illustration has a content problem, and the
illustration will hide it rather than fix it.

### 5.7 What is kept, and what changes

**Kept, because it is right:** the blue-header-and-white-sheet structure; the
action tiles crossing the boundary; the kraft parcels; the named type scale; the
short-screen and reduced-motion handling; the 48px tap floor; ambiguity-safe
codes set in monospace at the largest size on their screen.

**Changed:** thirteen screens still in the pre-redesign language are migrated;
the 12px floor is retired; the invalid class names that silently render nothing
are fixed; the nine hard-coded hex colours in the package action bar move to
tokens; the font is bundled; the three colour-token systems are reduced to one;
and the three design documents that still describe the old language are
rewritten or deleted so the next builder does not faithfully rebuild it.

---

## 6. Interaction and motion

### 6.1 Feedback for a tap

Every tappable thing responds within 100ms, before anything else happens, with a
scale to 0.98 and a background darkening. This is the only confirmation that the
tap landed, and on a slow phone it is often the only feedback for a second or
more.

No hover states carry meaning. The app is used with a thumb.

Focus is always visible: a 3px blue ring with a 2px white offset. It is never
removed, including for mouse users on the tablet layout.

### 6.2 Waiting

Thresholds, and the reasoning for each:

| Duration | What happens | Why |
|---|---|---|
| 0–100ms | The pressed state only | Reads as instant |
| 100–500ms | Pressed state held; no spinner | A spinner that appears and vanishes reads as a glitch |
| 500ms–3s | A spinner **with words** in the button: `Saving…`, `Sending…`, `Checking…` | A bare spinner is ambiguous: is it working, or stuck? |
| 3s+ | The words change to `Slow network. Still trying.` | Tells the person the app knows, and that waiting is still the right choice |
| 10s+ | `That took too long. Check your data and try again.` with a `Try again` | Ends the wait with an action rather than leaving them stranded |

**A spinner is never shown alone, anywhere, at any duration.** That is the rule
the thresholds exist to serve.

For anything that can report real progress — recovery, a photo, a list loading —
a determinate bar is used, because an indefinite spinner gives a person no way
to judge whether to keep waiting.

Skeletons rather than spinners for screen loads, shaped like the real content,
so the layout does not jump when data arrives. Layout shift after a tap is how
people tap the wrong thing.

### 6.3 Success and failure

**Success** is shown in place, on the thing that changed, not as a toast that
floats away. A payment recorded updates the payment card, and the balance
visibly changes. A package saved becomes a whole screen. Where a brief
confirmation is genuinely right, it lasts at least six seconds — long enough
for a slow reader — and it never carries information available nowhere else.

**Failure** never moves the person off the screen, never clears what they typed,
and always ends in something to tap.

### 6.4 What motion is for, and what it is never for

Motion is only ever an answer to a tap. It has exactly four jobs:

1. **Direction.** Forward slides in from the right; back slides out to the
   right. This is how a person learns the app has a shape.
2. **Origin.** A sheet rises from the bottom edge it was summoned from.
3. **Attention, once.** A 320ms shake on a wrong code. Once, never repeated.
4. **Completion.** A tick that pops in at 320ms when something is finished.

Durations: 120ms for a state change, 260ms for a screen or sheet. Nothing longer
— a person with a customer waiting should never be waiting on an animation.

Motion is **never** used for: decoration, drawing the eye to a promotion,
looping anything, parallax, or an entrance on content that was already there.

All of it stops under `prefers-reduced-motion`, which the product already
honours correctly.

### 6.5 Excluded patterns

See §4.3. The table there is the authoritative list and exists so that a future
builder reaching for a swipe gesture finds it ruled out with a reason rather
than rediscovering the question.

---

## 7. Content and voice

### 7.1 The voice

**ParkDrop speaks like a competent colleague standing next to you.** It says
what happened and what to do. It does not apologise, does not congratulate, does
not explain itself at length, and never talks down.

Four qualities, in priority order when they conflict:

1. **Clear** — can be understood on the first read.
2. **Short** — nothing that does not change what the person does.
3. **Honest** — never claims more than is true. (§2 P8.)
4. **Warm** — plain, not cold. Warmth comes from being useful, not from
   adjectives.

### 7.2 The same message, wrong and right

**A package saved while offline**

> ✗ Package queued for sync. Will upload when connection is restored.
> ✗ Saved! 🎉 Your package will sync automatically.
> ✗ Offline mode: local write successful.
> ✓ **Saved. It will send to ParkDrop when you have internet.**

The wrong versions fail differently: the first is three banned words, the second
celebrates and hides the caveat, the third is a log line. The right version says
what is true now and what is true later.

**A wrong sign-in code**

> ✗ Invalid OTP. Authentication failed.
> ✗ Oops! That didn't work. Please try again.
> ✗ Error: code mismatch (401)
> ✓ **That code is not right. Check the SMS and try again.**

**The customer still owes money at release**

> ✗ Outstanding balance detected. Proceed?
> ✗ Warning: unpaid.
> ✓ **Chinedu still owes ₦2,500. Do you want to collect it now?**

The right version names the person, the amount, and the question.

**No SMS credits**

> ✗ Insufficient SMS credit balance. Notifications suspended.
> ✗ Top up your wallet to continue enjoying SMS notifications!
> ✓ **You have no SMS left.**
> ✓ **Your customers are not getting their pickup code by text. You can still
>    add and find packages.**

The right version states the consequence to the customer and then protects the
person from assuming everything has stopped.

**Removing a team member**

> ✗ Are you sure you want to revoke this membership?
> ✗ This action cannot be undone.
> ✓ **Remove Amina from your team?**
> ✓ **She will not be able to open ParkDrop for this shop. Nothing she has
>    already done is deleted.**

**A sync conflict**

> ✗ Conflict: server state won. Local mutation rejected.
> ✗ Sync error. Your change was not applied.
> ✓ **This package was collected on another phone.**
> ✓ **Amina collected Chinedu's package at 4:18 pm. That is what ParkDrop
>    kept.**

The right version does not mention synchronisation at all. A person does not
need the mechanism; they need to know who has the parcel.

**A slow request**

> ✗ Request pending…
> ✗ Please wait while we process your request.
> ✓ **Slow network. Still trying.**

**A report date the phone does not hold**

> ✗ No data available for selected date range.
> ✗ 0 packages · ₦0
> ✓ **This day is not saved on this phone.**
> ✓ **Connect to the internet to see it.**

The second wrong version is the dangerous one: it is not an error message at
all, it is a confident false answer, and an owner could act on it.

### 7.3 Rules for copy this plan has not written

1. Check `copy-glossary.md` before writing a word. If a word is on the banned
   list, use the replacement. If a needed word is not on the list, add it, with
   its replacement.
2. Write the button first. If the verb cannot be written in three words, the
   screen is doing more than one thing.
3. Write the error before the success. Errors are where the design is tested.
4. Read it aloud. If you run out of breath, it is too long. If you would not say
   it to a colleague, rewrite it.
5. Name the person and the amount whenever both are known. `Chinedu still owes
   ₦2,500` beats `Outstanding balance`.
6. Never write a sentence a support agent would have to explain.
7. Every string lives in its feature's strings file, with the house rules at the
   top of that file.
8. When an interface label changes, the Help guide that quotes it changes in the
   same change.

---

## 8. Accessibility

### 8.1 The standard

**WCAG 2.1 Level AA is the floor, with three places where ParkDrop goes
further**, because AA's assumptions do not match a motor park at midday.

| Criterion | AA requires | ParkDrop requires | Why |
|---|---|---|---|
| Text contrast | 4.5:1, or 3:1 for large text | **4.5:1 for all text** | Direct sunlight reduces effective contrast; the large-text allowance assumes indoor conditions |
| Target size | 24×24 (AA), 44×44 (AAA) | **48×48, 56 preferred** | Standing, rushed, one-handed, possibly damp hands |
| Text size | not specified | **15px floor** | Below this, a cheap LCD in glare stops resolving letterforms |

Everything else is AA as written: 3:1 for non-text control boundaries, text
resizable to 200% without loss of content, reflow at 320px with no horizontal
scrolling, visible focus, no keyboard trap, `prefers-reduced-motion` honoured,
and no reliance on colour alone.

### 8.2 How each principle supports the standard, and what still needs checking

| Principle | Supports | Still needs checking |
|---|---|---|
| P1 one task per screen | 2.4.6 headings and labels; reduces cognitive load | — |
| P2 one primary action | Focus order is obvious because there is one destination | — |
| P3 icon + word, never colour alone | **1.4.1 use of colour** directly; 1.1.1 non-text content | Every status must be verified to have a text equivalent |
| P4 every state designed | 3.3.1 error identification; 4.1.3 status messages | Every state needs a live-region decision |
| P5 plain language | 3.1.5 reading level (AAA, exceeded deliberately) | — |
| P6 sizes and targets | 1.4.4 resize; 2.5.5 target size; 1.4.3 contrast | Every colour pair must be measured, not eyeballed |
| P7 nothing is lost | 3.3.4 error prevention; 2.2.1 timing | The undo window must be extendable or dismissible |
| P8 honest offline | 4.1.3 status messages | Status changes must be announced, not only shown |
| P9 blame-free errors | 3.3.1, 3.3.3 error suggestion | — |
| P10 trust | — | — |

### 8.3 Screen reader labelling philosophy

ParkDrop is not primarily a screen-reader product, but the labelling discipline
that serves a screen reader is the same discipline that keeps icons paired with
words, so it is treated as a first-class concern rather than an afterthought.

1. **Label the outcome, not the widget.** A row announces
   *"Open Chinedu's package"*, not *"button"*. The existing Home row hint does
   exactly this and it is the model.
2. **Never announce a decoration.** Every illustration, pattern and background
   is hidden from assistive technology.
3. **Read numbers as they are meant.** A pickup code is announced character by
   character, not as a word. An amount is announced as money. A phone number is
   grouped.
4. **State goes with the thing, not beside it.** A package row announces name,
   status, payment state and age as one coherent sentence, not as five
   fragments.
5. **One announcement per change.** When a payment is recorded, the balance is
   announced once; the amount, the card and the action bar do not each speak.
6. **Live regions are polite by default.** Only two things interrupt: a failure
   that loses work, and the offline transition.
7. **Every group of fields has a group label.** The six code boxes are one
   labelled group, not six unlabelled boxes.

### 8.4 Focus order philosophy

1. Focus follows reading order: top to bottom, left to right. No exceptions.
2. Opening a sheet moves focus to its title; closing it returns focus to exactly
   the control that opened it.
3. Focus is trapped inside a sheet or dialog while it is open.
4. An error moves focus to the first field with a problem, and that field keeps
   what was typed.
5. Autofocus is used only where the screen exists to receive typing — the
   identifier, the code, the Add package phone field, the search field. Never
   anywhere else, because an unexpected keyboard covers half the screen.
6. After navigating to a new screen, focus goes to the title, so the screen
   announces what it is.

### 8.5 Text scaling

The app must work at 200% system text size with no content lost and no
horizontal scrolling at 320px.

This is achievable because of a decision already made: the height-based rules
that step titles, keypad keys and header bands down on short screens are exactly
the mechanism that absorbs enlarged text, since enlarging text has the same
effect as shortening the viewport. That mechanism is extended to every screen
rather than living only in the sign-in flow.

Specific commitments: no fixed-height container holds text that can grow; the
pinned primary button never overlaps content, it pushes it; long customer names
wrap to two lines rather than truncating with an ellipsis, because a truncated
name is useless for identifying a person at a counter; and where truncation is
genuinely unavoidable, the full value is available to assistive technology.

---

## 9. Known gaps, open questions and risks

### 9.1 Things found broken in Phase 1 that this plan assumes get fixed

Not design questions. They are listed because the design above assumes they are
resolved, and because several are severe.

| # | What | Severity |
|---|---|---|
| 1 | Collected / Returned / Cancelled banners show hard-coded `'Today'` and `'8:10 pm'` instead of the real timestamps, which the record holds | **Highest.** The product states a confident falsehood about when someone else's parcel was handed over. |
| 2 | Back exits the app from every screen, including mid-way through Add package, because no router is wired and nothing is pushed onto history | **High.** For a first-time user this is indistinguishable from the app crashing. |
| 3 | The Help screen describes a package ID format, a release flow and a navigation bar that do not exist | **High.** It is wrong exactly where people go when lost. |
| 4 | Invalid class names (`bg-bg-surface-page`, `text-text-tertiary`, `border-border-subtle`, `bg-surface-active`, `--radius-2xl`) silently render nothing; Find package has no background colour | Medium |
| 5 | Recovery falls back to a native `alert()` at the most frightening moment in the product | Medium |
| 6 | `/theme` is reachable in production | Low |
| 7 | Support numbers are placeholders (`+2348000000000`), so `Help` reaches nobody | **High**, given how much weight this plan puts on reaching a person |
| 8 | The font is fetched from a font service, so the first screen a first-time offline user sees renders in a fallback | Medium |
| 9 | Two navigation systems and two Settings screens exist; the newer, better-structured pair is the dead one | Medium — work risks being done to the file nobody sees |
| 10 | Five components including a whole alternative release flow are unreferenced and encode a *different* product decision from the live one | Medium |

### 9.2 Decisions this plan made without full information

Each is marked in place. Collected here with what would change it.

| Decision | Made because | Would change if |
|---|---|---|
| Four-item bottom bar, `Add` not in it | Add is an action, not a place; three doors to one room confuses novices; the codebase already made this change with recorded reasoning | Field observation shows attendants routinely add packages from the Packages list |
| Two equal tiles on Home, the single P2 exception | They map to two different real-world events; weighting one slows half of all uses | Testing shows people hesitate between them |
| Phone + SMS becomes the sign-in identifier | The audience lives on phone numbers; every screen already branches on one switch | SMS cost per sign-in exceeds what the business will carry |
| A nameless customer displays as `No name yet`, not as their phone number | A phone number used as a name produces `Release to 08031234567?` | Attendants actually prefer the number as the label |
| `Cash` pre-selected as the payment method | Overwhelmingly the common case in a motor park | The product owner's own transaction data says otherwise |
| One SMS per package | Matches the 130-character single-segment budget | Reminder SMS are added, or names split messages |
| 15px text floor and 48px target floor | Sunlight, slow reading, standing use | Measurement on real devices in real light says otherwise |
| Bottom bar hidden during Buy SMS credits | Five exits from a payment flow produces abandoned half-flows | — |
| Help offers a person before an article | Someone who opened Help has already failed to solve it alone | Support volume becomes unmanageable — which is a staffing decision, not a design one |

### 9.3 Decisions that need the product owner

Seven. Each is a real trade-off, not a detail, and each is stated so it can be
decided quickly.

**9.3.1 — Must the attendant type the pickup code to release a package?**

Today the live flow *shows* the code and asks the attendant to compare it with
the customer's phone. An unused component in the codebase *requires* the code to
be typed and rejects a mismatch. Two different answers to the same question
exist in the repository, and the Help screen documents the one that does not run.

*Showing it:* faster, works when the customer's phone is dead and they have
written the code down, and does not punish an attendant who reads slowly.
*Typing it:* makes wrongful handover structurally much harder, and gives the
business a defensible record.

This is a fraud-risk-versus-speed decision about other people's property and the
business's liability. **A designer should not make it.** If typing is chosen,
the design above changes: the release dialog becomes a code entry screen with a
visible `The customer showed me the code` override for the dead-phone case,
because a hard block with no override will be worked around by writing codes on
a wall.

**9.3.2 — What happens when SMS credits hit zero?**

Today packages are still added and the customer is silently not texted. The
attendant may well tell the customer to expect a text. Options: block the save
(safe, and stops the business working); allow it and warn loudly at the point of
save (the design above assumes this); or fall back to WhatsApp or a free channel.

This is a commercial decision about whether SMS credits are a hard gate.

**9.3.3 — Should a customer's name be required?**

The code has a configuration switch and currently sets it to optional. Optional
is faster, which matters enormously at a counter. But a customer with no name
shows up as a phone number in every list, which makes the Customers screen much
less useful and makes a record harder to talk about on the phone.

**9.3.4 — How long is the undo window, and is it long enough?**

Undo after saving a package and after releasing one is currently a short
countdown. For the audience described in §1, a seven-second countdown may well
expire before the person has finished reading the word "Undo". Extending it has a
real cost: a package that can be un-released for a minute is a package whose
status is uncertain for a minute.

**9.3.5 — Is there a real support line?**

The design puts `Help` on every screen and leads with "talk to a real person".
The numbers in the code are placeholders. If there is no one to answer, the
promise should be softened before launch rather than broken at the counter — but
softening it removes the strongest trust element in the product. This needs a
staffing answer before it needs a design answer.

**9.3.6 — Which language?**

Everything is English, hard-coded, with no localisation infrastructure. For an
audience described as reading English slowly, the highest-leverage single
improvement available to this product may not be any screen in this plan — it
may be Pidgin, Hausa, Yoruba or Igbo. That is a significant investment and a
product decision. This plan does not assume it, and notes that every string
moving into per-feature strings files is the precondition for it either way.

**9.3.7 — Should the field usability test be run before any of this is built?**

`docs/usability/add-package-test.md` is a well-made protocol: five real
attendants, budget Android, bright sun, flaky 3G, five packages each, with
specific time targets. There is no record it was ever run. Several decisions in
§9.2 would be settled by it in an afternoon. The recommendation is to run it on
the current build *before* the migration work starts, so the redesign is
answering observed problems rather than predicted ones.

### 9.4 Risks in the plan itself

| Risk | Why it matters | What reduces it |
|---|---|---|
| Migrating 13 screens is a large amount of work | A half-finished migration produces a *third* visual state and the app gets worse before better | Migrate in the order people encounter them: Settings, then Help, then Find package's header, then Customers, then the rest |
| Bigger type and taller rows make screens longer | More scrolling; some content moves below the fold | Reduce what is on each screen rather than shrinking the type; several screens above lose content for this reason |
| Rewriting copy breaks the Help guides again | The same drift that produced today's wrong Help | The standing rule in §7.3: a label change and its guide change together |
| The dead router is "better" than the live one | Someone may migrate to it and change navigation behaviour as a side effect of a design task | Decide the navigation question separately and first |
| This plan has not been tested with a single real user | Every claim in §1 is a claim about people | §9.3.7 |

### 9.5 What could not be verified

Recorded plainly.

1. **The app's runtime behaviour was never observed.** This is a documentation-only
   audit; nothing was built, run or screenshotted. Every finding comes from
   reading the source. Rendering, real contrast in real light, real timing and
   real keyboard behaviour are unverified.
2. **The working tree changed during the audit.** An uncommitted, syntactically
   invalid edit to the app's entry file — mid-migration towards the router — was
   present at the start and was reverted by something else during the session. A
   second file was modified during the session by something else. The audit
   describes the committed state, re-verified after the revert, and was corrected
   accordingly. A reader should confirm the entry file's state before starting
   work.
3. **The backend was not read.** Everything about the API, SMS delivery, payment
   provider behaviour and rate limits comes from the frontend and from
   `docs/`. The SMS template is documented as needing to stay in step with a
   backend command; whether it currently does was not checked.
4. **The Staff, Business details and Account screens were inventoried but not
   read line by line.** Business details is ~600 lines. Their specifications
   above are built from their structure, their component names and the
   documented business rules, and should be checked against the detail before
   they are built.
5. **No contrast ratio was measured.** The palette is described from token
   values. The 4.5:1 commitment in §8.1 is a requirement, not a measurement.
6. **No real user has seen any of this.** Nothing in §4.6 is sourced from a study
   consulted for this document, and nothing in this plan has been tested with a
   single member of the audience it was written for.

---

*End of the design plan.*
