const API_BASE_URL = "http://127.0.0.1:8016";
const form = document.querySelector("#form");
const statusText = document.querySelector("#status");
const result = document.querySelector("#result");
const history = document.querySelector("#history");

function listItems(values) {
  return values.map((value) => `<li>${value}</li>`).join("");
}

async function loadHistory() {
  const response = await fetch(`${API_BASE_URL}/api/analyses`);
  const analyses = await response.json();
  history.innerHTML = analyses
    .map(
      (analysis) => `
        <div class="history-row">
          <span>${analysis.resume_filename}</span>
          <strong>${analysis.match_score}%</strong>
        </div>
      `
    )
    .join("");
}

async function checkApi() {
  try {
    const response = await fetch(`${API_BASE_URL}/`);
    if (!response.ok) throw new Error("offline");
    statusText.textContent = "API Online";
  } catch {
    statusText.textContent = "API Offline - start backend on port 8016";
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  result.textContent = "Analyzing...";
  const response = await fetch(`${API_BASE_URL}/api/analyze`, {
    method: "POST",
    body: new FormData(form),
  });
  const payload = await response.json();
  if (!response.ok) {
    result.textContent = payload.detail || "Analysis failed";
    return;
  }
  result.innerHTML = `
    <h2>${payload.match_score}% match</h2>
    <p><strong>AI source:</strong> ${payload.ai_provider}</p>
    <span class="metric">Semantic ${payload.semantic_similarity}</span>
    <span class="metric">Skill ${payload.score_breakdown.skill_match}</span>
    <span class="metric">Experience ${payload.score_breakdown.experience_relevance}</span>
    <h3>AI Fit Summary</h3>
    <p>${payload.ai_summary}</p>
    <h3>Matched Skills</h3>
    <ul>${listItems(payload.matched_skills)}</ul>
    <h3>Missing Skills</h3>
    <ul>${listItems(payload.missing_skills)}</ul>
    <h3>AI Resume Recommendations</h3>
    <ul>${listItems(payload.suggestions)}</ul>
    <h3>Job Alignment Advice</h3>
    <ul>${listItems(payload.job_alignment_advice)}</ul>
    <h3>Likely Interview Questions</h3>
    <div class="question-list">
      ${payload.interview_questions
        .map(
          (item) => `
            <article class="question-card">
              <strong>${item.question}</strong>
              <p>${item.why_it_matters}</p>
              <ul>${listItems(item.strong_answer_points)}</ul>
            </article>
          `
        )
        .join("")}
    </div>
    <h3>Answer Strategy</h3>
    <ul>${listItems(payload.answer_strategy)}</ul>
    <h3>Study Plan</h3>
    <ul>${listItems(payload.study_plan)}</ul>
    <h3>Recruiter Pitch</h3>
    <p>${payload.recruiter_pitch}</p>
  `;
  await loadHistory();
});

checkApi();
loadHistory();
