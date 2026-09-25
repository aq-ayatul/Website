import test from 'node:test';
import assert from 'node:assert/strict';
import { decodePolyline, parseWalkingLeg, assembleRoute } from '../src/lib/routing.ts';

function encode(points) {
  let lastLat=0,lastLng=0;
  const part = value => { let v = value < 0 ? ~(value << 1) : value << 1, result=''; while(v>=32){result+=String.fromCharCode((32|(v&31))+63);v>>=5;}return result+String.fromCharCode(v+63); };
  return points.map(([lat,lng])=>{const a=Math.round(lat*1e5),b=Math.round(lng*1e5);const s=part(a-lastLat)+part(b-lastLng);lastLat=a;lastLng=b;return s;}).join('');
}
const start={lat:1.2737,lng:103.8177,name:'Start'};
const end={lat:1.2777,lng:103.8052,name:'End'};
const data={status:0,route_summary:{total_distance:1982},route_geometry:encode([[start.lat,start.lng],[1.275,103.811],[end.lat,end.lng]])};

test('decodes the standard encoded polyline example',()=>{
  assert.deepEqual(decodePolyline('_p~iF~ps|U_ulLnnqC_mqNvxq`@'),[[38.5,-120.2],[40.7,-120.95],[43.252,-126.453]]);
});
test('rejects truncated and invalid geometry',()=>{
  for (const value of ['', '_', '!!']) assert.throws(()=>decodePolyline(value));
  assert.throws(()=>parseWalkingLeg({...data,route_geometry:encode([[51,0],[52,0]])},start,end));
});
test('keeps provider distance instead of a straight-line estimate',()=>{
  const leg=parseWalkingLeg(data,start,end);
  assert.equal(leg.distance,1.982);
  assert.equal(leg.startOffsetMetres,0);
  assert.equal(leg.geometry.length,3);
});
test('rejects zero-length routes and stops too far from a path',()=>{
  assert.throws(()=>parseWalkingLeg({...data,route_summary:{total_distance:0}},start,end));
  assert.throws(()=>parseWalkingLeg(data,{...start,lat:1.4},end));
});
test('multi-stop totals retain individual leg boundaries and report snapped endpoints',()=>{
  const leg=parseWalkingLeg(data,start,end);
  const second={...leg,distance:2,startOffsetMetres:70};
  const result=assembleRoute([leg,second]);
  assert.equal(result.distance,3.982);
  assert.equal(result.legs.length,2);
  assert.equal(result.geometry.length,6);
  assert.equal(result.warnings.length,1);
  assert.match(result.warnings[0],/70 m/);
});
