import test from 'node:test';
import assert from 'node:assert/strict';
import {initialDpr,createQualityMonitor} from '../src/quality.js';
import {chapterPosition} from '../src/experience.js';
test('quality uses conservative hardware caps',()=>{assert.equal(initialDpr({pixelRatio:3,cores:4}),1);assert.equal(initialDpr({pixelRatio:3,cores:8}),1.25)});
test('sustained pressure reduces DPR; cooldown prevents oscillation; recovery is slower',()=>{
 const monitor=createQualityMonitor(1.25);let changes=[];
 for(let i=0;i<260;i++){const v=monitor.sample(1/30);if(v!==null)changes.push(v)}
 assert.deepEqual(changes,[1]);
 for(let i=0;i<120;i++)assert.equal(monitor.sample(1/60),null);
 for(let i=0;i<1500;i++){const v=monitor.sample(1/60);if(v!==null)changes.push(v)}
 assert.deepEqual(changes,[1,1.25]);
});
test('resume gap does not count as sustained pressure',()=>{const m=createQualityMonitor(1);assert.equal(m.sample(4),null);for(let i=0;i<120;i++)assert.equal(m.sample(1/60),null)});
test('unequal chapter heights share navigation and scene boundaries',()=>{
 const stops=[0,680,1502,2390,3057];
 for(let i=0;i<4;i++)assert.deepEqual(chapterPosition(stops[i],stops),{chapter:i,progress:i/4});
 assert.equal(chapterPosition(3057,stops).progress,1);assert.equal(chapterPosition(9999,stops).progress,1);
 assert.equal(chapterPosition(-50,stops).progress,0);
 assert.equal(chapterPosition(1091,stops).progress,.375);
});
