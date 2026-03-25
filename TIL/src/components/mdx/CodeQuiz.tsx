import { useState } from "react"

interface Question {
  code: string
  options: string[]
  answer: number
  explanation: string
}

interface Props {
  questions: Question[]
  title?: string
}

export function CodeQuiz({ questions, title = "TypeScript Quiz" }: Props) {
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const [showExplanation, setShowExplanation] = useState(false)

  const q = questions[current]
  const isCorrect = selected === q.answer

  const handleSelect = (i: number) => {
    if (selected !== null) return
    setSelected(i)
    setShowExplanation(true)
    if (i === q.answer) setScore(s => s + 1)
  }

  const handleNext = () => {
    if (current + 1 >= questions.length) {
      setFinished(true)
    } else {
      setCurrent(c => c + 1)
      setSelected(null)
      setShowExplanation(false)
    }
  }

  const handleReset = () => {
    setCurrent(0)
    setSelected(null)
    setScore(0)
    setFinished(false)
    setShowExplanation(false)
  }

  if (finished) {
    const pct = Math.round((score / questions.length) * 100)
    return (
      <div className="quiz-wrapper">
        <div className="quiz-finished">
          <div className="quiz-score-circle">
            <span className="quiz-score-num">{pct}%</span>
          </div>
          <h3 className="quiz-finished-title">
            {pct === 100 ? "Perfect Score! 🎉" : pct >= 60 ? "Nice Work! 👍" : "Keep Practicing 💪"}
          </h3>
          <p className="quiz-finished-sub">{score} of {questions.length} correct</p>
          <button className="quiz-btn" onClick={handleReset}>Try Again</button>
        </div>
      </div>
    )
  }

  return (
    <div className="quiz-wrapper">
      <div className="quiz-header">
        <span className="quiz-title">{title}</span>
        <span className="quiz-progress">{current + 1} / {questions.length}</span>
      </div>
      <pre className="quiz-code"><code>{q.code}</code></pre>
      <p className="quiz-question">What does this output?</p>
      <div className="quiz-options">
        {q.options.map((opt, i) => {
          let cls = "quiz-option"
          if (selected !== null) {
            if (i === q.answer) cls += " quiz-option--correct"
            else if (i === selected) cls += " quiz-option--wrong"
          }
          return (
            <button key={i} className={cls} onClick={() => handleSelect(i)}>
              <span className="quiz-option-label">{String.fromCharCode(65 + i)}</span>
              <span>{opt}</span>
            </button>
          )
        })}
      </div>
      {showExplanation && (
        <div className={`quiz-explanation ${isCorrect ? "quiz-explanation--correct" : "quiz-explanation--wrong"}`}>
          <strong>{isCorrect ? "✓ Correct!" : "✗ Not quite."}</strong> {q.explanation}
        </div>
      )}
      {selected !== null && (
        <button className="quiz-btn quiz-btn--next" onClick={handleNext}>
          {current + 1 >= questions.length ? "See Results" : "Next Question →"}
        </button>
      )}
    </div>
  )
}
