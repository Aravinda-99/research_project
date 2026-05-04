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

                <div class="lp-quiz-progress-wrap">
                    <div class="lp-quiz-progress-head">
                        <span id="quiz-counter">Question 1 of 20</span>
                        <span id="quiz-score-mini">Score: 0</span>
                    </div>
                    <div class="lp-progress-track">
                        <div id="quiz-progress-bar" class="lp-progress-bar" style="width: 5%;"></div>
                    </div>
                </div>

                <div id="quiz-box"></div>

                <div class="lp-quiz-actions">
                    <button class="btn" id="prev-quiz-btn" style="background: var(--border-color); color: var(--text-primary);" disabled>Previous</button>
                    <button class="btn btn-primary" id="next-quiz-btn">Next</button>
                </div>
            </div>
        </section>
    `;

    await loadLearningPath();
    setupQuizUI();
}
