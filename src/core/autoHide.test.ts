import { describe, expect, it } from 'vitest';
import { AutoHide, type BarActivity } from './autoHide.js';

const idle: BarActivity = { islandOpen: false, editing: false, overview: false };

function enabledAndLeft(): AutoHide {
  const autoHide = new AutoHide();
  autoHide.setEnabled(true);
  autoHide.pointerLeft();
  return autoHide;
}

describe('AutoHide', () => {
  it('always shows the bar while disabled', () => {
    const autoHide = new AutoHide();
    expect(autoHide.shown(idle)).toBe(true);
    autoHide.pointerLeft();
    expect(autoHide.shown(idle)).toBe(true);
  });

  it('keeps the bar shown after enabling until the pointer leaves', () => {
    const autoHide = new AutoHide();
    autoHide.setEnabled(true);
    expect(autoHide.shown(idle)).toBe(true);
    expect(autoHide.revealed).toBe(true);
    autoHide.pointerLeft();
    expect(autoHide.shown(idle)).toBe(false);
  });

  it('shows the bar on reveal until the pointer leaves', () => {
    const autoHide = enabledAndLeft();
    autoHide.reveal();
    expect(autoHide.shown(idle)).toBe(true);
    autoHide.pointerLeft();
    expect(autoHide.shown(idle)).toBe(false);
  });

  it.each([
    ['an open island', { ...idle, islandOpen: true }],
    ['the editor', { ...idle, editing: true }],
    ['the overview', { ...idle, overview: true }],
  ] as const)('shows the hidden bar with %s', (_name, activity) => {
    expect(enabledAndLeft().shown(activity)).toBe(true);
  });

  it('hides again when the island closes after the pointer left', () => {
    const autoHide = enabledAndLeft();
    autoHide.reveal();
    autoHide.pointerLeft();
    expect(autoHide.shown({ ...idle, islandOpen: true })).toBe(true);
    expect(autoHide.shown(idle)).toBe(false);
  });

  it('ignores reveals while disabled', () => {
    const autoHide = new AutoHide();
    autoHide.reveal();
    expect(autoHide.revealed).toBe(false);
    autoHide.setEnabled(true);
    autoHide.pointerLeft();
    autoHide.setEnabled(false);
    autoHide.reveal();
    expect(autoHide.revealed).toBe(false);
  });

  it('re-enabling reveals again', () => {
    const autoHide = enabledAndLeft();
    autoHide.setEnabled(false);
    autoHide.setEnabled(true);
    expect(autoHide.shown(idle)).toBe(true);
  });
});
