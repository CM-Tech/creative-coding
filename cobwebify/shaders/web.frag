precision mediump float;
      varying vec2 uv;
      uniform vec4 color;
      uniform sampler2D canvas;
      uniform vec2 resolution;
      float mod289(float x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
vec4 mod289(vec4 x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
vec4 perm(vec4 x){return mod289(((x * 34.0) + 1.0) * x);}

float noise(vec3 p){
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
      void main() {
          vec2 texelSize = 1.0/resolution;
          vec4 currentColor =texture2D(canvas,uv.xy);
          vec4 webColor=vec4(0.0);
          float PI=3.14159265;
          for(float angle=0.0;angle<float(3.14159265);angle+=0.5){
          vec2 angleV=vec2(cos(angle),sin(angle));
          float cAngle=angle*11.0;

          for(int i=0;i<20;i++){
              float a=float(i);
              float b=float(i-20);
              vec2 corA=uv.xy+angleV*texelSize*a;
              vec2 corB=uv.xy+angleV*texelSize*b;
              vec4 aColor=texture2D(canvas,corA);
              vec4 bColor=texture2D(canvas,corB);
              vec4 m=(aColor+bColor)*floor(vec4((vec3(sin(cAngle),sin(cAngle+float(PI)*2.0/3.0),sin(cAngle+float(PI)*4.0/3.0))*0.5+0.5)*2.0,0.0));
              float amount=0.0;
              if(noise(vec3(corA*resolution/2.0,angle))>0.5 && length(aColor.xyz*aColor.w)*length(bColor.xyz*bColor.w)>1.0){
                  amount=1.0;
              }
              webColor+=vec4(vec3(amount),0.0)*(aColor+bColor)/2.0;
          }
          }
        gl_FragColor = currentColor+webColor;
      }