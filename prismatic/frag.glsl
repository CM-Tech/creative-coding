#ifdef GL_ES
precision highp float;
#endif

uniform float down;
uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;
uniform sampler2D backbuffer;
vec4 white = vec4(1., 1., 1., 1.);
vec4 blue = vec4(0., 0., 1., 1.);
vec4 green = vec4(0., 1., 0., 1.);
vec4 cyan = vec4(0., 1., 1., 1.);
vec4 red = vec4(1., 0., 0., 1.);
vec4 purple = vec4(1., 0., 1., 1.);
vec4 yellow = vec4(1., 1., 0., 1.);

#define TIMESTEP 0.0075

float mod289(float x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}
vec4 mod289(vec4 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}
vec4 perm(vec4 x) {
    return mod289(((x * 34.0) + 1.0) * x);
}

float noise(vec3 p) {
    vec3 a = floor(p);
    vec3 d = p - a;
    d = d * d * (3.0 - 2.0 * d);

    vec4 b = a.xxyy + vec4(0.0, 1.0, 0.0, 1.0);
    vec4 k1 = perm(b.xyxy);
    vec4 k2 = perm(k1.xyxy + b.zzww);

    vec4 c = k2 + a.zzzz;
    vec4 k3 = perm(c);
    vec4 k4 = perm(c + 1.0);

    vec4 o1 = fract(k3 * (1.0 / 41.0));
    vec4 o2 = fract(k4 * (1.0 / 41.0));

    vec4 o3 = o2 * d.z + o1 * (1.0 - d.z);
    vec2 o4 = o3.yw * d.x + o3.xz * (1.0 - d.x);

    return o4.y * d.y + o4.x * (1.0 - d.y);
}

#define T(d) n += texture2D(backbuffer, vUv+d).xyz;

void main() {
    vec2 position = (gl_FragCoord.xy / resolution.xy);
    vec2 pixel = 1. / resolution;

    vec2 vUv = gl_FragCoord.xy / resolution.xy;
    vec4 t = vec4(1. / resolution.xy, -1. / resolution.y, 0.0);
    vec3 p = texture2D(backbuffer, vUv).xyz;
    vec3 n = vec3(0);

    // shorthand for summing the values over all 8 neighbors
    T(t.wy);
    T(t.xy);
    T(t.xw);
    T(t.xz);
    T(t.wz);
    T(-t.xy);
    T(-t.xw);
    T(-t.xz);

    // this line encodes the rules
    vec3 result = p + TIMESTEP * vec3(n.z - n.y, n.x - n.z, n.y - n.x);
    float s = 256.0;
    // initialize with noise
    if(p.xyz == vec3(0.0)) {

        if(!(length((position - vec2(0.5)) * resolution.xy) > 50.0)) {
            gl_FragColor = vec4(vec3(noise(vec3(gl_FragCoord.xy / resolution.y * s, 1.0)), noise(vec3(gl_FragCoord.xy / resolution.y * s, 5.0)), noise(vec3(gl_FragCoord.xy / resolution.y * s, 2.5))), 1.0);

        } else {
            gl_FragColor = white;
        }
    } else {
        gl_FragColor = vec4(clamp(result, 0.0, 1.0), 1.0);
    }
    if(length((position - mouse) * resolution.xy) < 50.0 && down == 1.0) {
        float rnd1 = mod(fract(sin(dot(position + time * 0.001, vec2(14.9898, 78.233))) * 43758.5453), 1.0);
        if(down == 1.0) {
            if(rnd1 < 0.1666) {
                gl_FragColor = red;
            } else if(rnd1 < 0.3333) {
                gl_FragColor = yellow;
            } else if(rnd1 < 0.5) {
                gl_FragColor = green;
            } else if(rnd1 < 0.6666) {
                gl_FragColor = cyan;
            } else if(rnd1 < 0.8333) {
                gl_FragColor = blue;
            } else if(rnd1 < 0.999) {
                gl_FragColor = purple;
            } else {
                gl_FragColor = vec4(0., 0., 0., 1.);
            }
        } else {
            gl_FragColor = white;
        }
    }

}