import { useEffect, useRef, useState } from 'react';
import { useMotionValue } from 'framer-motion';
export const CHAPTER_IDS=['ritual','anatomy','flavors','visit'];
export function chapterPosition(y, stops){
  let chapter=0;
  while(chapter<3 && y>=stops[chapter+1]-.5)chapter++;
  const fraction=Math.max(0,Math.min(1,(y-stops[chapter])/Math.max(1,stops[chapter+1]-stops[chapter])));
  return {chapter,progress:(chapter+fraction)/4};
}
export function useChapters(root){
  const progress=useMotionValue(0),stops=useRef([0,1,2,3,4]),active=useRef(0);
  const [chapter,setChapter]=useState(0);
  useEffect(()=>{
    const sections=CHAPTER_IDS.map(id=>document.getElementById(id));
    const sticky=document.querySelector('.finale-sticky');
    const update=()=>{
      const next=chapterPosition(window.scrollY,stops.current);
      progress.set(next.progress);
      if(next.chapter!==active.current){active.current=next.chapter;setChapter(next.chapter);}
    };
    let frame;
    const measure=()=>{
      cancelAnimationFrame(frame);
      frame=requestAnimationFrame(()=>{
        sticky.style.setProperty('--sticky-top',`${Math.min(0,window.innerHeight-sticky.offsetHeight)}px`);
        stops.current=[...sections.map(el=>el.getBoundingClientRect().top+window.scrollY),Math.max(1,document.documentElement.scrollHeight-window.innerHeight)];
        update();
      });
    };
    const observer=new ResizeObserver(measure);
    observer.observe(root.current);observer.observe(sticky);sections.forEach(el=>observer.observe(el));
    window.addEventListener('scroll',update,{passive:true});
    window.addEventListener('resize',measure);window.visualViewport?.addEventListener('resize',measure);
    measure();
    return()=>{observer.disconnect();cancelAnimationFrame(frame);window.removeEventListener('scroll',update);window.removeEventListener('resize',measure);window.visualViewport?.removeEventListener('resize',measure)};
  },[progress,root]);
  return {progress,chapter,goTo(i,reduced){window.scrollTo({top:stops.current[i],behavior:reduced?'instant':'smooth'})}};
}
export function useEffectsPreference(){
  const [reduced,setReduced]=useState(()=>{try{return localStorage.getItem('aether-reduced-effects')==='true'}catch{return false}});
  useEffect(()=>{try{localStorage.setItem('aether-reduced-effects',String(reduced))}catch{/* Storage can be disabled. */}},[reduced]);
  return [reduced,setReduced];
}

export function useMotionPreference(){
  const [reduced,setReduced]=useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(()=>{const query=matchMedia('(prefers-reduced-motion: reduce)');const update=()=>setReduced(query.matches);update();query.addEventListener('change',update);return()=>query.removeEventListener('change',update)},[]);
  return reduced;
}
