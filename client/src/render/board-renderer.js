import { BOARD_HEIGHT, BOARD_WIDTH, CELL_SIZE, COLORS, HIDDEN_ROWS } from '../../../shared/constants.js';

export function createCanvasRenderer({ canvas, opponentCanvas }) {
  const ctx = canvas.getContext('2d');
  const opponentCtx = opponentCanvas.getContext('2d');

  function drawCell(context, x, y, size, value) {
    context.fillStyle = COLORS[value] ?? COLORS.empty;
    context.fillRect(x * size, y * size, size, size);

    context.strokeStyle = 'rgba(255,255,255,0.08)';
    context.lineWidth = 1;
    context.strokeRect(x * size + 0.5, y * size + 0.5, size - 1, size - 1);
  }

  function drawBoard(context, board, size, includeHidden = false) {
    const startY = includeHidden ? 0 : HIDDEN_ROWS;
    const visibleRows = includeHidden ? BOARD_HEIGHT : BOARD_HEIGHT - HIDDEN_ROWS;

    context.clearRect(0, 0, context.canvas.width, context.canvas.height);

    for (let y = 0; y < visibleRows; y += 1) {
      for (let x = 0; x < BOARD_WIDTH; x += 1) {
        const value = board[y + startY]?.[x] ?? 0;
        drawCell(context, x, y, size, value || 'empty');
      }
    }
  }

  function drawPiece(context, piece, size) {
    if (!piece) return;

    for (let y = 0; y < piece.matrix.length; y += 1) {
      for (let x = 0; x < piece.matrix[y].length; x += 1) {
        const value = piece.matrix[y][x];
        if (!value) continue;

        const drawX = piece.x + x;
        const drawY = piece.y + y - HIDDEN_ROWS;

        if (drawY >= 0) {
          drawCell(context, drawX, drawY, size, value);
        }
      }
    }
  }

  return {
    render(state) {
      drawBoard(ctx, state.board, CELL_SIZE);
      drawPiece(ctx, state.active, CELL_SIZE);

      if (!state.alive) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = '700 28px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
      }
    },

    renderOpponent(state) {
      const size = 14;

      if (!state?.board) {
        opponentCtx.clearRect(0, 0, opponentCanvas.width, opponentCanvas.height);
        opponentCtx.fillStyle = 'rgba(255,255,255,0.08)';
        opponentCtx.fillRect(0, 0, opponentCanvas.width, opponentCanvas.height);
        opponentCtx.fillStyle = '#aab1d7';
        opponentCtx.font = '12px Arial';
        opponentCtx.textAlign = 'center';
        opponentCtx.fillText('NO OPPONENT', opponentCanvas.width / 2, opponentCanvas.height / 2);
        return;
      }

      drawBoard(opponentCtx, state.board, size);
      drawPiece(opponentCtx, state.active, size);
    }
  };
}