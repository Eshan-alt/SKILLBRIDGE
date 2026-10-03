import test from 'node:test';
import assert from 'node:assert/strict';
import {jobFit} from './job-fit';
test('aliases match technologies without matching substrings',()=>{const r=jobFit('React.js, Next.js, Java and JavaScript; Docker required','ReactJS NextJS JavaScript');assert.deepEqual(r.matched,['JavaScript','React','Next.js']);assert.deepEqual(r.missing,['Java','Docker']);});
test('empty and unrecognized descriptions do not invent a score',()=>{assert.deepEqual(jobFit('we need enthusiasm','React'),{matched:[],missing:[]});assert.deepEqual(jobFit('GitHub','Git'),{matched:[],missing:[]});});
