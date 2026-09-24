const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

// Execute the actual service function with a mocked database boundary.
const source = fs.readFileSync('frontend/src/services/materialsService.ts', 'utf8');
const fn = source.slice(source.indexOf('export async function incrementViews('), source.indexOf('export async function resetMaterialViews('));
function setup({ rpcError = null, countError = null, count = 4 } = {}) {
  const calls = [];
  const query = {
    select(value) { calls.push(['select', value]); return this; },
    eq(column, value) { calls.push(['eq', column, value]); return this; },
    async single() { return { data: countError ? null : { views_count: count }, error: countError }; },
  };
  const context = {
    exports: {},
    supabase: {
      async rpc(name, args) { calls.push(['rpc', name, { ...args }]); return { error: rpcError }; },
      from(table) { calls.push(['from', table]); return query; },
    },
    invalidateMaterialsCache() { calls.push(['invalidateMaterials']); },
    invalidateCache(key) { calls.push(['invalidate', key]); },
  };
  vm.runInNewContext(ts.transpileModule(fn, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, context);
  return { record: context.exports.incrementViews, calls };
}

test('displays the persisted count and passes the Clerk profile ID', async () => {
  const { record, calls } = setup({ count: 17 });
  assert.equal(await record('material-1', 'viewer-1'), 17);
  assert.deepEqual(calls[0], ['rpc', 'increment_material_views', { p_material_id: 'material-1', p_user_id: 'viewer-1' }]);
  assert.ok(calls.some(([name]) => name === 'invalidateMaterials'));
});

test('repeated visits do not invent extra views on the client', async () => {
  const { record } = setup({ count: 17 });
  assert.deepEqual(await Promise.all([record('m', 'u'), record('m', 'u')]), [17, 17]);
});

test('failed recording does not fall back to direct counter writes', async () => {
  const error = new Error('RPC unavailable');
  const { record, calls } = setup({ rpcError: error });
  await assert.rejects(record('m', 'u'), error);
  assert.equal(calls.length, 1);
});

test('failed count fetch is surfaced instead of displaying a fabricated count', async () => {
  const error = new Error('Count unavailable');
  const { record } = setup({ countError: error });
  await assert.rejects(record('m', 'u'), error);
});

test('anonymous visits cannot be recorded as signed-in views', async () => {
  const { record, calls } = setup();
  await assert.rejects(record('m', ''), /signed-in viewer/);
  assert.equal(calls.length, 0);
});
