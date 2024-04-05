import { spawn } from "child_process";
import fetch from "node-fetch";

export function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args);
    let output = "";

    process.stdout.on("data", (data) => {
      const newData = data.toString();
      output += newData;
    });

    process.stderr.on("data", (data) => {
      const errorData = data.toString();
      console.error(errorData);
    });

    process.on("close", (code) => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(`Command exited with code ${code}`));
      }
    });
  });
}

export function wait(seconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, seconds * 1000);
  });
}

export async function isTargetServerReachable() {
  try {
    await wait(5);
    const response = await fetch("http://localhost:5665/ui/");
    return true;
  } catch (error) {
    return false;
  }
}

export function handleProxyMiddleware(target) {
  return async (req, res, next) => {
    const isReachable = await isTargetServerReachable();
    if (!isReachable) {
      console.log("Target Not Reachable");
      res.redirect("/dashboard");
      return;
    }
    next();
  };
}
