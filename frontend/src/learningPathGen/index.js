import { loadLearningPath } from "./roadmap.js";
import { setupQuizUI } from "./quizLab.js";

export async function renderLearningPath(container) {
    container.innerHTML = `
        <section class="lp-hero card">
            <div>
                <h1 class="lp-title">Adaptive Learning Path</h1>
                <p class="lp-subtitle">20 quick quizzes to boost your programming confidence, one step at a time.</p>
            </div>
            <div class="lp-pill">Student Mode</div>
        </section>

        <section class="grid-2 lp-main-grid">
            <div class="card">
                <h3 style="margin-bottom: 0.5rem;">Your Topic Roadmap</h3>
                <p class="lp-muted">Ordered by recommended learning sequence</p>
                <div id="path-list" class="lp-path-list">
                    <p class="lp-muted">Loading your path...</p>
                </div>
            </div>

            <div class="card">
                <h3 style="margin-bottom: 0.5rem;">Quiz Lab</h3>
                <p class="lp-muted">20 quizzes • 4 choices each • instant feedback</p>

                <div style="margin-top: 1rem;">
                    <p class="lp-muted-sm">Quizzes open in an isolated view to minimise distractions.</p>
                    <div style="display:flex; gap:0.6rem; margin-top: 0.8rem;">
                        <button id="open-quiz-lab-btn" class="btn btn-primary">Open Quiz Lab</button>
                        <button id="preview-quiz-btn" class="btn" style="background: var(--border-color); color: var(--text-primary);">Preview Question</button>
                    </div>
                </div>
            </div>
        </section>
    `;

    await loadLearningPath();

    // Navigate to the dedicated quiz page (opens full page view)
    document.getElementById("open-quiz-lab-btn")?.addEventListener("click", () => {
        if (typeof window.navigateTo === "function") {
            window.navigateTo("quiz-lab");
            return;
        }
        // Fallback: change location hash so navigation can pick it up
        location.hash = "#quiz-lab";
    });

    // Preview still opens the quiz lab page for now
    document.getElementById("preview-quiz-btn")?.addEventListener("click", () => {
        if (typeof window.navigateTo === "function") {
            window.navigateTo("quiz-lab");
            return;
        }
        location.hash = "#quiz-lab";
    });
}
