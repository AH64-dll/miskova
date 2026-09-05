import { useEffect, useRef } from "react";

const VERT = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;

const COMMON = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 u_res;uniform float u_t;uniform vec2 u_mouse;
vec2 hash2(vec2 p){p=vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3)));return fract(sin(p)*43758.5453);}
float noise(vec2 p){vec2 i=floor(p);vec2 f=fract(p);f=f*f*(3.-2.*f);
 float a=dot(hash2(i),vec2(1.)),b=dot(hash2(i+vec2(1,0)),vec2(1.)),c=dot(hash2(i+vec2(0,1)),vec2(1.)),d=dot(hash2(i+vec2(1,1)),vec2(1.));
 return mix(mix(a,b,f.x),mix(c,d,f.x),f.y)*.5;}
float fbm(vec2 p){float v=0.,a=.5;mat2 m=mat2(1.6,1.2,-1.2,1.6);for(int i=0;i<5;i++){v+=a*noise(p);p=m*p;a*=.5;}return v;}
`;

/* Sunlit water caustics — Summer */
export const CAUSTICS = COMMON + `
float caustic(vec2 uv,float t){
  vec2 p=mod(uv*6.2831,6.2831)-250.;
  vec2 i=p;float c=1.;float inten=.0045;
  for(int n=0;n<4;n++){float tt=t*(1.-3.5/float(n+1));
    i=p+vec2(cos(tt-i.x)+sin(tt+i.y),sin(tt-i.y)+cos(tt+i.x));
    c+=1./length(vec2(p.x/(sin(i.x+tt)/inten),p.y/(cos(i.y+tt)/inten)));}
  c/=4.;c=1.17-pow(c,1.4);return pow(abs(c),8.);
}
void main(){
  vec2 uv=gl_FragCoord.xy/u_res.xy;vec2 st=uv;st.x*=u_res.x/u_res.y;
  float t=u_t*.35;
  float k=caustic(st*.9+vec2(0.,t*.05),t);
  float k2=caustic(st*1.7+vec2(3.1,-t*.03),t*1.3);
  // subtle warp from mouse
  vec2 m=u_mouse; float md=exp(-length(uv-m)*3.5);
  k+=md*caustic(st*2.4,t*2.)*.6;
  vec3 base=mix(vec3(0.957,0.973,0.968),vec3(0.86,0.94,0.94),uv.y*0.8);
  vec3 aqua=vec3(0.12,0.64,0.68);vec3 sun=vec3(1.0,0.92,0.72);
  vec3 col=base;
  col=mix(col,aqua*.9+.1,clamp(k*.55,0.,1.)*.5);
  col+=sun*k2*.25;
  // sun beams from top-left
  float beam=smoothstep(.2,.9,fbm(vec2(uv.x*3.-uv.y*2.+t*.1,uv.y*1.5)))*(1.-uv.y)*.18;
  col+=sun*beam;
  // vignette to white at bottom for content readability
  col=mix(col,vec3(0.957,0.973,0.968),smoothstep(.5,1.,1.-uv.y));
  gl_FragColor=vec4(col,1.);
}`;

/* Golden smoke on black — Hero */
export const MIST = COMMON + `
void main(){
  vec2 uv=gl_FragCoord.xy/u_res.xy;vec2 st=uv;st.x*=u_res.x/u_res.y;
  float t=u_t*.06;
  vec2 q=vec2(fbm(st*1.4+t),fbm(st*1.4-t*.7+2.3));
  float f=fbm(st*1.8+q*1.6+vec2(t*.3,-t*.2));
  f=smoothstep(.28,.85,f);
  vec2 m=u_mouse;float md=exp(-length(uv-m)*2.6)*.35;
  float shaft=smoothstep(.0,.9,1.-abs((uv.x-0.18)-(1.-uv.y)*0.55)*3.2)*(1.-uv.y*.6);
  vec3 gold=vec3(0.79,0.66,0.38);vec3 deep=vec3(0.04,0.035,0.03);
  vec3 col=deep;
  col+=gold*f*(0.22+shaft*.35+md);
  col+=gold*shaft*.06;
  col=mix(col,deep,smoothstep(.55,1.,uv.x)*.5);
  gl_FragColor=vec4(col,1.);
}`;

type Props = { frag: string; className?: string; speed?: number; interactive?: boolean; quality?: number };

export default function ShaderCanvas({ frag, className, speed = 1, interactive = true, quality = 0.6 }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" });
    if (!gl) return;

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.warn(gl.getShaderInfoLog(s));
        gl.deleteShader(s);
        return null;
      }
      return s;
    };
    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, frag);
    if (!vs || !fs) {
      if (vs) gl.deleteShader(vs);
      if (fs) gl.deleteShader(fs);
      return;
    }
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uRes = gl.getUniformLocation(prog, "u_res");
    const uT = gl.getUniformLocation(prog, "u_t");
    const uM = gl.getUniformLocation(prog, "u_mouse");

    let mouse = { x: 0.5, y: 0.5 }, target = { x: 0.5, y: 0.5 };
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      target = { x: (e.clientX - r.left) / r.width, y: 1 - (e.clientY - r.top) / r.height };
    };
    if (interactive) window.addEventListener("pointermove", onMove, { passive: true });

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5) * quality; // render at reduced res, upscale
    const resize = () => {
      const w = Math.max(1, Math.floor(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.floor(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0 });
    io.observe(canvas);

    let raf = 0;
    const start = performance.now();
    const draw = () => {
      raf = requestAnimationFrame(draw);
      if (!visible) return;
      mouse.x += (target.x - mouse.x) * 0.04;
      mouse.y += (target.y - mouse.y) * 0.04;
      const t = reduce ? 12 : ((performance.now() - start) / 1000) * speed;
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uT, t);
      gl.uniform2f(uM, mouse.x, mouse.y);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    if (reduce) {
      resize();
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uT, 12);
      gl.uniform2f(uM, 0.5, 0.5);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    } else draw();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      // StrictMode replays this effect on the same canvas. Losing its context
      // here leaves the next setup with a dead renderer and an opaque overlay.
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, [frag, speed, interactive, quality]);

  return <canvas ref={ref} className={className} aria-hidden />;
}
