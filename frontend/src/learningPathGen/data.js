export const DEFAULT_PATH = [
    { name: "Variables & Data Types", mastery: 20, status: "started" },
    { name: "Conditionals", mastery: 15, status: "not_started" },
    { name: "Loops", mastery: 10, status: "not_started" },
    { name: "Functions", mastery: 5, status: "not_started" },
    { name: "Arrays", mastery: 0, status: "not_started" },
    { name: "Objects", mastery: 0, status: "not_started" },
];

export const QUIZ_BANK = [
    {
        id: 1,
        topic: "Variables",
        question: "Which keyword is best for a variable that should not be reassigned in JavaScript?",
        options: ["var", "const", "let", "static"],
        correctIndex: 1,
        explanation: "const prevents reassignment of the variable binding."
    },
    {
        id: 2,
        topic: "Data Types",
        question: "What is the result type of 10 / 3 in JavaScript?",
        options: ["Integer", "String", "Number", "Boolean"],
        correctIndex: 2,
        explanation: "JavaScript uses Number for both integer and floating-point values."
    },
    {
        id: 3,
        topic: "Conditionals",
        question: "Which operator checks both value and type equality?",
        options: ["==", "!=", "===", "="],
        correctIndex: 2,
        explanation: "=== checks value and type, unlike ==."
    },
    {
        id: 4,
        topic: "Loops",
        question: "Which loop is best when you know how many times to repeat?",
        options: ["while", "for", "do...while", "switch"],
        correctIndex: 1,
        explanation: "for loop is ideal for count-controlled iteration."
    },
    {
        id: 5,
        topic: "Functions",
        question: "How do you call a function named greet?",
        options: ["call greet;", "greet[]", "greet()", "run greet()"],
        correctIndex: 2,
        explanation: "Parentheses invoke the function."
    },
    {
        id: 6,
        topic: "Arrays",
        question: "Which method adds an element to the end of an array?",
        options: ["shift()", "push()", "unshift()", "pop()"],
        correctIndex: 1,
        explanation: "push() appends to the end."
    },
    {
        id: 7,
        topic: "Objects",
        question: "How do you access property name from user object?",
        options: ["user->name", "user.name", "user[name]", "name.user"],
        correctIndex: 1,
        explanation: "Dot notation is user.name."
    },
    {
        id: 8,
        topic: "Strings",
        question: "Which method converts text to uppercase?",
        options: ["toUpperCase()", "upper()", "capitalize()", "toCaps()"],
        correctIndex: 0,
        explanation: "toUpperCase() returns an uppercase string."
    },
    {
        id: 9,
        topic: "Booleans",
        question: "Which value is falsy in JavaScript?",
        options: ["'0'", "[]", "0", "{}"],
        correctIndex: 2,
        explanation: "0 is falsy; the others listed are truthy."
    },
    {
        id: 10,
        topic: "Scope",
        question: "Variables declared with let are scoped to:",
        options: ["function only", "global only", "block", "object"],
        correctIndex: 2,
        explanation: "let has block scope."
    },
    {
        id: 11,
        topic: "DOM",
        question: "Which method finds an element by its id?",
        options: ["querySelectorAll()", "getElementById()", "findById()", "selectId()"],
        correctIndex: 1,
        explanation: "document.getElementById() fetches by id."
    },
    {
        id: 12,
        topic: "Events",
        question: "Which event fires when a button is pressed?",
        options: ["hover", "submit", "click", "change"],
        correctIndex: 2,
        explanation: "click is the standard button press event."
    },
    {
        id: 13,
        topic: "Async",
        question: "Which keyword pauses inside an async function?",
        options: ["wait", "pause", "await", "yield"],
        correctIndex: 2,
        explanation: "await pauses until a promise resolves."
    },
    {
        id: 14,
        topic: "JSON",
        question: "Which function converts an object to JSON text?",
        options: ["JSON.parse()", "JSON.stringify()", "toJSONText()", "JSON.objectify()"],
        correctIndex: 1,
        explanation: "JSON.stringify() serializes object to string."
    },
    {
        id: 15,
        topic: "Debugging",
        question: "What is the main use of console.log?",
        options: ["Create UI", "Store permanent data", "Print debug info", "Compile code"],
        correctIndex: 2,
        explanation: "console.log helps inspect runtime values."
    },
    {
        id: 16,
        topic: "Operators",
        question: "What does ++ do?",
        options: ["Decrements by 1", "Increments by 1", "Multiplies by 2", "Converts to string"],
        correctIndex: 1,
        explanation: "++ increases numeric value by one."
    },
    {
        id: 17,
        topic: "Arrays",
        question: "Which method removes the last item in an array?",
        options: ["pop()", "slice()", "splice()", "shift()"],
        correctIndex: 0,
        explanation: "pop() removes and returns the last element."
    },
    {
        id: 18,
        topic: "Functions",
        question: "What does a function return if there is no return statement?",
        options: ["null", "0", "undefined", "false"],
        correctIndex: 2,
        explanation: "Functions return undefined by default."
    },
    {
        id: 19,
        topic: "Conditionals",
        question: "Which statement is used for multiple branch choices?",
        options: ["if only", "switch", "loop", "try"],
        correctIndex: 1,
        explanation: "switch handles multiple discrete branches."
    },
    {
        id: 20,
        topic: "Best Practice",
        question: "Why is meaningful variable naming important?",
        options: ["It makes code slower", "It improves readability", "It removes bugs automatically", "It changes syntax"],
        correctIndex: 1,
        explanation: "Good names make code easier to understand and maintain."
    },
];
