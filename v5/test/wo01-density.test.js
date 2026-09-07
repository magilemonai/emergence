// Fable: particle density is per length. A 2900-unit riser at a trickle used to carry two dots; now it reads as
// dense per screen as a field pipe at the same flow. Short pipes are unchanged (the WO-01 pins still hold).
import { particleCount, particlePositions, FIELD_MAX_LEN, PARTICLE_CAP } from '../render/pipes.js';
export async function run(t) {
  t.ok(particleCount(1) === 2 && particleCount(1, 200) === 2 && particleCount(1, FIELD_MAX_LEN) === 2, 'a field pipe (≤ 500 units) carries flow / 0.5 dots');
  t.ok(particleCount(1, 3000) === 20, 'a 3000-unit pipe at 1/s carries 10x the reference count');
  t.ok(particleCount(0.34, 2900) === 7, 'a riser at a trickle still shows a column of dots');
  t.ok(particleCount(0, 3000) === 0, 'idle stays empty at any length');
  t.ok(particleCount(1000, 200) === PARTICLE_CAP && particleCount(1000, 3000) === 120, 'the cap is 40 for field pipes and one dot per 25 units on long ones (max 160)');
  const riser = [{ x: 0, y: 0 }, { x: 0, y: 2900 }];
  t.eq(particlePositions(riser, 0.34, 0).length, 7, 'particlePositions uses the pipe length');
  const field = [{ x: 0, y: 0 }, { x: 200, y: 0 }];
  t.eq(particlePositions(field, 4, 0).length, 8, 'a field pipe keeps one dot per 0.5 units/s');
}
