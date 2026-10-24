import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const page=readFileSync(new URL('../sli-industrial-intelligence.html',import.meta.url),'utf8');
test('Industrial dashboard has sourced facility capacity visualization',()=>{
  for(const expected of ['facilityCapacityPlot','facilitySelect','facilityBars','capacityGroups','renderFacilityBars','180,216','40000']) assert.ok(page.includes(expected),expected);
});
test('Do not aggregate unlike products or planned projects',()=>{
 assert.match(page,/bukan kapasitas nasional/i);
 assert.match(page,/ANTAM–CNGR tidak disatukan/i);
 assert.match(page,/belum diverifikasi/i);
 assert.match(page,/No License Provided/i);
});
test('Industry page keeps shared SLI navigation',()=>{
 for(const value of ['css/sli-navigation.css','js/sli-navigation.js','js/sli-shared-appendix.js','js/sli-live-data.js']) assert.ok(page.includes(value),value);
});
