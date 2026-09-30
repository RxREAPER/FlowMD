import re

biochem_dataset_js = """    biochemistry: {
      id: 'biochemistry',
      name: 'Biochemistry',
      faculty: 'Dr. Rebecca James',
      accentColor: '#d946ef',
      chapters: [
        {
          id: 'biochem_chap_carbohydrates',
          name: 'CARBOHYDRATES',
          topics: [
            {
              id: 'biochem_t1_carbs_chemistry',
              name: 'Chemistry of Carbohydrates, Amino sugars and Mucopolysaccharides',
              rating: 4.5,
              mcqCount: 22,
              isPro: true,
              image: 'biochemistry',
              questions: [
                {
                  id: 'biochem_q1_1',
                  questionNumber: 1,
                  text: 'A 2-year-old child presents with coarse facial features, corneal clouding, hepatosplenomegaly, skeletal deformities (dysostosis multiplex), and severe intellectual developmental delay. Urinary glycosaminoglycan analysis reveals markedly elevated dermatan sulfate and heparan sulfate. Which enzyme is deficient in this condition (Hurler Syndrome / MPS I)?',
                  options: [
                    { id: 'A', text: 'Alpha-L-iduronidase' },
                    { id: 'B', text: 'Iduronate-2-sulfatase' },
                    { id: 'C', text: 'Galactosamine-6-sulfate sulfatase' },
                    { id: 'D', text: 'Beta-glucuronidase' }
                  ],
                  correctOption: 'A',
                  explanation: 'Hurler syndrome (MPS I H) is an autosomal recessive mucopolysaccharidosis caused by deficiency of alpha-L-iduronidase, leading to lysosomal accumulation of dermatan sulfate and heparan sulfate. Classic features include coarse facies, corneal clouding, dysostosis multiplex, and mental subnormality. (Hunter syndrome / MPS II is X-linked recessive due to iduronate-2-sulfatase deficiency and lacks corneal clouding).',
                  keyConcept: 'Hurler Syndrome (MPS I) = Alpha-L-iduronidase deficiency; corneal clouding present. Hunter Syndrome (MPS II) = Iduronate sulfatase deficiency (X-linked); NO corneal clouding.'
                }
              ]
            },
            {
              id: 'biochem_t2_glycolysis_gluconeogenesis',
              name: 'Glycolysis and gluconeogenesis',
              rating: 4.5,
              mcqCount: 30,
              isPro: true,
              image: 'biochemistry',
              questions: [
                {
                  id: 'biochem_q2_1',
                  questionNumber: 1,
                  text: 'Which of the following allosteric effectors is the most potent physiological activator of the rate-limiting glycolytic enzyme Phosphofructokinase-1 (PFK-1) and simultaneous inhibitor of the gluconeogenic enzyme Fructose-1,6-bisphosphatase?',
                  options: [
                    { id: 'A', text: 'Fructose-2,6-bisphosphate' },
                    { id: 'B', text: 'Adenosine Triphosphate (ATP)' },
                    { id: 'C', text: 'Citrate' },
                    { id: 'D', text: 'Phosphoenolpyruvate' }
                  ],
                  correctOption: 'A',
                  explanation: 'Fructose-2,6-bisphosphate (F-2,6-BP), synthesized by the bifunctional enzyme PFK-2/FBPase-2 under insulin stimulation, is the most potent allosteric activator of PFK-1 (accelerating glycolysis) and allosteric inhibitor of FBPase-1 (suppressing gluconeogenesis), preventing a futile cycle.',
                  keyConcept: 'Fructose-2,6-bisphosphate is the key reciprocating regulator: activates PFK-1 (glycolysis) and inhibits FBPase-1 (gluconeogenesis).'
                }
              ]
            },
            {
              id: 'biochem_t3_glycogen_metabolism',
              name: 'Glycogen metabolism and glycogen storage disorders',
              rating: 4.5,
              mcqCount: 20,
              isPro: true,
              image: 'biochemistry',
              questions: [
                {
                  id: 'biochem_q3_1',
                  questionNumber: 1,
                  text: 'A 6-month-old infant presents with doll-like facial features, massive hepatomegaly with a normal-sized spleen, profound fasting hypoglycemia, severe lactic acidosis, hyperuricemia, and hyperlipidemia. Administration of glucagon or epinephrine does not increase blood glucose. What enzyme deficiency causes this condition (Von Gierke Disease / Type I GSD)?',
                  options: [
                    { id: 'A', text: 'Glucose-6-phosphatase (or translocase)' },
                    { id: 'B', text: 'Lysosomal alpha-1,4-glucosidase (Acid maltase)' },
                    { id: 'C', text: 'Debranching enzyme (Amylo-alpha-1,6-glucosidase)' },
                    { id: 'D', text: 'Liver glycogen phosphorylase' }
                  ],
                  correctOption: 'A',
                  explanation: 'Von Gierke disease (Type I Glycogen Storage Disease) is caused by deficiency of Glucose-6-phosphatase in liver and kidney. Because G-6-P cannot be converted to free glucose, patients suffer severe fasting hypoglycemia, lactic acidosis (accumulation of glycolytic intermediates), hyperuricemia, and hyperlipidemia with massive hepatomegaly.',
                  keyConcept: 'Von Gierke (GSD I): Glucose-6-phosphatase deficiency -> severe fasting hypoglycemia, lactic acidosis, doll-like facies, hyperuricemia, massive hepatomegaly.'
                }
              ]
            },
            {
              id: 'biochem_t4_hmp_shunt_fructose_galactose',
              name: 'HMP shunt pathway, Fructose , Galactose metabolism',
              rating: 4.5,
              mcqCount: 11,
              isPro: true,
              image: 'biochemistry',
              questions: [
                {
                  id: 'biochem_q4_1',
                  questionNumber: 1,
                  text: 'A 24-year-old male with Glucose-6-Phosphate Dehydrogenase (G6PD) deficiency develops acute intravascular hemolysis, dark urine, and jaundice after taking primaquine for malaria. In G6PD deficiency, what critical reducing equivalent is inadequately generated in erythrocytes, impairing the reduction of glutathione?',
                  options: [
                    { id: 'A', text: 'NADPH' },
                    { id: 'B', text: 'NADH' },
                    { id: 'C', text: 'FADH2' },
                    { id: 'D', text: 'Tetrahydrofolate' }
                  ],
                  correctOption: 'A',
                  explanation: 'The HMP shunt (hexose monophosphate shunt) is the sole source of NADPH in red blood cells. G6PD catalyzes the first committed step. Without adequate NADPH, glutathione reductase cannot maintain reduced glutathione (GSH) to detoxify H2O2 and reactive oxygen species, leading to Heinz body precipitation and hemolytic anemia.',
                  keyConcept: 'G6PD deficiency: Decreased NADPH -> decreased reduced glutathione -> oxidative stress -> Heinz bodies, bite cells, and acute hemolysis.'
                }
              ]
            },
            {
              id: 'biochem_t5_etc_bioenergetics',
              name: 'ETC and bioenergetics',
              rating: 4.5,
              mcqCount: 18,
              isPro: true,
              image: 'biochemistry',
              questions: [
                {
                  id: 'biochem_q5_1',
                  questionNumber: 1,
                  text: 'Which complex of the mitochondrial Electron Transport Chain (ETC) is directly inhibited by Cyanide (CN-) and Carbon Monoxide (CO), halting cellular respiration and causing profound lactic acidosis?',
                  options: [
                    { id: 'A', text: 'Complex I (NADH-Q oxidoreductase)' },
                    { id: 'B', text: 'Complex II (Succinate dehydrogenase)' },
                    { id: 'C', text: 'Complex III (Q-cytochrome c oxidoreductase)' },
                    { id: 'D', text: 'Complex IV (Cytochrome c oxidase)' }
                  ],
                  correctOption: 'D',
                  explanation: 'Cyanide, Carbon Monoxide, and Sodium Azide bind strongly to ferric iron (Fe3+) in Cytochrome a3 of Complex IV (Cytochrome c oxidase), completely blocking the terminal transfer of electrons to molecular oxygen, shutting down ATP synthesis.',
                  keyConcept: 'ETC Complex IV Inhibitors: Cyanide (CN-), Carbon Monoxide (CO), Azide, Hydrogen Sulfide. Antidote for cyanide: Hydroxocobalamin / Nitrites + Sodium thiosulfate.'
                }
              ]
            },
            {
              id: 'biochem_t6_krebs_cycle',
              name: 'Krebs Cycle',
              rating: 4.5,
              mcqCount: 20,
              isPro: true,
              image: 'biochemistry',
              questions: [
                {
                  id: 'biochem_q6_1',
                  questionNumber: 1,
                  text: 'Which step of the Citric Acid (Krebs) Cycle is the only reaction directly coupled to substrate-level phosphorylation, generating one high-energy molecule of GTP (or ATP)?',
                  options: [
                    { id: 'A', text: 'Conversion of Succinyl-CoA to Succinate by Succinyl-CoA synthetase (Succinate thiokinase)' },
                    { id: 'B', text: 'Conversion of Isocitrate to Alpha-ketoglutarate by Isocitrate dehydrogenase' },
                    { id: 'C', text: 'Conversion of Alpha-ketoglutarate to Succinyl-CoA by Alpha-ketoglutarate dehydrogenase' },
                    { id: 'D', text: 'Conversion of Malate to Oxaloacetate by Malate dehydrogenase' }
                  ],
                  correctOption: 'A',
                  explanation: 'Succinyl-CoA synthetase (Succinate thiokinase) cleaves the high-energy thioester bond of Succinyl-CoA to form Succinate with the direct phosphorylation of GDP to GTP (substrate-level phosphorylation).',
                  keyConcept: 'TCA cycle substrate-level phosphorylation: Succinyl-CoA -> Succinate (via Succinyl-CoA synthetase), generating GTP.'
                }
              ]
            }
          ]
        },
        {
          id: 'biochem_chap_amino_acids_proteins',
          name: 'AMINO ACIDS AND PROTEINS',
          topics: [
            {
              id: 'biochem_t7_amino_acids_basics',
              name: 'Amino acids: Basics',
              rating: 4.5,
              mcqCount: 27,
              isPro: true,
              image: 'biochemistry',
              questions: [
                {
                  id: 'biochem_q7_1',
                  questionNumber: 1,
                  text: 'Which of the following amino acids contains a secondary amino group (imino acid) with a rigid pyrrolidine side chain that disrupts alpha-helices in protein structures and is abundant in collagen?',
                  options: [
                    { id: 'A', text: 'Proline' },
                    { id: 'B', text: 'Glycine' },
                    { id: 'C', text: 'Tryptophan' },
                    { id: 'D', text: 'Histidine' }
                  ],
                  correctOption: 'A',
                  explanation: 'Proline is technically an imino acid containing a secondary amine within a 5-membered pyrrolidine ring. This rigid conformation prevents rotation, acting as a classic \\"alpha-helix breaker\\", but is essential for the triple-helical conformation of collagen.',
                  keyConcept: 'Proline = Imino acid, alpha-helix breaker, abundant in collagen (Gly-X-Y repeats).'
                }
              ]
            },
            {
              id: 'biochem_t8_amino_acid_metabolism',
              name: 'Amino acid: Metabolism',
              rating: 4.5,
              mcqCount: 23,
              isPro: true,
              image: 'biochemistry',
              questions: [
                {
                  id: 'biochem_q8_1',
                  questionNumber: 1,
                  text: 'All transamination reactions in human amino acid catabolism require which active coenzyme form of Vitamin B6 to facilitate amino group transfer to alpha-ketoglutarate?',
                  options: [
                    { id: 'A', text: 'Pyridoxal Phosphate (PLP)' },
                    { id: 'B', text: 'Thiamine Pyrophosphate (TPP)' },
                    { id: 'C', text: 'Tetrahydrofolate (THF)' },
                    { id: 'D', text: 'Flavin Adenine Dinucleotide (FAD)' }
                  ],
                  correctOption: 'A',
                  explanation: 'Pyridoxal phosphate (PLP), the active coenzyme of Vitamin B6, forms a Schiff base intermediate with amino acid substrates and is mandatory for all transamination, decarboxylation, and deamination reactions.',
                  keyConcept: 'Transaminases (ALT, AST) require Pyridoxal Phosphate (PLP / Vitamin B6) as coenzyme.'
                }
              ]
            },
            {
              id: 'biochem_t9_amino_acid_disorders',
              name: 'Amino acid: Metabolic disorder',
              rating: 4.5,
              mcqCount: 28,
              isPro: true,
              image: 'biochemistry',
              questions: [
                {
                  id: 'biochem_q9_1',
                  questionNumber: 1,
                  text: 'A 3-year-old child presents with intellectual disability, fair skin, blonde hair, blue eyes, eczema, and a distinctive \\"mousy\\" or \\"musty\\" body odor. Which enzyme deficiency is responsible for classic Phenylketonuria (PKU)?',
                  options: [
                    { id: 'A', text: 'Phenylalanine Hydroxylase' },
                    { id: 'B', text: 'Homogentisate 1,2-Dioxygenase' },
                    { id: 'C', text: 'Branched-chain alpha-keto acid dehydrogenase' },
                    { id: 'D', text: 'Cystathionine beta-synthase' }
                  ],
                  correctOption: 'A',
                  explanation: 'Classic PKU is caused by autosomal recessive deficiency of Phenylalanine Hydroxylase (PAH), which converts Phenylalanine to Tyrosine. Elevated phenylalanine is shunted to phenylketones (phenylacetate -> mousy odor). Decreased tyrosine impairs melanin synthesis, causing hypopigmentation.',
                  keyConcept: 'PKU = Phenylalanine Hydroxylase deficiency. Mousy odor, hypopigmentation, microcephaly, mental subnormality. Restrict dietary phenylalanine and supplement tyrosine.'
                }
              ]
            },
            {
              id: 'biochem_t10_protein_structure_function',
              name: 'Protein structure and function',
              rating: 4.4,
              mcqCount: 33,
              isPro: true,
              image: 'biochemistry',
              questions: [
                {
                  id: 'biochem_q10_1',
                  questionNumber: 1,
                  text: 'In the Ramachandran plot, what two polypeptide backbone torsion dihedral angles are plotted against each other to demonstrate sterically permitted secondary structures (alpha-helices and beta-sheets)?',
                  options: [
                    { id: 'A', text: 'Phi (φ, Cα-N bond) and Psi (ψ, Cα-C bond)' },
                    { id: 'B', text: 'Omega (ω) and Chi (χ)' },
                    { id: 'C', text: 'Alpha (α) and Beta (β)' },
                    { id: 'D', text: 'Delta (δ) and Gamma (γ)' }
                  ],
                  correctOption: 'A',
                  explanation: 'The Ramachandran plot maps the phi (φ) angle (rotation around the N-Cα bond) versus the psi (ψ) angle (rotation around the Cα-carbonyl C bond). Right-handed alpha-helices occupy the lower left quadrant and beta-pleated sheets occupy the upper left quadrant.',
                  keyConcept: 'Ramachandran Plot: Phi (N-Cα) vs Psi (Cα-C) dihedral angles defining allowed secondary protein conformations.'
                }
              ]
            },
            {
              id: 'biochem_t11_urea_cycle_disorders',
              name: 'Urea cycle and its disorders',
              rating: 4.5,
              mcqCount: 14,
              isPro: true,
              image: 'biochemistry',
              questions: [
                {
                  id: 'biochem_q11_1',
                  questionNumber: 1,
                  text: 'Which is the only X-linked recessive disorder of the urea cycle, presenting with severe hyperammonemia, lethargy, encephalopathy, and markedly elevated urinary orotic acid in male neonates?',
                  options: [
                    { id: 'A', text: 'Ornithine Transcarbamylase (OTC) deficiency' },
                    { id: 'B', text: 'Carbamoyl Phosphate Synthetase I (CPS I) deficiency' },
                    { id: 'C', text: 'Argininosuccinate synthetase deficiency (Citrullinemia)' },
                    { id: 'D', text: 'Arginase deficiency' }
                  ],
                  correctOption: 'A',
                  explanation: 'Ornithine Transcarbamylase (OTC) deficiency is X-linked recessive (all other urea cycle disorders are autosomal recessive). Excess carbamoyl phosphate spills into the pyrimidine synthesis pathway, leading to massive excretion of orotic acid in urine alongside hyperammonemia.',
                  keyConcept: 'OTC Deficiency: X-linked recessive, Hyperammonemia + Elevated urinary Orotic Acid. CPS-1 deficiency has hyperammonemia WITHOUT orotic aciduria.'
                }
              ]
            }
          ]
        },
        {
          id: 'biochem_chap_lipids',
          name: 'LIPIDS',
          topics: [
            {
              id: 'biochem_t12_lipids_basics',
              name: 'Lipids: Basics',
              rating: 4.5,
              mcqCount: 14,
              isPro: true,
              image: 'biochemistry',
              questions: [
                {
                  id: 'biochem_q12_1',
                  questionNumber: 1,
                  text: 'Which phospholipid is the major active surface-active component of pulmonary surfactant that prevents alveolar collapse at end-expiration, deficient in neonatal Respiratory Distress Syndrome (RDS)?',
                  options: [
                    { id: 'A', text: 'Dipalmitoylphosphatidylcholine (DPPC / Lecithin)' },
                    { id: 'B', text: 'Phosphatidylserine' },
                    { id: 'C', text: 'Sphingomyelin' },
                    { id: 'D', text: 'Cardiolipin' }
                  ],
                  correctOption: 'A',
                  explanation: 'Dipalmitoylphosphatidylcholine (DPPC / Lecithin) constitutes ~80% of pulmonary surfactant produced by Type II pneumocytes. Fetal lung maturity is assessed via the amniotic fluid Lecithin/Sphingomyelin (L/S) ratio, where L/S >= 2.0 indicates mature surfactant production.',
                  keyConcept: 'Surfactant = Dipalmitoylphosphatidylcholine (DPPC / Lecithin). L/S ratio >= 2 indicates fetal lung maturity.'
                }
              ]
            },
            {
              id: 'biochem_t13_fatty_acid_oxidation_ketogenesis',
              name: 'Fatty acid oxidation and ketogenesis',
              rating: 4.5,
              mcqCount: 20,
              isPro: true,
              image: 'biochemistry',
              questions: [
                {
                  id: 'biochem_q13_1',
                  questionNumber: 1,
                  text: 'A 2-year-old child presents with lethargy, seizure, and non-ketotic (hypoketotic) hypoglycemia after an overnight fast. Plasma acylcarnitine profile reveals elevated C8-C10 medium-chain dicarboxylic acids in urine. What is the most common inborn error of fatty acid beta-oxidation?',
                  options: [
                    { id: 'A', text: 'Medium-Chain Acyl-CoA Dehydrogenase (MCAD) deficiency' },
                    { id: 'B', text: 'Carnitine Palmitoyltransferase-1 (CPT-1) deficiency' },
                    { id: 'C', text: 'HMG-CoA Lyase deficiency' },
                    { id: 'D', text: 'Zellweger syndrome' }
                  ],
                  correctOption: 'A',
                  explanation: 'MCAD deficiency is the most common beta-oxidation defect. Impaired breakdown of 6-12 carbon fatty acids into acetyl-CoA leads to inability to sustain gluconeogenesis or synthesize ketone bodies during fasting, causing severe hypoketotic hypoglycemia, dicarboxylic aciduria, and hyperammonemia.',
                  keyConcept: 'MCAD Deficiency: Hypoketotic hypoglycemia + dicarboxylic aciduria during fasting. Treatment: Avoid prolonged fasting; high carbohydrate diet.'
                }
              ]
            },
            {
              id: 'biochem_t14_biosynthesis_fatty_acids_eicosanoids',
              name: 'Biosynthesis of fatty acids and Eicosanoids',
              rating: 4.4,
              mcqCount: 23,
              isPro: true,
              image: 'biochemistry',
              questions: [
                {
                  id: 'biochem_q14_1',
                  questionNumber: 1,
                  text: 'What is the rate-limiting and committed enzyme in the de novo cytoplasmic biosynthesis of fatty acids, which converts Acetyl-CoA to Malonyl-CoA requiring Biotin, ATP, and CO2, and is allosterically activated by Citrate?',
                  options: [
                    { id: 'A', text: 'Acetyl-CoA Carboxylase (ACC)' },
                    { id: 'B', text: 'Fatty Acid Synthase (FAS)' },
                    { id: 'C', text: 'ATP-Citrate Lyase' },
                    { id: 'D', text: 'Malic enzyme' }
                  ],
                  correctOption: 'A',
                  explanation: 'Acetyl-CoA Carboxylase (ACC) catalyzes the irreversible carboxylation of Acetyl-CoA to Malonyl-CoA. It requires Biotin (Vitamin B7). ACC is allosterically activated by Citrate (indicating energy abundance) and inhibited by long-chain Palmitoyl-CoA and phosphorylation by AMPK.',
                  keyConcept: 'Acetyl-CoA Carboxylase (ACC) = Rate-limiting step of fatty acid synthesis. Activated by Citrate and Insulin; inhibited by Palmitoyl-CoA and Glucagon.'
                }
              ]
            },
            {
              id: 'biochem_t15_acylglycerols_sphingolipids',
              name: 'Metabolism of Acylglycerols and Sphingolipids',
              rating: 4.5,
              mcqCount: 24,
              isPro: true,
              image: 'biochemistry',
              questions: [
                {
                  id: 'biochem_q15_1',
                  questionNumber: 1,
                  text: 'A 6-month-old infant of Ashkenazi Jewish ancestry presents with developmental regression, exaggerated startle reflex (hyperacusis), muscle weakness, and a cherry-red spot in the macula. Abdominal examination reveals NO hepatosplenomegaly. Histopathology shows onion-skin lysosomes. What is the enzyme deficiency in Tay-Sachs disease?',
                  options: [
                    { id: 'A', text: 'Hexosaminidase A (accumulates GM2 ganglioside)' },
                    { id: 'B', text: 'Sphingomyelinase' },
                    { id: 'C', text: 'Glucocerebrosidase' },
                    { id: 'D', text: 'Alpha-galactosidase A' }
                  ],
                  correctOption: 'A',
                  explanation: 'Tay-Sachs disease is an autosomal recessive lysosomal storage disease caused by deficiency of Hexosaminidase A, leading to accumulation of GM2 ganglioside. Hallmark is macular cherry-red spot, neurodegeneration, and ABSENCE of hepatosplenomegaly (distinguishing it from Niemann-Pick disease, which HAS hepatosplenomegaly).',
                  keyConcept: 'Tay-Sachs = Hexosaminidase A deficiency (GM2 ganglioside). Cherry-red spot + NO hepatosplenomegaly. Niemann-Pick = Sphingomyelinase deficiency + WITH hepatosplenomegaly.'
                }
              ]
            },
            {
              id: 'biochem_t16_cholesterol_transport_excretion',
              name: 'Cholesterol Synthesis, Transport and Excretion',
              rating: 4.5,
              mcqCount: 21,
              isPro: true,
              image: 'biochemistry',
              questions: [
                {
                  id: 'biochem_q16_1',
                  questionNumber: 1,
                  text: 'Which apolipoprotein acts as an essential cofactor for Lipoprotein Lipase (LPL) on vascular endothelium to facilitate hydrolysis of triglycerides from chylomicrons and VLDL?',
                  options: [
                    { id: 'A', text: 'Apolipoprotein C-II' },
                    { id: 'B', text: 'Apolipoprotein B-100' },
                    { id: 'C', text: 'Apolipoprotein A-I' },
                    { id: 'D', text: 'Apolipoprotein B-48' }
                  ],
                  correctOption: 'A',
                  explanation: 'Apo C-II is the required cofactor for Lipoprotein Lipase (LPL). Familial hyperchylomicronemia (Type I hyperlipidemia) is caused by deficiency of either LPL or Apo C-II, resulting in milky plasma, eruptive xanthomas, and recurrent acute pancreatitis.',
                  keyConcept: 'Apo C-II = Lipoprotein Lipase (LPL) activator. Apo B-48 = Chylomicron secretion. Apo B-100 = LDL receptor ligand. Apo A-I = LCAT activator.'
                }
              ]
            }
          ]
        },
        {
          id: 'biochem_chap_enzymes_porphyrins',
          name: 'ENZYMES AND PORPHYRINS',
          topics: [
            {
              id: 'biochem_t17_porphyrins_bile_pigments',
              name: 'Porphyrins and bile pigments',
              rating: 4.4,
              mcqCount: 24,
              isPro: true,
              image: 'biochemistry',
              questions: [
                {
                  id: 'biochem_q17_1',
                  questionNumber: 1,
                  text: 'A 30-year-old woman presents with episodic severe abdominal pain, peripheral neuropathy, tachycardia, and dark reddish/port-wine colored urine that darkens on standing in sunlight. She has NO cutaneous photosensitivity. What is the enzyme deficiency in Acute Intermittent Porphyria (AIP)?',
                  options: [
                    { id: 'A', text: 'Porphobilinogen (PBG) Deaminase (Hydroxymethylbilane synthase)' },
                    { id: 'B', text: 'Uroporphyrinogen Decarboxylase' },
                    { id: 'C', text: 'ALA Dehydratase' },
                    { id: 'D', text: 'Ferrochelatase' }
                  ],
                  correctOption: 'A',
                  explanation: 'Acute Intermittent Porphyria (AIP) is an autosomal dominant disorder caused by deficiency of PBG Deaminase (HMB synthase). Porphobilinogen and ALA accumulate, causing the classic 5 Ps: Painful abdomen, Port-wine urine, Polyneuropathy, Psychological disturbances, Precipitated by drugs (CYP450 inducers). Skin photosensitivity is absent.',
                  keyConcept: 'Acute Intermittent Porphyria (AIP) = PBG Deaminase deficiency. Neurological/abdominal crisis, port-wine urine, NO photosensitivity. Treatment: Hemin / Glucose.'
                }
              ]
            },
            {
              id: 'biochem_t18_enzymes_mechanism_action',
              name: 'Enzymes - Mechanism of Action & Clinical Importance',
              rating: 4.4,
              mcqCount: 19,
              isPro: true,
              image: 'biochemistry',
              questions: [
                {
                  id: 'biochem_q18_1',
                  questionNumber: 1,
                  text: 'Which isoenzyme of Creatine Kinase (CK) is localized predominantly in cardiac myocytes, rises within 4-6 hours following acute myocardial infarction, peaks at 24 hours, and returns to baseline within 48-72 hours, making it valuable for detecting re-infarction?',
                  options: [
                    { id: 'A', text: 'CK-MB' },
                    { id: 'B', text: 'CK-MM' },
                    { id: 'C', text: 'CK-BB' },
                    { id: 'D', text: 'LDH-1' }
                  ],
                  correctOption: 'A',
                  explanation: 'CK-MB is the cardiac-specific dimer. Due to its short half-life (~24-36 hours), normalization occurs by day 3. A secondary rise in CK-MB after 48-72 hours indicates recurrent myocardial re-infarction.',
                  keyConcept: 'Cardiac Biomarkers: Troponin I/T (most sensitive and specific, stays elevated 7-10 days); CK-MB (returns to baseline by 48 hrs, ideal for re-infarction).'
                }
              ]
            },
            {
              id: 'biochem_t19_enzyme_kinetics_regulation',
              name: 'Enzyme Kinetics and Regulation of Activity',
              rating: 4.4,
              mcqCount: 20,
              isPro: true,
              image: 'biochemistry',
              questions: [
                {
                  id: 'biochem_q19_1',
                  questionNumber: 1,
                  text: 'In the Lineweaver-Burk double-reciprocal plot, what kinetic alterations are observed in the presence of a reversible Competitive Enzyme Inhibitor (such as Statins on HMG-CoA reductase or Methotrexate on DHFR)?',
                  options: [
                    { id: 'A', text: 'Km increases (apparent affinity decreases); Vmax remains unchanged' },
                    { id: 'B', text: 'Vmax decreases; Km remains unchanged' },
                    { id: 'C', text: 'Both Km and Vmax decrease proportionally' },
                    { id: 'D', text: 'Both Km and Vmax increase' }
                  ],
                  correctOption: 'A',
                  explanation: 'Competitive inhibitors bind to the active site and can be overcome by high substrate concentrations. Therefore, the maximal reaction velocity (Vmax) is unchanged (same y-intercept), while more substrate is required to reach 1/2 Vmax, increasing the apparent Km (x-intercept moves closer to zero).',
                  keyConcept: 'Competitive Inhibition: Km increases, Vmax unchanged. Non-competitive Inhibition: Vmax decreases, Km unchanged. Uncompetitive: Both Km and Vmax decrease.'
                }
              ]
            }
          ]
        },
        {
          id: 'biochem_chap_clinical_nutrition',
          name: 'CLINICAL BIOCHEMISTRY & NUTRITION',
          topics: [
            {
              id: 'biochem_t20_fat_soluble_vitamins',
              name: 'Fat soluble vitamins',
              rating: 4.5,
              mcqCount: 17,
              isPro: true,
              image: 'biochemistry',
              questions: [
                {
                  id: 'biochem_q17_1',
                  questionNumber: 1,
                  text: 'Vitamin K is an essential cofactor for the post-translational gamma-glutamyl carboxylation of glutamate residues on which clotting factors and anticoagulant proteins in the liver?',
                  options: [
                    { id: 'A', text: 'Factors II, VII, IX, X, Protein C, and Protein S' },
                    { id: 'B', text: 'Factors I, V, VIII, and XIII' },
                    { id: 'C', text: 'Factors XI, XII, and Prekallikrein' },
                    { id: 'D', text: 'Antithrombin III and Heparin Cofactor II' }
                  ],
                  correctOption: 'A',
                  explanation: 'Vitamin K-dependent gamma-glutamyl carboxylase converts glutamate residues to gamma-carboxyglutamate (Gla) domains on Factors II (prothrombin), VII, IX, X, Protein C, and Protein S, enabling calcium binding and platelet membrane attachment.',
                  keyConcept: 'Vitamin K-dependent factors: Factors II, VII, IX, X (clotting) + Protein C and Protein S (anticoagulants). Warfarin blocks Vitamin K epoxide reductase (VKOR).'
                }
              ]
            },
            {
              id: 'biochem_t21_energy_releasing_vitamins',
              name: 'Energy releasing vitamins',
              rating: 4.5,
              mcqCount: 20,
              isPro: true,
              image: 'biochemistry',
              questions: [
                {
                  id: 'biochem_q21_1',
                  questionNumber: 1,
                  text: 'A 48-year-old chronic alcoholic presents with ophthalmoplegia, ataxia, and global confusion (Wernicke encephalopathy triad). What enzyme activity in red blood cells is measured before and after adding Thiamine Pyrophosphate (TPP) to establish thiamine deficiency?',
                  options: [
                    { id: 'A', text: 'Erythrocyte Transketolase activation coefficient' },
                    { id: 'B', text: 'Erythrocyte Glutathione reductase' },
                    { id: 'C', text: 'Erythrocyte Pyruvate kinase' },
                    { id: 'D', text: 'Erythrocyte Superoxide dismutase' }
                  ],
                  correctOption: 'A',
                  explanation: 'Erythrocyte transketolase activity assay (with and without exogenous TPP) is the gold standard functional test for thiamine (Vitamin B1) deficiency. An increase in enzyme activity > 15-25% upon TPP addition confirms deficiency.',
                  keyConcept: 'Thiamine (Vitamin B1): Coenzyme for Pyruvate dehydrogenase, Alpha-ketoglutarate dehydrogenase, Transketolase, BCKDH. Diagnosed via Erythrocyte Transketolase assay.'
                }
              ]
            },
            {
              id: 'biochem_t22_hematopoietic_vitamins',
              name: 'Hematopoietic and other vitamins',
              rating: 4.5,
              mcqCount: 13,
              isPro: true,
              image: 'biochemistry',
              questions: [
                {
                  id: 'biochem_q22_1',
                  questionNumber: 1,
                  text: 'A 60-year-old strict vegan presents with megaloblastic anemia, glossitis, peripheral paresthesias, and loss of vibration/position sense (subacute combined degeneration). Which metabolite is elevated in Vitamin B12 deficiency but NORMAL in Folate deficiency?',
                  options: [
                    { id: 'A', text: 'Methylmalonic Acid (MMA)' },
                    { id: 'B', text: 'Homocysteine' },
                    { id: 'C', text: 'Formiminoglutamate (FIGLU)' },
                    { id: 'D', text: 'Orotic acid' }
                  ],
                  correctOption: 'A',
                  explanation: 'Vitamin B12 is required by Methylmalonyl-CoA mutase (converting methylmalonyl-CoA to succinyl-CoA) and Methionine synthase. In B12 deficiency, BOTH Methylmalonic acid and Homocysteine are elevated. In Folate deficiency, ONLY Homocysteine is elevated, while Methylmalonic acid remains normal.',
                  keyConcept: 'B12 vs Folate Deficiency: B12 = Elevated MMA + Elevated Homocysteine + Neurological deficits (SCD). Folate = Normal MMA + Elevated Homocysteine + NO neurological deficits.'
                }
              ]
            },
            {
              id: 'biochem_t23_antioxidants_minerals',
              name: 'Antioxidants & Minerals',
              rating: 4.4,
              mcqCount: 14,
              isPro: true,
              image: 'biochemistry',
              questions: [
                {
                  id: 'biochem_q23_1',
                  questionNumber: 1,
                  text: 'A 19-year-old male presents with tremors, dysarthria, choreiform movements, hepatic dysfunction, and golden-brown copper deposits in Descemet membrane of the cornea (Kayser-Fleischer rings). What gene mutation is responsible for Wilson Disease (Hepatolenticular degeneration)?',
                  options: [
                    { id: 'A', text: 'ATP7B gene (copper-transporting ATPase)' },
                    { id: 'B', text: 'ATP7A gene' },
                    { id: 'C', text: 'HFE gene' },
                    { id: 'D', text: 'SLC3A1 gene' }
                  ],
                  correctOption: 'A',
                  explanation: 'Wilson disease is an autosomal recessive mutation in the ATP7B gene encoding a copper-transporting P-type ATPase in hepatocytes. Copper cannot be incorporated into ceruloplasmin or excreted into bile, accumulating toxic free copper in liver, basal ganglia, and cornea (KF rings). Serum ceruloplasmin is decreased; 24-hr urinary copper is increased.',
                  keyConcept: 'Wilson Disease: ATP7B mutation -> impaired biliary copper excretion. KF rings, basal ganglia degeneration, low ceruloplasmin, high urine copper. Treatment: D-Penicillamine / Trientine.'
                }
              ]
            }
          ]
        },
        {
          id: 'biochem_chap_genetics',
          name: 'GENETICS',
          topics: [
            {
              id: 'biochem_t24_genetics_nucleotide_metabolism',
              name: 'Basics of genetics - Nucleotide metabolism and its disorders',
              rating: 4.5,
              mcqCount: 17,
              isPro: true,
              image: 'biochemistry',
              questions: [
                {
                  id: 'biochem_q24_1',
                  questionNumber: 1,
                  text: 'A 2-year-old boy presents with severe developmental delay, dystonia, choreoathetosis, orange \\"sand\\" / urate crystals in his diapers, and compulsive lip/finger biting (self-mutilation). What X-linked recessive enzyme deficiency is diagnostic of Lesch-Nyhan Syndrome?',
                  options: [
                    { id: 'A', text: 'Hypoxanthine-Guanine Phosphoribosyltransferase (HGPRT)' },
                    { id: 'B', text: 'Adenosine Deaminase (ADA)' },
                    { id: 'C', text: 'Xanthine Oxidase' },
                    { id: 'D', text: 'PRPP Synthetase' }
                  ],
                  correctOption: 'A',
                  explanation: 'Lesch-Nyhan syndrome is an X-linked recessive deficiency of HGPRT (Hypoxanthine-Guanine Phosphoribosyltransferase) in the purine salvage pathway. Inability to salvage hypoxanthine and guanine drives excessive de novo purine synthesis, causing extreme hyperuricemia, gout, nephrolithiasis, dystonia, and self-mutilation.',
                  keyConcept: 'Lesch-Nyhan Syndrome: HGPRT deficiency (X-linked). Hyperuricemia, gout, choreoathetosis, mental retardation, self-mutilation.'
                }
              ]
            },
            {
              id: 'biochem_t25_dna_replication_repair',
              name: 'DNA organization, replication and repair',
              rating: 4.5,
              mcqCount: 28,
              isPro: true,
              image: 'biochemistry',
              questions: [
                {
                  id: 'biochem_q25_1',
                  questionNumber: 1,
                  text: 'A 5-year-old child presents with extreme photosensitivity, severe sunburns with minimal sun exposure, freckling, dry skin (poikiloderma), and multiple squamous and basal cell carcinomas of the face. Defect in which DNA repair mechanism is responsible for Xeroderma Pigmentosum?',
                  options: [
                    { id: 'A', text: 'Nucleotide Excision Repair (NER) of UV-induced pyrimidine (thymine) dimers' },
                    { id: 'B', text: 'Base Excision Repair (BER)' },
                    { id: 'C', text: 'Mismatch Repair (MMR)' },
                    { id: 'D', text: 'Non-Homologous End Joining (NHEJ)' }
                  ],
                  correctOption: 'A',
                  explanation: 'Xeroderma Pigmentosum is caused by mutations in UV-specific endonucleases involved in Nucleotide Excision Repair (NER). Without NER, UV-induced cyclobutane pyrimidine (thymine-thymine) dimers cannot be excised, predisposing to extreme sun sensitivity and early skin malignancies.',
                  keyConcept: 'Xeroderma Pigmentosum = Nucleotide Excision Repair (NER) defect -> cannot repair UV-induced thymine dimers -> extreme photosensitivity & skin cancer.'
                }
              ]
            },
            {
              id: 'biochem_t26_rna_synthesis_processing',
              name: 'RNA synthesis, processing and modification',
              rating: 4.4,
              mcqCount: 22,
              isPro: true,
              image: 'biochemistry',
              questions: [
                {
                  id: 'biochem_q26_1',
                  questionNumber: 1,
                  text: 'Which eukaryotic RNA Polymerase is responsible for transcribing precursor messenger RNA (pre-mRNA), is located in the nucleoplasm, and is specifically inhibited by low concentrations of Alpha-Amanitin (death cap mushroom toxin)?',
                  options: [
                    { id: 'A', text: 'RNA Polymerase II' },
                    { id: 'B', text: 'RNA Polymerase I' },
                    { id: 'C', text: 'RNA Polymerase III' },
                    { id: 'D', text: 'Mitochondrial RNA Polymerase' }
                  ],
                  correctOption: 'A',
                  explanation: 'RNA Polymerase II transcribes all protein-coding pre-mRNA, snRNAs, and miRNAs. It is exquisitely sensitive to Alpha-amanitin from Amanita phalloides (causing acute liver failure). (RNA Pol I synthesizes 28S, 18S, 5.8S rRNA; RNA Pol III synthesizes 5S rRNA and tRNA).',
                  keyConcept: 'Eukaryotic RNA Polymerases: RNA Pol I = rRNA (most abundant); RNA Pol II = mRNA (inhibited by Alpha-amanitin); RNA Pol III = tRNA (smallest).'
                }
              ]
            },
            {
              id: 'biochem_t27_regulation_gene_expression',
              name: 'Regulation of gene expression',
              rating: 4.4,
              mcqCount: 12,
              isPro: true,
              image: 'biochemistry',
              questions: [
                {
                  id: 'biochem_q27_1',
                  questionNumber: 1,
                  text: 'In epigenetic regulation of eukaryotic gene expression, what post-translational modification of histone lysine residues by Histone Acetyltransferases (HATs) neutralizes positive charges, loosens chromatin from heterochromatin to euchromatin, and stimulates active transcription?',
                  options: [
                    { id: 'A', text: 'Histone Acetylation' },
                    { id: 'B', text: 'DNA Methylation at CpG islands' },
                    { id: 'C', text: 'Histone Deacetylation (HDAC)' },
                    { id: 'D', text: 'Histone Ubiquitination' }
                  ],
                  correctOption: 'A',
                  explanation: 'Histone Acetyltransferases (HATs) add acetyl groups to lysine residues on histone tails, neutralizing positive charges on histones and weakening their electrostatic interaction with negatively charged DNA. This opens chromatin into transcriptionally active euchromatin (\\"Acetylation = Activation\\").',
                  keyConcept: 'Histone Acetylation (HAT) = Active transcription / open euchromatin. DNA Methylation / Histone Deacetylation (HDAC) = Transcriptional silencing.'
                }
              ]
            },
            {
              id: 'biochem_t28_molecular_genetics_genomic_tech',
              name: 'Molecular genetics, recombinant DNA & genomic technology',
              rating: 4.4,
              mcqCount: 27,
              isPro: true,
              image: 'biochemistry',
              questions: [
                {
                  id: 'biochem_q28_1',
                  questionNumber: 1,
                  text: 'What are the three essential recurring thermal steps in a single cycle of the standard Polymerase Chain Reaction (PCR) in order of execution?',
                  options: [
                    { id: 'A', text: 'Denaturation (~95°C), Primer Annealing (~55°C), and Extension / Elongation (~72°C)' },
                    { id: 'B', text: 'Annealing (~95°C), Denaturation (~72°C), Extension (~55°C)' },
                    { id: 'C', text: 'Extension (~95°C), Annealing (~55°C), Denaturation (~72°C)' },
                    { id: 'D', text: 'Ligation (~37°C), Digestion (~55°C), Amplification (~95°C)' }
                  ],
                  correctOption: 'A',
                  explanation: 'Standard PCR consists of: 1) Denaturation (94-96°C) to separate double-stranded template DNA into single strands; 2) Annealing (50-65°C) allowing forward and reverse primers to bind complementary sequences; 3) Extension (72°C) where thermostable Taq DNA polymerase synthesizes nascent strands.',
                  keyConcept: 'PCR Steps: 1) Denaturation (95°C) -> 2) Annealing (55°C) -> 3) Extension (72°C) via Taq polymerase.'
                }
              ]
            }
          ]
        }
      ]
    }"""

def main():
    with open('js/core/qbank-data.js', 'r', encoding='utf-8') as f:
        content = f.read()

    alias_needle = 'CURATED_QBANKS.general_surgery = CURATED_QBANKS.surgery;'
    if alias_needle not in content:
        print('Could not find alias needle')
        return

    pos = content.find(alias_needle)
    brace_pos = content.rfind('  };', 0, pos)
    if brace_pos == -1:
        print('Could not find closing brace')
        return

    new_content = content[:brace_pos] + ',\n' + biochem_dataset_js + '\n' + content[brace_pos:]

    # Add biochemistry aliases
    alias_str = '  CURATED_QBANKS.biochem = CURATED_QBANKS.biochemistry;\n'
    new_pos = new_content.find(alias_needle)
    new_content = new_content[:new_pos] + alias_str + new_content[new_pos:]

    with open('js/core/qbank-data.js', 'w', encoding='utf-8') as f_out:
        f_out.write(new_content)

    print('Successfully inserted curated Biochemistry QBank with all 28 topics and 6 chapters!')

if __name__ == '__main__':
    main()
