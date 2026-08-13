/**
 * MCQ Question Bank
 * ─────────────────
 * Each question has:
 *   id       – unique number
 *   question – question text
 *   options  – array of 4 answer strings
 *   answer   – the correct option string (must exactly match one item in options)
 *
 * To add more questions: just push a new object following the same schema.
 */

export const questions = [
  {
    id: 1,
    question: "What is Artificial Intelligence?",
    options: [
      "A programming language",
      "A field of computer science that simulates human intelligence",
      "A type of database",
      "An operating system"
    ],
    answer: "A field of computer science that simulates human intelligence"
  },
  {
    id: 2,
    question: "Which programming language is most widely used for AI and Machine Learning development?",
    options: [
      "Java",
      "C++",
      "Python",
      "HTML"
    ],
    answer: "Python"
  },
  {
    id: 3,
    question: "What does 'ML' stand for in the context of computer science?",
    options: [
      "Multi-Layer",
      "Machine Learning",
      "Model Logic",
      "Memory Load"
    ],
    answer: "Machine Learning"
  },
  {
    id: 4,
    question: "Which Python library is most commonly used for numerical computation and array operations?",
    options: [
      "Pandas",
      "Matplotlib",
      "NumPy",
      "Requests"
    ],
    answer: "NumPy"
  },
  {
    id: 5,
    question: "What is a Neural Network?",
    options: [
      "A computer network for sharing files",
      "A computational system inspired by biological neurons in the brain",
      "A type of database schema",
      "A Python library for web scraping"
    ],
    answer: "A computational system inspired by biological neurons in the brain"
  },
  {
    id: 6,
    question: "What is Supervised Learning in Machine Learning?",
    options: [
      "Learning without any data",
      "Training a model on unlabeled data to find hidden patterns",
      "Training a model on labeled input-output pairs",
      "A method of reinforcing decisions by trial and error"
    ],
    answer: "Training a model on labeled input-output pairs"
  },
  {
    id: 7,
    question: "What is OpenCV primarily used for?",
    options: [
      "Database management",
      "Computer vision and image processing",
      "Web development",
      "Natural language processing"
    ],
    answer: "Computer vision and image processing"
  },
  {
    id: 8,
    question: "What is the main purpose of MediaPipe?",
    options: [
      "Playing multimedia files",
      "Building cross-platform machine learning pipelines (e.g., face, hand, body tracking)",
      "Streaming audio to Bluetooth devices",
      "Compressing video files"
    ],
    answer: "Building cross-platform machine learning pipelines (e.g., face, hand, body tracking)"
  },
  {
    id: 9,
    question: "What is a dataset in the context of Machine Learning?",
    options: [
      "A type of programming variable",
      "A set of rules for an algorithm",
      "A collection of data used to train, validate, or test a model",
      "A cloud storage service"
    ],
    answer: "A collection of data used to train, validate, or test a model"
  },
  {
    id: 10,
    question: "What is classification in Machine Learning?",
    options: [
      "Predicting a continuous numerical value",
      "Grouping data into clusters without labels",
      "Assigning input data to one of several predefined categories",
      "Reducing the number of features in a dataset"
    ],
    answer: "Assigning input data to one of several predefined categories"
  }
];
