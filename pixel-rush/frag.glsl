 #extension GL_OES_standard_derivatives : enable

#ifdef GL_ES
precision mediump float;
#endif
uniform float time;
uniform vec2 resolution;
const int musLen = 256;
uniform float mus[256];
const float PI = 3.1415926535897932384626433832795;
vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

float Hash(float n) {
    return fract((1. + cos(n)) * 415.92653);
}

float Noise2d(in vec2 x) {
    float xhash = Hash(x.x * 37.);
    float yhash = Hash(x.y * 57.);
    return fract(xhash + yhash);
}

void main(void) {
    vec2 vCameraOffset = vec2(.0, .5 + time * 500.); //iMouse.xy;
    vec2 vSamplePos = ((gl_FragCoord.xy + floor(vCameraOffset)) / resolution.xy);
    vec2 m = 6. / resolution;
    m.y = m.y * 1.;
    vSamplePos = floor(vSamplePos / m) * m;

    vec3 vColor = vec3(.0, .0, .0);

                // Sky Background Color
    vec2 pos = gl_FragCoord.xy / resolution.y - vec2(resolution.x / resolution.y, 1.0) / 2.0;
                //pos.x=pos.x;
                //pos.y=pos.y;
    float colorLen = length(pos) * 60.0 + 0.2;
    vColor += hsv2rgb(vec3(floor(colorLen) / 24.0, 1.0, 0.7));//vec3(1.) * 1.;
    if(colorLen > 2.0) {
        if(mod(colorLen, 1.0) < 0.4) {
            vColor = hsv2rgb(vec3(floor(colorLen) / 24.0, 1.0, 0.7)) * 0.75;
            if(mod(colorLen, 1.0) < 0.35) {
                vColor = hsv2rgb(vec3(floor(colorLen) / 24.0, 1.0, 0.7)) * 0.5;
                if(mod(colorLen, 1.0) < 0.3) {
                    vColor = vec3(0.0);

                    if(mod(colorLen, 1.0) < 0.1) {
                        vColor = hsv2rgb(vec3(floor(colorLen) / 24.0 - 1.0 / 24.0, 1.0, 0.7)) * 1.5;
                        if(mod(colorLen, 1.0) < 0.05) {
                            vColor = hsv2rgb(vec3(floor(colorLen) / 24.0 - 1.0 / 24.0, 1.0, 0.7)) * 1.25;
                        }
                    }
                }

            }
        }

        float aC = time * 10.0;
                    /*if(Noise2d(vec2(0.0,floor(length(pos)*100.0)))>0.5){
                        aC=-aC;
                    }*/
        if(mod(length(pos) * 60.0, 2.0) > 1.0) {
            aC = -aC;
        }
        float freq = 8.0;
        if(length(pos) * 60.0 > 4.0) {
            freq = 16.0;

        }
        if(length(pos) * 60.0 > 8.0) {
            freq = 32.0;

        }
        if(colorLen > 2.1) {
            if(mod(atan(pos.y / pos.x) * 180.0 / PI + 0.1 / floor(colorLen) / 60.0 + aC, 360.0 / freq) < 0.2 / length(pos)) {
                vColor = vec3(0.0);
            }
        }
    } else {
        vColor = hsv2rgb(vec3(0.0, 1.0, 0.7));
    }
    int angle = int(atan(abs(pos.x), pos.y) * 256.0 / PI / 2.0);
    float mu = 0.0;
    for(int i = 0; i < musLen; i++) {
        if(angle == i) {
            mu = mus[i];
        }
    }
    if(mu / 360.0 + 0.05 < length(pos)) {
        vColor = vec3(length(vColor) / sqrt(3.0)) / 4.0 + vColor / 4.0;
    }
                // Stars
                // Note: Choose fThreshhold in the range [0.99, 0.9999].
                // Higher values (i.e., closer to one) yield a sparser starfield.
    float fThreshhold = .97;
    float StarVal = Noise2d(vSamplePos);
    if(StarVal >= fThreshhold) {
        StarVal = pow((StarVal - fThreshhold) / (1. - fThreshhold), 6.);
                    //vColor -= vec3(.0, StarVal, StarVal);
    }

    gl_FragColor = vec4(vColor, 1.);

}