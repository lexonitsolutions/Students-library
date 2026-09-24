const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const context = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync('frontend/src/data/aiLearning.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, context);
const { greeting, parseLearningReply, learningModes } = context.exports;
test('greeting follows local morning, afternoon and evening boundaries', () => {
  for (const [hour, expected] of [[0,'Good morning'],[11,'Good morning'],[12,'Good afternoon'],[17,'Good afternoon'],[18,'Good evening'],[23,'Good evening']]) assert.equal(greeting(hour), expected);
});
test('ten learning modes have unique IDs', () => { assert.equal(learningModes.length, 10); assert.equal(new Set(learningModes.map(m => m.id)).size, 10); });
test('rejects empty and malformed provider responses', () => { for (const input of [null, {}, {text: ''}, {text: 4}]) assert.throws(() => parseLearningReply(input)); });
test('invalid quiz answer indexes and malformed flashcards are not rendered', () => {
  const result = parseLearningReply({text:'Practice', quiz:[{question:'Q',options:['A','B'],answer:3,explanation:'x'},{question:'Q',options:['A','B'],answer:0,explanation:'x'}], flashcards:[{question:'Q'}, {question:'Q',answer:'A'}]});
  assert.equal(result.quiz.length, 1); assert.equal(result.flashcards.length, 1);
});
