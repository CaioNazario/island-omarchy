#version 440
// Do omadock (MIT, Copyright (c) 2026 thepathless), shaders/gradient.frag
// @ 16492e5; licença em plugin/NOTICE. Na Island pinta a SoftSurface
// (specs/19-aparencia.md); "dock card" abaixo é a pílula ou a ilha.
//
// Gradient fill for the dock card, built like the gradients of Zen / Arc
// browser themes: layers of colour that fade to transparent, stacked over the
// dock's base background so the colours melt into each other.
//
//   2 colours: two opposite linear gradients (-30 and 150 degrees), each
//              solid to 30 % of its line and gone by 120 %.
//   3 colours: a -5 degree linear gradient (c3, 10 % -> 80 %) over two
//              radial glows in the top corners: c2 at the top right
//              (0 % -> 75 %) and c1 at the top left (10 % -> 70 %).
//
// Geometry follows CSS: linear gradients run along a line through the
// centre whose length makes the corners land on 0 % and 100 %; radial ones
// are circles reaching the farthest corner. The card's rounded rectangle is
// cut out with a signed distance.
//
// Rebuild after editing: scripts/shaders-in-sync.sh --write

layout(location = 0) in vec2 qt_TexCoord0;
layout(location = 0) out vec4 fragColor;

layout(std140, binding = 0) uniform buf {
    mat4 qt_Matrix;
    float qt_Opacity;
    vec4 base;        // background under the colours; alpha = dock opacity
    vec4 c1;
    vec4 c2;
    vec4 c3;
    float count;      // 2 or 3
    float strength;   // 0..1, how strongly the colours cover the base
    float radius;     // card corner radius, logical px
    vec2 size;        // card size, logical px
};

float roundedBox(vec2 p, vec2 halfSize, float r) {
    vec2 q = abs(p) - halfSize + vec2(r);
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

// Coverage of a colour stop that is solid up to s0 and transparent at s1.
float ramp(float t, float s0, float s1) {
    return clamp((s1 - t) / (s1 - s0), 0.0, 1.0);
}

// Position (0..1) along a CSS linear gradient at angle deg.
float linearT(vec2 p, float deg) {
    float a = radians(deg);
    vec2 dir = vec2(sin(a), -cos(a));
    float len = abs(size.x * sin(a)) + abs(size.y * cos(a));
    return dot(p - size * 0.5, dir) / len + 0.5;
}

// Position (0..1) in a CSS circle centred at c (fractions of the size),
// sized to reach the farthest corner.
float radialT(vec2 p, vec2 c) {
    vec2 centre = c * size;
    float r = max(max(length(centre), length(centre - vec2(size.x, 0.0))),
                  max(length(centre - vec2(0.0, size.y)), length(centre - size)));
    return length(p - centre) / r;
}

vec3 over(vec3 under, vec4 layer, float cover) {
    return mix(under, layer.rgb, clamp(cover * layer.a * strength, 0.0, 1.0));
}

void main() {
    vec2 p = qt_TexCoord0 * size;
    float d = roundedBox(p - size * 0.5, size * 0.5, min(radius, min(size.x, size.y) * 0.5));
    float inside = clamp(0.5 - d, 0.0, 1.0);

    vec3 col = base.rgb;
    if (count < 2.5) {
        col = over(col, c2, ramp(linearT(p, -30.0), 0.3, 1.2));
        col = over(col, c1, ramp(linearT(p, 150.0), 0.3, 1.2));
    } else {
        col = over(col, c1, ramp(radialT(p, vec2(0.0, 0.0)), 0.1, 0.7));
        col = over(col, c2, ramp(radialT(p, vec2(0.95, 0.0)), 0.0, 0.75));
        col = over(col, c3, ramp(linearT(p, -5.0), 0.1, 0.8));
    }

    float a = base.a * inside * qt_Opacity;
    fragColor = vec4(col * a, a);
}
