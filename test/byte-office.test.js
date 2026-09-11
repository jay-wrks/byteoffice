const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

function loadBrowserScript(file, context){
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  vm.runInContext(source, context, {filename:file});
}

const context = vm.createContext({
  console,
  window: {},
  Math,
  Number,
  Array,
  Set
});
loadBrowserScript('js/data/levels.js', context);
loadBrowserScript('js/core/engine.js', context);

function execute(input, memory, program){
  const engine = new context.window.ByteEngine();
  engine.maxSteps = 1500;
  engine.resetState(Array.from(input), memory, program.map(instruction => ({...instruction})));
  while(!engine.halted) engine.step();
  return engine;
}

function values(value){
  return Array.from(value, item => Object.is(item, -0) ? 0 : item);
}

test('copies input to output and halts when the inbox is empty', () => {
  const engine = execute([4, -2, 9], 0, [
    {op:'READ'}, {op:'WRITE'}, {op:'JUMP',arg:0}
  ]);

  assert.deepEqual(values(engine.output), [4, -2, 9]);
  assert.equal(engine.finishedNaturally, true);
  assert.equal(engine.error, null);
});

test('performs physical memory and arithmetic operations', () => {
  const engine = execute([7, 5], 1, [
    {op:'READ'}, {op:'STORE',arg:0},
    {op:'READ'}, {op:'ADD',arg:0}, {op:'WRITE'}
  ]);

  assert.deepEqual(values(engine.output), [12]);
  assert.equal(engine.memory[0], 7);
  assert.equal(engine.held, null);
});

test('branches on negative and zero values', () => {
  const engine = execute([-3, 0, 8], 0, [
    {op:'READ'}, {op:'JNEG',arg:3}, {op:'WRITE'},
    {op:'READ'}, {op:'JZERO',arg:7}, {op:'WRITE'},
    {op:'JUMP',arg:0}, {op:'READ'}, {op:'WRITE'}, {op:'JUMP',arg:0}
  ]);

  assert.deepEqual(values(engine.output), [8]);
  assert.equal(engine.error, null);
});

test('reports invalid physical actions instead of mutating state', () => {
  const engine = execute([], 0, [{op:'WRITE'}]);

  assert.match(engine.error, /hands are empty/);
  assert.deepEqual(values(engine.output), []);
  assert.equal(engine.held, null);
});

test('enforces the safety limit for infinite programs', () => {
  const engine = execute([], 0, [{op:'JUMP',arg:0}]);

  assert.match(engine.error, /Safety stop/);
  assert.equal(engine.steps, 1500);
});

test('every authored level answer passes both examples', () => {
  const levels = context.window.BYTE_LEVELS;

  assert.ok(levels.length > 0);
  for(const level of levels){
    assert.ok(Array.isArray(level.answer), `Level ${level.id} is missing an answer`);
    assert.ok(level.examples.length >= 2, `Level ${level.id} needs two examples`);

    for(const example of level.examples.slice(0, 2)){
      const engine = execute(example.input, level.memory, level.answer);
      assert.deepEqual(values(engine.output), values(example.output), `Level ${level.id} answer failed`);
      assert.equal(engine.error, null, `Level ${level.id} answer raised an error`);
    }
  }
});
