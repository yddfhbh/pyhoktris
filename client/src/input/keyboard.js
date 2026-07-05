export function bindKeyboard({
  onLeft,
  onRight,
  onRotate,
  onSoftDrop,
  onHardDrop,
  onRestart
}) {
  const pressed = new Set();

  function handleKeyDown(event) {
    if (pressed.has(event.code)) return;
    pressed.add(event.code);

    if (event.code === 'ArrowLeft') {
      event.preventDefault();
      onLeft?.();
    }

    if (event.code === 'ArrowRight') {
      event.preventDefault();
      onRight?.();
    }

    if (event.code === 'ArrowUp' || event.code === 'KeyX') {
      event.preventDefault();
      onRotate?.();
    }

    if (event.code === 'ArrowDown') {
      event.preventDefault();
      onSoftDrop?.();
    }

    if (event.code === 'Space') {
      event.preventDefault();
      onHardDrop?.();
    }

    if (event.code === 'KeyR') {
      event.preventDefault();
      onRestart?.();
    }
  }

  function handleKeyUp(event) {
    pressed.delete(event.code);
  }

  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);

  return function cleanup() {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
  };
}

export function attachKeyboardControls(target, handlers) {
  const listener = (event) => {
    handlers?.[event.code]?.(event);
  };

  target.addEventListener('keydown', listener);

  return () => target.removeEventListener('keydown', listener);
}
