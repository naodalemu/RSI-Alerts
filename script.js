const RSI_URL = "https://www.cryptowaves.app/api/rsi";

// Store previous RSI states and last notification timestamps
let previousRSIStates = {};
let lastNotificationTimestamps = {};
let isFirstLoad = true; // Flag to indicate if it's the first data load
let currentRSIType = "4h"; // Default graph type
let chartInstance = null; // Store the chart instance

// Notification cooldown period (in milliseconds, e.g., 1 hour = 3600000 ms)
const NOTIFICATION_COOLDOWN = 3600000;

// Fetch RSI data
async function fetchRSIData() {
  try {
    const response = await fetch(RSI_URL);
    if (!response.ok) throw new Error("Failed to fetch RSI data");
    return await response.json();
  } catch (error) {
    console.error(error);
    return [];
  }
}

// Send RSI Notification
function sendRSINotification(coin, rsi, type, rsiType) {
  const now = Date.now();
  const lastNotificationTime = lastNotificationTimestamps[coin.coin] || 0;

  // Check if cooldown period has passed
  if (now - lastNotificationTime < NOTIFICATION_COOLDOWN) {
    console.log(`Notification suppressed for ${coin.coin} (cooldown active).`);
    return;
  }

  // Adjust notification title based on RSI thresholds
  const notificationTitle = `${rsi == null ? "🚫" : rsi < 20 ? "⭐" : rsi > 80 ? "🔥" : type === "Overbought (Sell Opportunity)" ? "🔴" : "🟢"} ${coin.coin}: ${rsi == null ? "No Data About This Coin" : type }`;
  const notificationBody = `
- RSI (${rsiType}): ${rsi ? rsi.toFixed(2) : "No RSI Value For This Coin!"}
- Current Price: $${coin.current_price ? coin.current_price.toFixed(6) : null}

${rsi == null ? "Something wrong about this coin 🚫" : rsi < 20 ? "Strong Buy Signal! ⭐" : rsi > 80 ? "Extreme Overbought Signal! 🔥" : "Keep an eye on the market!"}
  `;

  // Check if the browser supports notifications
  if (!("Notification" in window)) {
    alert(`${notificationTitle}\n${notificationBody}`);
    return;
  }

  // Permission check for sending notifications
  if (Notification.permission === "granted") {
    new Notification(notificationTitle, { body: notificationBody });
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        new Notification(notificationTitle, { body: notificationBody });
      }
    });
  }

  // Update the last notification timestamp
  lastNotificationTimestamps[coin.coin] = now;
}

// Update RSI categories and counters
function updateRSICategories(data) {
  const buyList = document.getElementById("buy-list");
  const waitList = document.getElementById("wait-list");
  const sellList = document.getElementById("sell-list");

  const buyCounter = document.querySelector(".amount_of_buys");
  const waitCounter = document.querySelector(".amount_of_waits");
  const sellCounter = document.querySelector(".amount_of_sells");

  // Clear lists
  buyList.innerHTML = "";
  waitList.innerHTML = "";
  sellList.innerHTML = "";

  // Initialize counters
  let buyCount = 0;
  let waitCount = 0;
  let sellCount = 0;

  // Populate lists and increment counters
  data.forEach((coin) => {
    const card = `
      <div class="card">
        <div class="card-head">
          <strong>
            <img src="${coin.image ? coin.image : null}" alt="${coin.name ? coin.name : null}" width="20">
            ${coin.coin ? coin.coin : null}
            <span class="coin-rank">#${coin.rank ? coin.rank : null}</span>
          </strong>
          <strong>$${coin.current_price ? coin.current_price.toFixed(6) : null}</strong>
        </div>
        <div><span>[Name]</span><span>${coin.name ? coin.name : null}</span></div>
        <div><span>[RSI (4h)]</span><span>${coin.rsi ? coin.rsi.toFixed(2) : null}</span></div>
        <div><span>[RSI (1d)]</span><span>${coin.rsi_1d ? coin.rsi_1d.toFixed(2) : null}</span></div>
        <div><span>[1H]</span><span>${coin.change_1h ? coin.change_1h.toFixed(2) : null}%</span></div>
        <div><span>[24H]</span><span>${coin.change_24h ? coin.change_24h.toFixed(2) : null}%</span></div>
        <div><span>[7D]</span><span>${coin.change_7d ? coin.change_7d.toFixed(2) : null}%</span></div>
        <div><span>[30D]</span><span>${coin.change_30d ? coin.change_30d.toFixed(2) : null}%</span></div>
      </div>
    `;

    if (coin.rsi > 70) {
      sellList.innerHTML += card;
      sellCount++;

      // Trigger notification for 4h RSI
      if (!isFirstLoad && (!previousRSIStates[coin.coin] || previousRSIStates[coin.coin] <= 70)) {
        sendRSINotification(coin, coin.rsi, "Overbought (Sell Opportunity)", "4h");
      }
    } else if (coin.rsi < 30) {
      buyList.innerHTML += card;
      buyCount++;

      // Trigger notification for 4h RSI
      if (!isFirstLoad && (!previousRSIStates[coin.coin] || previousRSIStates[coin.coin] >= 30)) {
        sendRSINotification(coin, coin.rsi, "Oversold (Buy Opportunity)", "4h");
      }
    } else {
      waitList.innerHTML += card;
      waitCount++;
    }

    // Trigger notifications for 1D RSI and thresholds
    if (coin.rsi_1d > 80) {
      sendRSINotification(coin, coin.rsi_1d, "Extreme Overbought Signal (1D)", "1d");
    } else if (coin.rsi_1d < 20) {
      sendRSINotification(coin, coin.rsi_1d, "Strong Buy Signal (1D)", "1d");
    }

    // Update previous RSI state
    previousRSIStates[coin.coin] = coin.rsi;
  });

  // Update counters in the UI
  buyCounter.textContent = `${buyCount}`;
  waitCounter.textContent = `${waitCount}`;
  sellCounter.textContent = `${sellCount}`;

  // Re-attach event listeners to the newly created cards
  attachCardClickListeners();
}

// Add click event listener to toggle card expansion
function attachCardClickListeners() {
  const cards = document.querySelectorAll(".card");

  cards.forEach((card) => {
    card.addEventListener("click", () => {
      card.classList.toggle("expanded");
    });
  });
}

// Initialize the Chart
function updateChart(data) {
  const ctx = document.getElementById("rsiChart").getContext("2d");

  const filteredData = data.map((coin) => ({
    x: coin.rank,
    y: currentRSIType === "4h" ? coin.rsi : coin.rsi_1d,
    details: coin,
  }));

  const backgroundColors = data.map((coin) =>
    currentRSIType === "4h"
      ? coin.rsi > 70
        ? "rgba(255, 99, 132, 0.7)" // Overbought (Red)
        : coin.rsi < 30
        ? "rgba(46, 232, 83, 0.7)" // Oversold (Green)
        : "rgba(54, 162, 255, 0.7)" // Neutral (Blue)
      : coin.rsi_1d > 70
      ? "rgba(255, 99, 132, 0.7)" // Overbought (Red)
      : coin.rsi_1d < 30
      ? "rgba(46, 232, 83, 0.7)" // Oversold (Green)
      : "rgba(54, 162, 255, 0.7)" // Neutral (Blue)
  );

  if (chartInstance) {
    chartInstance.destroy(); // Destroy existing chart to render a new one
  }

  chartInstance = new Chart(ctx, {
    type: "scatter",
    data: {
      datasets: [
        {
          label: `RSI Levels (${currentRSIType})`,
          data: filteredData,
          backgroundColor: backgroundColors,
          radius: 4,
        },
      ],
    },
    options: {
      animation: false,
      plugins: {
        tooltip: {
          callbacks: {
            label: (context) => {
              const coin = context.raw.details;
              return [
                `Name: ${coin.name} (${coin.coin})`,
                `Rank: ${coin.rank}`,
                `RSI (${currentRSIType}): ${currentRSIType === "4h" ? coin.rsi.toFixed(2) : coin.rsi_1d.toFixed(2)}`,
                `Price: $${coin.current_price.toFixed(2)}`,
                `1H: ${coin.change_1h.toFixed(2)}%`,
                `24H: ${coin.change_24h.toFixed(2)}%`,
                `7D: ${coin.change_7d.toFixed(2)}%`,
              ];
            },
          },
        },
      },
      scales: {
        x: {
          type: "linear",
          title: {
            display: true,
            text: "Rank",
          },
        },
        y: {
          title: {
            display: true,
            text: `RSI (${currentRSIType})`,
          },
        },
      },
    },
  });
}

// Event listeners for the toggle buttons
document.getElementById("rsi4hButton").addEventListener("click", () => {
  currentRSIType = "4h";
  document.getElementById("rsi4hButton").classList.add("active");
  document.getElementById("rsi1dButton").classList.remove("active");
  fetchRSIData().then(updateChart);
});

document.getElementById("rsi1dButton").addEventListener("click", () => {
  currentRSIType = "1d";
  document.getElementById("rsi1dButton").classList.add("active");
  document.getElementById("rsi4hButton").classList.remove("active");
  fetchRSIData().then(updateChart);
});

// Add click event listener to toggle card expansion
document.addEventListener("DOMContentLoaded", () => {
  const cards = document.querySelectorAll(".card");
  
  cards.forEach((card) => {
    card.addEventListener("click", () => {
      card.classList.toggle("expanded");
    });
  });
});

// Initialize the Dashboard
async function initDashboard() {
  const data = await fetchRSIData();
  updateRSICategories(data);
  updateChart(data);

  if (isFirstLoad) isFirstLoad = false;
}

// Request notification permissions on load
if ("Notification" in window) {
  Notification.requestPermission();
}

initDashboard();
setInterval(initDashboard, 30000);
