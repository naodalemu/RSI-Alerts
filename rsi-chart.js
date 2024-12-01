// Fetch RSI Data from API
const RSI_URL = "https://www.cryptowaves.app/api/rsi";

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

// Initialize the Chart
async function initChart() {
  const data = await fetchRSIData();

  // Map the data into the format required by Chart.js
  const chartData = data.map(coin => ({
    x: coin.rank, // Coin Rank (x-axis)
    y: coin.rsi, // RSI value (y-axis)
    details: coin, // Attach full details for tooltips
  }));

  const ctx = document.getElementById("rsiChart").getContext("2d");

  new Chart(ctx, {
    type: "scatter",
    data: {
      datasets: [
        {
          label: "RSI Scatter",
          data: chartData,
          backgroundColor: (context) => {
            const value = context.raw.y; // RSI value
            if (value > 70) return "rgba(255, 99, 132, 0.7)"; // Overbought (red)
            if (value < 30) return "rgba(54, 162, 235, 0.7)"; // Oversold (blue)
            return "rgba(75, 192, 192, 0.7)"; // Neutral (green)
          },
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        tooltip: {
          callbacks: {
            label: function (context) {
              const coin = context.raw.details;
              return [
                `Name: ${coin.name} (${coin.coin})`,
                `Rank: ${coin.rank}`,
                `RSI: ${coin.rsi.toFixed(2)}`,
                `Price: $${coin.current_price.toFixed(2)}`,
                `1H Change: ${coin.change_1h.toFixed(2)}%`,
                `24H Change: ${coin.change_24h.toFixed(2)}%`,
                `7D Change: ${coin.change_7d.toFixed(2)}%`,
              ];
            },
          },
        },
      },
      scales: {
        x: {
          type: "linear",
          position: "bottom",
          title: {
            display: true,
            text: "Coin Rank",
          },
        },
        y: {
          title: {
            display: true,
            text: "RSI (4h)",
          },
        },
      },
    },
  });
}

// Initialize the chart on page load
initChart();
