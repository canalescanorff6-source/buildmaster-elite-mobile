import assert from 'node:assert/strict';
import { createMatchValidationRecord } from '../src/lib/appEvolution';
const result:any={parsed:{playerName:'R466',mainPosition:'CMF',nativeSkills:[],specialSkills:[],additionalSkills:[],attributes:{}},training:{passing:4},buildName:'Principal',recommendedSkills:[],recommendedImpetos:[],tacticalProfile:{formation:'4-2-2-2',style:'POSSE_DE_BOLA'},usageFunctionR457:'Orquestrador',cleanSlate2027R119:{gameplayImpactR458:{actions:[{id:'short_creation',label:'Passe',demand:90,projectedGain:3,projectedScore:85,decisionConfidence:95}]}}};
const base:any={minutes:90,overallRating:3,passing:3,movement:3,finishing:3,defending:3,physical:3,stamina:3,tags:[],note:'',testedBuildId:'alt',experimentArm:'B'};
const ab=createMatchValidationRecord(result,base); assert.equal(ab.gameplayImpactSnapshotR460,undefined); assert.ok(ab.buildGenerationSignatureR464);
const main=createMatchValidationRecord(result,{...base,experimentArm:'NONE'}); assert.ok(main.gameplayImpactSnapshotR460);
console.log('R466 aprovado: A/B não herda snapshot promessa×resultado da ficha principal.');
