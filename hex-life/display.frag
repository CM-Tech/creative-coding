//copied from http://glslsandbox.com/e#21245.3
precision highp float;
uniform float time;
uniform float fTick;
uniform float lastFTick;
uniform float msize;
uniform float white;
uniform float hexR;
uniform vec2 resolution;
uniform vec2 bbResolution;
uniform sampler2D from;
uniform sampler2D to;
uniform vec3 COLOR_BACKGROUND;

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
vec4 hexFillAndRad(vec2 hexCoord) {
    vec3 selfcol = texture2D(from, hexCoord / bbResolution.xy).rgb;
    vec3 elselfcol = texture2D(to, hexCoord / bbResolution.xy).rgb;
    float moo=mod(fTick,1.0);
    float rad=1.0;
    vec3 fill=vec3(0.0,0.0,0.0)+white;
    if(selfcol.b != white && elselfcol.b != white){
       rad=0.0;
    }
    if(selfcol.b == white && elselfcol.b != white){
        rad=moo;
        fill=elselfcol;
        // if(length(gl_FragCoord.xy-hexCoord)<hexR*moo*0.8)
        // col = elselfcol;//vec3(1.0);//mix(selfcol,elselfcol,moo);
    }
    if(selfcol.b != white && elselfcol.b == white){
        rad=(1.0-moo);
        fill=selfcol;
        // if(length(gl_FragCoord.xy-hexCoord)>hexR*(1.0-moo)*0.8)
        // col = elselfcol;//vec3(1.0);//mix(selfcol,elselfcol,moo);
    }
    if(selfcol.b != white && elselfcol.b != white){
        rad=1.0;
        fill=selfcol*(1.0-moo)+moo*elselfcol;
        // if(length(gl_FragCoord.xy-hexCoord)>hexR*(1.0-moo)*0.8)
        // col = elselfcol;//vec3(1.0);//mix(selfcol,elselfcol,moo);
    }
     if(selfcol.b == white && elselfcol.b == white){
        rad=0.0;
        fill=COLOR_BACKGROUND;
        // if(length(gl_FragCoord.xy-hexCoord)>hexR*(1.0-moo)*0.8)
        // col = elselfcol;//vec3(1.0);//mix(selfcol,elselfcol,moo);
    }
    return vec4(fill,rad);
}
void main(void) {
    vec3 col = vec3(0.);
    vec2 st = gl_FragCoord.xy;
    float mScale=min(bbResolution.x/resolution.x,bbResolution.y/resolution.y);
    vec2 FC=gl_FragCoord.xy*mScale;
    vec2 hexCoord = nearestHex(FC);
    vec4 fillRadSum=vec4(0.0);
    float p = 0.0;
    fillRadSum+=p*vec4(0.0,0.0,0.0,1.0);
    for (int i = 0; i < 7; i++) {
        vec2 n1 = neighbourHex(hexCoord, hexR, i);
        if(i==6){
            n1=hexCoord;
        }
        vec2 hexCoord2 = nearestHex(n1);
        vec4 fillAndRad = hexFillAndRad(hexCoord2);

        vec4 myfillAndRad = hexFillAndRad(hexCoord);
        // float w=(hexR*4.0-length(hexCoord2-gl_FragCoord.xy));
        float rad=hexR*(fillAndRad.w+myfillAndRad.w)*0.5;//fillAndRad.w;
        float tt=fillAndRad.w/(fillAndRad.w+myfillAndRad.w);
        vec2 tar=hexCoord2*tt+(1.0-tt)*hexCoord;

        vec3 tarF=fillAndRad.xyz*tt+(1.0-tt)*myfillAndRad.xyz;
        float si=length(FC-tar);
        float w=exp(-si/(rad)*4.0);
        if(rad<=0.0001){
            w=0.0;
        }
        // if(w<0.05){
        //     w=0.0;
        // }
        // float w=smoothstep(hexR*fillAndRad.w,hexR*fillAndRad.w-1.0,length(gl_FragCoord.xy-hexCoord2));
        fillAndRad.xyz=tarF;
        fillRadSum+=fillAndRad*w;
        p+=w;
        // vec3 nc1 = texture2D(backbuffer, n1 / resolution.xy).rgb;
        // if (nc1.b != white) {
        //     p += primaryNodeW;
        //     col += primaryNodeW * nc1;
        // }
        // vec2 n2 = neighbourHex(n1, hexR, i + 1);
        // vec3 nc2 = texture2D(backbuffer, n2 / resolution.xy).rgb;
        // if (nc2.b != white) {
        //     p += secondaryNodeW;
        //     col += secondaryNodeW * nc2;
        // }
    }
    col=fillRadSum.rgb/p;//4.0;
    
    if(p<0.13){
        col=vec3(0.0);
        p=0.0;
        col=COLOR_BACKGROUND;
    }else{
        col=min(max(col,vec3(0.0)),vec3(1.0));
        float j=min(col.x,min(col.y,col.z));
        vec3 col2=col;
        col2-=vec3(j);
        col2=col2/length(col2*vec3(0.299,0.587,0.114+0.11))*(0.114+0.11);//max(col2.x,max(col2.y*1.1,col2.z))*(1.0-0.125);
        col=col2;
        col=mix(COLOR_BACKGROUND,col,smoothstep(0.13,0.15,p));
        if(p<0.3){
            col2=col+vec3(1.0)*0.125;
            col=mix(col2,col,smoothstep(0.29,0.3,p));
        }
        //col=max(min(floor(col*2.0),vec3(1.0)),0.0);
    }
    //col+=COLOR_BACKGROUND*min(max(1.0-p,0.0),1.0);
    // vec3 selfcol = texture2D(from, hexCoord / resolution.xy).rgb;
    // vec3 elselfcol = texture2D(to, hexCoord / resolution.xy).rgb;
    // float moo=mod(fTick,1.0);
    // col = COLOR_BACKGROUND;//*moo+(1.0-moo)*elselfcol;
    // float rad=hexR*0.8;
    // vec3 fill=vec3(0.0,0.0,0.0)+white;
    // if(selfcol.b != white && elselfcol.b != white){
    //    rad=0.0;
    // }
    // if(selfcol.b == white && elselfcol.b != white){
    //     rad=hexR*moo*0.8;
    //     fill=elselfcol;
    //     // if(length(gl_FragCoord.xy-hexCoord)<hexR*moo*0.8)
    //     // col = elselfcol;//vec3(1.0);//mix(selfcol,elselfcol,moo);
    // }
    // if(selfcol.b != white && elselfcol.b == white){
    //     rad=hexR*(1.0-moo)*0.8;
    //     fill=selfcol;
    //     // if(length(gl_FragCoord.xy-hexCoord)>hexR*(1.0-moo)*0.8)
    //     // col = elselfcol;//vec3(1.0);//mix(selfcol,elselfcol,moo);
    // }
    // if(selfcol.b != white && elselfcol.b != white){
    //     rad=hexR*0.8;
    //     fill=selfcol*(1.0-moo)+moo*elselfcol;
    //     // if(length(gl_FragCoord.xy-hexCoord)>hexR*(1.0-moo)*0.8)
    //     // col = elselfcol;//vec3(1.0);//mix(selfcol,elselfcol,moo);
    // }
    //  if(selfcol.b == white && elselfcol.b == white){
    //     rad=0.0;
    //     fill=COLOR_BACKGROUND;
    //     // if(length(gl_FragCoord.xy-hexCoord)>hexR*(1.0-moo)*0.8)
    //     // col = elselfcol;//vec3(1.0);//mix(selfcol,elselfcol,moo);
    // }
    // float m=smoothstep(rad,rad-1.0,length(gl_FragCoord.xy-hexCoord));
    
    // col=mix(COLOR_BACKGROUND,fill,m);
    
    // if(selfcol.b != white && (lKeepAlive <= p) && (p <= uKeepAlive)) col = selfcol;
    // else if((lBirth <= p) && (p <= hBirth)) col = col;
    // else col = vec3(white);
    // vec2 position = hexCoord / resolution.xy;
    // if (distance(resolution.xy * mouse, hexCoord) <= msize) col = vec3(0.5+0.5*sin(0.01*hexCoord.x+0.2*time),0.5+0.5*sin(0.01*hexCoord.y+0.3*time),0.5); //vec3(-(white-1.));
    // col /= maxNorm(col);
     
    // if((length(gl_FragCoord.xy-hexCoord)-2.0)/hexR>max(0.0,min(mod(fTick,1.0),1.0-mod(fTick,1.0)))){
    //    // col = vec3(white);
    // }else{
    //     if(floor(fTick)==floor(lastFTick)){
    //     col = selfcol;
    // }
    // }
    
    gl_FragColor = vec4(col, 1.);
}