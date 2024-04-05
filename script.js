import http from "k6/http";
import { sleep, check } from "k6";

let configData = JSON.parse(__ENV.JSONDATA);
let configuration_details = configData["configuration_details"];
let Api_key = configuration_details["api_key"];
let Domain = configuration_details["domain_url"];
let Rampupduration = configuration_details["ramp_up_duration"];
let Steadystateduration = configuration_details["steady_state_duration"];
let Vu = configuration_details["virtual_users"];

Rampupduration /= 60;
Steadystateduration /= 60;

console.log(Vu);
export let options = {
  stages: [
    { duration: `${Rampupduration}m`, target: Number(Vu) }, // Ramp up to n virtual users over t minute
    { duration: `${Steadystateduration}m`, target: Number(Vu) }, // Stay at n virtual users for t minutes
    { duration: `${Rampupduration}m`, target: Number(Vu) }, // Ramp down to 0 virtual users over t minute
  ],
  thresholds: {
    http_req_duration: ["p(95)<500000"], // Set a response time threshold of 500ms for 95% of requests
  },
};

export function setup() {
  let payload = JSON.stringify({
    ms_request: {
      user: {
        username: __ENV.USERNAME,
        password: __ENV.PASSWORD,
        api_key: Api_key,
      },
    },
  });

  console.log("Performing user authorization...");
  let configData = JSON.parse(__ENV.JSONDATA);
  let configuration_details = configData["configuration_details"];
  let loginapi = configuration_details["login_endpoint"];
  let authResponse = http.post(`${Domain}${loginapi}`, payload, {
    headers: {
      "Content-Type": "application/json",
    },
  });
  console.log(authResponse.body);
  const authToken = JSON.parse(authResponse.body)["ms_response"]["user"][
    "_token"
  ];
  console.log("AUTH token:", authToken);
  return {
    authToken,
  };
}

export default function (data) {
  // Use the access token from the context object for subsequent API requests
  let headers = {
    Cookie: `_felix_session_id=${data.authToken}`,
  };
  let configData = JSON.parse(__ENV.JSONDATA);
  const jsonData = configData["suites"];

  for (let i = 0; i < jsonData.length; i++) {
    let request = jsonData[i];
    let { method, api_endpoint, payload } = request;

    console.log(
      `Script JSON Data: Method: ${method}\tApi Endpoint: ${Domain}${api_endpoint}\tIndex: ${i}`
    );

    let response;
    switch (method) {
      case "GET":
        response = http.get(`${Domain}${api_endpoint}`, { headers });
        break;
      case "POST":
        let postPayload = JSON.stringify(payload);
        response = http.post(`${Domain}${api_endpoint}`, postPayload, {
          headers,
        });
        break;
      case "PUT":
        let putPayload = JSON.stringify(payload);
        response = http.post(`${Domain}${api_endpoint}`, putPayload, {
          headers,
        });
        break;
      case "DELETE":
        response = http.del(`${Domain}${api_endpoint}`, null, { headers });
        break;
      default:
        console.log(`Unsupported request method: ${method}`);
        continue;
    }
    // If the response is unauthorized (401), reauthorize and retrieve a new access token
    if (response.status === 401) {
      console.log("Invalid credentials");
    }

    check(response, {
      "is status 200": (r) => r.status === 200,
      "is response time < 500ms": (r) => r.timings.duration < 500,
    });
  }
  sleep(1); // Wait for 1 second before making the next request
}

// ./k6 run --out dashboard --env USERNAME=tusharsingh20112001@gmail.com --env PASSWORD=U2Ftc2hlcjFAMg== --env APIKEY=a1c55fc5f4f5ede3921bc49118d6d752aa78b2a0 /src/script.js
