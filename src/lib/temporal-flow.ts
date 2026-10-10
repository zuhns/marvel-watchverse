export type Point = { x: number; y: number };
export type TemporalAnchor = Point & { id: string };
export type TemporalControls = {
  paused: boolean;
  selected: string;
  hovered: string | null;
};
type Strand = {
  start: Point;
  end: Point;
  seed: number;
  width: number;
  alpha: number;
  kind: number;
  route: number;
};
function random(seed: number) {
  let n = seed >>> 0;
  return () => {
    n = (n * 1664525 + 1013904223) >>> 0;
    return n / 4294967296;
  };
}
const trunk = (x: number, t = 0) =>
  0.625 +
  Math.sin(x * 9 - t * 0.22) * 0.038 +
  Math.cos(x * 21 + t * 0.35) * 0.015;
const vertex = `
precision highp float;
attribute vec2 aStart, aEnd;
attribute vec4 aShape;
attribute vec3 aStyle;
uniform float uTime, uDpr, uSelected, uHovered;
uniform vec2 uResolution;
varying float vSide, vAlong, vSeed, vAlpha, vActive, vDepth;
vec2 curve(float s) {
  float seed=aShape.z, kind=aStyle.y;
  float x=mix(aStart.x,aEnd.x,s);
  float noise=sin(s*39.0+seed+uTime*1.4)*.42
    +sin(s*87.0-seed-uTime*.8)*.2+sin(s*193.0+seed*3.0+uTime*2.0)*.08;
  float y;
  if(kind<.5) {
    y=.625+sin(x*9.0-uTime*.22)*.038+cos(x*21.0+uTime*.35)*.015;
    float coil=x*(12.0+sin(seed)*5.0)-uTime*.42+seed;
    y+=sin(coil)*(.022+cos(seed)*.014)+noise*.009;
    y+=cos(seed*3.0)*.012+sin(x*21.0-uTime*.7+seed)*.011;
  } else {
    float envelope=sin(s*3.14159265);
    float origin=aStart.y;
    if(kind<1.5) origin=.625+sin(aStart.x*9.0-uTime*.22)*.038+cos(aStart.x*21.0+uTime*.35)*.015;
    y=mix(origin,aEnd.y,pow(s,1.32));
    y+=envelope*(sin(s*7.0+seed*.12+uTime*.5)*.018+noise*.012);
    y+=envelope*sin(seed)*.009;
    x+=envelope*sin(seed*.3+uTime*.35)*.008;
  }
  return vec2(x,y);
}
void main() {
  float s=aShape.x;
  vec2 p=curve(s);
  vec2 tangent=normalize((curve(min(1.0,s+.006))-curve(max(0.0,s-.006)))*uResolution);
  vec2 normal=vec2(-tangent.y,tangent.x);
  float depth=.5+.5*cos(s*12.0-uTime*.42+aShape.z);
  p+=normal*aShape.y*aShape.w*(.7+depth*.75)*uDpr/uResolution;
  gl_Position=vec4(p.x*2.0-1.0,1.0-p.y*2.0,0.0,1.0);
  vSide=aShape.y; vAlong=s; vSeed=aShape.z; vAlpha=aStyle.x;
  vDepth=depth;
  vActive=(abs(aStyle.z-uSelected)<.1||abs(aStyle.z-uHovered)<.1)?1.0:0.0;
}
`;
const fragment = `
precision highp float;
uniform float uTime;
varying float vSide, vAlong, vSeed, vAlpha, vActive, vDepth;
void main() {
  float glow=exp(-vSide*vSide*(2.8+vDepth*5.0));
  float pulse=pow(.5+.5*sin(vAlong*38.0-uTime*4.7+vSeed),8.0);
  float surge=.65+.35*sin(vAlong*14.0-uTime*1.3+vSeed*.2);
  vec3 color=mix(vec3(.37,.68,1.0),vec3(.8,.52,.94),.5+.5*sin(vSeed*1.7));
  color=mix(color,vec3(.9,.96,1.0),pulse*.8+vActive*.15);
  float detail=.72+.28*sin(vAlong*380.0-uTime*12.0+vSeed*4.0);
  float energy=glow*vAlpha*(surge+pulse*1.3)*detail*(.45+vDepth*.8)*(1.0+vActive*.4);
  gl_FragColor=vec4(color*energy,1.0);
}
`;
const backdropVertex = `precision highp float;attribute vec2 aPosition;varying vec2 vUv;void main(){vUv=vec2(aPosition.x*.5+.5,.5-aPosition.y*.5);gl_Position=vec4(aPosition,0.,1.);}`;
const backdropFragment = `
precision highp float;
varying vec2 vUv;
uniform float uTime;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float n=0.,a=.5;for(int i=0;i<4;i++){n+=noise(p)*a;p=mat2(.8,-.6,.6,.8)*p*2.08+3.7;a*=.5;}return n;}
void main(){
 vec2 p=vUv;
 float middle=.625+sin(p.x*9.-uTime*.22)*.038+cos(p.x*21.+uTime*.35)*.015;
 vec2 flow=vec2(p.x*6.-uTime*.12,(p.y-middle)*15.);
 float mist=fbm(flow+vec2(fbm(flow*.8+uTime*.03),fbm(flow*.9-5.)));
 float halo=exp(-pow(abs(p.y-middle)/(.038+mist*.07),1.65));
 float cloud=pow(mist,1.9)*halo;
 vec3 color=vec3(.006,.011,.026)+mix(vec3(.08,.20,.34),vec3(.28,.12,.28),mist)*cloud*1.9;
 color+=vec3(.04,.055,.12)*fbm(p*vec2(5.,10.)+vec2(-uTime*.014,0.))*.55;
 for(int layer=0;layer<3;layer++){
   float z=float(layer);
   vec2 grid=vec2(p.x*(125.+z*80.)+uTime*(.9+z*.8),p.y*(72.+z*35.));
   vec2 cell=floor(grid),delta=fract(grid)-.5;
   float seed=hash(cell+z*43.);
   float dust=step(.993-z*.002,seed)*exp(-dot(delta*vec2(.7,1.4),delta*vec2(.7,1.4))*(50.+z*30.));
   float drift=.3+.7*pow(.5+.5*sin(uTime*.6+seed*70.),3.);
   color+=mix(vec3(.52,.68,.9),vec3(.86,.65,.8),seed)*dust*drift*(.17+halo*.6);
 }
 color*=1.-smoothstep(.23,.86,length((p-.5)*vec2(.9,1.1)));
 gl_FragColor=vec4(color,1.);
}`;
const bloomFragment = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uScene;
uniform vec2 uTexel;
void main() {
 vec2 uv=vec2(vUv.x,1.-vUv.y);
 vec3 line=texture2D(uScene,uv).rgb;
 vec3 glow=vec3(0.);
 for(int i=0;i<12;i++) {
   float angle=float(i)*.5235988;
   vec2 direction=vec2(cos(angle),sin(angle));
   glow+=texture2D(uScene,uv+direction*uTexel*4.).rgb*.045;
   glow+=texture2D(uScene,uv+direction*uTexel*11.).rgb*.026;
   glow+=texture2D(uScene,uv+direction*uTexel*23.).rgb*.014;
 }
 vec3 light=line*.7+glow*2.1;
 light=vec3(1.)-exp(-light*1.4);
 gl_FragColor=vec4(light,1.);
}`;
function strands(anchors: TemporalAnchor[]) {
  const rand = random(7021986),
    result: Strand[] = [];
  for (let i = 0; i < 64; i++)
    result.push({
      start: { x: -0.03, y: 0.625 },
      end: { x: 1.03, y: 0.625 },
      seed: i * 0.71,
      width: i < 12 ? 12 + i * 1.5 : 0.55 + rand() * 2.2,
      alpha: i < 12 ? 0.009 : 0.055 + rand() * 0.065,
      kind: 0,
      route: -1,
    });
  anchors
    .filter((a) => a.id !== "616")
    .forEach((end, route) => {
      const start = {
        x: Math.max(-0.02, end.x - 0.21 - rand() * 0.06),
        y: trunk(end.x - 0.22),
      };
      for (let j = 0; j < 10; j++)
        result.push({
          start,
          end,
          seed: route * 8 + j * 0.7,
          width: j < 2 ? 9 : 0.7 + rand() * 2,
          alpha: j < 2 ? 0.027 : 0.14 + rand() * 0.18,
          kind: 1,
          route,
        });
      for (let k = 0; k < 7; k++) {
        const s = 0.19 + k * 0.1,
          sign = end.y < start.y ? -1 : 1;
        const origin = {
          x: start.x + (end.x - start.x) * s,
          y: start.y + (end.y - start.y) * Math.pow(s, 1.32),
        };
        const tip = {
          x: origin.x + (rand() - 0.25) * 0.13,
          y: origin.y + sign * (0.065 + rand() * 0.14),
        };
        for (let j = 0; j < 2; j++)
          result.push({
            start: origin,
            end: tip,
            seed: route * 8 + k * 0.9 + j * 0.3,
            width: 0.6 + rand(),
            alpha: 0.09 + rand() * 0.1,
            kind: 2,
            route,
          });
        for (let j = 0; j < 2; j++) {
          const fork = {
            x: origin.x + (tip.x - origin.x) * 0.65,
            y: origin.y + (tip.y - origin.y) * 0.6,
          };
          result.push({
            start: fork,
            end: {
              x: fork.x + (rand() - 0.5) * 0.07,
              y: fork.y + sign * (0.04 + rand() * 0.05),
            },
            seed: k * 5 + j,
            width: 0.65,
            alpha: 0.12,
            kind: 2,
            route,
          });
        }
      }
      if (route % 2 === 0)
        for (let j = 0; j < 4; j++)
          result.push({
            start: end,
            end: { x: end.x + 0.07, y: end.y < 0.5 ? -0.18 : 1.16 },
            seed: route * 8 + j,
            width: 1.2,
            alpha: 0.13,
            kind: 2,
            route,
          });
    });
  return result;
}
function program(gl: WebGLRenderingContext, vs: string, fs: string) {
  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
      throw new Error(gl.getShaderInfoLog(shader) ?? "Temporal shader");
    return shader;
  };
  const p = gl.createProgram()!,
    v = compile(gl.VERTEX_SHADER, vs),
    f = compile(gl.FRAGMENT_SHADER, fs);
  gl.attachShader(p, v);
  gl.attachShader(p, f);
  gl.linkProgram(p);
  gl.deleteShader(v);
  gl.deleteShader(f);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS))
    throw new Error(gl.getProgramInfoLog(p) ?? "Temporal program");
  return p;
}
function webgl(canvas: HTMLCanvasElement, anchors: TemporalAnchor[]) {
  const gl = canvas.getContext("webgl", {
    alpha: false,
    antialias: false,
    preserveDrawingBuffer: true,
    powerPreference: "low-power",
  });
  if (!gl) return null;
  const lineProgram = program(gl, vertex, fragment),
    background = program(gl, backdropVertex, backdropFragment),
    bloom = program(gl, backdropVertex, bloomFragment);
  const texture = gl.createTexture()!,
    target = gl.createFramebuffer()!;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  let targetWidth = 0,
    targetHeight = 0;
  const values: number[] = [];
  const add = (line: Strand, s: number, side: number) =>
    values.push(
      line.start.x,
      line.start.y,
      line.end.x,
      line.end.y,
      s,
      side,
      line.seed,
      line.width,
      line.alpha,
      line.kind,
      line.route,
    );
  for (const line of strands(anchors)) {
    const segments = line.kind === 2 ? 24 : 80;
    for (let i = 0; i < segments; i++) {
      const a = i / segments,
        b = (i + 1) / segments;
      add(line, a, -1);
      add(line, b, -1);
      add(line, a, 1);
      add(line, a, 1);
      add(line, b, -1);
      add(line, b, 1);
    }
  }
  const buffer = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(values), gl.STATIC_DRAW);
  const quad = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
    gl.STATIC_DRAW,
  );
  const uniform = (p: WebGLProgram, n: string) => gl.getUniformLocation(p, n);
  const uniforms = {
    time: uniform(lineProgram, "uTime"),
    resolution: uniform(lineProgram, "uResolution"),
    dpr: uniform(lineProgram, "uDpr"),
    selected: uniform(lineProgram, "uSelected"),
    hovered: uniform(lineProgram, "uHovered"),
    backgroundTime: uniform(background, "uTime"),
    scene: uniform(bloom, "uScene"),
    texel: uniform(bloom, "uTexel"),
  };
  const attrs = [
    gl.getAttribLocation(lineProgram, "aStart"),
    gl.getAttribLocation(lineProgram, "aEnd"),
    gl.getAttribLocation(lineProgram, "aShape"),
    gl.getAttribLocation(lineProgram, "aStyle"),
  ];
  const bgAttribute = gl.getAttribLocation(background, "aPosition");
  const routes = anchors.filter((a) => a.id !== "616");
  return {
    kind: "webgl-procedural",
    draw(t: number, state: TemporalControls) {
      if (targetWidth !== canvas.width || targetHeight !== canvas.height) {
        targetWidth = canvas.width;
        targetHeight = canvas.height;
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          targetWidth,
          targetHeight,
          0,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          null,
        );
        gl.bindFramebuffer(gl.FRAMEBUFFER, target);
        gl.framebufferTexture2D(
          gl.FRAMEBUFFER,
          gl.COLOR_ATTACHMENT0,
          gl.TEXTURE_2D,
          texture,
          0,
        );
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, target);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      attrs.forEach((a) => gl.disableVertexAttribArray(a));
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE);
      gl.useProgram(lineProgram);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      [2, 2, 4, 3].forEach((size, i) => {
        gl.enableVertexAttribArray(attrs[i]);
        gl.vertexAttribPointer(
          attrs[i],
          size,
          gl.FLOAT,
          false,
          44,
          [0, 8, 16, 32][i],
        );
      });
      gl.uniform1f(uniforms.time, t);
      gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
      gl.uniform1f(uniforms.dpr, canvas.width / canvas.clientWidth);
      gl.uniform1f(
        uniforms.selected,
        state.selected === "616"
          ? -1
          : routes.findIndex((a) => a.id === state.selected),
      );
      gl.uniform1f(
        uniforms.hovered,
        state.hovered === null
          ? -999
          : state.hovered === "616"
            ? -1
            : routes.findIndex((a) => a.id === state.hovered),
      );
      gl.drawArrays(gl.TRIANGLES, 0, values.length / 11);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.disable(gl.BLEND);
      gl.useProgram(background);
      attrs.forEach((a) => gl.disableVertexAttribArray(a));
      gl.bindBuffer(gl.ARRAY_BUFFER, quad);
      gl.enableVertexAttribArray(bgAttribute);
      gl.vertexAttribPointer(bgAttribute, 2, gl.FLOAT, false, 0, 0);
      gl.uniform1f(uniforms.backgroundTime, t);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      gl.useProgram(bloom);
      const position = gl.getAttribLocation(bloom, "aPosition");
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniform1i(uniforms.scene, 0);
      gl.uniform2f(uniforms.texel, 1 / targetWidth, 1 / targetHeight);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    },
    dispose() {
      gl.deleteBuffer(buffer);
      gl.deleteBuffer(quad);
      gl.deleteProgram(lineProgram);
      gl.deleteProgram(background);
      gl.deleteProgram(bloom);
      gl.deleteTexture(texture);
      gl.deleteFramebuffer(target);
    },
  };
}
function fallback(canvas: HTMLCanvasElement, anchors: TemporalAnchor[]) {
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return null;
  const lines = strands(anchors).filter((_, i) => i % 2 === 0);
  return {
    kind: "canvas-procedural",
    draw(t: number, _state: TemporalControls) {
      const w = canvas.width,
        h = canvas.height;
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "#030d22";
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      lines.forEach((line) => {
        ctx.beginPath();
        for (let i = 0; i <= 72; i++) {
          const s = i / 72,
            x = line.start.x + (line.end.x - line.start.x) * s;
          const y =
            line.kind === 0
              ? trunk(x, t) +
                Math.sin(line.seed) * 0.017 +
                Math.sin(s * 39 + t + line.seed) * 0.006
              : line.start.y +
                (line.end.y - line.start.y) * Math.pow(s, 1.32) +
                Math.sin(Math.PI * s) *
                  Math.sin(s * 31 + t + line.seed) *
                  0.008;
          i ? ctx.lineTo(x * w, y * h) : ctx.moveTo(x * w, y * h);
        }
        ctx.globalAlpha = line.alpha * (1 + 0.3 * Math.sin(t * 2 + line.seed));
        ctx.lineWidth = line.width * 0.5;
        ctx.strokeStyle = line.seed % 2 < 1 ? "#80c6ff" : "#c0a3ee";
        ctx.stroke();
      });
    },
    dispose() {},
  };
}
export function createTemporalRenderer(
  canvas: HTMLCanvasElement,
  anchors: TemporalAnchor[],
  controls: () => TemporalControls,
) {
  const engine = webgl(canvas, anchors) ?? fallback(canvas, anchors);
  if (!engine) return () => {};
  let disposed = false,
    visible = true,
    frame = 0,
    last = 0,
    lastDraw = 0,
    time = 0,
    dirty = true,
    key = "";
  const compact = matchMedia("(max-width: 768px), (pointer: coarse)").matches;
  const monitor = canvas.closest(".temporal-viewport") ?? canvas;
  const wake = () => {
    if (!disposed && !frame && !document.hidden && visible)
      frame = requestAnimationFrame(draw);
  };
  const resize = () => {
    const budget = compact ? 420_000 : 1_200_000;
    const ratio = Math.min(
      compact ? 1 : Math.min(devicePixelRatio, 1.25),
      Math.sqrt(budget / Math.max(1, canvas.clientWidth * canvas.clientHeight)),
    );
    canvas.width = Math.round(canvas.clientWidth * ratio);
    canvas.height = Math.round(canvas.clientHeight * ratio);
    dirty = true;
    wake();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  canvas.dataset.renderer = engine.kind;
  const draw = (now: number) => {
    frame = 0;
    if (disposed) return;
    if (document.hidden || !visible) {
      last = 0;
      canvas.dataset.activity = "idle";
      return;
    }
    const state = controls(),
      running = !state.paused && !document.hidden;
    if (last && running) time += Math.min((now - last) / 1000, 0.2);
    last = now;
    const nextKey = `${state.paused}/${state.selected}/${state.hovered}`;
    if (nextKey !== key) dirty = true;
    key = nextKey;
    if (dirty || (running && now - lastDraw >= 1000 / (compact ? 24 : 30))) {
      dirty = false;
      lastDraw = now;
      engine.draw(time, state);
      canvas.dataset.rendered = "ready";
      canvas.dataset.motion = state.paused ? "still" : "flowing";
      canvas.dataset.time = time.toFixed(3);
      canvas.dataset.activity = state.paused ? "paused" : "running";
    }
    if (running) wake();
    else last = 0;
  };
  const update = () => {
    dirty = true;
    canvas.dataset.motion = controls().paused ? "still" : "flowing";
    wake();
  };
  const visibility = () => {
    if (document.hidden) {
      cancelAnimationFrame(frame);
      frame = 0;
      last = 0;
      canvas.dataset.activity = "idle";
    } else wake();
  };
  const checkViewport = () => {
    // Read the current bounds: an observer entry can precede a rapid scroll.
    const rect = monitor.getBoundingClientRect();
    visible =
      rect.width > 0 &&
      rect.height > 0 &&
      rect.bottom > -64 &&
      rect.top < innerHeight + 64 &&
      rect.right > -64 &&
      rect.left < innerWidth + 64;
    if (visible) wake();
    else {
      cancelAnimationFrame(frame);
      frame = 0;
      last = 0;
      canvas.dataset.activity = "idle";
    }
  };
  const viewport = new IntersectionObserver(checkViewport, {
    rootMargin: "64px",
  });
  // Observe the monitor window, not the oversized canvas inside its panning area.
  viewport.observe(monitor);
  window.addEventListener("scroll", checkViewport, { passive: true });
  canvas.addEventListener("watchverse:temporal-controls", update);
  document.addEventListener("visibilitychange", visibility);
  resize();
  return () => {
    disposed = true;
    cancelAnimationFrame(frame);
    observer.disconnect();
    viewport.disconnect();
    window.removeEventListener("scroll", checkViewport);
    canvas.removeEventListener("watchverse:temporal-controls", update);
    document.removeEventListener("visibilitychange", visibility);
    engine.dispose();
    canvas.width = canvas.height = 0;
  };
}
