# Deploying

lectrace deploys to GitHub Pages with a single command. No Node.js, no build steps on your machine — everything runs in GitHub Actions.

---

## One-time setup

### 1. Initialize

In your repo root:

```sh
lectrace init
```

This creates:

- `.github/workflows/lectrace.yml` — the GitHub Actions workflow
- `lectrace.toml` — optional configuration file
- Updates `.gitignore` to exclude `_site/` and cache files

### 2. Enable GitHub Pages

In your GitHub repository:

1. Go to **Settings → Pages**
2. Under **Source**, select **GitHub Actions**
3. Save

### 3. Push

```sh
git add .
git commit -m "add lectures"
git push
```

GitHub Actions runs, builds your lectures, and deploys them. Your site is live at:

```
https://your-username.github.io/your-repo-name/
```

---

## What the workflow does

The generated workflow (`.github/workflows/lectrace.yml`):

1. Checks out your repo
2. Installs your project's dependencies (if `pyproject.toml` is present)
3. Installs `lectrace`
4. Runs `lectrace build --output _site`
5. Deploys `_site/` to GitHub Pages

It runs on every push to `main` and can also be triggered manually from the Actions tab.

---

## Project dependencies

If your lecture files import third-party libraries, declare them in your project so the workflow installs them:

=== "pyproject.toml"

    ```toml
    [project]
    dependencies = ["numpy", "torch"]
    ```

=== "requirements.txt"

    ```
    numpy
    torch
    ```

The workflow detects both formats automatically.

---

## Multiple lectures

lectrace auto-discovers all lecture files in your repo. Name them with numeric prefixes to control sidebar order:

```
01_introduction.py
02_arrays.py
03_sorting.py
04_trees.py
```

All four will appear in the sidebar, ordered as listed.

---

## Incremental builds

`lectrace build` caches trace results by source hash. On subsequent pushes, only modified files are re-executed — unchanged lectures rebuild in milliseconds.

To force a full rebuild:

```sh
lectrace build --no-incremental
```

---

## Custom output directory

The default output is `_site/`. Change it in `lectrace.toml` or via the flag:

```sh
lectrace build --output public
```

Update the workflow's `path:` accordingly if you change the default.

---

## Local preview before pushing

Always preview locally before pushing:

```sh
lectrace serve
```

Builds and serves at `http://localhost:7000` with live reload on file save.
