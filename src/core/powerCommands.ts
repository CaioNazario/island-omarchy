// Comandos da linha de energia (specs/09-sessao-energia.md), os mesmos do menu de
// sistema do Omarchy (`default/omarchy/omarchy-menu.jsonc`, entradas `system.*`).

/**
 * Reiniciar, desligar e sair vão por `omarchy-system <ação>`: o Omarchy 4.5 não tem
 * mais `omarchy-system-reboot|shutdown|logout` e o `execDetached` de um programa
 * ausente falha em silêncio, o que deixava os botões mortos (issue #40).
 */
const COMMANDS: Readonly<Record<string, readonly string[]>> = {
  suspend: ['systemctl', 'suspend'],
  reboot: ['omarchy-system', 'reboot'],
  shutdown: ['omarchy-system', 'shutdown'],
  logout: ['omarchy-system', 'logout'],
  lock: ['omarchy-system-lock'],
};

export const POWER_ACTIONS: readonly string[] = Object.keys(COMMANDS);

export function powerCommand(action: string): string[] {
  const command = COMMANDS[action];
  if (!command) {
    throw new Error(
      `unknown power action '${action}', expected one of ${POWER_ACTIONS.join(', ')}`,
    );
  }
  return [...command];
}
