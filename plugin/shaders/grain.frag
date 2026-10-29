#version 440
// Do omadock (MIT, Copyright (c) 2026 thepathless), shaders/grain.frag
// @ 16492e5; licença em plugin/NOTICE. Na Island pinta a SoftSurface
// (specs/19-aparencia.md); "dock card" abaixo é a pílula ou a ilha.
//
// Film grain over the dock card, modelled on the grain of Zen / Arc
// browser themes: a static field of random grey specks, each with its own
// grey level (near black to near white) and its own faint opacity (up to
// about a quarter), one speck per logical pixel. Values are interpolated
// between neighbouring specks, the way a browser scales a 1x grain texture
// up on a HiDPI display, which keeps the grain soft rather than sharp. The
// card's rounded rectangle is cut out with a signed distance.
//
// Rebuild after editing: scripts/shaders-in-sync.sh --write

layout(location = 0) in vec2 qt_TexCoord0;
layout(location = 0) out vec4 fragColor;

layout(std140, binding = 0) uniform buf {
    mat4 qt_Matrix;
    float qt_Opacity;
    float strength;   // 0..1, scales the specks' opacity
    float radius;     // card corner radius, logical px
    vec2 size;        // card size, logical px
};

float hash(vec2 p, float salt) {
    p = fract(p * vec2(123.34, 456.21) + salt);
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

// Bilinear value noise on the logical-pixel lattice.
float field(vec2 p, float salt) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash(i, salt);
    float b = hash(i + vec2(1.0, 0.0), salt);
    float c = hash(i + vec2(0.0, 1.0), salt);
    float d = hash(i + vec2(1.0, 1.0), salt);
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float roundedBox(vec2 p, vec2 halfSize, float r) {
    vec2 q = abs(p) - halfSize + vec2(r);
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

void main() {
    vec2 p = qt_TexCoord0 * size;
    float d = roundedBox(p - size * 0.5, size * 0.5, min(radius, min(size.x, size.y) * 0.5));
    float inside = clamp(0.5 - d, 0.0, 1.0);

    // Sample at pixel centres so the lattice lines up with logical pixels.
    vec2 q = p - 0.5;
    float grey = field(q, 0.0);
    float alpha = field(q, 17.0) * 0.27 * strength * inside * qt_Opacity;
    fragColor = vec4(vec3(grey) * alpha, alpha);
}
