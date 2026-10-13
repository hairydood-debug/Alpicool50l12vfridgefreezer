# Night Mode

Defaults: pre-cool at 21:00 to 1°C, power OFF at 22:00, restart at 01:00 to 4°C.
Times are editable and follow the phone's local clock every day. Targets are always entered
in Celsius and converted for a fridge displaying Fahrenheit. The freezer target is preserved;
power OFF stops cooling in both zones. This is the fridge's existing software power command,
not a physical disconnection of its 12V supply.

Connect the fridge, choose settings, tick Enable daily schedule, and Save settings.
Enabling applies the current phase immediately. Settings and temporary holds survive reloads
and are tied to the selected Bluetooth device. Reconnect manually after a lost connection.

- Snooze: OFF immediately for one hour, then follow the current daily phase. If that phase
  is OFF, remain OFF until the scheduled restart.
- Bedtime: OFF immediately until the next scheduled restart, skipping pre-cool.
- Both buttons enable the saved daily schedule.
- Cancel automation: stop scheduling and clear any hold; leave the fridge's power unchanged.
  Cancel before manually overriding scheduled power or temperatures.

No measured-temperature condition turns the fridge on. Commands are serialized through the
existing BLE queue and reported successful only after status confirms power and target.
Failures are retried every five seconds while the page can run. After suspension or reconnect,
the current phase is applied; missed phases are not replayed. A missed restart runs late.

## Android limitation

Keep the page visible, phone awake, and Bluetooth connected. Chrome/Android can freeze or
discard background pages and interrupt Bluetooth. A PWA install or service worker cannot
guarantee overnight execution. This implementation does not claim unattended reliability.
Once OFF is accepted, the fridge stays off even if the page closes; a suspended page cannot
send the later ON command. For reliable screen-locked operation, use a dedicated always-on
BLE controller or an Android native implementation with appropriate background BLE support.

References:
- https://developer.chrome.com/docs/web-platform/page-lifecycle-api
- https://developer.android.com/develop/connectivity/bluetooth/ble/background

## Deploy only this fork

Upload the supplied application files to `hairydood-debug/Alpicool50l12vfridgefreezer` on
`main`, replacing existing files. The original upstream is not involved.
In the fork, Settings → Pages → Source: Deploy from a branch → main → /(root) → Save.
Open https://hairydood-debug.github.io/Alpicool50l12vfridgefreezer/ in Android Chrome.
There is no build step. All script paths are relative for project Pages hosting.
Reload online once to pick up the updated offline cache, then connect the fridge.

## Verification

Run `node night-schedule.test.cjs` for schedule checks. Hardware verification still required:
use short test intervals with the app visible, verify OFF on the fridge display, verify no
restart as temperature rises, verify restart target, and test Snooze/Bedtime. Also test a
reload and reconnect during OFF and after restart. Compare Fahrenheit targets (1°C ≈ 34°F,
4°C ≈ 39°F). Check the unchanged freezer target. Do not assume software tests verify BLE hardware.
