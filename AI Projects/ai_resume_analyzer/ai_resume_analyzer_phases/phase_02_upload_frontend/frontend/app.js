const API_BASE_URL = "http://127.0.0.1:8012";
const form = document.querySelector("#form");
const result = document.querySelector("#result");
const statusText = document.querySelector("#status");

function listItems(values) {
  return values.map((value) => `<li>${value}</li>`).join("");
}

async function checkApi() {
  try {
    const response = await fetch(`${API_BASE_URL}/`);
    if (!response.ok) throw new Error("API offline");
    statusText.textContent = "API Online";
  } catch {
    statusText.textContent = "API Offline - start backend on port 8012";
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(form);
  result.textContent = "Analyzing...";

  try {
    const response = await fetch(`${API_BASE_URL}/api/analyze`, {
      method: "POST",
      body: formData,
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.detail || "Analysis failed");

    result.innerHTML = `
      <h2>${payload.match_score}% match</h2>
      <h3>Matched Skills</h3>
      <ul>${listItems(payload.matched_skills)}</ul>
      <h3>Missing Skills</h3>
      <ul>${listItems(payload.missing_skills)}</ul>
      <h3>Suggestions</h3>
      <ul>${listItems(payload.suggestions)}</ul>
    `;
  } catch (error) {
    result.textContent = error.message;
  }
});

checkApi();

