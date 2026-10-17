import QtQuick
import Quickshell

// Eventos do calendário (specs/06-calendario.md "Eventos"). O Omarchy não traz
// fonte de eventos (sem Evolution Data Server nem khal): até o spike S8 da
// spec 14 decidir uma, a lista é vazia e a UI mostra só o título.
Scope {
  /** `CalendarEvent[]` do src/core/calendar.ts. */
  readonly property var events: []
}
