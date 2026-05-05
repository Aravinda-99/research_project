"""
Component 2: Error Pattern Detector — Service
===============================================
Implements ML-powered Java error detection using a Linear SVM model.
Provides beginner-friendly explanations and gamification payloads.
"""

import os
import re
import joblib
import datetime
from firebase.firebase_service import db

# Path to the saved model
MODEL_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "ml_models", "best_error_detection_model.pkl"))

class ErrorService:
    _model = None
    _history = []  # In-memory history (fallback if Firestore is offline)

    @classmethod
    def _load_model(cls):
        """Loads the saved Linear SVM model once."""
        if cls._model is None:
            if os.path.exists(MODEL_PATH):
                try:
                    cls._model = joblib.load(MODEL_PATH)
                except Exception as e:
                    print(f"CRITICAL ERROR loading model: {e}")
            else:
                print(f"Model file NOT found at {MODEL_PATH}")
        return cls._model

    @staticmethod
    def clean_java_code(code):
        """Preprocesses Java code to match training data format."""
        if not code:
            return ""
        # Remove block comments
        code = re.sub(r'/\*.*?\*/', '', code, flags=re.DOTALL)
        # Remove line comments
        code = re.sub(r'//.*', '', code)
        # Remove import statements
        code = re.sub(r'import\s+.*?;', '', code)
        # Remove package statements
        code = re.sub(r'package\s+.*?;', '', code)
        # Normalize whitespace (replace tabs/newlines with single space)
        code = re.sub(r'\s+', ' ', code)
        return code.strip()

    @classmethod
    def analyze(cls, data):
        """Detect error patterns in submitted code using Linear SVM."""
        student_id = data.get("student_id", "anonymous")
        code = data.get("code", "")
        pretest = data.get("pretest_results", {})

        if not code:
            return {"success": False, "error": "No code provided"}

        model = cls._load_model()
        if not model:
            return {"success": False, "error": "ML Model not available on backend"}

        # Preprocess and predict
        cleaned_code = cls.clean_java_code(code)
        try:
            label = model.predict([cleaned_code])[0]
            
            # Confidence estimation
            confidence = "Medium"
            if hasattr(model, "decision_function"):
                decision_scores = model.decision_function([cleaned_code])[0]
                # Simple heuristic: if max score is significantly higher than others
                if max(decision_scores) > 1.0:
                    confidence = "High"
                elif max(decision_scores) < 0.3:
                    confidence = "Low"
        except Exception as e:
            return {"success": False, "error": f"Prediction failed: {str(e)}"}

        # Map label to details
        details = cls._get_label_details(label)
        
        # Pre-test alignment
        alignment = cls._align_with_pretest(label, pretest)

        response = {
            "success": True,
            "student_id": student_id,
            "prediction": {
                "label": label,
                "concept": details["concept"],
                "confidence_level": confidence,
                "severity": "High" if label != "CORRECT" else "None"
            },
            "explanation": {
                "reason": details["reason"],
                "misconception": details["misconception"],
                "suggested_fix": details["suggested_fix"],
                "beginner_explanation": details["beginner_explanation"]
            },
            "pretest_alignment": alignment,
            "gamification_payload": details["gamification"],
            "adaptive_payload": details["adaptive"],
            "schema_mastery_payload": {
                "concept": details["concept"],
                "schema_status": "Stable" if label == "CORRECT" else "Fragile",
                "evidence": f"ML prediction of {label} and pre-test alignment."
            }
        }

        # Save to history
        cls._history.append({
            "student_id": student_id,
            "code": code[:100] + "...",
            "label": label,
            "concept": details["concept"],
            "timestamp": datetime.datetime.now().isoformat(),
            "activity": details["gamification"]["recommended_activity"]
        })

        return response

    @staticmethod
    def _get_label_details(label):
        """Central mapping for all explanation templates."""
        templates = {
            "LOOP_ERROR": {
                "concept": "Loops",
                "reason": "The code shows a pattern commonly associated with loop boundary, condition, or update issues.",
                "misconception": "Likely misunderstanding of loop termination conditions (e.g., using <= instead of <) or how the counter variable updates.",
                "suggested_fix": "Verify your loop starting point, the termination condition, and how the counter (e.g., i++) changes each time.",
                "beginner_explanation": "A loop is like a race. If the finish line is in the wrong place, or if you forget to step forward, you'll never finish correctly!",
                "gamification": {
                    "target_concept": "Loops",
                    "recommended_activity": "Loop Boundary Debugging Challenge",
                    "game_type": "debugging_challenge",
                    "difficulty": "medium",
                    "reward_badge": "Loop Fixer",
                    "mastery_action": "reduce_loop_mastery_score"
                },
                "adaptive": {
                    "recommended_topic": "Loop Conditions and Counter Updates",
                    "next_learning_step": "Practice tracing loop iterations manually",
                    "priority": "High"
                }
            },
            "VARIABLE_ERROR": {
                "concept": "Variables",
                "reason": "The code contains issues related to variable assignment, initialization, or unexpected value overwriting.",
                "misconception": "Likely misunderstanding of how variable state changes over time or how operators affect the stored value.",
                "suggested_fix": "Trace the value of your variables line-by-line. Ensure they are initialized before use and assigned correctly.",
                "beginner_explanation": "Variables are boxes that hold data. If you put the wrong thing in the box or forget to label it, your program gets confused.",
                "gamification": {
                    "target_concept": "Variables",
                    "recommended_activity": "Variable Tracing Mission",
                    "game_type": "tracing_mission",
                    "difficulty": "easy",
                    "reward_badge": "Variable Tracker",
                    "mastery_action": "reduce_variable_mastery_score"
                },
                "adaptive": {
                    "recommended_topic": "Variable Scope and Assignment",
                    "next_learning_step": "Complete a variable state tracing exercise",
                    "priority": "Medium"
                }
            },
            "ARRAY_ERROR": {
                "concept": "Arrays",
                "reason": "The code pattern suggests a problem with array indexing, length access, or traversal boundaries.",
                "misconception": "Commonly occurs when forgetting that Java arrays are 0-indexed, leading to 'Off-by-One' errors.",
                "suggested_fix": "Check your array indices. Remember that for an array of size N, the last valid index is N-1.",
                "beginner_explanation": "Think of an array as a row of lockers. The first locker is always number 0. If you try to open locker number 10 in a row of 10, it won't exist!",
                "gamification": {
                    "target_concept": "Arrays",
                    "recommended_activity": "Array Index Rescue Game",
                    "game_type": "arcade_rescue",
                    "difficulty": "hard",
                    "reward_badge": "Array Guardian",
                    "mastery_action": "reduce_array_mastery_score"
                },
                "adaptive": {
                    "recommended_topic": "Zero-based Indexing and Array Bounds",
                    "next_learning_step": "Solve the Array Boundary Challenge",
                    "priority": "High"
                }
            },
            "METHOD_ERROR": {
                "concept": "Methods",
                "reason": "The detected pattern relates to method signatures, return values, or incorrect argument passing.",
                "misconception": "Likely misunderstanding of how data flows in and out of methods (parameters vs. return values).",
                "suggested_fix": "Check your method definition. Ensure the return type matches the 'return' statement and arguments match the parameters.",
                "beginner_explanation": "A method is like a machine. You give it ingredients (parameters), and it gives you a result (return value). Make sure you're using the right ingredients!",
                "gamification": {
                    "target_concept": "Methods",
                    "recommended_activity": "Method Repair Challenge",
                    "game_type": "puzzle_repair",
                    "difficulty": "medium",
                    "reward_badge": "Method Master",
                    "mastery_action": "reduce_method_mastery_score"
                },
                "adaptive": {
                    "recommended_topic": "Method Parameters and Return Types",
                    "next_learning_step": "Build a modular program using multiple methods",
                    "priority": "Medium"
                }
            },
            "CORRECT": {
                "concept": "General",
                "reason": "No common beginner error patterns were detected in the submitted code.",
                "misconception": "The learner appears to have a stable grasp of the implemented concepts.",
                "suggested_fix": "Everything looks good! You can try a more complex challenge to further test your skills.",
                "beginner_explanation": "Great job! Your code follows the expected logic and structure for these programming concepts.",
                "gamification": {
                    "target_concept": "General",
                    "recommended_activity": "Advanced Java Challenge",
                    "game_type": "advanced_project",
                    "difficulty": "pro",
                    "reward_badge": "Clean Coder",
                    "mastery_action": "maintain_mastery_score"
                },
                "adaptive": {
                    "recommended_topic": "Advanced Logic and Optimization",
                    "next_learning_step": "Move to the next module in the learning path",
                    "priority": "Low"
                }
            }
        }
        return templates.get(label, templates["CORRECT"])

    @staticmethod
    def _align_with_pretest(label, pretest):
        """Aligns ML prediction with pre-test scores for a more holistic feedback."""
        if not pretest:
            return {
                "used": False,
                "message": "Pre-test results were not provided. Analysis is based only on submitted code."
            }

        mapping = {
            "VARIABLE_ERROR": "variables",
            "LOOP_ERROR": "loops",
            "ARRAY_ERROR": "arrays",
            "METHOD_ERROR": "methods",
            "CORRECT": None
        }

        concept_key = mapping.get(label)
        if not concept_key:
            return {"used": True, "related_score": None, "message": "Code is correct; pre-test alignment not required."}

        score = pretest.get(concept_key)
        if score is None:
            return {"used": False, "message": f"Pre-test score for {concept_key} missing."}

        if score <= 2:
            msg = f"The predicted error ({label}) matches a weak area identified in your pre-test for {concept_key}."
        else:
            msg = f"An error was detected, but your pre-test score for {concept_key} suggest you have some conceptual foundation."

        return {
            "used": True,
            "related_score": score,
            "message": msg
        }

    @classmethod
    def get_history(cls, user_id):
        """Returns error analysis history (last 10 items)."""
        # Filter by user_id if needed, but for demo just return all/last 10
        user_history = [h for h in cls._history if h["student_id"] == user_id]
        return {
            "user_id": user_id,
            "total": len(user_history),
            "history": user_history[-10:]
        }

    @classmethod
    def get_summary(cls, user_id):
        """Aggregates error patterns for the user."""
        user_history = [h for h in cls._history if h["student_id"] == user_id]
        if not user_history:
            return {"user_id": user_id, "total_analyses": 0, "counts": {}}

        counts = {}
        for h in user_history:
            lbl = h["label"]
            counts[lbl] = counts.get(lbl, 0) + 1

        most_freq = max(counts, key=counts.get) if counts else "None"
        
        return {
            "user_id": user_id,
            "total_analyses": len(user_history),
            "counts": counts,
            "most_frequent_error": most_freq,
            "recommended_focus": cls._get_label_details(most_freq)["concept"]
        }
