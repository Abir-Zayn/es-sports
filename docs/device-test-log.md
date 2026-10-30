# Preview device test log

## 2026-10-31: blocked before testing

Build to test: `v1.0.0-preview.2`. The checklist requires at least one low-end and one mid-range Android phone, multiple accounts, and a preview OTA update. `adb devices -l` showed no connected devices. No scenario was executed; device models, Android versions, build installation, and results remain unverified.

| # | Scenario | Result | Notes |
| --- | --- | --- | --- |
| 1 | Creator assigns another account as scorer | NOT RUN | No phones available. |
| 2 | Assigned scorer opens the link and scores | NOT RUN | No phones available. |
| 3 | Creator and a third account try to score | NOT RUN | No phones available. |
| 4 | Score three balls offline, force-close, reopen online | NOT RUN | No phones available. |
| 5 | Force-close immediately after a ball while online | NOT RUN | No phones available. |
| 6 | Undo offline, force-close, reopen | NOT RUN | No phones available. |
| 7 | Finish the match offline, force-close, reopen | NOT RUN | No phones available. |
| 8 | Score offline, sign out, and sign in as another account | NOT RUN | No phones available. |
| 9 | Same account scores on two phones | NOT RUN | No phones available. |
| 10 | Upload JPEG and PNG team images, including files over 2 MB | NOT RUN | No phones available. |
| 11 | Search for a guest player and an app account | NOT RUN | No phones available. |
| 12 | Publish a trivial preview OTA update and restart | NOT RUN | No phones available; no update was published. |

Run the expected outcomes in [NEXT_WORK.md](../NEXT_WORK.md#2-device-verification-of-the-shipped-build--informal-pass-record-results), record device details and evidence for each result, and create an issue or fix for each failure.

## 2026-10-31: first connected phone

Device: PLR110, Android 16. Installed release APK `v1.0.0-preview.2`; SHA-256 matched the GitHub release (`64b5eb3c98d6f8b09bb031c07872e7d224a9ea8aa994326216bacd2ae97e4b0b`). Only one phone and its existing signed-in account were available. Test match: `QA_Device_A` vs `QA_Device_B`, ID `7a0e5f37-2901-4b77-b543-b41b9f6c2def`. Test data was created in the live project. Wi-Fi was restored after offline tests.

| # | Scenario | Result | Evidence or blocker |
| --- | --- | --- | --- |
| 1 | Assign another account as scorer | NOT RUN | Another test account was not available. |
| 2 | Assigned scorer scores and spectator sees updates | NOT RUN | Another test account and a spectator device were not available. |
| 3 | Creator and a third account try to score | NOT RUN | Additional test accounts were not available. |
| 4 | Three offline balls, force-close, reopen online | PASS on one phone | Entered 1, 0, 2; after restart the server held those three deliveries in order and the scorer showed 3/0 after 0.3 overs. |
| 5 | Force-close immediately after an online ball | PASS on one phone | Recorded a dot ball and immediately force-stopped; the server held exactly one additional delivery and the scorer resumed at 0.4 overs. |
| 6 | Undo offline, force-close, reopen | PASS on one phone | The prior delivery was voided on the server and its replacement was present in sequence. |
| 7 | Finish offline, force-close, reopen | FAIL | Offline screen showed QA_Device_B winning by 3 wickets. After reconnecting and retrying, the server still showed `live` with no result, and the app reported four unsent changes. The queued changes were preserved. [Issue #6](https://github.com/Abir-Zayn/es-sports/issues/6). |
| 8 | Offline scoring across account switch | NOT RUN | A second account and its sign-in were not available. |
| 9 | Same account scores on two phones | NOT RUN | Only one phone was connected. |
| 10 | JPEG, PNG and oversized image uploads | PARTIAL | Android's picker accepted one test image after cropping. No server upload or 2 MB rejection was verified; the crop may alter file size. |
| 11 | Guest player and app-account search | PARTIAL | Added guest players and searched for an app account; results showed names and initials. Guest search itself was not verified. |
| 12 | Publish a preview OTA update | PARTIAL | Published Android update group `66d55126-28ce-4ed4-ab27-d2b25eecaaeb` to `preview`. Device logs reported an update available and the app reopened after a second launch, but the running update ID was not independently verified. |

The three passing scenarios were tested only on this device. The required low-end and mid-range device coverage is still incomplete. Do not discard the test match's queued changes while investigating row 7.

## 2026-10-31: row 7 retest after issue #6 fix

**PASS on PLR110, Android 16:** the original four queued changes synced after installing preview OTA update group `0ed3ba83-001e-413e-99ca-95f52914eeb4`. The server recorded the final first-innings wicket with a null next-batter key, the chase start, and the winning four in order; the match result was saved as QA_Device_B winning by three wickets. Opening the match on the phone showed the same result and the **Saved** indicator. No queued changes were discarded. A second device remains untested.
