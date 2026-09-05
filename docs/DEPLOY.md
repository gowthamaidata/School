# Deploying to GitHub and Vercel

From zip file to a live HTTPS link you can open in a principal's office.
Budget about 15 minutes the first time. Everything here is free.

---

## 1. Put the code on GitHub

### Install the tools (once)

- **Node.js 20.9 or newer** — <https://nodejs.org> (pick the LTS build; Next 16 requires it)
- **Git** — <https://git-scm.com/downloads>
- A **GitHub account** — <https://github.com/signup>

Check they work:

```bash
node -v     # should print v20.9 or higher
git --version
```

### Create the repository

1. Go to <https://github.com/new>
2. Repository name: `palli-school` (or anything you like)
3. Set it to **Private** — this is your commercial product
4. Do **not** tick "Add a README" — this project already has one
5. Click **Create repository**

### Push the code

Unzip the project, open a terminal inside the folder, and run:

```bash
npm install          # first, confirm it builds locally
npm run build

git init
git add .
git commit -m "Palli — initial commit"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/palli-school.git
git push -u origin main
```

Replace `YOUR-USERNAME`. If GitHub asks for a password, it wants a **personal
access token**, not your account password — create one at
<https://github.com/settings/tokens> with the `repo` scope, and paste that.

> `.gitignore` already excludes `node_modules`, `.next` and every `.env` file,
> so no secrets and no build junk get committed.

---

## 2. Deploy to Vercel

1. Go to <https://vercel.com/signup> and **sign up with GitHub** — this saves
   wiring up permissions later
2. Click **Add New… → Project**
3. Find `palli-school` in the list and click **Import**
4. Vercel detects Next.js on its own. Leave the build settings alone.
5. Expand **Environment Variables** and add one:

   | Name | Value |
   |------|-------|
   | `NEXT_PUBLIC_DATA_MODE` | `demo` |

6. Click **Deploy**

Ninety seconds later you have a URL like
`https://palli-school.vercel.app`. Open it on your phone — that is your demo.

### Set the region (worth doing)

Vercel defaults to a US region. `vercel.json` in this repo already requests
`bom1` (Mumbai), which cuts a noticeable amount of latency for users in Tamil
Nadu. Confirm it under **Settings → Functions → Function Region**.

---

## 3. Install it as an app

On the phone you will demo with:

- **Android / Chrome**: open the URL → tap the **⋮** menu → **Add to Home screen**
- **iPhone / Safari**: open the URL → tap **Share** → **Add to Home Screen**
- **Desktop Chrome or Edge**: click the **⊕** install icon in the address bar

It then opens fullscreen with its own icon, with no browser chrome. To a
principal this is indistinguishable from an app off the Play Store — which is
the point, and it costs you nothing in store fees or review delays.

---

## 4. Updating after a change

```bash
git add .
git commit -m "What changed"
git push
```

Vercel rebuilds and redeploys automatically on every push to `main`. GitHub
Actions runs typecheck, lint and build first, so a mistake shows up as a red
check rather than a broken demo.

---

## Custom domain (optional, ~₹800/year)

A demo on `palli-school.vercel.app` is fine. A demo on `palli.in` reads as a
real company, which matters when a correspondent is deciding whether to trust
you with student data.

1. Buy a domain — Namecheap, GoDaddy, or BigRock for `.in`
2. In Vercel: **Settings → Domains → Add**
3. Enter the domain and follow the DNS records it shows you
4. HTTPS is issued automatically within a few minutes

---

## Troubleshooting

**Build fails on Vercel but works locally.**
Almost always a missing environment variable. Check
**Settings → Environment Variables**, then **Deployments → ⋯ → Redeploy**.
Note that any variable read in the browser must start with `NEXT_PUBLIC_`.

**Fonts look wrong / plain.**
The app loads Inter, Lora, JetBrains Mono and Noto Sans Tamil from Google
Fonts at runtime. If a network blocks that, the app falls back to system fonts
and still works — it just looks less refined.

**Page loads but nothing appears after sign-in.**
Usually a stale service worker from an earlier build. Hard-reload
(Ctrl/Cmd + Shift + R), or clear site data in devtools → Application.

**"Module not found" on `npm install`.**
Delete `node_modules` and `package-lock.json`, then `npm install` again.
Check `node -v` is 20 or higher.

---

## What this costs

Nothing, at demo scale. Vercel's free tier covers 100 GB of bandwidth a month —
a demo app serves a few megabytes per visit, so you would need tens of thousands
of visits to approach it. You start paying only when a school signs and you turn
on Supabase, and by then the school is paying you.
