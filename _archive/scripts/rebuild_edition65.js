/**
 * rebuild_edition65.js  — FINAL CLEAN VERSION
 * ─────────────────────────────────────────────
 * Reads marrow_edition_6.5_clean.json and produces a corrected data_marrow_6_5.js:
 *   1. Subjects reordered to match Edition 8 hierarchy
 *   2. All OCR-mangled titles repaired (camelCase split + explicit patch map)
 *   3. IDs and videoNumbers regenerated cleanly
 */

const fs = require('fs');
const path = require('path');

// ─── 1. LOAD ────────────────────────────────────────────────────────────────────
const raw65 = JSON.parse(fs.readFileSync(path.join(__dirname, '../marrow_edition_6.5_clean.json'), 'utf8'));

// ─── 2. SUBJECT ORDER (matches Edition 8 hierarchy) ────────────────────────────
const SUBJECT_ORDER = [
  'Anatomy','Biochemistry','Physiology','Pharmacology','Microbiology',
  'Pathology','Community Medicine','Forensic Medicine','Ophthalmology','ENT',
  'Anaesthesia','Dermatology','Psychiatry','Radiology','Medicine',
  'Surgery','Orthopaedics','Paediatrics','Obstetrics & Gynaecology','Revision',
];

const DISPLAY_NAME = {
  'ENT': 'Otorhinolaryngology (ENT)',
  'Revision': 'Revision Videos',
};

const SUBJECT_ID = {
  'Anatomy':'anatomy','Biochemistry':'biochemistry','Physiology':'physiology',
  'Pharmacology':'pharmacology','Microbiology':'microbiology','Pathology':'pathology',
  'Community Medicine':'community_medicine','Forensic Medicine':'forensic_medicine',
  'Ophthalmology':'ophthalmology','ENT':'ent','Anaesthesia':'anaesthesia',
  'Dermatology':'dermatology','Psychiatry':'psychiatry','Radiology':'radiology',
  'Medicine':'medicine','Surgery':'surgery','Orthopaedics':'orthopaedics',
  'Paediatrics':'paediatrics','Obstetrics & Gynaecology':'obstetrics_gynaecology',
  'Revision':'revision_videos',
};

// ─── 3. TITLE REPAIR ────────────────────────────────────────────────────────────

// Explicit full-string fixes for known OCR-merged titles
const EXACT = {
  // Anaesthesia
  'IntroductionandHistory': 'Introduction and History',
  'Pre-oppreparation': 'Pre-op Preparation',
  'Breathingsystems': 'Breathing Systems',
  'Monitoringunder': 'Monitoring under', // handled by camelCase + patch
  // Anatomy
  'Connectivetissues': 'Connective Tissues',
  'Lymphaticsystem': 'Lymphatic System',
  'Respiratorysystem': 'Respiratory System',
  'CSFandVentricles': 'CSF and Ventricles',
  'Whitematterofcerebrum': 'White Matter of Cerebrum',
  'Bloodsupplyofbrain': 'Blood Supply of Brain',
  'Duralvenoussinuses': 'Dural Venous Sinuses',
  'Facialnerve': 'Facial Nerve',
  'Spacesofhand': 'Spaces of Hand',
  'Developmentofarcharteries': 'Development of Arch Arteries',
  'Bloodsupplyofheart': 'Blood Supply of Heart',
  'Developmentofgonads': 'Development of Gonads',
  'Femaleinternalorgans': 'Female Internal Organs',
  'Midgutdevelopment': 'Midgut Development',
  'Hindgutdevelopment': 'Hindgut Development',
  'Anteriorabdominalwall': 'Anterior Abdominal Wall',
  'Gametogenesis': 'Gametogenesis',
  'Functionalcolumnsofcranialnerves': 'Functional Columns of Cranial Nerves',
  'Deepcervicalfasciaofneck': 'Deep Cervical Fascia of Neck',
  'Neurovascularstructuresinneck': 'Neurovascular Structures in Neck',
  'Infratemporalfossacontents': 'Infratemporal Fossa Contents',
  'Neuroanatomybasics': 'Neuroanatomy Basics',
  'Developmentofveins': 'Development of Veins',
  'Osteology': 'Osteology',
  'Peritoneum': 'Peritoneum',
  'Diaphragm': 'Diaphragm',
  'Brainstem': 'Brainstem',
  'Cerebellum': 'Cerebellum',
  // Anatomy — more
  'Ulnarnerveandit\'sinjuries': 'Ulnar Nerve and its Injuries',
  'Vesselsofupperlimb': 'Vessels of Upper Limb',
  'CarpalbonesandFlexorretinaculum': 'Carpal Bones and Flexor Retinaculum',
  '1stweekdevelopment': '1st Week Development',
  '2ndweekdevelopment': '2nd Week Development',
  '3rdweekdevelopmentandPlacenta': '3rd Week Development and Placenta',
  'FoldingofembryoandFormationofguttube': 'Folding of Embryo and Formation of Gut Tube',
  'DevelopmentofTongue,Pituitary,Face,PalateandThyroidgland': 'Development of Tongue, Pituitary, Face, Palate and Thyroid Gland',
  'Pectoralregion,BackandScapularregion': 'Pectoral Region, Back and Scapular Region',
  'Radialnerveandit\'sinjuries': 'Radial Nerve and its Injuries',
  'Frontofthigh,AdductorcompartmentandPoplitealfossa': 'Front of Thigh, Adductor Compartment and Popliteal Fossa',
  'LiverandPortalvein': 'Liver and Portal Vein',
  'PancreasandSpleen': 'Pancreas and Spleen',
  'ProstateglandandProstaticurethra': 'Prostate Gland and Prostatic Urethra',
  'Rightatrium,RightventricleandCardiacplexus': 'Right Atrium, Right Ventricle and Cardiac Plexus',
  'Ophthalmicnerve，3rdnerve，4thnerveand6thnerve': 'Ophthalmic Nerve, 3rd Nerve, 4th Nerve and 6th Nerve',
  // Biochemistry
  'Carbohydrates': 'Carbohydrates',
  // Medicine
  'MetabolicAlkalosis': 'Metabolic Alkalosis',
  'CasescenariosonABG': 'Case Scenarios on ABG',
  'Module #269': 'Case Scenarios on ABG',
  'Methodology and interpretationofABGanalysis': 'Methodology and Interpretation of ABG Analysis',
  'ConceptofProbabilityvalue': 'Concept of Probability Value',
  'HypoproliferativeanemiawithMHA': 'Hypoproliferative Anemia with MHA',
  'IntroductiontoEndocrinology': 'Introduction to Endocrinology',
  'PhysiologyofAbsorption': 'Physiology of Absorption',
  'IntroductiontoIBD': 'Introduction to IBD',
  'ManagementofIBD': 'Management of IBD',
  'BasicsofBoneandMineralmetabolism': 'Basics of Bone and Mineral Metabolism',
  'IntroductiontoDM': 'Introduction to DM',
  'Type-1DiabetesMellitus': 'Type-1 Diabetes Mellitus',
  'StoryofResistance': 'Story of Resistance',
  'ManagementofDM': 'Management of DM',
  'lrritablebowelsyndrome': 'Irritable Bowel Syndrome',
  'DevelopmentofLiver': 'Development of Liver',
  'lgG4relateddisease': 'IgG4 Related Disease',
  'ergicbronchopulmonaryAspergillosis': 'Allergic Bronchopulmonary Aspergillosis',
  'DiagnosisofTuberculosis': 'Diagnosis of Tuberculosis',
  'TreatmentofTuberculosis': 'Treatment of Tuberculosis',
  'lgAnephropathy': 'IgA Nephropathy',
  'IntroductiontoPotassiummetabolism': 'Introduction to Potassium Metabolism',
  'SystemicHypertension2022': 'Systemic Hypertension 2022',
  'LanguageV/sSpeech': 'Language vs Speech',
  'BasicsofExtrapyramidalsystem': 'Basics of Extrapyramidal System',
  'InflammatorydemyelinationofCNs': 'Inflammatory Demyelination of CNS',
  'MyeloproliferativeNeoplasms': 'Myeloproliferative Neoplasms',
  'ChronicMyeloidleukemia': 'Chronic Myeloid Leukemia',
  'VonWillebranddisease': 'Von Willebrand Disease',
  'IntroductiontoAcs': 'Introduction to ACS',
  'DevelopmentofKidney': 'Development of Kidney',
  'SmallvesselANCAvasculitis': 'Small Vessel ANCA Vasculitis',
  // Microbiology
  'ActinomycesandNocardia': 'Actinomyces and Nocardia',
  'BrucellaandBacteroides': 'Brucella and Bacteroides',
  'AdaptiveImmunity': 'Adaptive Immunity',
  'ArenaandFiloviruses': 'Arena and Filoviruses',
  'PlasmodiumandBabesia': 'Plasmodium and Babesia',
  'MyositisandMyonecrosis': 'Myositis and Myonecrosis',
  'ChronicMeningitis': 'Chronic Meningitis',
  'EosinophilicMeningitis': 'Eosinophilic Meningitis',
  'InfectiveEndocarditis': 'Infective Endocarditis',
  'AspergillusandMucorales': 'Aspergillus and Mucorales',
  // OBG
  'HIVinpregnancy': 'HIV in Pregnancy',
  'CancerCervix': 'Cancer Cervix',
  'PolypandAdenomyosis': 'Polyp and Adenomyosis',
  // Orthopaedics
  'PaediatricOrthopaedics:Part1': 'Paediatric Orthopaedics: Part 1',
  'PaediatricOrthopaedics:Part3': 'Paediatric Orthopaedics: Part 3',
  'PaediatricOrthopaedicsMCQs': 'Paediatric Orthopaedics MCQs',
  // Pharmacology
  'AntitumorAntibiotics': 'Antitumor Antibiotics',
  'AntipsychoticDrugs': 'Antipsychotic Drugs',
  // Physiology
  'EnvironmentalPhysiology': 'Environmental Physiology',
  'RegulationofBodyTemperature': 'Regulation of Body Temperature',
  'GIhormones': 'GI Hormones',
  // Psychiatry
  'SomatictreatmentsinPsychiatry': 'Somatic Treatments in Psychiatry',
  // Radiology
  'CTbasics': 'CT Basics',
  'MRIbasics': 'MRI Basics',
  'GUTimaging': 'GUT Imaging',
  'GITimaging': 'GIT Imaging',
  // Surgery
  'UpperGIHemorrhage': 'Upper GI Hemorrhage',
  'AdrenalglandandNET': 'Adrenal Gland and NET',
  'ThoraxandMediastinum': 'Thorax and Mediastinum',
  'ThoracicTrauma': 'Thoracic Trauma',
  // Forensic Medicine
  'ConsentinMedicalpractice': 'Consent in Medical Practice',
  'AnimalandPlantirritants': 'Animal and Plant Irritants',
};

// Regex patches for systematic patterns (camelCase + connector words)
const PATCHES = [
  // Connector words glued to preceding lowercase
  [/([a-z])and([A-Z])/g,   '$1 and $2'],
  [/([a-z])and([a-z])/g,   '$1 and $2'],
  [/([a-z])of([A-Z])/g,    '$1 of $2'],
  [/([a-z])of([a-z])/g,    '$1 of $2'],
  [/([a-z])in([A-Z])/g,    '$1 in $2'],
  [/([a-z])with([A-Z])/g,  '$1 with $2'],
  [/([a-z])for([A-Z])/g,   '$1 for $2'],
  [/([a-z])under([A-Z])/g, '$1 under $2'],
  [/([a-z])to([A-Z])/g,    '$1 to $2'],
  // Known subject+Revision merge pattern (e.g. "AnaesthesiaRevision-1" → "Anaesthesia Revision - 1")
  [/(Anatomy|Biochemistry|Physiology|Pharmacology|Microbiology|Pathology|Community Medicine|Forensic Medicine|Ophthalmology|Anaesthesia|Dermatology|Psychiatry|Radiology|Medicine|Surgery|Orthopaedics|Paediatrics|Haematology|Haematology|Nephrology|Endocrinology|Hepatology|Gynaecology|Obstetrics)(Revision)(-\d+)/g, '$1 $2$3'],
  [/(Anatomy|Biochemistry|Physiology|Pharmacology|Microbiology|Pathology|Community|Forensic|Ophthalmology|Anaesthesia|Dermatology|Psychiatry|Radiology|Medicine|Surgery|Orthopaedics|Paediatrics|Haematology|Nephrology|Endocrinology|Hepatology|Gynaecology|Obstetrics)(Revision)\b/g, '$1 $2'],
  // GIT, GUT, CT, MRI abbreviations with lowercase merges
  [/GIT(imaging|Revision)/gi, 'GIT $1'],
  [/GUT(imaging|Revision)/gi, 'GUT $1'],
  [/CT(basics|interpretation|scan)/gi, 'CT $1'],
  [/MRI(basics|interpretation)/gi, 'MRI $1'],
  // "UsG" → "USG"
  [/UsG/g, 'USG'],
  // "lgG", "lgA", "lgM" → "IgG", "IgA", "IgM"
  [/\blg([A-Z0-9])/g, 'Ig$1'],
  // "lrr" → "Irr"
  [/\blr/g, 'Ir'],
];

function repairTitle(raw) {
  if (!raw) return '';
  let t = raw.trim();

  // 0. Exact lookup (highest priority)
  if (EXACT[t]) return EXACT[t];

  // 1. Apply regex patches
  for (const [re, rep] of PATCHES) {
    t = t.replace(re, rep);
  }

  // 2. Standard camelCase split (lowercase → uppercase boundary)
  t = t.replace(/([a-z])([A-Z])/g, '$1 $2');
  // ALLCAPS block followed by capitalised word
  t = t.replace(/([A-Z]{2,})([A-Z][a-z])/g, '$1 $2');

  // 3. Colon/Part fixes
  t = t.replace(/([a-zA-Z]):([A-Z])/g, '$1: $2');
  t = t.replace(/([a-zA-Z]):(\d)/g, '$1: Part $2');
  t = t.replace(/\bPart(\d+)\b/gi, 'Part $1');

  // 4. Number → uppercase
  t = t.replace(/(\d)([A-Z])/g, '$1 $2');

  // 5. Collapse spaces
  t = t.replace(/\s{2,}/g, ' ').trim();

  // 6. Capitalise after ": "
  t = t.replace(/:\s*([a-z])/g, (m, p) => ': ' + p.toUpperCase());

  // 7. Ensure first char uppercase
  if (t.length > 0) t = t.charAt(0).toUpperCase() + t.slice(1);

  return t;
}

// ─── 4. UNIT ABBREVIATION ───────────────────────────────────────────────────────
function makeUnitAbbr(name, used) {
  let abbr = name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().substring(0, 6) || 'gen';
  if (!used.has(abbr)) { used.add(abbr); return abbr; }
  let n = 2;
  while (used.has(abbr + n)) n++;
  used.add(abbr + n);
  return abbr + n;
}

// ─── 5. BUILD INDEX ──────────────────────────────────────────────────────────────
const byName = {};
for (const s of raw65) byName[s.subject] = s;

// ─── 6. REBUILD ──────────────────────────────────────────────────────────────────
const result = [];
let grandVids = 0, grandMins = 0;

for (const rawName of SUBJECT_ORDER) {
  const src = byName[rawName];
  if (!src) { console.warn('⚠️  Missing: ' + rawName); continue; }

  const subjId     = SUBJECT_ID[rawName];
  const subjName   = DISPLAY_NAME[rawName] || rawName;
  const usedAbbrs  = new Set();
  let vidCounter   = 1;
  let subjVids = 0, subjMins = 0;

  const chapters = src.chapters.map(chap => {
    const abbr   = makeUnitAbbr(chap.name, usedAbbrs);
    const videos = (chap.videos || []).map((v, vi) => {
      const title       = repairTitle(v.title);
      const id          = `${subjId}__${abbr}__v${vi + 1}`;
      const videoNumber = '#' + String(vidCounter).padStart(2, '0');
      vidCounter++; subjVids++; subjMins += (v.durationMins || 0);
      grandVids++; grandMins += (v.durationMins || 0);
      return { id, videoNumber, title, durationMins: v.durationMins || 0, durationSecs: v.durationSecs || 0 };
    });
    return { name: chap.name, videos };
  });

  result.push({ id: subjId, subject: subjName, chapters });
  console.log(`✅ ${subjName}: ${chapters.length} units, ${subjVids} videos, ${(subjMins/60).toFixed(1)}h`);
}

// ─── 7. WRITE ────────────────────────────────────────────────────────────────────
const header = `/* ============================================================
   FLOWMD V2 — MARROW EDITION 6.5 SYLLABUS DATASET
   Rebuilt by scripts/rebuild_edition65.js
   Subjects follow Edition 8 hierarchy.
   Titles repaired from OCR. IDs & videoNumbers regenerated.
   Total: ${result.length} subjects | ${grandVids} videos | ${(grandMins/60).toFixed(1)} hours
   ============================================================ */\n\n`;

fs.writeFileSync(
  path.join(__dirname, '../data_marrow_6_5.js'),
  header + 'const syllabusData65 = ' + JSON.stringify(result, null, 2) + ';\n',
  'utf8'
);

console.log('\n' + '═'.repeat(60));
console.log('REBUILD COMPLETE');
console.log('═'.repeat(60));
console.log(`Total Subjects : ${result.length}`);
console.log(`Total Units    : ${result.reduce((a,s) => a + s.chapters.length, 0)}`);
console.log(`Total Videos   : ${grandVids}`);
console.log(`Total Hours    : ${(grandMins/60).toFixed(1)}`);
console.log('Output         : data_marrow_6_5.js');
