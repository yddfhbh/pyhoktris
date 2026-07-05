export function renderResult({ win = false, score = 0, lines = 0 } = {}) {
  return `
    <section>
      <h2>${win ? '승리' : '패배'}</h2>
      <p>Score: ${score}</p>
      <p>Lines: ${lines}</p>
    </section>
  `;
}