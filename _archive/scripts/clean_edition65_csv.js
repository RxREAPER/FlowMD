const fs = require('fs');
const path = require('path');

const csvPath = "C:\\Users\\Mohammed Faiz\\.gemini\\antigravity\\brain\\8d3c249b-48da-49bd-8b50-827cefe02f5e\\scratch\\Marrow_E6.5_All_Subjects_Curriculum.csv";
const raw = fs.readFileSync(csvPath, 'utf8');

// Proper CSV parse that handles quoted commas
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

const lines = raw.split(/\r?\n/).filter(l => l.trim());
const dataRows = lines.slice(1).map(l => {
  const parts = parseCSVLine(l);
  return {
    rawSubject: parts[1] || '',
    rawUnit: parts[2] || '',
    topicNum: parts[3] || '',
    topicName: parts[4] || '',
    duration: parts[5] || '',
    rating: parts[6] || ''
  };
}).filter(r => r.rawSubject);

// Subject name mapping (CSV raw name -> Display name)
const subjectMap = {
  'ANATOMY': 'Anatomy',
  'ANAESTHESIA': 'Anaesthesia',
  'ANESDTHESIA': 'Anaesthesia',
  'BIOCEHM': 'Biochemistry',
  'BIOCHEMISTRY': 'Biochemistry',
  'DERMAT': 'Dermatology',
  'DERMATOLOGY': 'Dermatology',
  'ENT': 'ENT',
  'FMT': 'Forensic Medicine',
  'FORENSIC MEDICINE': 'Forensic Medicine',
  'FORENSIC MEDICINE & TOXICOLOGY': 'Forensic Medicine',
  'GENERAL MEDICINE': 'Medicine',
  'MEDICINE': 'Medicine',
  'MICRO': 'Microbiology',
  'MICROBIOLOGY': 'Microbiology',
  'OBGY': 'Obstetrics & Gynaecology',
  'OBSTETRICS & GYNAECOLOGY': 'Obstetrics & Gynaecology',
  'OPHTHALMOLOGY': 'Ophthalmology',
  'OPTHAL': 'Ophthalmology',
  'ORTHO': 'Orthopaedics',
  'ORTHOPAEDICS': 'Orthopaedics',
  'PAEDIATRICS': 'Paediatrics',
  'PATH': 'Pathology',
  'PATHOLOGY': 'Pathology',
  'PEADS': 'Paediatrics',
  'PHARMA': 'Pharmacology',
  'PHARMACOLOGY': 'Pharmacology',
  'PHYSIO': 'Physiology',
  'PHYSIOLOGY': 'Physiology',
  'PREVENTIVE & SOCIAL MEDICINE': 'Community Medicine',
  'PSM': 'Community Medicine',
  'PSYCHIATRY': 'Psychiatry',
  'PSYCHIOTRY': 'Psychiatry',
  'RADIO': 'Radiology',
  'RADIOLOGY': 'Radiology',
  'REVISION': 'Revision',
  'REVISION SERIES': 'Revision',
  'SURGERY': 'Surgery'
};

// Short subjects that have no sub-unit banners (all videos under a single "General" unit)
const shortSubjects = new Set(['Anaesthesia', 'Dermatology', 'Ophthalmology', 'Orthopaedics', 'Psychiatry', 'Radiology']);

// Strip trailing count suffix like "(63 vids)" or "(6 videos)"
function stripCountSuffix(name) {
  return name.replace(/\s*\(\d+\s*videos?\)\s*$/i, '').trim();
}

// Unit name cleaning: insert spaces before capitals, fix known names
function cleanUnitName(subject, name) {
  if (!name) return 'General';
  let cleaned = name.trim();
  if (!cleaned || cleaned.toLowerCase() === 'general') return 'General';

  // Strip "(N vids)" suffix for comparison
  const stripped = stripCountSuffix(cleaned);
  if (stripped.toUpperCase() === subject.toUpperCase()) return 'General';
  if (stripped.toUpperCase().replace(/\s/g, '') === subject.toUpperCase().replace(/\s/g, '')) return 'General';

  // Specific known fixes (comprehensive)
  const unitFixes = {
    // OBGY
    'OBSTETRICS': 'Obstetrics',
    'GYNAECOLOGY': 'Gynaecology',
    'GYNAECOLOGY ONCOLOGY': 'Gynaecology Oncology',
    'GYNAECOLOGY ONCOLOGY / CONTRACEPTION': 'Gynaecology Oncology / Contraception',
    // FMT
    'FORENSIC PATHOLOGY': 'Forensic Pathology',
    'MEDICALJURISPRUDENCE': 'Medical Jurisprudence',
    'SEXUALJURISPRUDENCE': 'Sexual Jurisprudence',
    'FORENSICTRAUMATOLOGY': 'Forensic Traumatology',
    'FORENSICPSYCHIATRYAND MISCELLANEOUS': 'Forensic Psychiatry and Miscellaneous',
    // PSM
    '"PREVENTIVEOBSTETRICS': 'Preventive Obstetrics',
    'PREVENTIVEOBSTETRICS': 'Preventive Obstetrics',
    'BIOMEDICALWASTEMANAGEMENT': 'Biomedical Waste Management',
    'CONCEPTSOFHEALTHANDDISEASE': 'Concepts of Health and Disease',
    'DEMOGRAPHYANDFAMILYPLANNING': 'Demography and Family Planning',
    'DISASTERMANAGEMENT': 'Disaster Management',
    'ENVIRONMENTANDHEALTH': 'Environment and Health',
    'NUTRITIONANDHEALTH': 'Nutrition and Health',
    'HEALTHCAREOFTHECOMMUNITY': 'Healthcare of the Community',
    'INTERNATIONALHEALTH': 'International Health',
    'MEDICINEANDSOCIALSCIENCES': 'Medicine and Social Sciences',
    'EPIDEMIOLOGYOFCOMMUNICABLEDISEASES': 'Epidemiology of Communicable Diseases',
    'EPIDEMIOLOGY OFNON-COMMUNICABLEDISEASES': 'Epidemiology of Non-Communicable Diseases',
    'INDIANHEALTHPROGRAMMES': 'Indian Health Programmes',
    'OCCUPATIONALHEALTH': 'Occupational Health',
    'PREVENTIVEOBSTETRICS,PAEDIATRICSANDGERIATRICS': 'Preventive Obstetrics, Paediatrics and Geriatrics',
    // MEDICINE
    'ACID-BASEREGULATION': 'Acid-Base Regulation',
    'CARDIOVASCULARSYSTEM': 'Cardiovascular System',
    'NERVOUSSYSTEM': 'Nervous System',
    'BLOOD DISORDERS': 'Blood Disorders',
    'INFECTIOUSDISEASES': 'Infectious Diseases',
    'RESPIRATORYSYSTEM': 'Respiratory System',
    'GASTROINTESTINALSYSTEM': 'Gastrointestinal System',
    'RENALSYSTEM': 'Renal System',
    'ENDOCRINESYSTEM': 'Endocrine System',
    'RHEUMATOLOGYAND IMMUNOLOGY': 'Rheumatology and Immunology',
    'RHEUMATOLOGYANDIMMUNOLOGY': 'Rheumatology and Immunology',
    'BIOSTATISTICS': 'Biostatistics',
    'EDUCATION': 'Education',
    // MICRO
    'BACTERIOLOGY': 'Bacteriology',
    'VIROLOGY': 'Virology',
    'MYCOLOGY': 'Mycology',
    'PARASITOLOGY': 'Parasitology',
    'IMMUNOLOGY': 'Immunology',
    'APPLIEDMICROBIOLOGY': 'Applied Microbiology',
    // ANATOMY
    'UPPERLIMB': 'Upper Limb',
    'LOWERLIMB': 'Lower Limb',
    'ABDOMENANDPELVIS': 'Abdomen and Pelvis',
    'THORAX': 'Thorax',
    'HEADANDNECK': 'Head and Neck',
    'NEUROANATOMY': 'Neuroanatomy',
    'EMBRYOLOGY': 'Embryology',
    'HISTOLOGY': 'Histology',
    'GENERALANATOMY': 'General Anatomy',
    'NOSE': 'Nose',
    // BIOCHEMISTRY
    'CARBOHYDRATES': 'Carbohydrates',
    'ENZYMOLOGY': 'Enzymology',
    'LIPIDS': 'Lipids',
    'MOLECULARBIOLOGY': 'Molecular Biology',
    'BIOENERGETICS': 'Bioenergetics',
    'GENERALTOPICS': 'General Topics',
    // ENT
    'PHARYNX': 'Pharynx',
    'LARYNX': 'Larynx',
    // PATH
    'GENERALPATHOLOGY': 'General Pathology',
    'HEMATOLOGY': 'Haematology',
    'HEMOLYTICANEMIAS&RBCDISORDERS': 'Haemolytic Anaemias & RBC Disorders',
    'SYSTEMICPATHOLOGY': 'Systemic Pathology',
    // PEADS
    'NEONATOLOGY': 'Neonatology',
    'NUTRITION': 'Nutrition',
    'GROWTHANDDEVELOPMENT': 'Growth and Development',
    'CARDIOVASCULARSYSTEM': 'Cardiovascular System',
    'RESPIRATORYSYSTEM': 'Respiratory System',
    'GENITO-URINARYSYSTEM': 'Genito-Urinary System',
    'NEUROLOGY': 'Neurology',
    'ENDOCRINESYSTEM': 'Endocrine System',
    'CHILDHOOD MALIGNANCIES': 'Childhood Malignancies',
    'GENETICDISORDERS': 'Genetic Disorders',
    'CHILDHOOD INFECTIONS': 'Childhood Infections',
    'MISCELLANEOUS': 'Miscellaneous',
    'PAEDIATRICRHEUMATOLOGY': 'Paediatric Rheumatology',
    // PHARMA
    'AUTONOMICNERVOUSSYSTEM': 'Autonomic Nervous System',
    'CENTRALANDPERIPHERALNERVOUSSYSTEM': 'Central and Peripheral Nervous System',
    'ANTIMICROBIALS': 'Antimicrobials',
    'AUTACOIDS': 'Autacoids',
    'ANTI-NEOPLASTICAGENTS': 'Anti-Neoplastic Agents',
    'IMMUNOMODULATORS': 'Immunomodulators',
    'GENERALPHARMACOLOGY': 'General Pharmacology',
    'GASTROINTESTINAL DRUGS': 'Gastrointestinal Drugs',
    // PHYSIO
    'CENTRALNERVOUSSYSTEM': 'Central Nervous System',
    'THERESPIRATORYSYSTEM': 'The Respiratory System',
    'THECARDIOVASCULARSYSTEM': 'The Cardiovascular System',
    'THEGASTROINTESTINALTRACT': 'The Gastrointestinal Tract',
    'RENALPHYSIOLOGY': 'Renal Physiology',
    'ENDOCRINEPHYSIOLOGY': 'Endocrine Physiology',
    'REPRODUCTIVEPHYSIOLOGY': 'Reproductive Physiology',
    'EXERCISEPHYSIOLOGY': 'Exercise Physiology',
    'GENERALPHYSIOLOGY': 'General Physiology',
    'NERVEMUSCLEPHYSIOLOGY': 'Nerve Muscle Physiology',
    // SURGERY
    'BREAST': 'Breast',
    'UROLOGY': 'Urology',
    'TRAUMA': 'Trauma',
    'HERNIA': 'Hernia',
    'VASCULAR SURGERY': 'Vascular Surgery',
    'FACIOMAXILLARYSURGERY': 'Faciomaxillary Surgery',
    'SPECIALITYSURGERY': 'Speciality Surgery',
    'GENERALSURGERY': 'General Surgery',
    // REVISION
    'ANATOMY': 'Anatomy',
    'BIOCHEMISTRY': 'Biochemistry',
    'PHYSIOLOGY': 'Physiology',
    'PHARMACOLOGY': 'Pharmacology',
    'MICROBIOLOGY': 'Microbiology',
    'PATHOLOGY': 'Pathology',
    'COMMUNITYMEDICINE': 'Community Medicine',
    'FORENSICMEDICINE': 'Forensic Medicine',
    'OPHTHALMOLOGY': 'Ophthalmology',
    'ANAESTHESIA': 'Anaesthesia',
    'DERMATOLOGY': 'Dermatology',
    'PSYCHIATRY': 'Psychiatry',
    'RADIOLOGY': 'Radiology',
    'SURGERY': 'Surgery',
    'ORTHOPAEDICS': 'Orthopaedics',
    'PAEDIATRICS': 'Paediatrics',
    'OBSTETRICS&GYNAECOLOGY': 'Obstetrics & Gynaecology',
    'MEDICINE': 'Medicine',
    'ENT': 'ENT'
  };

  if (unitFixes[cleaned]) return unitFixes[cleaned];

  // Generic: insert spaces before capitals and clean up
  cleaned = cleaned.replace(/([a-z])([A-Z])/g, '$1 $2');
  cleaned = cleaned.replace(/&/g, ' & ');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  // Title case
  cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
  // Fix small words
  cleaned = cleaned.replace(/\bOf\b/g, 'of').replace(/\bAnd\b/g, 'and').replace(/\bThe\b/g, 'the');

  return cleaned;
}

// Parse duration to mins/secs
function parseDuration(durStr) {
  if (!durStr) return { mins: 0, secs: 0 };
  const match = durStr.match(/([\d.]+)\s*Min/);
  if (match) return { mins: parseInt(match[1]), secs: 0 };
  return { mins: 0, secs: 0 };
}

// Build structured data
const subjects = {};

dataRows.forEach(row => {
  const subjName = subjectMap[row.rawSubject.trim()] || row.rawSubject.trim();
  const unitName = cleanUnitName(subjName, row.rawUnit);
  const dur = parseDuration(row.duration);

  if (!subjects[subjName]) {
    subjects[subjName] = { name: subjName, units: {} };
  }

  if (!subjects[subjName].units[unitName]) {
    subjects[subjName].units[unitName] = [];
  }

  subjects[subjName].units[unitName].push({
    topicNum: parseInt(row.topicNum) || 0,
    title: row.topicName,
    durationMins: dur.mins,
    durationSecs: dur.secs,
    rating: row.rating
  });
});

// Convert to final structure
const result = [];
Object.keys(subjects).sort().forEach(subjName => {
  const subj = subjects[subjName];
  const units = [];

  // Sort units: "General" first, then alphabetical
  const unitKeys = Object.keys(subj.units);
  unitKeys.sort((a, b) => {
    if (a === 'General') return -1;
    if (b === 'General') return 1;
    return a.localeCompare(b);
  });

  unitKeys.forEach(unitName => {
    const videos = subj.units[unitName];
    // Sort by topicNum
    videos.sort((a, b) => a.topicNum - b.topicNum);

    units.push({
      name: unitName,
      videos: videos.map(v => ({
        title: v.title,
        durationMins: v.durationMins,
        durationSecs: v.durationSecs
      }))
    });
  });

  result.push({
    subject: subjName,
    chapters: units
  });
});

// Log the raw unit names per subject for debugging
console.log('=== RAW UNIT NAMES ===');
dataRows.forEach(row => {
  const key = row.rawSubject.trim();
  if (!subjectMap[key]) console.log('UNMAPPED SUBJECT:', `"${key}"`);
});
console.log('=== END RAW UNIT NAMES ===\n');

// Verify "General" was properly applied
result.forEach(s => {
  const genUnit = s.chapters.find(u => u.name === 'General');
  if (genUnit) {
    console.log(`${s.subject}: General has ${genUnit.videos.length} videos`);
  } else {
    console.log(`${s.subject}: NO General unit - units: [${s.chapters.map(u => u.name).join(', ')}]`);
  }
});

// Rename catch-all units to "General" and merge duplicates
result.forEach(s => {
  const seen = {};
  const merged = [];
  
  s.chapters.forEach(c => {
    let name = c.name;
    const normName = name.replace(/[^a-z0-9]/gi, '').toLowerCase();
    const normSubj = s.subject.replace(/[^a-z0-9]/gi, '').toLowerCase();
    
    // Unit name equals subject name -> catch-all
    if (normName === normSubj) {
      name = 'General';
    }
    // Known catch-all unit name variants (not "General XYZ" sub-units)
    if (['General medicine', 'Preventive & social medicine', 'Forensic medicine & toxicology', 'Revision series'].includes(name)) {
      name = 'General';
    }
    
    // Merge into seen map
    if (seen[name]) {
      seen[name].videos = seen[name].videos.concat(c.videos);
    } else {
      const clone = { ...c, name };
      seen[name] = clone;
      merged.push(clone);
    }
  });
  
  // For short subjects, if there's only one non-General unit, rename it
  if (shortSubjects.has(s.subject) && merged.length === 1 && merged[0].name !== 'General') {
    merged[0].name = 'General';
  }
  
  s.chapters = merged;
});

// Generate IDs and videoNumbers with unique abbreviations
result.forEach(subject => {
  // Fix ENT id
  const subjId = subject.subject === 'ENT' ? 'ent' : subject.subject.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/_+$/, '').replace(/^_+/, '');
  subject.id = subjId;

  const usedAbbrs = new Set();
  let vidCounter = 1;

  subject.chapters.forEach(chapter => {
    // Generate unique abbreviation
    let abbr = chapter.name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().substring(0, 6) || 'gen';
    if (!usedAbbrs.has(abbr)) {
      usedAbbrs.add(abbr);
    } else {
      // Find a unique abbreviation
      let n = 1;
      while (usedAbbrs.has(abbr + n)) n++;
      abbr = abbr + n;
      usedAbbrs.add(abbr);
    }

    chapter.videos.forEach((video, vi) => {
      video.id = `${subjId}__${abbr}__v${vi + 1}`;
      video.videoNumber = '#' + String(vidCounter).padStart(2, '0');
      vidCounter++;
    });
  });
});

// Verify no duplicate IDs
const allIds = new Set();
let dupes = 0;
result.forEach(s => s.chapters.forEach(c => c.videos.forEach(v => {
  if (allIds.has(v.id)) { console.log('DUPE:', v.id, 'in', s.subject, '>', c.name); dupes++; }
  allIds.add(v.id);
})));
console.log('\nDuplicates:', dupes);

// Print summary
console.log('\n' + '='.repeat(60));
console.log('FINAL SUMMARY');
console.log('='.repeat(60));
console.log('Total subjects:', result.length);
let grandVids = 0, grandMins = 0;
result.forEach(s => {
  const vids = s.chapters.reduce((a, c) => a + c.videos.length, 0);
  const mins = s.chapters.reduce((a, c) => a + c.videos.reduce((b, v) => b + v.durationMins, 0), 0);
  grandVids += vids;
  grandMins += mins;
  const units = s.chapters.map(c => c.name + ' (' + c.videos.length + ' vids)').join(', ');
  console.log(`\n${s.subject} [${s.id}]: ${vids} videos, ${(mins/60).toFixed(1)} hours`);
  console.log(`  Units: ${units}`);
});
console.log(`\nGrand total: ${grandVids} videos, ${(grandMins/60).toFixed(1)} hours`);

// Write JSON output
const ROOT = __dirname;
fs.writeFileSync(path.join(ROOT, '..', 'marrow_edition_6.5_clean.json'), JSON.stringify(result, null, 2));
console.log('\nWritten to marrow_edition_6.5_clean.json');
