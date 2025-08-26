const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3001;
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

// Swagger konfiguration
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Musik M-O API",
      version: "1.0.0",
      description: "API til musik-applikation med sange, covers og metadata",
      contact: {
        name: "API Support",
        email: "support@musik-mo.dk"
      }
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: "Development server"
      }
    ],
    components: {
      schemas: {
        Song: {
          type: "object",
          properties: {
            id: { type: "integer", description: "Unikt ID for sangen" },
            title: { type: "string", description: "Sangens titel" },
            artist: { type: "string", description: "Kunstneren der har lavet sangen" },
            coverPath: { type: "string", description: "Sti til cover billedet" },
            songPath: { type: "string", description: "Sti til sangfilen" },
            createdAt: { type: "string", format: "date-time", description: "Tidspunkt for oprettelse" },
            updatedAt: { type: "string", format: "date-time", description: "Tidspunkt for sidste opdatering" }
          },
          required: ["id", "title", "artist", "coverPath", "songPath"]
        }
      }
    }
  },
  apis: ["./server.js"]
};

const specs = swaggerJsdoc(swaggerOptions);

// Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));
app.use(cors());
app.use(express.json());
// Hjælpefunktioner
function loadSongsFromFile() {
  const songsPath = path.join(__dirname, "data", "songs.json");
  try {
    const data = fs.readFileSync(songsPath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}
// Healthcheck endpoint - tjekker om serveren kører og om songs.json findes
app.get("/api/health", (req, res) => {
  const songsPath = path.join(__dirname, "data", "songs.json");
  
  try {
    // Tjek om songs.json findes
    const fileExists = fs.existsSync(songsPath);
    
    if (fileExists) {
      // Prøv at læse filen for at sikre den er valid JSON
      const data = fs.readFileSync(songsPath, "utf8");
      JSON.parse(data); // Dette vil kaste en fejl hvis JSON ikke er valid
      
      res.json({
        status: "OK",
        message: "Server kører og songs.json er tilgængelig",
        timestamp: new Date().toISOString(),
        database: "connected"
      });
    } else {
      res.status(503).json({
        status: "ERROR",
        message: "songs.json filen findes ikke",
        timestamp: new Date().toISOString(),
        database: "disconnected"
      });
    }
  } catch (error) {
    res.status(503).json({
      status: "ERROR",
      message: "Fejl ved læsning af songs.json: " + error.message,
      timestamp: new Date().toISOString(),
      database: "error"
    });
  }
});

app.listen(PORT, () => {
  console.log(`Serveren kører på http://localhost:${PORT}`);
  console.log(`Health check tilgængelig på: http://localhost:${PORT}/api/health`);
});
/**
 * @swagger
 * /api/songs:
 *   get:
 *     summary: Hent alle sange
 *     description: Returnerer alle sange fra databasen med metadata
 *     tags: [Songs]
 *     responses:
 *       200:
 *         description: Liste over alle sange
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 count: { type: integer }
 *                 songs:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Song' }
 */
app.get("/api/songs", (req, res) => {
  try {
    const songs = loadSongsFromFile();

    res.json({
      success: true,
      count: songs.length,
      songs: songs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Fejl ved læsning af sange: " + error.message
    });
  }
});