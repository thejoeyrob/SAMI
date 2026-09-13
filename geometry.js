/* SAMI geometry — WGS84 input, local metric layouts, bounded record clipping. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./polygon-clipping.js'):root.polygonClipping);if(typeof module==='object'&&module.exports)module.exports=api;else root.SamiGeometry=api;})(typeof window!=='undefined'?window:this,function(pc){
'use strict';
const R=6371008.8,rad=Math.PI/180,copy=o=>JSON.parse(JSON.stringify(o));
function validCoord(p){return Array.isArray(p)&&p.length>=2&&Number.isFinite(p[0])&&Number.isFinite(p[1])&&Math.abs(p[0])<=180&&Math.abs(p[1])<=85;}
function validBounds(b){return Array.isArray(b)&&b.length===4&&b.every(Number.isFinite)&&b[0]<b[2]&&b[1]<b[3]&&b[0]>=-180&&b[2]<=180&&b[1]>=-85&&b[3]<=85;}
function inside(p,b){return p[0]>=b[0]-1e-10&&p[0]<=b[2]+1e-10&&p[1]>=b[1]-1e-10&&p[1]<=b[3]+1e-10;}
function distance(a,b){const dlat=(b[1]-a[1])*rad,dlon=(b[0]-a[0])*rad;const h=Math.sin(dlat/2)**2+Math.cos(a[1]*rad)*Math.cos(b[1]*rad)*Math.sin(dlon/2)**2;return 2*R*Math.asin(Math.sqrt(Math.min(1,h)));}
function length(ps){return ps.slice(1).reduce((sum,p,i)=>sum+distance(ps[i],p),0);}
function projection(origin){const mx=R*rad*Math.cos(origin[1]*rad),my=R*rad;return{xy:p=>[(p[0]-origin[0])*mx,(p[1]-origin[1])*my],ll:p=>[origin[0]+p[0]/mx,origin[1]+p[1]/my]};}
function rectangle(center,l,w,angle=0){const p=projection(center),a=angle*rad,u=[Math.sin(a),Math.cos(a)],v=[Math.cos(a),-Math.sin(a)];const ring=[[-l/2,-w/2],[l/2,-w/2],[l/2,w/2],[-l/2,w/2]].map(([x,y])=>p.ll([u[0]*x+v[0]*y,u[1]*x+v[1]*y]));return{type:'Polygon',coordinates:[[...ring,ring[0].slice()]]};}
function boundsGeometry(b){return{type:'Polygon',coordinates:[[[b[0],b[1]],[b[2],b[1]],[b[2],b[3]],[b[0],b[3]],[b[0],b[1]]]]};}
function boundsOf(g){const all=[];function visit(a){if(typeof a[0]==='number')all.push(a);else a.forEach(visit);}visit(g.coordinates);if(!all.length)return null;return [Math.min(...all.map(p=>p[0])),Math.min(...all.map(p=>p[1])),Math.max(...all.map(p=>p[0])),Math.max(...all.map(p=>p[1]))];}
function segment(a,b,box){let lo=0,hi=1;const d=[b[0]-a[0],b[1]-a[1]],p=[-d[0],d[0],-d[1],d[1]],q=[a[0]-box[0],box[2]-a[0],a[1]-box[1],box[3]-a[1]];for(let i=0;i<4;i++){if(Math.abs(p[i])<1e-16){if(q[i]<0)return null;}else{const r=q[i]/p[i];if(p[i]<0)lo=Math.max(lo,r);else hi=Math.min(hi,r);if(lo>hi)return null;}}if(hi-lo<1e-12)return null;return [[a[0]+lo*d[0],a[1]+lo*d[1]],[a[0]+hi*d[0],a[1]+hi*d[1]]];}
function clipLine(ps,b){const result=[];let line=null;for(let i=1;i<ps.length;i++){const seg=segment(ps[i-1],ps[i],b);if(!seg){line=null;continue;}const last=line?.[line.length-1];if(last&&Math.abs(last[0]-seg[0][0])<1e-10&&Math.abs(last[1]-seg[0][1])<1e-10)line.push(seg[1]);else{line=seg;result.push(line);}}return result;}
function clipGeometry(g,b){if(!validBounds(b))return copy(g);if(g.type==='Point')return inside(g.coordinates,b)?copy(g):null;if(g.type==='MultiPoint'){const pts=g.coordinates.filter(p=>inside(p,b));return pts.length?{type:'MultiPoint',coordinates:copy(pts)}:null;}if(['LineString','MultiLineString'].includes(g.type)){const lines=(g.type==='LineString'?[g.coordinates]:g.coordinates).flatMap(l=>clipLine(l,b));return !lines.length?null:lines.length===1?{type:'LineString',coordinates:lines[0]}:{type:'MultiLineString',coordinates:lines};}if(['Polygon','MultiPolygon'].includes(g.type)){const result=pc.intersection(g.coordinates,boundsGeometry(b).coordinates);return !result.length?null:result.length===1?{type:'Polygon',coordinates:result[0]}:{type:'MultiPolygon',coordinates:result};}return null;}
function area(b){return distance([b[0],b[1]],[b[2],b[1]])*distance([b[0],b[1]],[b[0],b[3]]);}
function validateFeature(f){if(!f||f.type!=='Feature'||!f.geometry||!['Point','MultiPoint','LineString','MultiLineString','Polygon','MultiPolygon'].includes(f.geometry.type))return false;let count=0;function walk(a){if(!Array.isArray(a)||!a.length)return false;if(typeof a[0]==='number'){count++;return validCoord(a);}return a.every(walk);}if(!walk(f.geometry.coordinates)||count>50000)return false;const g=f.geometry;const line=r=>r.length>=2&&r.every(validCoord),ring=r=>r.length>=4&&r.every(validCoord)&&r[0][0]===r.at(-1)[0]&&r[0][1]===r.at(-1)[1];if(g.type==='LineString')return line(g.coordinates);if(g.type==='MultiLineString')return g.coordinates.every(line);if(g.type==='Polygon')return g.coordinates.every(ring);if(g.type==='MultiPolygon')return g.coordinates.every(p=>p.length&&p.every(ring));return true;}
function panels(points,o){
 if(points.length<2)throw Error('Tap at least two route points.');
 const l=+o.length,w=+o.width,overlap=+o.overlap||0,lanes=+o.lanes||1,lateral=+o.lateralOverlap||0;
 if(!(l>.1&&w>.1&&overlap>=0&&overlap<l*.75&&lateral>=0&&lateral<w*.75&&lanes>=1&&lanes<=4))throw Error('Check the panel dimensions and overlaps.');
 const pr=projection(points[0]),ps=points.map(pr.xy),out=[],warnings=[];const step=l-overlap,widthStep=w-lateral;
 function add(x,y,ux,uy,cross=0,corner=false){const vx=-uy,vy=ux;const c=[x+vx*cross,y+vy*cross];const r=[[-l/2,-w/2],[l/2,-w/2],[l/2,w/2],[-l/2,w/2]].map(([a,b])=>pr.ll([c[0]+ux*a+vx*b,c[1]+uy*a+vy*b]));out.push({geometry:{type:'Polygon',coordinates:[[...r,r[0].slice()]]},corner});if(out.length>5000)throw Error('This run exceeds 5,000 panels. Use a smaller area or shorter runs.');}
 for(let i=1;i<ps.length;i++){
  const a=ps[i-1],b=ps[i],dx=b[0]-a[0],dy=b[1]-a[1],d=Math.hypot(dx,dy);if(d<.01)continue;const ux=dx/d,uy=dy/d;
  // End panels straddle each bend. Independent segments overlap at the shared vertex.
  const start=i===1?l/2:0,end=i===ps.length-1?Math.max(start,d-l/2):d;
  const n=Math.max(1,Math.ceil((end-start)/step)+1);
  for(let j=0;j<n;j++){const along=start+j*step;for(let k=0;k<lanes;k++)add(a[0]+ux*along,a[1]+uy*along,ux,uy,(k-(lanes-1)/2)*widthStep);}
  // Close a short final bend interval with a full overlapping panel at the joint.
  if(i<ps.length-1&&Math.abs(start+(n-1)*step-d)>.01)for(let k=0;k<lanes;k++)add(b[0],b[1],ux,uy,(k-(lanes-1)/2)*widthStep,true);
 }
 for(let i=1;i<ps.length-1;i++){
  const a=ps[i-1],b=ps[i],c=ps[i+1],d1=Math.hypot(b[0]-a[0],b[1]-a[1]),d2=Math.hypot(c[0]-b[0],c[1]-b[1]);if(d1<.01||d2<.01)continue;
  const u=[(b[0]-a[0])/d1,(b[1]-a[1])/d1],v=[(c[0]-b[0])/d2,(c[1]-b[1])/d2];const angle=Math.acos(Math.max(-1,Math.min(1,u[0]*v[0]+u[1]*v[1])))/rad;
  if(angle>15&&angle<60&&o.product!=='sabre'){
   const side=Math.sign(u[0]*v[1]-u[1]*v[0])||1;
   // Four full panels on the inside of each meeting run: eight per corner.
   for(let j=0;j<4;j++){add(b[0]-u[0]*(j+.5)*step,b[1]-u[1]*(j+.5)*step,u[0],u[1],side*(lanes*widthStep/2+w/2),true);add(b[0]+v[0]*(j+.5)*step,b[1]+v[1]*(j+.5)*step,v[0],v[1],side*(lanes*widthStep/2+w/2),true);}
  }
  if(angle>60)warnings.push('A sharp corner needs a separately designed junction.');
  if(o.product==='sabre'&&angle>.2)warnings.push('Sabre-X bends need joint-position / lateral-stagger verification.');
 }
 return{panels:out,warnings:[...new Set(warnings)],distance:length(points)};
}
return{copy,validCoord,validBounds,inside,distance,length,projection,rectangle,boundsGeometry,boundsOf,segment,clipLine,clipGeometry,area,validateFeature,panels};
});
