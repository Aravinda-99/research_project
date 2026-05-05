/**
 * Component 2: Intelligent Error Pattern Detector — Page
 * ========================================================
 * Submit Java code for error pattern detection and view conceptual feedback.
 */

import { ErrorAPI } from "../api/api.js";

export async function renderErrorAnalysis(container) {
    const studentId = "demo_student"; // In a real app, this comes from Auth context

    container.innerHTML = `
        <div class="error-analysis-header" style="margin-bottom: 2rem;">
            <h1 style="font-size: 2rem; background: linear-gradient(90deg, var(--accent-blue), var(--accent-purple)); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Intelligent Error Pattern Detector</h1>
            <p style="color: var(--text-secondary); margin-top: 0.5rem; max-width: 800px;">
                Analyze Java code submissions to detect conceptual error patterns. Our ML-powered system provides 
                personalized feedback to help you understand the "why" behind common programming mistakes.
            </p>
        </div>

        <div class="grid-2" style="grid-template-columns: 1.2fr 0.8fr; align-items: start;">
            <div class="left-col">
                <div class="card glass-card">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                        <h3 style="margin: 0; color: var(--text-primary);">Submit Java Code</h3>
                        <span class="badge" style="background: rgba(74, 144, 226, 0.1); color: var(--accent-blue); padding: 0.2rem 0.6rem; border-radius: 20px; font-size: 0.75rem;">Java 17+</span>
                    </div>
                    
                    <textarea id="code-input" class="input-field" rows="12" 
                        placeholder="public class Main {\n    public static void main(String[] args) {\n        // Paste your Java code here...\n    }\n}" 
                        style="font-family: 'Fira Code', 'Consolas', monospace; font-size: 0.9rem; line-height: 1.5; background: #0d1117; color: #c9d1d9; border: 1px solid var(--border-color);"></textarea>
                    
                    <!-- Pre-test Scores Panel -->
                    <details style="margin-top: 1rem; border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden;">
                        <summary style="padding: 0.8rem; cursor: pointer; background: var(--bg-secondary); font-size: 0.85rem; color: var(--text-secondary); user-select: none;">
                            Optional: Include Pre-test Scores (for better accuracy)
                        </summary>
                        <div style="padding: 1rem; background: var(--bg-card); display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 1rem;">
                            <div class="score-input">
                                <label style="display: block; font-size: 0.7rem; color: var(--text-secondary); margin-bottom: 0.3rem;">Variables</label>
                                <input type="number" id="pre-var" class="input-field" min="0" max="5" placeholder="0-5" style="padding: 0.4rem;">
                            </div>
                            <div class="score-input">
                                <label style="display: block; font-size: 0.7rem; color: var(--text-secondary); margin-bottom: 0.3rem;">Operators</label>
                                <input type="number" id="pre-op" class="input-field" min="0" max="5" placeholder="0-5" style="padding: 0.4rem;">
                            </div>
                            <div class="score-input">
                                <label style="display: block; font-size: 0.7rem; color: var(--text-secondary); margin-bottom: 0.3rem;">Loops</label>
                                <input type="number" id="pre-loop" class="input-field" min="0" max="5" placeholder="0-5" style="padding: 0.4rem;">
                            </div>
                            <div class="score-input">
                                <label style="display: block; font-size: 0.7rem; color: var(--text-secondary); margin-bottom: 0.3rem;">Arrays</label>
                                <input type="number" id="pre-arr" class="input-field" min="0" max="5" placeholder="0-5" style="padding: 0.4rem;">
                            </div>
                            <div class="score-input">
                                <label style="display: block; font-size: 0.7rem; color: var(--text-secondary); margin-bottom: 0.3rem;">Methods</label>
                                <input type="number" id="pre-meth" class="input-field" min="0" max="5" placeholder="0-5" style="padding: 0.4rem;">
                            </div>
                        </div>
                    </details>

                    <div style="margin-top: 1.5rem; display: flex; gap: 1rem;">
                        <button class="btn btn-primary" id="analyze-btn" style="flex: 1; padding: 0.8rem; font-weight: 600;">Analyze Java Code</button>
                        <button class="btn" id="clear-btn" style="background: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--border-color);">Clear</button>
                    </div>
                </div>

                <!-- Analysis Results Dashboard -->
                <div id="result-dashboard" class="hidden" style="margin-top: 2rem;">
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem;">
                        <div style="width: 12px; height: 12px; border-radius: 50%; background: var(--accent-blue); box-shadow: 0 0 10px var(--accent-blue);"></div>
                        <h2 style="font-size: 1.2rem; margin: 0;">Analysis Results</h2>
                    </div>

                    <div class="results-grid" style="display: grid; gap: 1.5rem;">
                        <!-- Row 1: Prediction & Why -->
                        <div class="grid-2" style="grid-template-columns: 1fr 1fr;">
                            <div class="card" id="card-prediction" style="border-left: 4px solid var(--accent-blue);">
                                <h4 style="color: var(--text-secondary); font-size: 0.75rem; text-transform: uppercase; margin-bottom: 1rem;">Prediction</h4>
                                <div id="label-badge" style="font-size: 1.4rem; font-weight: 800; margin-bottom: 0.5rem;"></div>
                                <div id="concept-text" style="color: var(--text-primary); font-weight: 500;"></div>
                                <div style="margin-top: 1rem; display: flex; gap: 1rem; font-size: 0.8rem;">
                                    <div>Confidence: <span id="conf-level" style="font-weight: 700;"></span></div>
                                    <div>Severity: <span id="sev-level" style="font-weight: 700;"></span></div>
                                </div>
                            </div>
                            <div class="card" id="card-why">
                                <h4 style="color: var(--text-secondary); font-size: 0.75rem; text-transform: uppercase; margin-bottom: 1rem;">Why this happened</h4>
                                <p id="reason-text" style="font-size: 0.9rem; line-height: 1.5; color: var(--text-primary); margin-bottom: 1rem;"></p>
                                <div style="padding: 0.8rem; background: rgba(167, 139, 250, 0.1); border-radius: 8px; border: 1px solid rgba(167, 139, 250, 0.2);">
                                    <strong style="color: var(--accent-purple); font-size: 0.8rem; display: block; margin-bottom: 0.2rem;">Likely Misconception:</strong>
                                    <span id="miscon-text" style="font-size: 0.85rem; color: var(--text-secondary);"></span>
                                </div>
                            </div>
                        </div>

                        <!-- Row 2: Fix & Mastery -->
                        <div class="grid-2" style="grid-template-columns: 1fr 1fr;">
                            <div class="card" style="background: linear-gradient(135deg, var(--bg-card), rgba(52, 211, 153, 0.05));">
                                <h4 style="color: var(--text-secondary); font-size: 0.75rem; text-transform: uppercase; margin-bottom: 1rem;">Suggested Fix</h4>
                                <p id="fix-text" style="font-size: 0.9rem; color: var(--text-primary); margin-bottom: 1rem;"></p>
                                <div style="font-size: 0.85rem;">
                                    <strong style="color: var(--accent-green);">Next Step:</strong>
                                    <span id="next-step" style="color: var(--text-secondary);"></span>
                                </div>
                            </div>
                            <div class="card">
                                <h4 style="color: var(--text-secondary); font-size: 0.75rem; text-transform: uppercase; margin-bottom: 1rem;">Schema Mastery Impact</h4>
                                <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                                    <div id="mastery-status" class="badge large" style="font-size: 1rem; padding: 0.4rem 1rem;"></div>
                                    <div id="mastery-concept" style="font-weight: 600;"></div>
                                </div>
                                <p id="evidence-text" style="font-size: 0.8rem; color: var(--text-secondary);"></p>
                            </div>
                        </div>

                        <!-- Row 3: Gamification -->
                        <div class="card" style="background: linear-gradient(90deg, #1e2a3a, #253347); border: 1px solid var(--accent-blue);">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <h4 style="color: var(--accent-blue); font-size: 0.75rem; text-transform: uppercase; margin-bottom: 0.5rem;">Recommended Activity</h4>
                                    <div id="game-name" style="font-size: 1.3rem; font-weight: 700; color: var(--text-primary);"></div>
                                    <div id="game-meta" style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.4rem;"></div>
                                </div>
                                <div style="text-align: right;">
                                    <div id="badge-icon" style="font-size: 2.5rem; margin-bottom: 0.5rem;">🏆</div>
                                    <div id="badge-name" style="font-size: 0.7rem; font-weight: 800; color: var(--accent-orange); text-transform: uppercase;"></div>
                                </div>
                            </div>
                        </div>

                        <!-- Alignment Message -->
                        <div id="alignment-box" style="padding: 1rem; border-radius: 12px; font-size: 0.85rem; background: rgba(74, 144, 226, 0.05); border: 1px dashed var(--accent-blue); color: var(--text-secondary);">
                        </div>
                    </div>
                </div>
            </div>

            <div class="right-col" style="display: flex; flex-direction: column; gap: 1.5rem;">
                <!-- Summary Card -->
                <div class="card glass-card">
                    <h3 style="font-size: 1rem; margin-bottom: 1.2rem;">Analysis Summary</h3>
                    <div id="summary-content" style="display: flex; flex-direction: column; gap: 1rem;">
                        <div class="spinner"></div>
                    </div>
                </div>

                <!-- History Card -->
                <div class="card glass-card">
                    <h3 style="font-size: 1rem; margin-bottom: 1.2rem;">Recent History</h3>
                    <div id="history-content" style="display: flex; flex-direction: column; gap: 0.8rem;">
                        <div class="spinner"></div>
                    </div>
                </div>
            </div>
        </div>
    `;

    const analyzeBtn = document.getElementById("analyze-btn");
    const codeInput = document.getElementById("code-input");
    const resultDashboard = document.getElementById("result-dashboard");

    // Load initial stats
    updateHistoryAndSummary(studentId);

    analyzeBtn.addEventListener("click", async () => {
        const code = codeInput.value.trim();
        if (!code) return alert("Please enter some Java code.");

        const pretest = {
            variables: parseInt(document.getElementById("pre-var").value) || null,
            operators: parseInt(document.getElementById("pre-op").value) || null,
            loops: parseInt(document.getElementById("pre-loop").value) || null,
            arrays: parseInt(document.getElementById("pre-arr").value) || null,
            methods: parseInt(document.getElementById("pre-meth").value) || null,
        };

        analyzeBtn.disabled = true;
        analyzeBtn.textContent = "Analyzing Patterns...";
        
        try {
            const res = await ErrorAPI.analyze({
                student_id: studentId,
                code: code,
                pretest_results: pretest
            });

            if (res.success) {
                renderResults(res);
                updateHistoryAndSummary(studentId);
            } else {
                alert("Analysis failed: " + res.error);
            }
        } catch (err) {
            console.error(err);
            alert("Error connecting to detector service.");
        } finally {
            analyzeBtn.disabled = false;
            analyzeBtn.textContent = "Analyze Java Code";
        }
    });

    document.getElementById("clear-btn").addEventListener("click", () => {
        codeInput.value = "";
        resultDashboard.classList.add("hidden");
    });
}

function renderResults(data) {
    const dashboard = document.getElementById("result-dashboard");
    dashboard.classList.remove("hidden");

    const pred = data.prediction;
    const expl = data.explanation;
    const gamify = data.gamification_payload;
    const schema = data.schema_mastery_payload;
    const adaptive = data.adaptive_payload;

    // Label Colors
    const colors = {
        "LOOP_ERROR": "#a78bfa",
        "VARIABLE_ERROR": "#f59e0b",
        "ARRAY_ERROR": "#34d399",
        "METHOD_ERROR": "#f472b6",
        "CORRECT": "#22c55e"
    };
    const color = colors[pred.label] || "var(--accent-blue)";

    // Update Prediction Card
    document.getElementById("card-prediction").style.borderLeftColor = color;
    document.getElementById("label-badge").textContent = pred.label;
    document.getElementById("label-badge").style.color = color;
    document.getElementById("concept-text").textContent = `Concept: ${pred.concept}`;
    document.getElementById("conf-level").textContent = pred.confidence_level;
    document.getElementById("conf-level").style.color = pred.confidence_level === "High" ? "var(--accent-green)" : "var(--accent-orange)";
    document.getElementById("sev-level").textContent = pred.severity;
    document.getElementById("sev-level").style.color = pred.severity === "High" ? "#ef4444" : "var(--accent-green)";

    // Update Explanation
    document.getElementById("reason-text").textContent = expl.reason;
    document.getElementById("miscon-text").textContent = expl.misconception;
    
    // Update Fix
    document.getElementById("fix-text").textContent = expl.suggested_fix;
    document.getElementById("next-step").textContent = adaptive.next_learning_step;

    // Update Mastery
    const masteryBadge = document.getElementById("mastery-status");
    masteryBadge.textContent = schema.schema_status;
    masteryBadge.style.background = schema.schema_status === "Stable" ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)";
    masteryBadge.style.color = schema.schema_status === "Stable" ? "#22c55e" : "#ef4444";
    document.getElementById("mastery-concept").textContent = schema.concept;
    document.getElementById("evidence-text").textContent = schema.evidence;

    // Update Gamification
    document.getElementById("game-name").textContent = gamify.recommended_activity;
    document.getElementById("game-meta").textContent = `${gamify.game_type} • ${gamify.difficulty} difficulty`;
    document.getElementById("badge-name").textContent = gamify.reward_badge;
    
    // Alignment Message
    document.getElementById("alignment-box").textContent = data.pretest_alignment.message;

    // Scroll to results
    dashboard.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function updateHistoryAndSummary(studentId) {
    try {
        const historyData = await ErrorAPI.getHistory(studentId);
        const summaryData = await ErrorAPI.getSummary(studentId);

        // Render History
        const histCont = document.getElementById("history-content");
        if (historyData.total === 0) {
            histCont.innerHTML = `<p style="color: var(--text-secondary); font-size: 0.85rem;">No analysis history yet.</p>`;
        } else {
            histCont.innerHTML = historyData.history.reverse().map(item => `
                <div style="padding: 0.8rem; background: var(--bg-secondary); border-radius: 8px; border: 1px solid var(--border-color);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
                        <span style="font-weight: 700; font-size: 0.75rem; color: var(--accent-blue);">${item.label}</span>
                        <span style="font-size: 0.65rem; color: var(--text-secondary);">${new Date(item.timestamp).toLocaleDateString()}</span>
                    </div>
                    <div style="font-size: 0.8rem; color: var(--text-primary);">${item.concept}</div>
                    <div style="font-size: 0.7rem; color: var(--text-secondary); margin-top: 0.2rem;">Rec: ${item.activity}</div>
                </div>
            `).join("");
        }

        // Render Summary
        const sumCont = document.getElementById("summary-content");
        if (summaryData.total_analyses === 0) {
            sumCont.innerHTML = `<p style="color: var(--text-secondary); font-size: 0.85rem;">Start analyzing code to see your trends.</p>`;
        } else {
            sumCont.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 0.85rem; color: var(--text-secondary);">Total Analyses</span>
                    <span style="font-weight: 700; color: var(--text-primary);">${summaryData.total_analyses}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 0.85rem; color: var(--text-secondary);">Top Error</span>
                    <span style="font-weight: 700; color: var(--accent-orange);">${summaryData.most_frequent_error}</span>
                </div>
                <div style="margin-top: 0.5rem; padding: 0.8rem; background: rgba(74, 144, 226, 0.1); border-radius: 8px; border: 1px solid rgba(74, 144, 226, 0.2);">
                    <div style="font-size: 0.7rem; color: var(--accent-blue); text-transform: uppercase; font-weight: 800;">Recommended Focus</div>
                    <div style="font-size: 1rem; font-weight: 700; color: var(--text-primary); margin-top: 0.2rem;">${summaryData.recommended_focus}</div>
                </div>
            `;
        }
    } catch (err) {
        console.warn("Could not update history/summary:", err);
    }
}
