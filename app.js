const medicationRecords = [
  { date: "2026-04-17", time: "08:02", dose: "1.25 片", note: "早餐后服用" },
  { date: "2026-04-18", time: "08:00", dose: "1.5 片", note: "无不适" },
  { date: "2026-04-19", time: "08:07", dose: "1.25 片", note: "按计划交替" },
  { date: "2026-04-20", time: "07:58", dose: "1.5 片", note: "外出前服用" },
  { date: "2026-04-21", time: "08:03", dose: "1.25 片", note: "饮食稳定" },
  { date: "2026-04-22", time: "08:01", dose: "1.5 片", note: "按时服药" },
  { date: "2026-04-23", time: "08:05", dose: "1.25 片", note: "今日已记录" },
];

const inrRecords = [
  { date: "2026-03-19", value: 1.7, note: "略低，继续观察" },
  { date: "2026-03-26", value: 1.9, note: "进入目标范围" },
  { date: "2026-04-02", value: 2.2, note: "稳定" },
  { date: "2026-04-09", value: 2.6, note: "略高，留意饮食变化" },
  { date: "2026-04-16", value: 2.3, note: "目标范围内" },
  { date: "2026-04-23", value: 2.1, note: "近期平稳" },
];

const targetMin = 1.8;
const targetMax = 2.5;

function inrStatus(value) {
  if (value < targetMin) {
    return { label: "低于目标", className: "below" };
  }

  if (value > targetMax) {
    return { label: "高于目标", className: "above" };
  }

  return { label: "目标范围内", className: "within" };
}

function renderMedicationRows() {
  const tbody = document.querySelector("#medicationRows");
  tbody.innerHTML = medicationRecords
    .map(
      (record) => `
        <tr>
          <td>${record.date}</td>
          <td>${record.time}</td>
          <td>${record.dose}</td>
          <td>${record.note}</td>
        </tr>
      `,
    )
    .join("");
}

function renderInrRows() {
  const tbody = document.querySelector("#inrRows");
  tbody.innerHTML = inrRecords
    .map((record) => {
      const status = inrStatus(record.value);
      return `
        <tr>
          <td>${record.date}</td>
          <td>${record.value.toFixed(1)}</td>
          <td><span class="badge ${status.className}">${status.label}</span></td>
          <td>${record.note}</td>
        </tr>
      `;
    })
    .join("");
}

function renderTrendChart() {
  const chart = document.querySelector("#trendChart");
  const minValue = 1.4;
  const maxValue = 2.8;

  chart.innerHTML = inrRecords
    .map((record) => {
      const ratio = (record.value - minValue) / (maxValue - minValue);
      const height = Math.max(18, Math.round(ratio * 150));
      const shortDate = record.date.slice(5).replace("-", "/");

      return `
        <div
          class="bar"
          style="--bar-height: ${height}px"
          data-date="${shortDate}"
          title="${record.date} INR ${record.value.toFixed(1)}"
        >
          ${record.value.toFixed(1)}
        </div>
      `;
    })
    .join("");
}

renderMedicationRows();
renderInrRows();
renderTrendChart();
