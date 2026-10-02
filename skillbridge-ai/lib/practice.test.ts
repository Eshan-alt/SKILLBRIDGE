import {test} from 'node:test';
import assert from 'node:assert/strict';
import {practiceFeedback,recordSchema,streak} from './practice';
test('practice rubric rewards relevant concepts and labels them accurately',()=>{const a=practiceFeedback('Frontend developer',0,'I would profile the render and use virtualization and memoization.');const b=practiceFeedback('Frontend developer',0,'I would make the page better.');assert(a.score>b.score);assert(a.score<=100);assert(a.strengths[0].includes('profil'));});
test('record validation rejects invalid results',()=>{assert.equal(recordSchema.safeParse({score:120}).success,false);});
test('practice streak handles an empty history',()=>{assert.equal(streak([]),0);});
