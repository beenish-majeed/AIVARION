import { QuizQuestion, QuizAttempt } from '../types';
import { QuizQuestionSchema } from '../schemas';
import { dbLocal } from '../db';
import { executeOnDeviceInference } from './aiService';

// Built-in foundational question set for offline on-device baseline
const FALLBACK_PYTHON_QUESTIONS: QuizQuestion[] = [
  {
    id: 'py_q_1',
    question: 'In Python, which built-in function returns the number of items in a list or sequence?',
    options: ['count()', 'len()', 'size()', 'length()'],
    correctIndex: 1,
    explanation: 'The len() function returns the length (the number of items) of an object such as a list, string, or tuple.',
  },
  {
    id: 'py_q_2',
    question: 'Which of the following creates a dictionary in Python?',
    options: ['d = [1, 2, 3]', 'd = (1, 2, 3)', 'd = {"name": "Aivarion"}', 'd = set([1, 2])'],
    correctIndex: 2,
    explanation: 'Curly braces with key-value pairs define a dictionary in Python.',
  },
  {
    id: 'py_q_3',
    question: 'How do you define a function in Python?',
    options: ['func myFunc():', 'def myFunc():', 'function myFunc():', 'fn myFunc():'],
    correctIndex: 1,
    explanation: 'Functions in Python are defined using the "def" keyword followed by the function name and parentheses.',
  },
  {
    id: 'py_q_4',
    question: 'What is the output of bool([]) in Python?',
    options: ['True', 'False', 'None', 'Error'],
    correctIndex: 1,
    explanation: 'In Python, empty collections such as empty lists, dictionaries, tuples, and sets evaluate to False in a boolean context.',
  },
  {
    id: 'py_q_5',
    question: 'Which list method appends an element to the end of an existing list?',
    options: ['push()', 'add()', 'append()', 'insertEnd()'],
    correctIndex: 2,
    explanation: 'The append() method adds an item to the end of the list in place.',
  },
];

// Generate one Python quiz question on-device and validate with Zod
export async function generatePythonQuizQuestion(): Promise<QuizQuestion> {
  const prompt = `Generate a single multiple-choice Python question for a beginner. 
Respond ONLY with a valid JSON object matching this exact schema:
{
  "id": "py_${Date.now()}",
  "question": "Question text here?",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctIndex": 0,
  "explanation": "Short 1-2 sentence explanation of why this answer is correct."
}`;

  try {
    // 1. Attempt on-device generation
    const response = await executeOnDeviceInference(prompt);
    
    // Clean potential markdown fencing from model output
    const cleanJson = response.text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    const parsed = JSON.parse(cleanJson);
    // 2. Validate with strict Zod schema
    const validated = QuizQuestionSchema.parse(parsed);
    return validated;
  } catch (err) {
    // If on-device inference is unavailable on hardware or JSON validation fails,
    // safely deliver from verified local curriculum bank with zero cloud calls
    console.warn('On-device generation note; delivering from verified local curriculum bank:', err);
    const randomIndex = Math.floor(Math.random() * FALLBACK_PYTHON_QUESTIONS.length);
    const selected = FALLBACK_PYTHON_QUESTIONS[randomIndex];
    
    // Ensure Zod validation passes on fallback as well
    return QuizQuestionSchema.parse({
      ...selected,
      id: `py_local_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    });
  }
}

// Deterministic grading function: strictly executed by code, never by the model
export function gradePythonAnswer(userSelectedOption: number, correctIndex: number): boolean {
  return Number(userSelectedOption) === Number(correctIndex);
}

// Record attempt and store in Dexie IndexedDB
export async function recordQuizAttempt(
  question: QuizQuestion,
  userSelectedOption: number
): Promise<QuizAttempt> {
  const isCorrect = gradePythonAnswer(userSelectedOption, question.correctIndex);

  const attempt: QuizAttempt = {
    id: `attempt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    questionId: question.id,
    question: question.question,
    selectedOption: userSelectedOption,
    correctOption: question.correctIndex,
    isCorrect,
    explanation: question.explanation,
    timestamp: Date.now(),
  };

  await dbLocal.quizAttempts.add(attempt);
  return attempt;
}

// Get user quiz history and progress metrics
export async function getQuizStats(): Promise<{
  totalAttempts: number;
  correctCount: number;
  accuracyRate: number;
  history: QuizAttempt[];
}> {
  const history = await dbLocal.quizAttempts.orderBy('timestamp').reverse().toArray();
  const totalAttempts = history.length;
  const correctCount = history.filter((a) => a.isCorrect).length;
  const accuracyRate = totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 0;

  return {
    totalAttempts,
    correctCount,
    accuracyRate,
    history,
  };
}
