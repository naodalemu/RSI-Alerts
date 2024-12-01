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

// Update RSI categories
function updateRSICategories(data) {
  const buyList = document.getElementById("buy-list");
  const waitList = document.getElementById("wait-list");
  const sellList = document.getElementById("sell-list");

  buyList.innerHTML = "";
  waitList.innerHTML = "";
  sellList.innerHTML = "";

  data.forEach((coin) => {
    const card = `
      <div class="card">
        <div class="card-head"><strong><img src="${coin.image}" alt="${coin.name}" width="20">${coin.coin}</strong><strong>$${coin.current_price.toFixed(2)}</strong></div>
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
    } else if (coin.rsi < 30) {
      buyList.innerHTML += card;
    } else {
      waitList.innerHTML += card;
    }
  });
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
              ? "rgba(54, 162, 235, 0.7)" // Oversold (Blue)
              : "rgba(75, 192, 192, 0.7)" // Neutral (Green)
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
                `Name: ${coin.name}`,
                `Rank: ${coin.rank}`,
                `RSI: ${coin.rsi.toFixed(2)}`,
                `Price: $${coin.current_price.toFixed(2)}`,
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

// Initialize the Dashboard
async function initDashboard() {
  const data = await fetchRSIData();
  updateRSICategories(data);
  initChart(data);
}

// Load Dashboard
initDashboard();
