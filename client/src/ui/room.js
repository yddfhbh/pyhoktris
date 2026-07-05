export function renderRoom(roomId) {
  return `
    <section>
      <h2>Room ${roomId}</h2>
      <button data-ready>준비</button>
    </section>
  `;
}