const dresses = [
  {
    id: 1,
    name: "Vestido Aurora",
    category: "Gala",
    color: "Rojo vino",
    price: 189,
    sizes: ["S", "M", "L"],
    image:
      "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=900&q=80",
    description: "Silueta elegante con caida fluida para eventos de noche."
  },
  {
    id: 2,
    name: "Vestido Lirio",
    category: "Coctel",
    color: "Marfil",
    price: 129,
    sizes: ["XS", "S", "M"],
    image:
      "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=900&q=80",
    description: "Corte moderno, ligero y perfecto para celebraciones de dia."
  },
  {
    id: 3,
    name: "Vestido Selene",
    category: "Novia",
    color: "Blanco perla",
    price: 420,
    sizes: ["S", "M", "L", "XL"],
    image:
      "https://images.unsplash.com/photo-1594552072238-b8a33785b261?auto=format&fit=crop&w=900&q=80",
    description: "Detalle romantico con falda amplia y acabado delicado."
  },
  {
    id: 4,
    name: "Vestido Cala",
    category: "Casual",
    color: "Verde salvia",
    price: 89,
    sizes: ["XS", "S", "M", "L"],
    image:
      "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=900&q=80",
    description: "Comodo, fresco y facil de combinar para uso diario."
  },
  {
    id: 5,
    name: "Vestido Nocturne",
    category: "Gala",
    color: "Negro",
    price: 215,
    sizes: ["M", "L", "XL"],
    image:
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80",
    description: "Diseno sobrio con textura satinada y presencia sofisticada."
  },
  {
    id: 6,
    name: "Vestido Brisa",
    category: "Coctel",
    color: "Azul cielo",
    price: 118,
    sizes: ["XS", "S", "M", "L"],
    image:
      "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=900&q=80",
    description: "Ligero y versatil, ideal para reuniones y fiestas pequenas."
  }
];

const contactEmail = "makinadefuego69@users.noreply.github.com";
const grid = document.querySelector("#dressGrid");
const filters = document.querySelector("#filters");
const categorySelect = document.querySelector("#category");
const sizeSelect = document.querySelector("#size");
const count = document.querySelector("#count");
const dressSelect = document.querySelector("#dressSelect");
const contactForm = document.querySelector("#contactForm");
const formStatus = document.querySelector("#formStatus");

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

function getFilteredDresses() {
  const formData = new FormData(filters);
  const query = String(formData.get("q") || "").trim().toLowerCase();
  const category = formData.get("category");
  const size = formData.get("size");

  return dresses.filter(dress => {
    const matchesCategory = !category || category === "Todos" || dress.category === category;
    const matchesSize = !size || size === "Todas" || dress.sizes.includes(size);
    const haystack = `${dress.name} ${dress.category} ${dress.color}`.toLowerCase();
    const matchesQuery = !query || haystack.includes(query);
    return matchesCategory && matchesSize && matchesQuery;
  });
}

function renderDresses(items) {
  count.textContent = `${items.length} ${items.length === 1 ? "vestido" : "vestidos"}`;

  if (!items.length) {
    grid.innerHTML = '<p class="empty">No encontramos vestidos con esos filtros.</p>';
    return;
  }

  grid.replaceChildren(
    ...items.map(dress => {
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

function renderDressOptions() {
  dressSelect.replaceChildren(
    ...dresses.map(dress => {
      const item = document.createElement("option");
      item.value = dress.id;
      item.textContent = `${dress.name} - ${dress.category}`;
      return item;
    })
  );
}

function loadDresses() {
  renderDresses(getFilteredDresses());
}

filters.addEventListener("input", () => {
  window.clearTimeout(filters.dataset.timer);
  filters.dataset.timer = window.setTimeout(loadDresses, 180);
});

filters.addEventListener("change", loadDresses);

contactForm.addEventListener("submit", event => {
  event.preventDefault();
  formStatus.classList.remove("error");

  const payload = Object.fromEntries(new FormData(contactForm));
  const selectedDress = dresses.find(dress => String(dress.id) === String(payload.dressId));
  const subject = `Consulta por ${selectedDress ? selectedDress.name : "vestido"}`;
  const body = [
    `Nombre: ${payload.name}`,
    `Email: ${payload.email}`,
    `Telefono: ${payload.phone || "No indicado"}`,
    `Vestido: ${selectedDress ? selectedDress.name : "No indicado"}`,
    "",
    payload.message
  ].join("\n");

  window.location.href = `mailto:${contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  formStatus.textContent = "Se abrio tu correo con la consulta lista para enviar.";
});

renderSelect(categorySelect, ["Todos", ...new Set(dresses.map(dress => dress.category))]);
renderSelect(sizeSelect, ["Todas", ...new Set(dresses.flatMap(dress => dress.sizes))]);
renderDressOptions();
loadDresses();
