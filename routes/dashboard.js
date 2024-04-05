import { Router } from "express";
import { execSync } from "child_process";
import { runCommand, isTargetServerReachable } from "../utils.js";
import fs from "fs";

const router = Router();
const folderPath = "./test_results";

router.get("/run_test", async (req, res) => {
  console.log("View Dashboard Page");
  const selectedFile = req.query.file; // Access the value using req.body.file
  console.log("Selected file:", selectedFile);
  const command =
    process.platform === "win32" ? "taskkill /IM k6.exe /F" : "pkill -f k6";
  try {
    const isreachable = await isTargetServerReachable();
    if (isreachable) {
      console.log("Killing K6");
      execSync(command);
      console.log(`k6 script stopped successfully.`);
    } else {
      console.log(
        "The k6 dashboard is not running. Skipping to the next code."
      );
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
  // Start the k6 dashboard
  console.log("Running K6");
  runCommand("../k6", ["dashboard", "replay", `${folderPath}/${selectedFile}`])
    .then(() => {
      console.log("Dashboard is Visible.");
    })
    .catch((error) => {
      console.error("An error occurred while running the command:", error);
    });
  res.redirect('/results/show?endpoint=http://3.235.172.199:5665/');
});

router.get("/", (req, res) => {
  console.log("Dashboard Page");

  fs.readdir(folderPath, (err, test_result_files) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error fetching files");
    }
    res.render("dashboard", { test_result_files: test_result_files });
  });
});

export default router;
