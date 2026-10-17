import { describe, expect, it } from 'vitest';
import {
  getSize,
  isFixedMode,
  IslandState,
  MAX_ISLAND_WIDTH,
  type Mode,
  type Scheduler,
} from './island.js';

class FakeScheduler implements Scheduler {
  private nextId = 1;
  private timers = new Map<number, { remaining: number; callback: () => void }>();

  setTimeout(callback: () => void, ms: number): number {
    const id = this.nextId++;
    this.timers.set(id, { remaining: ms, callback });
    return id;
  }

  clearTimeout(id: number): void {
    this.timers.delete(id);
  }

  advance(ms: number): void {
    for (const [id, timer] of [...this.timers]) {
      timer.remaining -= ms;
      if (timer.remaining <= 0) {
        this.timers.delete(id);
        timer.callback();
      }
    }
  }

  get pendingCount(): number {
    return this.timers.size;
  }
}

describe('IslandState', () => {
  it('regra 1: gatilho do usuário substitui qualquer modo e fecha o cartão', () => {
    const state = new IslandState(new FakeScheduler());
    state.islandClick(); // abre o cartão a partir de compact
    expect(state.cardOpen).toBe(true);

    state.openFromTrigger('wifi');
    expect(state.mode).toBe('wifi');
    expect(state.cardOpen).toBe(false);

    state.openFromTrigger('bt');
    expect(state.mode).toBe('bt');
  });

  it('regra 2: clicar no gatilho do modo já aberto fecha a ilha', () => {
    const state = new IslandState(new FakeScheduler());
    state.openFromTrigger('quick');
    expect(state.mode).toBe('quick');

    state.openFromTrigger('quick');
    expect(state.mode).toBe('compact');
  });

  it('regra 3: evento automático não substitui modo fixo', () => {
    const state = new IslandState(new FakeScheduler());
    state.openFromTrigger('wifi');

    const opened = state.openAutomatic('music');
    expect(opened).toBe(false);
    expect(state.mode).toBe('wifi');
  });

  it('regra 3: evento automático não substitui o cartão central aberto', () => {
    const state = new IslandState(new FakeScheduler());
    state.islandClick();
    expect(state.cardOpen).toBe(true);

    const opened = state.openAutomatic('notif');
    expect(opened).toBe(false);
    expect(state.cardOpen).toBe(true);
    expect(state.mode).toBe('compact');
  });

  it('regra 3: evento automático abre a partir de compact ou modo transitório', () => {
    const state = new IslandState(new FakeScheduler());
    expect(state.openAutomatic('notif')).toBe(true);
    expect(state.mode).toBe('notif');

    expect(state.openAutomatic('music')).toBe(true);
    expect(state.mode).toBe('music');
  });

  it('regra 4: tecla de volume abre a partir de compact, mas não com modo fixo aberto', () => {
    const state = new IslandState(new FakeScheduler());
    state.volumeKey();
    expect(state.mode).toBe('volume');

    state.openFromTrigger('quick');
    state.volumeKey();
    expect(state.mode).toBe('quick');
  });

  it('regra 5: clique na ilha compacta abre o cartão por padrão', () => {
    const state = new IslandState(new FakeScheduler());
    expect(state.islandClick()).toBe('toggled-card');
    expect(state.cardOpen).toBe(true);
    expect(state.islandClick()).toBe('toggled-card');
    expect(state.cardOpen).toBe(false);
  });

  it('regra 5: clique na ilha compacta abre o calendário quando configurado', () => {
    const state = new IslandState(new FakeScheduler(), { islandClickOpens: () => 'calendar' });
    expect(state.islandClick()).toBe('opened-calendar');
    expect(state.mode).toBe('calendar');
  });

  it('regra 5: mudar a opção vale no próximo clique, sem recriar o estado', () => {
    let opens: 'card' | 'calendar' = 'card';
    const state = new IslandState(new FakeScheduler(), { islandClickOpens: () => opens });
    expect(state.islandClick()).toBe('toggled-card');
    state.closeAll();
    opens = 'calendar';
    expect(state.islandClick()).toBe('opened-calendar');
  });

  it('regra 5: clique em notif abre stack', () => {
    const state = new IslandState(new FakeScheduler());
    state.openAutomatic('notif');
    expect(state.islandClick()).toBe('opened-stack');
    expect(state.mode).toBe('stack');
  });

  it('regra 6: timer transitório volta a compact só se o modo não mudou', () => {
    const scheduler = new FakeScheduler();
    const state = new IslandState(scheduler);
    state.openAutomatic('notif');
    scheduler.advance(2500);
    expect(state.mode).toBe('compact');
  });

  it('regra 6: timer expirado não fecha um modo diferente do armado', () => {
    const scheduler = new FakeScheduler();
    const state = new IslandState(scheduler);
    state.openAutomatic('notif');
    state.openFromTrigger('wifi');
    scheduler.advance(2500);
    expect(state.mode).toBe('wifi');
  });

  it('regra 7: hover cancela o timer; sair do hover rearma do zero', () => {
    const scheduler = new FakeScheduler();
    const state = new IslandState(scheduler);
    state.openAutomatic('notif');

    scheduler.advance(2000);
    state.hoverStart();
    expect(scheduler.pendingCount).toBe(0);

    scheduler.advance(5000);
    expect(state.mode).toBe('notif');

    state.hoverEnd();
    scheduler.advance(2499);
    expect(state.mode).toBe('notif');
    scheduler.advance(1);
    expect(state.mode).toBe('compact');
  });

  it('regra 8: arrastar um slider cancela o timer e soltar rearma', () => {
    const scheduler = new FakeScheduler();
    const state = new IslandState(scheduler);
    state.openAutomatic('volume');

    scheduler.advance(1000);
    state.dragStart();
    expect(scheduler.pendingCount).toBe(0);

    scheduler.advance(5000);
    expect(state.mode).toBe('volume');

    state.dragEnd();
    scheduler.advance(1499);
    expect(state.mode).toBe('volume');
    scheduler.advance(1);
    expect(state.mode).toBe('compact');
  });

  it('regra 9: Esc com senha focada fecha só o campo, um segundo Esc fecha a ilha', () => {
    const state = new IslandState(new FakeScheduler());
    state.openFromTrigger('wifi');

    expect(state.escape(true)).toBe('closed-password');
    expect(state.mode).toBe('wifi');

    expect(state.escape(false)).toBe('closed');
    expect(state.mode).toBe('compact');
  });

  it('regra 9: Esc em compact sem cartão não faz nada', () => {
    const state = new IslandState(new FakeScheduler());
    expect(state.escape(false)).toBe('noop');
  });

  it('spec 04: notificação abre notif e fecha em 2500ms', () => {
    const scheduler = new FakeScheduler();
    const state = new IslandState(scheduler);
    state.openNotification(false);
    expect(state.mode).toBe('notif');
    scheduler.advance(2500);
    expect(state.mode).toBe('compact');
  });

  it('spec 04: nova notificação em notif rearma o timer', () => {
    const scheduler = new FakeScheduler();
    const state = new IslandState(scheduler);
    state.openNotification(false);
    scheduler.advance(2000);
    state.openNotification(false);
    scheduler.advance(2000);
    expect(state.mode).toBe('notif');
    scheduler.advance(500);
    expect(state.mode).toBe('compact');
  });

  it('spec 04: notif de notificação crítica não fecha sozinho, nem depois do hover', () => {
    const scheduler = new FakeScheduler();
    const state = new IslandState(scheduler);
    state.openNotification(true);
    scheduler.advance(60_000);
    expect(state.mode).toBe('notif');

    state.hoverStart();
    state.hoverEnd();
    scheduler.advance(60_000);
    expect(state.mode).toBe('notif');
  });

  it('spec 04: notificação comum depois de uma crítica volta a fechar sozinha', () => {
    const scheduler = new FakeScheduler();
    const state = new IslandState(scheduler);
    state.openNotification(true);
    state.openNotification(false);
    scheduler.advance(2500);
    expect(state.mode).toBe('compact');
  });

  it('spec 04: notificação de navegador fecha em 2100ms, também depois do hover', () => {
    const scheduler = new FakeScheduler();
    const state = new IslandState(scheduler);
    state.openNotification(false, true);
    scheduler.advance(2100);
    expect(state.mode).toBe('compact');

    state.openNotification(false, true);
    state.hoverStart();
    state.hoverEnd();
    scheduler.advance(2100);
    expect(state.mode).toBe('compact');
  });

  it('spec 04: nativa trocando uma de navegador volta aos 2500ms', () => {
    const scheduler = new FakeScheduler();
    const state = new IslandState(scheduler);
    state.openNotification(false, true);
    state.openNotification(false);
    scheduler.advance(2100);
    expect(state.mode).toBe('notif');
    scheduler.advance(400);
    expect(state.mode).toBe('compact');
  });

  it('onChange dispara em toda transição de mode/cardOpen, mas não em no-ops', () => {
    const scheduler = new FakeScheduler();
    let changes = 0;
    const state = new IslandState(scheduler, { onChange: () => changes++ });

    state.islandClick(); // abre cartão
    expect(changes).toBe(1);

    state.openFromTrigger('wifi'); // fecha cartão, muda modo
    expect(changes).toBe(2);

    expect(state.openAutomatic('music')).toBe(false); // bloqueado por modo fixo
    expect(changes).toBe(2);

    state.openFromTrigger('music'); // transitório
    expect(changes).toBe(3);

    scheduler.advance(2500); // timer expira, volta a compact
    expect(changes).toBe(4);

    expect(state.escape(false)).toBe('noop'); // já em compact
    expect(changes).toBe(4);
  });

  it('spec 09: Energia alterna a linha em quick, wifi e bt', () => {
    let changes = 0;
    const state = new IslandState(new FakeScheduler(), { onChange: () => changes++ });
    for (const mode of ['quick', 'wifi', 'bt'] as const) {
      state.openFromTrigger(mode);
      changes = 0;
      state.togglePower();
      expect(state.powerOpen).toBe(true);
      state.togglePower();
      expect(state.powerOpen).toBe(false);
      expect(changes).toBe(2);
    }
  });

  it('spec 09: Energia não abre fora de quick, wifi e bt', () => {
    let changes = 0;
    const state = new IslandState(new FakeScheduler(), { onChange: () => changes++ });
    state.togglePower(); // compact
    state.openFromTrigger('calendar');
    changes = 0;
    state.togglePower();
    expect(state.powerOpen).toBe(false);
    expect(changes).toBe(0);
  });

  it('spec 09: trocar de modo, Esc ou fechar a ilha fecham a linha de energia', () => {
    const state = new IslandState(new FakeScheduler());
    state.openFromTrigger('quick');
    state.togglePower();
    state.openFromTrigger('wifi');
    expect(state.powerOpen).toBe(false);

    state.togglePower();
    state.escape(false);
    expect(state.powerOpen).toBe(false);

    state.openFromTrigger('bt');
    state.togglePower();
    state.closeAll();
    expect(state.powerOpen).toBe(false);
  });
});

describe('IslandState env', () => {
  it('spec 15: troca de ambiente com a ilha compacta abre env por 1500ms', () => {
    const scheduler = new FakeScheduler();
    const state = new IslandState(scheduler);
    expect(state.environmentSwitched()).toBe(true);
    expect(state.mode).toBe('env');
    scheduler.advance(1499);
    expect(state.mode).toBe('env');
    scheduler.advance(1);
    expect(state.mode).toBe('compact');
  });

  it('spec 15: nova troca em env rearma o timer', () => {
    const scheduler = new FakeScheduler();
    const state = new IslandState(scheduler);
    state.environmentSwitched();
    scheduler.advance(1000);
    expect(state.environmentSwitched()).toBe(true);
    scheduler.advance(1000);
    expect(state.mode).toBe('env');
    scheduler.advance(500);
    expect(state.mode).toBe('compact');
  });

  it('spec 15: com outro modo ou o cartão aberto, a troca não mexe na ilha', () => {
    const scheduler = new FakeScheduler();
    const state = new IslandState(scheduler);
    state.openFromTrigger('wifi');
    expect(state.environmentSwitched()).toBe(false);
    expect(state.mode).toBe('wifi');

    state.openNotification(false);
    expect(state.environmentSwitched()).toBe(false);
    expect(state.mode).toBe('notif');

    state.closeAll();
    state.islandClick();
    expect(state.environmentSwitched()).toBe(false);
    expect(state.cardOpen).toBe(true);
  });

  it('spec 15: env não recebe hover e fecha mesmo com o ponteiro em cima', () => {
    const scheduler = new FakeScheduler();
    const state = new IslandState(scheduler);
    state.hoverStart();
    state.environmentSwitched();
    scheduler.advance(1500);
    expect(state.mode).toBe('compact');

    state.environmentSwitched();
    state.hoverEnd();
    state.hoverStart();
    scheduler.advance(1500);
    expect(state.mode).toBe('compact');
  });

  it('spec 15: clique na ilha em env não faz nada', () => {
    const state = new IslandState(new FakeScheduler());
    state.environmentSwitched();
    expect(state.islandClick()).toBe('noop');
    expect(state.mode).toBe('env');
  });
});

describe('IslandState note', () => {
  it('spec 16: note é fixo, sem timer, e o mesmo gatilho fecha', () => {
    const scheduler = new FakeScheduler();
    const state = new IslandState(scheduler);
    state.openFromTrigger('note');
    expect(state.mode).toBe('note');
    expect(scheduler.pendingCount).toBe(0);
    state.openFromTrigger('note');
    expect(state.mode).toBe('compact');
  });

  it('spec 16: evento automático não tira a ilha de note', () => {
    const state = new IslandState(new FakeScheduler());
    state.openFromTrigger('note');
    expect(state.openAutomatic('music')).toBe(false);
    state.volumeKey();
    expect(state.mode).toBe('note');
  });
});

describe('IslandState music fixado', () => {
  it('spec 05: abre sem timer, fica com hover e sem hover, e o mesmo clique fecha', () => {
    const scheduler = new FakeScheduler();
    const state = new IslandState(scheduler);
    state.toggleMusicPinned();
    expect(state.mode).toBe('music');
    expect(state.musicPinned).toBe(true);
    expect(state.fixed).toBe(true);
    expect(scheduler.pendingCount).toBe(0);
    state.hoverStart();
    state.hoverEnd();
    state.keepAlive();
    scheduler.advance(10_000);
    expect(state.mode).toBe('music');
    state.toggleMusicPinned();
    expect(state.mode).toBe('compact');
    expect(state.musicPinned).toBe(false);
  });

  it('spec 05: troca de faixa com ele aberto não reabre nem arma timer', () => {
    const scheduler = new FakeScheduler();
    const state = new IslandState(scheduler);
    state.toggleMusicPinned();
    expect(state.openAutomatic('music')).toBe(false);
    expect(state.openAutomatic('volume')).toBe(false);
    expect(state.musicPinned).toBe(true);
    expect(scheduler.pendingCount).toBe(0);
  });

  it('spec 05: clicar no widget com o music transitório aberto o fixa', () => {
    const scheduler = new FakeScheduler();
    const state = new IslandState(scheduler);
    state.openAutomatic('music');
    expect(state.fixed).toBe(false);
    state.toggleMusicPinned();
    expect(state.musicPinned).toBe(true);
    scheduler.advance(2500);
    expect(state.mode).toBe('music');
  });

  it('spec 05: outro modo depois do fixado volta ao music transitório', () => {
    const scheduler = new FakeScheduler();
    const state = new IslandState(scheduler);
    state.toggleMusicPinned();
    state.escape(false);
    state.openAutomatic('music');
    expect(state.musicPinned).toBe(false);
    scheduler.advance(2500);
    expect(state.mode).toBe('compact');
  });
});

describe('isFixedMode', () => {
  it('só stack, calendar, quick, wifi, bt, ai e note tomam foco de teclado', () => {
    expect(isFixedMode('compact')).toBe(false);
    expect(isFixedMode('notif')).toBe(false);
    expect(isFixedMode('music')).toBe(false);
    expect(isFixedMode('volume')).toBe(false);
    expect(isFixedMode('brightness')).toBe(false);
    expect(isFixedMode('env')).toBe(false);
    expect(isFixedMode('stack')).toBe(true);
    expect(isFixedMode('calendar')).toBe(true);
    expect(isFixedMode('quick')).toBe(true);
    expect(isFixedMode('wifi')).toBe(true);
    expect(isFixedMode('bt')).toBe(true);
    expect(isFixedMode('ai')).toBe(true);
    expect(isFixedMode('note')).toBe(true);
  });
});

describe('getSize', () => {
  it('nenhum modo passa de MAX_ISLAND_WIDTH', () => {
    const modes: Mode[] = [
      'compact',
      'notif',
      'stack',
      'music',
      'volume',
      'brightness',
      'calendar',
      'quick',
      'wifi',
      'bt',
      'ai',
      'env',
      'note',
    ];
    const widths = modes.map((mode) => getSize(mode).width);
    expect(Math.max(...widths)).toBe(MAX_ISLAND_WIDTH);
  });

  it('retorna as medidas estáticas da tabela', () => {
    expect(getSize('compact')).toEqual({ width: 240, height: 30, radius: 15 });
    expect(getSize('notif')).toEqual({ width: 400, height: 62, radius: 22 });
    expect(getSize('music')).toEqual({ width: 500, height: 82, radius: 26 });
    expect(getSize('volume')).toEqual({ width: 320, height: 50, radius: 25 });
    expect(getSize('brightness')).toEqual({ width: 320, height: 50, radius: 25 });
    expect(getSize('env')).toEqual({ width: 260, height: 40, radius: 20 });
  });

  it('stack: cresce por item até 6, com piso para lista vazia', () => {
    expect(getSize('stack', { stackItemCount: 0 })).toEqual({
      width: 400,
      height: 128,
      radius: 24,
    });
    expect(getSize('stack', { stackItemCount: 3 })).toEqual({
      width: 400,
      height: 212,
      radius: 24,
    });
    expect(getSize('stack', { stackItemCount: 6 })).toEqual({
      width: 400,
      height: 368,
      radius: 24,
    });
    expect(getSize('stack', { stackItemCount: 12 })).toEqual({
      width: 400,
      height: 368,
      radius: 24,
    });
  });

  it('calendar: semana ou mês', () => {
    expect(getSize('calendar', { calendarView: 'week' })).toEqual({
      width: 480,
      height: 150,
      radius: 24,
    });
    expect(getSize('calendar', { calendarView: 'month' })).toEqual({
      width: 480,
      height: 214,
      radius: 24,
    });
  });

  it('quick: com e sem linha de energia', () => {
    expect(getSize('quick')).toEqual({ width: 520, height: 58, radius: 29 });
    expect(getSize('quick', { quickEnergyOpen: true })).toEqual({
      width: 520,
      height: 106,
      radius: 29,
    });
  });

  it('wifi: base, energia e senha (com e sem erro)', () => {
    expect(getSize('wifi')).toEqual({ width: 520, height: 292, radius: 26 });
    expect(getSize('wifi', { wifiEnergyOpen: true })).toEqual({
      width: 520,
      height: 340,
      radius: 26,
    });
    expect(getSize('wifi', { wifiPasswordField: 'normal' })).toEqual({
      width: 520,
      height: 350,
      radius: 26,
    });
    expect(getSize('wifi', { wifiPasswordField: 'error' })).toEqual({
      width: 520,
      height: 368,
      radius: 26,
    });
    expect(getSize('wifi', { wifiEnergyOpen: true, wifiPasswordField: 'error' })).toEqual({
      width: 520,
      height: 416,
      radius: 26,
    });
  });

  it('bt: ligado/desligado e energia', () => {
    expect(getSize('bt')).toEqual({ width: 520, height: 348, radius: 26 });
    expect(getSize('bt', { btOn: false })).toEqual({ width: 520, height: 300, radius: 26 });
    expect(getSize('bt', { btEnergyOpen: true })).toEqual({ width: 520, height: 396, radius: 26 });
  });

  it('ai: altura cresce por provedor', () => {
    expect(getSize('ai', { providerCount: 1 })).toEqual({ width: 480, height: 158, radius: 24 });
    expect(getSize('ai', { providerCount: 2 })).toEqual({ width: 480, height: 266, radius: 24 });
  });
});
