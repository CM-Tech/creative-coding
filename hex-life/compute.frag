//copied from http://glslsandbox.com/e#21245.3
precision highp float;
uniform float time;
uniform float fTick;
uniform float lastFTick;
uniform float msize;
uniform float white;
uniform float hexR;
uniform vec2 mouse;
uniform vec2 resolution;
uniform sampler2D backbuffer;
const float primaryNodeW = 1.;
const float secondaryNodeW = .33;
const float lKeepAlive = 1.9;
const float uKeepAlive = 3.3;
const float lBirth = 2.1;
const float hBirth = 3.2;

#define PI 3.14159265359
#define TAU 6.28318530718
#define deg60 1.0471975512
#define deg30 0.52359877559
vec2 nearestHex(vec2 st) {
    float h = sin(deg30) * hexR;
    float r = cos(deg30) * hexR;
    float b = hexR + 2. * h;
    float a = 2. * r;
    float m = h / r;
    vec2 sect = st / vec2(2. * r, h + hexR);
    vec2 sectPxl = mod(st, vec2(2. * r, h + hexR));
    float aSection = mod(floor(sect.y), 2.);
    vec2 coord = floor(sect);
    if (aSection > .0) {
        if (sectPxl.y < (h - sectPxl.x * m)) {
            coord -= 1.;
        } else if (sectPxl.y < (-h + sectPxl.x * m)) {
            coord.y -= 1.;
        }
    } else {
        if (sectPxl.x > r) {
            if (sectPxl.y < (2. * h - sectPxl.x * m)) {
                coord.y -= 1.;
            }
        } else {
            if (sectPxl.y < (sectPxl.x * m)) {
                coord.y -= 1.;
            } else {
                coord.x -= 1.;
            }
        }
    }
    float xoff = mod(coord.y, 2.) * r;
    return vec2(coord.x * 2. * r - xoff, coord.y * (h + hexR)) + vec2(r * 2., hexR);
}
float maxNorm(vec3 x) {
    return max(x.x, max(x.y, x.z));
}
vec2 neighbourHex(vec2 x, float d, int i) {
    return nearestHex(x - 2. * d * vec2(cos(float(i) * deg60), sin(float(i) * deg60)));
}
void main(void) {
    vec3 col = vec3(0.);
    vec2 hexCoord = nearestHex(gl_FragCoord.xy);
    float p = 0.;
    for (int i = 0; i < 6; i++) {
        vec2 n1 = neighbourHex(hexCoord, hexR, i);
        vec3 nc1 = texture2D(backbuffer, n1 / resolution.xy).rgb;
        if (nc1.b != white) {
            p += primaryNodeW;
            col += primaryNodeW * nc1;
        }
        vec2 n2 = neighbourHex(n1, hexR, i + 1);
        vec3 nc2 = texture2D(backbuffer, n2 / resolution.xy).rgb;
        if (nc2.b != white) {
            p += secondaryNodeW;
            col += secondaryNodeW * nc2;
        }
    }
    vec3 selfcol = texture2D(backbuffer, hexCoord / resolution.xy).rgb;
    if(selfcol.b != white && (lKeepAlive <= p) && (p <= uKeepAlive)) col = selfcol;
    else if((lBirth <= p) && (p <= hBirth)) col = col;
    else col = vec3(white);
    vec2 position = hexCoord / resolution.xy;
    if (distance(resolution.xy * mouse, hexCoord) <= msize) col = vec3(0.5+0.5*sin(0.01*hexCoord.x+0.2*time),0.5+0.5*sin(0.01*hexCoord.y+0.3*time),0.5); //vec3(-(white-1.));
    col /= maxNorm(col);
     
    if((length(gl_FragCoord.xy-hexCoord)-2.0)/hexR>max(0.0,min(mod(fTick,1.0),1.0-mod(fTick,1.0)))){
       // col = vec3(white);
    }else{
        if(floor(fTick)==floor(lastFTick)){
        col = selfcol;
    }
    }
    
    gl_FragColor = vec4(col, 1.);
}