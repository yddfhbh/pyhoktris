export function bindKeyboard({
  onLeft,
  onRight,
  onRotate,
  onSoftDrop,
  onHardDrop,
  onHold,
  onRestart,
  keybinds = {},
  handling = {}
}) {
  const oneShotPressed = new Set();
  const repeatTimers = new Map();
  let activeHorizontalCode = null;

  const effectiveKeybinds = {
    moveLeft: 'ArrowLeft',
    moveRight: 'ArrowRight',
    softDrop: 'ArrowDown',
    hardDrop: 'Space',
    rotate: 'ArrowUp',
    hold: 'KeyC',
    restart: 'KeyR',
    ...keybinds
  };

  const effectiveHandling = {
    arr: 40,
    das: 140,
    dcd: 0,
    sdf: 1,
    ...handling
  };

  const actionHandlers = {
    moveLeft: onLeft,
    moveRight: onRight,
    softDrop: onSoftDrop,
    hardDrop: onHardDrop,
    rotate: onRotate,
    hold: onHold,
    restart: onRestart
  };

  const codeToAction = Object.fromEntries(
    Object.entries(effectiveKeybinds).map(([action, code]) => [code, action])
  );

  function clearRepeat(code) {
    const timer = repeatTimers.get(code);
    if (!timer) return;
    clearTimeout(timer.timeoutId);
    clearInterval(timer.intervalId);
    repeatTimers.delete(code);
  }

  function startRepeat(code, actionName, action) {
    if (!action || repeatTimers.has(code)) return;

    if (actionName === 'softDrop') {
      triggerSoftDrop(action);
    } else {
      action();
    }

    const timeoutId = window.setTimeout(() => {
      if (actionName === 'moveLeft' || actionName === 'moveRight') {
        if (effectiveHandling.arr === 0) {
          while (action()) {
            // Instant ARR pushes to the wall as soon as auto-repeat starts.
          }
          return;
        }

        action();
      }

      if (actionName === 'softDrop') {
        triggerSoftDrop(action);
      }

      const intervalId = window.setInterval(() => {
        if (actionName === 'softDrop') {
          triggerSoftDrop(action);
          return;
        }

        action();
      }, getRepeatInterval(actionName));

      const timer = repeatTimers.get(code);
      if (timer) {
        timer.intervalId = intervalId;
      }
    }, getInitialRepeatDelay(code, actionName));

    repeatTimers.set(code, {
      timeoutId,
      intervalId: null
    });
  }

  function handleKeyDown(event) {
    const actionName = codeToAction[event.code];
    const action = actionHandlers[actionName];

    if (actionName === 'moveLeft' || actionName === 'moveRight' || actionName === 'softDrop') {
      event.preventDefault();

      if (actionName === 'moveLeft') {
        clearRepeat(effectiveKeybinds.moveRight);
      }

      if (actionName === 'moveRight') {
        clearRepeat(effectiveKeybinds.moveLeft);
      }

      startRepeat(event.code, actionName, action);
      return;
    }

    if (!actionName) return;
    if (oneShotPressed.has(event.code)) return;
    oneShotPressed.add(event.code);

    if (actionName === 'rotate') {
      event.preventDefault();
      onRotate?.();
    }

    if (actionName === 'hold') {
      event.preventDefault();
      onHold?.();
    }

    if (actionName === 'hardDrop') {
      event.preventDefault();
      onHardDrop?.();
    }

    if (actionName === 'restart') {
      event.preventDefault();
      onRestart?.();
    }
  }

  function handleKeyUp(event) {
    clearRepeat(event.code);
    oneShotPressed.delete(event.code);

    if (event.code === activeHorizontalCode) {
      activeHorizontalCode = null;
    }
  }

  function handleBlur() {
    for (const code of repeatTimers.keys()) {
      clearRepeat(code);
    }

    activeHorizontalCode = null;
    oneShotPressed.clear();
  }

  function getInitialRepeatDelay(code, actionName) {
    if (actionName === 'softDrop') {
      return 0;
    }

    if (actionName === 'moveLeft' || actionName === 'moveRight') {
      const switchedDirection = activeHorizontalCode && activeHorizontalCode !== code;
      activeHorizontalCode = code;
      return switchedDirection ? effectiveHandling.dcd : effectiveHandling.das;
    }

    return effectiveHandling.das;
  }

  function getRepeatInterval(actionName) {
    if (actionName === 'softDrop') {
      return 50;
    }

    return Math.max(16, effectiveHandling.arr);
  }

  function triggerSoftDrop(action) {
    if (!action) return;

    if (effectiveHandling.sdf >= 41) {
      while (action()) {
        // Infinite SDF keeps stepping until grounded.
      }
      return;
    }

    for (let step = 0; step < effectiveHandling.sdf; step += 1) {
      if (!action()) {
        break;
      }
    }
  }

  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
  window.addEventListener('blur', handleBlur);

  return function cleanup() {
    handleBlur();
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
    window.removeEventListener('blur', handleBlur);
  };
}

export function attachKeyboardControls(target, handlers) {
  const listener = (event) => {
    handlers?.[event.code]?.(event);
  };

  target.addEventListener('keydown', listener);

  return () => target.removeEventListener('keydown', listener);
}
