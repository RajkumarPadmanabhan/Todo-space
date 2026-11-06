import { useStore } from '../store'

export function AboutPage() {
  const { replayTour } = useStore()

  return (
    <div className="about-page">
      <section className="about-block">
        <h2>How To-Dey works</h2>
        <p>
          To-Dey keeps your notes on this computer, in this browser. Nothing is sent to a server. Create a profile with your email, a login password, and a photo. After that, the app opens straight to your calendar.
        </p>
        <p>
          The first time you reach the calendar, arrows point at each part of the screen and say what it does. You can run that again whenever you want.
        </p>
        <button type="button" className="add-btn" onClick={replayTour}>
          Show the walkthrough
        </button>
      </section>

      <section className="about-block">
        <h2>What you can do</h2>
        <ul>
          <li>Add a note to a day. Under it, To-Dey counts the days and hours left until that time.</li>
          <li>See the week, today, or the month, with the clock moving as time passes.</li>
          <li>Get alerts inside the app, and on the desktop: a day before a note is due, on the day, an hour before, and at the due time. Opened from the desktop shortcut, To-Dey keeps sending them even after the window is closed.</li>
          <li>Make a folder and put notes in it. Each month also files notes into Upcoming, Past, and Deleted.</li>
          <li>Message other profiles that are saved on this same computer.</li>
          <li>Put a photo behind the app and adjust blur, color, brightness, and dim.</li>
          <li>Lock private notes and documents in the vault.</li>
        </ul>
      </section>

      <section className="about-block">
        <h2>Passwords</h2>
        <p>There are three secrets, and each one does a different job. Create them separately. The app password and the vault PIN cannot match.</p>
        <ul>
          <li>
            <strong>Login password.</strong> Used with your email on the sign-in screen. At least 6 characters. To-Dey does not offer a way to change this one.
          </li>
          <li>
            <strong>App password.</strong> Optional. After you sign up or log in, you can create it or choose Not now. Once it is set, closing To-Dey and opening it again asks for this password before the calendar. Change it in Profile, under Settings.
          </li>
          <li>
            <strong>Vault PIN.</strong> 4 to 8 digits. It only opens the secret vault. Notes and documents in the vault stay off the calendar, the todo list, search, alerts, and the month folders. Create or change it in Profile, under Settings, or the first time you open Vault.
          </li>
        </ul>
      </section>

      <section className="about-block">
        <h2>Backups</h2>
        <p>
          Profile has a Backup section. Download backup saves a JSON file of every profile on this computer: notes, folders, messages, wallpaper, the vault, and the saved passwords. The file stays on your computer.
        </p>
        <p>
          After a reinstall, open To-Dey and choose Restore a backup on the sign-in screen, or Upload backup from Profile. Restoring replaces what is currently saved on this computer. If profiles are already here, To-Dey asks you to confirm first.
        </p>
      </section>

      <section className="about-block">
        <h2>Deleting an account</h2>
        <p>
          Profile ends with Delete account. Enter the login password and confirm. That removes this profile, its notes, folders, vault documents, and messages from this computer, then signs you out. Other profiles on this computer stay.
        </p>
        <p>Download a backup first if you might want the notes back. Deleting an account does not delete a backup file you already saved.</p>
      </section>

      <p className="muted about-version">To-Dey 1.0.0 · stored only on this computer</p>
    </div>
  )
}
