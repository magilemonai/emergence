// engine/types.js — JSDoc typedefs. FROZEN CONTRACT (see CONTRACT.md). No runtime code beyond the shape helpers.
/** @typedef {{ id:string, name:string, hue:string, glyph:string, icon?:string|null, flavor:string, era:number }} ResourceDef */
/** @typedef {{ res:string, rate:number }} Port  per unit per second */
/** @typedef {'source'|'converter'|'store'|'sink'|'goal'} NodeKind */
/** @typedef {{ id:string, era:number, kind:NodeKind, name:string, res?:string, inputs:Port[], outputs:Port[], count:number, paused:boolean,
 *   pos:{x:number,y:number},   // STRATUM-LOCAL (x 0..1180, y 0..700 from the stratum top); world y = stratumTop(era) + pos.y cost?:{res:string, base:number, growth:number}, mult:{[k:string]:number}, tags:string[], flavor?:string, mech?:string }} NodeDef */
/** @typedef {{ from:string, to:string, res:string, flow:number, riser:boolean, starved:boolean }} Edge   starved = this input could not meet its demand in the last tick */
/** @typedef {{ type:string, era?:number, t?:number, [k:string]:any }} Action */
/** @typedef {{ v:number, seed:number, rng:{s:number}, t:number, era:number, maxEra:number, mute:boolean,
 *   stocks:{[res:string]:number}, rates:{[res:string]:number}, nodes:{[id:string]:NodeDef}, nodeOrder:string[], edges:Edge[],
 *   resources:{[id:string]:ResourceDef}, flags:{[k:string]:any}, eras:{[n:number]:any}, log:Action[], legacy:any }} State */
/** @typedef {{ id:number, name:string, height:number, install:(sim:any)=>void, open?:(sim:any)=>void, tick:(sim:any, dt:number)=>void,
 *   actions:{[type:string]:{can:(sim:any,a:Action)=>boolean, apply:(sim:any,a:Action)=>void}}, goal:(sim:any)=>{progress:number, ready:boolean, label:string},
 *   voice?:(sim:any)=>string|null, layout:{anchors:{[id:string]:{x:number,y:number}}, verbs:string[], goal:string}, done:(sim:any)=>boolean }} EraModule */

export const NODE_KINDS = ['source', 'converter', 'store', 'sink', 'goal'];
export const STRATUM_H = 700;
export const WORLD_W = 1180;
/** stratum n (1..5) spans y in [top, top+STRATUM_H); the surface layer (6) is above Foundation */
export function stratumTop(n) { return n === 6 ? -STRATUM_H : (5 - n) * STRATUM_H; }
/** shape check used by tests + sim.addNode (throws on a malformed node) */
export function assertNode(d) {
  const req = ['id', 'era', 'kind', 'name', 'inputs', 'outputs', 'count', 'paused', 'pos', 'mult', 'tags'];
  for (const k of req) if (!(k in d)) throw new Error('NodeDef missing ' + k + ' on ' + (d && d.id));
  if (!NODE_KINDS.includes(d.kind)) throw new Error('bad kind ' + d.kind);
  for (const p of d.inputs.concat(d.outputs)) if (typeof p.res !== 'string' || typeof p.rate !== 'number') throw new Error('bad port on ' + d.id);
  if (d.kind === 'store' && !d.res) throw new Error('store needs res: ' + d.id);
}
