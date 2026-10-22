import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';
import { QUALITY, createQualityMonitor, initialDpr } from './quality.js';
const lerp=THREE.MathUtils.lerp;
const ease=(a,b,p)=>THREE.MathUtils.smoothstep(p,a,b);
function makeLabelTexture() {
  const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = 768;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0,0,1024,768); ctx.fillStyle = '#eee2ca'; ctx.textAlign = 'center';
  ctx.lineWidth = 2; ctx.strokeStyle = '#eee2ca'; ctx.beginPath(); ctx.arc(512,180,62,0,Math.PI*2);ctx.stroke();
  ctx.font = 'italic 74px Georgia';ctx.fillText('a',512,201);
  ctx.font = '64px Georgia';ctx.fillText('AETHER',512,345);ctx.font = 'italic 45px Georgia';ctx.fillText('&',512,404);ctx.font = '64px Georgia';ctx.fillText('ROAST',512,474);
  ctx.fillRect(416,523,192,2);ctx.font = '18px sans-serif';ctx.fillText('S L O W   B Y   N A T U R E',512,572);ctx.font = '15px sans-serif';ctx.fillText('S P E C I A L T Y   C O F F E E',512,620);
  const texture = new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;return texture;
}
function makePaperTexture() {
  const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;const ctx=canvas.getContext('2d');const img=ctx.createImageData(128,128);
  let seed=731;
  for(let i=0;i<img.data.length;i+=4){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const v=188+(seed%24);img.data[i]=img.data[i+1]=img.data[i+2]=v;img.data[i+3]=255;}ctx.putImageData(img,0,0);
  const texture=new THREE.CanvasTexture(canvas);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(2,1);texture.anisotropy=4;return texture;
}
// Follow the actual body taper, with enough clearance for polygon facets.
const cupRadiusAt = y => .77 + (y + 1.30) * (.97 - .77) / (1.23 + 1.30);
const sleeveRadiusAt = y => cupRadiusAt(y) + .025;
const labelRadiusAt = y => sleeveRadiusAt(y) + .012;
function ProceduralCup({ flavor, reduced, quality }) {
  const body=useRef(),sleeve=useRef(),rim=useRef();
  const [textures,setTextures]=useState(null);
  useEffect(()=>{const label=makeLabelTexture(),paper=makePaperTexture();setTextures({label,paper});return()=>{label.dispose();paper.dispose()}},[]);
  const label=textures?.label,paper=textures?.paper;
  const segments=quality.segments;
  const points=useMemo(()=>[new THREE.Vector2(0,-1.48),new THREE.Vector2(.68,-1.48),new THREE.Vector2(.74,-1.43),new THREE.Vector2(.77,-1.30),new THREE.Vector2(.97,1.23),new THREE.Vector2(.97,1.33),new THREE.Vector2(.91,1.34),new THREE.Vector2(.71,-1.32),new THREE.Vector2(0,-1.32)],[]);
  const target=useMemo(()=>({body:new THREE.Color(flavor.color),sleeve:new THREE.Color(flavor.sleeve),metal:new THREE.Color(flavor.metal)}),[flavor]);
  useFrame((_,delta)=>{const t=reduced?1:1-Math.exp(-Math.min(delta,.05)*5);body.current?.color.lerp(target.body,t);sleeve.current?.color.lerp(target.sleeve,t);rim.current?.color.lerp(target.metal,t)});
  return <group>
    <mesh><latheGeometry args={[points,segments]}/><meshStandardMaterial ref={body} color={flavor.color} roughness={.27} metalness={.24}/></mesh>
    <mesh position={[0,-.08,0]}><cylinderGeometry args={[sleeveRadiusAt(.60),sleeveRadiusAt(-.76),1.36,segments,1,true]}/><meshStandardMaterial ref={sleeve} color={flavor.sleeve} roughness={.8} bumpMap={paper} bumpScale={.004}/></mesh>
    <mesh position={[0,-.08,0]}><cylinderGeometry args={[labelRadiusAt(.585),labelRadiusAt(-.745),1.33,segments,1,true,-.82,1.64]}/><meshBasicMaterial map={label} transparent depthWrite={false} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1}/></mesh>
    <mesh position={[0,1.32,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.956,.045,12,64]}/><meshStandardMaterial ref={rim} color={flavor.metal} roughness={.25} metalness={.8}/></mesh>
    <mesh position={[0,1.39,0]}><cylinderGeometry args={[1.015,1.015,.12,64]}/><meshStandardMaterial color="#161412" roughness={.34}/></mesh>
    <mesh position={[0,1.49,0]}><cylinderGeometry args={[.91,1.01,.13,64]}/><meshStandardMaterial color="#24211c" roughness={.33} metalness={.12}/></mesh>
    <mesh position={[0,1.57,0]}><cylinderGeometry args={[.86,.91,.07,64]}/><meshStandardMaterial color="#24211c" roughness={.25}/></mesh>
    <mesh position={[0,1.61,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.73,.018,8,64]}/><meshStandardMaterial color="#494136" roughness={.5}/></mesh>
    <mesh position={[0,1.612,.61]} scale={[.25,.009,.085]}><sphereGeometry args={[1,24,12]}/><meshStandardMaterial color="#040302" roughness={1}/></mesh>
    <mesh position={[0,-1.43,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.714,.028,12,64]}/><meshStandardMaterial color={flavor.metal} metalness={.7} roughness={.3}/></mesh>
    {!reduced&&<Steam count={quality.steam}/>}
  </group>;
}
function Steam({count}){
  const points=useRef(),time=useRef(0);const positions=useMemo(()=>new Float32Array(count*3),[count]);
  const shader=useMemo(()=>({uniforms:{uOpacity:{value:.19}},vertexShader:`attribute float size; varying float vFade; void main(){ vec4 mv=modelViewMatrix*vec4(position,1.0); vFade=1.0-clamp((position.y-1.7)/2.0,0.0,1.0); gl_PointSize=clamp(95.0/-mv.z,2.0,26.0); gl_Position=projectionMatrix*mv; }`,fragmentShader:`uniform float uOpacity; varying float vFade; void main(){float d=length(gl_PointCoord-vec2(.5));float a=smoothstep(.5,0.0,d)*vFade*uOpacity;gl_FragColor=vec4(.92,.87,.77,a);}`}),[]);
  useFrame((_,delta)=>{time.current+=Math.min(delta,.05);const t=time.current*.17;for(let i=0;i<count;i++){const phase=(i/count+t)%1;positions[i*3]=Math.sin(phase*9+i*.5)*(.07+phase*.18);positions[i*3+1]=1.65+phase*1.9;positions[i*3+2]=.1+Math.cos(phase*8+i)*.1;}points.current.geometry.attributes.position.needsUpdate=true});
  return <points ref={points} frustumCulled={false}><bufferGeometry><bufferAttribute attach="attributes-position" args={[positions,3]}/></bufferGeometry><shaderMaterial {...shader} transparent depthWrite={false} blending={THREE.AdditiveBlending}/></points>;
}
function Beans({progress,reduced,quality,pointer}){
  const beans=useRef(),seams=useRef();const count=quality.beans;
  const dummy=useMemo(()=>new THREE.Object3D(),[]);const seamDummy=useMemo(()=>new THREE.Object3D(),[]);const matrix=useMemo(()=>new THREE.Matrix4(),[]);
  const items=useMemo(()=>Array.from({length:count},(_,i)=>({angle:i*2.39996,radius:2.35+(i%4)*.65,height:((i*7)%17-8)*.39,size:.12+(i%3)*.025,speed:.035+(i%4)*.012})),[count]);
  const time=useRef(0);const smoothed=useRef(0), mouse=useRef({x:0,y:0});
  useFrame((_,delta)=>{delta=Math.min(delta,.05);time.current+=delta;const a=1-Math.exp(-delta*4);smoothed.current=lerp(smoothed.current,progress.get(),a);mouse.current.x=lerp(mouse.current.x,reduced?0:pointer.current.x,a);mouse.current.y=lerp(mouse.current.y,reduced?0:pointer.current.y,a);const scatter=ease(.75,1,smoothed.current);const t=reduced?0:time.current;
    items.forEach((item,i)=>{const angle=item.angle+t*item.speed;const r=item.radius+scatter*(1.5+i%3);dummy.position.set(Math.cos(angle)*r+mouse.current.x*.18, item.height+mouse.current.y*.12+Math.sin(t*.4+i)*.15+scatter*(3+i*.27),Math.sin(angle)*1.7-1.2);dummy.rotation.set(i*.3+t*.09,i*.7+t*.06,i*.8+t*.12);dummy.scale.set(item.size,item.size*1.48,item.size*.78);dummy.updateMatrix();beans.current.setMatrixAt(i,dummy.matrix);seamDummy.position.set(0,0,.86);seamDummy.rotation.set(0,0,.13);seamDummy.scale.set(.085,.87,.12);seamDummy.updateMatrix();matrix.multiplyMatrices(dummy.matrix,seamDummy.matrix);seams.current.setMatrixAt(i,matrix)});beans.current.instanceMatrix.needsUpdate=true;seams.current.instanceMatrix.needsUpdate=true;
  });
  return <group><instancedMesh ref={beans} args={[null,null,count]} frustumCulled={false}><sphereGeometry args={[1,16,10]}/><meshStandardMaterial color="#61361f" roughness={.44}/></instancedMesh><instancedMesh ref={seams} args={[null,null,count]} frustumCulled={false}><sphereGeometry args={[1,8,6]}/><meshStandardMaterial color="#170c07" roughness={1}/></instancedMesh></group>;
}
function Choreography({progress,flavor,reduced,quality,pointer}){
  const cup=useRef(),keyLight=useRef();const smooth=useRef(0);const {viewport,camera,size}=useThree();const mood=useMemo(()=>new THREE.Color(flavor.light),[flavor]);
  const time=useRef(0);
  useFrame((_,delta)=>{
    delta=Math.min(delta,.05);time.current+=delta;
    const a=reduced?1:1-Math.exp(-Math.min(delta,.1)*5);smooth.current=lerp(smooth.current,progress.get(),a);const p=smooth.current;
    const right=ease(.12,.25,p),left=ease(.37,.50,p),final=ease(.62,.75,p),pull=ease(.83,1,p);
    const mobile=size.width<=700;const spread=mobile?.68:2.3;
    const x=spread*(right-2*left+final);const mobileY=viewport.height*(.5-380/size.height);const finaleY=viewport.height*(.5-260/size.height);const y=mobile?lerp(lerp(0,mobileY,right),finaleY,final):final*.95;
    cup.current.position.x=lerp(cup.current.position.x,x,a);cup.current.position.y=lerp(cup.current.position.y,y+(reduced?0:Math.sin(time.current*.65)*.065),a);
    const scale=(mobile?Math.min(.58,viewport.height/8):1)*(1+right*.14-left*.12-final*(mobile?.48:.28)-pull*.08);cup.current.scale.setScalar(lerp(cup.current.scale.x,scale,a));
    cup.current.rotation.x=lerp(cup.current.rotation.x,.08+right*.12-left*.1+pointer.current.y*.045,a);
    cup.current.rotation.z=lerp(cup.current.rotation.z,-.13+right*(-.48)+left*.84-final*.32+pointer.current.x*.035,a);
    cup.current.rotation.y=lerp(cup.current.rotation.y,(reduced?0:Math.sin(time.current*.24)*.24)+pointer.current.x*.13,a);
    camera.position.x=lerp(camera.position.x,reduced?0:pointer.current.x*.22,a);camera.position.y=lerp(camera.position.y,.35+(reduced?0:pointer.current.y*.16),a);camera.position.z=lerp(camera.position.z,8.4+final*.55+pull*.6,a);camera.lookAt(0,.15,0);
    keyLight.current.color.lerp(mood,a);
  });
  return <><ambientLight intensity={.65}/><directionalLight position={[-3,5,4]} intensity={3.2} color="#fff0d5"/><spotLight ref={keyLight} position={[4,3,3]} intensity={48} angle={.7} penumbra={1} color={flavor.light}/><Environment resolution={64} frames={1}><Lightformer form="rect" intensity={4} color="#fff1da" scale={[4,8,1]} position={[-4,2,3]} rotation={[0,Math.PI/3,0]}/><Lightformer form="rect" intensity={2} color="#e1b68b" scale={[2,6,1]} position={[4,1,2]} rotation={[0,-Math.PI/3,0]}/><Lightformer form="ring" intensity={3} color="#fff4e2" scale={4} position={[0,5,-2]} rotation={[Math.PI/2,0,0]}/></Environment><group ref={cup}><ProceduralCup flavor={flavor} reduced={reduced} quality={quality}/></group><Beans progress={progress} reduced={reduced} quality={quality} pointer={pointer}/></>;
}

function Runtime({onReady,onError,reduced,ceiling}){
  const {gl,setDpr,setFrameloop}=useThree();
  const monitor=useMemo(()=>createQualityMonitor(ceiling,ceiling),[ceiling]);
  const rendered=useRef(false);
  useEffect(()=>{
    setDpr(ceiling);monitor.reset();
    const canvas=gl.domElement;
    const visibility=()=>{monitor.reset();setFrameloop(document.hidden?'never':'always')};
    const lost=e=>{e.preventDefault();setFrameloop('never');onError()};
    document.addEventListener('visibilitychange',visibility);
    canvas.addEventListener('webglcontextlost',lost);
    visibility();
    return()=>{document.removeEventListener('visibilitychange',visibility);canvas.removeEventListener('webglcontextlost',lost)};
  },[gl,setDpr,setFrameloop,monitor,ceiling,onError]);
  useFrame((_,delta)=>{
    // Second frame: the initial scene has actually been submitted to the renderer.
    if(rendered.current===1){onReady();rendered.current=2}else if(!rendered.current)rendered.current=1;
    if(!reduced){const next=monitor.sample(delta);if(next!==null)setDpr(next)}
  });
  return null;
}
export default function CoffeeScene({progress,flavor,reduced,onReady,onError}){
  const pointer=useRef({x:0,y:0});
  const [baseDpr]=useState(()=>initialDpr({pixelRatio:window.devicePixelRatio,cores:navigator.hardwareConcurrency,memory:navigator.deviceMemory}));
  const quality=reduced||baseDpr<=1?QUALITY.reduced:QUALITY.normal;
  useEffect(()=>{
    const query=matchMedia('(hover: hover) and (pointer: fine)');
    const move=e=>{if(reduced||!query.matches||e.pointerType==='touch')return;pointer.current.x=e.clientX/window.innerWidth*2-1;pointer.current.y=1-e.clientY/window.innerHeight*2};
    const reset=()=>{pointer.current.x=pointer.current.y=0};reset();
    window.addEventListener('pointermove',move,{passive:true});window.addEventListener('blur',reset);query.addEventListener('change',reset);
    return()=>{window.removeEventListener('pointermove',move);window.removeEventListener('blur',reset);query.removeEventListener('change',reset)};
  },[reduced]);
  return <Canvas camera={{position:[0,.35,8.4],fov:40,near:.1,far:60}} dpr={reduced?Math.min(1,baseDpr):baseDpr} gl={{antialias:true,alpha:true,powerPreference:'default'}} onCreated={({gl})=>{gl.setClearColor('#0D0A08',0);gl.toneMapping=THREE.ACESFilmicToneMapping;gl.toneMappingExposure=1.15}}>
    <Suspense fallback={null}><Choreography progress={progress} flavor={flavor} reduced={reduced} quality={quality} pointer={pointer}/><Runtime onReady={onReady} onError={onError} reduced={reduced} ceiling={reduced?Math.min(1,baseDpr):baseDpr}/></Suspense>
  </Canvas>;
}