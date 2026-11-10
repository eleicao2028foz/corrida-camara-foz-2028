/* Original geometric models and facade lettering for the three civic blocks.
   Local metres: X follows Rua Barão do Rio Branco; Y points toward that street.
   No generated concept image is pasted over the geographic map. */
(function(root){
 'use strict';
 const ORIGIN=[-54.58821460604668,-25.5468809996802],ANGLE=14.5*Math.PI/180;
 const EAST=111320*Math.cos(ORIGIN[1]*Math.PI/180),NORTH=110540;
 const HALL_HEIGHT=100,HALL_SCALE=HALL_HEIGHT/342;
 const C={stone:'#d8ac73',cream:'#f0d7a1',trim:'#f8e7bb',glass:'#426c74',glassLight:'#7fa2a5',dark:'#303b3a',pink:'#e5c3b0',paving:'#daceb5',grass:'#91a958',water:'#64bcc7'};
 function lngLat(x,y){return[ORIGIN[0]+(x*Math.cos(ANGLE)-y*Math.sin(ANGLE))/EAST,ORIGIN[1]+(x*Math.sin(ANGLE)+y*Math.cos(ANGLE))/NORTH];}
 function polygon(points){const ring=points.map(p=>lngLat(...p));ring.push(ring[0]);return ring;}
 // Follow the road-centre quadrilaterals with a small inset. Rendering stays well inside them.
 const plots=[polygon([[-145,0],[-4,3],[-3,101],[-146,102]]),polygon([[5,5],[70,2],[77,100],[5,101]]),polygon([[-143,-17],[-15,-18],[-42,-123],[-162,-83]])];
 function model(){
  const out=[];let min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
  const rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255);
  function face(p,color,uv){
   const a=p[0],u=p[1].map((v,i)=>v-a[i]),v=p[2].map((v,i)=>v-a[i]);
   let n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],len=Math.hypot(...n);if(!len)return;n=n.map(v=>v/len);
   const col=rgb(color);
   for(let i=1;i<p.length-1;i++)for(const j of [0,i,i+1]){const q=p[j];for(let k=0;k<3;k++){min[k]=Math.min(min[k],q[k]);max[k]=Math.max(max[k],q[k]);}out.push(...q,...n,...col,...(uv?uv[j]:[-1,-1]));}
  }
  function box(x,y,z,w,d,h,c){
   const a=x-w/2,b=x+w/2,f=y-d/2,g=y+d/2,t=z+h;
   face([[a,f,t],[b,f,t],[b,g,t],[a,g,t]],c);
   face([[a,f,z],[b,f,z],[b,f,t],[a,f,t]],c);
   face([[b,g,z],[a,g,z],[a,g,t],[b,g,t]],c);
   face([[a,g,z],[a,f,z],[a,f,t],[a,g,t]],c);
   face([[b,f,z],[b,g,z],[b,g,t],[b,f,t]],c);
  }
  function cylinder(x,y,z,r,h,c,n=12,top=r){
   const ring=[];
   for(let i=0;i<n;i++){const a=i*2*Math.PI/n,b=(i+1)*2*Math.PI/n;face([[x+r*Math.cos(a),y+r*Math.sin(a),z],[x+r*Math.cos(b),y+r*Math.sin(b),z],[x+top*Math.cos(b),y+top*Math.sin(b),z+h],[x+top*Math.cos(a),y+top*Math.sin(a),z+h]],c);ring.push([x+top*Math.cos(a),y+top*Math.sin(a),z+h]);}
   if(top)face(ring,c);
  }
  function crown(x,y,z,r,rz,c){
   const slices=9,bands=5;
   for(let j=0;j<bands;j++)for(let i=0;i<slices;i++){
    const point=(ii,jj)=>{const a=2*Math.PI*ii/slices,b=-Math.PI/2+Math.PI*jj/bands;return[x+r*Math.cos(b)*Math.cos(a),y+r*Math.cos(b)*Math.sin(a),z+rz*Math.sin(b)];};
    face([point(i,j),point(i+1,j),point(i+1,j+1),point(i,j+1)],c);
   }
  }
  function tree(x,y,s=1,palm=false){
   cylinder(x,y,.4,.22*s,5.6*s,'#78624b',7,.16*s);
   if(palm){for(let i=0;i<9;i++){const a=i*2*Math.PI/9,dx=Math.cos(a),dy=Math.sin(a);face([[x,y,6*s],[x+dx*1.8*s-dy*.65*s,y+dy*1.8*s+dx*.65*s,6.5*s],[x+dx*4*s,y+dy*4*s,5*s],[x+dx*1.8*s+dy*.65*s,y+dy*1.8*s-dx*.65*s,6.5*s]],i%2?'#658338':'#849e42');}}
   else{for(const [dx,dy,dz,r] of [[0,0,6,3.3],[-1.8,.7,5.5,2.5],[1.9,0,5.9,2.6],[0,-1.3,5,2.8]])crown(x+dx*s,y+dy*s,dz*s,r*s,r*.78*s,['#547735','#6e8b3f','#849d45'][Math.abs(Math.round(x+dy))%3]);}
  }
  function bench(x,y,w=4){box(x,y,.6,w,.85,.22,'#ae8c5e');box(x,y+.35,1,w,.16,.65,'#bd9e71');for(const dx of [-w*.35,w*.35])box(x+dx,y,.2,.22,.8,.5,C.dark);}
  function lamp(x,y){cylinder(x,y,.3,.07,3.5,C.dark,6);box(x,y,3.7,.3,.3,.65,'#fff2c9');box(x,y,4.35,.42,.42,.08,C.dark);}
  function flowers(x,y,r){cylinder(x,y,.25,r,.15,'#56783d',12);for(let i=0;i<9;i++){const a=i*2.4;const rr=r*Math.sqrt((i+1)/10);crown(x+Math.cos(a)*rr,y+Math.sin(a)*rr,.65,.32,.3,i%2?'#d28b95':'#e6bd78');}}
  function windows(x,y,z,w,d,h,spacing=4.7){
   const floor=3.5/HALL_SCALE,windowHeight=2.25/HALL_SCALE;
   const rows=Math.floor((h*HALL_SCALE-1.2)/3.5),cols=Math.max(2,Math.floor((w-3)/spacing));
   for(let r=0;r<rows;r++)for(let k=0;k<cols;k++){
    const xx=x-w/2+(k+.5)*w/cols,zz=z+1.2/HALL_SCALE+r*floor;
    for(const side of [-1,1]){box(xx,y+side*(d/2+.035),zz,w/cols*.51,.08,windowHeight,C.glass);box(xx-.28,y+side*(d/2+.09),zz+.25,.13,.04,windowHeight-.5,C.glassLight);box(xx,y+side*(d/2+.1),zz+windowHeight/2,w/cols*.51,.06,.12,C.trim);}
   }
   const sideCols=Math.max(2,Math.floor((d-3)/spacing));
   for(let r=0;r<rows;r++)for(let k=0;k<sideCols;k++)for(const side of [-1,1]){
    const yy=y-d/2+(k+.5)*d/sideCols,zz=z+1.2/HALL_SCALE+r*floor;
    box(x+side*(w/2+.04),yy,zz,.08,d/sideCols*.5,windowHeight,C.glass);box(x+side*(w/2+.1),yy,zz+windowHeight/2,.06,d/sideCols*.5,.12,C.trim);
   }
  }
  function volume(x,y,z,w,d,h){box(x,y,z,w,d,h,C.stone);windows(x,y,z,w,d,h);box(x,y,z+h,w+.8,d+.8,.9,C.cream);}
  function sign(x,y,z,w,h,row){
   // Projecting dark cabinet, brass frame and bright light strip are real geometry.
   box(x,y,z,w,1.3,h,'#3a3228');
   box(x,y-.7,z+.08,w+.35,.16,.22,'#dca953');
   box(x,y-.7,z+h-.18,w+.35,.16,.2,'#e8c68a');
   for(const edge of [-1,1])box(x+edge*w/2,y-.7,z,.22,.18,h,'#d7af70');
   const bottom=(row+1)/4,top=row/4;
   face([[x-w/2+.3,y-.78,z+.3],[x+w/2-.3,y-.78,z+.3],[x+w/2-.3,y-.78,z+h-.3],[x-w/2+.3,y-.78,z+h-.3]],'#ffffff',[[0,bottom],[1,bottom],[1,top],[0,top]]);
   face([[x-w/2+.2,y-.8,z+.12],[x+w/2-.2,y-.8,z+.12],[x+w/2-.2,y-.8,z+.55],[x-w/2+.2,y-.8,z+.55]],'#ffffff',[[.05,.95],[.95,.95],[.95,.85],[.05,.85]]);
  }
  // Left block: giant civic palace, with setbacks and reference-inspired vertical ribs.
  box(-76,52,0,124,90,.25,C.paving);box(-76,52,.26,120,86,.08,C.grass);
  box(-76,22,.35,110,28,.12,C.paving);
  const hallStart=out.length;
  volume(-76,62,.4,106,58,67);
  volume(-76,66,67.4,80,47,91);
  volume(-76,68,159.3,58,38,73);
  volume(-76,70,233.2,38,29,70);
  // Tall central pilasters visually unite the stepped wings.
  for(let i=-3;i<=3;i++){
   const h=342-Math.abs(i)*6;
   box(-76+i*4.7,52.3,.4,2.1,2,h-.4,C.cream);
   box(-76+i*4.7,84.6,233.2,2,1.6,h-233.2,C.cream);
  }
  for(const x of [-125,-116,-36,-27])box(x,32.7,.4,1.5,1.1,64,C.cream);
  for(const z of [14,37,60])for(const x of [-112,-40])for(let i=0;i<5;i++)box(x,32.25,z+i*.75,28,1.5,.25,'#f4efdc');
  box(-76,32,0,32,5,19,C.cream);box(-76,29.45,2,18,.15,14,C.glass);
  for(const x of [-85,-81,-76,-71,-67])box(x,29.2,2,.5,.4,14,C.trim);
  for(let i=0;i<8;i++)box(-76,19+i*1.1,.35,38,1.12,(i+1)*.22,C.trim);
  for(let i=hallStart+2;i<out.length;i+=11)out[i]*=HALL_SCALE;
  // Full-width lettering is built into the facade, with no floating map label.
  sign(-76,29,7.6,100,11.2,0);
  for(const x of [-132,-21])for(const y of [14,29,49,87])tree(x,y,1.3,true);
  for(const x of [-122,-30]){flowers(x,12,3);bench(x,20,5);}
  for(const x of [-106,-102,-98]){cylinder(x,20,.4,.12,10,'#d9ddce',8);face([[x,20,9],[x+2.8,20,9],[x+2.8,20,7.3],[x,20,7.3]],x===-102?'#e6d16a':'#378b56');}
  // Right block: cultural centre, with glazed upper pavilion and open balcony.
  box(40,52,0,53,86,.26,C.paving);box(40,52,.27,50,83,.08,C.grass);
  box(40,22,.38,49,24,.1,C.paving);box(26,58,.38,6,58,.11,C.paving);
  box(51,62,.4,28,49,4.3,C.pink);
  for(const x of [40,45,57,62])box(x,37.44,1.4,3.4,.09,2.2,C.glass);
  box(51,37.4,.4,3.8,.12,3.5,C.glass);
  for(let i=0;i<6;i++){box(51,39.5+i*7,.4,28.15,.05,2.8,C.glass);}
  for(let i=0;i<6;i++){box(65.06,43+i*7,1.3,.08,4.3,1.6,C.glass);}
  box(51,62,4.7,30,52,.32,C.pink);
  box(51,64,5.05,25.5,44,5.4,C.glass);
  // Window mullions, interior-like golden panels, balcony railings.
  for(const x of [38.1,63.9])for(let y=42;y<=86;y+=4){box(x,y,5.1,.22,.22,5.5,C.dark);box(x,y+1.8,6.9,.1,3.3,.12,C.glassLight);}
  for(let x=39;x<=64;x+=4){box(x,41.95,5.05,.2,.25,5.6,C.dark);box(x,86.05,5.05,.2,.25,5.6,C.dark);}
  for(const y of [36.1,87.9]){box(51,y,6.25,30,.12,.15,C.dark);box(51,y,5.65,30,.09,.08,C.dark);for(let x=36;x<=66;x+=2)box(x,y,5,.09,.09,1.4,C.dark);}
  for(const x of [36.1,65.9]){box(x,62,6.25,.12,52,.15,C.dark);for(let y=36;y<=88;y+=3)box(x,y,5,.09,.09,1.4,C.dark);}
  box(51,64,10.5,29,48,.7,'#444844');box(51,64,11.2,28,47,.1,'#62635a');
  box(51,40.5,10.7,32,6,4.6,C.dark);
  sign(51,36.9,8.6,40,6.5,1);
  for(let i=0;i<16;i++)box(61,28+i*.5,.45,7,.52,(i+1)*.28,C.trim);
  // Accessible ramp on the west side of the building.
  face([[33,41,.5],[36,41,.5],[36,69,5],[33,69,5]],C.paving);
  for(let i=0;i<=14;i++)box(33,41+i*2,.5+i*4.5/14,.1,.1,1.05,C.dark);
  // Connected gardens, fountain and pergola in the remaining cultural block.
  cylinder(23,31,.5,8,.13,C.paving,40);cylinder(23,31,.63,3.7,.48,C.trim,28);cylinder(23,31,1.12,3.22,.05,C.water,28);
  cylinder(23,31,1.17,.65,.7,'#d6d4b9',12);cylinder(23,31,1.87,.16,1.7,'#b9edf1',8,.08);
  for(let i=0;i<8;i++){const a=i*Math.PI/4;for(let j=0;j<8;j++){const t=j/8,r=2.5*t;const zz=1.3+2.3*4*t*(1-t);crown(23+Math.cos(a)*r,31+Math.sin(a)*r,zz,.08,.17,'#b3e7e6');}}
  for(const y of [65,77])for(const x of [17,29])box(x,y,.5,.25,.25,4,C.dark);
  for(let y=64;y<=78;y+=1)box(23,y,4.5,14,.22,.25,'#c5ab79');
  box(23,71,.4,15,16,.14,C.paving);bench(20,74);bench(26,74);
  for(const [x,y,s,p] of [[20,88,1.25,0],[32,92,1.25,0],[56,93,1.15,0],[18,50,1.1,0],[18,19,.9,0],[45,15,1,1],[53,19,1.15,1],[31,11,.8,0]])tree(x,y,s,!!p);
  for(const [x,y] of [[16,11],[28,47],[32,82],[61,12],[17,84],[30,18],[59,91]])flowers(x,y,1.8);
  for(const [x,y] of [[19,23],[29,23],[39,11],[56,11]])bench(x,y,4);
  for(const [x,y] of [[15,39],[31,57],[32,87],[62,15],[-132,12],[-21,12]])lamp(x,y);
  // Foundation: the user-marked block directly south of city hall.
  const foundationSite=[[-139,-22],[-21,-23],[-47,-117],[-156,-80]];
  face(foundationSite.map(([x,y])=>[x,y,.3]),C.paving);
  face([[-136,-25],[-25,-26],[-49,-113],[-152,-78]].map(([x,y])=>[x,y,.34]),C.grass);
  // Approved design: glazed central atrium, recessed side wings and separate roofs.
  const ivory='#eee0bd',copper='#ab6a45',frame='#485d59';
  function roof(x,y,z,w,d){
   box(x,y,z,w,d,.7,ivory);box(x,y,z+.71,w-2,d-2,.06,'#85857a');
   for(const side of [-1,1]){box(x+side*(w/2-.4),y,z+.7,.8,d,1.15,ivory);box(x,y+side*(d/2-.4),z+.7,w,.8,1.15,ivory);}
   for(let yy=y-d/2+2;yy<y+d/2-1;yy+=1.1)box(x,yy,z+.79,w-3,.035,.025,'#a4a297');
  }
  function gallery(x,y,w,d,h){
   box(x,y,.34,w+.4,d+.4,.96,ivory);
   box(x,y,1.3,w,d,h,ivory);
   for(const side of [-1,1]){
    box(x,y+side*(d/2+.03),2.2,w-3,.12,h-2.3,C.glass);
    for(let xx=x-w/2+2;xx<x+w/2-1;xx+=3.4)box(xx,y+side*(d/2+.13),2.2,.15,.12,h-2.3,frame);
    for(let zz=6;zz<h;zz+=5)box(x,y+side*(d/2+.14),zz,w-3,.14,.18,frame);
    box(x+side*(w/2+.03),y,2.2,.12,d-3,h-2.3,C.glass);
    for(let yy=y-d/2+2;yy<y+d/2-1;yy+=3.5)box(x+side*(w/2+.13),yy,2.2,.12,.15,h-2.3,frame);
   }
   roof(x,y,h+1.3,w+1.3,d+1.3);
  }
  // The upper wings step back; the lobby is intentionally the tallest volume.
  gallery(-118,-54,29,34,13.8);gallery(-62,-54,31,34,13.8);
  gallery(-90,-55,27,43,21.6);
  gallery(-119,-40,23,15,17.2);
  // Cream portal frames and closely spaced warm vertical fins.
  for(const x of [-103.5,-76.5])box(x,-77.4,1.3,1.2,1.7,22.5,ivory);
  box(-90,-77.4,22.6,28,1.7,1.2,ivory);
  for(const x of [-131,-128.8,-126.6,-108,-105.8,-74.2,-72,-50.5,-48.3]){
   const front=x>-105&&x<-75?-77.5:-72;
   box(x,front,1.4,.65,1.4,13.4,copper);box(x-.2,front-.73,1.4,.15,.08,13.4,'#d59c68');
  }
  for(const x of [-101,-98.8,-81.2,-79])box(x,-77.6,7.8,.6,1.1,14.4,copper);
  // Lobby glass reflections and entrance doors.
  face([[-101.8,-76.64,3],[-98.5,-76.64,3],[-86,-76.64,21],[-89.3,-76.64,21]],'#648f90');
  for(const z of [7.7,14.4,20.2])box(-90,-76.8,z,24,.18,.16,frame);
  for(const x of [-97,-93.5,-90,-86.5,-83])box(x,-76.84,1.4,.18,.2,21,frame);
  box(-90,-78,1.25,12,.3,5.5,C.glassLight);
  for(const x of [-96,-92,-88,-84])box(x,-78.2,1.25,.18,.18,5.5,frame);
  box(-90,-80,7.2,52,8,.65,ivory);
  for(const x of [-111,-69])box(x,-81,1.2,1.3,1.3,6.1,ivory);
  sign(-90,-82.7,7.8,76,8.2,2);
  // Roof terrace with planter beds and a pergola, matching the approved preview.
  box(-61,-45,15.85,23,15,.2,C.paving);
  for(const y of [-51.5,-38.5])box(-61,y,16.05,24,1.6,1,ivory);
  for(const x of [-71.5,-50.5])for(const y of [-40,-49])box(x,y,16,.24,.24,3.5,copper);
  for(const x of [-71.5,-50.5])box(x,-44.5,19.3,.4,12,.3,copper);
  for(let x=-72;x<=-50;x+=1.2)box(x,-44.5,19.5,.25,12,.3,'#bb865c');
  for(let x=-70;x<=-51;x+=3){crown(x,-51.5,17.4,1.2,.8,'#6b8d3b');crown(x,-38.5,17.4,1.1,.7,'#8ca34d');}
  for(const x of [-66,-57]){
   cylinder(x,-49,16.6,.06,1.1,'#725737',6);
   for(let i=0;i<7;i++){const a=i*Math.PI*2/7;face([[x,-49,17.7],[x+Math.cos(a-.3)*1.2,-49+Math.sin(a-.3)*1.2,18.6],[x+Math.cos(a)*2,-49+Math.sin(a)*2,17.7],[x+Math.cos(a+.3)*1.2,-49+Math.sin(a+.3)*1.2,18.6]],'#5d853c');}
  }
  // Forecourt, broad entrance steps, accessible ramp and raised flower gardens.
  box(-85,-89,.4,59,17,.13,C.paving);
  box(-90,-80,.4,52,12,.13,C.paving);box(-90,-82,.53,50,9,.77,C.trim);
  for(let i=0;i<7;i++)box(-90,-92+i*.9,.53,23,.92,(i+1)*.11,C.trim);
  face([[-70,-98,.54],[-66,-98,.54],[-66,-83,1.3],[-70,-83,1.3]],C.paving);
  for(let i=0;i<=10;i++)for(const x of [-70,-66])box(x,-98+i*1.5,.54+i*.076,.07,.07,1,'#a5ac9f');
  for(const x of [-70,-66])face([[x,-98,1.54],[x,-83,2.3],[x,-83,2.4],[x,-98,1.64]],'#c4c6af');
  for(const [x,y,w,d] of [[-111,-87,11,5],[-58,-88,10,5],[-73,-103,12,4]]){
   box(x,y,.4,w,d,.7,ivory);box(x,y,1.1,w-.6,d-.6,.08,'#667f41');
   for(let i=0;i<8;i++){const xx=x-w*.38+i*w*.1;crown(xx,y,1.65,.75,.5,i%2?'#c17e8c':'#ebca81');}
  }
  box(-139,-53,.4,11,27,.15,C.paving);
  for(const x of [-143,-135])for(const y of [-42,-64])box(x,y,.55,.22,.22,3.4,C.dark);
  for(let y=-65;y<=-41;y+=1.2)box(-139,y,4,11,.2,.2,'#bfa478');
  for(const [x,y,s] of [[-135,-29,1],[-139,-74,.95],[-54,-106,.85],[-36,-35,1],[-36,-58,.85]])tree(x,y,s);
  for(const [x,y] of [[-107,-92],[-59,-94],[-139,-55],[-73,-26]])bench(x,y,5);
  for(const [x,y] of [[-124,-85],[-44,-92],[-119,-28],[-33,-44]])flowers(x,y,2);
  for(const [x,y] of [[-114,-87],[-55,-87],[-138,-38]])lamp(x,y);
  min=[Infinity,Infinity,Infinity];max=[-Infinity,-Infinity,-Infinity];
  for(let i=0;i<out.length;i+=11)for(let k=0;k<3;k++){min[k]=Math.min(min[k],out[i+k]);max[k]=Math.max(max[k],out[i+k]);}
  return{vertices:new Float32Array(out),min,max};
 }
 function atlas(){
  const c=document.createElement('canvas');c.width=2048;c.height=1024;const g=c.getContext('2d');
  g.textAlign='center';g.textBaseline='middle';
  for(const [i,name] of ['PREFEITURA DE FOZ','ESTAÇÃO CULTURAL','FUNDAÇÃO CULTURAL'].entries()){
   const y=i*256,bg=g.createLinearGradient(0,y,0,y+256);
   bg.addColorStop(0,'#352d23');bg.addColorStop(1,'#171b1a');g.fillStyle=bg;g.fillRect(0,y,2048,256);
   g.fillStyle='#fffbea';g.font='900 185px Arial';g.shadowColor='#b88035';g.shadowBlur=4;
   g.fillText(name,1024,y+137,1950);g.shadowBlur=0;
  }
  // Fourth atlas row supplies unshaded warm illumination below each sign.
  const glow=g.createLinearGradient(0,768,0,1024);glow.addColorStop(0,'#eeb457');glow.addColorStop(.5,'#fff1bd');glow.addColorStop(1,'#eeb457');g.fillStyle=glow;g.fillRect(0,768,2048,256);
  return c;
 }
 function layer(map,mesh,texture){
  let gl,program,buffer,tex,vao;const matrix=new Float32Array(16);
  const merc=root.maplibregl.MercatorCoordinate.fromLngLat(ORIGIN),unit=merc.meterInMercatorCoordinateUnits();
  // Local east/north axes use the measured road orientation.
  const a=Math.cos(ANGLE),b=Math.sin(ANGLE);
  return{id:'civic-architecture',type:'custom',renderingMode:'3d',
   onAdd(m,g){
    gl=g;const shader=(type,src)=>{const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;};
    const v=shader(gl.VERTEX_SHADER,'precision highp float;attribute vec3 a_pos;attribute vec3 a_normal;attribute vec3 a_color;attribute vec2 a_uv;uniform mat4 u_matrix;varying vec3 v_color;varying vec2 v_uv;void main(){float light=0.68+0.32*max(dot(normalize(a_normal),normalize(vec3(-0.4,-0.6,1.0))),0.0);v_color=a_color*light;v_uv=a_uv;gl_Position=u_matrix*vec4(a_pos,1.0);}');
    const f=shader(gl.FRAGMENT_SHADER,'precision mediump float;varying vec3 v_color;varying vec2 v_uv;uniform sampler2D u_atlas;void main(){gl_FragColor=v_uv.x<0.0?vec4(v_color,1.0):texture2D(u_atlas,v_uv);}');
    program=gl.createProgram();gl.attachShader(program,v);gl.attachShader(program,f);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.deleteShader(v);gl.deleteShader(f);
    buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,mesh,gl.STATIC_DRAW);
    tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.generateMipmap(gl.TEXTURE_2D);
    this.attrs=['a_pos','a_normal','a_color','a_uv'].map(n=>gl.getAttribLocation(program,n));this.matrix=gl.getUniformLocation(program,'u_matrix');this.sampler=gl.getUniformLocation(program,'u_atlas');
    if(gl.createVertexArray){vao=gl.createVertexArray();gl.bindVertexArray(vao);}
    this.attrs.forEach((loc,i)=>{gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,i===3?2:3,gl.FLOAT,false,44,i*12);});
    if(vao)gl.bindVertexArray(null);
   },
   render(g,m){
    for(let r=0;r<4;r++){matrix[r]=(m[r]*a-m[4+r]*b)*unit;matrix[4+r]=(-m[r]*b-m[4+r]*a)*unit;matrix[8+r]=m[8+r]*unit;matrix[12+r]=m[r]*merc.x+m[4+r]*merc.y+m[12+r];}
    gl.useProgram(program);gl.uniformMatrix4fv(this.matrix,false,matrix);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,tex);gl.uniform1i(this.sampler,0);
    if(vao)gl.bindVertexArray(vao);else{gl.bindBuffer(gl.ARRAY_BUFFER,buffer);this.attrs.forEach((loc,i)=>{gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,i===3?2:3,gl.FLOAT,false,44,i*12);});}
    gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.depthMask(true);gl.disable(gl.CULL_FACE);gl.disable(gl.BLEND);gl.drawArrays(gl.TRIANGLES,0,mesh.length/11);if(vao)gl.bindVertexArray(null);
   },
   onRemove(){gl.deleteBuffer(buffer);gl.deleteTexture(tex);gl.deleteProgram(program);if(vao)gl.deleteVertexArray(vao);}
  };
 }
 function install(map){
  if(map.getLayer('civic-architecture'))return root.__FOZ_CIVIC__;
  const exclusion=['!', ['within',{type:'MultiPolygon',coordinates:plots.map(p=>[p])}]];
  for(const id of ['footprints-flat','footprints-walls','footprints-roofs','retro-architecture','veg-trees','veg-bushes'])if(map.getLayer(id)){const prior=map.getFilter(id);map.setFilter(id,prior?['all',prior,exclusion]:exclusion);}
  const mesh=model(),texture=atlas();map.addLayer(layer(map,mesh.vertices,texture));
  function focus(){const el=map.getContainer(),h=el.clientHeight,w=el.clientWidth;const zoom=17.8+Math.log2(Math.min(h/1000,w/950));map.jumpTo({center:lngLat(-40,3),zoom,pitch:50,bearing:-14.5,padding:{top:h*.22,bottom:h*.04,left:20,right:20}});}
  root.__FOZ_CIVIC__={revision:'fundacao-aprovada-placas-v2',focus,origin:ORIGIN,plots,height:HALL_HEIGHT,modelBounds:{min:mesh.min,max:mesh.max},vertexCount:mesh.vertices.length/11,texture,markers:[],lngLat};
  return root.__FOZ_CIVIC__;
 }
 root.FozCivic={install,model,lngLat,plots,height:HALL_HEIGHT};
})(typeof window!=='undefined'?window:globalThis);
