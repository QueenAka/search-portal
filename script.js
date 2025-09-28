const main = document.querySelector("main .search");
const search = document.getElementById("search");

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
  if (val) {
    searchAutocomplete(val);
  } else {
    const autocomp = document.getElementById("autocomp");
    if (autocomp) autocomp.remove();
  }
});

search.addEventListener("focus", (e) => {
  const val = e.target.value.trim();
  if (val) {
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
    search.value = items[0].innerText;
    searchAutocomplete(search.value);
  } else if (e.key === "Enter") {
    e.preventDefault();
    if (currentIndex >= 0 && items[currentIndex]) {
      search.value = items[currentIndex].innerText;
      const autocomp = document.getElementById("autocomp");
      if (autocomp) autocomp.remove();
      currentIndex = -1;
    } else {
      if (search.value == "") return;
      open(`https://www.google.com/search?q=${search.value}`, "_self");
    }
  }
});
