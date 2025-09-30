const main = document.querySelector("main .search");
const search = document.getElementById("search");
let lastInp = "";
let currentIndex = -1;

function searchAutocomplete(str) {
  function googleSuggestJSONP(query) {
    return new Promise((resolve, reject) => {
      const cb = "gs_cb_" + Date.now() + Math.floor(Math.random() * 1000);
      window[cb] = (data) => {
        resolve(data);
        cleanup();
      };
      const script = document.createElement("script");
      script.src = `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(
        query
      )}&callback=${cb}`;
      script.onerror = () => {
        reject(new Error("JSONP load error"));
        cleanup();
      };
      document.head.appendChild(script);

      function cleanup() {
        delete window[cb];
        script.remove();
      }
    });
  }

  googleSuggestJSONP(str).then((data) => {
    const queries = data[1];
    let autocomp = document.getElementById("autocomp");
    if (!autocomp) {
      autocomp = document.createElement("div");
      autocomp.classList.add("autocomp");
      autocomp.id = "autocomp";
    }

    autocomp.innerHTML = "";
    currentIndex = -1;

    queries.forEach((q) => {
      const qElm = document.createElement("div");
      qElm.classList.add("suggestion");
      qElm.onclick = () => {
        search.value = q;
        search.focus();
        const autocomp = document.getElementById("autocomp");
        if (autocomp) autocomp.remove();
        renderResults(q);
      };

      const regex = new RegExp(`(${str})`, "i");
      qElm.innerHTML = q.replace(regex, "<strong><i>$1</i></strong>");
      autocomp.appendChild(qElm);
    });

    main.appendChild(autocomp);
  });
}

function updateHighlight() {
  const autocomp = document.getElementById("autocomp");
  if (!autocomp) return;
  const items = autocomp.querySelectorAll(".suggestion");
  items.forEach((item, i) => {
    const isHighlighted = i === currentIndex;
    item.classList.toggle("highlighted", isHighlighted);
    if (isHighlighted) {
      item.scrollIntoView({
        block: "nearest",
        inline: "nearest",
        behavior: "smooth",
      });
    }
  });
}

search.addEventListener("input", (e) => {
  const val = e.target.value.trim();
  if (val !== lastInp) {
    searchAutocomplete(val);
    lastInp = val;
  } else {
    const autocomp = document.getElementById("autocomp");
    if (autocomp) autocomp.remove();
  }
});

search.addEventListener("focus", (e) => {
  const val = e.target.value.trim();
  if (val !== lastInp) {
    searchAutocomplete(val);
  } else {
    const autocomp = document.getElementById("autocomp");
    if (autocomp) autocomp.remove();
  }
});

search.addEventListener("keydown", (e) => {
  const autocomp = document.getElementById("autocomp");
  const items = autocomp ? autocomp.querySelectorAll(".suggestion") : [];

  if (e.key === "ArrowDown") {
    e.preventDefault();
    if (currentIndex < items.length - 1) {
      currentIndex++;
      updateHighlight();
    }
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    if (currentIndex > 0) {
      currentIndex--;
      updateHighlight();
    } else if (currentIndex === 0) {
      currentIndex = -1;
      updateHighlight();
    }
  } else if (e.key === "Tab") {
    e.preventDefault();
    if (items[0]) {
      search.value = items[0].innerText;
      searchAutocomplete(search.value);
    }
  } else if (e.key === "Enter") {
    e.preventDefault();
    if (currentIndex >= 0 && items[currentIndex]) {
      search.value = items[currentIndex].innerText;
      const autocomp = document.getElementById("autocomp");
      if (autocomp) autocomp.remove();
      currentIndex = -1;
    } else {
      if (search.value == "") return;
      renderResults(search.value);
    }
  }
});

search.focus();
window.addEventListener("keydown", (e) => {
  if (e.key === "/") search.focus();
});

async function searchFor(query) {
  const proxy = "https://proxy.corsfix.com/?";
  let q = checkForEasterEggs(query);
  q = encodeURIComponent(q);
  const client = `https://duckduckgo.com/html/?q=`;
  const response = await fetch(proxy + client + q);
  const html = await response.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const results = [...doc.querySelectorAll(".result")]
    .map((el) => {
      const link = el.querySelector(".result__a");
      const snippet = el.querySelector(".result__snippet");
      const source = el.querySelector(".result__url");
      const icon = el.querySelector(".result__icon__img");

      return {
        title: link ? link.textContent.trim() : null,
        url: link ? link.href : null,
        snippet: snippet
          ? snippet.textContent.trim().replace(/\n/g, "<br />")
          : null,
        displayUrl: source ? source.textContent.trim() : null,
        icon: icon ? icon.src : null,
      };
    })
    .filter((result) => Object.values(result).some((value) => value !== null));

  return results;
}

function checkForEasterEggs(q) {
  document.querySelectorAll(".EE").forEach((ee) => ee.remove());
  switch (q) {
    case "]meatball": {
      let img = document.createElement("img");
      img.src = "media/easter-eggs/meatball.png";
      img.classList.add("i_right", "EE");
      document.body.appendChild(img);
      return "meatball";
    }

    case "]lucky": {
      let img = document.createElement("img");
      img.src = "media/easter-eggs/lucky.png";
      img.classList.add("i_left", "EE");
      document.body.appendChild(img);
      return "lucky";
    }

    default:
      return q;
  }
}

async function renderResults(query) {
  const autocomp = document.getElementById("autocomp");
  if (autocomp) autocomp.remove();
  let resultsBox = document.getElementById("results");
  resultsBox.innerHTML = "<p>Loading...</p>";

  try {
    const results = await searchFor(query);

    resultsBox.innerHTML = "";
    if (!results.length) {
      resultsBox.innerHTML =
        "<p><strong>MISSINGNO</strong><br/>No Results Found</p><br/><img src='media/easter-eggs/missingno.png' class='i_right' />";
      return;
    }

    results.forEach((res) => {
      const card = document.createElement("div");
      card.classList.add("result");

      const icon = document.createElement("img");
      icon.src = res.icon || "media/icons/globe.svg";

      const title = document.createElement("a");
      title.href = res.url;
      title.target = "_blank";
      title.rel = "noopener noreferrer";
      title.textContent = res.title || "MISSINGNO";
      title.title = res.displayUrl || "MISSINGNO";

      const snippet = document.createElement("p");
      snippet.innerHTML = res.snippet || "";

      card.appendChild(icon);
      card.appendChild(title);
      card.appendChild(snippet);
      resultsBox.appendChild(card);
    });
  } catch (err) {
    resultsBox.innerHTML = `<p>Error: ${err.message}</p>`;
  }
}
