import express from "express";
import multer from "multer";
import { exec } from "child_process";
import { runCommand } from "./utils.js";
import dashboard from "./routes/dashboard.js";
import results from "./routes/results.js";
import { fileURLToPath } from "url";
import { join, dirname } from "path";

const app = express();
const port = 8080;

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirPath = dirname(currentFilePath);

const filePath = join(currentDirPath, "/public/assets/samplefile.json");
const fileName = "samplefile.json";

app.set("views", "./views");
app.set("view engine", "ejs");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.listen(port, () => console.log(`Listening on port ${port}`));

const upload = multer().single("jsonFile");

// ROUTES

app.get("/", (req, res) => {
  res.render("index_", {
    successMessage: "RUN THE TEST TO GENERATE JSON FILE",
  }); // Render the index.ejs file
});

app.post("/test", upload, (req, res) => {
  const username = req.body.username;
  let password = req.body.password;
  password = btoa(password);
  const fileContent = req.file.buffer.toString();
  let filename = req.file.originalname;
  const time = new Date().getTime().toString();

  const commandConfig = [
    "run",
    "--out",
    `json=test_results/Output_${time}_${filename}`,
    "--env",
    `USERNAME=${username}`,
    "--env",
    `PASSWORD=${password}`,
    "--env",
    `JSONDATA=${fileContent}`,
    "script.js",
  ];

  runCommand("./k6", commandConfig)
    .then((output) => {
      console.log(
        `K6 Command completed successfully. Command Config: ${commandConfig}`
      );
      res.json({ status: true });
      res.end();
    })
    .catch((error) => {
      console.error(
        `An error occurred while running the K6 command: ${error}. Command Config: ${commandConfig}`
      );
      res.json({ status: false });
      res.end();
    });
});

app.get("/download", (req, res) => {
  res.download(filePath, fileName, (err) => {
    if (err) {
      console.error("Error downloading file:", err);
      res.status(500).send("Error downloading file");
    }
  });
});

// go to dashboard.js file for endpoint /dashboard
app.use("/dashboard", dashboard);
app.use("/results", results);
