import { useState } from "react"

export function AnimationPlayground() {
  const [duration, setDuration] = useState(1.5)
  const [scale, setScale] = useState(1.3)
  const [rotate, setRotate] = useState(360)
  const [easing, setEasing] = useState("ease-in-out")
  const [color, setColor] = useState("#3b82f6")

  const easings = ["linear", "ease", "ease-in", "ease-out", "ease-in-out", "cubic-bezier(0.68,-0.55,0.27,1.55)"]

  const animStyle = {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: color,
    animation: `playground-anim ${duration}s ${easing} infinite`,
    ["--scale" as string]: scale,
    ["--rotate" as string]: `${rotate}deg`,
  }

  return (
    <div className="anim-playground">
      <style>{`
        @keyframes playground-anim {
          0% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(var(--scale)) rotate(calc(var(--rotate) / 2)); }
          100% { transform: scale(1) rotate(var(--rotate)); }
        }
      `}</style>

      <div className="anim-stage">
        <div style={animStyle} />
      </div>

      <div className="anim-controls">
        <label className="anim-control">
          <span>Duration: {duration}s</span>
          <input type="range" min="0.2" max="4" step="0.1" value={duration}
            onChange={e => setDuration(Number(e.target.value))} />
        </label>
        <label className="anim-control">
          <span>Scale: {scale}x</span>
          <input type="range" min="0.5" max="2.5" step="0.1" value={scale}
            onChange={e => setScale(Number(e.target.value))} />
        </label>
        <label className="anim-control">
          <span>Rotate: {rotate}°</span>
          <input type="range" min="0" max="720" step="45" value={rotate}
            onChange={e => setRotate(Number(e.target.value))} />
        </label>
        <label className="anim-control">
          <span>Color</span>
          <input type="color" value={color}
            onChange={e => setColor(e.target.value)} />
        </label>
        <label className="anim-control">
          <span>Easing</span>
          <select value={easing} onChange={e => setEasing(e.target.value)}
            className="anim-select">
            {easings.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </label>
      </div>

      <div className="anim-code">
        <code>{`animation: ${duration}s ${easing} infinite;
transform: scale(${scale}) rotate(${rotate}deg);`}</code>
      </div>
    </div>
  )
}
