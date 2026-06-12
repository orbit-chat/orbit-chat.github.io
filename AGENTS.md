# Repository Guidelines

## Project Structure & Module Organization

This repository is the static GitHub Pages site for Orbit Chat. The main landing page is `index.html`, shared styling is in `styles.css`, security disclosure content is in `security.html`, brand imagery is in `assets/`, and downloadable desktop installers live in `downloads/`. GitHub Actions workflows are under `.github/workflows`. There is no build system; files are served directly as static assets.

## Build, Test, and Development Commands

- Open `index.html` directly in a browser for local review.
- `python3 -m http.server 8080`: optional local static server for checking relative links.
- `git diff --check`: catch trailing whitespace and patch formatting issues.
- `ls downloads/Orbit-Chat-Setup-*.exe downloads/Orbit-Chat-*-mac.zip`: verify expected installer assets exist.

GitHub Actions validates required pages, styles, security disclosure links, and installer filename patterns.

## Coding Style & Naming Conventions

Use plain HTML and CSS. Keep two-space indentation in markup and CSS blocks. Prefer semantic HTML sections, accessible link text, `alt` text for meaningful images, and `aria-label` only where it improves navigation. Use lowercase, hyphenated names for new files and CSS classes, for example `security.html` or `.download-card`. Keep copy direct and accurate; avoid claiming audit, notarization, or security status that is not complete.

## Testing Guidelines

There is no automated browser test suite. Before opening a PR, manually check desktop and mobile viewport widths, navigation links, download buttons, and the security disclosure page. If installer files change, verify filenames match links and CI patterns. For visual changes, include screenshots in the PR.

## Commit & Pull Request Guidelines

Recent commits use concise imperative summaries such as `Update installers to version 0.9.3 and modify download links in index.html`. Keep commits focused: one content update, release asset update, or workflow change at a time. PRs should summarize changed pages, list updated installer versions, include screenshots for layout changes, and note whether GitHub Pages deployment is expected.

## Security & Release Tips

Do not commit private keys, signing certificates, tokens, or unpublished credentials. Only publish installer binaries produced by the desktop release workflow. Keep `security.html` aligned with the desktop and server `SECURITY.md` files.
