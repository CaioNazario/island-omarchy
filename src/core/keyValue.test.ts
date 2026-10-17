import { describe, expect, it } from 'vitest';
import { parseKeyValues } from './keyValue.js';

describe('parseKeyValues', () => {
  it('lê chave<TAB>valor por linha, aparando espaços', () => {
    expect(parseKeyValues('iface\twlp2s0\nip\t10.0.0.103 \n')).toEqual({
      iface: 'wlp2s0',
      ip: '10.0.0.103',
    });
  });

  it('ignora linha sem TAB e mantém TAB dentro do valor', () => {
    expect(parseKeyValues('lixo\nssid\tCasa\t5G\n')).toEqual({ ssid: 'Casa\t5G' });
  });
});
