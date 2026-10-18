pragma ComponentBehavior: Bound

import QtQuick

// Divisor do design: 1px, transparente → `neutral-800` (15%–85%) → transparente.
Rectangle {
  implicitHeight: 1
  gradient: Gradient {
    orientation: Gradient.Horizontal
    GradientStop {
      position: 0
      color: Tokens.dividerFadeEnd
    }
    GradientStop {
      position: 0.15
      color: Tokens.neutral800
    }
    GradientStop {
      position: 0.85
      color: Tokens.neutral800
    }
    GradientStop {
      position: 1
      color: Tokens.dividerFadeEnd
    }
  }
}
