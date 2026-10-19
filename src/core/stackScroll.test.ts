import { describe, expect, it } from 'vitest';
import { STACK_SCROLL_THRESHOLD, StackScroll, type StackScrollInput } from './stackScroll.js';

const down = (dy = -120): StackScrollInput => ({ kind: 'discrete', dy });
const up = (dy = 120): StackScrollInput => ({ kind: 'discrete', dy });
const finger = (dy: number, dx = 0): StackScrollInput => ({
  kind: 'smooth',
  dx,
  dy,
  finished: false,
});
const lift: StackScrollInput = { kind: 'smooth', dx: 0, dy: 0, finished: true };
const compact = { mode: 'compact', atTop: true };
const stack = { mode: 'stack', atTop: true };

describe('StackScroll · roda do mouse', () => {
  it('para baixo na ilha compacta (ou com notificação) abre o stack', () => {
    expect(new StackScroll().handle(down(), compact)).toEqual({ handled: true, action: 'open' });
    expect(new StackScroll().handle(down(), { mode: 'notif', atTop: true })).toEqual({
      handled: true,
      action: 'open',
    });
  });

  it('para cima no stack, com a lista no topo, fecha', () => {
    expect(new StackScroll().handle(up(), stack)).toEqual({ handled: true, action: 'close' });
  });

  it('o sentido oposto ao do modo não é nosso: a lista ou outro handler rola', () => {
    expect(new StackScroll().handle(up(), compact)).toEqual({ handled: false });
    expect(new StackScroll().handle(down(), stack)).toEqual({ handled: false });
  });

  it('outros modos (música, volume, calendário…) ficam intactos', () => {
    for (const mode of ['music', 'quick', 'calendar', 'volume', 'wifi']) {
      expect(new StackScroll().handle(down(), { mode, atTop: true })).toEqual({ handled: false });
      expect(new StackScroll().handle(up(), { mode, atTop: true })).toEqual({ handled: false });
    }
  });

  it('um giro rápido de roda age uma vez só, até a pausa (reset)', () => {
    const scroll = new StackScroll();
    expect(scroll.handle(down(), compact).action).toBe('open');
    expect(scroll.handle(down(), compact)).toEqual({ handled: true });
    scroll.reset();
    expect(scroll.handle(down(), compact).action).toBe('open');
  });

  it('roda horizontal pura (dy 0) não é nossa', () => {
    expect(new StackScroll().handle({ kind: 'discrete', dy: 0 }, compact)).toEqual({
      handled: false,
    });
  });
});

describe('StackScroll · lista de notificações', () => {
  it('rolar a lista para cima, ainda longe do topo, não fecha', () => {
    const scroll = new StackScroll();
    expect(scroll.handle(up(), { mode: 'stack', atTop: false })).toEqual({ handled: false });
  });

  it('chegar ao topo no meio do mesmo giro não fecha; uma pausa e o próximo giro fecha', () => {
    const scroll = new StackScroll();
    scroll.handle(up(), { mode: 'stack', atTop: false });
    expect(scroll.handle(up(), stack)).toEqual({ handled: true });
    scroll.reset();
    expect(scroll.handle(up(), stack)).toEqual({ handled: true, action: 'close' });
  });
});

describe('StackScroll · touchpad', () => {
  it('soma os deltas até o limiar e age uma vez', () => {
    const scroll = new StackScroll();
    const step = -(STACK_SCROLL_THRESHOLD / 3 + 1);
    expect(scroll.handle(finger(step), compact)).toEqual({ handled: true });
    expect(scroll.handle(finger(step), compact)).toEqual({ handled: true });
    expect(scroll.handle(finger(step), compact)).toEqual({ handled: true, action: 'open' });
    expect(scroll.handle(finger(step * 5), compact)).toEqual({ handled: true });
  });

  it('levantar os dedos libera o próximo gesto', () => {
    const scroll = new StackScroll();
    expect(scroll.handle(finger(-STACK_SCROLL_THRESHOLD - 1), compact).action).toBe('open');
    expect(scroll.handle(lift, compact)).toEqual({ handled: false });
    expect(scroll.handle(finger(-STACK_SCROLL_THRESHOLD - 1), compact).action).toBe('open');
  });

  it('gesto horizontal (troca de ambiente) não abre nada, mesmo com um pouco de vertical', () => {
    const scroll = new StackScroll();
    for (let i = 0; i < 20; i++) {
      expect(scroll.handle(finger(-5, 12), compact)).toEqual({ handled: false });
    }
    expect(scroll.handle(finger(-1), compact)).toEqual({ handled: true });
  });

  it('inverter o sentido no meio zera a soma', () => {
    const scroll = new StackScroll();
    scroll.handle(finger(-30), compact);
    expect(scroll.handle(finger(20), compact)).toEqual({ handled: false });
    expect(scroll.handle(finger(-30), compact)).toEqual({ handled: true });
  });

  it('para cima no stack só fecha com a lista no topo; fora dele a lista é do usuário', () => {
    const scroll = new StackScroll();
    expect(
      scroll.handle(finger(STACK_SCROLL_THRESHOLD + 1), { mode: 'stack', atTop: false }),
    ).toEqual({
      handled: false,
    });
    // ainda no mesmo gesto, já no topo: não fecha
    expect(scroll.handle(finger(STACK_SCROLL_THRESHOLD + 1), stack)).toEqual({ handled: true });
    scroll.handle(lift, stack);
    expect(scroll.handle(finger(STACK_SCROLL_THRESHOLD + 1), stack).action).toBe('close');
  });
});
