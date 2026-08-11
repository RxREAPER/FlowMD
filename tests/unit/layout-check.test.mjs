import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFlowMD } from './harness.mjs';

const { layoutCheck } = loadFlowMD({ modules: ['namespace', 'constants', 'layout-check'] });

const toPlain = (v) => JSON.parse(JSON.stringify(v));

test('analyzeLayoutIssues flags document horizontal overflow', () => {
  const out = layoutCheck.analyzeLayoutIssues({ docOverflow: true, escapes: [], clips: [], vw: 360, vh: 740 });
  assert.equal(out.clean, false);
  assert.ok(out.summary.includes('DOC-H-OVERFLOW'));
  assert.ok(toPlain(out.issues).some((i) => i.type === 'DOC-H-OVERFLOW'));
});

test('analyzeLayoutIssues flags escaped boxes and clipped text', () => {
  const out = layoutCheck.analyzeLayoutIssues({
    docOverflow: false,
    escapes: [{ el: 'DIV.plan-config-pace', detail: 'right 901 > vw 800' }],
    clips: [{ el: 'INPUT#spotlight-search-input', detail: 'placeholder clipped' }],
    vw: 800, vh: 900
  });
  assert.equal(out.clean, false);
  assert.equal(out.issues.length, 2);
  assert.ok(out.summary.includes('2'));
});

test('analyzeLayoutIssues reports clean when nothing wrong', () => {
  const out = layoutCheck.analyzeLayoutIssues({ docOverflow: false, escapes: [], clips: [], vw: 390, vh: 844 });
  assert.equal(out.clean, true);
  assert.equal(out.summary, 'No layout issues detected on this device.');
});
