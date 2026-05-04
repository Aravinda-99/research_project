import { QUIZ_BANK } from "./data.js";

export function setupQuizUI() {
    const state = {
        current: 0,
        selectedAnswers: Array(QUIZ_BANK.length).fill(null),
        submitted: false,
    };

    const quizBox = document.getElementById("quiz-box");
    const counter = document.getElementById("quiz-counter");
    const miniScore = document.getElementById("quiz-score-mini");
    const progressBar = document.getElementById("quiz-progress-bar");
    const prevBtn = document.getElementById("prev-quiz-btn");
    const nextBtn = document.getElementById("next-quiz-btn");

    if (!quizBox || !counter || !miniScore || !progressBar || !prevBtn || !nextBtn) return;

    function getScore() {
        return state.selectedAnswers.reduce((acc, ans, i) => {
            return acc + (ans === QUIZ_BANK[i].correctIndex ? 1 : 0);
        }, 0);
    }

    function renderQuestion() {
        const q = QUIZ_BANK[state.current];
        const selected = state.selectedAnswers[state.current];

        counter.textContent = `Question ${state.current + 1} of ${QUIZ_BANK.length}`;
        progressBar.style.width = `${((state.current + 1) / QUIZ_BANK.length) * 100}%`;
        miniScore.textContent = `Score: ${getScore()}`;

        quizBox.innerHTML = `
            <article class="lp-question-card">
                <div class="lp-question-meta">
                    <span class="lp-topic-tag">${q.topic}</span>
                    <span class="lp-id-tag">Q${q.id}</span>
                </div>
                <h4 class="lp-question">${q.question}</h4>
                <div class="lp-options">
                    ${q.options
                        .map((opt, idx) => {
                            const isSelected = selected === idx;
                            const isCorrect = q.correctIndex === idx;
                            let cls = "lp-option";
                            if (state.submitted) {
                                if (isCorrect) cls += " correct";
                                else if (isSelected && !isCorrect) cls += " wrong";
                            } else if (isSelected) {
                                cls += " selected";
                            }

                            return `
                                <button class="${cls}" data-opt-index="${idx}">
                                    <span class="lp-opt-label">${String.fromCharCode(65 + idx)}</span>
                                    <span>${opt}</span>
                                </button>
                            `;
                        })
                        .join("")}
                </div>
                <div id="quiz-feedback" class="lp-feedback"></div>
            </article>
        `;

        const optionButtons = quizBox.querySelectorAll(".lp-option");
        optionButtons.forEach((btn) => {
            btn.addEventListener("click", () => {
                if (state.submitted) return;
                state.selectedAnswers[state.current] = Number(btn.dataset.optIndex);
                renderQuestion();
            });
        });

        prevBtn.disabled = state.current === 0;

        if (state.current === QUIZ_BANK.length - 1) {
            nextBtn.textContent = state.submitted ? "Review Again" : "Submit Quiz";
        } else {
            nextBtn.textContent = "Next";
        }
    }

    nextBtn.addEventListener("click", () => {
        if (state.current < QUIZ_BANK.length - 1) {
            state.current += 1;
            renderQuestion();
            return;
        }

        if (!state.submitted) {
            state.submitted = true;
            const score = getScore();
            const percent = Math.round((score / QUIZ_BANK.length) * 100);

            quizBox.innerHTML = `
                <article class="lp-result-card">
                    <h4>Your Quiz Result</h4>
                    <p class="lp-result-score">${score} / ${QUIZ_BANK.length} (${percent}%)</p>
                    <p class="lp-muted-sm">
                        ${percent >= 80 ? "Excellent work! You are mastering the concepts." :
                          percent >= 60 ? "Good progress. Review a few topics and try again." :
                          "Keep going. Repetition builds confidence."}
                    </p>
                    <button id="retry-quiz-btn" class="btn btn-primary" style="margin-top: 1rem;">Retry 20 Questions</button>
                </article>
            `;

            miniScore.textContent = `Score: ${score}`;
            progressBar.style.width = "100%";
            counter.textContent = `Completed: ${QUIZ_BANK.length} questions`;
            prevBtn.disabled = true;
            nextBtn.textContent = "Review Again";

            const retryBtn = document.getElementById("retry-quiz-btn");
            if (retryBtn) {
                retryBtn.addEventListener("click", () => {
                    state.current = 0;
                    state.selectedAnswers = Array(QUIZ_BANK.length).fill(null);
                    state.submitted = false;
                    renderQuestion();
                });
            }
            return;
        }

        state.current = 0;
        state.submitted = false;
        renderQuestion();
    });

    prevBtn.addEventListener("click", () => {
        if (state.current > 0) {
            state.current -= 1;
            renderQuestion();
        }
    });

    renderQuestion();
}
