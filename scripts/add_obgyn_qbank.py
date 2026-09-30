import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

obgyn_dataset_js = """    obstetrics___gynaecology: {
      id: 'obstetrics___gynaecology',
      name: 'Obstetrics & Gynaecology',
      faculty: 'Dr. Sakshi Arora',
      accentColor: '#ec4899',
      chapters: [
        {
          id: 'obg_chap_fundamentals_of_reproduction',
          name: 'FUNDAMENTALS OF REPRODUCTION',
          topics: [
            {
              id: 'obg_t1_anatomy_female_pelvic_organs',
              name: 'Anatomy of Female Pelvic Organs',
              rating: 4.5,
              mcqCount: 26,
              isPro: true,
              image: 'obstetrics___gynaecology',
              questions: [
                {
                  id: 'obg_q1_1',
                  questionNumber: 1,
                  text: 'What is the primary support of the uterus that prevents apical uterine prolapse, extending from the supravaginal cervix and lateral vaginal fornices to the lateral pelvic sidewalls?',
                  options: [
                    { id: 'A', text: 'Cardinal ligaments (Mackenrodt / Transverse cervical ligaments)' },
                    { id: 'B', text: 'Round ligaments of uterus' },
                    { id: 'C', text: 'Broad ligaments' },
                    { id: 'D', text: 'Infundibulopelvic ligaments' }
                  ],
                  correctOption: 'A',
                  explanation: 'The Cardinal (Mackenrodt / Transverse cervical) ligaments and Uterosacral ligaments constitute Level I (apical) pelvic support. Weakness or attenuation of the cardinal ligaments is the primary pathophysiological defect leading to uterine prolapse.',
                  keyConcept: 'Pelvic Organ Support (DeLancey Level I): Cardinal & Uterosacral ligaments provide primary apical uterine support.'
                },
                {
                  id: 'obg_q1_2',
                  questionNumber: 2,
                  text: 'During a total abdominal hysterectomy, the ureter is most vulnerable to iatrogenic injury at which of the following anatomical locations?',
                  options: [
                    { id: 'A', text: 'Crossing posterior to the external iliac artery' },
                    { id: 'B', text: 'Passing inferior (under) to the uterine artery in the cardinal ligament ("water under the bridge")' },
                    { id: 'C', text: 'Passing lateral to the ovarian ligament' },
                    { id: 'D', text: 'Entering the dome of the bladder anteriorly' }
                  ],
                  correctOption: 'B',
                  explanation: 'The ureter passes approximately 1.5 to 2 cm lateral to the supravaginal cervix, traveling underneath the uterine artery ("water under the bridge"). This is the most common site of ureteric ligation, clamping, or transection during hysterectomy.',
                  keyConcept: 'Ureteric Injury Sites in Gynaecologic Surgery: (1) Crossing under uterine artery (most common), (2) At pelvic brim under infundibulopelvic ligament, (3) Vaginal angle/bladder base during cuff closure.'
                },
                {
                  id: 'obg_q1_3',
                  questionNumber: 3,
                  text: 'Which muscle constitutes the largest and most critical component of the pelvic diaphragm (levator ani muscle complex)?',
                  options: [
                    { id: 'A', text: 'Pubococcygeus' },
                    { id: 'B', text: 'Coccygeus (Ischiococcygeus)' },
                    { id: 'C', text: 'Piriformis' },
                    { id: 'D', text: 'Obturator internus' }
                  ],
                  correctOption: 'A',
                  explanation: 'The levator ani complex consists of Pubococcygeus (including puborectalis and pubovaginalis) and Iliococcygeus. The pubococcygeus is the principal muscular support of the pelvic viscera and plays a key role in maintaining urinary and fecal continence.',
                  keyConcept: 'Levator Ani = Pubococcygeus + Iliococcygeus + Puborectalis. Innervated by nerve to levator ani (S3-S4) and pudendal nerve branches.'
                }
              ]
            },
            {
              id: 'obg_t2_physiology_of_conception',
              name: 'The Physiology of Conception',
              rating: 4.5,
              mcqCount: 15,
              isPro: true,
              image: 'obstetrics___gynaecology',
              questions: [
                {
                  id: 'obg_q2_1',
                  questionNumber: 1,
                  text: 'At what anatomical site in the female genital tract does fertilization of the secondary oocyte normally occur?',
                  options: [
                    { id: 'A', text: 'Ampulla of the Fallopian tube' },
                    { id: 'B', text: 'Isthmus of the Fallopian tube' },
                    { id: 'C', text: 'Uterine cavity (fundus)' },
                    { id: 'D', text: 'Infundibulum / Fimbria' }
                  ],
                  correctOption: 'A',
                  explanation: 'Fertilization normally takes place in the ampulla of the fallopian tube (the widest and longest part of the tube) within 12 to 24 hours after ovulation.',
                  keyConcept: 'Site of Fertilization: Ampulla of Fallopian Tube. Site of Implantation: Upper posterior uterine wall near the fundus on Day 6-7 post-fertilization.'
                },
                {
                  id: 'obg_q2_2',
                  questionNumber: 2,
                  text: 'At which stage of meiotic division is the human secondary oocyte arrested prior to sperm penetration and fertilization?',
                  options: [
                    { id: 'A', text: 'Prophase of Meiosis I (Dictyotene stage)' },
                    { id: 'B', text: 'Metaphase of Meiosis II' },
                    { id: 'C', text: 'Anaphase of Meiosis I' },
                    { id: 'D', text: 'Telophase of Meiosis II' }
                  ],
                  correctOption: 'B',
                  explanation: 'Primary oocytes are arrested in Prophase of Meiosis I (Dictyotene stage) from fetal life until ovulation. Following the LH surge, Meiosis I completes with extrusion of the first polar body, and the secondary oocyte arrests at Metaphase of Meiosis II until fertilization.',
                  keyConcept: 'Oogenesis Arrest Points: Birth to puberty/ovulation: Prophase I (Dictyotene). Ovulation to fertilization: Metaphase II.'
                }
              ]
            },
            {
              id: 'obg_t3_maternal_pelvis_and_fetal_skull',
              name: 'Maternal Pelvis and Fetal Skull',
              rating: 4.5,
              mcqCount: 16,
              isPro: true,
              image: 'obstetrics___gynaecology',
              questions: [
                {
                  id: 'obg_q3_1',
                  questionNumber: 1,
                  text: 'Which anteroposterior diameter of the pelvic inlet represents the shortest and most clinically critical obstetric diameter that the engaging fetal head must traverse?',
                  options: [
                    { id: 'A', text: 'Obstetric conjugate (10.0 - 10.5 cm)' },
                    { id: 'B', text: 'True conjugate / Conjugata vera (11.0 cm)' },
                    { id: 'C', text: 'Diagonal conjugate (12.0 - 12.5 cm)' },
                    { id: 'D', text: 'Sagittal diameter of pelvic outlet (11.0 cm)' }
                  ],
                  correctOption: 'A',
                  explanation: 'The Obstetric Conjugate is the shortest AP diameter of the inlet, measured from the sacral promontory to the most prominent bony point on the posterior surface of the pubic symphysis (approx 10.0-10.5 cm). It is clinically calculated as: Diagonal Conjugate minus 1.5 to 2.0 cm.',
                  keyConcept: 'Pelvic Inlet AP Diameters: Diagonal Conjugate = 12.5 cm (clinically palpable); True Conjugate = 11.0 cm; Obstetric Conjugate = Diagonal - 1.5 cm = 10.5 cm.'
                },
                {
                  id: 'obg_q3_2',
                  questionNumber: 2,
                  text: 'What engaging diameter of the fetal skull presents in a well-flexed vertex presentation during normal labour?',
                  options: [
                    { id: 'A', text: 'Suboccipitobregmatic diameter (9.5 cm)' },
                    { id: 'B', text: 'Occipitofrontal diameter (11.5 cm)' },
                    { id: 'C', text: 'Mentovertical diameter (14.0 cm)' },
                    { id: 'D', text: 'Submentobregmatic diameter (9.5 cm)' }
                  ],
                  correctOption: 'A',
                  explanation: 'In a completely flexed vertex presentation, the engaging diameter is the Suboccipitobregmatic diameter (9.5 cm) extending from the center of the anterior fontanelle (bregma) to the under-surface of the occiput.',
                  keyConcept: 'Fetal Skull Engaging Diameters: Well-flexed Vertex: Suboccipitobregmatic (9.5 cm); Deflexed Vertex/Military: Occipitofrontal (11.5 cm); Brow: Mentovertical (14.0 cm - largest); Face: Submentobregmatic (9.5 cm).'
                }
              ]
            },
            {
              id: 'obg_t4_placenta_and_fetal_membranes',
              name: 'Placenta and Fetal Membranes',
              rating: 4.5,
              mcqCount: 26,
              isPro: true,
              image: 'obstetrics___gynaecology',
              questions: [
                {
                  id: 'obg_q4_1',
                  questionNumber: 1,
                  text: 'Which hormone synthesized exclusively by the syncytiotrophoblast is responsible for maintaining the corpus luteum and progesterone production during the first 6 to 8 weeks of pregnancy?',
                  options: [
                    { id: 'A', text: 'Human Chorionic Gonadotropin (hCG)' },
                    { id: 'B', text: 'Human Placental Lactogen (hPL)' },
                    { id: 'C', text: 'Estriol (E3)' },
                    { id: 'D', text: 'Pregnanediol' }
                  ],
                  correctOption: 'A',
                  explanation: 'Human Chorionic Gonadotropin (hCG) is secreted by syncytiotrophoblast cells starting around implantation (Day 8-9). It rescues and maintains the corpus luteum of pregnancy to produce progesterone until the luteal-placental shift occurs around 7-9 weeks.',
                  keyConcept: 'hCG: Produced by syncytiotrophoblast; peaks at 8-10 weeks (approx 100,000 mIU/mL); double time ~48h in early viable intrauterine pregnancy.'
                }
              ]
            },
            {
              id: 'obg_t5_sexual_development_puberty_and_adolescence',
              name: 'Sexual Development, Puberty and Adolescence',
              rating: 4.5,
              mcqCount: 25,
              isPro: true,
              image: 'obstetrics___gynaecology',
              questions: [
                {
                  id: 'obg_q5_1',
                  questionNumber: 1,
                  text: 'What is the classic physiological sequence of pubertal milestones in adolescent females?',
                  options: [
                    { id: 'A', text: 'Thelarche -> Adrenarche/Pubarche -> Peak Height Velocity (Growth spurt) -> Menarche' },
                    { id: 'B', text: 'Menarche -> Thelarche -> Pubarche -> Growth spurt' },
                    { id: 'C', text: 'Pubarche -> Thelarche -> Menarche -> Growth spurt' },
                    { id: 'D', text: 'Growth spurt -> Menarche -> Thelarche -> Pubarche' }
                  ],
                  correctOption: 'A',
                  explanation: 'Normal female pubertal sequence: (1) Thelarche (breast budding under estrogen, age 8-10 yr), (2) Adrenarche/Pubarche (pubic/axillary hair under adrenal androgens), (3) Peak Height Velocity (growth spurt), (4) Menarche (first menstrual bleed, typically 2-2.5 years after thelarche, Tanner Stage 4).',
                  keyConcept: 'Puberty Milestone Mnemonic: T-A-G-M (Thelarche -> Adrenarche -> Growth spurt -> Menarche).'
                }
              ]
            }
          ]
        },
        {
          id: 'obg_chap_normal_pregnancy_and_antenatal_care',
          name: 'NORMAL PREGNANCY AND ANTENATAL CARE',
          topics: [
            {
              id: 'obg_t6_physiological_changes_during_pregnancy',
              name: 'Physiological Changes During Pregnancy',
              rating: 4.5,
              mcqCount: 24,
              isPro: true,
              image: 'obstetrics___gynaecology',
              questions: [
                {
                  id: 'obg_q6_1',
                  questionNumber: 1,
                  text: 'What is the physiological basis for "physiologic anemia of pregnancy"?',
                  options: [
                    { id: 'A', text: 'Plasma volume expansion (40-50%) disproportionately exceeding the increase in RBC mass (20-30%) leading to hemodilution' },
                    { id: 'B', text: 'Marked suppression of bone marrow erythropoiesis by maternal estrogen' },
                    { id: 'C', text: 'Intravascular hemolysis triggered by placental syncytiotrophoblast enzymes' },
                    { id: 'D', text: 'Excessive renal erythropoietin clearance due to increased GFR' }
                  ],
                  correctOption: 'A',
                  explanation: 'During pregnancy, maternal plasma volume expands by 40-50% while red cell mass increases by only 20-30%. This disproportionate expansion produces relative hemodilution, lowering baseline hemoglobin concentration (defined as Hb < 11.0 g/dL in 1st/3rd trimester and < 10.5 g/dL in 2nd trimester by WHO).',
                  keyConcept: 'Hemodilution in Pregnancy: Plasma volume (+50%) > RBC volume (+20%). WHO Cutoffs: 1st/3rd trimester Hb < 11.0 g/dL; 2nd trimester Hb < 10.5 g/dL.'
                }
              ]
            },
            {
              id: 'obg_t7_diagnosis_of_pregnancy_and_antenatal_care',
              name: 'Diagnosis of Pregnancy and Antenatal Care',
              rating: 4.5,
              mcqCount: 21,
              isPro: true,
              image: 'obstetrics___gynaecology',
              questions: [
                {
                  id: 'obg_q7_1',
                  questionNumber: 1,
                  text: 'By Naegele’s rule, what is the Expected Date of Delivery (EDD) for a woman whose regular 28-day Last Menstrual Period (LMP) began on 10th July 2026?',
                  options: [
                    { id: 'A', text: '17th April 2027' },
                    { id: 'B', text: '17th May 2027' },
                    { id: 'C', text: '10th April 2027' },
                    { id: 'D', text: '24th April 2027' }
                  ],
                  correctOption: 'A',
                  explanation: 'Naegele’s rule: EDD = LMP + 7 days + 9 calendar months (or LMP + 7 days - 3 months + 1 year). For LMP 10 July 2026: 10 + 7 = 17, July (month 7) - 3 = April (month 4) 2027 -> 17th April 2027.',
                  keyConcept: 'Naegele’s Rule: LMP + 7 days - 3 months + 1 year (applicable for a standard 28-day cycle).'
                }
              ]
            },
            {
              id: 'obg_t8_antenatal_investigations',
              name: 'Antenatal Investigations',
              rating: 4.6,
              mcqCount: 15,
              isPro: true,
              image: 'obstetrics___gynaecology',
              questions: [
                {
                  id: 'obg_q8_1',
                  questionNumber: 1,
                  text: 'In the First Trimester Combined Screening test for fetal aneuploidy (performed at 11-13+6 weeks), what biochemical and sonographic pattern is characteristic of Down syndrome (Trisomy 21)?',
                  options: [
                    { id: 'A', text: 'Increased Nuchal Translucency (NT), Decreased PAPP-A, Increased Free beta-hCG' },
                    { id: 'B', text: 'Decreased NT, Increased PAPP-A, Decreased Free beta-hCG' },
                    { id: 'C', text: 'Increased NT, Increased PAPP-A, Increased Free beta-hCG' },
                    { id: 'D', text: 'Decreased NT, Decreased PAPP-A, Decreased Free beta-hCG' }
                  ],
                  correctOption: 'A',
                  explanation: 'First Trimester Combined Screening for Trisomy 21 (11-13+6 weeks, CRL 45-84 mm) reveals: (1) Increased Fetal Nuchal Translucency (>95th percentile), (2) Decreased Pregnancy-Associated Plasma Protein A (PAPP-A), (3) Increased maternal serum Free beta-hCG (MoM > 2.0).',
                  keyConcept: 'Trisomy 21 First Trimester Screen: High NT + Low PAPP-A + High free beta-hCG (Detection rate ~85-90%).'
                }
              ]
            },
            {
              id: 'obg_t9_obstetrical_imaging',
              name: 'Obstetrical Imaging',
              rating: 4.4,
              mcqCount: 17,
              isPro: true,
              image: 'obstetrics___gynaecology',
              questions: [
                {
                  id: 'obg_q9_1',
                  questionNumber: 1,
                  text: 'Which sonographic biometric parameter provides the single most accurate estimation of gestational age during the first trimester of pregnancy?',
                  options: [
                    { id: 'A', text: 'Crown-Rump Length (CRL)' },
                    { id: 'B', text: 'Biparietal Diameter (BPD)' },
                    { id: 'C', text: 'Femur Length (FL)' },
                    { id: 'D', text: 'Abdominal Circumference (AC)' }
                  ],
                  correctOption: 'A',
                  explanation: 'Crown-Rump Length (CRL) measured between 7 and 13+6 weeks is the most accurate sonographic method for dating pregnancy with an error margin of only +/- 3 to 5 days.',
                  keyConcept: 'Gestational Dating Accuracy: 1st Trimester: CRL (+/- 3-5 days); 2nd Trimester: BPD/FL (+/- 7-10 days); 3rd Trimester: AC/FL (+/- 2-3 weeks).'
                }
              ]
            }
          ]
        },
        {
          id: 'obg_chap_labor_and_puerperium',
          name: 'LABOR AND PUERPERIUM',
          topics: [
            {
              id: 'obg_t10_normal_labour',
              name: 'Normal Labour',
              rating: 4.5,
              mcqCount: 29,
              isPro: true,
              image: 'obstetrics___gynaecology',
              questions: [
                {
                  id: 'obg_q10_1',
                  questionNumber: 1,
                  text: 'What is the correct cardinal sequence of mechanism of labour for an Occipito-Anterior (OA) vertex presentation in a normal pelvis?',
                  options: [
                    { id: 'A', text: 'Engagement -> Descent -> Flexion -> Internal rotation -> Extension -> Restitution -> External rotation -> Delivery of shoulders by lateral flexion' },
                    { id: 'B', text: 'Engagement -> Extension -> Internal rotation -> Flexion -> Restitution -> External rotation' },
                    { id: 'C', text: 'Descent -> External rotation -> Flexion -> Extension -> Internal rotation' },
                    { id: 'D', text: 'Engagement -> Flexion -> External rotation -> Extension -> Restitution' }
                  ],
                  correctOption: 'A',
                  explanation: 'Cardinal movements of normal labour: (1) Engagement, (2) Descent, (3) Flexion, (4) Internal rotation (occiput rotates 1/8th of a circle anteriorly under pubic arch), (5) Extension (head delivers by extension), (6) Restitution (untwisting of neck by 1/8th circle), (7) External rotation (shoulders rotate internally, head rotates externally), (8) Expulsion (delivery of shoulders by lateral flexion).',
                  keyConcept: 'Cardinal Movements: Engagement -> Descent -> Flexion -> Internal Rotation -> Extension -> Restitution -> External Rotation -> Lateral Flexion.'
                }
              ]
            },
            {
              id: 'obg_t11_abnormal_labour',
              name: 'Abnormal Labour',
              rating: 4.5,
              mcqCount: 21,
              isPro: true,
              image: 'obstetrics___gynaecology',
              questions: [
                {
                  id: 'obg_q11_1',
                  questionNumber: 1,
                  text: 'According to WHO modified Partograph guidelines, what action is mandated when the cervicograph curve crosses the "Action Line" (situated 4 hours to the right of the Alert Line)?',
                  options: [
                    { id: 'A', text: 'Immediate evaluation for active intervention / Caesarean section for obstructed or prolonged labour' },
                    { id: 'B', text: 'Reassurance and routine maternal observation for another 6 hours' },
                    { id: 'C', text: 'Immediate administration of prophylactic oral antibiotics only' },
                    { id: 'D', text: 'Discharge to latent phase ward' }
                  ],
                  correctOption: 'A',
                  explanation: 'On a modified WHO Partograph, crossing the Alert Line indicates prolonged latent/active phase requiring augmentation or transfer. Crossing the Action Line (4 hours parallel to Alert Line) indicates severe labour dystocia or failure to progress requiring definitive obstetric decision/intervention (usually Caesarean delivery or instrumental extraction if criteria met).',
                  keyConcept: 'Partograph: Alert Line (rate of 1 cm/hr dilation in active phase); Action Line (4 hours to the right of Alert Line -> critical intervention).'
                }
              ]
            },
            {
              id: 'obg_t12_induction_and_augmentation_of_labour',
              name: 'Induction and Augmentation of Labour',
              rating: 4.5,
              mcqCount: 17,
              isPro: true,
              image: 'obstetrics___gynaecology',
              questions: [
                {
                  id: 'obg_q12_1',
                  questionNumber: 1,
                  text: 'Which modified Bishop score parameters are assessed to evaluate cervical readiness prior to labor induction?',
                  options: [
                    { id: 'A', text: 'Cervical Dilation, Effacement, Station, Consistency, and Position' },
                    { id: 'B', text: 'Fetal heart rate, Amniotic fluid index, Dilation, Effacement, and Parity' },
                    { id: 'C', text: 'Maternal age, Station, Contraction frequency, Dilation, and Blood pressure' },
                    { id: 'D', text: 'Pelvic type, Dilation, Presentation, Station, and Membrane status' }
                  ],
                  correctOption: 'A',
                  explanation: 'Bishop’s Pre-induction Scoring System evaluates 5 cervical/fetal parameters (scored 0-3 each, max score 13): (1) Dilation (cm), (2) Effacement (%), (3) Fetal station, (4) Cervical Consistency (firm/medium/soft), (5) Cervical Position (posterior/mid/anterior). A score >= 8 indicates a ripe cervix favorable for induction.',
                  keyConcept: 'Bishop Score: Dilation, Effacement, Station, Consistency, Position. Score >= 8 = Favorable cervix (Oxytocin/ARM); Score <= 5 = Unfavorable cervix (Prostaglandin E2/E1 priming).'
                }
              ]
            },
            {
              id: 'obg_t13_malpresentations',
              name: 'Malpresentations',
              rating: 4.5,
              mcqCount: 23,
              isPro: true,
              image: 'obstetrics___gynaecology',
              questions: [
                {
                  id: 'obg_q13_1',
                  questionNumber: 1,
                  text: 'What is the denominator in a Breech presentation?',
                  options: [
                    { id: 'A', text: 'Sacrum' },
                    { id: 'B', text: 'Occiput' },
                    { id: 'C', text: 'Mentum' },
                    { id: 'D', text: 'Acromion / Scapula' }
                  ],
                  correctOption: 'A',
                  explanation: 'The denominator is the arbitrary bony point on the presenting part used to determine fetal position. For Vertex: Occiput; Face: Mentum; Brow: Frontal prominence; Breech: Sacrum; Shoulder (Transverse lie): Acromion.',
                  keyConcept: 'Denominators: Vertex = Occiput; Face = Mentum; Breech = Sacrum; Shoulder = Acromion.'
                }
              ]
            },
            {
              id: 'obg_t14_operative_vaginal_delivery',
              name: 'Operative Vaginal Delivery',
              rating: 4.5,
              mcqCount: 15,
              isPro: true,
              image: 'obstetrics___gynaecology',
              questions: [
                {
                  id: 'obg_q14_1',
                  questionNumber: 1,
                  text: 'Which of the following prerequisites is an absolute mandatory condition prior to applying obstetric forceps or ventouse (vacuum extractor)?',
                  options: [
                    { id: 'A', text: 'Fully dilated cervix (10 cm) and ruptured membranes' },
                    { id: 'B', text: 'Cervix dilated to at least 6 cm' },
                    { id: 'C', text: 'Intact amniotic sac to cushion fetal head' },
                    { id: 'D', text: 'Fetal station at -2 or higher' }
                  ],
                  correctOption: 'A',
                  explanation: 'Prerequisites for Instrumental Delivery (FORCEPS mnemonic): Fully dilated cervix (10 cm), Occiput/position known, Ruptured membranes, Cephalopelvic disproportion excluded, Engaged head, Pain relief/Bladder empty, Suitable operator & neonatal backup.',
                  keyConcept: 'Prerequisites for Forceps/Ventouse: Fully dilated cervix (10 cm), Head engaged (station >= 0), Ruptured membranes, Clear presentation/position.'
                }
              ]
            },
            {
              id: 'obg_t15_caesarean_section_and_vbac',
              name: 'Caesarean Section and Vaginal Birth After Caesarean (VBAC)',
              rating: 4.4,
              mcqCount: 18,
              isPro: true,
              image: 'obstetrics___gynaecology',
              questions: [
                {
                  id: 'obg_q15_1',
                  questionNumber: 1,
                  text: 'Which type of prior uterine scar carries the highest risk of catastrophic uterine rupture during a trial of labour after caesarean (TOLAC)?',
                  options: [
                    { id: 'A', text: 'Classical (vertical incision in upper uterine segment)' },
                    { id: 'B', text: 'Low transverse Kerr incision' },
                    { id: 'C', text: 'Low vertical incision confined to lower segment' },
                    { id: 'D', text: 'Previous single-layer laparoscopic myomectomy without cavity entry' }
                  ],
                  correctOption: 'A',
                  explanation: 'Classical caesarean scar involves active contractile myometrium of the upper segment and carries a 4-9% risk of uterine rupture, often before the onset of labour. Hence, prior classical C-section is an absolute contraindication to TOLAC.',
                  keyConcept: 'Uterine Rupture Risk in TOLAC: Prior Classical C-section (4-9% -> TOLAC Contraindicated); Prior Low Transverse C-section (0.5-0.7% -> TOLAC candidate).'
                }
              ]
            },
            {
              id: 'obg_t16_puerperium',
              name: 'Puerperium',
              rating: 4.4,
              mcqCount: 24,
              isPro: true,
              image: 'obstetrics___gynaecology',
              questions: [
                {
                  id: 'obg_q16_1',
                  questionNumber: 1,
                  text: 'What is the normal anatomical level of the uterine fundus on Day 10 to 14 postpartum during normal involution of the uterus?',
                  options: [
                    { id: 'A', text: 'Non-palpable per abdomen (sinks behind pubic symphysis into true pelvis)' },
                    { id: 'B', text: 'At the level of the umbilicus' },
                    { id: 'C', text: 'Midway between umbilicus and symphysis pubis' },
                    { id: 'D', text: 'At the level of the xiphisternum' }
                  ],
                  correctOption: 'A',
                  explanation: 'Immediately after delivery, fundus is at or just below umbilicus (approx 13.5 cm above symphysis). It involutes at a rate of approximately 1 cm (one finger-breadth) per day. By Day 10-14 postpartum, the uterus becomes a true pelvic organ and is no longer palpable abdominally.',
                  keyConcept: 'Uterine Involution: Immediate postpartum = umbilicus (1000g); Day 10-14 = Pelvic organ (not palpable abdominally, 500g); 6 weeks = Pre-pregnancy size (50-60g).'
                }
              ]
            }
          ]
        },
        {
          id: 'obg_chap_obstetric_complications',
          name: 'OBSTETRIC COMPLICATIONS',
          topics: [
            {
              id: 'obg_t17_multifetal_pregnancy',
              name: 'Multifetal Pregnancy',
              rating: 4.5,
              mcqCount: 26,
              isPro: true,
              image: 'obstetrics___gynaecology',
              questions: [
                {
                  id: 'obg_q17_1',
                  questionNumber: 1,
                  text: 'Which sonographic sign observed at the inter-twin membrane insertion at 10-14 weeks confirms Monochorionic Diamniotic (MCDA) twin placentation?',
                  options: [
                    { id: 'A', text: '"T-sign" (thin right-angled junction with no chorionic tissue in septum)' },
                    { id: 'B', text: '"Twin-peak" / Lambda (λ) sign' },
                    { id: 'C', text: 'Double bubble sign' },
                    { id: 'D', text: 'Spalding sign' }
                  ],
                  correctOption: 'A',
                  explanation: 'On 11-14 week ultrasound, a "T-sign" (90-degree right angle insertion of the thin 2-layer amniotic membrane into the placenta without interposing chorion) is diagnostic of Monochorionicity. In contrast, the Lambda (λ) or Twin Peak sign confirms Dichorionic Diamniotic (DCDA) gestation.',
                  keyConcept: 'Twin Chorionicity Sonography: T-sign = Monochorionic Diamniotic; Lambda / Twin-peak sign = Dichorionic Diamniotic.'
                }
              ]
            },
            {
              id: 'obg_t18_ectopic_pregnancy',
              name: 'Ectopic Pregnancy',
              rating: 4.5,
              mcqCount: 19,
              isPro: true,
              image: 'obstetrics___gynaecology',
              questions: [
                {
                  id: 'obg_q18_1',
                  questionNumber: 1,
                  text: 'What is the single most common anatomical site of ectopic tubal pregnancy implantation?',
                  options: [
                    { id: 'A', text: 'Ampulla of the Fallopian tube (70-80%)' },
                    { id: 'B', text: 'Isthmus (12%)' },
                    { id: 'C', text: 'Fimbria (11%)' },
                    { id: 'D', text: 'Interstitial / Cornual (2%)' }
                  ],
                  correctOption: 'A',
                  explanation: 'Over 95% of ectopic pregnancies occur in the fallopian tube, with the Ampulla being the most common site (70-80%), followed by the Isthmus (12%), Fimbria (11%), and Interstitial/Cornual (2-3%). Interstitial ectopic ruptures latest (12-16 weeks) with massive life-threatening hemorrhage.',
                  keyConcept: 'Ectopic Pregnancy Sites: Ampullary (70-80%, most common); Isthmic (earliest rupture ~6-8 wk); Interstitial (ruptures ~12-16 wk with massive bleeding due to uterine artery anastomosis).'
                }
              ]
            },
            {
              id: 'obg_t19_abortion_and_medical_termination_of_pregnancy',
              name: 'Abortion and Medical Termination of Pregnancy',
              rating: 4.5,
              mcqCount: 26,
              isPro: true,
              image: 'obstetrics___gynaecology',
              questions: [
                {
                  id: 'obg_q19_1',
                  questionNumber: 1,
                  text: 'What is the approved regimen for Medical Abortion up to 63 days (9 weeks) of gestation according to evidence-based WHO and national guidelines?',
                  options: [
                    { id: 'A', text: 'Mifepristone 200 mg orally followed 24-48 hours later by Misoprostol 800 mcg buccally/vaginally' },
                    { id: 'B', text: 'Methotrexate 50 mg IM followed by Oxytocin infusion' },
                    { id: 'C', text: 'Misoprostol 200 mcg single oral dose only' },
                    { id: 'D', text: 'Mifepristone 600 mg single oral dose without prostaglandins' }
                  ],
                  correctOption: 'A',
                  explanation: 'Standard Medical Termination of Pregnancy (MTP) up to 9 weeks (63 days): Day 1: Mifepristone (antiprogesterone) 200 mg orally; Day 3 (24-48 hours later): Misoprostol (PGE1 analog) 800 mcg buccally, sublingually, or vaginally. Success rate is >95-98%.',
                  keyConcept: 'MTP Regimen (<63 days): Oral Mifepristone 200 mg + Misoprostol 800 mcg buccally/vaginally at 24-48h.'
                }
              ]
            },
            {
              id: 'obg_t20_antepartum_hemorrhage',
              name: 'Antepartum Hemorrhage',
              rating: 4.5,
              mcqCount: 22,
              isPro: true,
              image: 'obstetrics___gynaecology',
              questions: [
                {
                  id: 'obg_q20_1',
                  questionNumber: 1,
                  text: 'A 28-year-old G2P1 at 34 weeks gestation presents with sudden onset painless, causeless, recurrent bright red vaginal bleeding. Her uterus is soft, non-tender, and relaxed. What is the most likely diagnosis and what examination is strictly contraindicated?',
                  options: [
                    { id: 'A', text: 'Placenta Previa; Digital vaginal examination (per vaginam) is strictly contraindicated' },
                    { id: 'B', text: 'Abruptio Placentae; Transabdominal ultrasound is contraindicated' },
                    { id: 'C', text: 'Vasa Previa; Speculum examination is contraindicated' },
                    { id: 'D', text: 'Uterine Rupture; Fetal non-stress test is contraindicated' }
                  ],
                  correctOption: 'A',
                  explanation: 'Painless, causeless, recurrent bright red bleeding with a soft, relaxed, non-tender uterus is the classic hallmark of Placenta Previa. Digital vaginal examination (PV) is strictly contraindicated outside an operating room prepared for immediate caesarean section ("double set-up") because it can dislodge placental cotyledons and trigger torrential hemorrhage.',
                  keyConcept: 'Antepartum Hemorrhage: Placenta Previa (Painless, bright red bleed, soft non-tender uterus -> PV examination contraindicated); Abruptio Placentae (Painful, dark bleed, tense/woody hard tender uterus).'
                }
              ]
            },
            {
              id: 'obg_t21_postpartum_haemorrhage',
              name: 'Postpartum Haemorrhage',
              rating: 4.5,
              mcqCount: 22,
              isPro: true,
              image: 'obstetrics___gynaecology',
              questions: [
                {
                  id: 'obg_q21_1',
                  questionNumber: 1,
                  text: 'What is the single most common cause of Primary Postpartum Haemorrhage (PPH)?',
                  options: [
                    { id: 'A', text: 'Uterine Atony (Tone - 70-80%)' },
                    { id: 'B', text: 'Genital tract trauma (Trauma - 20%)' },
                    { id: 'C', text: 'Retained placental tissue (Tissue - 10%)' },
                    { id: 'D', text: 'Coagulopathy (Thrombin - 1%)' }
                  ],
                  correctOption: 'A',
                  explanation: 'Primary PPH (blood loss >= 500 mL after vaginal birth or >= 1000 mL after C-section within 24 hours) is most commonly caused by Uterine Atony (70-80%), followed by Trauma, Tissue, and Thrombin ("4 Ts"). First-line uterotonic drug of choice is Oxytocin (10 IU IM / IV infusion).',
                  keyConcept: 'PPH Causes ("4 Ts"): Tone (Atony - 70%, #1 cause), Trauma (cervical/vaginal tears), Tissue (retained placenta), Thrombin (DIC/coagulopathy).'
                }
              ]
            },
            {
              id: 'obg_t22_preterm_labor_and_postterm_pregnancy',
              name: 'Preterm Labor and Postterm Pregnancy',
              rating: 4.5,
              mcqCount: 24,
              isPro: true,
              image: 'obstetrics___gynaecology',
              questions: [
                {
                  id: 'obg_q22_1',
                  questionNumber: 1,
                  text: 'Which antenatal corticosteroid regimen is standard of care to accelerate fetal lung maturation in women at risk of preterm delivery between 24 and 34 weeks of gestation?',
                  options: [
                    { id: 'A', text: 'Betamethasone 12 mg IM 2 doses, 24 hours apart (or Dexamethasone 6 mg IM 4 doses, 12 hours apart)' },
                    { id: 'B', text: 'Hydrocortisone 100 mg IV every 6 hours for 24 hours' },
                    { id: 'C', text: 'Prednisolone 40 mg orally daily for 5 days' },
                    { id: 'D', text: 'Methylprednisolone 500 mg IV pulse therapy single dose' }
                  ],
                  correctOption: 'A',
                  explanation: 'Antenatal corticosteroids significantly reduce neonatal respiratory distress syndrome (RDS), intraventricular hemorrhage (IVH), and neonatal mortality. The standard regimens are: Betamethasone 12 mg IM, 2 doses 24 hours apart; OR Dexamethasone 6 mg IM, 4 doses 12 hours apart (total 24 mg).',
                  keyConcept: 'Antenatal Corticosteroids for Lung Maturity (24-34 weeks): Betamethasone 12 mg IM q24h x 2 doses OR Dexamethasone 6 mg IM q12h x 4 doses.'
                }
              ]
            },
            {
              id: 'obg_t23_gestational_trophoblastic_diseases',
              name: 'Gestational Trophoblastic Diseases',
              rating: 4.5,
              mcqCount: 22,
              isPro: true,
              image: 'obstetrics___gynaecology',
              questions: [
                {
                  id: 'obg_q23_1',
                  questionNumber: 1,
                  text: 'What genetic karyotype and origin are most commonly identified in a Complete Hydatidiform Mole?',
                  options: [
                    { id: 'A', text: '46,XX (100% paternal origin from fertilization of an enucleated ovum by a single haploid sperm that duplicates - Androgenesis)' },
                    { id: 'B', text: '69,XXY (Triploid from dispermic fertilization of a normal ovum)' },
                    { id: 'C', text: '46,XY (100% maternal origin)' },
                    { id: 'D', text: '45,X (Turner karyotype)' }
                  ],
                  correctOption: 'A',
                  explanation: 'Complete Hydatidiform Mole is typically 46,XX (90%) of entirely paternal origin (androgenesis), arising from duplication of a single haploid sperm within an empty ovum lacking maternal chromosomes. Classic findings include diffuse trophoblastic hyperplasia, generalized villous hydrops, absence of fetal tissue, "snowstorm" ultrasound appearance, and elevated hCG (>100,000 mIU/mL).',
                  keyConcept: 'Molar Pregnancy Genetics: Complete Mole = 46,XX (Diploid, all paternal, no fetus, 15-20% malignant risk, p57 negative); Partial Mole = 69,XXY (Triploid, maternal+paternal, fetal tissue present, <5% malignant risk, p57 positive).'
                }
              ]
            }
          ]
        },
        {
          id: 'obg_chap_medical_and_surgical_complications_in_pregnancy',
          name: 'MEDICAL AND SURGICAL COMPLICATIONS IN PREGNANCY',
          topics: [
            {
              id: 'obg_t24_anemia_in_pregnancy',
              name: 'Anemia in Pregnancy',
              rating: 4.4,
              mcqCount: 16,
              isPro: true,
              image: 'obstetrics___gynaecology',
              questions: [
                {
                  id: 'obg_q24_1',
                  questionNumber: 1,
                  text: 'According to the Anemia Mukt Bharat guidelines, what is the recommended prophylactic dose of elemental iron and folic acid for pregnant women starting from the 12th week of gestation?',
                  options: [
                    { id: 'A', text: '60 mg elemental iron + 500 mcg (0.5 mg) folic acid daily for at least 180 days during pregnancy' },
                    { id: 'B', text: '100 mg elemental iron + 5 mg folic acid twice daily' },
                    { id: 'C', text: '30 mg elemental iron + 100 mcg folic acid weekly' },
                    { id: 'D', text: '200 mg elemental iron without folic acid' }
                  ],
                  correctOption: 'A',
                  explanation: 'Under India’s Anemia Mukt Bharat guidelines, routine antenatal prophylaxis consists of 1 tablet containing 60 mg elemental iron and 500 mcg folic acid daily for 180 days during pregnancy, followed by another 180 days postpartum during lactation.',
                  keyConcept: 'Anemia Mukt Bharat IFA Prophylaxis: 60 mg elemental iron + 500 mcg folic acid daily x 180 days antenatal + 180 days postnatal.'
                }
              ]
            },
            {
              id: 'obg_t25_hypertensive_disorders_in_pregnancy',
              name: 'Hypertensive Disorders in Pregnancy',
              rating: 4.5,
              mcqCount: 30,
              isPro: true,
              image: 'obstetrics___gynaecology',
              questions: [
                {
                  id: 'obg_q25_1',
                  questionNumber: 1,
                  text: 'What is the drug of choice for the prevention and treatment of convulsions (seizures) in severe preeclampsia and eclampsia according to the Magpie Trial and international guidelines?',
                  options: [
                    { id: 'A', text: 'Magnesium Sulfate (Pritchard / Zuspan regimen)' },
                    { id: 'B', text: 'Diazepam' },
                    { id: 'C', text: 'Phenytoin' },
                    { id: 'D', text: 'Sodium valproate' }
                  ],
                  correctOption: 'A',
                  explanation: 'Magnesium Sulfate (MgSO4) is the proven gold standard anticonvulsant for eclampsia and severe preeclampsia prophylaxis (Pritchard regimen: 4g IV + 10g IM loading dose, then 5g IM q4h; Zuspan regimen: 4-6g IV loading, then 1-2g/hr IV infusion). Antidote for toxicity is 10% Calcium Gluconate (10 mL IV over 10 min).',
                  keyConcept: 'Eclampsia Drug of Choice: Magnesium Sulfate. Monitoring: Patellar reflex present, Urine output >30 mL/hr, Respiratory rate >12-16/min. Antidote: 10% Calcium gluconate.'
                }
              ]
            },
            {
              id: 'obg_t26_diabetes_in_pregnancy',
              name: 'Diabetes in Pregnancy',
              rating: 4.4,
              mcqCount: 19,
              isPro: true,
              image: 'obstetrics___gynaecology',
              questions: [
                {
                  id: 'obg_q26_1',
                  questionNumber: 1,
                  text: 'What is the diagnostic threshold for Gestational Diabetes Mellitus (GDM) using the Diabetes in Pregnancy Study Group of India (DIPSI) single-step 75-g oral glucose tolerance test irrespective of the last meal timing?',
                  options: [
                    { id: 'A', text: '2-hour plasma glucose >= 140 mg/dL' },
                    { id: 'B', text: 'Fasting plasma glucose >= 126 mg/dL' },
                    { id: 'C', text: '1-hour plasma glucose >= 200 mg/dL' },
                    { id: 'D', text: 'HbA1c >= 7.0%' }
                  ],
                  correctOption: 'A',
                  explanation: 'The DIPSI criteria (recommended by the Government of India) uses a non-fasting 75-g oral glucose load. A single 2-hour venous plasma glucose value >= 140 mg/dL is diagnostic of Gestational Diabetes Mellitus (GDM).',
                  keyConcept: 'DIPSI Criteria for GDM: 75g oral glucose (non-fasting) -> 2-hour plasma glucose >= 140 mg/dL.'
                }
              ]
            },
            {
              id: 'obg_t27_cardiovascular_conditions_in_pregnancy',
              name: 'Cardiovascular Conditions in Pregnancy',
              rating: 4.5,
              mcqCount: 22,
              isPro: true,
              image: 'obstetrics___gynaecology',
              questions: [
                {
                  id: 'obg_q27_1',
                  questionNumber: 1,
                  text: 'Which maternal cardiac condition carries the highest maternal mortality risk (30-50%) and represents an absolute contraindication to continuing pregnancy?',
                  options: [
                    { id: 'A', text: 'Eisenmenger syndrome / Severe pulmonary arterial hypertension' },
                    { id: 'B', text: 'Mild mitral valve prolapse with trace regurgitation' },
                    { id: 'C', text: 'Corrected patent ductus arteriosus' },
                    { id: 'D', text: 'Uncomplicated atrial septal defect' }
                  ],
                  correctOption: 'A',
                  explanation: 'Eisenmenger syndrome (pulmonary hypertension with reversed right-to-left shunt) and severe pulmonary vascular disease carry a maternal mortality rate of 30-50% due to acute right ventricular failure and sudden cardiovascular collapse during labor or postpartum. It is an absolute indication for therapeutic termination.',
                  keyConcept: 'High-Risk Cardiac Lesions in Pregnancy (WHO Class IV, 30-50% mortality): Eisenmenger syndrome, Severe Pulmonary HTN, Severe Aortic Stenosis, Marfan with aortic root >45 mm.'
                }
              ]
            },
            {
              id: 'obg_t28_rhesus_isoimmunization',
              name: 'Rhesus Isoimmunization',
              rating: 4.5,
              mcqCount: 15,
              isPro: true,
              image: 'obstetrics___gynaecology',
              questions: [
                {
                  id: 'obg_q28_1',
                  questionNumber: 1,
                  text: 'What is the standard non-invasive Doppler modality of choice to screen for and monitor the severity of fetal anemia in Rh-isoimmunized pregnancies?',
                  options: [
                    { id: 'A', text: 'Middle Cerebral Artery Peak Systolic Velocity (MCA-PSV > 1.5 MoM)' },
                    { id: 'B', text: 'Umbilical artery pulsatility index' },
                    { id: 'C', text: 'Ductus venosus A-wave inversion' },
                    { id: 'D', text: 'Uterine artery notch index' }
                  ],
                  correctOption: 'A',
                  explanation: 'Fetal anemia decreases blood viscosity and increases cardiac output, accelerating cerebral blood velocity. A Middle Cerebral Artery Peak Systolic Velocity (MCA-PSV) > 1.5 Multiples of the Median (MoM) for gestational age predicts moderate-to-severe fetal anemia with >95% sensitivity, replacing invasive amniocentesis (Liley curve).',
                  keyConcept: 'Fetal Anemia Non-Invasive Screening: MCA-PSV Doppler > 1.5 MoM indicates significant fetal anemia requiring intrauterine transfusion (IUT).'
                }
              ]
            },
            {
              id: 'obg_t29_hepatic_disorders_and_infections_in_pregnancy',
              name: 'Hepatic Disorders and Infections in Pregnancy',
              rating: 4.4,
              mcqCount: 25,
              isPro: true,
              image: 'obstetrics___gynaecology',
              questions: [
                {
                  id: 'obg_q29_1',
                  questionNumber: 1,
                  text: 'A 32-year-old multigravida at 34 weeks gestation presents with intense generalized pruritus predominantly affecting the palms and soles that worsens at night, without any primary skin rash. Serum bile acids are elevated at 45 micromol/L. What is the diagnosis and the medical treatment of choice?',
                  options: [
                    { id: 'A', text: 'Intrahepatic Cholestasis of Pregnancy (IHCP); Ursodeoxycholic acid (UDCA)' },
                    { id: 'B', text: 'Acute Fatty Liver of Pregnancy (AFLP); Immediate laparotomy' },
                    { id: 'C', text: 'Pruritic Urticarial Papules and Plaques of Pregnancy (PUPPP); Topical steroids only' },
                    { id: 'D', text: 'Viral Hepatitis E; Ribavirin' }
                  ],
                  correctOption: 'A',
                  explanation: 'Intrahepatic Cholestasis of Pregnancy (IHCP / Obstetric Cholestasis) presents with nocturnal palmoplantar pruritus without rash, associated with elevated serum total bile acids (>10 micromol/L, severe if >40-100 micromol/L). First-line drug is Ursodeoxycholic Acid (UDCA, 10-15 mg/kg/day), which relieves itching and reduces fetal risks (meconium staining, sudden intrauterine fetal demise).',
                  keyConcept: 'IHCP: Nocturnal itching of palms/soles + high serum bile acids (>10-40 umol/L). Drug of Choice = Ursodeoxycholic Acid (UDCA). Planned delivery at 37-38 weeks.'
                }
              ]
            }
          ]
        },
        {
          id: 'obg_chap_general_gynaecology',
          name: 'GENERAL GYNAECOLOGY',
          topics: [
            {
              id: 'obg_t30_disorders_of_menstruation',
              name: 'Disorders of Menstruation',
              rating: 4.5,
              mcqCount: 18,
              isPro: true,
              image: 'obstetrics___gynaecology',
              questions: [
                {
                  id: 'obg_q30_1',
                  questionNumber: 1,
                  text: 'According to the FIGO PALM-COEIN classification system for Abnormal Uterine Bleeding (AUB) in non-pregnant reproductive-age women, which components represent structural etiologies?',
                  options: [
                    { id: 'A', text: 'PALM: Polyp, Adenomyosis, Leiomyoma, Malignancy & hyperplasia' },
                    { id: 'B', text: 'COEIN: Coagulopathy, Ovulatory dysfunction, Endometrial, Iatrogenic, Not classified' },
                    { id: 'C', text: 'PCOS, Adenomyosis, Lactation, Menopause' },
                    { id: 'D', text: 'Pelvic infection, Adhesions, Lacerations, Myoma' }
                  ],
                  correctOption: 'A',
                  explanation: 'FIGO PALM-COEIN classification divides AUB into: Structural (PALM: Polyp, Adenomyosis, Leiomyoma [submucosal/other], Malignancy & hyperplasia) and Non-structural (COEIN: Coagulopathy, Ovulatory dysfunction, Endometrial, Iatrogenic, Not otherwise classified).',
                  keyConcept: 'FIGO AUB Classification: Structural = PALM (Polyp, Adenomyosis, Leiomyoma, Malignancy); Non-structural = COEIN (Coagulopathy, Ovulatory, Endometrial, Iatrogenic, Not classified).'
                }
              ]
            },
            {
              id: 'obg_t31_benign_lesions_of_vulva_vagina_and_cervix',
              name: 'Benign Lesions of Vulva, Vagina & Cervix',
              rating: 4.5,
              mcqCount: 20,
              isPro: true,
              image: 'obstetrics___gynaecology',
              questions: [
                {
                  id: 'obg_q31_1',
                  questionNumber: 1,
                  text: 'A 60-year-old postmenopausal female presents with chronic vulvar itching and burning. On examination, the vulva exhibits porcelain-white parchment-like atrophic plaques with loss of labia minora and an "hourglass" or "figure-of-eight" perianal distribution. What is the diagnosis and first-line medical therapy?',
                  options: [
                    { id: 'A', text: 'Lichen Sclerosus; Ultra-potent topical corticosteroid (Clobetasol propionate 0.05%)' },
                    { id: 'B', text: 'Lichen Planus; Oral antifungal therapy' },
                    { id: 'C', text: 'Vulvar intraepithelial neoplasia; Wide local excision' },
                    { id: 'D', text: 'Trichomoniasis; Metronidazole' }
                  ],
                  correctOption: 'A',
                  explanation: 'Lichen Sclerosus (Lichen Sclerosus et Atrophicus) is a chronic inflammatory dermatosis of the anogenital region in postmenopausal women presenting with intense pruritus, "cigarette-paper" or porcelain-white skin, and architectural resorption (keyhole/figure-of-eight). First-line treatment is high-potency topical corticosteroid (Clobetasol propionate 0.05% ointment).',
                  keyConcept: 'Lichen Sclerosus: Figure-of-eight porcelain-white atrophy + intense pruritus. Rx: Ultra-potent topical steroid (Clobetasol 0.05%). 3-5% risk of progression to Squamous Cell Carcinoma.'
                }
              ]
            },
            {
              id: 'obg_t32_uterine_fibroids_and_adenomyosis',
              name: 'Uterine Fibroids and Adenomyosis',
              rating: 4.6,
              mcqCount: 25,
              isPro: true,
              image: 'obstetrics___gynaecology',
              questions: [
                {
                  id: 'obg_q32_1',
                  questionNumber: 1,
                  text: 'Which anatomical subtype of uterine leiomyoma is most strongly associated with severe menorrhagia (heavy menstrual bleeding) and reproductive failure / infertility?',
                  options: [
                    { id: 'A', text: 'Submucosal fibroids (FIGO Types 0, 1, 2)' },
                    { id: 'B', text: 'Subserosal fibroids (FIGO Types 5, 6)' },
                    { id: 'C', text: 'Pedunculated subserosal fibroid (FIGO Type 7)' },
                    { id: 'D', text: 'Broad ligament fibroid (FIGO Type 8)' }
                  ],
                  correctOption: 'A',
                  explanation: 'Submucosal leiomyomas (FIGO 0-2) distort the endometrial cavity, disrupt endometrial hemostasis, ulcerate surface vessels, and impair blastocyst implantation, making them the most symptomatic subtype for severe heavy menstrual bleeding and infertility.',
                  keyConcept: 'Fibroid Types: Submucosal (FIGO 0-2 -> Menorrhagia & Infertility, managed by Hysteroscopic Myomectomy); Intramural (FIGO 3-5 -> Bulk symptoms); Subserosal (FIGO 6-7 -> Pressure symptoms).'
                }
              ]
            },
            {
              id: 'obg_t33_endometriosis',
              name: 'Endometriosis',
              rating: 4.6,
              mcqCount: 22,
              isPro: true,
              image: 'obstetrics___gynaecology',
              questions: [
                {
                  id: 'obg_q33_1',
                  questionNumber: 1,
                  text: 'What is the diagnostic gold standard for confirming endometriosis and staging disease severity?',
                  options: [
                    { id: 'A', text: 'Diagnostic Laparoscopy with direct visualization and histological biopsy' },
                    { id: 'B', text: 'Serum CA-125 biomarker level' },
                    { id: 'C', text: 'Hysterosalpingography (HSG)' },
                    { id: 'D', text: 'Transvaginal color Doppler ultrasound alone' }
                  ],
                  correctOption: 'A',
                  explanation: 'Laparoscopy with histological confirmation of endometrial glands and stroma outside the uterine cavity is the definitive gold standard for diagnosing and staging endometriosis (visualizing "powder-burn" dark lesions, superficial peritoneal implants, and ovarian endometriomas / "chocolate cysts").',
                  keyConcept: 'Endometriosis Gold Standard: Diagnostic Laparoscopy + Biopsy. Classic Triad: Dysmenorrhea (congestive/secondary), Dyspareunia (deep), and Infertility.'
                }
              ]
            },
            {
              id: 'obg_t34_pelvic_organ_prolapse_and_urinary_incontinence',
              name: 'Pelvic Organ Prolapse & Urinary Incontinence',
              rating: 4.5,
              mcqCount: 24,
              isPro: true,
              image: 'obstetrics___gynaecology',
              questions: [
                {
                  id: 'obg_q34_1',
                  questionNumber: 1,
                  text: 'A 50-year-old multiparous female complains of involuntary urine leakage whenever she coughs, sneezes, laughs, or lifts heavy objects, without any preceding urgency to void. What is the diagnosis and the most effective first-line conservative management?',
                  options: [
                    { id: 'A', text: 'Stress Urinary Incontinence (SUI); Pelvic Floor Muscle Training (Kegel exercises)' },
                    { id: 'B', text: 'Urge Urinary Incontinence; Anticholinergic drugs (Oxybutynin)' },
                    { id: 'C', text: 'Overflow Incontinence; Clean intermittent self-catheterization' },
                    { id: 'D', text: 'Vesicovaginal fistula; Immediate surgical repair' }
                  ],
                  correctOption: 'A',
                  explanation: 'Involuntary leakage of urine synchronous with increased intra-abdominal pressure (coughing, laughing, sneezing) in the absence of detrusor contraction defines Stress Urinary Incontinence (SUI), caused by urethral hypermobility and pelvic floor weakness. First-line therapy is Pelvic Floor Muscle Training (Kegel exercises for >= 3 months). Gold standard surgery is Mid-urethral sling (TVT/TOT).',
                  keyConcept: 'Urinary Incontinence: Stress UI = Leak on cough/effort (Rx: Kegels -> Mid-urethral sling TVT/TOT); Urge UI = Overactive detrusor (Rx: Bladder retraining -> Anticholinergics / Mirabegron).'
                }
              ]
            },
            {
              id: 'obg_t35_polycystic_ovarian_syndrome_pcos',
              name: 'Polycystic Ovarian Syndrome (PCOS)',
              rating: 4.6,
              mcqCount: 20,
              isPro: true,
              image: 'obstetrics___gynaecology',
              questions: [
                {
                  id: 'obg_q35_1',
                  questionNumber: 1,
                  text: 'According to the Rotterdam Consensus Criteria, how many of the 3 diagnostic features must be present to establish a diagnosis of Polycystic Ovary Syndrome (PCOS)?',
                  options: [
                    { id: 'A', text: 'At least 2 out of 3 (Oligo/anovulation, Hyperandrogenism, Polycystic ovaries on USG)' },
                    { id: 'B', text: 'All 3 criteria must be strictly present simultaneously' },
                    { id: 'C', text: 'Elevated LH:FSH ratio > 3:1 alone' },
                    { id: 'D', text: 'Insulin resistance with acanthosis nigricans alone' }
                  ],
                  correctOption: 'A',
                  explanation: 'Rotterdam 2003 criteria requires presence of >= 2 of 3 features (after excluding other etiologies like CAH, Cushing, hyperprolactinemia): (1) Oligo- or anovulation, (2) Clinical and/or biochemical signs of hyperandrogenism, (3) Polycystic ovaries on ultrasound (>= 20 follicles of 2-9 mm per ovary or ovarian volume >= 10 mL).',
                  keyConcept: 'Rotterdam Criteria for PCOS: >= 2 of 3: (1) Oligo/anovulation, (2) Hyperandrogenism (hirsutism/elevated testosterone), (3) Polycystic ovarian morphology (string of pearls).'
                }
              ]
            },
            {
              id: 'obg_t36_amenorrhea_and_puberty_disorders',
              name: 'Amenorrhea and Puberty Disorders',
              rating: 4.5,
              mcqCount: 22,
              isPro: true,
              image: 'obstetrics___gynaecology',
              questions: [
                {
                  id: 'obg_q36_1',
                  questionNumber: 1,
                  text: 'A 17-year-old phenotypic female presents with primary amenorrhea and normal breast development (Tanner Stage 4), but completely absent pubic and axillary hair. Pelvic ultrasound reveals a blind vaginal pouch and absent uterus. Karyotype analysis reveals 46,XY. What is the diagnosis?',
                  options: [
                    { id: 'A', text: 'Complete Androgen Insensitivity Syndrome (CAIS / Testicular feminization)' },
                    { id: 'B', text: 'Müllerian Agenesis (Mayer-Rokitansky-Küster-Hauser syndrome)' },
                    { id: 'C', text: 'Turner syndrome (45,X)' },
                    { id: 'D', text: 'Swyer syndrome (46,XY pure gonadal dysgenesis)' }
                  ],
                  correctOption: 'A',
                  explanation: 'Complete Androgen Insensitivity Syndrome (CAIS) is an X-linked recessive androgen receptor defect in a 46,XY individual with functional intra-abdominal testes producing testosterone and Anti-Müllerian Hormone (AMH). AMH causes Müllerian regression (absent uterus/tubes/upper vagina). Peripheral aromatization of testosterone produces female breasts, but unresponsiveness to androgens results in absent pubic/axillary hair.',
                  keyConcept: 'Primary Amenorrhea with Normal Breasts & Absent Uterus: CAIS (46,XY, Absent pubic hair, high testosterone); MRKH Syndrome (46,XX, Normal pubic hair, normal ovaries, normal female testosterone).'
                }
              ]
            },
            {
              id: 'obg_t37_menopause_and_hormone_replacement_therapy',
              name: 'Menopause and Hormone Replacement Therapy',
              rating: 4.5,
              mcqCount: 16,
              isPro: true,
              image: 'obstetrics___gynaecology',
              questions: [
                {
                  id: 'obg_q37_1',
                  questionNumber: 1,
                  text: 'In a postmenopausal woman with an intact uterus seeking Hormone Replacement Therapy (HRT) for severe vasomotor flushes, why must progestogen always be added to systemic estrogen therapy?',
                  options: [
                    { id: 'A', text: 'To prevent unopposed estrogen-induced endometrial hyperplasia and endometrial carcinoma' },
                    { id: 'B', text: 'To enhance ovarian steroidogenesis' },
                    { id: 'C', text: 'To prevent deep vein thrombosis' },
                    { id: 'D', text: 'To increase bone mineral density faster' }
                  ],
                  correctOption: 'A',
                  explanation: 'Unopposed systemic estrogen in a woman with an intact uterus leads to endometrial proliferation, hyperplasia, and a significantly increased risk of endometrial adenocarcinoma. Adding a progestogen converts the endometrium to a secretory state and induces periodic shedding or atrophy, eliminating the risk.',
                  keyConcept: 'HRT Principles: Intact Uterus = Combined Estrogen + Progesterone (to protect endometrium); Previous Hysterectomy = Estrogen-only HRT.'
                }
              ]
            }
          ]
        },
        {
          id: 'obg_chap_gynaecologic_infections',
          name: 'GYNAECOLOGIC INFECTIONS',
          topics: [
            {
              id: 'obg_t38_pelvic_inflammatory_disease_and_stis',
              name: 'Pelvic Inflammatory Disease (PID) and Sexually Transmitted Infections',
              rating: 4.5,
              mcqCount: 22,
              isPro: true,
              image: 'obstetrics___gynaecology',
              questions: [
                {
                  id: 'obg_q38_1',
                  questionNumber: 1,
                  text: 'What are the two most common sexually transmitted pathogens responsible for acute Pelvic Inflammatory Disease (PID)?',
                  options: [
                    { id: 'A', text: 'Chlamydia trachomatis and Neisseria gonorrhoeae' },
                    { id: 'B', text: 'Treponema pallidum and Haemophilus ducreyi' },
                    { id: 'C', text: 'Trichomonas vaginalis and Candida albicans' },
                    { id: 'D', text: 'Mycoplasma hominis and Ureaplasma urealyticum only' }
                  ],
                  correctOption: 'A',
                  explanation: 'Chlamydia trachomatis and Neisseria gonorrhoeae are the primary initiating pathogens of acute ascending PID, triggering secondary polymicrobial infection with anaerobes and enteric Gram-negative rods. Empiric outpatient treatment: Ceftriaxone 500 mg IM single dose + Doxycycline 100 mg PO BID x 14 days + Metronidazole 500 mg PO BID x 14 days.',
                  keyConcept: 'PID Pathogens: Chlamydia trachomatis & N. gonorrhoeae. CDC Outpatient Rx: Ceftriaxone 500 mg IM + Doxycycline 100 mg BID x 14d + Metronidazole 500 mg BID x 14d.'
                }
              ]
            },
            {
              id: 'obg_t39_vaginal_discharge_and_genital_ulcerative_diseases',
              name: 'Vaginal Discharge & Genital Ulcerative Diseases',
              rating: 4.5,
              mcqCount: 18,
              isPro: true,
              image: 'obstetrics___gynaecology',
              questions: [
                {
                  id: 'obg_q39_1',
                  questionNumber: 1,
                  text: 'A 25-year-old female presents with a thin, homogeneous grey-white vaginal discharge with a "fishy" odor. Microscopic examination of a wet mount reveals vaginal epithelial cells studded with coccobacilli obscuring cell margins. Addition of 10% KOH releases a strong amine odor. What is the diagnosis?',
                  options: [
                    { id: 'A', text: 'Bacterial Vaginosis (Amsel criteria positive with Clue cells)' },
                    { id: 'B', text: 'Trichomoniasis' },
                    { id: 'C', text: 'Vulvovaginal Candidiasis' },
                    { id: 'D', text: 'Desquamative inflammatory vaginitis' }
                  ],
                  correctOption: 'A',
                  explanation: 'Bacterial Vaginosis (overgrowth of Gardnerella vaginalis and anaerobes replacing lactobacilli) is diagnosed by Amsel criteria (>= 3 of 4): (1) Homogeneous thin grey discharge, (2) Vaginal pH > 4.5, (3) Positive Whiff test (amine odor with 10% KOH), (4) Clue cells > 20% on saline wet mount. Treatment: Metronidazole 500 mg PO BID x 7 days.',
                  keyConcept: 'Vaginitis Triad: Bacterial Vaginosis (Clue cells, pH > 4.5, Whiff positive, Rx Metronidazole); Trichomoniasis (Motile flagellates, strawberry cervix, pH > 4.5, Rx Metronidazole); Candida (Pseudohyphae, curdy white, pH < 4.5, Rx Fluconazole).'
                }
              ]
            },
            {
              id: 'obg_t40_genital_tuberculosis',
              name: 'Genital Tuberculosis',
              rating: 4.5,
              mcqCount: 15,
              isPro: true,
              image: 'obstetrics___gynaecology',
              questions: [
                {
                  id: 'obg_q40_1',
                  questionNumber: 1,
                  text: 'What is the most common anatomical site of involvement in Female Genital Tuberculosis?',
                  options: [
                    { id: 'A', text: 'Fallopian tubes (90-100%, bilateral)' },
                    { id: 'B', text: 'Endometrium (50-60%)' },
                    { id: 'C', text: 'Ovaries (20-30%)' },
                    { id: 'D', text: 'Cervix (5-15%)' }
                  ],
                  correctOption: 'A',
                  explanation: 'Female genital tuberculosis is almost always secondary to hematogenous spread from a primary pulmonary focus. The Fallopian tubes are involved in nearly 100% of cases (bilateral), leading to tubal occlusion, hydrosalpinx ("tobacco-pouch" or "pipe-stem" tube on HSG), and female infertility.',
                  keyConcept: 'Genital TB: Fallopian tubes involved in 90-100% (bilateral). HSG Signs: Lead-pipe tubes, Tobacco-pouch appearance, Golf-club ampulla, Asherman syndrome.'
                }
              ]
            }
          ]
        },
        {
          id: 'obg_chap_infertility_and_contraception',
          name: 'INFERTILITY AND CONTRACEPTION',
          topics: [
            {
              id: 'obg_t41_female_infertility_and_ovulation_induction',
              name: 'Female Infertility & Ovulation Induction',
              rating: 4.6,
              mcqCount: 25,
              isPro: true,
              image: 'obstetrics___gynaecology',
              questions: [
                {
                  id: 'obg_q41_1',
                  questionNumber: 1,
                  text: 'Which drug is the first-line oral ovulation induction agent of choice in women with anovulatory infertility due to Polycystic Ovary Syndrome (PCOS)?',
                  options: [
                    { id: 'A', text: 'Letrozole (Aromatase inhibitor)' },
                    { id: 'B', text: 'Clomiphene citrate (SERM)' },
                    { id: 'C', text: 'Metformin alone' },
                    { id: 'D', text: 'Tamoxifen' }
                  ],
                  correctOption: 'A',
                  explanation: 'According to international evidence-based PCOS guidelines and the NICHD trial, Letrozole (aromatase inhibitor, 2.5-5 mg/day on cycle days 3-7) is the first-line ovulation induction agent in PCOS, resulting in significantly higher ovulation rates, live birth rates, and lower rates of multiple pregnancy compared to Clomiphene Citrate.',
                  keyConcept: 'Ovulation Induction in PCOS: Letrozole is 1st line (higher live birth rates, no anti-estrogenic endometrial effect). Clomiphene citrate is alternative.'
                }
              ]
            },
            {
              id: 'obg_t42_male_infertility_and_art',
              name: 'Male Infertility & Assisted Reproductive Technologies (ART)',
              rating: 4.5,
              mcqCount: 20,
              isPro: true,
              image: 'obstetrics___gynaecology',
              questions: [
                {
                  id: 'obg_q42_1',
                  questionNumber: 1,
                  text: 'What Assisted Reproductive Technology (ART) procedure is specifically indicated for severe male factor infertility (e.g., severe oligoasthenoteratozoospermia, surgically retrieved epididymal or testicular sperm)?',
                  options: [
                    { id: 'A', text: 'Intracytoplasmic Sperm Injection (ICSI)' },
                    { id: 'B', text: 'Intrauterine Insemination (IUI)' },
                    { id: 'C', text: 'Standard in vitro fertilization (IVF)' },
                    { id: 'D', text: 'Gamete Intrafallopian Transfer (GIFT)' }
                  ],
                  correctOption: 'A',
                  explanation: 'Intracytoplasmic Sperm Injection (ICSI) involves the micro-injection of a single viable spermatozoon directly into the cytoplasm of a mature metaphase II oocyte. It is the gold standard ART method for severe male factor subfertility, obstructive/non-obstructive azoospermia (TESA/TESE), and previous conventional IVF fertilization failure.',
                  keyConcept: 'ART Indications: IUI = Mild male factor / unexplained with patent tubes; IVF = Bilateral tubal block; ICSI = Severe male factor / azoospermia / TESA-PESA.'
                }
              ]
            },
            {
              id: 'obg_t43_temporary_contraceptive_methods',
              name: 'Temporary Contraceptive Methods',
              rating: 4.5,
              mcqCount: 24,
              isPro: true,
              image: 'obstetrics___gynaecology',
              questions: [
                {
                  id: 'obg_q43_1',
                  questionNumber: 1,
                  text: 'What is the primary mechanism of action of Levonorgestrel-releasing Intrauterine Systems (LNG-IUS / Mirena)?',
                  options: [
                    { id: 'A', text: 'Local endometrial glandular atrophy and thick cervical mucus hostility preventing sperm penetration' },
                    { id: 'B', text: 'Systemic inhibition of the pituitary LH surge preventing ovulation in all cycles' },
                    { id: 'C', text: 'Induction of an aseptic foreign-body leukocytic uterine inflammation without hormone effect' },
                    { id: 'D', text: 'Permanent tubal ciliary destruction' }
                  ],
                  correctOption: 'A',
                  explanation: 'LNG-IUS (Mirena, 52 mg LNG releasing 20 mcg/day) exerts its primary contraceptive and therapeutic action via intense local endometrial suppression (profound glandular atrophy, stroma decidualization) and thickening of cervical mucus to block sperm transport. Most women continue to have ovulatory ovarian cycles.',
                  keyConcept: 'Contraceptive MOA: Copper IUCD = Sterile foreign-body leukocytic reaction + spermicidal copper ions; LNG-IUS (Mirena) = Thick cervical mucus + endometrial atrophy (also 1st line medical Rx for Heavy Menstrual Bleeding).'
                }
              ]
            },
            {
              id: 'obg_t44_permanent_sterilization_and_emergency_contraception',
              name: 'Permanent Sterilization & Emergency Contraception',
              rating: 4.5,
              mcqCount: 18,
              isPro: true,
              image: 'obstetrics___gynaecology',
              questions: [
                {
                  id: 'obg_q44_1',
                  questionNumber: 1,
                  text: 'What is the single most effective emergency contraceptive method when inserted within 5 days (120 hours) of unprotected sexual intercourse?',
                  options: [
                    { id: 'A', text: 'Copper Intrauterine Device (Cu-T 380A)' },
                    { id: 'B', text: 'Levonorgestrel 1.5 mg oral single dose' },
                    { id: 'C', text: 'Ulipristal acetate 30 mg oral single dose' },
                    { id: 'D', text: 'Yuzpe regimen (combined oral contraceptive pills)' }
                  ],
                  correctOption: 'A',
                  explanation: 'The Copper Intrauterine Device (Cu-IUCD) is the most effective method of emergency contraception, with a failure rate of <0.1% when inserted within 5 days (120 hours) of unprotected coitus. It also provides ongoing reversible contraception for up to 10-12 years.',
                  keyConcept: 'Emergency Contraception Efficacy: Copper IUD (>99.9% effective within 120h, #1 overall) > Ulipristal acetate 30 mg (within 120h) > Levonorgestrel 1.5 mg (within 72h).'
                }
              ]
            }
          ]
        },
        {
          id: 'obg_chap_gynaecologic_oncology',
          name: 'GYNAECOLOGIC ONCOLOGY',
          topics: [
            {
              id: 'obg_t45_cervical_intraepithelial_neoplasia_cin_and_screening',
              name: 'Cervical Intraepithelial Neoplasia (CIN) & Screening',
              rating: 4.6,
              mcqCount: 26,
              isPro: true,
              image: 'obstetrics___gynaecology',
              questions: [
                {
                  id: 'obg_q45_1',
                  questionNumber: 1,
                  text: 'Which High-Risk Human Papillomavirus (HR-HPV) genotypes are responsible for approximately 70% of all invasive cervical cancers worldwide?',
                  options: [
                    { id: 'A', text: 'HPV 16 and HPV 18' },
                    { id: 'B', text: 'HPV 6 and HPV 11' },
                    { id: 'C', text: 'HPV 31 and HPV 33' },
                    { id: 'D', text: 'HPV 45 and HPV 52' }
                  ],
                  correctOption: 'A',
                  explanation: 'High-risk oncogenic HPV types 16 (causes ~55% of squamous cell carcinomas) and 18 (causes ~15% of adenocarcinomas) account for >70% of invasive cervical cancers globally. Viral oncoproteins E6 and E7 inactivate host tumor suppressors p53 and Rb respectively.',
                  keyConcept: 'HPV Oncology: High-risk = HPV 16, 18 (E6 -> degrades p53; E7 -> binds & inactivates Rb). Low-risk = HPV 6, 11 (cause Condyloma acuminata / Genital warts).'
                }
              ]
            },
            {
              id: 'obg_t46_carcinoma_cervix',
              name: 'Carcinoma Cervix',
              rating: 4.6,
              mcqCount: 28,
              isPro: true,
              image: 'obstetrics___gynaecology',
              questions: [
                {
                  id: 'obg_q46_1',
                  questionNumber: 1,
                  text: 'What is the primary treatment of choice for Stage IIB (carcinoma cervix with parametrial invasion) and higher stages according to FIGO guidelines?',
                  options: [
                    { id: 'A', text: 'Concurrent Chemoradiotherapy (CCRT: External beam radiotherapy + Cisplatin + Brachytherapy)' },
                    { id: 'B', text: 'Radical Hysterectomy with bilateral pelvic lymphadenectomy (Wertheim Meigs operation)' },
                    { id: 'C', text: 'Simple extrafascial hysterectomy' },
                    { id: 'D', text: 'Systemic combination chemotherapy alone' }
                  ],
                  correctOption: 'A',
                  explanation: 'Surgical management (Radical Hysterectomy / Wertheim operation) is reserved for early-stage cervical cancer (Stage IA, IB1, IB2, IIA1). Once parametrial infiltration occurs (Stage IIB and above), surgery is contraindicated and Definitive Concurrent Chemoradiotherapy (CCRT with weekly Cisplatin + EBRT + Intracavitary Brachytherapy) is the standard of care.',
                  keyConcept: 'Carcinoma Cervix Management: Early stage (up to IIA1) = Radical Hysterectomy (Wertheim); Locally advanced (Stage IIB to IVA) = Concurrent Chemoradiotherapy (CCRT with Cisplatin).'
                }
              ]
            },
            {
              id: 'obg_t47_endometrial_hyperplasia_and_carcinoma_endometrium',
              name: 'Endometrial Hyperplasia & Carcinoma Endometrium',
              rating: 4.5,
              mcqCount: 24,
              isPro: true,
              image: 'obstetrics___gynaecology',
              questions: [
                {
                  id: 'obg_q47_1',
                  questionNumber: 1,
                  text: 'What is the classic clinical presenting symptom in over 90% of women with Endometrial Carcinoma?',
                  options: [
                    { id: 'A', text: 'Postmenopausal bleeding' },
                    { id: 'B', text: 'Acute pelvic pain and shock' },
                    { id: 'C', text: 'Bilateral flank mass' },
                    { id: 'D', text: 'Postcoital contact bleeding only' }
                  ],
                  correctOption: 'A',
                  explanation: 'Postmenopausal bleeding is the classic hallmark of endometrial carcinoma (and atypical endometrial hyperplasia). Any postmenopausal bleeding requires prompt evaluation with Transvaginal Ultrasound (endometrial thickness > 4 mm is abnormal) followed by Pipelle / fractional endometrial biopsy.',
                  keyConcept: 'Postmenopausal Bleeding: #1 most common cause overall = Atrophic endometritis; Most critical cause to rule out = Endometrial Carcinoma (TVS cutoff ET > 4 mm requires endometrial biopsy).'
                }
              ]
            },
            {
              id: 'obg_t48_ovarian_tumors_benign_and_malignant',
              name: 'Ovarian Tumors - Benign and Malignant',
              rating: 4.6,
              mcqCount: 30,
              isPro: true,
              image: 'obstetrics___gynaecology',
              questions: [
                {
                  id: 'obg_q48_1',
                  questionNumber: 1,
                  text: 'Histopathological examination of an ovarian tumor in a 62-year-old female reveals concentric laminated calcospherites known as "Psammoma bodies". What is the diagnosis?',
                  options: [
                    { id: 'A', text: 'Serous ovarian cystadenocarcinoma' },
                    { id: 'B', text: 'Mucinous cystadenocarcinoma' },
                    { id: 'C', text: 'Granulosa cell tumor' },
                    { id: 'D', text: 'Dysgerminoma' }
                  ],
                  correctOption: 'A',
                  explanation: 'Psammoma bodies (concentric, laminated calcified micro-concretions) are pathognomonic for Serous neoplasms of the ovary (Serous cystadenoma / cystadenocarcinoma), as well as Papillary thyroid cancer and Meningioma.',
                  keyConcept: 'Psammoma Bodies Mnemonic (PSaMMoma): Papillary thyroid cancer, Serous cystadenocarcinoma of ovary, Meningioma, Mesothelioma.'
                }
              ]
            },
            {
              id: 'obg_t49_vulvar_and_vaginal_malignancies',
              name: 'Vulvar and Vaginal Malignancies',
              rating: 4.4,
              mcqCount: 16,
              isPro: true,
              image: 'obstetrics___gynaecology',
              questions: [
                {
                  id: 'obg_q49_1',
                  questionNumber: 1,
                  text: 'What is the most common histological type of primary carcinoma of the vulva?',
                  options: [
                    { id: 'A', text: 'Squamous Cell Carcinoma (90%)' },
                    { id: 'B', text: 'Malignant Melanoma (5%)' },
                    { id: 'C', text: 'Basal Cell Carcinoma' },
                    { id: 'D', text: 'Adenocarcinoma of Bartholin gland' }
                  ],
                  correctOption: 'A',
                  explanation: 'Squamous Cell Carcinoma (SCC) accounts for approximately 90% of all vulvar malignancies. It arises via two pathways: (1) HPV-related (younger women, associated with classic High-grade Squamous Intraepithelial Lesion / HSIL), and (2) HPV-negative / Differentiated VIN (older postmenopausal women, associated with Lichen Sclerosus and p53 mutations).',
                  keyConcept: 'Vulvar Cancer: 90% Squamous Cell Carcinoma (Labium majus is most common site). Lymphatic spread is to Superficial and Deep Inguinal Lymph Nodes (Sentinel lymph node biopsy is standard in early lesions).'
                }
              ]
            }
          ]
        }
      ]
    },
"""

with open('js/core/qbank-data.js', 'r', encoding='utf-8') as f:
    full_text = f.read()

# Replace obstetrics___gynaecology block
obg_start = full_text.find('obstetrics___gynaecology:')
if obg_start == -1:
    print("Could not find obstetrics___gynaecology in js/core/qbank-data.js")
    sys.exit(1)

# Find end of obstetrics___gynaecology block
# It ends right before `// Auto-expand question datasets` or the next subject
auto_expand_idx = full_text.find('// Auto-expand question datasets', obg_start)
if auto_expand_idx == -1:
    auto_expand_idx = full_text.find('// Aliases', obg_start)

# Find closing brace before auto_expand_idx
block_end = full_text.rfind('}', obg_start, auto_expand_idx)
# Include trailing comma/newline
block_end_full = full_text.find('\n', block_end) + 1

new_content = full_text[:obg_start] + obgyn_dataset_js.strip() + '\n  },\n\n  ' + full_text[auto_expand_idx:]

with open('js/core/qbank-data.js', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Successfully replaced obstetrics___gynaecology block in js/core/qbank-data.js")
