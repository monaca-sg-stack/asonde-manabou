"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Question = {
  prompt: string;
  choices: string[];
  answerIndex: number;
};

const questions: Question[] = [
  {
    prompt: "「りんご」は どれ？",
    choices: ["りんご", "くるま", "いぬ"],
    answerIndex: 0,
  },
  {
    prompt: "2 + 1 は いくつ？",
    choices: ["1", "3", "5"],
    answerIndex: 1,
  },
  {
    prompt: "みずの中で およぐ いきものは？",
    choices: ["さかな", "ぞう", "うさぎ"],
    answerIndex: 0,
  },
];

export default function QuizPage() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);

  const question = useMemo(() => questions[currentIndex], [currentIndex]);
  const isAnswered = selectedIndex !== null;

  const handleAnswer = (choiceIndex: number) => {
    if (isAnswered) return;
    setSelectedIndex(choiceIndex);
    if (choiceIndex === question.answerIndex) {
      setCorrectCount((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (!isAnswered) return;
    if (currentIndex + 1 >= questions.length) {
      const finalCorrect =
        correctCount + (selectedIndex === question.answerIndex ? 1 : 0);
      router.push(`/result?correct=${finalCorrect}&total=${questions.length}`);
      return;
    }
    setCurrentIndex((prev) => prev + 1);
    setSelectedIndex(null);
  };

  return (
    <main className="page">
      <section className="hero">
        <p className="tag">クイズ</p>
        <h1>
          もんだい {currentIndex + 1} / {questions.length}
        </h1>
        <p className="lead">{question.prompt}</p>
      </section>

      <section className="menu-grid" aria-label="クイズ選択肢">
        {question.choices.map((choice, index) => {
          const isCorrect = isAnswered && index === question.answerIndex;
          const isWrong = isAnswered && selectedIndex === index && !isCorrect;
          return (
            <button
              type="button"
              key={choice}
              className={`menu-card quiz-option${isCorrect ? " correct" : ""}${
                isWrong ? " wrong" : ""
              }`}
              onClick={() => handleAnswer(index)}
              disabled={isAnswered}
            >
              <h2>{choice}</h2>
            </button>
          );
        })}
      </section>

      <section className="actions">
        {isAnswered ? (
          <p className="feedback">
            {selectedIndex === question.answerIndex ? "せいかい！" : "おしい！"}
          </p>
        ) : (
          <p className="feedback">えらんでみよう！</p>
        )}
        <button type="button" className="primary-button" onClick={handleNext}>
          {currentIndex + 1 === questions.length ? "けっかを見る" : "つぎへ"}
        </button>
        <Link href="/" className="link-button">
          トップにもどる
        </Link>
      </section>
    </main>
  );
}
