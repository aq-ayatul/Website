import test from 'node:test';
import assert from 'node:assert/strict';
import { directDistance, minutes, validPoint } from '../src/lib/trails.ts';

test('straight-line distance is zero for identical points and about 1.5 km for the selected landmarks', () => {
  const start = { lat: 1.2737, lng: 103.8177, name: 'Mount Faber' };
  assert.equal(directDistance([start, start]), 0);
  const distance = directDistance([start, { lat: 1.2777, lng: 103.8052, name: 'Henderson Waves' }]);
  assert.ok(distance > 1.4 && distance < 1.6);
});

test('relaxed pace and more difficult terrain require more time', () => {
  assert.ok(minutes(5, 'Relaxed') > minutes(5, 'Experienced'));
  assert.ok(minutes(5, 'Regular', 'Challenging') > minutes(5, 'Regular', 'Easy'));
  assert.equal(minutes(3.5, 'Regular'), 69);
});

test('invalid, out-of-region and oversized stop inputs are rejected', () => {
  assert.equal(validPoint({ lat: 1.35, lng: 103.8, name: 'Park' }), true);
  for (const point of [null, {}, { lat: NaN, lng: 103.8, name: 'Park' }, { lat: 51, lng: 0, name: 'Elsewhere' }, { lat: 1.35, lng: 103.8, name: 'x'.repeat(161) }]) assert.equal(validPoint(point), false);
});
