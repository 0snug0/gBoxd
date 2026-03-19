(() => {
  const INJECTED_ID = "lbxd-buttons";

  // Letterboxd film slug: lowercase, hyphens, strip special chars
  function toSlug(title) {
    return title
      .toLowerCase()
      .replace(/['']/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function buildLetterboxdUrls(title, year) {
    const query = year ? `${title} ${year}` : title;
    const searchUrl = `https://letterboxd.com/search/films/${encodeURIComponent(query)}/`;
    // Best-effort direct film URL using slug + year fallback
    const slug = year ? `${toSlug(title)}-${year}` : toSlug(title);
    const filmUrl = `https://letterboxd.com/film/${slug}/`;
    return { searchUrl, filmUrl };
  }

  // Extract movie title and year from the knowledge panel
  function extractMovieInfo() {
    // Confirm this is a film/movie knowledge panel
    const isFilm =
      document.querySelector('[data-attrid*="/film/"]') ||
      document.querySelector('[data-attrid*="film:"]');
    if (!isFilm) return null;

    // Title: Google places it in the kp header
    const titleEl =
      document.querySelector('[data-attrid="title"]') ||
      document.querySelector('[data-attrid="title"] span') ||
      document.querySelector(".qrShPb span") ||
      document.querySelector("h2.qrShPb");
    if (!titleEl) return null;
    const title = titleEl.textContent.trim();
    if (!title) return null;

    // Year: look for release date attribute or subtitle text like "2008 · Film · ..."
    let year = null;
    const releaseDateEl = document.querySelector(
      '[data-attrid*="release"] [data-value], [data-attrid*="releasedate"] span'
    );
    if (releaseDateEl) {
      const match = releaseDateEl.textContent.match(/\b(19|20)\d{2}\b/);
      if (match) year = match[0];
    }
    if (!year) {
      // Subtitle line often has "2008 ‧ Film ‧ ..."
      const subtitle = document.querySelector(".wwUB2c span, .qrShPb + div span");
      if (subtitle) {
        const match = subtitle.textContent.match(/\b(19|20)\d{2}\b/);
        if (match) year = match[0];
      }
    }

    return { title, year };
  }

  function injectButtons(title, year) {
    if (document.getElementById(INJECTED_ID)) return; // already injected

    const tablist = document.querySelector('[role="tablist"]');
    if (!tablist) return;

    const { filmUrl } = buildLetterboxdUrls(title, year);

    const btn = document.createElement("a");
    btn.id = INJECTED_ID;
    btn.className = "lbxd-btn lbxd-btn--open";
    btn.href = filmUrl;
    btn.target = "_blank";
    btn.rel = "noopener";
    btn.innerHTML = `
      Letterboxd
    `;

    tablist.appendChild(btn);
  }

  function run() {
    const info = extractMovieInfo();
    if (info) {
      injectButtons(info.title, info.year);
    }
  }

  // Run on initial load
  run();

  // Re-run when Google dynamically updates the page (e.g., navigating via search bar)
  const observer = new MutationObserver(() => {
    // Remove stale buttons if panel changed
    const existing = document.getElementById(INJECTED_ID);
    if (existing && !extractMovieInfo()) {
      existing.remove();
      return;
    }
    run();
  });

  observer.observe(document.body, { childList: true, subtree: true });
})();
