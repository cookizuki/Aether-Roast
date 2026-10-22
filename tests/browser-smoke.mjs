// Run a production preview on 4173 and isolated Chrome with remote debugging on 9223 first.
const pages=await (await fetch('http://localhost:9223/json')).json();
const ws=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));let id=0;const pending=new Map(),errors=[];
ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result)}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails);else if(m.method==='Runtime.consoleAPICalled')console.log('console',JSON.stringify(m.params.args));else if(m.method==='Log.entryAdded')console.log('log',JSON.stringify(m.params.entry))};
const send=(method,params={})=>new Promise((resolve,reject)=>{pending.set(++id,{resolve,reject});ws.send(JSON.stringify({id,method,params}))});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const evaluate=async expression=>(await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true})).result?.value;
await send('Log.enable');await send('Runtime.enable');await send('Page.enable');await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});await send('Page.navigate',{url:'http://localhost:4173'});await wait(7000);
console.log('desktop',await evaluate(`({status:document.querySelector('[role=status]').textContent,canvas:!!document.querySelector('canvas'),width:document.documentElement.scrollWidth})`));
for(let i=0;i<4;i++){await evaluate(`document.querySelectorAll('.chapter-rail button')[${i}].click()`);await wait(1500);console.log('chapter',i,await evaluate(`({active:document.querySelector('.chapter-rail [aria-current]').ariaLabel,y:scrollY,section:document.querySelectorAll('main>section')[${i}].getBoundingClientRect().top})`))}
await evaluate(`document.querySelectorAll('.chapter-rail button')[2].click()`);await wait(1500);
for(let i=0;i<3;i++){await evaluate(`document.querySelectorAll('.tilt-card')[${i}].click()`);await wait(300);console.log('flavor',await evaluate(`document.querySelector('.tilt-card[aria-pressed=true]').ariaLabel`))}
await evaluate(`document.querySelector('.effects-controls button').click()`);await wait(500);console.log('reduced',await evaluate(`({pressed:document.querySelector('.effects-controls button').ariaPressed,saved:localStorage.getItem('aether-reduced-effects')})`));
await send('Emulation.setDeviceMetricsOverride',{width:390,height:667,deviceScaleFactor:2,mobile:true});await wait(1500);
for(let i=0;i<4;i++){await evaluate(`document.querySelectorAll('.chapter-rail button')[${i}].click()`);await wait(1500);console.log('mobile',i,await evaluate(`({width:document.documentElement.scrollWidth,y:scrollY,top:document.querySelectorAll('main>section')[${i}].getBoundingClientRect().top,chapter:document.querySelector('.chapter-rail [aria-current]').ariaLabel})`))}

await evaluate(`document.querySelector('canvas').getContext('webgl2').getExtension('WEBGL_lose_context').loseContext()`);await wait(1000);console.log('loss',await evaluate(`document.querySelector('[role=status]').textContent`));
await evaluate(`document.querySelectorAll('.effects-controls button')[1].click()`);await wait(3000);console.log('retry',await evaluate(`document.querySelector('[role=status]').textContent`));await send('Emulation.setDeviceMetricsOverride',{width:667,height:390,deviceScaleFactor:1,mobile:true});await wait(1000);
await evaluate(`window.scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'})`);await wait(500);
console.log('landscape',await evaluate(`({width:document.documentElement.scrollWidth,footerBottom:document.querySelector('footer').getBoundingClientRect().bottom,height:innerHeight,chapter:document.querySelector('.chapter-rail [aria-current]').ariaLabel})`));
await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await wait(500);
console.log('motion preference',await evaluate(`document.querySelector('.experience').dataset.reduced`));
console.log('errors',errors);if(errors.length)process.exitCode=1;ws.close();

