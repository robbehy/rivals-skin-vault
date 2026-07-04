# RIVALS Skin Vault

A Windows 95-themed static website for browsing and downloading PNG weapon/skin
images for the Roblox game RIVALS. It works like a mini File Explorer: folders
on the left and as icons, click a PNG to download it.

No backend, no database — it's a static site. You manage images by dropping
files into folders on your computer, regenerating one JSON file, and pushing
to GitHub.

## Folder structure

Put your PNGs under `images/`, organized however you like (by weapon type,
by rarity, etc.):

```
images/
  Knife/
    Chroma/
      Dragon_Scale.png
      Galaxy_Blade.png
    Default/
      Standard_Knife.png
  Gun/
    Default/
      Standard_Pistol.png
```

The four PNGs already in there are just colored placeholders so you can see
the site working. Delete them and add your real skins whenever you're ready
(`images/Knife`, `images/Gun`, etc. — or replace them with your own top-level
categories entirely).

## Adding new skins

1. Copy your PNG files into `images/<Category>/<Subcategory>/...`.
2. Regenerate the manifest (this is what the website actually reads):
   ```
   node scripts/generate-manifest.js
   ```
3. Refresh the page (or redeploy). That's it — no code changes needed.

## Running locally

Any static file server works. For example:

```
python -m http.server 8080
```

Then open `http://localhost:8080` in your browser.

## Deploying for free (GitHub Pages)

1. Create a new GitHub repository and push this folder to it.
2. In the repo settings, go to **Pages** and set the source to the `main`
   branch, root folder.
3. GitHub will give you a public URL (e.g.
   `https://<username>.github.io/<repo>/`) — that's your site.
4. Whenever you add new skins, run `node scripts/generate-manifest.js`,
   commit `manifest.json` and the new images, and push.

Netlify and Vercel work too — just drag-and-drop the project folder (or
connect the repo); no build command is needed since it's plain HTML/CSS/JS.

## Files

- `index.html`, `style.css`, `app.js` — the site itself (Win95-styled file
  explorer UI).
- `images/` — your PNGs, organized into folders.
- `manifest.json` — auto-generated listing of the `images/` folder tree.
  Don't hand-edit it; re-run the script instead.
- `scripts/generate-manifest.js` — scans `images/` and writes `manifest.json`.
- `scripts/make_placeholder_pngs.py` — one-off helper that created the sample
  placeholder PNGs; safe to ignore or delete.
