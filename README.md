# To-Dey

To-Dey 1.0.0 is a todo app for your own computer. Notes, messages, the vault, and passwords stay in this browser. Nothing is uploaded.

## Install it on Windows

To-Dey is an app for this computer. It does not have an internet account, so the window talks to a small program on your PC. That is why it is not a public website. Your notes stay in the To-Dey window on this machine.

1. Install Node.js from https://nodejs.org if it is not already installed.
2. Double-click `Install To-Dey.bat` in this folder.
3. Open **To-Dey** from the desktop or the Start menu.

That shortcut builds the app once, then opens it in its own window. Use that same icon each time so your notes, vault, and passwords are still there.

`Start To-Dey.bat` is the development server. You do not need it for everyday use.

## What it does

- A week, today, and month calendar with a live clock.
- Notes that show how many days and hours are left.
- Alerts inside the app, and on the desktop, when a note is due within 24 hours.
- Folders you create, plus a folder for each month (Upcoming, Past, Deleted).
- An inbox for profiles saved on this computer.
- A wallpaper with blur, saturation, brightness, and dim.
- A secret vault for notes and documents.

The sign-in screen is only for creating a profile or logging in. The first time the calendar opens, arrows walk through what each part does. Open **About** any time for the same explanation, or to run the walkthrough again.

## Passwords

| Secret | What it is for |
| --- | --- |
| Login password | Email sign-in. At least 6 characters. |
| App password | Asked again each time you reopen To-Dey. Optional. Change it in Profile → Settings. |
| Vault PIN | 4 to 8 digits. Opens only the vault. Change it in Profile → Settings. |

The app password and the vault PIN are created separately and cannot be the same.

## Backups

**Profile → Backup → Download backup** saves a JSON file of every profile on this computer, including notes, folders, messages, wallpaper, the vault, and password hashes.

After a reinstall, use **Restore a backup** on the sign-in screen, or **Upload backup** in Profile. Restoring replaces what is currently saved here.

## Deleting an account

**Profile → Delete account** asks for the login password. It removes that profile, its notes, folders, vault, and messages from this computer, then signs you out. Other profiles stay. A backup file you already downloaded is not deleted.
