import { useState } from 'react'

type QuestionType = 'multiple-choice' | 'true-false' | 'free-text'

interface BaseQuestion {
  type: QuestionType
  question: string
  explanation?: string
}

interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multiple-choice'
  options: string[]
  answer: string
}

interface TrueFalseQuestion extends BaseQuestion {
  type: 'true-false'
  answer: boolean
}

interface FreeTextQuestion extends BaseQuestion {
  type: 'free-text'
  answer: string | string[]
}

export type Question = MultipleChoiceQuestion | TrueFalseQuestion | FreeTextQuestion

interface QuizProps {
  title?: string
  questions: Question[]
}

function checkAnswer(question: Question, userAnswer: string): boolean {
  if (question.type === 'multiple-choice') {
    return userAnswer.trim() === question.answer.trim()
  }
  if (question.type === 'true-false') {
    return userAnswer === String(question.answer)
  }
  if (question.type === 'free-text') {
    const normalized = userAnswer.trim().toLowerCase()
    if (Array.isArray(question.answer)) {
      return question.answer.map(a => a.toLowerCase()).includes(normalized)
    }
    return normalized === question.answer.toLowerCase()
  }
  return false
}

export function Quiz({ title, questions }: QuizProps) {
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [results, setResults] = useState<Record<number, boolean>>({})

  const allAnswered = questions.every((_, i) => answers[i] !== undefined && answers[i] !== '')

  const handleSubmit = () => {
    const newResults: Record<number, boolean> = {}
    questions.forEach((q, i) => {
      newResults[i] = checkAnswer(q, answers[i] ?? '')
    })
    setResults(newResults)
    setSubmitted(true)
  }

  const handleRetake = () => {
    setAnswers({})
    setResults({})
    setSubmitted(false)
  }

  const score = submitted
    ? Object.values(results).filter(Boolean).length
    : 0

  const scorePercent = submitted ? Math.round((score / questions.length) * 100) : 0

  return (
    <div className="quiz">
      {title && (
        <div className="quiz__header">
          <span className="quiz__icon">🧠</span>
          <span className="quiz__title">{title}</span>
          <span className="quiz__count">{questions.length} question{questions.length !== 1 ? 's' : ''}</span>
        </div>
      )}

      <div className="quiz__questions">
        {questions.map((q, i) => (
          <div
            key={i}
            className={`quiz__question${submitted ? (results[i] ? ' quiz__question--correct' : ' quiz__question--incorrect') : ''}`}
          >
            <div className="quiz__question-header">
              <span className="quiz__question-num">{i + 1}</span>
              <p className="quiz__question-text">{q.question}</p>
              {submitted && (
                <span className="quiz__question-icon">
                  {results[i] ? '✓' : '✗'}
                </span>
              )}
            </div>

            {q.type === 'multiple-choice' && (
              <div className="quiz__options">
                {q.options.map((opt, j) => {
                  const selected = answers[i] === opt
                  const isCorrect = submitted && opt === q.answer
                  const isWrong = submitted && selected && !isCorrect
                  return (
                    <label
                      key={j}
                      className={`quiz__option${selected ? ' quiz__option--selected' : ''}${isCorrect ? ' quiz__option--correct' : ''}${isWrong ? ' quiz__option--wrong' : ''}`}
                    >
                      <input
                        type="radio"
                        name={`question-${i}`}
                        value={opt}
                        checked={selected}
                        disabled={submitted}
                        onChange={() => setAnswers(a => ({ ...a, [i]: opt }))}
                      />
                      <span className="quiz__option-text">{opt}</span>
                    </label>
                  )
                })}
              </div>
            )}

            {q.type === 'true-false' && (
              <div className="quiz__options quiz__options--tf">
                {(['true', 'false'] as const).map(val => {
                  const selected = answers[i] === val
                  const isCorrect = submitted && val === String(q.answer)
                  const isWrong = submitted && selected && !isCorrect
                  return (
                    <label
                      key={val}
                      className={`quiz__option${selected ? ' quiz__option--selected' : ''}${isCorrect ? ' quiz__option--correct' : ''}${isWrong ? ' quiz__option--wrong' : ''}`}
                    >
                      <input
                        type="radio"
                        name={`question-${i}`}
                        value={val}
                        checked={selected}
                        disabled={submitted}
                        onChange={() => setAnswers(a => ({ ...a, [i]: val }))}
                      />
                      <span className="quiz__option-text">{val === 'true' ? 'True' : 'False'}</span>
                    </label>
                  )
                })}
              </div>
            )}

            {q.type === 'free-text' && (
              <div className="quiz__free-text">
                <input
                  type="text"
                  className={`quiz__free-text-input${submitted ? (results[i] ? ' quiz__free-text-input--correct' : ' quiz__free-text-input--wrong') : ''}`}
                  placeholder="Type your answer…"
                  value={answers[i] ?? ''}
                  disabled={submitted}
                  onChange={e => setAnswers(a => ({ ...a, [i]: e.target.value }))}
                  onKeyDown={e => { if (e.key === 'Enter' && allAnswered && !submitted) handleSubmit() }}
                />
                {submitted && !results[i] && (
                  <div className="quiz__correct-answer">
                    Correct answer: {Array.isArray(q.answer) ? q.answer.join(' or ') : q.answer}
                  </div>
                )}
              </div>
            )}

            {submitted && q.explanation && (
              <div className="quiz__explanation">{q.explanation}</div>
            )}
          </div>
        ))}
      </div>

      {!submitted ? (
        <button
          className={`quiz__submit${allAnswered ? ' quiz__submit--ready' : ''}`}
          onClick={handleSubmit}
          disabled={!allAnswered}
        >
          Submit Quiz
        </button>
      ) : (
        <div className="quiz__results">
          <div className="quiz__score">
            <div className="quiz__score-fraction">{score} / {questions.length}</div>
            <div className="quiz__score-percent">{scorePercent}%</div>
            <div className="quiz__score-label">
              {scorePercent === 100 ? '🎉 Perfect score!' : scorePercent >= 70 ? '👍 Good work!' : '📖 Keep studying!'}
            </div>
          </div>
          <button className="quiz__retake" onClick={handleRetake}>↺ Retake Quiz</button>
        </div>
      )}
    </div>
  )
}
