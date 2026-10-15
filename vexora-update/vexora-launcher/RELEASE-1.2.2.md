# Vexora 1.2.2

Launcher updates now live beside VEXORA STUDIOS at the bottom of the sidebar.
- Circular-arrows button checks for launcher updates.
- Green check marks a completed up-to-date check; click it to check again.
- A blue dot indicates an available update, with Update & Restart below.
- Download progress and errors remain visible in the sidebar.
- Keyboard labels, focus outlines, and reduced-motion preferences are supported.

Verification: all 11 signature/update security tests passed. Electron smoke
confirmed the sidebar location, check mark, checking state, available-update
button, fit within the studio row, and removal of the top banner; catalog,
auth-status IPC and isolated data marker checks also passed. The secure update
logic, signing key, game updater and login were not changed. A real installed
1.2.1 -> 1.2.2 update is still the next acceptance check.

After merging, run the existing release workflow and inspect the draft. Publish
1.2.2 when ready, then use Check launcher updates and Update & Restart in your
installed 1.2.1. Confirm the version is 1.2.2, login remains and Silver Road opens.
