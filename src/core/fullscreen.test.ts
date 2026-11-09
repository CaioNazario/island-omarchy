import { describe, expect, it } from 'vitest';
import {
  fullscreenMonitors,
  type FullscreenMonitor,
  type FullscreenToplevel,
} from './fullscreen.js';

function monitor(name: string, workspaceId: number | null): FullscreenMonitor {
  return { name, activeWorkspace: workspaceId === null ? null : { id: workspaceId } };
}

function toplevel(workspaceId: number, fullscreen: number | undefined): FullscreenToplevel {
  return {
    workspace: { id: workspaceId },
    lastIpcObject: fullscreen === undefined ? {} : { fullscreen },
  };
}

describe('fullscreenMonitors', () => {
  it('lists the monitor whose active workspace holds a real fullscreen window', () => {
    const monitors = [monitor('eDP-1', 1), monitor('HDMI-A-1', 2)];
    expect(fullscreenMonitors(monitors, [toplevel(2, 2)])).toEqual(['HDMI-A-1']);
  });

  it('ignores a maximized window (fullscreen 1)', () => {
    expect(fullscreenMonitors([monitor('eDP-1', 1)], [toplevel(1, 1)])).toEqual([]);
  });

  it('counts fullscreen modes with bit 2 set', () => {
    expect(fullscreenMonitors([monitor('eDP-1', 1)], [toplevel(1, 3)])).toEqual(['eDP-1']);
  });

  it('ignores a fullscreen window on a workspace that is not active', () => {
    expect(fullscreenMonitors([monitor('eDP-1', 1)], [toplevel(5, 2)])).toEqual([]);
  });

  it('tolerates toplevels without workspace or ipc object and monitors without workspace', () => {
    const toplevels: FullscreenToplevel[] = [
      { workspace: null, lastIpcObject: { fullscreen: 2 } },
      { workspace: { id: 1 }, lastIpcObject: null },
    ];
    expect(fullscreenMonitors([monitor('eDP-1', null), monitor('DP-1', 1)], toplevels)).toEqual([]);
  });

  it('reads list-like values that are not arrays (Quickshell object lists)', () => {
    const monitors = { length: 1, 0: monitor('eDP-1', 1) };
    const toplevels = { length: 1, 0: toplevel(1, 2) };
    expect(fullscreenMonitors(monitors, toplevels)).toEqual(['eDP-1']);
  });

  it('returns nothing without lists', () => {
    expect(fullscreenMonitors(null, undefined)).toEqual([]);
  });
});
