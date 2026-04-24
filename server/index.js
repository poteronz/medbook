require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const hpp = require("hpp");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const path = require("path");

const db = require("./db");
const { seedDemoData } = require("./db/seedDemo");
const authRoutes = require("./routes/auth");
const doctorRoutes = require("./routes/doctors");
const appointmentRoutes = require("./routes/appointments");
const reminderRoutes = require("./routes/reminders");

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === "production";
const allowedOrigins = (
  process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",")
    : ["http://localhost:5173", "http://127.0.0.1:5173"]
)
  .map((origin) => origin.trim())
  .filter(Boolean);

app.set("trust proxy", 1);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
app.use(hpp());
app.use(compression());

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(null, false);
  },
  credentials: true,
}));

app.use((req, res, next) => {
  if (isProduction && req.headers["x-forwarded-proto"] === "http") {
    return res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
  }

  return next();
});

app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Слишком много запросов, попробуйте позже" },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/avatars", express.static(path.join(__dirname, "public/avatars")));

app.get("/robots.txt", (req, res) => {
  const siteUrl = process.env.PUBLIC_SITE_URL || "https://medbook.local";
  res.type("text/plain").send(
    `User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${siteUrl}/sitemap.xml`
  );
});

app.get("/sitemap.xml", async (req, res, next) => {
  try {
    const doctors = await db.allAsync("SELECT id FROM doctors ORDER BY id ASC");
    const siteUrl = process.env.PUBLIC_SITE_URL || "https://medbook.local";
    const urls = [
      { loc: "/", priority: "1.0" },
      ...doctors.map((doctor) => ({ loc: `/doctor/${doctor.id}`, priority: "0.8" })),
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url>
    <loc>${siteUrl}${url.loc}</loc>
    <priority>${url.priority}</priority>
  </url>`).join("\n")}
</urlset>`;

    res.type("application/xml").send(xml);
  } catch (error) {
    next(error);
  }
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/reminders", reminderRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Маршрут не найден" });
});

app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ error: "Внутренняя ошибка сервера" });
});

async function start() {
  const shouldSeedDemoData =
    process.env.AUTO_SEED_DEMO_DATA === "true" ||
    (!isProduction && process.env.AUTO_SEED_DEMO_DATA !== "false");

  if (shouldSeedDemoData) {
    const seedResult = await seedDemoData();
    if (seedResult.seeded) {
      console.log(`Demo data initialized: ${seedResult.doctors} doctors created.`);
    }
  }

  app.listen(PORT, () => {
    console.log(`MedBook API запущен на http://localhost:${PORT}`);
  });
}

start().catch((error) => {
  console.error("Failed to start MedBook API:", error);
  process.exit(1);
});
