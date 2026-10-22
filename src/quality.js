// Geometry stays fixed during automatic adaptation; only DPR changes.
export const QUALITY = {
  normal: { segments: 64, beans: 18, steam: 18 },
  reduced: { segments: 48, beans: 8, steam: 8 },
};
export function initialDpr({ pixelRatio=1, cores=8, memory=8 }={}) {
  return Math.min(pixelRatio, cores<=4 || memory<=4 ? 1 : 1.25);
}
// Ignore startup/restore, require consecutive windows, and cool down after changes.
export function createQualityMonitor(initial, ceiling=initial) {
  let dpr=initial, elapsed=0, frames=0, slow=0, fast=0, warmup=3, cooldown=0;
  return {
    reset(){ elapsed=frames=slow=fast=0; warmup=3; },
    sample(delta){
      if(delta<=0 || delta>.25){this.reset();return null;}
      if(warmup>0){warmup-=delta;return null;}
      if(cooldown>0){cooldown-=delta;return null;}
      elapsed+=delta; frames++;
      if(elapsed<2)return null;
      const fps=frames/elapsed; elapsed=frames=0;
      slow=fps<48?slow+1:0; fast=fps>57?fast+1:0;
      const next=slow>=2?Math.max(.75,dpr-.25):fast>=5?Math.min(ceiling,dpr+.25):dpr;
      if(next===dpr)return null;
      dpr=next;slow=fast=0;cooldown=10;return dpr;
    }
  };
}
