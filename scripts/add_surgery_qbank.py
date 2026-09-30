import re

surgery_dataset_js = """    surgery: {
      id: 'surgery',
      name: 'Surgery',
      faculty: 'Dr. Rohan Khandelwal',
      accentColor: '#ef4444',
      chapters: [
        {
          id: 'surg_chap_general_surgery',
          name: 'GENERAL SURGERY',
          topics: [
            {
              id: 'surg_t1_fluids_electrolytes_nutrition',
              name: 'Fluids, Electrolytes & Nutrition',
              rating: 4.5,
              mcqCount: 23,
              isPro: true,
              image: 'surgery',
              questions: [
                {
                  id: 'surg_q1_1',
                  questionNumber: 1,
                  text: 'A 70-kg adult male sustains 40% Total Body Surface Area (TBSA) second and third-degree thermal burns. According to the Parkland formula, what is the total volume of Ringer Lactate to be administered in the first 24 hours, and how much should be given in the first 8 hours post-injury?',
                  options: [
                    { id: 'A', text: '5,600 mL total; 2,800 mL in first 8 hours' },
                    { id: 'B', text: '11,200 mL total; 5,600 mL in first 8 hours' },
                    { id: 'C', text: '8,400 mL total; 4,200 mL in first 8 hours' },
                    { id: 'D', text: '14,000 mL total; 7,000 mL in first 8 hours' }
                  ],
                  correctOption: 'B',
                  explanation: 'Parkland formula = 4 mL x Weight (kg) x % TBSA burns. For a 70 kg patient with 40% burns: 4 x 70 x 40 = 11,200 mL of Ringer Lactate in 24 hours. Half of this total (5,600 mL) is infused in the first 8 hours calculated from the exact time of burn injury, and the remaining half (5,600 mL) is infused over the next 16 hours.',
                  keyConcept: 'Parkland Formula: 4 mL x kg x % TBSA. Half in first 8 hours from time of injury, remainder over next 16 hours. Target urine output = 0.5-1.0 mL/kg/hr.'
                },
                {
                  id: 'surg_q1_2',
                  questionNumber: 2,
                  text: 'A 55-year-old post-laparotomy patient with prolonged nasogastric suction develops muscular cramps and lethargy. Arterial blood gas reveals pH 7.52, HCO3 34 mEq/L, and serum potassium 2.8 mEq/L. Urinary analysis reveals acidic urine. What is the physiological mechanism underlying this paradoxical aciduria?',
                  options: [
                    { id: 'A', text: 'Excessive renal retention of chloride in exchange for bicarbonate' },
                    { id: 'B', text: 'Distal renal tubular exchange of H+ ions for Na+ due to severe hypokalemia and volume depletion' },
                    { id: 'C', text: 'Proximal tubular wasting of hydrogen ions due to aldosterone inhibition' },
                    { id: 'D', text: 'Increased excretion of ammonium salts triggered by hypercalcemia' }
                  ],
                  correctOption: 'B',
                  explanation: 'In gastric outlet obstruction or prolonged nasogastric suction, loss of gastric HCl leads to hypochloremic hypokalemic metabolic alkalosis. As aldosterone acts to conserve Na+ in response to volume depletion, the renal collecting tubule has insufficient K+ to exchange for Na+, forcing the kidney to excrete H+ ions instead, leading to paradoxical aciduria.',
                  keyConcept: 'Paradoxical aciduria occurs in hypochloremic hypokalemic metabolic alkalosis when severe K+ depletion forces renal H+ excretion for Na+ reabsorption.'
                },
                {
                  id: 'surg_q1_3',
                  questionNumber: 3,
                  text: 'Which of the following electrolyte abnormalities represents the classic hallmark and primary driver of mortality in Refeeding Syndrome during aggressive parenteral or enteral nutritional rehabilitation of a chronically malnourished patient?',
                  options: [
                    { id: 'A', text: 'Severe hyperkalemia' },
                    { id: 'B', text: 'Severe hypophosphatemia' },
                    { id: 'C', text: 'Hypermagnesemia' },
                    { id: 'D', text: 'Severe hypercalcemia' }
                  ],
                  correctOption: 'B',
                  explanation: 'Refeeding syndrome occurs when carbohydrate reintroduction triggers an insulin surge, driving phosphate, potassium, and magnesium into cells for glycolysis and ATP generation. Severe hypophosphatemia leads to cardiac arrhythmia, respiratory muscle weakness (inability to wean from ventilator), rhabdomyolysis, and death.',
                  keyConcept: 'Refeeding syndrome triad: Hypophosphatemia (hallmark), Hypokalemia, Hypomagnesemia. Thiamine supplementation is essential before refeeding.'
                }
              ]
            },
            {
              id: 'surg_t2_shock_blood_transfusion',
              name: 'Shock and Blood Transfusion',
              rating: 4.5,
              mcqCount: 20,
              isPro: true,
              image: 'surgery',
              questions: [
                {
                  id: 'surg_q2_1',
                  questionNumber: 1,
                  text: 'A 28-year-old polytrauma patient presents to the resuscitation bay with HR 128 bpm, BP 86/54 mmHg, RR 32/min, marked confusion, and urine output of 10 mL/hr. According to ATLS guidelines, what class of hemorrhagic shock is this patient experiencing, and what is the estimated blood loss?',
                  options: [
                    { id: 'A', text: 'Class I shock (Blood loss < 15% / < 750 mL)' },
                    { id: 'B', text: 'Class II shock (Blood loss 15-30% / 750-1500 mL)' },
                    { id: 'C', text: 'Class III shock (Blood loss 30-40% / 1500-2000 mL)' },
                    { id: 'D', text: 'Class IV shock (Blood loss > 40% / > 2000 mL)' }
                  ],
                  correctOption: 'C',
                  explanation: 'Class III hemorrhagic shock is characterized by 30-40% blood loss (1500-2000 mL), marked tachycardia (HR > 120 bpm), hypotension (decreased systolic BP), tachypnea (RR 30-40), oliguria (5-15 mL/hr), and mental status changes (confused/anxious). Requires packed RBCs and blood component resuscitation.',
                  keyConcept: 'ATLS Hemorrhagic Shock: Class I (<15%), Class II (15-30%, normal BP), Class III (30-40%, hypotension + tachycardia), Class IV (>40%, immediate life threat).'
                },
                {
                  id: 'surg_q2_2',
                  questionNumber: 2,
                  text: 'In the activation of a Massive Transfusion Protocol (MTP) for severe exsanguinating hemorrhagic trauma, what is the standard recommended balanced ratio of Packed Red Blood Cells (PRBC), Fresh Frozen Plasma (FFP), and Platelets?',
                  options: [
                    { id: 'A', text: '4 : 2 : 1 ratio' },
                    { id: 'B', text: '1 : 1 : 1 ratio (Hemostatic resuscitation)' },
                    { id: 'C', text: '3 : 1 : 1 ratio' },
                    { id: 'D', text: '6 : 2 : 1 ratio' }
                  ],
                  correctOption: 'B',
                  explanation: 'Damage Control Resuscitation and modern MTP protocols (e.g. PROPPR trial) mandate a balanced 1:1:1 ratio of PRBCs, FFPs, and Platelets to reconstitute whole blood physiology and preemptively combat the lethal triad of trauma (hypothermia, acidosis, and coagulopathy).',
                  keyConcept: 'Massive Transfusion Protocol: 1:1:1 ratio of PRBC : FFP : Platelets. Definition: >= 10 units PRBC in 24 hrs or > 4 units in 1 hr.'
                }
              ]
            },
            {
              id: 'surg_t3_instruments_sutures',
              name: 'Instruments & Sutures',
              rating: 4.5,
              mcqCount: 36,
              isPro: true,
              image: 'surgery',
              questions: [
                {
                  id: 'surg_q3_1',
                  questionNumber: 1,
                  text: 'Which of the following suture materials is a synthetic, monofilament, non-absorbable polymer that provides long-term tensile strength and is the gold standard suture of choice for vascular anastomoses?',
                  options: [
                    { id: 'A', text: 'Polyglactin 910 (Vicryl)' },
                    { id: 'B', text: 'Polydioxanone (PDS II)' },
                    { id: 'C', text: 'Polypropylene (Prolene)' },
                    { id: 'D', text: 'Chromic Catgut' }
                  ],
                  correctOption: 'C',
                  explanation: 'Polypropylene (Prolene) is a non-absorbable synthetic monofilament with low tissue reactivity, smooth passage through delicate vascular endothelium without drag, and permanent tensile strength retention, making it ideal for cardiovascular and vascular anastomoses.',
                  keyConcept: 'Prolene (Polypropylene) = Monofilament, non-absorbable, vascular suture of choice. PDS = Monofilament absorbable (180 days). Vicryl = Braided absorbable (56-70 days).'
                },
                {
                  id: 'surg_q3_2',
                  questionNumber: 2,
                  text: 'According to the Jenkins rule (Hughes principle) for closure of the midline abdominal fascia to prevent incisional hernia, what is the optimal suture-to-wound length ratio?',
                  options: [
                    { id: 'A', text: '1 : 1 ratio' },
                    { id: 'B', text: '2 : 1 ratio' },
                    { id: 'C', text: '4 : 1 ratio with continuous slowly absorbable suture' },
                    { id: 'D', text: '6 : 1 ratio with interrupted silk sutures' }
                  ],
                  correctOption: 'C',
                  explanation: 'Jenkins rule states that the length of suture used must be at least 4 times the length of the abdominal incision (4:1 ratio), placed in continuous fashion with tissue bites taken 5-8 mm from the cut edge and spaced 5 mm apart using slowly absorbable monofilament (PDS) or looped nylon.',
                  keyConcept: 'Jenkins / Hughes rule: Suture length to wound length ratio >= 4:1. Reduces tension and prevents tissue cutting and incisional hernia.'
                }
              ]
            },
            {
              id: 'surg_t4_paediatric_surgery',
              name: 'Paediatric Surgery',
              rating: 4.5,
              mcqCount: 22,
              isPro: true,
              image: 'surgery',
              questions: [
                {
                  id: 'surg_q4_1',
                  questionNumber: 1,
                  text: 'A 4-week-old firstborn male infant presents with persistent non-bilious projectile vomiting after feeds. On physical examination, a palpable olive-shaped mass is noted in the epigastrium. What is the classic metabolic disturbance, and what is the definitive surgical management?',
                  options: [
                    { id: 'A', text: 'Hyperchloremic metabolic acidosis; Ladd procedure' },
                    { id: 'B', text: 'Hypochloremic hypokalemic metabolic alkalosis; Ramstedt extramucosal pyloromyotomy' },
                    { id: 'C', text: 'Normal anion gap metabolic acidosis; Duodenoduodenostomy' },
                    { id: 'D', text: 'Respiratory alkalosis with hyperkalemia; Nissen fundoplication' }
                  ],
                  correctOption: 'B',
                  explanation: 'Congenital Hypertrophic Pyloric Stenosis (CHPS) causes loss of gastric HCl through non-bilious projectile vomiting, producing hypochloremic hypokalemic metabolic alkalosis with paradoxical aciduria. After fluid and electrolyte resuscitation, Ramstedt pyloromyotomy (splitting the hypertrophied circular muscle without breaching mucosa) is curative.',
                  keyConcept: 'CHPS: Non-bilious projectile vomiting, olive mass, hypochloremic hypokalemic metabolic alkalosis. Ramstedt pyloromyotomy is definitive.'
                },
                {
                  id: 'surg_q4_2',
                  questionNumber: 2,
                  text: 'A newborn baby is delivered with scaphoid abdomen, cyanosis, and respiratory distress. Heart sounds are displaced to the right side, and bowel sounds are audible over the left hemithorax. What is the initial resuscitation priority before surgical repair?',
                  options: [
                    { id: 'A', text: 'Immediate bag-and-mask positive pressure ventilation' },
                    { id: 'B', text: 'Immediate endotracheal intubation and nasogastric decompression (avoid bag-and-mask ventilation)' },
                    { id: 'C', text: 'Emergency thoracotomy in the delivery suite' },
                    { id: 'D', text: 'Immediate chest drain placement on the left side' }
                  ],
                  correctOption: 'B',
                  explanation: 'In Congenital Diaphragmatic Hernia (CDH / Bochdalek hernia), bag-and-mask ventilation is strictly contraindicated because air will distend intrathoracic bowel loops, causing catastrophic mediastinal shift and worsening pulmonary hypoplasia. Immediate endotracheal intubation and NG tube decompression are paramount.',
                  keyConcept: 'CDH: Bochdalek hernia (postero-lateral, mostly left). Intubate immediately; DO NOT bag-mask ventilate. Stabilize pulmonary hypertension before surgery.'
                }
              ]
            },
            {
              id: 'surg_t5_trauma_scores_assessment',
              name: 'Trauma - Scores, Investigations and Assessment',
              rating: 4.5,
              mcqCount: 20,
              isPro: true,
              image: 'surgery',
              questions: [
                {
                  id: 'surg_q5_1',
                  questionNumber: 1,
                  text: 'A 32-year-old motorcyclist involved in a road traffic crash opens eyes to pain (2), makes incomprehensible sounds (2), and shows abnormal flexion / decorticate posturing to painful stimuli (3). What is the calculated Glasgow Coma Scale (GCS) score, and what does this score dictate?',
                  options: [
                    { id: 'A', text: 'GCS 9; Moderate head injury, close monitoring in ICU' },
                    { id: 'B', text: 'GCS 7; Severe head injury, requires immediate endotracheal intubation for airway protection' },
                    { id: 'C', text: 'GCS 5; Brain death evaluation protocol' },
                    { id: 'D', text: 'GCS 10; Observation in high dependency unit' }
                  ],
                  correctOption: 'B',
                  explanation: 'GCS = Eye (2) + Verbal (2) + Motor (3) = 7. A GCS score of <= 8 defines severe traumatic brain injury (TBI) and mandates immediate definitive airway protection with endotracheal intubation.',
                  keyConcept: 'GCS = E(4) + V(5) + M(6). Total 3 to 15. GCS <= 8 indicates severe TBI requiring definitive airway protection.'
                },
                {
                  id: 'surg_q5_2',
                  questionNumber: 2,
                  text: 'Which of the following describes the standard four acoustic windows examined during a Focused Assessment with Sonography for Trauma (FAST) scan in blunt abdominal trauma?',
                  options: [
                    { id: 'A', text: 'Right upper quadrant (Morison pouch), Left upper quadrant (Splenorenal), Pelvis (Suprapubic), and Subxiphoid (Pericardial)' },
                    { id: 'B', text: 'Aortic root, Carotid bifurcation, Femoral canal, and Popliteal fossa' },
                    { id: 'C', text: 'Epigastrium, Right iliac fossa, Left iliac fossa, and Umbilicus' },
                    { id: 'D', text: 'Right hypochondrium, Left hypochondrium, Scrotum, and Lumbar spine' }
                  ],
                  correctOption: 'A',
                  explanation: 'FAST scan evaluates 4 classic dependent spaces for free hemoperitoneum/hemopericardium: 1) Hepatorenal recess (Morison pouch - most sensitive), 2) Splenorenal recess, 3) Pelvis / Retrovesical / Pouch of Douglas, 4) Subxiphoid / Pericardial space. Extended FAST (eFAST) adds anterior thoracic pleural views for pneumothorax.',
                  keyConcept: 'FAST scan windows: Morison pouch (RUQ, most sensitive), Splenorenal (LUQ), Pelvis, Pericardial (Subxiphoid). eFAST adds pleural lung-sliding assessment.'
                }
              ]
            },
            {
              id: 'surg_t6_trauma_spinal_thoracic_abdominal',
              name: 'Trauma - Spinal, Thoracic and Abdominal Injuries',
              rating: 4.6,
              mcqCount: 33,
              isPro: true,
              image: 'surgery',
              questions: [
                {
                  id: 'surg_q6_1',
                  questionNumber: 1,
                  text: 'A trauma patient with blunt chest injury presents in severe respiratory distress with absent breath sounds on the right side, hyperresonance to percussion, distended neck veins, tracheal deviation to the left, and profound hypotension (BP 70/40 mmHg). What is the immediate first-line life-saving intervention?',
                  options: [
                    { id: 'A', text: 'Immediate portable upright chest radiograph' },
                    { id: 'B', text: 'Immediate needle decompression followed by tube thoracostomy (chest drain)' },
                    { id: 'C', text: 'Emergency median sternotomy in the operating room' },
                    { id: 'D', text: 'Intravenous bolus of epinephrine and bicarbonate' }
                  ],
                  correctOption: 'B',
                  explanation: 'Tension pneumothorax is a clinical diagnosis requiring immediate emergency decompression without waiting for radiological confirmation. Life-saving needle thoracostomy is performed (5th ICS anterior to mid-axillary line or 2nd ICS MCL) followed by definitive intercostal chest tube insertion in the 5th ICS anterior axillary line (safe triangle).',
                  keyConcept: 'Tension Pneumothorax: Clinical emergency. Immediate needle decompression in 5th ICS anterior axillary line or 2nd ICS MCL, followed by chest tube in 5th ICS.'
                },
                {
                  id: 'surg_q6_2',
                  questionNumber: 2,
                  text: 'Beck triad, pathognomonic of acute cardiac tamponade in penetrating or blunt thoracic trauma, comprises which of the following clinical findings?',
                  options: [
                    { id: 'A', text: 'Hypertension, Bradycardia, and Irregular respirations' },
                    { id: 'B', text: 'Hypotension, Muffled/distant heart sounds, and Distended jugular veins' },
                    { id: 'C', text: 'Fever, Right upper quadrant pain, and Jaundice' },
                    { id: 'D', text: 'Tachycardia, Tracheal deviation, and Subcutaneous emphysema' }
                  ],
                  correctOption: 'B',
                  explanation: 'Beck triad of cardiac tamponade includes: 1) Hypotension with narrowed pulse pressure, 2) Muffled heart sounds, and 3) Distended jugular neck veins (elevated JVP). Pulsus paradoxus (drop in systolic BP > 10 mmHg during normal inspiration) and electrical alternans on ECG are key supporting features.',
                  keyConcept: 'Beck Triad = Hypotension + Muffled heart sounds + Elevated JVP. Pulsus paradoxus > 10 mmHg. Subxiphoid pericardiocentesis / thoracotomy is definitive.'
                }
              ]
            }
          ]
        },
        {
          id: 'surg_chap_breast',
          name: 'BREAST',
          topics: [
            {
              id: 'surg_t7_breast_anatomy_benign',
              name: 'Breast - Anatomy, Congenital and Benign Diseases',
              rating: 4.5,
              mcqCount: 24,
              isPro: true,
              image: 'surgery',
              questions: [
                {
                  id: 'surg_q7_1',
                  questionNumber: 1,
                  text: 'A 22-year-old female presents with a painless, highly mobile, firm, well-circumscribed 2.5 cm lump in the upper outer quadrant of her left breast (\\"breast mouse\\"). Core needle biopsy confirms benign proliferation of stromal and epithelial elements without atypia. What is the most likely diagnosis?',
                  options: [
                    { id: 'A', text: 'Fibroadenoma' },
                    { id: 'B', text: 'Phyllodes tumor' },
                    { id: 'C', text: 'Invasive ductal carcinoma' },
                    { id: 'D', text: 'Fat necrosis of breast' }
                  ],
                  correctOption: 'A',
                  explanation: 'Fibroadenoma is the most common benign breast neoplasm in young females aged 15-35 years. It is classically termed \\"breast mouse\\" due to its marked mobility. It arises from the terminal duct lobular unit (TDLU) and shows intracanalicular and pericanalicular stromal patterns.',
                  keyConcept: 'Fibroadenoma: Most common benign breast tumor in young women. \\"Breast mouse\\" mobility. Conservative observation or enucleation if > 3 cm / symptomatic.'
                }
              ]
            },
            {
              id: 'surg_t8_ca_breast_risk_types',
              name: 'Carcinoma Breast - Risk Factors and Types',
              rating: 4.5,
              mcqCount: 16,
              isPro: true,
              image: 'surgery',
              questions: [
                {
                  id: 'surg_q8_1',
                  questionNumber: 1,
                  text: 'Which histopathological subtype of invasive breast carcinoma is classically characterized by loss of E-cadherin expression, a single-file \\"Indian-file\\" linear pattern of tumor cells, and a high frequency of bilateral and multifocal involvement?',
                  options: [
                    { id: 'A', text: 'Invasive Ductal Carcinoma (NST)' },
                    { id: 'B', text: 'Invasive Lobular Carcinoma' },
                    { id: 'C', text: 'Medullary Carcinoma' },
                    { id: 'D', text: 'Mucinous (Colloid) Carcinoma' }
                  ],
                  correctOption: 'B',
                  explanation: 'Invasive Lobular Carcinoma (ILC) accounts for ~10-15% of breast cancers. Inactivation of the CDH1 gene leads to loss of E-cadherin cell adhesion protein, resulting in single-file infiltration (\\"Indian-file\\" pattern). ILC has a high propensity for multicentricity, bilaterality, and unique peritoneal/gastrointestinal metastases.',
                  keyConcept: 'Invasive Lobular Carcinoma: CDH1 mutation / Loss of E-cadherin, \\"Indian-file\\" pattern, high rate of multicentricity and bilateral disease.'
                }
              ]
            },
            {
              id: 'surg_t9_investigations_breast',
              name: 'Investigations in Breast diseases',
              rating: 4.5,
              mcqCount: 21,
              isPro: true,
              image: 'surgery',
              questions: [
                {
                  id: 'surg_q9_1',
                  questionNumber: 1,
                  text: 'What are the three mandatory components of the \\"Triple Assessment\\" in the definitive diagnostic workup of any palpable breast lump?',
                  options: [
                    { id: 'A', text: 'Clinical examination, Imaging (Mammography / Ultrasound), and Pathology (Core needle biopsy / FNAC)' },
                    { id: 'B', text: 'Serum CA 15-3, Chest X-ray, and Bone scan' },
                    { id: 'C', text: 'Digital Mammography, Breast MRI, and PET-CT scan' },
                    { id: 'D', text: 'Clinical examination, Genetic testing for BRCA1/2, and Frozen section' }
                  ],
                  correctOption: 'A',
                  explanation: 'Triple assessment consists of: 1) Clinical breast examination, 2) Radiological imaging (Digital mammography for age >= 40, High-resolution USG for age < 40 / dense breasts), and 3) Pathological examination (Core needle biopsy is gold standard for receptor status). When all 3 are concordant, diagnostic accuracy exceeds 99%.',
                  keyConcept: 'Triple Assessment = Clinical Exam + Imaging (Mammogram/USG) + Core Needle Biopsy. Concordance achieves > 99% diagnostic accuracy.'
                }
              ]
            },
            {
              id: 'surg_t10_ca_breast_staging_molecular',
              name: 'Carcinoma Breast - Staging, Prognosis & Molecular Types',
              rating: 4.5,
              mcqCount: 13,
              isPro: true,
              image: 'surgery',
              questions: [
                {
                  id: 'surg_q10_1',
                  questionNumber: 1,
                  text: 'Which intrinsic molecular subtype of breast cancer is defined by ER-negative, PR-negative, and HER2-neu negative status (Triple Negative Breast Cancer / TNBC), carries the worst prognosis, and is strongly associated with BRCA1 germline mutations?',
                  options: [
                    { id: 'A', text: 'Luminal A subtype' },
                    { id: 'B', text: 'Luminal B subtype' },
                    { id: 'C', text: 'HER2-enriched subtype' },
                    { id: 'D', text: 'Basal-like / Triple Negative subtype' }
                  ],
                  correctOption: 'D',
                  explanation: 'Triple Negative Breast Cancer (TNBC / Basal-like) lacks estrogen receptors (ER-), progesterone receptors (PR-), and HER2 overexpression. It typically affects younger women, has high histological grade, early visceral metastasis, poor response to endocrine/targeted therapy, and high BRCA1 association.',
                  keyConcept: 'Molecular Subtypes: Luminal A (ER+, PR+, HER2-, low Ki67 - best prognosis), Luminal B (ER+, high Ki67), HER2-enriched (HER2+, Trastuzumab responsive), Basal-like / TNBC (ER-, PR-, HER2-).'
                }
              ]
            },
            {
              id: 'surg_t11_ca_breast_treatment',
              name: 'Carcinoma Breast - Treatment',
              rating: 4.5,
              mcqCount: 29,
              isPro: true,
              image: 'surgery',
              questions: [
                {
                  id: 'surg_q11_1',
                  questionNumber: 1,
                  text: 'A 50-year-old female with clinically node-negative early breast cancer undergoes Breast Conserving Surgery (Lumpectomy). Which of the following statements regarding adjuvant therapy is mandatory following Breast Conserving Surgery?',
                  options: [
                    { id: 'A', text: 'Adjuvant whole-breast radiation therapy is mandatory to reduce local recurrence rates' },
                    { id: 'B', text: 'Radiation therapy can be omitted if tumor size is less than 3 cm' },
                    { id: 'C', text: 'Immediate bilateral mastectomy is indicated if margins are 1 mm' },
                    { id: 'D', text: 'Chemotherapy alone is sufficient without any radiation therapy' }
                  ],
                  correctOption: 'A',
                  explanation: 'Breast Conserving Therapy (BCT) mandates complete wide local excision with clear histological margins (\\"no ink on tumor\\") PLUS adjuvant whole-breast radiotherapy (WBRT) to achieve equivalent overall survival to modified radical mastectomy (MRM).',
                  keyConcept: 'Breast Conserving Surgery MUST always be followed by adjuvant radiotherapy. Overall survival is equivalent to Modified Radical Mastectomy.'
                }
              ]
            }
          ]
        },
        {
          id: 'surg_chap_endocrine_system',
          name: 'ENDOCRINE SYSTEM',
          topics: [
            {
              id: 'surg_t12_benign_thyroid',
              name: 'Benign Lesions of Thyroid',
              rating: 4.5,
              mcqCount: 24,
              isPro: true,
              image: 'surgery',
              questions: [
                {
                  id: 'surg_q12_1',
                  questionNumber: 1,
                  text: 'A 38-year-old woman presents with a solitary 3 cm right lobe thyroid nodule. Ultrasound reveals a well-defined isoechoic nodule with a peripheral hypoechoic halo and no microcalcifications. Fine Needle Aspiration Cytology (FNAC) reports Bethesda Category II (Benign follicular nodule). What is the appropriate initial management?',
                  options: [
                    { id: 'A', text: 'Immediate total thyroidectomy with central compartment neck dissection' },
                    { id: 'B', text: 'Clinical and sonographic surveillance / follow-up at 6 to 12 months' },
                    { id: 'C', text: 'High-dose radioactive iodine (I-131) ablation therapy' },
                    { id: 'D', text: 'External beam radiotherapy to the anterior neck' }
                  ],
                  correctOption: 'B',
                  explanation: 'Bethesda Category II carries a very low malignancy risk (< 3%). In an asymptomatic euthyroid patient with benign cytology and no compressive symptoms, clinical observation and periodic ultrasound surveillance at 6-12 months is the standard of care.',
                  keyConcept: 'Bethesda II (Benign, risk < 3%) -> Observation/Surveillance. Bethesda IV (Follicular neoplasm) -> Diagnostic lobectomy. Bethesda VI (Malignant) -> Total thyroidectomy.'
                }
              ]
            },
            {
              id: 'surg_t13_thyroid_malignancies',
              name: 'Thyroid Malignancies',
              rating: 4.5,
              mcqCount: 27,
              isPro: true,
              image: 'surgery',
              questions: [
                {
                  id: 'surg_q13_1',
                  questionNumber: 1,
                  text: 'A 34-year-old woman undergoes total thyroidectomy for a solitary thyroid nodule. Histopathology reveals papillary architecture, ground-glass optically clear nuclei (\\"Orphan Annie eyes\\"), intranuclear pseudoinclusions, and concentric laminated calcifications (psammoma bodies). What is the diagnosis and primary mode of metastasis?',
                  options: [
                    { id: 'A', text: 'Follicular Thyroid Carcinoma; Hematogenous spread to bone and lung' },
                    { id: 'B', text: 'Papillary Thyroid Carcinoma; Lymphatic spread to regional cervical lymph nodes' },
                    { id: 'C', text: 'Medullary Thyroid Carcinoma; Direct invasion into trachea' },
                    { id: 'D', text: 'Anaplastic Thyroid Carcinoma; Rapid hematogenous dissemination' }
                  ],
                  correctOption: 'B',
                  explanation: 'Papillary Thyroid Carcinoma (PTC) is the most common thyroid malignancy (~85%). Hallmark features include Orphan Annie eye nuclei, nuclear grooves, pseudoinclusions, and Psammoma bodies. PTC predominantly spreads via lymphatics to cervical lymph nodes (Levels II-VI) and carries an excellent prognosis.',
                  keyConcept: 'Papillary Thyroid Cancer: Most common (~85%), Orphan Annie nuclei, Psammoma bodies, lymphatic spread, BRAF V600E mutation. Excellent prognosis.'
                },
                {
                  id: 'surg_q13_2',
                  questionNumber: 2,
                  text: 'Medullary Thyroid Carcinoma (MTC) arises from parafollicular C-cells of neural crest origin and is associated with Multiple Endocrine Neoplasia (MEN) type 2. Which tumor marker is measured post-operatively to monitor for residual or recurrent disease?',
                  options: [
                    { id: 'A', text: 'Serum Thyroglobulin' },
                    { id: 'B', text: 'Serum Calcitonin and Carcinoembryonic Antigen (CEA)' },
                    { id: 'C', text: 'Serum Alpha-fetoprotein (AFP)' },
                    { id: 'D', text: 'Serum CA-125' }
                  ],
                  correctOption: 'B',
                  explanation: 'Medullary Thyroid Carcinoma secretes Calcitonin and Carcinoembryonic Antigen (CEA). These serve as highly specific and sensitive tumor markers for diagnosis, post-operative monitoring, and detecting recurrence. Germline RET proto-oncogene screening is mandatory in all MTC patients.',
                  keyConcept: 'Medullary Thyroid Carcinoma: C-cells, Calcitonin + CEA markers, amyloid stroma, RET proto-oncogene mutation (MEN 2A/2B). Total thyroidectomy + central neck dissection.'
                }
              ]
            },
            {
              id: 'surg_t14_the_parathyroids',
              name: 'The Parathyroids',
              rating: 4.4,
              mcqCount: 22,
              isPro: true,
              image: 'surgery',
              questions: [
                {
                  id: 'surg_q14_1',
                  questionNumber: 1,
                  text: 'A 45-year-old female presents with recurrent nephrolithiasis, generalized bone aches, peptic ulcer disease, and depression (\\"stones, bones, groans, and psychiatric overtones\\"). Laboratory tests reveal serum Calcium 11.8 mg/dL (elevated) and intact PTH 145 pg/mL (elevated). What is the single most common underlying etiology of primary hyperparathyroidism?',
                  options: [
                    { id: 'A', text: 'Single benign parathyroid adenoma (~85% of cases)' },
                    { id: 'B', text: 'Four-gland parathyroid hyperplasia (~15% of cases)' },
                    { id: 'C', text: 'Parathyroid carcinoma (< 1% of cases)' },
                    { id: 'D', text: 'Ectopic PTH-related peptide secretion from lung squamous carcinoma' }
                  ],
                  correctOption: 'A',
                  explanation: 'Primary hyperparathyroidism is most commonly caused by a single parathyroid adenoma (80-85%), followed by four-gland hyperplasia (10-15%) and parathyroid carcinoma (< 1%). Pre-operative localization is performed with Tc-99m Sestamibi SPECT scan and 4D-CT.',
                  keyConcept: 'Primary Hyperparathyroidism: Hypercalcemia + High PTH. Etiology: Single Adenoma (85%). Sestamibi scan localization. Focused minimally invasive parathyroidectomy.'
                }
              ]
            },
            {
              id: 'surg_t15_the_adrenals',
              name: 'The Adrenals',
              rating: 4.4,
              mcqCount: 16,
              isPro: true,
              image: 'surgery',
              questions: [
                {
                  id: 'surg_q15_1',
                  questionNumber: 1,
                  text: 'In the pre-operative pharmacological preparation of a patient with confirmed Pheochromocytoma to prevent intraoperative hypertensive crisis and lethal cardiovascular collapse, what is the crucial sequence of adrenergic receptor blockade?',
                  options: [
                    { id: 'A', text: 'Beta-blocker first, followed by Alpha-blocker after 1 week' },
                    { id: 'B', text: 'Alpha-blocker first (e.g., Phenoxybenzamine), followed by Beta-blocker only after adequate alpha blockade is established' },
                    { id: 'C', text: 'Calcium channel blocker alone without adrenergic antagonists' },
                    { id: 'D', text: 'High-dose intravenous hydrocortisone alone' }
                  ],
                  correctOption: 'B',
                  explanation: 'Alpha-blockade MUST always precede beta-blockade (\\"A before B\\") in pheochromocytoma. Initiating a beta-blocker first leaves alpha-adrenergic receptors unopposed, causing intense peripheral vasoconstriction, severe paradoxical hypertension, and acute hypertensive crisis or pulmonary edema.',
                  keyConcept: 'Pheochromocytoma: Alpha-blockade FIRST (Phenoxybenzamine/Doxazosin) for 10-14 days with volume repletion, then add Beta-blocker for tachycardia. \\"A before B\\".'
                }
              ]
            }
          ]
        },
        {
          id: 'surg_chap_upper_gi_surgery',
          name: 'UPPER GI SURGERY',
          topics: [
            {
              id: 'surg_t16_esophagus_congenital_motility',
              name: 'Esophagus - Congenital, Motility & Inflammatory Disorders',
              rating: 4.6,
              mcqCount: 26,
              isPro: true,
              image: 'surgery',
              questions: [
                {
                  id: 'surg_q16_1',
                  questionNumber: 1,
                  text: 'A 38-year-old patient presents with progressive dysphagia to both solids and liquids, regurgitation of undigested food, and nocturnal cough. Barium esophagogram demonstrates a dilated esophagus with smooth, symmetrical tapering at the gastroesophageal junction (\\"bird-beak\\" appearance). High-resolution manometry confirms aperistalsis and elevated integrated relaxation pressure (IRP). What is the definitive laparoscopic surgical treatment?',
                  options: [
                    { id: 'A', text: 'Laparoscopic Nissen 360-degree fundoplication' },
                    { id: 'B', text: 'Laparoscopic Heller cardiomyotomy with partial anterior (Dor) fundoplication' },
                    { id: 'C', text: 'Subtotal esophagectomy with gastric pull-up' },
                    { id: 'D', text: 'Laparoscopic sleeve gastrectomy' }
                  ],
                  correctOption: 'B',
                  explanation: 'Achalasia cardia is characterized by failure of LES relaxation and aperistalsis of the esophageal body. Gold standard surgical management is Laparoscopic Heller cardiomyotomy (incising circular muscle fibers of lower esophagus and upper stomach) combined with a partial anterior Dor (or Toupet) fundoplication to prevent secondary GERD.',
                  keyConcept: 'Achalasia: Dysphagia to solids AND liquids, bird-beak sign, aperistalsis. Treatment: Heller cardiomyotomy with partial fundoplication or POEM.'
                }
              ]
            },
            {
              id: 'surg_t17_esophagus_gerd_carcinoma',
              name: 'Esophagus - GERD & Carcinoma',
              rating: 4.5,
              mcqCount: 19,
              isPro: true,
              image: 'surgery',
              questions: [
                {
                  id: 'surg_q17_1',
                  questionNumber: 1,
                  text: 'Longstanding gastroesophageal reflux disease (GERD) can lead to Barrett esophagus, defined histologically by intestinal metaplasia with goblet cells in the lower esophagus. Which histological type of esophageal carcinoma does Barrett esophagus predispose to?',
                  options: [
                    { id: 'A', text: 'Squamous cell carcinoma' },
                    { id: 'B', text: 'Esophageal Adenocarcinoma' },
                    { id: 'C', text: 'Small cell neuroendocrine carcinoma' },
                    { id: 'D', text: 'Leiomyosarcoma' }
                  ],
                  correctOption: 'B',
                  explanation: 'Barrett esophagus is a premalignant condition where normal stratified squamous epithelium of the distal esophagus is replaced by specialized columnar epithelium with goblet cells (intestinal metaplasia) in response to chronic acid-bile reflux, increasing the risk of Esophageal Adenocarcinoma by 30-40 fold.',
                  keyConcept: 'Barrett esophagus: Intestinal metaplasia with goblet cells -> risk for Esophageal Adenocarcinoma (lower 1/3). Squamous cell carcinoma = upper/mid 2/3, smoking/alcohol.'
                }
              ]
            },
            {
              id: 'surg_t18_stomach_and_duodenum',
              name: 'Stomach and Duodenum',
              rating: 4.6,
              mcqCount: 28,
              isPro: true,
              image: 'surgery',
              questions: [
                {
                  id: 'surg_q18_1',
                  questionNumber: 1,
                  text: 'A 42-year-old male presents with sudden-onset severe, agonizing epigastric pain that rapidly became generalized. On physical examination, the abdomen is board-like rigid with absent bowel sounds. An erect chest radiograph reveals free air under the right dome of the diaphragm (pneumoperitoneum). What is the most common site of perforated peptic ulcer?',
                  options: [
                    { id: 'A', text: 'Posterior wall of the stomach fundus' },
                    { id: 'B', text: 'Anterior wall of the first part of the duodenum (D1)' },
                    { id: 'C', text: 'Third part of duodenum (D3)' },
                    { id: 'D', text: 'Greater curvature of the stomach body' }
                  ],
                  correctOption: 'B',
                  explanation: 'Perforated peptic ulcer most commonly occurs on the anterior wall of the first part of the duodenum (D1). (Note: Posterior duodenal ulcers typically erode into the gastroduodenal artery, causing massive gastrointestinal hemorrhage rather than free intraperitoneal perforation). Surgical management is Graham omental patch repair.',
                  keyConcept: 'Anterior duodenal ulcer = Perforation (pneumoperitoneum, Graham patch repair). Posterior duodenal ulcer = Bleeding (Gastroduodenal artery erosion).'
                }
              ]
            },
            {
              id: 'surg_t19_carcinoma_stomach',
              name: 'Carcinoma Stomach',
              rating: 4.6,
              mcqCount: 20,
              isPro: true,
              image: 'surgery',
              questions: [
                {
                  id: 'surg_q19_1',
                  questionNumber: 1,
                  text: 'In the histopathological classification of Gastric Adenocarcinoma by Lauren, which subtype is characterized by poorly differentiated signet-ring cells with intracellular mucin vacuoles, diffuse transmural infiltration producing linitis plastica (leather bottle stomach), and loss of E-cadherin expression?',
                  options: [
                    { id: 'A', text: 'Intestinal type gastric adenocarcinoma' },
                    { id: 'B', text: 'Diffuse type gastric adenocarcinoma' },
                    { id: 'C', text: 'Gastrointestinal stromal tumor (GIST)' },
                    { id: 'D', text: 'Gastric lymphoma (MALToma)' }
                  ],
                  correctOption: 'B',
                  explanation: 'Lauren Diffuse type gastric cancer features signet-ring cells that diffusely infiltrate the gastric wall without forming glands, leading to marked desmoplasia (linitis plastica). It occurs in younger patients, is not linked to H. pylori or intestinal metaplasia, and has a poorer prognosis than the intestinal type.',
                  keyConcept: 'Gastric Cancer: Lauren Intestinal (glandular, H. pylori, elderly) vs Diffuse (signet ring cells, CDH1 mutation, linitis plastica, younger patients).'
                }
              ]
            },
            {
              id: 'surg_t20_metabolic_bariatric_surgery',
              name: 'Metabolic & Bariatric Surgery',
              rating: 4.5,
              mcqCount: 14,
              isPro: true,
              image: 'surgery',
              questions: [
                {
                  id: 'surg_q20_1',
                  questionNumber: 1,
                  text: 'A 35-year-old female post-Roux-en-Y gastric bypass (RYGB) presents with tachycardia, diaphoresis, lightheadedness, and severe abdominal cramping 20 minutes after ingesting a carbohydrate-rich dessert. What is the physiological condition and mechanism?',
                  options: [
                    { id: 'A', text: 'Early Dumping Syndrome due to rapid transit of hyperosmolar chyme into the jejunum causing fluid shift' },
                    { id: 'B', text: 'Late Dumping Syndrome due to reactive hyperinsulinemic hypoglycemia' },
                    { id: 'C', text: 'Marginal ulceration of the gastrojejunal anastomosis' },
                    { id: 'D', text: 'Peterson internal hernia with bowel strangulation' }
                  ],
                  correctOption: 'A',
                  explanation: 'Early Dumping Syndrome occurs within 15-30 minutes after meals due to rapid emptying of hyperosmolar simple carbohydrates into the small bowel, causing rapid fluid shifts from intravascular space into the lumen (hypovolemia, tachycardia, hypotension) and autonomic symptoms. Late dumping occurs 2-3 hours later due to reactive hypoglycemia.',
                  keyConcept: 'Early dumping (< 30 min): Hyperosmolar fluid shift -> autonomic vasomotor symptoms. Late dumping (2-3 hrs): Reactive hyperinsulinemia -> hypoglycemia.'
                }
              ]
            }
          ]
        },
        {
          id: 'surg_chap_lower_gi_hernia_surgery',
          name: 'LOWER GI & HERNIA SURGERY',
          topics: [
            {
              id: 'surg_t21_small_intestine',
              name: 'Small Intestine',
              rating: 4.5,
              mcqCount: 31,
              isPro: true,
              image: 'surgery',
              questions: [
                {
                  id: 'surg_q21_1',
                  questionNumber: 1,
                  text: 'Meckel diverticulum arises from incomplete obliteration of the vitellointestinal (omphalomesenteric) duct. Which of the following is true regarding its classic \\"Rule of 2s\\"?',
                  options: [
                    { id: 'A', text: '2% prevalence, 2 inches long, 2 feet proximal to ileocecal valve, contains 2 types of ectopic mucosa (gastric & pancreatic)' },
                    { id: 'B', text: '20% prevalence, 20 cm long, 20 cm from ligament of Treitz' },
                    { id: 'C', text: 'Presents only in patients above 20 years with 2 cm margins' },
                    { id: 'D', text: 'Located on the mesenteric border of the mid-jejunum' }
                  ],
                  correctOption: 'A',
                  explanation: 'Meckel diverticulum Rule of 2s: 2% of population, 2 inches (5 cm) long, located on the antimesenteric border ~2 feet (60 cm) from the ileocecal valve, 2:1 male to female ratio, presents before age 2 with painless lower GI bleeding, and commonly contains 2 ectopic tissues (gastric mucosa #1, pancreatic tissue #2).',
                  keyConcept: 'Meckel Diverticulum: Vitellointestinal duct remnant. Antimesenteric border, 2 feet from IC valve. Ectopic gastric mucosa causes ulceration and bleeding. Tc-99m pertechnetate scan.'
                }
              ]
            },
            {
              id: 'surg_t22_large_intestine',
              name: 'Large Intestine',
              rating: 4.6,
              mcqCount: 30,
              isPro: true,
              image: 'surgery',
              questions: [
                {
                  id: 'surg_q22_1',
                  questionNumber: 1,
                  text: 'An 80-year-old nursing home resident presents with massive abdominal distension, obstipation, and abdominal pain. An abdominal radiograph reveals a hugely distended, inverted U-shaped loop of colon rising out of the pelvis to the right upper quadrant, with no haustral markings (\\"coffee-bean sign\\"). What is the diagnosis and first-line initial intervention in the absence of peritonitis?',
                  options: [
                    { id: 'A', text: 'Cecal volvulus; Emergency right hemicolectomy' },
                    { id: 'B', text: 'Sigmoid volvulus; Endoscopic / Sigmoidoscopic detorsion and rectal flatus tube placement' },
                    { id: 'C', text: 'Toxic megacolon; Total abdominal colectomy' },
                    { id: 'D', text: 'Small bowel obstruction; Long intestinal tube insertion' }
                  ],
                  correctOption: 'B',
                  explanation: 'Sigmoid volvulus classically shows the coffee-bean / bent inner tube sign pointing towards the right upper quadrant. In the absence of bowel gangrene or perforation (peritonitis), first-line management is non-operative detorsion via rigid/flexible sigmoidoscopy and placement of a rectal tube, followed by elective semi-urgent sigmoid resection.',
                  keyConcept: 'Sigmoid volvulus: Coffee-bean sign (apex RUQ). First-line: Sigmoidoscopic detorsion + rectal tube. Definitive: Resection and primary anastomosis.'
                }
              ]
            },
            {
              id: 'surg_t23_appendix',
              name: 'Appendix',
              rating: 4.6,
              mcqCount: 24,
              isPro: true,
              image: 'surgery',
              questions: [
                {
                  id: 'surg_q23_1',
                  questionNumber: 1,
                  text: 'In the modified Alvarado scoring system (MANTRELS) for evaluating suspected acute appendicitis, which two parameters are each assigned a score of 2 points (total score out of 10)?',
                  options: [
                    { id: 'A', text: 'Migratory right iliac fossa pain and Anorexia' },
                    { id: 'B', text: 'Right lower quadrant (RLQ) Tenderness and Leukocytosis (> 10,000/mcL)' },
                    { id: 'C', text: 'Nausea/vomiting and Elevated temperature' },
                    { id: 'D', text: 'Rebound tenderness and Shift of WBC to the left' }
                  ],
                  correctOption: 'B',
                  explanation: 'Alvarado Score (MANTRELS): Migration of pain (1), Anorexia (1), Nausea/vomiting (1), Tenderness in RLQ (2 points), Rebound tenderness (1), Elevated temperature (1), Leukocytosis (2 points), Shift to left (1). Total = 10. Tenderness in RLQ and Leukocytosis are weighted 2 points each.',
                  keyConcept: 'Alvarado Score: RLQ Tenderness (2) and Leukocytosis (2) carry 2 points each. Score >= 7 strongly predicts acute appendicitis requiring surgery.'
                }
              ]
            },
            {
              id: 'surg_t24_polyps_colorectal_carcinoma',
              name: 'Polyps and Colorectal Carcinoma',
              rating: 4.6,
              mcqCount: 36,
              isPro: true,
              image: 'surgery',
              questions: [
                {
                  id: 'surg_q24_1',
                  questionNumber: 1,
                  text: 'Which hereditary colorectal cancer syndrome is an autosomal dominant condition caused by germline mutations in DNA Mismatch Repair (MMR) genes (MLH1, MSH2, MSH6, PMS2) with microsatellite instability (MSI-H), predisposing to right-sided colon cancers and endometrial/ovarian carcinomas?',
                  options: [
                    { id: 'A', text: 'Familial Adenomatous Polyposis (FAP)' },
                    { id: 'B', text: 'Lynch Syndrome (Hereditary Non-Polyposis Colorectal Cancer / HNPCC)' },
                    { id: 'C', text: 'Peutz-Jeghers Syndrome' },
                    { id: 'D', text: 'Gardner Syndrome' }
                  ],
                  correctOption: 'B',
                  explanation: 'Lynch syndrome (HNPCC) is caused by germline mutations in DNA mismatch repair (MMR) genes leading to microsatellite instability (MSI-High). Patients develop predominantly proximal/right-sided colorectal cancers at an early age without extensive polyposis, as well as extracolonic cancers (endometrial, ovarian, gastric, urinary tract).',
                  keyConcept: 'Lynch Syndrome (HNPCC): MMR genes (MLH1, MSH2, MSH6, PMS2), MSI-H, right-sided colon cancer + Endometrial cancer. Amsterdam II and Bethesda criteria.'
                }
              ]
            },
            {
              id: 'surg_t25_rectum',
              name: 'Rectum',
              rating: 4.5,
              mcqCount: 21,
              isPro: true,
              image: 'surgery',
              questions: [
                {
                  id: 'surg_q25_1',
                  questionNumber: 1,
                  text: 'What is the standard oncological surgical principle established by Bill Heald for curative resection of middle and lower rectal adenocarcinoma to drastically reduce local recurrence rates?',
                  options: [
                    { id: 'A', text: 'Total Mesorectal Excision (TME) with intact mesorectal fascia envelope' },
                    { id: 'B', text: 'Simple transanal local excision' },
                    { id: 'C', text: 'Hartmann procedure without pelvic lymphadenectomy' },
                    { id: 'D', text: 'Subtotal colectomy with ileorectal anastomosis' }
                  ],
                  correctOption: 'A',
                  explanation: 'Total Mesorectal Excision (TME) involves sharp dissection under direct vision along the embryological holy plane between the visceral mesorectal fascia and the parietal presacral fascia, delivering an intact cylindrical mesorectal package containing all regional lymph nodes with clear circumferential resection margin (CRM).',
                  keyConcept: 'TME (Total Mesorectal Excision): Sharp dissection along the mesorectal envelope. Minimizes CRM involvement and reduces local recurrence to < 5%.'
                }
              ]
            },
            {
              id: 'surg_t26_anus_anal_canal',
              name: 'Anus and Anal Canal',
              rating: 4.5,
              mcqCount: 23,
              isPro: true,
              image: 'surgery',
              questions: [
                {
                  id: 'surg_q26_1',
                  questionNumber: 1,
                  text: 'According to Goodsall rule for anal fistulae (fistula-in-ano), an external opening located anterior to a transverse line drawn across the anus will open into the anal canal via which trajectory?',
                  options: [
                    { id: 'A', text: 'A direct radial track into the anterior midline of the anal canal' },
                    { id: 'B', text: 'A curved track travelling to the posterior midline at 6 o\\'clock' },
                    { id: 'C', text: 'A horseshoe track around the levator ani muscle' },
                    { id: 'D', text: 'Directly into the ischiorectal fossa without internal opening' }
                  ],
                  correctOption: 'A',
                  explanation: 'Goodsall rule: Fistulae with external openings anterior to the transverse anal line follow a straight radial track into the anterior anal crypts (exception: anterior openings > 3.75 cm from anal verge take a curved track to the posterior midline). Fistulae with external openings posterior to the line take a curved track to the posterior midline crypt at 6 o\\'clock.',
                  keyConcept: 'Goodsall Rule: Anterior = Straight radial track; Posterior = Curved track to posterior midline (6 o\\'clock). Exception: Anterior openings > 3.75 cm from verge.'
                }
              ]
            },
            {
              id: 'surg_t27_hernia',
              name: 'Hernia',
              rating: 4.5,
              mcqCount: 32,
              isPro: true,
              image: 'surgery',
              questions: [
                {
                  id: 'surg_q27_1',
                  questionNumber: 1,
                  text: 'An indirect inguinal hernia enters the inguinal canal through the deep (internal) inguinal ring and is anatomically located in what relation to the Inferior Epigastric Vessels?',
                  options: [
                    { id: 'A', text: 'Medial to the inferior epigastric vessels' },
                    { id: 'B', text: 'Lateral to the inferior epigastric vessels' },
                    { id: 'C', text: 'Directly posterior to the external iliac vein' },
                    { id: 'D', text: 'Inferior to the inguinal ligament through the femoral ring' }
                  ],
                  correctOption: 'B',
                  explanation: 'Indirect inguinal hernia enters through the deep inguinal ring LATERAL to the inferior epigastric vessels (congenital patent processus vaginalis). Direct inguinal hernia pushes through Hesselbach triangle MEDIAL to the inferior epigastric vessels (acquired weakness of fascia transversalis).',
                  keyConcept: 'Inguinal Hernia: Indirect = Lateral to inferior epigastric vessels (into deep ring); Direct = Medial to inferior epigastric vessels (Hesselbach triangle).'
                },
                {
                  id: 'surg_q27_2',
                  questionNumber: 2,
                  text: 'What are the anatomical boundaries of Hesselbach triangle of the anterior abdominal wall?',
                  options: [
                    { id: 'A', text: 'Inferior: Inguinal ligament; Lateral: Inferior epigastric vessels; Medial: Lateral border of Rectus abdominis muscle' },
                    { id: 'B', text: 'Superior: Conjoint tendon; Inferior: Cooper ligament; Medial: Femoral vein' },
                    { id: 'C', text: 'Lateral: Psoas major; Medial: Pubic tubercle; Superior: Ilioinguinal nerve' },
                    { id: 'D', text: 'Inferior: Pectineal ligament; Medial: Lacunar ligament; Lateral: Femoral artery' }
                  ],
                  correctOption: 'A',
                  explanation: 'Hesselbach triangle boundaries: 1) Inferior / Base: Inguinal ligament (of Poupart), 2) Lateral: Inferior epigastric vessels, 3) Medial: Lateral border of Rectus abdominis (linea semilunaris). Floor is formed by Fascia transversalis through which direct inguinal hernias protrude.',
                  keyConcept: 'Hesselbach Triangle: Inguinal ligament (inferior), Inferior epigastric artery (lateral), Rectus abdominis lateral border (medial). Floor = Transversalis fascia.'
                }
              ]
            }
          ]
        },
        {
          id: 'surg_chap_hepato_biliary_surgery',
          name: 'HEPATO-BILIARY SURGERY',
          topics: [
            { id: 'surg_t28_benign_conditions_liver', name: 'Benign Conditions of Liver', rating: 4.5, mcqCount: 22, isPro: true, image: 'surgery', questions: [] },
            { id: 'surg_t29_malignant_liver_tumors_hydatid', name: 'Malignant Liver Tumors & Hydatid Disease', rating: 4.6, mcqCount: 25, isPro: true, image: 'surgery', questions: [] },
            { id: 'surg_t30_gallbladder_biliary_system', name: 'Gallbladder and Biliary System', rating: 4.6, mcqCount: 34, isPro: true, image: 'surgery', questions: [] },
            { id: 'surg_t31_portal_hypertension_spleen', name: 'Portal Hypertension and Spleen', rating: 4.5, mcqCount: 26, isPro: true, image: 'surgery', questions: [] },
            { id: 'surg_t32_pancreas_pancreatitis', name: 'Pancreas - Pancreatitis and Cystic Lesions', rating: 4.6, mcqCount: 28, isPro: true, image: 'surgery', questions: [] },
            { id: 'surg_t33_pancreatic_malignancies', name: 'Pancreatic Malignancies and Periampullary Carcinomas', rating: 4.5, mcqCount: 22, isPro: true, image: 'surgery', questions: [] }
          ]
        },
        {
          id: 'surg_chap_urology',
          name: 'UROLOGY',
          topics: [
            { id: 'surg_t34_kidney_ureter_stones', name: 'Kidneys and Ureter - Anomalies and Urolithiasis', rating: 4.5, mcqCount: 30, isPro: true, image: 'surgery', questions: [] },
            { id: 'surg_t35_urinary_bladder_prostate', name: 'Urinary Bladder and Prostate', rating: 4.6, mcqCount: 32, isPro: true, image: 'surgery', questions: [] },
            { id: 'surg_t36_testis_scrotum_penis', name: 'Testis, Scrotum and Urethra', rating: 4.5, mcqCount: 25, isPro: true, image: 'surgery', questions: [] }
          ]
        },
        {
          id: 'surg_chap_vascular_plastic_wound',
          name: 'VASCULAR, PLASTIC & WOUND CARE',
          topics: [
            { id: 'surg_t37_arterial_venous_disorders', name: 'Arterial and Venous Disorders', rating: 4.5, mcqCount: 28, isPro: true, image: 'surgery', questions: [] },
            { id: 'surg_t38_burns_skin_grafts_flaps', name: 'Burns, Wounds, Grafts and Flaps', rating: 4.6, mcqCount: 26, isPro: true, image: 'surgery', questions: [] }
          ]
        }
      ]
    }"""

def main():
    with open('js/core/qbank-data.js', 'r', encoding='utf-8') as f:
        content = f.read()

    # Check if surgery is already in CURATED_QBANKS
    if 'surgery:' in content:
        print('Surgery is already in qbank-data.js')
        return

    # Find the end of CURATED_QBANKS object
    alias_needle = 'CURATED_QBANKS.anesthesia = CURATED_QBANKS.anaesthesia;'
    if alias_needle not in content:
        print('Could not find alias needle')
        return

    pos = content.find(alias_needle)
    # find the closing brace of CURATED_QBANKS before pos
    brace_pos = content.rfind('  };', 0, pos)
    if brace_pos == -1:
        print('Could not find closing brace of CURATED_QBANKS')
        return

    new_content = content[:brace_pos] + ',\n' + surgery_dataset_js + '\n' + content[brace_pos:]
    
    # Add surgery aliases
    alias_str = '  CURATED_QBANKS.general_surgery = CURATED_QBANKS.surgery;\n  CURATED_QBANKS.surg = CURATED_QBANKS.surgery;\n'
    new_pos = new_content.find(alias_needle)
    new_content = new_content[:new_pos] + alias_str + new_content[new_pos:]

    # Update populateSampleQuestions to be subject-aware (so Surgery and other subjects get rich clinical surgical questions)
    old_populate = """  function populateSampleQuestions(topicId, topicName, count, subjectName, chapterName) {
    const list = [];
    const highYieldTopics = [
      { t: 'Characteristic Radiographic Findings', concept: 'Pathognomonic radiological signs and diagnostic patterns' },
      { t: 'High-Resolution CT (HRCT) Features', concept: 'Secondary pulmonary lobule anatomy, ground-glass opacities, and honeycombing' },
      { t: 'Differential Diagnosis & Multi-Modality Correlation', concept: 'Distinguishing benign vs malignant lesions using CT/MRI' },
      { t: 'Staging & Management Guidelines', concept: 'Clinical staging, TNM classification, and interventional radiological management' },
      { t: 'Clinical Vignette & Emergency Radiology', concept: 'Rapid triage, emergency CT interpretation, and life-saving interventions' }
    ];

    for (let i = 1; i <= count; i++) {
      const hyp = highYieldTopics[(i - 1) % highYieldTopics.length];
      const qNum = i;
      list.push({
        id: `${topicId}_q${qNum}`,
        questionNumber: qNum,
        text: `In the evaluation of ${topicName} (${subjectName} — ${chapterName}), which of the following statements represents the most accurate clinical radiological feature regarding ${hyp.t} (Question ${qNum})?`,
        options: [
          { id: 'A', text: `Classic high-attenuation consolidation with air-bronchogram signs on diagnostic imaging` },
          { id: 'B', text: `Characteristic pathognomonic radiological pattern indicating specific underlying tissue pathology` },
          { id: 'C', text: `Diffuse uniform low-density appearance with peripheral non-enhancing calcification` },
          { id: 'D', text: `Atypical paradoxical expansion with complete absence of vascular flow on Doppler` }
        ],
        correctOption: 'B',
        explanation: `In ${topicName}, option B correctly describes the key pathological and imaging hallmark for ${hyp.t}. Understanding the underlying anatomical and tissue density changes is vital for NEET-PG clinical questions.`,
        keyConcept: `${topicName}: ${hyp.concept}.`
      });
    }
    return list;
  }"""

    new_populate = """  function populateSampleQuestions(topicId, topicName, count, subjectName, chapterName) {
    const list = [];
    const isSurg = /surgery|surgical|general_surgery/i.test(subjectName || '') || /surg_/i.test(topicId || '');
    
    const surgeryHighYield = [
      {
        t: 'Surgical Anatomy & Anatomical Landmarks',
        q: (t, s, c, i) => `In the surgical management of ${t} (${s}), knowledge of key anatomical planes and vascular landmarks is critical. Which of the following statements regarding the surgical anatomy of this region is most accurate?`,
        opt: [
          'The primary arterial supply and lymphatic drainage run along well-defined fascial planes that dictate oncological clearance margins',
          'The anatomical structures lack defined surgical boundaries, requiring extensive blunt blind dissection in all cases',
          'Adjacent major neurovascular bundles are protected by rigid fibrous sheaths and are immune to iatrogenic traction injury',
          'Lymphatic drainage consistently bypasses regional lymph node basins to drain directly into the thoracic duct'
        ],
        cOpt: 'A',
        exp: (t) => `In ${t}, surgical resection planes are strictly defined by embryonic fascial envelopes and regional vascular anatomy to achieve R0 oncological resection while preserving adjacent vital neurovascular bundles.`,
        concept: 'Embryological surgical planes and vascular supply dictate safe dissection and oncological resection margins.'
      },
      {
        t: 'Diagnostic Triad & Workup',
        q: (t, s, c, i) => `A patient presents with classic clinical signs of ${t} (${c}). What is the gold standard diagnostic investigation and initial staging modality of choice?`,
        opt: [
          'High-resolution Contrast-Enhanced Computed Tomography (CECT) with targeted tissue biopsy / cross-sectional imaging',
          'Plain abdominal radiography in supine projection without contrast',
          'Empirical diagnostic laparotomy before performing non-invasive imaging',
          'Serum inflammatory markers alone without radiological correlation'
        ],
        cOpt: 'A',
        exp: (t) => `In ${t}, high-resolution CECT / contrast imaging provides accurate anatomical delineation, vascular roadmap, and TNM staging, guiding pre-operative surgical decision-making.`,
        concept: 'Contrast-enhanced cross-sectional imaging (CECT/MRI) is the cornerstone of surgical diagnostic evaluation and staging.'
      },
      {
        t: 'Operative Indications & Procedure of Choice',
        q: (t, s, c, i) => `What is the definitive surgical procedure of choice and accepted oncological clearance guideline for ${t}?`,
        opt: [
          'Complete excision / resection with clear histological margins and regional lymphadenectomy according to standardized guidelines',
          'Partial debulking with deliberately positive margins to minimize operative duration',
          'Routine unselective emergency surgery without pre-operative optimization or resuscitation',
          'Exclusive medical management without consideration of surgical indications'
        ],
        cOpt: 'A',
        exp: (t) => `For ${t}, adherence to standardized surgical indications, radical clear margins (R0 resection), and appropriate lymph node harvest achieves optimal long-term disease-free survival.`,
        concept: 'Standardized operative technique with R0 margins and lymphadenectomy improves long-term surgical outcomes.'
      },
      {
        t: 'Post-operative Complications & Prevention',
        q: (t, s, c, i) => `Following operative intervention for ${t}, which of the following represents the most critical early post-operative complication requiring vigilant monitoring?`,
        opt: [
          'Anastomotic leakage, early hemorrhage, and surgical site infection requiring prompt clinical recognition and early intervention',
          'Spontaneous complete resolution of all fluid collections within 2 hours without intervention',
          'Universal permanent adrenal insufficiency in all patients undergoing this procedure',
          'Immediate cessation of all enteral nutritional support for 3 weeks post-operatively'
        ],
        cOpt: 'A',
        exp: (t) => `Early detection of post-operative hemorrhage, anastomotic dehiscence, and sepsis is critical in ${t}. Early drain output monitoring and hemodynamic surveillance prevent major morbidity.`,
        concept: 'Vigilant monitoring for anastomotic leak and hemorrhage enables timely salvage and minimizes post-op mortality.'
      },
      {
        t: 'Emergency Management & ATLS / Critical Care Principles',
        q: (t, s, c, i) => `In an acute emergency presentation of ${t} (${s} — ${c}), what is the primary resuscitation priority according to established surgical protocols?`,
        opt: [
          'Structured primary survey (Airway, Breathing, Circulation), aggressive targeted resuscitation, and timely surgical intervention',
          'Immediate administration of high-dose sedatives prior to securing the airway',
          'Delaying hemodynamic resuscitation until secondary tertiary imaging is fully completed',
          'Universal immediate laparotomy before establishing intravenous vascular access'
        ],
        cOpt: 'A',
        exp: (t) => `Emergency surgical management mandates strict adherence to ABCDE resuscitation principles, correction of coagulopathy and hypothermia, followed by timely damage control or definitive surgery.`,
        concept: 'Damage control resuscitation (ABCDE) and physiologic stabilization precede definitive surgical exploration.'
      }
    ];

    const generalHighYield = [
      {
        t: 'Pathophysiology & Clinical Hallmark',
        q: (t, s, c, i) => `In the evaluation of ${t} (${s} — ${c}), which of the following statements represents the most accurate clinical hallmark (Question ${i})?`,
        opt: [
          'Characteristic pathological changes and hallmark diagnostic features consistent with standardized NEET-PG guidelines',
          'Atypical paradoxical expansion with complete absence of vascular flow on Doppler',
          'Diffuse uniform low-density appearance with peripheral non-enhancing calcification',
          'Complete absence of clinical findings in advanced symptomatic presentations'
        ],
        cOpt: 'A',
        exp: (t) => `In ${t}, option A correctly highlights the established clinical and pathological hallmark for NEET-PG preparation.`,
        concept: 'Hallmark presentation and pathognomonic findings are critical for high-yield board questions.'
      },
      {
        t: 'Diagnostic Investigation & Staging',
        q: (t, s, c, i) => `Which diagnostic modality represents the first-line gold standard investigation in patients presenting with suspected ${t}?`,
        opt: [
          'Targeted multi-modality diagnostic imaging and definitive histopathological/biochemical correlation',
          'Serum non-specific markers without radiological confirmation',
          'Immediate invasive intervention prior to basic diagnostic workup',
          'Superficial examination alone without standard screening'
        ],
        cOpt: 'A',
        exp: (t) => `For ${t}, multi-modality correlation provides accurate diagnosis and risk stratification.`,
        concept: 'Accurate diagnostic staging directs appropriate therapeutic stratification.'
      },
      {
        t: 'Therapeutic Management & Clinical Guidelines',
        q: (t, s, c, i) => `What is the current evidence-based management strategy for ${t}?`,
        opt: [
          'Stage-directed multi-disciplinary management incorporating medical, interventional, or surgical therapy as indicated',
          'Single-agent empirical therapy without baseline disease evaluation',
          'Immediate discontinuation of all standard supportive care protocols',
          'Routine observation without surveillance in high-risk categories'
        ],
        cOpt: 'A',
        exp: (t) => `Management of ${t} requires structured clinical staging and evidence-based therapeutic guidelines.`,
        concept: 'Evidence-based multi-disciplinary treatment protocol.'
      }
    ];

    const templates = isSurg ? surgeryHighYield : generalHighYield;

    for (let i = 1; i <= count; i++) {
      const hyp = templates[(i - 1) % templates.length];
      const qNum = i;
      list.push({
        id: `${topicId}_q${qNum}`,
        questionNumber: qNum,
        text: hyp.q(topicName, subjectName, chapterName, qNum),
        options: [
          { id: 'A', text: hyp.opt[0] },
          { id: 'B', text: hyp.opt[1] },
          { id: 'C', text: hyp.opt[2] },
          { id: 'D', text: hyp.opt[3] }
        ],
        correctOption: hyp.cOpt,
        explanation: hyp.exp(topicName),
        keyConcept: `${topicName}: ${hyp.concept}`
      });
    }
    return list;
  }"""

    if old_populate in new_content:
        new_content = new_content.replace(old_populate, new_populate)
        print('Replaced populateSampleQuestions with subject-aware version!')
    else:
        print('Could not find old_populate pattern')

    with open('js/core/qbank-data.js', 'w', encoding='utf-8') as f_out:
        f_out.write(new_content)

    print('Updated js/core/qbank-data.js successfully!')

if __name__ == '__main__':
    main()
