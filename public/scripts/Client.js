// StartTest
const usernameInput = document.querySelector("#username");
const passwordInput = document.querySelector("#password");
const fileInput = document.querySelector("#jsonFile");
const myDiv = document.getElementById("myDiv");
const timerElement = document.getElementById("timer");
const startButton = document.getElementById("test");
const grayOverlay = document.getElementById("gray-overlay");

let endTime;
let timerInterval;

function bindEvents() {
  document.querySelector(".test").addEventListener("click", startTest);
  startButton.addEventListener("click", handleStartButtonClick);
}
bindEvents();

function startTest(e) {
  e.preventDefault();
  console.log(
    `Test request started 
        Username: ${usernameInput.value}
        File: ${fileInput.files[0].name}`
  );
  showOverlay();
  sendTestRequest();
}

function updateTimer() {
  const remainingTime = endTime - Date.now();

  if (remainingTime <= 0) {
    clearInterval(timerInterval);
    hideOverlay();
    showToast("Test completed successfully!");
    return;
  }

  const { hours, minutes, seconds } = calculateTimeParts(remainingTime);
  const formattedTime = formatTime(hours, minutes, seconds);
  updateTimerDisplay(formattedTime);
}

function handleStartButtonClick() {
  const file = fileInput.files[0];
  const reader = new FileReader();
  reader.addEventListener("load", async () => {
    const { durationInSeconds } = parseConfiguration(reader.result);
    endTime = Date.now() + durationInSeconds * 1000;
    updateTimer();
    timerInterval = setInterval(updateTimer, 1000);
  });
  reader.readAsText(file);
}

function showOverlay() {
  grayOverlay.classList.remove("hidden");
}

function hideOverlay() {
  grayOverlay.classList.add("hidden");
}

function getTestRequestBody() {
  const body = new FormData();
  body.append("username", usernameInput.value);
  body.append("password", passwordInput.value);
  body.append("jsonFile", fileInput.files[0]);
  return body;
}

async function sendTestRequest() {
  const requestOptions = {
    method: "POST",
    body: getTestRequestBody(),
  };

  const bodyEntries = Array.from(requestOptions.body.entries());
  const bodyObject = Object.fromEntries(bodyEntries);

  console.log(
    `sendTestRequest :: START :: Request Params: ${JSON.stringify(bodyObject)}`
  );

  const response = await fetch("http://127.0.0.1:8080/test", requestOptions);
  const result = await response.json();
  console.log(`sendTestRequest :: END :: Response: ${JSON.stringify(result)}`);
}

function showToast(message) {
  const toastContainer = document.getElementById("toastContainer");
  toastContainer.textContent = message;
  toastContainer.style.display = "block";

  setTimeout(() => {
    toastContainer.style.display = "none";
  }, 2000);
}

function calculateTimeParts(remainingTime) {
  const hours = Math.floor(remainingTime / (1000 * 60 * 60));
  const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);
  return { hours, minutes, seconds };
}

function formatTime(hours, minutes, seconds) {
  const formattedHours = hours.toString().padStart(2, "0");
  const formattedMinutes = minutes.toString().padStart(2, "0");
  const formattedSeconds = seconds.toString().padStart(2, "0");
  return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
}

function updateTimerDisplay(formattedTime) {
  timerElement.textContent = formattedTime;
}

function parseConfiguration(config) {
  console.log(`Config: ${config}`);

  const jsonConfig = JSON.parse(config);
  const rampUpDuration =
    jsonConfig["configuration_details"]["ramp_up_duration"];
  const rampUpDurationInMinutes = rampUpDuration / 60;
  const steadyStateDuration =
    jsonConfig["configuration_details"]["steady_state_duration"];
  const steadyStateDurationInMinutes = steadyStateDuration / 60;
  const durationInSeconds =
    (2 * parseFloat(rampUpDurationInMinutes) +
      parseFloat(steadyStateDurationInMinutes)) *
      60 +
    10;

  return {
    durationInSeconds,
  };
}
