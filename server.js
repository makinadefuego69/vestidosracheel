const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");

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

const inquiries = [];

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml"
};

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => {
      body += chunk;
      if (body.length > 1_000_000) {
        req.destroy();
        reject(new Error("Body demasiado grande"));
      }
    });
    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
  });
}

function getFilteredDresses(searchParams) {
  const category = searchParams.get("category");
  const size = searchParams.get("size");
  const query = (searchParams.get("q") || "").trim().toLowerCase();

  return dresses.filter(dress => {
    const matchesCategory = !category || category === "Todos" || dress.category === category;
    const matchesSize = !size || size === "Todas" || dress.sizes.includes(size);
    const haystack = `${dress.name} ${dress.category} ${dress.color}`.toLowerCase();
    const matchesQuery = !query || haystack.includes(query);
    return matchesCategory && matchesSize && matchesQuery;
  });
}

function serveStatic(req, res) {
  const safePath = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname);
  const filePath = safePath === "/" ? path.join(PUBLIC_DIR, "index.html") : path.join(PUBLIC_DIR, safePath);
  const normalizedPath = path.normalize(filePath);

  if (!normalizedPath.startsWith(PUBLIC_DIR)) {
    sendJson(res, 403, { error: "Acceso no permitido" });
    return;
  }

  fs.readFile(normalizedPath, (error, content) => {
    if (error) {
      fs.readFile(path.join(PUBLIC_DIR, "index.html"), (indexError, indexContent) => {
        if (indexError) {
          sendJson(res, 404, { error: "Archivo no encontrado" });
          return;
        }
        res.writeHead(200, { "Content-Type": mimeTypes[".html"] });
        res.end(indexContent);
      });
      return;
    }

    const extension = path.extname(normalizedPath).toLowerCase();
    res.writeHead(200, { "Content-Type": mimeTypes[extension] || "application/octet-stream" });
    res.end(content);
  });
}

async function handleApi(req, res, url) {
  if (req.method === "GET" && url.pathname === "/api/dresses") {
    sendJson(res, 200, {
      dresses: getFilteredDresses(url.searchParams),
      categories: ["Todos", ...new Set(dresses.map(dress => dress.category))],
      sizes: ["Todas", ...new Set(dresses.flatMap(dress => dress.sizes))]
    });
    return;
  }

  if (req.method === "GET" && url.pathname.startsWith("/api/dresses/")) {
    const id = Number(url.pathname.split("/").pop());
    const dress = dresses.find(item => item.id === id);
    if (!dress) {
      sendJson(res, 404, { error: "Vestido no encontrado" });
      return;
    }
    sendJson(res, 200, { dress });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/inquiries") {
    try {
      const body = await parseBody(req);
      const required = ["name", "email", "dressId", "message"];
      const missing = required.filter(field => !body[field]);

      if (missing.length) {
        sendJson(res, 400, { error: "Faltan campos obligatorios", missing });
        return;
      }

      const selectedDress = dresses.find(dress => dress.id === Number(body.dressId));
      if (!selectedDress) {
        sendJson(res, 400, { error: "El vestido seleccionado no existe" });
        return;
      }

      const inquiry = {
        id: inquiries.length + 1,
        name: String(body.name).trim(),
        email: String(body.email).trim(),
        phone: String(body.phone || "").trim(),
        dressId: selectedDress.id,
        dressName: selectedDress.name,
        message: String(body.message).trim(),
        createdAt: new Date().toISOString()
      };

      inquiries.push(inquiry);
      sendJson(res, 201, { message: "Consulta recibida", inquiry });
    } catch (error) {
      sendJson(res, 400, { error: "No se pudo procesar la consulta" });
    }
    return;
  }

  sendJson(res, 404, { error: "Ruta API no encontrada" });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname.startsWith("/api/")) {
    handleApi(req, res, url);
    return;
  }

  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`Atelier Vestidos disponible en http://localhost:${PORT}`);
});
