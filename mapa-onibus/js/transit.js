/* Motor da simulação de ônibus e modelos 3D. Dados em data/transit.json.gz. */
(function(root){
 'use strict';
 const DAY_NAMES=['Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado','Domingo'];
 const table=day=>((day%7+7)%7)<5?'DU':((day%7+7)%7)===5?'SAB':'DOM';
 const special=s=>/(^|[^A-Za-zÀ-ÿ])ESP([^A-Za-zÀ-ÿ]|$)/i.test(s.v||'');
 const directionCode=s=>(/_(\d)$/.exec(s.sid||'')||[])[1]||'';
 class TransitEngine{
  constructor(data){this.data=data;this.lines=new Map();this.trips={DU:[],SAB:[],DOM:[]};this.ratios={};this.stopCache=new Map();
   for(const l of data.linhas)for(const s of l.shapes)if(!special(s)&&s.g?.m>0&&s.d>0)for(const key of ['L|'+l.id+'|'+directionCode(s),'G|'+directionCode(s),'G|*'])(this.ratios[key]??=[]).push(s.g.m/s.d);
   Object.values(this.ratios).forEach(v=>v.sort((a,b)=>a-b));
   for(const l of data.linhas){this.lines.set(String(l.id),l);for(const s of l.shapes){s.cum=[0];const scale=111320*Math.cos(s.p[0][0]*Math.PI/180);for(let i=1;i<s.p.length;i++)s.cum.push(s.cum.at(-1)+Math.hypot((s.p[i][1]-s.p[i-1][1])*scale,(s.p[i][0]-s.p[i-1][0])*110540));}
    for(const day of ['DU','SAB','DOM'])for(const [dir,rows]of Object.entries(l.dep[day]||{}))rows.forEach(([raw,index],ordinal)=>{const shape=l.shapes[index];if(!shape||special(shape))return;const start=(raw<180?raw+1440:raw)*60,duration=this.duration(shape,l,day,start/60)*60;
     this.trips[day].push({id:[day,l.id,dir,ordinal].join(':'),line:String(l.id),name:l.nome,dir,index,shape,start,duration,end:start+duration});});
   }
   Object.values(this.trips).forEach(v=>v.sort((a,b)=>a.start-b.start));
  }
  duration(s,l,day,m){const n=m%1440,band=n<300?3:n<540?0:n<960?1:n<1170?2:3,g=s.g;
   if(g?.d?.[day]?.[band]>0)return g.d[day][band];if(g?.m>0)return g.m;
   if(s.d>0){const a=this.ratios['L|'+l.id+'|'+directionCode(s)],b=this.ratios['G|'+directionCode(s)],c=this.ratios['G|*'],v=a?.length>=2?a:b?.length>=4?b:c?.length>=4?c:null;return s.d*(v?v[Math.round((v.length-1)*.5)]:1);}
   return s.cum.at(-1)/1000/20*60;
  }
  timeFraction(shape,f){f=Math.max(0,Math.min(1,f));const q=shape.g?.p;if(!q)return f;const x=f*10,i=Math.min(9,Math.floor(x));return(q[i]+(q[i+1]-q[i])*(x-i))/1000;}
  distanceFraction(shape,t){t=Math.max(0,Math.min(1,t));const q=shape.g?.p;if(!q)return t;let i=0;while(i<9&&q[i+1]<t*1000)i++;return Math.max(0,Math.min(1,(i+(t*1000-q[i])/(q[i+1]-q[i]||1))/10));}
  position(shape,f){const d=shape.cum.at(-1)*f;let lo=1,hi=shape.cum.length-1;while(lo<hi){const mid=(lo+hi)>>1;if(shape.cum[mid]<d)lo=mid+1;else hi=mid;}let i=lo;const a=shape.p[i-1],b=shape.p[i],frac=(d-shape.cum[i-1])/(shape.cum[i]-shape.cum[i-1]||1),dx=(b[1]-a[1])*Math.cos(a[0]*Math.PI/180),dy=b[0]-a[0];return{coordinates:[a[1]+frac*(b[1]-a[1]),a[0]+frac*(b[0]-a[0])],heading:Math.atan2(dx,dy)*180/Math.PI};}
  active(day,second){const output=[];for(const offset of [-1,0]){const key=table(day+offset);for(const t of this.trips[key]){const start=t.start+offset*86400,end=t.end+offset*86400;if(start>second)break;if(end<=second)continue;const progress=(second-start)/t.duration,fraction=this.distanceFraction(t.shape,progress);output.push({...t,id:offset+':'+t.id,start,end,progress,fraction,...this.position(t.shape,fraction)});}}return output;}
  along(shape,stop){const lat=stop[0],lon=stop[1],kx=111320*Math.cos(lat*Math.PI/180);let best=Infinity,f=0;for(let i=1;i<shape.p.length;i++){const a=shape.p[i-1],b=shape.p[i],ax=(a[1]-lon)*kx,ay=(a[0]-lat)*110540,dx=(b[1]-a[1])*kx,dy=(b[0]-a[0])*110540,t=Math.max(0,Math.min(1,-(ax*dx+ay*dy)/(dx*dx+dy*dy||1))),dist=Math.hypot(ax+t*dx,ay+t*dy);if(dist<best){best=dist;f=(shape.cum[i-1]+t*(shape.cum[i]-shape.cum[i-1]))/(shape.cum.at(-1)||1);}}return{f,distance:best};}
  stopsFor(trip){const key=[trip.line,trip.index,trip.dir].join(':');if(this.stopCache.has(key))return this.stopCache.get(key);const list=[];this.data.stops.forEach((s,id)=>{const idx=s[3].findIndex(v=>String(v)===trip.line);if(idx<0)return;if(s[5]?.[idx]&&s[5][idx]!==trip.dir)return;const a=this.along(trip.shape,s);if(a.distance<=60)list.push({id,name:s[2]||s[4]||'Parada '+(id+1),f:a.f});});list.sort((a,b)=>a.f-b.f);this.stopCache.set(key,list);return list;}
  nextStop(trip,second){for(const stop of this.stopsFor(trip)){const eta=trip.start+trip.duration*this.timeFraction(trip.shape,stop.f);if(eta>=second)return{...stop,eta};}return null;}
  arrivals(stopId,day,second){const s=this.data.stops[stopId],allowed=new Set(s[3].map(String)),cache=new Map(),result=[];for(const offset of [-1,0,1])for(const t of this.trips[table(day+offset)]){if(!allowed.has(t.line))continue;const idx=s[3].findIndex(v=>String(v)===t.line);if(s[5]?.[idx]&&s[5][idx]!==t.dir)continue;const key=t.line+':'+t.index;let a=cache.get(key);if(!a){a=this.along(t.shape,s);cache.set(key,a);}if(a.distance>60)continue;const eta=t.start+offset*86400+t.duration*this.timeFraction(t.shape,a.f);if(eta>=second&&eta<=second+7200)result.push({line:t.line,name:t.name,eta,dir:t.dir});}return result.sort((a,b)=>a.eta-b.eta).slice(0,6);}
 }
 const formatTime=seconds=>{const n=((Math.floor(seconds)%86400)+86400)%86400;return[Math.floor(n/3600),Math.floor(n/60)%60,n%60].map(v=>String(v).padStart(2,'0')).join(':');};
 const api={TransitEngine,DAY_NAMES,table,formatTime};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.FozTransit=api;
})(typeof globalThis!=='undefined'?globalThis:this);

(function(root){
 function model(){const out=[];
  function face(p,color){const c=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16)/255),a=p[0],u=p[1].map((x,i)=>x-a[i]),v=p[2].map((x,i)=>x-a[i]);let n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],d=Math.hypot(...n);n=n.map(x=>x/d);for(let i=1;i<p.length-1;i++)for(const q of [a,p[i],p[i+1]])out.push(...q,...n,...c);}
  function box(x,y,z,w,l,h,c){const a=x-w/2,b=x+w/2,d=y-l/2,e=y+l/2,f=z+h;face([[a,d,f],[b,d,f],[b,e,f],[a,e,f]],c);face([[a,d,z],[b,d,z],[b,d,f],[a,d,f]],c);face([[b,e,z],[a,e,z],[a,e,f],[b,e,f]],c);face([[a,e,z],[a,d,z],[a,d,f],[a,e,f]],c);face([[b,d,z],[b,e,z],[b,e,f],[b,d,f]],c);}
  // Open front faces +Y; roof width lies along X, parallel to the street.
  box(0,0,.02,8.8,3.4,.13,'#c9c4af');box(-.3,0,2.8,7.4,3.3,.22,'#275d46');box(-.3,0,3.02,7.15,3.05,.12,'#e9e0bf');
  for(const x of [-3.6,-.3,3]){box(x,-1.25,.15,.15,.15,2.65,'#315947');box(x,1.25,.15,.15,.15,2.65,'#315947');}
  box(-.3,-1.28,.6,6.5,.09,1.95,'#779f9b');box(-.3,-1.35,.3,6.5,.12,.32,'#325b46');
  for(const x of [-2.45,1.75]){box(x,-.55,.15,.16,.7,.55,'#335448');}
  for(const y of [-.8,-.55,-.3])box(-.3,y,.7,4.9,.18,.1,'#ae9061');for(const zz of [.98,1.2])box(-.3,-.85,zz,4.9,.1,.16,'#ae9061');
  box(-3.5,-.4,1.1,.12,1.35,1.35,'#e7dfbe');box(-3.57,-.4,1.3,.025,.95,.9,'#52766a');
  box(4,1,.15,.12,.12,3.05,'#d7cfb3');box(4,1,2.55,.75,.16,.75,'#315e45');box(4,1.1,2.74,.49,.04,.3,'#eee8cd');for(const x of [3.84,4.16])box(x,1.13,2.68,.08,.04,.08,'#eee8cd');
  return new Float32Array(out);
 }
 root.FozShelter3D={model};if(typeof module!=='undefined')module.exports=root.FozShelter3D;
})(typeof window!=='undefined'?window:globalThis);

(function(root){
 'use strict';
 // Local axes: x right, y forward, z up. Dimensions in metres.
 function model(){
  const vertices=[];
  const rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255);
  function face(points,color){const c=rgb(color),a=points[0],b=points[1],d=points[2],u=b.map((v,i)=>v-a[i]),v=d.map((v,i)=>v-a[i]);let n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],l=Math.hypot(...n);n=n.map(x=>x/l);for(let i=1;i<points.length-1;i++)for(const p of [a,points[i],points[i+1]])vertices.push(...p,...n,...c);}
  function box(x,y,z,w,l,h,c){const a=x-w/2,b=x+w/2,d=y-l/2,e=y+l/2,f=z+h;
   face([[a,d,z],[a,e,z],[b,e,z],[b,d,z]],c);face([[a,d,f],[b,d,f],[b,e,f],[a,e,f]],c);
   face([[a,d,z],[b,d,z],[b,d,f],[a,d,f]],c);face([[b,e,z],[a,e,z],[a,e,f],[b,e,f]],c);
   face([[a,e,z],[a,d,z],[a,d,f],[a,e,f]],c);face([[b,d,z],[b,e,z],[b,e,f],[b,d,f]],c);
  }
  function wheel(x,y){const n=16,r=.49,z=.53,half=.14;for(let i=0;i<n;i++){const a=i*2*Math.PI/n,b=(i+1)*2*Math.PI/n;face([[x-half,y+Math.cos(a)*r,z+Math.sin(a)*r],[x+half,y+Math.cos(a)*r,z+Math.sin(a)*r],[x+half,y+Math.cos(b)*r,z+Math.sin(b)*r],[x-half,y+Math.cos(b)*r,z+Math.sin(b)*r]],'#202b2b');}
   for(const side of [-1,1]){const xx=x+side*(half+.005),points=Array.from({length:n},(_,i)=>{const a=side*i*2*Math.PI/n;return [xx,y+Math.cos(a)*r,z+Math.sin(a)*r];});face(points,'#28312e');const hub=Array.from({length:n},(_,i)=>{const a=side*i*2*Math.PI/n;return [xx+side*.012,y+Math.cos(a)*.26,z+Math.sin(a)*.26];});face(hub,'#a9afa2');box(xx+side*.025,y,z-.08,.025,.16,.16,'#59645e');}
  }
  box(0,0,.52,2.42,11.8,2.45,'#eee5c8');
  box(0,0,.58,2.46,11.84,1.06,'#235b46');
  box(0,0,1.58,2.48,11.86,.13,'#c5a15d');
  box(0,0,1.74,2.45,11.83,.94,'#253e44');
  // Window mullions, side reflections, and the two right-hand doors.
  for(const side of [-1,1]){
   for(let y=-5.2;y<5.6;y+=1.35){box(side*1.237,y,1.72,.035,.095,1.06,'#ded6b9');box(side*1.24,y+.15,2.46,.035,1.04,.045,'#76979a');}
   box(side*1.238,0,2.69,.035,11.5,.15,'#eee5c8');
  }
  for(const y of [4.35,-.9]){box(1.25,y,.6,.04,1.12,2.13,'#192f31');for(const dy of [-.28,.28]){box(1.278,y+dy,.87,.025,.48,1.61,'#3d5b60');box(1.297,y+dy,1.05,.02,.42,.035,'#9caa9e');}box(1.3,y,.66,.02,1.1,.07,'#b9b7a3');}
  // Wide front windshield and rear window with frames.
  box(0,5.94,1.76,2.13,.04,.79,'#354f57');box(0,5.967,2.36,1.94,.025,.055,'#86aaa8');box(0,5.97,1.76,.045,.03,.77,'#d4cbb1');
  box(0,-5.94,1.9,1.94,.04,.61,'#344d53');
  box(0,5.97,2.58,1.55,.04,.25,'#172a27');
  // Small amber destination marks, readable as a display at city scale.
  box(-.18,6,2.63,.035,.015,.13,'#efd38a');for(const x of [.02,.16])box(x,6,2.63,.026,.015,.13,'#efd38a');for(const z of [2.63,2.74])box(.09,6,z,.15,.015,.025,'#efd38a');
  box(0,0,2.83,2.5,11.86,.17,'#f3e9cc');box(0,0,3,2.24,11.48,.12,'#eee5c8');
  box(0,-.5,3.12,1.3,2.35,.21,'#d5d2bc');box(0,-.5,3.33,1.15,2.12,.04,'#e7e1ca');
  for(let y=-1.35;y<.4;y+=.19)box(0,y,3.375,.87,.045,.015,'#8c9c91');box(0,3.45,3.12,.67,.72,.07,'#b7bfaf');
  for(const side of [-1,1]){wheel(side*1.2,3.65);wheel(side*1.2,-3.65);box(side*1.34,4.98,2.12,.24,.16,.07,'#293f38');box(side*1.49,5.04,2.12,.12,.36,.37,'#334c46');box(side*1.49,5.23,2.17,.09,.018,.25,'#83a0a0');
   box(side*.89,5.94,.96,.4,.05,.19,'#f3edb5');box(side*.94,-5.95,1.05,.19,.05,.36,'#b94f39');}
  box(0,5.96,.62,2.49,.15,.19,'#234836');box(0,-5.96,.62,2.49,.15,.19,'#234836');box(0,6.05,.98,.74,.02,.28,'#1f3c33');for(let z=1.02;z<1.25;z+=.07)box(0,6.065,z,.63,.01,.018,'#829084');
  return new Float32Array(vertices);
 }
 function createLayer(map,options={}){
  const mesh=options.mesh||model(),anchor=[-54.58,-25.53],matrixBuffer=new Float32Array(16);
  let gl,program,meshBuffer,instanceBuffer,origin,unit,instancing,dirty=true,current=[],viewKey='',capacity=32,instances=new Float32Array(128),count=0;
  const stats={modelBytes:mesh.byteLength,uploadedBytes:0,visible:0,active:0,drawCalls:0};
  let enabled=options.visible!==false;
  const layer={id:options.id||'sim-bus-icons',type:'custom',renderingMode:'3d',stats,
   onAdd(m,g){gl=g;origin=root.maplibregl.MercatorCoordinate.fromLngLat(anchor);unit=origin.meterInMercatorCoordinateUnits();
    function shader(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
    program=gl.createProgram();const vertex=shader(gl.VERTEX_SHADER,'precision highp float; attribute vec3 a_pos; attribute vec3 a_normal; attribute vec3 a_color; attribute vec4 a_instance; uniform mat4 u_matrix; uniform float u_scale; varying vec3 v_color; void main(){float c=a_instance.z;float s=a_instance.w;vec3 p=vec3(a_pos.x*c+a_pos.y*s,a_pos.x*s-a_pos.y*c,a_pos.z)*u_scale+vec3(a_instance.xy,0.0);vec3 n=vec3(a_normal.x*c+a_normal.y*s,a_normal.x*s-a_normal.y*c,a_normal.z);float light=0.65+0.35*max(dot(normalize(n),normalize(vec3(-0.5,0.3,0.85))),0.0);v_color=a_color*light;gl_Position=u_matrix*vec4(p,1.0);}'),fragment=shader(gl.FRAGMENT_SHADER,'precision mediump float; varying vec3 v_color; void main(){gl_FragColor=vec4(v_color,1.0);}');
    gl.attachShader(program,vertex);gl.attachShader(program,fragment);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.deleteShader(vertex);gl.deleteShader(fragment);
    meshBuffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,meshBuffer);gl.bufferData(gl.ARRAY_BUFFER,mesh,gl.STATIC_DRAW);
    instanceBuffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,instanceBuffer);gl.bufferData(gl.ARRAY_BUFFER,instances.byteLength,gl.DYNAMIC_DRAW);
    layer.attributes=['a_pos','a_normal','a_color'].map(n=>gl.getAttribLocation(program,n));layer.instance=gl.getAttribLocation(program,'a_instance');layer.matrix=gl.getUniformLocation(program,'u_matrix');layer.scale=gl.getUniformLocation(program,'u_scale');
    const ext=gl.drawArraysInstanced?null:gl.getExtension('ANGLE_instanced_arrays');instancing=gl.drawArraysInstanced?{divisor:(a,n)=>gl.vertexAttribDivisor(a,n),draw:n=>gl.drawArraysInstanced(gl.TRIANGLES,0,mesh.length/9,n)}:ext?{divisor:(a,n)=>ext.vertexAttribDivisorANGLE(a,n),draw:n=>ext.drawArraysInstancedANGLE(gl.TRIANGLES,0,mesh.length/9,n)}:null;
   },
   setVisible(value){enabled=value;map.triggerRepaint();},
   setBuses(buses){current=buses;dirty=true;map.triggerRepaint();},
   render(g,matrix){
    if(!enabled||map.getZoom()<(options.minzoom||0)){stats.visible=0;return;}
    const bounds=map.getBounds(),key=[bounds.getWest(),bounds.getSouth(),bounds.getEast(),bounds.getNorth()].join(',');if(key!==viewKey){viewKey=key;dirty=true;}
    if(dirty){const margin=options.margin??.015,visible=current.filter(b=>b.coordinates[0]>=bounds.getWest()-margin&&b.coordinates[0]<=bounds.getEast()+margin&&b.coordinates[1]>=bounds.getSouth()-margin&&b.coordinates[1]<=bounds.getNorth()+margin);count=visible.length;gl.bindBuffer(gl.ARRAY_BUFFER,instanceBuffer);if(count>capacity){while(capacity<count)capacity*=2;instances=new Float32Array(capacity*4);gl.bufferData(gl.ARRAY_BUFFER,instances.byteLength,gl.DYNAMIC_DRAW);}let i=0;for(const b of visible){const p=root.maplibregl.MercatorCoordinate.fromLngLat(b.coordinates),r=b.heading*Math.PI/180;instances[i++]=(p.x-origin.x)/unit;instances[i++]=(p.y-origin.y)/unit;instances[i++]=Math.cos(r);instances[i++]=Math.sin(r);}if(count)gl.bufferSubData(gl.ARRAY_BUFFER,0,instances.subarray(0,count*4));stats.uploadedBytes=count*16;stats.visible=count;stats.active=current.length;dirty=false;}
    if(!count){stats.drawCalls=0;return;}gl.useProgram(program);
    for(let row=0;row<4;row++){matrixBuffer[row]=matrix[row]*unit;matrixBuffer[4+row]=matrix[4+row]*unit;matrixBuffer[8+row]=matrix[8+row]*unit;matrixBuffer[12+row]=matrix[row]*origin.x+matrix[4+row]*origin.y+matrix[12+row];}gl.uniformMatrix4fv(layer.matrix,false,matrixBuffer);gl.uniform1f(layer.scale,options.scale||1.5*Math.min(45,Math.max(1,Math.pow(2,16.8-map.getZoom()))));
    gl.bindBuffer(gl.ARRAY_BUFFER,meshBuffer);layer.attributes.forEach((a,i)=>{gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,3,gl.FLOAT,false,36,i*12);});gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.depthMask(true);gl.disable(gl.CULL_FACE);gl.disable(gl.BLEND);
    if(instancing){gl.bindBuffer(gl.ARRAY_BUFFER,instanceBuffer);gl.enableVertexAttribArray(layer.instance);gl.vertexAttribPointer(layer.instance,4,gl.FLOAT,false,16,0);instancing.divisor(layer.instance,1);instancing.draw(count);instancing.divisor(layer.instance,0);gl.disableVertexAttribArray(layer.instance);stats.drawCalls=1;}
    else{gl.disableVertexAttribArray(layer.instance);for(let i=0;i<count;i++){const j=i*4;gl.vertexAttrib4f(layer.instance,instances[j],instances[j+1],instances[j+2],instances[j+3]);gl.drawArrays(gl.TRIANGLES,0,mesh.length/9);}stats.drawCalls=count;}
   },onRemove(){gl.deleteBuffer(meshBuffer);gl.deleteBuffer(instanceBuffer);gl.deleteProgram(program);}
  };return layer;
 }
 root.FozBus3D={model,createLayer};if(typeof module!=='undefined')module.exports=root.FozBus3D;
})(typeof window!=='undefined'?window:globalThis);

/* Calendar-month kilometres and tiered operating cost. Source: Foztrans,
   Fechamento 43, September 2026, p.3. Published rates have finite precision. */
(function(root){
 'use strict';
 const LIMIT=500000,RATE1=11.0870953,RATE2=9.369481,DAY=86400;
 const SOURCE='https://www.foztrans.pr.gov.br/wp-content/uploads/2026/11/Prest.-contas-43.pdf';
 const daysInMonth=(year,month)=>new Date(Date.UTC(year,month,0)).getUTCDate();
 const weekday=(year,month,date)=>(new Date(Date.UTC(year,month-1,date)).getUTCDay()+6)%7;
 const table=d=>d<5?'DU':d===5?'SAB':'DOM';
 const cost=km=>Math.min(Math.max(0,km),LIMIT)*RATE1+Math.max(0,km-LIMIT)*RATE2;
 class MonthLedger{
  constructor(engine,year,month){
   this.engine=engine;this.year=year;this.month=month;this.days=daysInMonth(year,month);this.end=this.days*DAY;this.trips=[];
   // Include overnight service from the previous month, billing only the
   // distance actually travelled inside this calendar month.
   for(let day=-1;day<this.days;day++)for(const trip of engine.trips[table(weekday(year,month,day+1))]){
    const start=day*DAY+trip.start,end=start+trip.duration;if(end<=0||start>=this.end)continue;
    const item={trip,start,end,km:trip.shape.cum.at(-1)/1000};item.before=this.fraction(item,0);this.trips.push(item);
   }
   this.trips.sort((a,b)=>a.start-b.start);
   this.totalKm=this.kmAt(this.end);this.totalCost=cost(this.totalKm);this.crossing=null;
   if(this.totalKm>=LIMIT){let lo=0,hi=this.end;for(let i=0;i<48;i++){const mid=(lo+hi)/2;if(this.kmAt(mid)<LIMIT)lo=mid;else hi=mid;}this.crossing=(lo+hi)/2;}
   this.daily=[];let prior=0;for(let day=1;day<=this.days;day++){const km=this.kmAt(day*DAY);this.daily.push({day,km:km-prior,kmTotal:km,cost:cost(km)-cost(prior),costTotal:cost(km),km1:Math.min(km,LIMIT)-Math.min(prior,LIMIT),km2:Math.max(0,km-LIMIT)-Math.max(0,prior-LIMIT)});prior=km;}
  }
  fraction(item,time){return this.engine.distanceFraction(item.trip.shape,(time-item.start)/item.trip.duration);}
  kmAt(time){time=Math.max(0,Math.min(this.end,time));if(time===0)return 0;let km=0;for(const item of this.trips){if(item.start>=time)break;km+=item.km*(this.fraction(item,time)-item.before);}return Math.max(0,km);}
  snapshot(time){const km=this.kmAt(time);return{km,cost:cost(km),km1:Math.min(km,LIMIT),km2:Math.max(0,km-LIMIT),rate:km<LIMIT-1e-7?RATE1:RATE2,remaining:Math.max(0,LIMIT-km)};}
  part(item,from,to){from=Math.max(0,from);to=Math.min(this.end,to);if(to<=from)return{km:0,cost:0,km1:0,km2:0};const a=this.fraction(item,from),b=this.fraction(item,to),split=this.crossing===null?b:this.fraction(item,Math.max(from,Math.min(to,this.crossing))),km1=Math.max(0,(split-a)*item.km),km2=Math.max(0,(b-split)*item.km);return{km:km1+km2,cost:km1*RATE1+km2*RATE2,km1,km2};}
  tripInfo(active,date,second){const now=(date-1)*DAY+second,item={trip:active,start:(date-1)*DAY+active.start,km:active.shape.cum.at(-1)/1000};const current=this.part(item,0,now);let previous={km:0,cost:0};
   if(item.start<0){if(!this.previous){const month=this.month===1?12:this.month-1,year=this.month===1?this.year-1:this.year;this.previous=new MonthLedger(this.engine,year,month);}const past={...item,start:item.start+this.previous.end};previous=this.previous.part(past,past.start,this.previous.end);}
   return{km:current.km+previous.km,cost:current.cost+previous.cost,monthKm:current.km,monthCost:current.cost,previousKm:previous.km,km1:current.km1,km2:current.km2,totalKm:item.km};
  }
  rowsAt(time){time=Math.max(0,Math.min(this.end,time));let prior=0;return this.daily.map(row=>{const dayStart=(row.day-1)*DAY,dayEnd=row.day*DAY,km=time>=dayEnd?row.kmTotal:time<=dayStart?prior:this.kmAt(time),result={...row,km:km-prior,kmTotal:km,cost:cost(km)-cost(prior),costTotal:cost(km),km1:Math.min(km,LIMIT)-Math.min(prior,LIMIT),km2:Math.max(0,km-LIMIT)-Math.max(0,prior-LIMIT),status:time>=dayEnd?'Concluído':time>dayStart?'Parcial':'A percorrer'};prior=km;return result;});}
 }
 const api={MonthLedger,cost,daysInMonth,weekday,LIMIT,RATE1,RATE2,SOURCE};if(typeof module!=='undefined')module.exports=api;else root.FozCosts=api;
})(typeof globalThis!=='undefined'?globalThis:this);

/* Live view: local wall-clock time is the only source of simulation time. */
(function(){
 'use strict';
 const state={ready:false,year:0,month:0,date:0,day:0,second:0,active:[]};
 let engine,map,busLayer,booting=false,frameId=null,lastDraw=-Infinity,lastMarkers=-Infinity;
 const empty=()=>({type:'FeatureCollection',features:[]});
 function syncClock(){
  const now=new Date();
  state.year=now.getFullYear();state.month=now.getMonth()+1;state.date=now.getDate();
  state.day=(now.getDay()+6)%7;
  state.second=now.getHours()*3600+now.getMinutes()*60+now.getSeconds()+now.getMilliseconds()/1000;
 }
 function render(force=false){
  if(!state.ready)return;
  syncClock();
  state.active=engine.active(state.day,state.second);
  busLayer.setBuses(state.active);
  const now=performance.now();
  if(force||now-lastMarkers>=250){
   lastMarkers=now;
   map.getSource('sim-buses').setData({type:'FeatureCollection',features:state.active.map(t=>({type:'Feature',id:t.id,properties:{trip:t.id,line:t.line,heading:t.heading},geometry:{type:'Point',coordinates:t.coordinates}}))});
  }
 }
 function frame(now){
  frameId=null;
  if(document.hidden||!state.ready)return;
  if(now-lastDraw>=1000/30){lastDraw=now;render();}
  frameId=requestAnimationFrame(frame);
 }
 function stop(){if(frameId!==null)cancelAnimationFrame(frameId);frameId=null;}
 function resume(){
  stop();
  if(document.hidden||!state.ready)return;
  render(true);lastDraw=performance.now();frameId=requestAnimationFrame(frame);
 }
 async function start(){
  if(booting)return;booting=true;
  try{
   map=window.__FOZ_CITY_SIM__.map;
   const data=await fetchGzipJson('data/transit.json.gz');
   engine=new FozTransit.TransitEngine(data);
   map.addSource('sim-buses',{type:'geojson',data:empty()});
   busLayer=FozBus3D.createLayer(map);map.addLayer(busLayer);
   map.addLayer({id:'sim-bus-labels',type:'symbol',source:'sim-buses',minzoom:12,layout:{'text-field':['get','line'],'text-font':['Noto Sans Regular'],'text-size':11,'text-offset':[0,1.7],'text-anchor':'top','text-allow-overlap':false,'text-ignore-placement':false},paint:{'text-color':'#213e32','text-halo-color':'#fffae5','text-halo-width':2}});
   state.ready=true;
   // Read-only integration point for future site modules.
   window.__FOZ_TRANSIT__={snapshot:()=>({year:state.year,month:state.month,date:state.date,day:state.day,time:FozTransit.formatTime(state.second),second:state.second,active:state.active.length,playing:state.ready&&!document.hidden,speed:1,clock:'device-local'})};
   document.addEventListener('visibilitychange',resume);
   window.addEventListener('pageshow',resume);
   window.addEventListener('pagehide',stop);
   window.addEventListener('focus',resume);
   resume();
  }catch(e){console.error('Simulação:',e);reportError('Não foi possível carregar os ônibus. Recarregue a página.');}
 }
 window.__startTransit=start;if(window.__FOZ_CITY_SIM__?.ready)start();
})();
