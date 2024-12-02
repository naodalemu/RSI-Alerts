const RSI_URL = "https://www.cryptowaves.app/api/rsi";

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
            <img src="${coin.image}" alt="${coin.name}" width="20">
            ${coin.coin}
            <span class="coin-rank">#${coin.rank}</span>
          </strong>
          <strong>$${coin.current_price.toFixed(6)}</strong>
        </div>
        <div><span>[Name]</span><span>${coin.name}</span></div>
        <div><span>[RSI (4h)]</span><span>${coin.rsi.toFixed(2)}</span></div>
        <div><span>[RSI (1d)]</span><span>${coin.rsi_1d.toFixed(2)}</span></div>
        <div><span>[1H]</span><span>${coin.change_1h.toFixed(2)}%</span></div>
        <div><span>[24H]</span><span>${coin.change_24h.toFixed(2)}%</span></div>
        <div><span>[7D]</span><span>${coin.change_7d.toFixed(2)}%</span></div>
        <div><span>[30D]</span><span>${coin.change_30d.toFixed(2)}%</span></div>
      </div>
    `;

    if (coin.rsi > 70) {
      sellList.innerHTML += card;
      sellCount++;
    } else if (coin.rsi < 30) {
      buyList.innerHTML += card;
      buyCount++;
    } else {
      waitList.innerHTML += card;
      waitCount++;
    }
  });

  // Update counters in the UI
  buyCounter.textContent = `${buyCount}`;
  waitCounter.textContent = `${waitCount}`;
  sellCounter.textContent = `${sellCount}`;
}

// Initialize the Chart
function initChart(data) {
  const ctx = document.getElementById("rsiChart").getContext("2d");

  new Chart(ctx, {
    type: "scatter",
    data: {
      datasets: [
        {
          label: "RSI Levels",
          data: data.map((coin) => ({
            x: coin.rank,
            y: coin.rsi,
            details: coin,
          })),
          backgroundColor: data.map((coin) =>
            coin.rsi > 70
              ? "rgba(255, 99, 132, 0.7)" // Overbought (Red)
              : coin.rsi < 30
              ? "rgba(46, 232, 83, 0.7)" // Oversold (Green)
              : "rgba(54, 162, 255, 0.7)" // Neutral (Blue)
          ),
        },
      ],
    },
    options: {
      plugins: {
        tooltip: {
          callbacks: {
            label: (context) => {
              const coin = context.raw.details;
              return [
                `Name: ${coin.name} (${coin.coin})`,
                `Rank: ${coin.rank}`,
                `RSI: ${coin.rsi.toFixed(2)}`,
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
            text: "RSI",
          },
        },
      },
    },
  });
}

// Notification Functionality
function sendNotification(message) {
  if (!("Notification" in window)) {
    alert(message);
    return;
  }

  if (Notification.permission === "granted") {
    new Notification("RSI Alert", { body: message });
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        new Notification("RSI Alert", { body: message });
      }
    });
  }
}

// Request Notification Permission on Page Load
if ("Notification" in window) {
  Notification.requestPermission();
}

// Initialize the Dashboard
async function initDashboard() {
  const data = await fetchRSIData();
  updateRSICategories(data);
  initChart(data);
}

// Update the Dashboard every 30 seconds
initDashboard(); // Initial load
setInterval(initDashboard, 30000); // Refresh every 30 seconds
