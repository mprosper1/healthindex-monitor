// Reads whatever Vitals AI has recorded this session and renders it as a
// summary, with a "Download PDF Report" button so it can be shown to a
// doctor or pharmacist.

const CHANNEL_LABELS = {
  bp: { label: "Blood Pressure", unit: "mmHg" },
  sugar: { label: "Blood Sugar", unit: "mg/dL" },
  pulse: { label: "Pulse", unit: "bpm" },
  temp: { label: "Temperature", unit: "°C" },
};

function loadReadings() {
  try {
    return JSON.parse(sessionStorage.getItem("vitals_readings") || "{}");
  } catch {
    return {};
  }
}

function renderReport() {
  const user = JSON.parse(sessionStorage.getItem("vitals_user") || "null");
  const readings = loadReadings();

  if (user) {
    document.getElementById(
      "report-name"
    ).textContent = `${user.firstName} ${user.lastName}`;
    document.getElementById("report-email").textContent = user.email;
  }

  document.getElementById("report-date").textContent = readings.updatedAt
    ? new Date(readings.updatedAt).toLocaleString()
    : new Date().toLocaleString();

  const grid = document.getElementById("report-grid");
  grid.innerHTML = "";

  const channels = ["bp", "sugar", "pulse", "temp"];
  let hasAny = false;

  channels.forEach((ch) => {
    const reading = readings[ch];
    const meta = CHANNEL_LABELS[ch];
    const item = document.createElement("div");
    item.className = "report-card__item";

    if (reading) {
      hasAny = true;
      item.innerHTML = `
        <div class="report-card__item-label">${meta.label}</div>
        <div class="report-card__item-value">${reading.value} <span>${
        meta.unit
      }</span></div>
        <div class="report-card__item-status status--${
          reading.tone || "normal"
        }">${reading.status || ""}</div>
      `;
    } else {
      item.innerHTML = `
        <div class="report-card__item-label">${meta.label}</div>
        <div class="report-card__item-value">— <span>${meta.unit}</span></div>
        <div class="report-card__item-status">not recorded</div>
      `;
    }
    grid.appendChild(item);
  });

  const adviceEl = document.getElementById("report-advice");
  if (hasAny && readings.lastSummaryMessage) {
    adviceEl.textContent = readings.lastSummaryMessage;
  } else if (hasAny) {
    adviceEl.textContent =
      "Readings recorded. Continue the conversation in Vitals AI to get a full summary and guidance.";
  }
}

function downloadReport() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const user = JSON.parse(sessionStorage.getItem("vitals_user") || "null");
  const readings = loadReadings();

  let y = 20;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Vitals — Health Report", 15, y);

  y += 10;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  if (user) {
    doc.text(`Name: ${user.firstName} ${user.lastName}`, 15, y);
    y += 6;
    doc.text(`Email: ${user.email}`, 15, y);
    y += 6;
  }
  doc.text(
    `Date: ${
      readings.updatedAt
        ? new Date(readings.updatedAt).toLocaleString()
        : new Date().toLocaleString()
    }`,
    15,
    y
  );
  y += 12;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Recorded Vitals", 15, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  ["bp", "sugar", "pulse", "temp"].forEach((ch) => {
    const meta = CHANNEL_LABELS[ch];
    const reading = readings[ch];
    const line = reading
      ? `${meta.label}: ${reading.value} ${meta.unit} — ${reading.status}`
      : `${meta.label}: not recorded`;
    doc.text(line, 15, y);
    y += 7;
  });

  y += 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("AI Summary & Guidance", 15, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const adviceText =
    readings.lastSummaryMessage ||
    "No summary available yet. Complete a check-in in Vitals AI first.";
  const wrapped = doc.splitTextToSize(adviceText, 180);
  doc.text(wrapped, 15, y);
  y += wrapped.length * 6 + 10;

  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(
    "This is not a medical diagnosis. Please consult a licensed healthcare professional.",
    15,
    y
  );

  const fileName = user
    ? `vitals-report-${user.firstName}-${user.lastName}.pdf`
    : "vitals-report.pdf";
  doc.save(fileName);
}

renderReport();
document
  .getElementById("download-btn")
  .addEventListener("click", downloadReport);
