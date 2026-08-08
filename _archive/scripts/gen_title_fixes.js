/**
 * gen_title_fixes.js
 * Scans marrow_edition_6.5_clean.json for all broken titles
 * and generates a EXACT_TITLE_FIXES map using camelCase + known
 * medical word segmentation. Output is printed for review and
 * can be pasted into rebuild_edition65.js.
 */
const fs = require('fs');

const data = JSON.parse(fs.readFileSync('marrow_edition_6.5_clean.json', 'utf8'));

// Comprehensive medical word list for segmentation
// Ordered longest-first to avoid partial matches
const MEDICAL_WORDS = [
  'gametogenesis','embryogenesis','haematopoiesis','haematopoiesis',
  'ophthalmology','pharmacology','ophthalmology','parasitology','bacteriology',
  'immunology','microbiology','biochemistry','physiology','pathology','radiology',
  'neurology','cardiology','endocrinology','nephrology','gastroenterology',
  'dermatology','psychiatry','rheumatology','urology','gynaecology','obstetrics',
  'gynaecologic','paediatric','paediatrics','anaesthesia','anaesthetic',
  'intraoperative','perioperative','postoperative','preoperative',
  'cerebrospinal','cardiovascular','musculoskeletal','neurological','pulmonary',
  'gastrointestinal','genitourinary','urogenital','retroperitoneal',
  'electrocardiogram','echocardiogram','electroencephalogram',
  'pneumothorax','haemothorax','haemorrhage','ischaemia','ischemia',
  'myocardial','pericardial','endocardial','epicardial',
  'hypertension','hypotension','tachycardia','bradycardia','arrhythmia',
  'hypothyroidism','hyperthyroidism','hyperparathyroidism','hypoparathyroidism',
  'hypoglycaemia','hyperglycaemia','hypocalcaemia','hypercalcaemia',
  'hyponatraemia','hypernatraemia','hypokalaemia','hyperkalaemia',
  'malnutrition','malabsorption','malignancy','benign',
  'tuberculosis','meningitis','encephalitis','appendicitis','peritonitis',
  'pancreatitis','cholecystitis','hepatitis','pyelonephritis','cystitis',
  'osteomyelitis','arthritis','rheumatoid','osteoporosis','osteomalacia',
  'fractures','fracture','dislocation','subluxation',
  'development','developmental','gametogenesis','placenta','embryo',
  'parathyroid','pituitary','hypothalamus','thalamus','cerebellum','brainstem',
  'cerebrum','cerebral','frontal','temporal','parietal','occipital',
  'peripheral','autonomic','sympathetic','parasympathetic',
  'diaphragm','peritoneum','retroperitoneum','mesentery',
  'pancreas','gallbladder','biliary','hepatic','portal',
  'urinary','genital','reproductive','prostatic','ovarian','uterine',
  'thyroid','adrenal','pituitary','pancreatic','gonadal',
  'reticuloendothelial','lymphatic','haematopoietic',
  'connective','epithelial','squamous','columnar','cuboidal','transitional',
  'cartilage','tendons','ligaments','fascia','aponeurosis',
  'scapular','pectoral','humeral','radial','ulnar','carpal','femoral',
  'popliteal','tibial','fibular','calcaneal','tarsal',
  'lumbar','sacral','thoracic','cervical','vertebral',
  'vascular','arterial','venous','capillary','lymphatic',
  'coronary','subclavian','carotid','jugular','femoral','popliteal',
  'mediastinum','pleural','pleura','pericardium',
  'retinal','corneal','glaucoma','cataract','conjunctival',
  'tympanic','mastoid','cochlear','vestibular',
  'renal','glomerular','tubular','collecting','ureter','bladder',
  'hepatic','biliary','pancreatic','splenic','gastric','colonic','rectal',
  'spinal','cranial','brachial','lumbosacral',
  'systemic','pulmonary','hepatic','portal','renal',
  'alkalosis','acidosis','electrolyte','osmolality',
  'metabolism','catabolism','anabolism','biosynthesis',
  'glycolysis','gluconeogenesis','lipolysis','proteolysis',
  'infection','inflammation','neoplasia','degeneration','repair',
  'epidemiology','etiology','pathogenesis','morphology','prognosis',
  'treatment','management','diagnosis','investigation','approach',
  'syndrome','disease','disorder','condition','deficiency','excess',
  'history','examination','clinical','features','presentation',
  'investigations','management','treatment','prognosis','complications',
  'surgery','surgical','operative','conservative','medical',
  'anatomy','vessels','nerves','muscles','bones','joints',
  'system','mechanism','function','structure','classification',
  'assessment','evaluation','monitoring','prevention','screening',
  'introduction','overview','principles','basics','advanced',
  'upper','lower','anterior','posterior','medial','lateral',
  'internal','external','superficial','deep',
  'fossa','triangle','space','region','cavity','canal',
  'blood','supply','drainage','lymphatics','innervation',
  'pharmacokinetics','pharmacodynamics','mechanism','action',
  'antibiotics','antimicrobials','antifungals','antivirals',
  'analgesics','anaesthetics','muscle','relaxants',
  'and','of','in','the','for','with','by','at','to','from','on','or',
  'part','week','day','month','year','case','cases','scenario','scenarios',
];

// Sort by length descending (greedy match)
MEDICAL_WORDS.sort((a, b) => b.length - a.length);

function segmentTitle(raw) {
  const t = raw.trim();

  // Already has spaces → pass through camelCase repair only
  if (/ /.test(t)) return null;

  // CamelCase detection → let standard repair handle it
  if (/[a-z][A-Z]/.test(t)) return null;

  // All-uppercase → likely acronym, skip
  if (t === t.toUpperCase() && t.length < 8) return null;

  // Try to segment the all-lowercase merged string
  let lower = t.toLowerCase().replace(/['']/g, "'");
  const words = [];
  let pos = 0;

  while (pos < lower.length) {
    let matched = false;
    for (const word of MEDICAL_WORDS) {
      if (lower.startsWith(word, pos)) {
        words.push(word.charAt(0).toUpperCase() + word.slice(1));
        pos += word.length;
        matched = true;
        break;
      }
    }
    if (!matched) {
      // Grab next run of lowercase chars as unknown token
      const rest = lower.slice(pos);
      const nextWordMatch = rest.match(/^[a-z0-9']+/);
      if (nextWordMatch) {
        const tok = nextWordMatch[0];
        words.push(tok.charAt(0).toUpperCase() + tok.slice(1));
        pos += tok.length;
      } else {
        // Non-alpha char — keep as-is
        words.push(lower[pos]);
        pos++;
      }
    }
  }

  // If we made meaningful splits (more than 1 word), return
  if (words.length > 1) {
    return words.join(' ');
  }
  return null;
}

// Collect all broken titles
const fixes = {};
const couldNotFix = [];

data.forEach(subject => {
  subject.chapters.forEach(chapter => {
    chapter.videos.forEach(v => {
      const t = v.title;
      if (!t) return;

      // Only process titles with no spaces and lowercase-heavy content (merged OCR)
      if (!/ /.test(t) && /[a-z]{5,}/.test(t) && !/^[A-Z][a-z]+$/.test(t)) {
        const fix = segmentTitle(t);
        if (fix && fix !== t) {
          fixes[t] = fix;
        } else {
          couldNotFix.push({ subj: subject.subject, title: t });
        }
      }
    });
  });
});

console.log('// AUTO-GENERATED EXACT_TITLE_FIXES');
console.log('const EXACT_TITLE_FIXES = {');
Object.entries(fixes).forEach(([k, v]) => {
  console.log(`  ${JSON.stringify(k)}: ${JSON.stringify(v)},`);
});
console.log('};');

if (couldNotFix.length) {
  console.error('\n⚠️  Could not auto-fix (' + couldNotFix.length + '):');
  couldNotFix.forEach(x => console.error('  [' + x.subj + '] ' + JSON.stringify(x.title)));
}
