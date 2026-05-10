const calendarGrid = document.getElementById("calendarGrid");
const calendarMonth = document.getElementById("calendarMonth");
const prevMonthButton = document.getElementById("prevMonth");
const nextMonthButton = document.getElementById("nextMonth");
const selectedDateInput = document.getElementById("selectedDate");
const calendarConfirm = document.getElementById("calendarConfirm");
const bookingForm = document.getElementById("bookingForm");
const formMessage = document.getElementById("formMessage");

let currentDate = new Date();
let selectedDate = null;

/*
  TEST AVAILABILITY DATA

  available = open
  partial = limited availability
  unavailable = fully booked / unavailable

  Later, this data can come from Supabase instead.
*/
const availability = {
  "2026-06-05": "unavailable",
  "2026-06-06": "unavailable",
  "2026-06-07": "partial",
  "2026-06-13": "partial",
  "2026-06-14": "unavailable",
  "2026-06-15": "unavailable",
  "2026-06-19": "unavailable",
  "2026-06-20": "unavailable",
  "2026-06-21": "unavailable",
  "2026-06-28": "partial"
};

function formatDateKey(year, month, day) {
  const monthNumber = String(month + 1).padStart(2, "0");
  const dayNumber = String(day).padStart(2, "0");

  return `${year}-${monthNumber}-${dayNumber}`;
}

function formatDisplayDate(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);

  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  });
}

function renderCalendar() {
  calendarGrid.innerHTML = "";

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const firstWeekday = firstDayOfMonth.getDay();
  const totalDays = lastDayOfMonth.getDate();

  calendarMonth.textContent = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric"
  });

  for (let i = 0; i < firstWeekday; i++) {
    const emptyDay = document.createElement("div");
    emptyDay.classList.add("calendar-day", "empty");
    calendarGrid.appendChild(emptyDay);
  }

  for (let day = 1; day <= totalDays; day++) {
    const dateKey = formatDateKey(year, month, day);
    const dayButton = document.createElement("button");

    const status = availability[dateKey] || "available";

    dayButton.type = "button";
    dayButton.classList.add("calendar-day", status);
    dayButton.textContent = day;
    dayButton.dataset.date = dateKey;

    if (dateKey === selectedDate) {
      dayButton.classList.add("selected");
    }

    if (status === "unavailable") {
      dayButton.disabled = true;
      dayButton.setAttribute("aria-label", `${formatDisplayDate(dateKey)} unavailable`);
    } else {
      dayButton.setAttribute("aria-label", `${formatDisplayDate(dateKey)} ${status}`);

      dayButton.addEventListener("click", () => {
        selectedDate = dateKey;
        selectedDateInput.value = formatDisplayDate(dateKey);
        renderCalendar();
      });
    }

    calendarGrid.appendChild(dayButton);
  }
}

prevMonthButton.addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar();
});

nextMonthButton.addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar();
});

calendarConfirm.addEventListener("click", () => {
  if (!selectedDate) {
    formMessage.textContent = "Please select an available date first.";
    return;
  }

  document.getElementById("preferredTime").focus();
  formMessage.textContent = "Great — now complete your inquiry details.";
});

bookingForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!selectedDateInput.value) {
    formMessage.textContent = "Please choose an available date before submitting.";
    return;
  }

  formMessage.textContent = "Thank you! Your inquiry has been received for testing.";

  bookingForm.reset();
  selectedDate = null;
  selectedDateInput.value = "";
  renderCalendar();
});

renderCalendar();
