precision mediump float;

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

float hash(float n) {
    return fract(sin(n) * 4537.3432);
}

float noise(vec2 x) {
    vec2 p = floor(x);
    vec2 f = fract(x);

    f = f * f * (3.0 * f - 2.0);

    float n = p.x + p.y * 57.0;

    return mix(mix(hash(n), hash(n + 1.0), f.x), mix(hash(n + 57.0), hash(n + 58.0), f.x), f.y);
}

float fbm(vec2 p) {
    float f = 0.0;

    f += 0.5000 * noise(p);
    p *= 2.01;
    f += 0.2500 * noise(p);
    p *= 2.03;
    f += 0.1250 * noise(p);
    p *= 2.02;
    f += 0.0625 * noise(p);

    return f / 0.9375;
}
vec3 eyeball(vec2 p, float shift) {
    float itime = time + shift;
    vec2 op = p;
    float or = length(p);

    for(float i = 0.; i < 6.; i++) {
        p.x -= sin(itime * i * 5.) * .01;
        p.y -= cos(itime * (i * 2.) * 5.) * .01;
    }

    vec2 le2maymay = vec2(cos(itime * 17.), sin(itime * 18.)) * .1;
    float r = length(p * ((sin(itime * 2.) / 2.) + 1.5));
    float r2 = length((p + le2maymay) * ((sin(itime * 2.) / 2.) + 1.5));
    float a = atan(p.y, p.x);
    float a2 = atan(p.y + le2maymay.x, p.x + le2maymay.y);

    float f = pow(smoothstep(1. - r, 3. - r, fbm(vec2(r, 11. * a))), 4.);
    vec3 bg = mix(vec3(1.), vec3(1. - pow(f * .8, 2.), 0, 0), pow(f, (sin(itime * .7) / 2.) + 1.));

    f = smoothstep(0.9, 2.1, or);
    bg *= 1.0 - f;

    vec3 col = bg;

    if(r < 0.9) {
        col = vec3(.1, .3, .4);

        f = smoothstep(0.0, 1.0, fbm(2. * p));
        col = mix(col, vec3(.1, .5, .3), 0.6 * f);

        f = smoothstep(0.0, .1, mod(a2 + itime, .07) * r2);
        col *= 1.0 - f;

        f = smoothstep(0.2, .2 + abs(cos(itime * 30.)) * .1, r2);
        col *= f;

        f = smoothstep(0.6, .8, r2);
        col *= mix(col, vec3(1), 1.0 - 0.9 * f);

        f = smoothstep(.75, .8, r2);
        col = mix(col, bg, f);

        f = smoothstep(.0, .4, length((0.4 * op - p) + vec2(.25)));
        col = mix(col, vec3(1), 1.0 - f);
    }
    return vec3(pow(col, vec3(1.4, 2.5, 4.)));
}
void main() {
    vec2 p = -1.0 + 2.0 * (gl_FragCoord.xy / resolution.xy);
    p.x *= resolution.x / resolution.y;
    p *= 2.;
    vec2 c = floor(p);
    vec3 d = vec3(0.);
    const float loops = 3.;
    for(float i = 0.; i < loops; i++) {
        d += pow(eyeball((fract(p) - .5) * 2., (i * .04) + hash(c.x) + hash(c.y + 4.252)), vec3(3. + sin(p.x + time)));
    }
    d /= loops;
    gl_FragColor = vec4(d, 1.0);
}
