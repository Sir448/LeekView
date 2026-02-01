const EVENT_COLOURS = {
  "community-day": "#1660a9",
  battles: "#16a085",

  max: "#9b59b6",
  "max-battles": "#811356",
  "max-mondays": "#690342",

  raids: "#e91e63",

  "raid-events": "#3498db",
  "raid-hour": "#c0392b",
  "raid-day": "#e74c3c",

  "raid-rotations": "#95a5a6",
  "raid-battles": "#c0392b",
  "mega-raid-battles": "#bb8fce",
  "shadow-raid-battles": "#5b2c6f",

  "elite-raids": "#a21416",
  event: "#27ae60",
  season: "#38ada9",
  research: "#1abc9c",
  "research-day": "#159e83",
  "timed-research": "#1abc9c",
  "limited-research": "#159e83",
  "pokéstop-showcase": "#3ca392",
  "live-event": "#d63031",
  "pokémon-go-fest": "#153d94",
  "pokémon-go-tour": "#1d3a74",
  "research-breakthrough": "#795548",
  "special-research": "#13a185",
  "global-challenge": "#0a64b5",
  "go-rocket-takeover": "#1e1e1e",
  "team-go-rocket": "#1e1e1e",
  "giovanni-special-research": "#1e272e",
  "safari-zone": "#3d7141",
  "city-safari": "#3d7141",
  "ticketed-event": "#de3e9b",
  ticketed: "#de3e9b",
  "go-battle-league": "#8e44ad",
  "pokémon-spotlight-hour": "#e58e26",
  "bonus-hour": "#40407a",
  update: "#2980b9",
  "raid-weekend": "#6f1e51",
  "potential-ultra-unlock": "#2c3e50",
  "location-specific": "#284b92",
  "wild-area": "#015b63",
  "go-pass": "#ddb22f",
};

const FILTER_BLACKLIST = new Set(["Battles"]);

const FILTER_HIERARCHY = {
  Battles: {
    Max: ["Max Mondays", "Max Battles"],
    Raids: {
      "Raid Events": ["Raid Hour", "Raid Day"],
      "Raid Rotations": [
        "Raid Battles",
        "Mega Raid Battles",
        "Shadow Raid Battles",
      ],
    },
  },
};

function mapLeafsToAncestors(obj, ancestors = []) {
  let results = {};

  for (const [key, value] of Object.entries(obj)) {
    results[key] = [...ancestors];

    if (Array.isArray(value)) {
      value.forEach((leaf) => {
        results[leaf] = [...ancestors, key];
      });
    } else if (typeof value === "object" && value !== null) {
      const nestedResults = mapLeafsToAncestors(value, [...ancestors, key]);
      results = { ...results, ...nestedResults };
    }
  }
  return results;
}

const PARENTS = mapLeafsToAncestors(FILTER_HIERARCHY);

let hourWidth = 5;
let startDate = new Date();
startDate.setHours(0, 0, 0, 0);
let daysToShow = 30;

function getUncheckedCategories() {
  const checkedBoxes = document.querySelectorAll(".cat-checkbox:not(:checked)");

  const checkedSet = new Set(Array.from(checkedBoxes).map((cb) => cb.value));

  return checkedSet;
}

function renderTimeline(eventDataArray) {
  const now = new Date();
  const nowOffsetInHours = (now - startDate) / (1000 * 60 * 60);
  const nowPositionX = nowOffsetInHours * hourWidth;

  const nowLineHTML = `
        <div class="now-line" style="left: ${nowPositionX}px;">
            <span class="now-label">NOW</span>
        </div>
    `;

  document.getElementById("btn-today").addEventListener("click", () => {
    const wrapper = document.querySelector(".timeline");
    const centerOffset = wrapper.offsetWidth / 2;

    wrapper.scrollTo({
      left: nowPositionX - centerOffset,
      behavior: "smooth",
    });
  });

  let headerHTML = "";
  let monthRowHTML = "";
  let currentMonth = -1;
  let daysInCurrentMonth = 0;

  for (let i = 0; i < daysToShow; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);

    const month = d.getMonth();
    const monthName = d.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });

    if (month !== currentMonth && currentMonth !== -1) {
      monthRowHTML += `
        <div class="tl-month-block" style="width: ${daysInCurrentMonth * hourWidth * 24}px;">
            <span class="tl-sticky-label">${prevMonthName}</span>
            </div>`;
      daysInCurrentMonth = 0;
    }

    currentMonth = month;
    prevMonthName = monthName;
    daysInCurrentMonth++;
    headerHTML += `
    <div class="tl-header-day" style="width: ${hourWidth * 24}px;">
        <span class="tl-sticky-label">
            ${d.getDate()} ${d.toLocaleDateString("en-US", { weekday: "short" })}
        </span>
    </div>`;

    if (i === daysToShow - 1) {
      monthRowHTML += `
        <div class="tl-month-block" style="width: ${daysInCurrentMonth * hourWidth * 24}px;">
            <span class="tl-sticky-label">${monthName}</span>
        </div>`;
    }
  }

  const finalHeader = `
    <div class="tl-month-row">${monthRowHTML}</div>
    <div class="tl-days-row">${headerHTML}</div>
`;

  let rowEnds = [];
  let rowsHTML = "";

  const inactiveFilters = getUncheckedCategories();

  Object.keys(eventDataArray).forEach((category) => {
    if (inactiveFilters.has(category)) {
      return;
    }
    const eventsInCategory = eventDataArray[category];
    eventsInCategory.sort((a, b) => {
      return new Date(a.start) - new Date(b.start);
    });

    let categoryOwnedRows = [];

    eventsInCategory.forEach((event) => {
      if (inactiveFilters.has(event.eventType)) {
        return;
      }
      const evStart = new Date(event.start);
      const evEnd = new Date(event.end);

      const diffStart = (evStart - startDate) / (1000 * 60 * 60 * 24);
      const diffDuration = (evEnd - evStart) / (1000 * 60 * 60 * 24);

      if (evEnd > startDate && diffStart < daysToShow) {
        const left = diffStart * hourWidth * 24;
        const width = Math.max(38, diffDuration * hourWidth * 24);

        let assignedRow = -1;

        for (let rowIndex of categoryOwnedRows) {
          if (rowEnds[rowIndex] <= left) {
            assignedRow = rowIndex;
            break;
          }
        }

        if (assignedRow === -1) {
          assignedRow = rowEnds.length;
          rowEnds.push(0);
          categoryOwnedRows.push(assignedRow);
        }

        rowEnds[assignedRow] = left + width;
        const top = assignedRow * 45;

        const battles = new Set([
          "Raid Hour",
          "Raid Day",
          "Pokémon Spotlight Hour",
          "Max Mondays",
          "Max Battles",
        ]);

        const typeClass = (
          battles.has(event.eventType) ? event.eventType : category
        )
          .toLowerCase()
          .replace(/\s+/g, "-");
        const baseColor = EVENT_COLOURS[typeClass] || "#cccccc";
        const gradient = `linear-gradient(to right, ${baseColor} 30%, white)`;

        const startFull = new Date(event.start).toLocaleString([], {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        });
        const endFull = new Date(event.end).toLocaleString([], {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        });

        const isTooCloseToTop = top < 320;
        const isTooCloseToRight =
          left + width > daysToShow * hourWidth * 24 - 300;

        let flipClasses = "";
        if (isTooCloseToTop) flipClasses += " tooltip-flipped ";
        if (isTooCloseToRight) flipClasses += " tooltip-flipped-right ";

        tooltip = `<div class="ld-tooltip column-layout">
                    <div class="tooltip-image-container" >
                        <img src="${event.image}" 
                            class="tooltip-img-large" 
                            style="border: 5px solid ${baseColor};"> 
                        <span class="tooltip-badge-overlay" style="background-color: ${baseColor};"> ${event.eventType}
                        </span>
                    </div>
                    
                    <div class="tooltip-body">
                        <h2 class="tooltip-title-large">${event.name}</h2>
                        
                        <div class="tooltip-info-section">
                            <div class="info-item">
                                <span class="info-label">Start:</span>
                                <span class="info-value">${startFull}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">End:</span>
                                <span class="info-value">${endFull}</span>
                            </div>
                        </div>

                        <div class="tooltip-countdown-box">
                            <div class="countdown-label">TIME REMAINING</div>
                            <div class="countdown-display" data-end="${event.end}">
                                Calculating...
                            </div>
                        </div>
                    </div>
                </div>`;

        rowsHTML += `
            <div class="ld-bar-wrapper ${flipClasses}" style="left: ${left}px; width: ${width}px; top: ${top}px;">
                <a href="${event.link}" class="ld-bar-link">
                    <div class="ld-timeline-bar" 
                    style="width: 100%; background: ${gradient}"
                    title="${event.eventType}: ${event.name}">
                        <div class="ld-bar-inner">
                            <img src="${event.image}" class="ld-bar-img">
                            <span class="ld-bar-title">${event.name}</span>
                            ${tooltip}
                        </div>
                    </div>
                </a>
            </div>
        `;
      }
    });
  });
  const backgroundSize =
    hourWidth *
    (parseInt(document.getElementById("width-select").value) <= 7 ? 1 : 24);

  const timelineHTML = `
        <div class="tl-header style="width: fit-content">${finalHeader}</div>
        <div class="tl-content" 
            style="width: ${daysToShow * hourWidth * 24}px; 
            background-size: ${backgroundSize}px 100%, 100% 45px;">
            ${rowsHTML}
            ${nowLineHTML}
        </div>
    `;

  const target = document.querySelector(".timeline");
  target.innerHTML = timelineHTML;

  const finalHeight = rowEnds.length * 45 + 80;

  const tlContent = document.querySelector(".tl-content");
  if (tlContent) {
    tlContent.style.height = `${finalHeight}px`;
  }

  const wrapper = document.querySelector(".timeline");
  const centerOffset = wrapper.offsetWidth / 2;
  wrapper.scrollLeft = nowPositionX - centerOffset;

  const updateCountdowns = () => {
    const displays = document.querySelectorAll(".countdown-display");
    const now = new Date().getTime();

    displays.forEach((display) => {
      const endTime = new Date(display.dataset.end).getTime();
      const distance = endTime - now;

      if (distance < 0) {
        display.innerHTML = "EVENT ENDED";
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      display.innerHTML = `${days}d ${hours}h ${minutes}m ${seconds}s`;
    });
  };

  setInterval(updateCountdowns, 1000);
}

async function renderFilterMenu(eventDataArray) {
  const container = document.getElementById("filter-dropdown");
  const assignedCategories = new Set();

  const allData = await chrome.storage.local.get(null);

  const filters = Object.keys(allData)
    .filter((key) => key.startsWith("filter:"))
    .reduce((obj, key) => {
      obj[key] = allData[key];
      return obj;
    }, {});

  [...Object.keys(PARENTS), ...Object.keys(eventDataArray)].forEach((cat) => {
    filters[`filter:${cat}`] ??= true;
  });

  async function renderCheckboxHTML(cat, level = 0) {
    assignedCategories.add(cat);
    const typeClass = cat.toLowerCase().replace(/\s+/g, "-");
    const filterName = `filter:${cat}`;

    const isDisabled =
      cat in PARENTS && !PARENTS[cat].every((p) => filters[`filter:${p}`]);
    const isChecked = filters[filterName] && !isDisabled;

    return `
        <label class="filter-item" style="margin-left: ${20 * level}px; ${isDisabled ? "opacity: 0.5; pointer-events: none;" : ""}">
            <input type="checkbox" ${isDisabled ? "disabled" : isChecked ? "checked" : ""} value="${cat}" class="cat-checkbox" data-level="${level}">
            <span class="filter-color-dot" style="background-color: ${EVENT_COLOURS[typeClass] || "#ccc"}"></span>
            ${cat}
        </label>`;
  }

  async function buildHierarchyHtml(node, level = 0) {
    let html = "";
    if (Array.isArray(node)) {
      for (const leaf of node) {
        html += await renderCheckboxHTML(leaf, level);
      }
    } else {
      for (const [key, value] of Object.entries(node)) {
        html +=
          (await renderCheckboxHTML(key, level)) +
          (await buildHierarchyHtml(value, level + 1));
      }
    }

    return html;
  }

  let finalHtml = await buildHierarchyHtml(FILTER_HIERARCHY);

  for (const cat of Object.keys(eventDataArray)) {
    if (!assignedCategories.has(cat)) {
      finalHtml += await renderCheckboxHTML(cat);
    }
  }

  container.innerHTML = finalHtml;

  document.getElementById("btn-filter").addEventListener("click", (e) => {
    e.stopPropagation();
    container.style.display =
      container.style.display === "none" ? "block" : "none";
  });

  window.addEventListener("click", () => {
    container.style.display = "none";
  });
  container.addEventListener("click", (e) => e.stopPropagation());

  const checkboxes = container.querySelectorAll(".cat-checkbox");
  checkboxes.forEach((checkbox, index) => {
    checkbox.addEventListener("change", (e) => {
      const isChecked = e.target.checked;
      const currentLevel = parseInt(e.target.dataset.level);
      const allCheckboxes = Array.from(checkboxes);

      const filterData = {
        [`filter:${checkbox.value}`]: isChecked,
      };

      for (let i = index + 1; i < allCheckboxes.length; i++) {
        const nextBox = allCheckboxes[i];
        const nextLevel = parseInt(nextBox.dataset.level);

        if (currentLevel >= nextLevel) {
          break;
        }

        nextBox.checked = isChecked;
        nextBox.disabled = !isChecked;

        nextBox.parentElement.style.opacity = isChecked ? "1" : "0.5";
        nextBox.parentElement.style.pointerEvents = isChecked ? "auto" : "none";
        filterData[`filter:${nextBox.value}`] = isChecked;
      }
      renderTimeline(eventDataArray);
      chrome.storage.local.set(filterData);
    });
  });
}

chrome.storage.local.get(["enabled"], (result) => {
  if (result.enabled === false) {
    console.log("LeekView extension is disabled");
    return;
  }
  console.log("Loading LeekView!");

  window.addEventListener("DOMContentLoaded", async () => {
    const eventSpans = document.querySelectorAll(
      ".current-events .event-header-item-wrapper",
    );

    const eventDataArray = {
      "Pokémon GO Tour": [],
      Event: [],
      "Community Day": [],
      "Team GO Rocket": [],
      "Research Day": [],

      Battles: [],
      "Raid Hour": [],
      "Raid Day": [],
      "Raid Battles": [],
      "Mega Raid Battles": [],
      "Shadow Raid Battles": [],
      "Pokémon Spotlight Hour": [],
      "Max Mondays": [],
      "Max Battles": [],

      "GO Pass": [],
      "GO Battle League": [],
      Season: [],
      Research: [],
    };

    // filters
    /**
     * battles
     *  events
     *   raids
     *    raid hour
     *    raid day
     *   max battles
     *    max mondays
     *    max battles
     *  raid rotations
     *   mega raids
     *   shadow raids
     *   legendary raids
     *
     *
     *
     *
     *
     */

    const battles = new Set([
      "Raid Hour",
      "Raid Day",
      "Pokémon Spotlight Hour",
      "Max Mondays",
      "Max Battles",
    ]);
    let maxEndDate = new Date();
    let minStartDate = new Date();

    eventSpans.forEach((span) => {
      eventType = span.querySelector(".event-tag-badge")?.textContent.trim();
      eventName = span.querySelector("h2")?.textContent.trim();
      const eventObject = {
        name: eventName,

        eventType: eventType,

        start: span.dataset.eventStartDateCheck,
        end: span.dataset.eventEndDate,

        image: span.querySelector("img")?.src,

        isLocalTime: span.dataset.eventLocalTime === "true",

        link: span.querySelector("a.event-item-link")?.getAttribute("href"),
      };

      if (!eventDataArray[eventType]) {
        eventDataArray[eventType] = [];
      }

      if (eventType === "Raid Battles" && eventName.includes("Mega Raids")) {
        eventDataArray["Mega Raid Battles"].push(eventObject);
      } else if (
        eventType === "Raid Battles" &&
        eventName.includes("Shadow Raids")
      ) {
        eventDataArray["Shadow Raid Battles"].push(eventObject);
      } else if (battles.has(eventType)) {
        eventDataArray["Battles"].push(eventObject);
      } else {
        eventDataArray[eventType].push(eventObject);
      }
      const eventStart = new Date(span.dataset.eventStartDateCheck);
      if (eventStart < minStartDate) {
        minStartDate = eventStart;
      }
      const eventEnd = new Date(span.dataset.eventEndDate);
      if (eventEnd > maxEndDate) {
        maxEndDate = eventEnd;
      }
    });

    startDate = new Date(minStartDate);
    startDate.setHours(0, 0, 0, 0);

    daysToShow =
      Math.ceil((maxEndDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

    const result = await chrome.storage.local.get(["timelineZoom"]);
    const savedZoom = result.timelineZoom || "30";
    hourWidth = Math.round(screen.width / parseInt(savedZoom) / 24);

    const target = document.querySelector(".article-page");
    target.innerHTML = `
        <div>
            <div class="tl-controls">
                <h2 class="tl-title">Events</h2>
                <div class="tl-zoom-group">
                    <button id="btn-today" class="tl-btn-today">Today</button>
                    <label for="width-select">Zoom Level:</label>
                    <select id="width-select">
                        <option value="1" ${savedZoom === "1" ? "selected" : ""}>One Day</option>
                        <option value="7" ${savedZoom === "7" ? "selected" : ""}>One Week</option>
                        <option value="14" ${savedZoom === "14" ? "selected" : ""}>Two Weeks</option>
                        <option value="30" ${savedZoom === "30" ? "selected" : ""}>One Month</option>
                        <option value="60" ${savedZoom === "60" ? "selected" : ""}>Two Months</option>
                    </select>
                    <div class="tl-filter-container">
                        <button id="btn-filter" class="tl-btn-filter-icon" title="Filter Categories">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                            </svg>
                        </button>
                        <div id="filter-dropdown" class="tl-filter-dropdown" style="display: none;">
                            </div>
                    </div>
                </div>
            </div>
            <div class="timeline"></div>
        </div>
    `;

    await renderFilterMenu(eventDataArray);

    document.getElementById("width-select").addEventListener("change", (e) => {
      hourWidth = Math.round(screen.width / parseInt(e.target.value) / 24);
      renderTimeline(eventDataArray);
      chrome.storage.local.set({ timelineZoom: e.target.value });
    });
    renderTimeline(eventDataArray);
  });
});
