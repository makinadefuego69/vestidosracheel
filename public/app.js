const grid = document.querySelector("#dressGrid");
const filters = document.querySelector("#filters");
const categorySelect = document.querySelector("#category");
const sizeSelect = document.querySelector("#size");
const searchInput = document.querySelector("#search");
const count = document.querySelector("#count");
const dressSelect = document.querySelector("#dressSelect");
const contactForm = document.querySelector("#contactForm");
const formStatus = document.querySelector("#formStatus");

let allDresses = [];

function money(value) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

function option(value) {
  const item = document.createElement("option");
  item.value = value;
  item.textContent = value;
  return item;
}

function renderSelect(select, values) {
  select.replaceChildren(...values.map(option));
}

function renderDresses(dresses) {
  count.textContent = `${dresses.length} ${dresses.length === 1 ? "vestido" : "vestidos"}`;

  if (!dresses.length) {
    grid.innerHTML = '<p class="empty">No encontramos vestidos con esos filtros.</p>';
    return;
  }

  grid.replaceChildren(
    ...dresses.map(dress => {
      const card = document.createElement("article");
      card.className = "dress-card";
      card.innerHTML = `
        <img src="${dress.image}" alt="${dress.name}" loading="lazy">
        <div class="dress-body">
          <div class="dress-meta">
            <span>${dress.category}</span>
            <span>${dress.color}</span>
          </div>
          <h3>${dress.name}</h3>
          <p>${dress.description}</p>
          <div class="price">
            <strong>${money(dress.price)}</strong>
            <span class="sizes">${dress.sizes.join(" / ")}</span>
          </div>
        </div>
      `;
      card.addEventListener("click", () => {
        dressSelect.value = String(dress.id);
        document.querySelector("#cita").scrollIntoView({ behavior: "smooth" });
      });
      return card;
    })
  );
}

function renderDressOptions(dresses) {
  dressSelect.replaceChildren(
    ...dresses.map(dress => {
      const item = document.createElement("option");
      item.value = dress.id;
      item.textContent = `${dress.name} - ${dress.category}`;
      return item;
    })
  );
}

async function loadDresses() {
  const params = new URLSearchParams(new FormData(filters));
  const response = await fetch(`/api/dresses?${params.toString()}`);
  const data = await response.json();

  if (!allDresses.length) {
    allDresses = data.dresses;
    renderSelect(categorySelect, data.categories);
    renderSelect(sizeSelect, data.sizes);
    renderDressOptions(data.dresses);
  }

  renderDresses(data.dresses);
}

filters.addEventListener("input", () => {
  window.clearTimeout(filters.dataset.timer);
  filters.dataset.timer = window.setTimeout(loadDresses, 180);
});

filters.addEventListener("change", loadDresses);

contactForm.addEventListener("submit", async event => {
  event.preventDefault();
  formStatus.classList.remove("error");
  formStatus.textContent = "Enviando consulta...";

  const payload = Object.fromEntries(new FormData(contactForm));

  try {
    const response = await fetch("/api/inquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "No se pudo enviar la consulta");
    }

    formStatus.textContent = `Listo, recibimos tu consulta por ${data.inquiry.dressName}.`;
    contactForm.reset();
    if (allDresses[0]) {
      dressSelect.value = String(allDresses[0].id);
    }
  } catch (error) {
    formStatus.classList.add("error");
    formStatus.textContent = error.message;
  }
});

loadDresses();
