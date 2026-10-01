/* ============================================================
   FlowMD Core — Q-Bank Tracker Data
   Static topic catalog: Subject -> Unit -> { s: serial, n: name, m: mcqs }
   Derived from docs/MARROW-QBANK-INDEX.md (official gapless index).
   Serials are permanent assigned IDs per subject. Progress lives in
   qb-tracker-store.js; this file is data-only.
   ============================================================ */
(function () {
  'use strict';
  window.FlowMD.qbTrackerData = {
 "subjects": [
  {
   "name": "Anatomy",
   "id": "anatomy",
   "units": [
    {
     "name": "EMBRYOLOGY",
     "topics": [
      {
       "s": 1,
       "n": "Gametogenesis",
       "m": 19
      },
      {
       "s": 2,
       "n": "Pre-Embryonic Phase of Development",
       "m": 13
      },
      {
       "s": 3,
       "n": "Embryonic Phase of Development",
       "m": 16
      },
      {
       "s": 4,
       "n": "Placenta, Fetal Membranes and Twinning",
       "m": 14
      },
      {
       "s": 5,
       "n": "Pharyngeal arches, Skeletal & Muscular Systems",
       "m": 24
      },
      {
       "s": 6,
       "n": "Cardiovascular and Respiratory Systems",
       "m": 25
      },
      {
       "s": 7,
       "n": "Alimentary, Hepatobiliary systems, Pancreas and Spleen",
       "m": 21
      },
      {
       "s": 8,
       "n": "Face, Nose & Palate, Eye, Ear",
       "m": 14
      },
      {
       "s": 9,
       "n": "Nervous System and Endocrine Glands",
       "m": 18
      },
      {
       "s": 10,
       "n": "Urogenital System",
       "m": 19
      }
     ]
    },
    {
     "name": "HISTOLOGY",
     "topics": [
      {
       "s": 11,
       "n": "Cell Structure, Epithelia, Glands & Connective Tissue",
       "m": 26
      },
      {
       "s": 12,
       "n": "Bone, Cartilage & Muscular Tissue",
       "m": 15
      },
      {
       "s": 13,
       "n": "Nervous and Endocrine Systems",
       "m": 13
      },
      {
       "s": 14,
       "n": "Cardiovascular, Lymphatic and Respiratory Systems",
       "m": 11
      },
      {
       "s": 15,
       "n": "Digestive, Hepatobiliary & Genitourinary Systems",
       "m": 22
      },
      {
       "s": 16,
       "n": "Skin & Special Senses, Eye and Ear",
       "m": 17
      }
     ]
    },
    {
     "name": "ABDOMEN AND PELVIS",
     "topics": [
      {
       "s": 17,
       "n": "Anterior Abdominal Wall",
       "m": 12
      },
      {
       "s": 18,
       "n": "Abdominal cavity and Peritoneum",
       "m": 11
      },
      {
       "s": 19,
       "n": "GI Tract",
       "m": 17
      },
      {
       "s": 20,
       "n": "Hepatobiliary system, Spleen & Pancreas",
       "m": 23
      },
      {
       "s": 21,
       "n": "KUB & Adrenal Gland",
       "m": 25
      },
      {
       "s": 22,
       "n": "Internal and external genitalia",
       "m": 22
      },
      {
       "s": 23,
       "n": "Pelvis & Perineum",
       "m": 20
      }
     ]
    },
    {
     "name": "GENERAL ANATOMY",
     "topics": [
      {
       "s": 24,
       "n": "Bones, Joints and Cartilage",
       "m": 30
      },
      {
       "s": 25,
       "n": "Muscles and Tendons",
       "m": 16
      },
      {
       "s": 26,
       "n": "Cardiovascular, Lymphatic and Nervous Systems",
       "m": 20
      },
      {
       "s": 27,
       "n": "Skin, Connective Tissue and Ligaments",
       "m": 13
      }
     ]
    },
    {
     "name": "HEAD, NECK AND FACE",
     "topics": [
      {
       "s": 28,
       "n": "Osteology, Scalp and Face",
       "m": 27
      },
      {
       "s": 29,
       "n": "Deep fascia and Triangles of the neck",
       "m": 15
      },
      {
       "s": 30,
       "n": "Muscles, Neurovascular Anatomy of Head & Neck",
       "m": 24
      },
      {
       "s": 31,
       "n": "Glands of the Head and Neck",
       "m": 24
      },
      {
       "s": 32,
       "n": "Tongue and Palate",
       "m": 12
      },
      {
       "s": 33,
       "n": "Pharynx",
       "m": 9
      },
      {
       "s": 34,
       "n": "Larynx",
       "m": 17
      }
     ]
    },
    {
     "name": "NEUROANATOMY",
     "topics": [
      {
       "s": 35,
       "n": "Cranial Nerves",
       "m": 21
      },
      {
       "s": 36,
       "n": "Meninges and dural venous sinuses",
       "m": 11
      },
      {
       "s": 37,
       "n": "Ventricular System and Subarachnoid Space",
       "m": 17
      },
      {
       "s": 38,
       "n": "Cerebrum",
       "m": 7
      },
      {
       "s": 39,
       "n": "White Matter of the Brain",
       "m": 16
      },
      {
       "s": 40,
       "n": "Basal Ganglia and Limbic System",
       "m": 6
      },
      {
       "s": 41,
       "n": "Diencephalon",
       "m": 12
      },
      {
       "s": 42,
       "n": "Brainstem",
       "m": 14
      },
      {
       "s": 43,
       "n": "Cerebellum",
       "m": 14
      },
      {
       "s": 44,
       "n": "Vascular supply of Brain",
       "m": 20
      },
      {
       "s": 45,
       "n": "Spinal Cord",
       "m": 15
      }
     ]
    },
    {
     "name": "UPPER LIMB",
     "topics": [
      {
       "s": 46,
       "n": "Upper Limb Bones and Joints",
       "m": 22
      },
      {
       "s": 47,
       "n": "Fossae and Spaces of the Upper Limb",
       "m": 15
      },
      {
       "s": 48,
       "n": "Breast",
       "m": 7
      },
      {
       "s": 49,
       "n": "Brachial Plexus and Nerves",
       "m": 31
      },
      {
       "s": 50,
       "n": "Muscles - Upper Limb",
       "m": 23
      },
      {
       "s": 51,
       "n": "Vessels-Upper limb",
       "m": 16
      }
     ]
    },
    {
     "name": "LOWER LIMB",
     "topics": [
      {
       "s": 52,
       "n": "Bones of the Lower Limb",
       "m": 15
      },
      {
       "s": 53,
       "n": "Joints of the Lower Limb",
       "m": 18
      },
      {
       "s": 54,
       "n": "Muscles of the Lower Limb",
       "m": 23
      },
      {
       "s": 55,
       "n": "Nerves & Vessels of Lower Limb",
       "m": 21
      },
      {
       "s": 56,
       "n": "Important Structures of Lower Limb",
       "m": 19
      }
     ]
    },
    {
     "name": "THORAX",
     "topics": [
      {
       "s": 57,
       "n": "General Anatomy of Thorax",
       "m": 15
      },
      {
       "s": 58,
       "n": "Thoracic Wall",
       "m": 21
      },
      {
       "s": 59,
       "n": "Mediastinum",
       "m": 13
      },
      {
       "s": 60,
       "n": "Diaphragm",
       "m": 9
      },
      {
       "s": 61,
       "n": "Heart",
       "m": 33
      },
      {
       "s": 62,
       "n": "Lungs and Pleura",
       "m": 23
      }
     ]
    },
    {
     "name": "BACK",
     "topics": [
      {
       "s": 63,
       "n": "Vertebral Column",
       "m": 14
      }
     ]
    }
   ]
  },
  {
   "name": "Physiology",
   "id": "physiology",
   "units": [
    {
     "name": "GENERAL PHYSIOLOGY",
     "topics": [
      {
       "s": 1,
       "n": "Homeostasis and cellular physiology",
       "m": 21
      },
      {
       "s": 2,
       "n": "Cellular messengers & Receptors",
       "m": 21
      },
      {
       "s": 3,
       "n": "Transport Across Cell Membrane",
       "m": 24
      },
      {
       "s": 4,
       "n": "Membrane Potentials",
       "m": 14
      },
      {
       "s": 5,
       "n": "Body Fluids",
       "m": 28
      }
     ]
    },
    {
     "name": "NERVE MUSCLE PHYSIOLOGY",
     "topics": [
      {
       "s": 6,
       "n": "Physiology of Nerve",
       "m": 34
      },
      {
       "s": 7,
       "n": "Muscle Physiology I",
       "m": 35
      },
      {
       "s": 8,
       "n": "Muscle Physiology II",
       "m": 14
      },
      {
       "s": 9,
       "n": "Synapse and Junctional Transmission",
       "m": 27
      }
     ]
    },
    {
     "name": "CENTRAL NERVOUS SYSTEM",
     "topics": [
      {
       "s": 10,
       "n": "Neurotransmitters",
       "m": 17
      },
      {
       "s": 11,
       "n": "Sensory Receptors",
       "m": 21
      },
      {
       "s": 12,
       "n": "Somatosensory Pathways",
       "m": 22
      },
      {
       "s": 13,
       "n": "Special Senses",
       "m": 21
      },
      {
       "s": 14,
       "n": "Motor Physiology - 1",
       "m": 38
      },
      {
       "s": 15,
       "n": "Motor Physiology - 2",
       "m": 20
      },
      {
       "s": 16,
       "n": "Basal Ganglia and Cerebellum",
       "m": 20
      },
      {
       "s": 17,
       "n": "Hypothalamus and Limbic System",
       "m": 13
      },
      {
       "s": 18,
       "n": "Higher Mental Functions",
       "m": 29
      }
     ]
    },
    {
     "name": "THE RESPIRATORY SYSTEM",
     "topics": [
      {
       "s": 19,
       "n": "Functional Anatomy",
       "m": 13
      },
      {
       "s": 20,
       "n": "Lung Mechanics",
       "m": 18
      },
      {
       "s": 21,
       "n": "Alveolar Gas Exchange",
       "m": 15
      },
      {
       "s": 22,
       "n": "Gas Transport in Blood",
       "m": 20
      },
      {
       "s": 23,
       "n": "Lung Volumes and Lung Function Tests",
       "m": 18
      },
      {
       "s": 24,
       "n": "Respiratory Adaptations in Hypoxia, Anemia and with Pressure Changes",
       "m": 14
      },
      {
       "s": 25,
       "n": "Regulation of Respiration",
       "m": 30
      }
     ]
    },
    {
     "name": "THE CARDIOVASCULAR SYSTEM",
     "topics": [
      {
       "s": 26,
       "n": "Vascular System and Regional Circulation I",
       "m": 18
      },
      {
       "s": 27,
       "n": "Vascular System and Regional Circulation II",
       "m": 21
      },
      {
       "s": 28,
       "n": "Cardiac Cycle and Cardiac Output",
       "m": 27
      },
      {
       "s": 29,
       "n": "Electrophysiology of the Heart",
       "m": 22
      },
      {
       "s": 30,
       "n": "Blood Pressure and Regulation",
       "m": 29
      }
     ]
    },
    {
     "name": "THE GASTROINTESTINAL TRACT",
     "topics": [
      {
       "s": 31,
       "n": "Gastrointestinal Secretion and Gastrointestinal Hormones",
       "m": 30
      },
      {
       "s": 32,
       "n": "Digestion & Absorption",
       "m": 32
      },
      {
       "s": 33,
       "n": "GI Peristalsis and Motility",
       "m": 25
      }
     ]
    },
    {
     "name": "RENAL PHYSIOLOGY",
     "topics": [
      {
       "s": 34,
       "n": "Glomerular Filtration Rate, Renal Blood Flow, and Renal Clearance",
       "m": 35
      },
      {
       "s": 35,
       "n": "Renal Tubular Functions, Urine Concentration and Dilution",
       "m": 32
      },
      {
       "s": 36,
       "n": "Acid-Base Balance, Renal Hormones and Micturition Reflex",
       "m": 25
      }
     ]
    },
    {
     "name": "ENDOCRINE PHYSIOLOGY",
     "topics": [
      {
       "s": 37,
       "n": "Pituitary and Thyroid",
       "m": 24
      },
      {
       "s": 38,
       "n": "The Pancreas",
       "m": 25
      },
      {
       "s": 39,
       "n": "The Adrenals",
       "m": 21
      },
      {
       "s": 40,
       "n": "Calcium Homeostasis",
       "m": 25
      }
     ]
    },
    {
     "name": "REPRODUCTIVE PHYSIOLOGY",
     "topics": [
      {
       "s": 41,
       "n": "Male Reproductive Physiology",
       "m": 28
      },
      {
       "s": 42,
       "n": "Female Reproductive Physiology",
       "m": 30
      }
     ]
    },
    {
     "name": "EXERCISE PHYSIOLOGY",
     "topics": [
      {
       "s": 43,
       "n": "Exercise Physiology",
       "m": 16
      }
     ]
    }
   ]
  },
  {
   "name": "Biochemistry",
   "id": "biochemistry",
   "units": [
    {
     "name": "CARBOHYDRATES",
     "topics": [
      {
       "s": 1,
       "n": "Chemistry of Carbohydrates, Amino sugars and Mucopolysaccharides",
       "m": 22
      },
      {
       "s": 2,
       "n": "Glycolysis and gluconeogenesis",
       "m": 30
      },
      {
       "s": 3,
       "n": "Glycogen metabolism and glycogen storage disorders",
       "m": 20
      },
      {
       "s": 4,
       "n": "HMP shunt pathway, Fructose , Galactose metabolism",
       "m": 11
      },
      {
       "s": 5,
       "n": "ETC and bioenergetics",
       "m": 18
      },
      {
       "s": 6,
       "n": "Krebs Cycle",
       "m": 20
      }
     ]
    },
    {
     "name": "AMINO ACIDS AND PROTEINS",
     "topics": [
      {
       "s": 7,
       "n": "Amino acids: Basics",
       "m": 27
      },
      {
       "s": 8,
       "n": "Amino acid: Metabolism",
       "m": 23
      },
      {
       "s": 9,
       "n": "Amino acid: Metabolic disorder",
       "m": 28
      },
      {
       "s": 10,
       "n": "Protein structure and function",
       "m": 33
      },
      {
       "s": 11,
       "n": "Urea cycle and its disorders",
       "m": 14
      }
     ]
    },
    {
     "name": "LIPIDS",
     "topics": [
      {
       "s": 12,
       "n": "Lipids: Basics",
       "m": 14
      },
      {
       "s": 13,
       "n": "Fatty acid oxidation and ketogenesis",
       "m": 20
      },
      {
       "s": 14,
       "n": "Biosynthesis of fatty acids and Eicosanoids",
       "m": 23
      },
      {
       "s": 15,
       "n": "Metabolism of Acylglycerols and Sphingolipids",
       "m": 24
      },
      {
       "s": 16,
       "n": "Cholesterol Synthesis, Transport and Excretion",
       "m": 21
      }
     ]
    },
    {
     "name": "ENZYMES AND PORPHYRINS",
     "topics": [
      {
       "s": 17,
       "n": "Porphyrins and bile pigments",
       "m": 24
      },
      {
       "s": 18,
       "n": "Enzymes - Mechanism of Action & Clinical Importance",
       "m": 19
      },
      {
       "s": 19,
       "n": "Enzyme Kinetics and Regulation of Activity",
       "m": 20
      }
     ]
    },
    {
     "name": "CLINICAL BIOCHEMISTRY & NUTRITION",
     "topics": [
      {
       "s": 20,
       "n": "Fat soluble vitamins",
       "m": 17
      },
      {
       "s": 21,
       "n": "Energy releasing vitamins",
       "m": 20
      },
      {
       "s": 22,
       "n": "Hematopoietic and other vitamins",
       "m": 13
      },
      {
       "s": 23,
       "n": "Antioxidants & Minerals",
       "m": 14
      }
     ]
    },
    {
     "name": "GENETICS",
     "topics": [
      {
       "s": 24,
       "n": "Basics of genetics - Nucleotide metabolism and its disorders",
       "m": 17
      },
      {
       "s": 25,
       "n": "DNA organization, replication and repair",
       "m": 28
      },
      {
       "s": 26,
       "n": "RNA synthesis, processing and modification",
       "m": 22
      },
      {
       "s": 27,
       "n": "Regulation of gene expression",
       "m": 12
      },
      {
       "s": 28,
       "n": "Molecular genetics, recombinant DNA & genomic technology",
       "m": 27
      }
     ]
    }
   ]
  },
  {
   "name": "Pharmacology",
   "id": "pharmacology",
   "units": [
    {
     "name": "GENERAL PHARMACOLOGY",
     "topics": [
      {
       "s": 1,
       "n": "Pharmacokinetics",
       "m": 25
      },
      {
       "s": 2,
       "n": "Pharmacodynamics",
       "m": 28
      },
      {
       "s": 3,
       "n": "Clinical Trials and Miscellaneous",
       "m": 22
      },
      {
       "s": 4,
       "n": "Pharmacokinetics - Calculations",
       "m": 12
      }
     ]
    },
    {
     "name": "AUTONOMIC NERVOUS SYSTEM",
     "topics": [
      {
       "s": 5,
       "n": "ANS Introduction & Parasympathomimetics",
       "m": 17
      },
      {
       "s": 6,
       "n": "Sympathomimetics",
       "m": 26
      },
      {
       "s": 7,
       "n": "Parasympatholytics",
       "m": 24
      },
      {
       "s": 8,
       "n": "Sympatholytics",
       "m": 23
      },
      {
       "s": 9,
       "n": "Drugs for Glaucoma",
       "m": 22
      }
     ]
    },
    {
     "name": "CARDIOVASCULAR SYSTEM",
     "topics": [
      {
       "s": 10,
       "n": "Anti-Anginal Drugs",
       "m": 20
      },
      {
       "s": 11,
       "n": "Heart Failure Drugs",
       "m": 21
      },
      {
       "s": 12,
       "n": "Antihypertensive Drugs",
       "m": 26
      },
      {
       "s": 13,
       "n": "Diuretics",
       "m": 23
      },
      {
       "s": 14,
       "n": "Anti-Arrythmic Drugs",
       "m": 23
      },
      {
       "s": 15,
       "n": "Hypolipidemic Drugs",
       "m": 11
      },
      {
       "s": 16,
       "n": "Renin-Angiotensin-Aldosterone System",
       "m": 11
      },
      {
       "s": 17,
       "n": "Anti-diuretics",
       "m": 9
      }
     ]
    },
    {
     "name": "CENTRAL AND PERIPHERAL NERVOUS SYSTEM",
     "topics": [
      {
       "s": 18,
       "n": "Sedatives and Hypnotics",
       "m": 14
      },
      {
       "s": 19,
       "n": "Anti-epileptics I",
       "m": 27
      },
      {
       "s": 20,
       "n": "Anti-epileptics II",
       "m": 25
      },
      {
       "s": 21,
       "n": "Anti-psychotics",
       "m": 21
      },
      {
       "s": 22,
       "n": "Anti-manic Drugs",
       "m": 14
      },
      {
       "s": 23,
       "n": "Drugs for Parkinson's Disease",
       "m": 16
      },
      {
       "s": 24,
       "n": "Antidepressant and Antianxiety Drugs",
       "m": 26
      },
      {
       "s": 25,
       "n": "Opioids - Functions and Classification",
       "m": 20
      },
      {
       "s": 26,
       "n": "Synthetic Opioids",
       "m": 25
      },
      {
       "s": 27,
       "n": "Opioid Antagonists",
       "m": 13
      },
      {
       "s": 28,
       "n": "Alcohols",
       "m": 11
      },
      {
       "s": 29,
       "n": "Drugs for Alzheimer's Disease and Other Neurodegenerative Disorders",
       "m": 11
      }
     ]
    },
    {
     "name": "ANTIMICROBIALS",
     "topics": [
      {
       "s": 30,
       "n": "General Principles of Antimicrobial Therapy",
       "m": 12
      },
      {
       "s": 31,
       "n": "Antimalarial Drugs",
       "m": 17
      },
      {
       "s": 32,
       "n": "Sulfonamides , Quinolones and Urinary antiseptics",
       "m": 23
      },
      {
       "s": 33,
       "n": "Antimicrobials Acting on 30s Subunit",
       "m": 23
      },
      {
       "s": 34,
       "n": "Antimicrobials Acting on 50s Subunit",
       "m": 15
      },
      {
       "s": 35,
       "n": "Antiretroviral Drugs",
       "m": 26
      },
      {
       "s": 36,
       "n": "Penicillins",
       "m": 19
      },
      {
       "s": 37,
       "n": "Cephalosporins, Vancomycin and Carbapenems",
       "m": 18
      },
      {
       "s": 38,
       "n": "Miscellaneous Antimicrobials",
       "m": 11
      },
      {
       "s": 39,
       "n": "Anti-Protozoal agents and Anthelminthic drugs",
       "m": 24
      },
      {
       "s": 40,
       "n": "Antifungal Agents",
       "m": 25
      },
      {
       "s": 41,
       "n": "First Line Drugs for Tuberculosis",
       "m": 21
      },
      {
       "s": 42,
       "n": "Second Line Drugs for Tuberculosis",
       "m": 10
      },
      {
       "s": 43,
       "n": "Anti-leprosy drugs",
       "m": 11
      },
      {
       "s": 44,
       "n": "Anti-virals (Non-retroviral)",
       "m": 17
      }
     ]
    },
    {
     "name": "ENDOCRINE SYSTEM",
     "topics": [
      {
       "s": 45,
       "n": "Hypothalamus and Pituitary",
       "m": 11
      },
      {
       "s": 46,
       "n": "Thyroid and Antithyroid Agents",
       "m": 12
      },
      {
       "s": 47,
       "n": "Corticosteroids",
       "m": 21
      },
      {
       "s": 48,
       "n": "Osteoporosis and Calcium Metabolism",
       "m": 16
      },
      {
       "s": 49,
       "n": "Anti-Diabetic Drugs - Oral",
       "m": 18
      },
      {
       "s": 50,
       "n": "Anti-Diabetic Drugs - Injectable",
       "m": 19
      },
      {
       "s": 51,
       "n": "OCPs, Estrogens and Progestins",
       "m": 25
      },
      {
       "s": 52,
       "n": "Androgens and Drugs for Erectile Dysfunction",
       "m": 9
      },
      {
       "s": 53,
       "n": "Drugs Acting on Uterus",
       "m": 10
      }
     ]
    },
    {
     "name": "AUTACOIDS",
     "topics": [
      {
       "s": 54,
       "n": "NSAIDs",
       "m": 17
      },
      {
       "s": 55,
       "n": "Antimigraine and Antigout drugs",
       "m": 16
      },
      {
       "s": 56,
       "n": "Anti-rheumatoid drugs",
       "m": 10
      },
      {
       "s": 57,
       "n": "Anti-histamines",
       "m": 11
      }
     ]
    },
    {
     "name": "HEMATOLOGY",
     "topics": [
      {
       "s": 58,
       "n": "Antiplatelets, Fibrinolytics and Antifibrinolytics",
       "m": 16
      },
      {
       "s": 59,
       "n": "Hematinics",
       "m": 13
      },
      {
       "s": 60,
       "n": "Anticoagulants",
       "m": 32
      }
     ]
    },
    {
     "name": "RESPIRATORY SYSTEM",
     "topics": [
      {
       "s": 61,
       "n": "Respiratory System",
       "m": 30
      }
     ]
    },
    {
     "name": "GASTROINTESTINAL DRUGS",
     "topics": [
      {
       "s": 62,
       "n": "Acid Peptic Disorders and Inflammatory Bowel Disease",
       "m": 21
      },
      {
       "s": 63,
       "n": "Anti-emetics and Drugs Affecting Gastrointestinal Motility",
       "m": 26
      }
     ]
    },
    {
     "name": "ANTI-NEOPLASTIC AGENTS",
     "topics": [
      {
       "s": 64,
       "n": "Cell Cycle Specific Cytotoxic Drugs",
       "m": 27
      },
      {
       "s": 65,
       "n": "Non Cell Cycle Specific Cytotoxic Drugs",
       "m": 25
      },
      {
       "s": 66,
       "n": "Monoclonal Antibodies",
       "m": 23
      },
      {
       "s": 67,
       "n": "Interleukins, Growth Factors and Targeted Therapies",
       "m": 29
      }
     ]
    }
   ]
  },
  {
   "name": "Pathology",
   "id": "pathology",
   "units": [
    {
     "name": "GENERAL PATHOLOGY",
     "topics": [
      {
       "s": 1,
       "n": "Cellular Genetics, Adaptations and Injury",
       "m": 22
      },
      {
       "s": 2,
       "n": "Cell Death",
       "m": 24
      },
      {
       "s": 3,
       "n": "Intracellular Accumulations, Pathological Calcification and Cellular Ageing",
       "m": 15
      },
      {
       "s": 4,
       "n": "Acute Inflammation",
       "m": 24
      },
      {
       "s": 5,
       "n": "Inflammatory Mediators and Granulomatous Inflammation",
       "m": 23
      },
      {
       "s": 6,
       "n": "Tissue Repair",
       "m": 11
      },
      {
       "s": 7,
       "n": "Disorders of Hemodynamics and Hemostasis",
       "m": 20
      },
      {
       "s": 8,
       "n": "Modes of Inheritance",
       "m": 22
      },
      {
       "s": 9,
       "n": "Lysosomal and Glycogen Storage Diseases",
       "m": 16
      },
      {
       "s": 10,
       "n": "Chromosomal Disorders and Other Genetic Disorders",
       "m": 21
      },
      {
       "s": 11,
       "n": "Characteristics of Neoplasms and Epidemiology",
       "m": 18
      },
      {
       "s": 12,
       "n": "Molecular Basis of Cancer and Tumor Immunity",
       "m": 19
      },
      {
       "s": 13,
       "n": "Carcinogenesis, Paraneoplastic Syndromes and Tumor Markers",
       "m": 28
      },
      {
       "s": 14,
       "n": "Components of Immune System",
       "m": 20
      },
      {
       "s": 15,
       "n": "Hypersensitivity and Autoimmunity",
       "m": 14
      },
      {
       "s": 16,
       "n": "Immunodeficiency Syndromes",
       "m": 22
      },
      {
       "s": 17,
       "n": "Amyloidosis and Graft Rejection",
       "m": 19
      }
     ]
    },
    {
     "name": "HEMATOLOGY",
     "topics": [
      {
       "s": 18,
       "n": "Microcytic Anemia",
       "m": 16
      },
      {
       "s": 19,
       "n": "Normocytic And Macrocytic Anemia",
       "m": 19
      },
      {
       "s": 20,
       "n": "Basics of Hemolysis and Intravascular Hemolysis",
       "m": 14
      },
      {
       "s": 21,
       "n": "Extravascular Hemolysis",
       "m": 28
      },
      {
       "s": 22,
       "n": "G6PD deficiency and Autoimmune Hemolytic Anemias",
       "m": 11
      },
      {
       "s": 23,
       "n": "Platelet Disorders",
       "m": 24
      },
      {
       "s": 24,
       "n": "Coagulation Pathway Disorders",
       "m": 16
      },
      {
       "s": 25,
       "n": "Blood Products and Transfusion Reactions",
       "m": 13
      },
      {
       "s": 26,
       "n": "Acute Lymphocytic Leukemia (ALL)",
       "m": 16
      },
      {
       "s": 27,
       "n": "Acute Myeloid Leukemia (AML)",
       "m": 21
      },
      {
       "s": 28,
       "n": "Hodgkin's Lymphoma",
       "m": 22
      },
      {
       "s": 29,
       "n": "Non Hodgkin Lymphomas: General Considerations",
       "m": 8
      },
      {
       "s": 30,
       "n": "Non Hodgkin Lymphomas: Low Grade",
       "m": 27
      },
      {
       "s": 31,
       "n": "Non Hodgkin Lymphomas: High Grade",
       "m": 16
      },
      {
       "s": 32,
       "n": "Multiple Myeloma and Plasma Cell Disorders",
       "m": 32
      },
      {
       "s": 33,
       "n": "Myelodysplastic Syndrome, Myeloproliferative Syndromes and Histiocytosis",
       "m": 29
      },
      {
       "s": 34,
       "n": "Leukopenia, Leukocytosis and Lymphadenitis",
       "m": 17
      }
     ]
    },
    {
     "name": "CARDIOVASCULAR SYSTEM",
     "topics": [
      {
       "s": 35,
       "n": "Hypertensive Vascular Disease and Atherosclerosis",
       "m": 20
      },
      {
       "s": 36,
       "n": "Aneurysm and Dissection",
       "m": 11
      },
      {
       "s": 37,
       "n": "Vasculitis",
       "m": 19
      },
      {
       "s": 38,
       "n": "Vascular Tumors",
       "m": 14
      },
      {
       "s": 39,
       "n": "Heart Failure and Ischemic Disease",
       "m": 25
      },
      {
       "s": 40,
       "n": "Myocardial and Pericardial Diseases and Cardiac Tumors",
       "m": 22
      },
      {
       "s": 41,
       "n": "Congenital and Valvular Heart Disease",
       "m": 11
      },
      {
       "s": 42,
       "n": "Rheumatic Fever and Endocarditis",
       "m": 15
      }
     ]
    },
    {
     "name": "GENITOURINARY SYSTEM",
     "topics": [
      {
       "s": 43,
       "n": "Glomerular Diseases",
       "m": 24
      },
      {
       "s": 44,
       "n": "Tubulointerstitial, Vascular and Cystic Diseases",
       "m": 20
      },
      {
       "s": 45,
       "n": "Renal Tumors",
       "m": 23
      },
      {
       "s": 46,
       "n": "Lower Urinary Tract",
       "m": 11
      },
      {
       "s": 47,
       "n": "Female Genital Tract",
       "m": 22
      },
      {
       "s": 48,
       "n": "Male Genital Tract",
       "m": 28
      }
     ]
    },
    {
     "name": "GASTROINTESTINAL SYSTEM",
     "topics": [
      {
       "s": 49,
       "n": "Alcoholic and Infectious Liver Disease",
       "m": 31
      },
      {
       "s": 50,
       "n": "Autoimmune and Metabolic Liver Disease",
       "m": 20
      },
      {
       "s": 51,
       "n": "Neoplasms of Liver and Biliary tract",
       "m": 16
      },
      {
       "s": 52,
       "n": "Gall Bladder and Pancreas",
       "m": 9
      },
      {
       "s": 53,
       "n": "Esophagus",
       "m": 21
      },
      {
       "s": 54,
       "n": "Stomach",
       "m": 27
      },
      {
       "s": 55,
       "n": "Small Intestine",
       "m": 12
      },
      {
       "s": 56,
       "n": "Large Intestine - Non-Neoplastic Conditions",
       "m": 14
      },
      {
       "s": 57,
       "n": "Large Intestine - Neoplastic Conditions",
       "m": 13
      }
     ]
    },
    {
     "name": "RESPIRATORY SYSTEM",
     "topics": [
      {
       "s": 58,
       "n": "Congenital anomalies, ARDS, Infections",
       "m": 21
      },
      {
       "s": 59,
       "n": "Obstructive and Restrictive lung diseases",
       "m": 20
      },
      {
       "s": 60,
       "n": "Lung tumors",
       "m": 12
      }
     ]
    },
    {
     "name": "ENDOCRINE SYSTEM AND BREAST",
     "topics": [
      {
       "s": 61,
       "n": "Pituitary ,Parathyroids and Pancreas",
       "m": 14
      },
      {
       "s": 62,
       "n": "Thyroid Glands",
       "m": 21
      },
      {
       "s": 63,
       "n": "The Adrenals",
       "m": 16
      },
      {
       "s": 64,
       "n": "The Breast",
       "m": 30
      }
     ]
    },
    {
     "name": "SKIN, MSK & NERVOUS SYSTEM",
     "topics": [
      {
       "s": 65,
       "n": "Developmental disorders,infections and tumors of bone",
       "m": 24
      },
      {
       "s": 66,
       "n": "Joints and soft tissue pathology",
       "m": 15
      },
      {
       "s": 67,
       "n": "Skin pathology",
       "m": 23
      },
      {
       "s": 68,
       "n": "Infective & Vascular CNS pathology",
       "m": 18
      },
      {
       "s": 69,
       "n": "Degenerative, Toxic & Metabolic CNS disorders",
       "m": 17
      },
      {
       "s": 70,
       "n": "CNS Tumours",
       "m": 20
      },
      {
       "s": 71,
       "n": "Peripheral nerves & Neuromuscular pathology",
       "m": 16
      }
     ]
    }
   ]
  },
  {
   "name": "Microbiology",
   "id": "microbiology",
   "units": [
    {
     "name": "GENERAL MICROBIOLOGY",
     "topics": [
      {
       "s": 1,
       "n": "General Microbiology",
       "m": 23
      }
     ]
    },
    {
     "name": "BACTERIOLOGY",
     "topics": [
      {
       "s": 2,
       "n": "Streptococci and Enterococci",
       "m": 20
      },
      {
       "s": 3,
       "n": "Staphylococci",
       "m": 15
      },
      {
       "s": 4,
       "n": "Corynebacterium, Listeria and Actinomyces",
       "m": 20
      },
      {
       "s": 5,
       "n": "Clostridium and Bacillus",
       "m": 21
      },
      {
       "s": 6,
       "n": "Mycobacteria Tuberculosis",
       "m": 13
      },
      {
       "s": 7,
       "n": "Other Mycobacteria",
       "m": 11
      },
      {
       "s": 8,
       "n": "Escherichia, Proteus and Klebsiella",
       "m": 16
      },
      {
       "s": 9,
       "n": "Shigella and Salmonella",
       "m": 14
      },
      {
       "s": 10,
       "n": "Vibrio and Campylobacterales",
       "m": 23
      },
      {
       "s": 11,
       "n": "Pseudomonas and Burkholderiales",
       "m": 15
      },
      {
       "s": 12,
       "n": "Haemophilus",
       "m": 12
      },
      {
       "s": 13,
       "n": "Miscellaneous Bacteria - Yersinia, Brucella, Bartonella, Legionella",
       "m": 22
      },
      {
       "s": 14,
       "n": "Gram Negative Cocci",
       "m": 17
      },
      {
       "s": 15,
       "n": "Rickettsia, Chlamydia and Mycoplasma",
       "m": 22
      },
      {
       "s": 16,
       "n": "Spirochetes",
       "m": 20
      }
     ]
    },
    {
     "name": "VIROLOGY",
     "topics": [
      {
       "s": 17,
       "n": "General Properties of Viruses",
       "m": 15
      },
      {
       "s": 18,
       "n": "DNA Viruses",
       "m": 24
      },
      {
       "s": 19,
       "n": "Hepatitis",
       "m": 23
      },
      {
       "s": 20,
       "n": "HIV",
       "m": 11
      },
      {
       "s": 21,
       "n": "Myxoviruses and Rhabdoviruses",
       "m": 17
      },
      {
       "s": 22,
       "n": "Arboviruses and Picorna Viruses",
       "m": 19
      },
      {
       "s": 23,
       "n": "Miscellaneous Viruses - Rubella, Coronaviruses, Prions, Rotavirus, Filovirus, Zika Virus and Nipah Virus",
       "m": 16
      }
     ]
    },
    {
     "name": "MYCOLOGY",
     "topics": [
      {
       "s": 24,
       "n": "Superficial and Systemic Mycoses",
       "m": 20
      },
      {
       "s": 25,
       "n": "Opportunistic Mycoses",
       "m": 13
      }
     ]
    },
    {
     "name": "PARASITOLOGY",
     "topics": [
      {
       "s": 26,
       "n": "General Parasitology",
       "m": 15
      },
      {
       "s": 27,
       "n": "Protozoology - Amoebae, Ciliates & Flagellates",
       "m": 22
      },
      {
       "s": 28,
       "n": "Protozoology - Sporozoa",
       "m": 15
      },
      {
       "s": 29,
       "n": "Helminthology - Cestodes & Trematodes",
       "m": 17
      },
      {
       "s": 30,
       "n": "Helminthology - Nematodes",
       "m": 22
      }
     ]
    },
    {
     "name": "APPLIED MICROBIOLOGY",
     "topics": [
      {
       "s": 31,
       "n": "Applied Microbiology",
       "m": 15
      }
     ]
    },
    {
     "name": "IMMUNOLOGY",
     "topics": [
      {
       "s": 32,
       "n": "Components of Immune system",
       "m": 22
      },
      {
       "s": 33,
       "n": "Structure and Functions of the Immune System & Immune Response",
       "m": 20
      },
      {
       "s": 34,
       "n": "Hypersensitivity",
       "m": 13
      },
      {
       "s": 35,
       "n": "Immune Disorders",
       "m": 11
      }
     ]
    }
   ]
  },
  {
   "name": "Forensic Medicine",
   "id": "forensic_medicine",
   "units": [
    {
     "name": "IDENTIFICATION",
     "topics": [
      {
       "s": 1,
       "n": "Skeletal and Dental Age Determination",
       "m": 18
      },
      {
       "s": 2,
       "n": "Race, Sex and Stature Determination",
       "m": 19
      },
      {
       "s": 3,
       "n": "Fingerprint and Tattoos",
       "m": 14
      }
     ]
    },
    {
     "name": "MEDICAL JURISPRUDENCE",
     "topics": [
      {
       "s": 4,
       "n": "BNS, BNSS, and BSA",
       "m": 25
      }
     ]
    },
    {
     "name": "DEATH, PM CHANGES",
     "topics": [
      {
       "s": 5,
       "n": "Death and Post-Mortem Changes",
       "m": 20
      }
     ]
    },
    {
     "name": "MEDICO LEGAL AUTOPSY",
     "topics": [
      {
       "s": 6,
       "n": "Medico Legal Autopsy",
       "m": 12
      }
     ]
    },
    {
     "name": "INJURIES",
     "topics": [
      {
       "s": 7,
       "n": "Mechanical Injuries",
       "m": 20
      },
      {
       "s": 8,
       "n": "Regional injuries",
       "m": 27
      },
      {
       "s": 9,
       "n": "Thermal Injuries",
       "m": 23
      },
      {
       "s": 10,
       "n": "Firearm Injuries and Blast Injuries",
       "m": 29
      }
     ]
    },
    {
     "name": "ASPHYXIA",
     "topics": [
      {
       "s": 11,
       "n": "Mechanical Asphyxia",
       "m": 26
      },
      {
       "s": 12,
       "n": "Drowning",
       "m": 12
      }
     ]
    },
    {
     "name": "SEXUAL OFFENCES AND ABORTION",
     "topics": [
      {
       "s": 13,
       "n": "Sexual Offences and Abortion",
       "m": 22
      }
     ]
    },
    {
     "name": "CHILDHOOD VIOLENCE, INFANTICIDE AND STARVATION",
     "topics": [
      {
       "s": 14,
       "n": "Childhood Violence, Infanticide and Starvation",
       "m": 15
      }
     ]
    },
    {
     "name": "TOXICOLOGY",
     "topics": [
      {
       "s": 15,
       "n": "Poisoning: General Considerations",
       "m": 25
      },
      {
       "s": 16,
       "n": "Organophosphorus Poisoning",
       "m": 14
      },
      {
       "s": 17,
       "n": "Corrosives and Asphyxiants",
       "m": 22
      },
      {
       "s": 18,
       "n": "Alcohol Poisoning",
       "m": 16
      },
      {
       "s": 19,
       "n": "Inorganic Irritants - Metallic and Non-metallic",
       "m": 23
      },
      {
       "s": 20,
       "n": "Organic Irritants - Plant and Animal Poisons",
       "m": 26
      },
      {
       "s": 21,
       "n": "CNS - Narcotics and Deliriants",
       "m": 18
      }
     ]
    }
   ]
  },
  {
   "name": "Community Medicine",
   "id": "community_medicine",
   "units": [
    {
     "name": "HISTORY OF MEDICINE",
     "topics": [
      {
       "s": 1,
       "n": "History of Medicine",
       "m": 24
      }
     ]
    },
    {
     "name": "CONCEPTS OF HEALTH AND DISEASE",
     "topics": [
      {
       "s": 2,
       "n": "Health Determinants and Indicators",
       "m": 22
      },
      {
       "s": 3,
       "n": "Concepts of Disease and Prevention",
       "m": 26
      }
     ]
    },
    {
     "name": "EPIDEMIOLOGY",
     "topics": [
      {
       "s": 4,
       "n": "Principles of Epidemiology",
       "m": 31
      },
      {
       "s": 5,
       "n": "Descriptive Epidemiology",
       "m": 17
      },
      {
       "s": 6,
       "n": "Analytical Epidemiology",
       "m": 33
      },
      {
       "s": 7,
       "n": "Experimental Epidemiology",
       "m": 19
      },
      {
       "s": 8,
       "n": "Basic Definitions in Infectious Disease Epidemiology",
       "m": 15
      },
      {
       "s": 9,
       "n": "Dynamics of Disease Transmission",
       "m": 20
      },
      {
       "s": 10,
       "n": "Principles of Immunization and Vaccination",
       "m": 25
      },
      {
       "s": 11,
       "n": "Vaccine Production and Storage",
       "m": 17
      },
      {
       "s": 12,
       "n": "Sterilization and Disinfection",
       "m": 23
      }
     ]
    },
    {
     "name": "SCREENING",
     "topics": [
      {
       "s": 13,
       "n": "Screening",
       "m": 32
      }
     ]
    },
    {
     "name": "EPIDEMIOLOGY OF COMMUNICABLE DISEASES",
     "topics": [
      {
       "s": 14,
       "n": "Viral Respiratory Infections",
       "m": 18
      },
      {
       "s": 15,
       "n": "Bacterial Respiratory Infections",
       "m": 23
      },
      {
       "s": 16,
       "n": "Intestinal Infections",
       "m": 31
      },
      {
       "s": 17,
       "n": "Arthropod-Borne Infections",
       "m": 22
      },
      {
       "s": 18,
       "n": "Zoonotic Infections - Viral",
       "m": 18
      },
      {
       "s": 19,
       "n": "Zoonotic Infections - Bacterial & Parasitic",
       "m": 12
      },
      {
       "s": 20,
       "n": "STDs and Surface Infections",
       "m": 30
      }
     ]
    },
    {
     "name": "EPIDEMIOLOGY OF NON-COMMUNICABLE DISEASES",
     "topics": [
      {
       "s": 21,
       "n": "Non-Communicable Diseases - Cardiovascular Diseases and Diabetes",
       "m": 21
      },
      {
       "s": 22,
       "n": "Non-Communicable Diseases - Cancer, Obesity and Blindness",
       "m": 18
      }
     ]
    },
    {
     "name": "INDIAN HEALTH PROGRAMMES",
     "topics": [
      {
       "s": 23,
       "n": "National Health Programmes I - NVBDCP",
       "m": 18
      },
      {
       "s": 24,
       "n": "National Health Programmes II - NLEP, NTEP & NACO",
       "m": 24
      },
      {
       "s": 25,
       "n": "National Health Programmes III - NIS, JSY, RBSK and Others",
       "m": 39
      }
     ]
    },
    {
     "name": "DEMOGRAPHY AND FAMILY PLANNING",
     "topics": [
      {
       "s": 26,
       "n": "Demography I: Demographic Cycle, Annual Growth Rate and Age Pyramid",
       "m": 16
      },
      {
       "s": 27,
       "n": "Demography II: Demographic indicators",
       "m": 23
      },
      {
       "s": 28,
       "n": "Family Planning",
       "m": 21
      }
     ]
    },
    {
     "name": "PREVENTIVE OBSTETRICS, PAEDIATRICS AND GERIATRICS",
     "topics": [
      {
       "s": 29,
       "n": "Preventive Obstetrics, Paediatrics and Geriatrics",
       "m": 28
      }
     ]
    },
    {
     "name": "NUTRITION AND HEALTH",
     "topics": [
      {
       "s": 30,
       "n": "Energy Metabolism and Macronutrients",
       "m": 16
      },
      {
       "s": 31,
       "n": "Micronutrients and Water",
       "m": 16
      },
      {
       "s": 32,
       "n": "Food Quality and Processing",
       "m": 9
      }
     ]
    },
    {
     "name": "MEDICINE AND SOCIAL SCIENCES",
     "topics": [
      {
       "s": 33,
       "n": "Concepts of Sociology and Psychology",
       "m": 20
      },
      {
       "s": 34,
       "n": "Social Organization and Economics",
       "m": 24
      }
     ]
    },
    {
     "name": "ENVIRONMENT AND HEALTH",
     "topics": [
      {
       "s": 35,
       "n": "Water - I: Sources and purification of water",
       "m": 28
      },
      {
       "s": 36,
       "n": "Water- II: Disinfection of water",
       "m": 15
      },
      {
       "s": 37,
       "n": "Water - III: Water Quality and Standards",
       "m": 22
      },
      {
       "s": 38,
       "n": "Environmental Meteorology",
       "m": 24
      },
      {
       "s": 39,
       "n": "Housing and Ventilation",
       "m": 14
      },
      {
       "s": 40,
       "n": "Light, Sound and Radiation",
       "m": 19
      },
      {
       "s": 41,
       "n": "Waste and Sewage Disposal",
       "m": 22
      },
      {
       "s": 42,
       "n": "Medical Entomology - Mosquitoes and Flies",
       "m": 22
      },
      {
       "s": 43,
       "n": "Medical Entomology - Ticks, Fleas and Mites",
       "m": 19
      },
      {
       "s": 44,
       "n": "Methods of Pest Control",
       "m": 18
      }
     ]
    },
    {
     "name": "BIOMEDICAL WASTE MANAGEMENT",
     "topics": [
      {
       "s": 45,
       "n": "Biomedical Waste Management",
       "m": 23
      }
     ]
    },
    {
     "name": "DISASTER MANAGEMENT",
     "topics": [
      {
       "s": 46,
       "n": "Disaster Management",
       "m": 20
      }
     ]
    },
    {
     "name": "OCCUPATIONAL HEALTH",
     "topics": [
      {
       "s": 47,
       "n": "Occupational Health Diseases",
       "m": 16
      },
      {
       "s": 48,
       "n": "ESI and Factories Act",
       "m": 15
      }
     ]
    },
    {
     "name": "COMMUNICATION FOR HEALTH EDUCATION",
     "topics": [
      {
       "s": 49,
       "n": "Communication for Health Education",
       "m": 21
      }
     ]
    },
    {
     "name": "HEALTHCARE OF THE COMMUNITY",
     "topics": [
      {
       "s": 50,
       "n": "Health Planning and Management",
       "m": 20
      },
      {
       "s": 51,
       "n": "Healthcare In India",
       "m": 24
      },
      {
       "s": 52,
       "n": "Healthcare in India- IPHS 2022 Update",
       "m": 11
      }
     ]
    },
    {
     "name": "INTERNATIONAL HEALTH",
     "topics": [
      {
       "s": 53,
       "n": "International Health",
       "m": 25
      }
     ]
    },
    {
     "name": "BIOSTATISTICS",
     "topics": [
      {
       "s": 54,
       "n": "Descriptive Statistics I - Probability and Data",
       "m": 24
      },
      {
       "s": 55,
       "n": "Descriptive Statistics II - Measures of Location",
       "m": 17
      },
      {
       "s": 56,
       "n": "Descriptive Statistics III - Measures of Dispersion",
       "m": 18
      },
      {
       "s": 57,
       "n": "Descriptive Statistics IV - Measures of Position",
       "m": 11
      },
      {
       "s": 58,
       "n": "Inferential Statistics",
       "m": 13
      },
      {
       "s": 59,
       "n": "Concepts in Hypothesis Testing",
       "m": 13
      },
      {
       "s": 60,
       "n": "Tests of Significance",
       "m": 21
      },
      {
       "s": 61,
       "n": "Correlational and Predictive Techniques",
       "m": 20
      },
      {
       "s": 62,
       "n": "Facets of Clinical Research and Biostatistics",
       "m": 18
      }
     ]
    },
    {
     "name": "MENTAL HEALTH AND GENETICS",
     "topics": [
      {
       "s": 63,
       "n": "Mental Health",
       "m": 15
      },
      {
       "s": 64,
       "n": "Genetics and Health",
       "m": 14
      }
     ]
    }
   ]
  },
  {
   "name": "Ophthalmology",
   "id": "ophthalmology",
   "units": [
    {
     "name": "CORNEA",
     "topics": [
      {
       "s": 1,
       "n": "Anatomy and Physiology of Cornea",
       "m": 23
      },
      {
       "s": 2,
       "n": "Infectious Keratitis - Bacterial & Fungal",
       "m": 30
      },
      {
       "s": 3,
       "n": "Infectious Keratitis - Viral, Acanthamoeba and Interstitial",
       "m": 21
      },
      {
       "s": 4,
       "n": "Corneal Degenerations, Dystrophies & Ectasias",
       "m": 20
      },
      {
       "s": 5,
       "n": "Corneal Ulcer Complications and Keratoplasty",
       "m": 20
      },
      {
       "s": 6,
       "n": "Miscellaneous Disorders of Cornea",
       "m": 15
      },
      {
       "s": 7,
       "n": "Corneal Blindness, Eye Banking & Refractive Surgery",
       "m": 25
      },
      {
       "s": 8,
       "n": "Non-infectious Disorders of Cornea",
       "m": 26
      }
     ]
    },
    {
     "name": "RETINA AND VITREOUS",
     "topics": [
      {
       "s": 9,
       "n": "Retinal vascular disorders and Retinal detachment",
       "m": 35
      },
      {
       "s": 10,
       "n": "Macular disorders, Retinal dystrophies, and Vitreal disorders",
       "m": 31
      }
     ]
    },
    {
     "name": "LENS",
     "topics": [
      {
       "s": 11,
       "n": "Lens - Introduction, Types of Cataract and Clinical Features",
       "m": 23
      },
      {
       "s": 12,
       "n": "Lens - Cataract Surgery, Complications and IOLs",
       "m": 22
      }
     ]
    },
    {
     "name": "GLAUCOMA",
     "topics": [
      {
       "s": 13,
       "n": "Glaucoma",
       "m": 34
      }
     ]
    },
    {
     "name": "UVEAL TRACT",
     "topics": [
      {
       "s": 14,
       "n": "Uveitis - Anterior and Intermediate",
       "m": 18
      },
      {
       "s": 15,
       "n": "Uveitis - Posterior and Panuveitis",
       "m": 16
      }
     ]
    },
    {
     "name": "LID AND LACRIMAL APPARATUS",
     "topics": [
      {
       "s": 16,
       "n": "Disorders of the Eyelid",
       "m": 22
      },
      {
       "s": 17,
       "n": "Disorders of Lacrimal Apparatus and Glands of the Eye",
       "m": 18
      }
     ]
    },
    {
     "name": "ORBIT",
     "topics": [
      {
       "s": 18,
       "n": "Orbit Anatomy and Ocular Injuries",
       "m": 14
      },
      {
       "s": 19,
       "n": "Diseases of the Orbit",
       "m": 22
      }
     ]
    },
    {
     "name": "SPECIFIC DISORDERS OF THE EYE",
     "topics": [
      {
       "s": 20,
       "n": "Strabismus - Introduction, Symptomatology, and Evaluation",
       "m": 21
      },
      {
       "s": 21,
       "n": "Strabismus - Types and Treatment",
       "m": 25
      },
      {
       "s": 22,
       "n": "Disorders of Visual Pathway and Pupillary Reflexes",
       "m": 24
      },
      {
       "s": 23,
       "n": "Disorders of Optic Nerve and Gaze Palsies",
       "m": 27
      },
      {
       "s": 24,
       "n": "Tumors of Eye",
       "m": 18
      }
     ]
    },
    {
     "name": "PRACTICAL OPHTHALMOLOGY",
     "topics": [
      {
       "s": 25,
       "n": "Practical Ophthalmology",
       "m": 25
      }
     ]
    },
    {
     "name": "SYSTEMIC OPHTHALMOLOGY",
     "topics": [
      {
       "s": 26,
       "n": "Eye Signs in Systemic Disease",
       "m": 15
      }
     ]
    },
    {
     "name": "COMMUNITY OPHTHALMOLOGY",
     "topics": [
      {
       "s": 27,
       "n": "Community Ophthalmology",
       "m": 11
      }
     ]
    },
    {
     "name": "INSTRUMENTS",
     "topics": [
      {
       "s": 28,
       "n": "Instruments in Ophthalmology",
       "m": 23
      }
     ]
    }
   ]
  },
  {
   "name": "ENT (Otolaryngology)",
   "id": "otorhinolaryngology__ent_",
   "units": [
    {
     "name": "EAR",
     "topics": [
      {
       "s": 1,
       "n": "Embryology of Ear and Malformations",
       "m": 12
      },
      {
       "s": 2,
       "n": "Anatomy of External Ear",
       "m": 18
      },
      {
       "s": 3,
       "n": "Anatomy of Middle Ear",
       "m": 23
      },
      {
       "s": 4,
       "n": "Anatomy of Mastoid",
       "m": 9
      },
      {
       "s": 5,
       "n": "Anatomy of Inner Ear",
       "m": 15
      },
      {
       "s": 6,
       "n": "Disorders of External Ear",
       "m": 20
      },
      {
       "s": 7,
       "n": "Disorders of Middle Ear",
       "m": 15
      },
      {
       "s": 8,
       "n": "Cholesteatoma and Types of CSOM",
       "m": 13
      },
      {
       "s": 9,
       "n": "CSOM - Treatment and Complications",
       "m": 17
      },
      {
       "s": 10,
       "n": "Otosclerosis",
       "m": 14
      },
      {
       "s": 11,
       "n": "Meniere's Disease",
       "m": 19
      },
      {
       "s": 12,
       "n": "Tumors of Ear",
       "m": 21
      },
      {
       "s": 13,
       "n": "Anatomy of Facial Nerve",
       "m": 17
      },
      {
       "s": 14,
       "n": "Facial Nerve Disorders",
       "m": 21
      },
      {
       "s": 15,
       "n": "Eustachian Tube",
       "m": 13
      },
      {
       "s": 16,
       "n": "Physiology of hearing and Tuning fork tests",
       "m": 19
      },
      {
       "s": 17,
       "n": "Audiometric tests and Special tests of hearing",
       "m": 19
      }
     ]
    },
    {
     "name": "NOSE",
     "topics": [
      {
       "s": 18,
       "n": "Anatomy of Nose",
       "m": 14
      },
      {
       "s": 19,
       "n": "Anatomy of Paranasal Sinuses",
       "m": 10
      },
      {
       "s": 20,
       "n": "Physiology of Nose and Paranasal Sinuses",
       "m": 8
      },
      {
       "s": 21,
       "n": "Epistaxis",
       "m": 12
      },
      {
       "s": 22,
       "n": "Congenital Anomalies of Nose and Disease of Nose",
       "m": 15
      },
      {
       "s": 23,
       "n": "Rhinitis",
       "m": 15
      },
      {
       "s": 24,
       "n": "Disorder of Nasal Septum and Nasal Polyposis",
       "m": 17
      },
      {
       "s": 25,
       "n": "Trauma of Nose and Face",
       "m": 17
      },
      {
       "s": 26,
       "n": "Tumors of Nose and PNS",
       "m": 13
      },
      {
       "s": 27,
       "n": "Sinusitis and its Complication",
       "m": 27
      }
     ]
    },
    {
     "name": "PHARYNX",
     "topics": [
      {
       "s": 28,
       "n": "Anatomy and Physiology of Pharynx",
       "m": 13
      },
      {
       "s": 29,
       "n": "Adenoids",
       "m": 11
      },
      {
       "s": 30,
       "n": "Tonsils",
       "m": 19
      },
      {
       "s": 31,
       "n": "Abscesses of Pharynx",
       "m": 16
      },
      {
       "s": 32,
       "n": "Nasopharyngeal Angiofibroma",
       "m": 12
      },
      {
       "s": 33,
       "n": "Nasopharyngeal Carcinoma",
       "m": 13
      }
     ]
    },
    {
     "name": "LARYNX",
     "topics": [
      {
       "s": 34,
       "n": "Anatomy and Physiology of Larynx",
       "m": 17
      },
      {
       "s": 35,
       "n": "Stridor and Congenital Conditions of Larynx",
       "m": 10
      },
      {
       "s": 36,
       "n": "Voice and Speech Disorders",
       "m": 19
      },
      {
       "s": 37,
       "n": "Laryngeal Carcinoma",
       "m": 10
      }
     ]
    },
    {
     "name": "INSTRUMENTS",
     "topics": [
      {
       "s": 38,
       "n": "Instruments",
       "m": 10
      }
     ]
    }
   ]
  },
  {
   "name": "General Medicine",
   "id": "medicine",
   "units": [
    {
     "name": "GENERAL",
     "topics": [
      {
       "s": 1,
       "n": "Clinical examination",
       "m": 20
      },
      {
       "s": 2,
       "n": "Acid-Base Disorders",
       "m": 25
      }
     ]
    },
    {
     "name": "ENDOCRINE SYSTEM",
     "topics": [
      {
       "s": 3,
       "n": "General Principles of Endocrinology",
       "m": 13
      },
      {
       "s": 4,
       "n": "Disorders of Anterior Pituitary",
       "m": 16
      },
      {
       "s": 5,
       "n": "Pituitary Tumours and Sheehan's Syndrome",
       "m": 15
      },
      {
       "s": 6,
       "n": "Posterior Pituitary - ADH, Oxytocin & Diabetes Insipidus",
       "m": 15
      },
      {
       "s": 7,
       "n": "Syndrome of Inappropriate Anti-Diuretic Hormone Secretion (SIADH)",
       "m": 9
      },
      {
       "s": 8,
       "n": "Thyroid Disorders - Clinical Features",
       "m": 21
      },
      {
       "s": 9,
       "n": "Thyroid Disorders - Management",
       "m": 13
      },
      {
       "s": 10,
       "n": "Multiple Endocrine Neoplasia",
       "m": 13
      },
      {
       "s": 11,
       "n": "Pheochromocytoma",
       "m": 14
      },
      {
       "s": 12,
       "n": "Cushing's Syndrome",
       "m": 16
      },
      {
       "s": 13,
       "n": "Adrenal Insufficiency and Hyperaldosteronism",
       "m": 16
      },
      {
       "s": 14,
       "n": "Diabetes Mellitus: Types, Clinical Features and Management",
       "m": 25
      },
      {
       "s": 15,
       "n": "Diabetes Mellitus: Complications and their Management",
       "m": 29
      },
      {
       "s": 16,
       "n": "Reproductive Endocrinology",
       "m": 14
      },
      {
       "s": 17,
       "n": "Disorders of Parathyroid and Calcium Homeostasis",
       "m": 22
      },
      {
       "s": 18,
       "n": "Obesity",
       "m": 13
      }
     ]
    },
    {
     "name": "GASTROINTESTINAL SYSTEM",
     "topics": [
      {
       "s": 19,
       "n": "Hyperbilirubinemias and Tests of Liver Function",
       "m": 21
      },
      {
       "s": 20,
       "n": "Alcoholic Liver Diseases and Non-Alcoholic Fatty Liver Disease",
       "m": 13
      },
      {
       "s": 21,
       "n": "Viral Hepatitis",
       "m": 26
      },
      {
       "s": 22,
       "n": "Autoimmune Disorders of Hepatobiliary System",
       "m": 12
      },
      {
       "s": 23,
       "n": "Acute Liver Failure and Liver Transplantation",
       "m": 19
      },
      {
       "s": 24,
       "n": "Hemochromatosis and Wilson's disease",
       "m": 18
      },
      {
       "s": 25,
       "n": "Cirrhosis and Complications",
       "m": 24
      },
      {
       "s": 26,
       "n": "Peptic Ulcer Disease and Related Disorders",
       "m": 21
      },
      {
       "s": 27,
       "n": "Evaluation of Diarrhea",
       "m": 12
      },
      {
       "s": 28,
       "n": "Irritable Bowel Syndrome",
       "m": 15
      },
      {
       "s": 29,
       "n": "Inflammatory Bowel Disease - Clinical Features and Diagnosis",
       "m": 19
      },
      {
       "s": 30,
       "n": "Inflammatory Bowel Disease - Complications and Treatment",
       "m": 18
      },
      {
       "s": 31,
       "n": "Malabsorption Syndromes",
       "m": 25
      },
      {
       "s": 32,
       "n": "Other Gastrointestinal Conditions",
       "m": 12
      }
     ]
    },
    {
     "name": "RHEUMATOLOGY AND IMMUNOLOGY",
     "topics": [
      {
       "s": 33,
       "n": "Large and medium vessel vasculitis",
       "m": 16
      },
      {
       "s": 34,
       "n": "Small vessel vasculitis",
       "m": 15
      },
      {
       "s": 35,
       "n": "Crystal Arthropathies",
       "m": 10
      },
      {
       "s": 36,
       "n": "Sjogren's Syndrome and Scleroderma",
       "m": 17
      },
      {
       "s": 37,
       "n": "Sarcoidosis",
       "m": 14
      },
      {
       "s": 38,
       "n": "Dermatomyositis and Related Disorders",
       "m": 16
      },
      {
       "s": 39,
       "n": "Seronegative Spondyloarthritides",
       "m": 17
      },
      {
       "s": 40,
       "n": "SLE and APS",
       "m": 22
      },
      {
       "s": 41,
       "n": "Rheumatoid Arthritis",
       "m": 20
      }
     ]
    },
    {
     "name": "RESPIRATORY SYSTEM",
     "topics": [
      {
       "s": 42,
       "n": "Asthma & COPD",
       "m": 24
      },
      {
       "s": 43,
       "n": "Pneumonia",
       "m": 20
      },
      {
       "s": 44,
       "n": "Interstitial Lung Diseases and pneumoconiosis",
       "m": 20
      },
      {
       "s": 45,
       "n": "Bronchiectasis and Lung Abscess",
       "m": 19
      },
      {
       "s": 46,
       "n": "Pulmonary Function Tests",
       "m": 11
      },
      {
       "s": 47,
       "n": "Respiratory Failure and ARDS",
       "m": 7
      },
      {
       "s": 48,
       "n": "Neoplasms of the Lung",
       "m": 13
      },
      {
       "s": 49,
       "n": "Sleep apnea",
       "m": 8
      }
     ]
    },
    {
     "name": "RENAL SYSTEM",
     "topics": [
      {
       "s": 50,
       "n": "Urine Analysis",
       "m": 14
      },
      {
       "s": 51,
       "n": "Chronic Kidney Disease",
       "m": 26
      },
      {
       "s": 52,
       "n": "Acute Kidney Injury",
       "m": 18
      },
      {
       "s": 53,
       "n": "Renal Replacement Therapy",
       "m": 24
      },
      {
       "s": 54,
       "n": "Cystic and Inherited Disorders of the Kidney",
       "m": 14
      },
      {
       "s": 55,
       "n": "Renal Tubular Disorders",
       "m": 14
      },
      {
       "s": 56,
       "n": "Vascular Diseases of Kidney",
       "m": 10
      }
     ]
    },
    {
     "name": "CARDIOVASCULAR SYSTEM",
     "topics": [
      {
       "s": 57,
       "n": "Diagnosis of cardiovascular disorders",
       "m": 31
      },
      {
       "s": 58,
       "n": "ECG Basics",
       "m": 22
      },
      {
       "s": 59,
       "n": "Supraventricular Arrhythmias",
       "m": 22
      },
      {
       "s": 60,
       "n": "Ventricular Arrhythmias and Heart Blocks",
       "m": 23
      },
      {
       "s": 61,
       "n": "Valvular Heart Diseases",
       "m": 23
      },
      {
       "s": 62,
       "n": "Infective Endocarditis and Acute rheumatic fever",
       "m": 29
      },
      {
       "s": 63,
       "n": "Hypertensive Vascular Disease",
       "m": 16
      },
      {
       "s": 64,
       "n": "Ischemic Heart Disease - Presentation and Diagnosis",
       "m": 23
      },
      {
       "s": 65,
       "n": "Ischemic Heart Disease - Complications and Management",
       "m": 23
      },
      {
       "s": 66,
       "n": "Cardiomyopathy and Myocarditis",
       "m": 16
      },
      {
       "s": 67,
       "n": "Heart Failure",
       "m": 18
      },
      {
       "s": 68,
       "n": "Pericardial Diseases",
       "m": 13
      },
      {
       "s": 69,
       "n": "Pulmonary Hypertension",
       "m": 7
      },
      {
       "s": 70,
       "n": "Diseases of Aorta and Peripheral Arteries",
       "m": 11
      },
      {
       "s": 71,
       "n": "DVT and Pulmonary Embolism",
       "m": 18
      }
     ]
    },
    {
     "name": "NERVOUS SYSTEM",
     "topics": [
      {
       "s": 72,
       "n": "General Neurology, Brain Death, and GCS",
       "m": 18
      },
      {
       "s": 73,
       "n": "Seizures and Epilepsy",
       "m": 28
      },
      {
       "s": 74,
       "n": "Ischemic Stroke",
       "m": 26
      },
      {
       "s": 75,
       "n": "Brainstem Syndromes and Hemorrhagic Stroke",
       "m": 26
      },
      {
       "s": 76,
       "n": "Peripheral Neuropathy",
       "m": 15
      },
      {
       "s": 77,
       "n": "Guillain-Barre Syndrome and Other Immune-mediated Neuropathies",
       "m": 21
      },
      {
       "s": 78,
       "n": "Diseases of the Spinal Cord",
       "m": 18
      },
      {
       "s": 79,
       "n": "Myasthenia gravis and Other Neuromuscular Junction Disorders",
       "m": 16
      },
      {
       "s": 80,
       "n": "Multiple Sclerosis & Other Demyelinating Disorders",
       "m": 17
      },
      {
       "s": 81,
       "n": "Headache Disorders",
       "m": 20
      },
      {
       "s": 82,
       "n": "Movement Disorders",
       "m": 32
      },
      {
       "s": 83,
       "n": "ALS and Other Motor Neuron Diseases",
       "m": 11
      },
      {
       "s": 84,
       "n": "Ataxic Disorders",
       "m": 10
      },
      {
       "s": 85,
       "n": "Cranial Nerve Disorders",
       "m": 17
      },
      {
       "s": 86,
       "n": "Infections of the Nervous System",
       "m": 12
      }
     ]
    },
    {
     "name": "BLOOD DISORDERS",
     "topics": [
      {
       "s": 87,
       "n": "Hypoproliferative Anemia",
       "m": 22
      },
      {
       "s": 88,
       "n": "Macrocytic Anemia",
       "m": 17
      },
      {
       "s": 89,
       "n": "Hemolytic Anemia",
       "m": 23
      },
      {
       "s": 90,
       "n": "Myeloproliferative Disorders and Aplastic Anemia",
       "m": 17
      },
      {
       "s": 91,
       "n": "Platelet Disorders",
       "m": 30
      },
      {
       "s": 92,
       "n": "Acute Leukemia",
       "m": 24
      },
      {
       "s": 93,
       "n": "Plasma Cell Disorders",
       "m": 18
      },
      {
       "s": 94,
       "n": "Chronic Myeloid Leukemia and Chronic Lymphoid Leukemia",
       "m": 14
      },
      {
       "s": 95,
       "n": "Lymphomas",
       "m": 28
      },
      {
       "s": 96,
       "n": "Coagulation Disorders",
       "m": 25
      },
      {
       "s": 97,
       "n": "Haemoglobinopathies",
       "m": 9
      },
      {
       "s": 98,
       "n": "Blood Bank & Transfusion Medicine",
       "m": 16
      }
     ]
    },
    {
     "name": "INFECTIOUS DISEASES",
     "topics": [
      {
       "s": 99,
       "n": "HIV / AIDS - Epidemiology and Clinical Features",
       "m": 18
      },
      {
       "s": 100,
       "n": "HIV / AIDS - Management and Prophylaxis",
       "m": 21
      }
     ]
    },
    {
     "name": "COVID 19",
     "topics": [
      {
       "s": 101,
       "n": "COVID 19 - Epidemiology and Clinical Features",
       "m": 13
      },
      {
       "s": 102,
       "n": "COVID 19 - Investigations",
       "m": 13
      },
      {
       "s": 103,
       "n": "COVID 19 - Treatment",
       "m": 13
      },
      {
       "s": 104,
       "n": "COVID 19 - Prophylaxis and Complications",
       "m": 14
      }
     ]
    }
   ]
  },
  {
   "name": "General Surgery",
   "id": "surgery",
   "units": [
    {
     "name": "GENERAL SURGERY",
     "topics": [
      {
       "s": 1,
       "n": "Fluids, Electrolytes & Nutrition",
       "m": 23
      },
      {
       "s": 2,
       "n": "Shock and Blood Transfusion",
       "m": 20
      },
      {
       "s": 3,
       "n": "Instruments & Sutures",
       "m": 36
      },
      {
       "s": 4,
       "n": "Paediatric Surgery",
       "m": 22
      },
      {
       "s": 5,
       "n": "Trauma - Scores, Investigations and Assessment",
       "m": 20
      },
      {
       "s": 6,
       "n": "Trauma - Spinal, Thoracic and Abdominal Injuries",
       "m": 33
      }
     ]
    },
    {
     "name": "BREAST",
     "topics": [
      {
       "s": 7,
       "n": "Breast - Anatomy, Congenital and Benign Diseases",
       "m": 24
      },
      {
       "s": 8,
       "n": "Carcinoma Breast - Risk Factors and Types",
       "m": 16
      },
      {
       "s": 9,
       "n": "Investigations in Breast diseases",
       "m": 21
      },
      {
       "s": 10,
       "n": "Carcinoma Breast - Staging, Prognosis & Molecular Types",
       "m": 13
      },
      {
       "s": 11,
       "n": "Carcinoma Breast - Treatment",
       "m": 29
      }
     ]
    },
    {
     "name": "ENDOCRINE SYSTEM",
     "topics": [
      {
       "s": 12,
       "n": "Benign Lesions of Thyroid",
       "m": 24
      },
      {
       "s": 13,
       "n": "Thyroid Malignancies",
       "m": 27
      },
      {
       "s": 14,
       "n": "The Parathyroids",
       "m": 22
      },
      {
       "s": 15,
       "n": "The Adrenals",
       "m": 16
      }
     ]
    },
    {
     "name": "UPPER GI SURGERY",
     "topics": [
      {
       "s": 16,
       "n": "Esophagus - Congenital, Motility & Inflammatory Disorders",
       "m": 26
      },
      {
       "s": 17,
       "n": "Esophagus - GERD & Carcinoma",
       "m": 19
      },
      {
       "s": 18,
       "n": "Stomach and Duodenum",
       "m": 28
      },
      {
       "s": 19,
       "n": "Carcinoma Stomach",
       "m": 20
      },
      {
       "s": 20,
       "n": "Metabolic & Bariatric Surgery",
       "m": 14
      }
     ]
    },
    {
     "name": "LOWER GI & HERNIA SURGERY",
     "topics": [
      {
       "s": 21,
       "n": "Small Intestine",
       "m": 31
      },
      {
       "s": 22,
       "n": "Large Intestine",
       "m": 30
      },
      {
       "s": 23,
       "n": "Appendix",
       "m": 24
      },
      {
       "s": 24,
       "n": "Polyps and Colorectal Carcinoma",
       "m": 36
      },
      {
       "s": 25,
       "n": "Rectum",
       "m": 21
      },
      {
       "s": 26,
       "n": "Anus and Anal Canal",
       "m": 23
      },
      {
       "s": 27,
       "n": "Hernia",
       "m": 32
      }
     ]
    },
    {
     "name": "HEPATO-BILIARY SURGERY",
     "topics": [
      {
       "s": 28,
       "n": "Benign Conditions of Liver",
       "m": 31
      },
      {
       "s": 29,
       "n": "Benign Tumors of Liver",
       "m": 13
      },
      {
       "s": 30,
       "n": "Malignant Tumors of Liver",
       "m": 22
      },
      {
       "s": 31,
       "n": "Gall Bladder",
       "m": 30
      },
      {
       "s": 32,
       "n": "Bile Duct",
       "m": 14
      }
     ]
    },
    {
     "name": "SPLEEN & PANCREATIC SURGERY",
     "topics": [
      {
       "s": 33,
       "n": "Spleen",
       "m": 17
      },
      {
       "s": 34,
       "n": "Endocrine Pancreas",
       "m": 16
      },
      {
       "s": 35,
       "n": "Congenital Anomalies and Acute Pancreatitis",
       "m": 23
      },
      {
       "s": 36,
       "n": "Chronic Pancreatitis",
       "m": 23
      },
      {
       "s": 37,
       "n": "Carcinoma Pancreas",
       "m": 22
      }
     ]
    },
    {
     "name": "UROLOGY",
     "topics": [
      {
       "s": 38,
       "n": "Congenital Diseases of Kidney and Urinary Calculi",
       "m": 24
      },
      {
       "s": 39,
       "n": "Infections and Tumors of Kidney",
       "m": 25
      },
      {
       "s": 40,
       "n": "Urinary Bladder and Ureters",
       "m": 23
      },
      {
       "s": 41,
       "n": "Prostate",
       "m": 21
      },
      {
       "s": 42,
       "n": "Urethra and Penis",
       "m": 17
      },
      {
       "s": 43,
       "n": "Testes and Scrotum",
       "m": 22
      }
     ]
    },
    {
     "name": "NEUROSURGERY",
     "topics": [
      {
       "s": 44,
       "n": "Head Injury",
       "m": 22
      }
     ]
    },
    {
     "name": "HEAD AND NECK",
     "topics": [
      {
       "s": 45,
       "n": "Oral Cavity & Salivary glands",
       "m": 30
      }
     ]
    },
    {
     "name": "PLASTIC SURGERY",
     "topics": [
      {
       "s": 46,
       "n": "Burns",
       "m": 25
      },
      {
       "s": 47,
       "n": "Wound Healing, Tissue Repair & Scar",
       "m": 27
      },
      {
       "s": 48,
       "n": "Reconstructive Surgery",
       "m": 19
      }
     ]
    },
    {
     "name": "CARDIOTHORACIC & VASCULAR SURGERY",
     "topics": [
      {
       "s": 49,
       "n": "Thorax & Lungs",
       "m": 29
      },
      {
       "s": 50,
       "n": "Ischemic Arterial Diseases",
       "m": 25
      },
      {
       "s": 51,
       "n": "Arterial Aneurysms, Dissections and Malformations",
       "m": 18
      },
      {
       "s": 52,
       "n": "Venous Diseases",
       "m": 26
      },
      {
       "s": 53,
       "n": "Lymphatic Diseases",
       "m": 12
      }
     ]
    },
    {
     "name": "SKIN",
     "topics": [
      {
       "s": 54,
       "n": "Skin Malignancies",
       "m": 30
      }
     ]
    }
   ]
  },
  {
   "name": "Obstetrics & Gynaecology",
   "id": "obstetrics___gynaecology",
   "units": [
    {
     "name": "FUNDAMENTALS OF REPRODUCTION",
     "topics": [
      {
       "s": 1,
       "n": "Anatomy of Female Pelvic Organs",
       "m": 26
      },
      {
       "s": 2,
       "n": "The Physiology of Conception",
       "m": 15
      },
      {
       "s": 3,
       "n": "Maternal Pelvis and Fetal Skull",
       "m": 16
      },
      {
       "s": 4,
       "n": "Placenta and Fetal Membranes",
       "m": 26
      },
      {
       "s": 5,
       "n": "Sexual Development, Puberty and Adolescence",
       "m": 28
      }
     ]
    },
    {
     "name": "NORMAL PREGNANCY AND ANTENATAL CARE",
     "topics": [
      {
       "s": 6,
       "n": "Physiological Changes During Pregnancy",
       "m": 24
      },
      {
       "s": 7,
       "n": "Diagnosis of Pregnancy and Antenatal Care",
       "m": 21
      },
      {
       "s": 8,
       "n": "Antenatal Investigations",
       "m": 15
      },
      {
       "s": 9,
       "n": "Obstetrical Imaging",
       "m": 17
      }
     ]
    },
    {
     "name": "LABOR AND PUERPERIUM",
     "topics": [
      {
       "s": 10,
       "n": "Normal Labour",
       "m": 20
      },
      {
       "s": 11,
       "n": "Abnormal Labour",
       "m": 21
      },
      {
       "s": 12,
       "n": "Induction and Augmentation of Labour",
       "m": 17
      },
      {
       "s": 13,
       "n": "Malpresentations",
       "m": 23
      },
      {
       "s": 14,
       "n": "Operative Vaginal Delivery",
       "m": 15
      },
      {
       "s": 15,
       "n": "Caesarean Section and Vaginal Birth After Caesarean (VBAC)",
       "m": 18
      },
      {
       "s": 16,
       "n": "Puerperium",
       "m": 24
      }
     ]
    },
    {
     "name": "OBSTETRIC COMPLICATIONS",
     "topics": [
      {
       "s": 17,
       "n": "Multifetal Pregnancy",
       "m": 26
      },
      {
       "s": 18,
       "n": "Ectopic Pregnancy",
       "m": 19
      },
      {
       "s": 19,
       "n": "Abortion and Medical Termination of Pregnancy",
       "m": 26
      },
      {
       "s": 20,
       "n": "Antepartum Hemorrhage",
       "m": 22
      },
      {
       "s": 21,
       "n": "Postpartum Haemorrhage",
       "m": 22
      },
      {
       "s": 22,
       "n": "Preterm Labor and Postterm Pregnancy",
       "m": 24
      },
      {
       "s": 23,
       "n": "Gestational Trophoblastic Diseases",
       "m": 22
      }
     ]
    },
    {
     "name": "MEDICAL AND SURGICAL COMPLICATIONS IN PREGNANCY",
     "topics": [
      {
       "s": 24,
       "n": "Anemia in Pregnancy",
       "m": 16
      },
      {
       "s": 25,
       "n": "Hypertensive Disorders in Pregnancy",
       "m": 30
      },
      {
       "s": 26,
       "n": "Diabetes in Pregnancy",
       "m": 19
      },
      {
       "s": 27,
       "n": "Cardiovascular Conditions in Pregnancy",
       "m": 22
      },
      {
       "s": 28,
       "n": "Rhesus Isoimmunization",
       "m": 15
      },
      {
       "s": 29,
       "n": "Hepatic Disorders and Infections in Pregnancy",
       "m": 25
      }
     ]
    },
    {
     "name": "GENERAL GYNAECOLOGY",
     "topics": [
      {
       "s": 30,
       "n": "Disorders of Menstruation",
       "m": 18
      },
      {
       "s": 31,
       "n": "Uro-gynaecology",
       "m": 23
      },
      {
       "s": 32,
       "n": "Prolapse",
       "m": 24
      },
      {
       "s": 33,
       "n": "Fibroid",
       "m": 26
      },
      {
       "s": 34,
       "n": "Endometriosis and Adenomyosis",
       "m": 18
      },
      {
       "s": 35,
       "n": "Disorders of Ovary",
       "m": 14
      },
      {
       "s": 36,
       "n": "Contraception and Sterilization",
       "m": 27
      }
     ]
    },
    {
     "name": "GYNAECOLOGIC INFECTIONS",
     "topics": [
      {
       "s": 37,
       "n": "Vaginal Infections",
       "m": 23
      },
      {
       "s": 38,
       "n": "Vulval Infections",
       "m": 13
      },
      {
       "s": 39,
       "n": "Pelvic Inflammatory Disease",
       "m": 24
      },
      {
       "s": 40,
       "n": "Genital Tuberculosis",
       "m": 9
      }
     ]
    },
    {
     "name": "INFERTILITY AND MENOPAUSE",
     "topics": [
      {
       "s": 41,
       "n": "Infertility",
       "m": 24
      },
      {
       "s": 42,
       "n": "Perimenopause, Menopause and Post-Menopausal Bleeding",
       "m": 17
      }
     ]
    },
    {
     "name": "GYNAECOLOGIC ONCOLOGY",
     "topics": [
      {
       "s": 43,
       "n": "Ovarian Tumors",
       "m": 25
      },
      {
       "s": 44,
       "n": "Vulval & Vaginal Malignancy",
       "m": 14
      },
      {
       "s": 45,
       "n": "Carcinoma Cervix",
       "m": 27
      },
      {
       "s": 46,
       "n": "Carcinoma Endometrium",
       "m": 18
      }
     ]
    },
    {
     "name": "INSTRUMENTS",
     "topics": [
      {
       "s": 47,
       "n": "Instruments",
       "m": 22
      }
     ]
    }
   ]
  },
  {
   "name": "Paediatrics",
   "id": "paediatrics",
   "units": [
    {
     "name": "NEONATOLOGY",
     "topics": [
      {
       "s": 1,
       "n": "Basics of Neonatology and Routine Newborn Care",
       "m": 17
      },
      {
       "s": 2,
       "n": "Disorders of Newborn",
       "m": 19
      },
      {
       "s": 3,
       "n": "Diseases in Neonates requiring Special Care",
       "m": 18
      },
      {
       "s": 4,
       "n": "Apgar score and Neonatal Resuscitation",
       "m": 12
      }
     ]
    },
    {
     "name": "GROWTH AND DEVELOPMENT",
     "topics": [
      {
       "s": 5,
       "n": "Developmental Milestones",
       "m": 21
      },
      {
       "s": 6,
       "n": "Facets of Growth and Development",
       "m": 17
      }
     ]
    },
    {
     "name": "NUTRITION",
     "topics": [
      {
       "s": 7,
       "n": "Nutrition and Breastfeeding",
       "m": 19
      },
      {
       "s": 8,
       "n": "Protein Energy Malnutrition",
       "m": 14
      },
      {
       "s": 9,
       "n": "Deficiency of Fat Soluble Vitamins",
       "m": 20
      },
      {
       "s": 10,
       "n": "Deficiency of Water-soluble Vitamins & Trace Elements",
       "m": 16
      }
     ]
    },
    {
     "name": "FLUIDS AND ELECTROLYTES",
     "topics": [
      {
       "s": 11,
       "n": "Fluid and Electrolyte Disorders",
       "m": 16
      }
     ]
    },
    {
     "name": "GENETIC DISORDERS",
     "topics": [
      {
       "s": 12,
       "n": "Mendelian and Non-Mendelian Disorders",
       "m": 27
      },
      {
       "s": 13,
       "n": "Chromosomal Disorders",
       "m": 22
      }
     ]
    },
    {
     "name": "METABOLIC DISORDERS",
     "topics": [
      {
       "s": 14,
       "n": "Metabolic Disorders of Amino Acids",
       "m": 26
      },
      {
       "s": 15,
       "n": "Metabolic Disorders of Urea Cycle, Complex Molecules, and Carbohydrates",
       "m": 23
      }
     ]
    },
    {
     "name": "CHILDHOOD INFECTIONS",
     "topics": [
      {
       "s": 16,
       "n": "Polio and AIDS",
       "m": 20
      },
      {
       "s": 17,
       "n": "Paediatric Bacterial and Parasitic Infections",
       "m": 27
      },
      {
       "s": 18,
       "n": "Measles, Mumps, Rubella and Other Viral Infections",
       "m": 25
      }
     ]
    },
    {
     "name": "GASTROINTESTINAL SYSTEM",
     "topics": [
      {
       "s": 19,
       "n": "Surgical GI Disorders",
       "m": 20
      },
      {
       "s": 20,
       "n": "Medical GI Disorders",
       "m": 16
      },
      {
       "s": 21,
       "n": "Disorders of the Liver",
       "m": 20
      }
     ]
    },
    {
     "name": "RESPIRATORY SYSTEM",
     "topics": [
      {
       "s": 22,
       "n": "Neonatal Respiratory Disorders",
       "m": 22
      },
      {
       "s": 23,
       "n": "Childhood Respiratory Disorders",
       "m": 32
      }
     ]
    },
    {
     "name": "CARDIOVASCULAR SYSTEM",
     "topics": [
      {
       "s": 24,
       "n": "Fetal Circulation",
       "m": 10
      },
      {
       "s": 25,
       "n": "Acyanotic Congenital Heart Diseases",
       "m": 25
      },
      {
       "s": 26,
       "n": "Cyanotic Congenital Heart Diseases",
       "m": 23
      }
     ]
    },
    {
     "name": "GENITO-URINARY SYSTEM",
     "topics": [
      {
       "s": 27,
       "n": "Paediatric Nephrology",
       "m": 30
      },
      {
       "s": 28,
       "n": "Paediatric Urology",
       "m": 16
      }
     ]
    },
    {
     "name": "NEUROLOGY",
     "topics": [
      {
       "s": 29,
       "n": "Disorders of the Nervous System",
       "m": 32
      }
     ]
    },
    {
     "name": "ENDOCRINE SYSTEM",
     "topics": [
      {
       "s": 30,
       "n": "Disorders of Thyroid",
       "m": 18
      },
      {
       "s": 31,
       "n": "Congenital Adrenal Hyperplasia and Related Disorders",
       "m": 22
      },
      {
       "s": 32,
       "n": "Disorders of the Pituitary Gland",
       "m": 13
      },
      {
       "s": 33,
       "n": "Disorders of Puberty",
       "m": 15
      }
     ]
    },
    {
     "name": "CHILDHOOD MALIGNANCIES",
     "topics": [
      {
       "s": 34,
       "n": "Paediatric Hemato-oncology",
       "m": 24
      },
      {
       "s": 35,
       "n": "Solid Neoplasms of Childhood",
       "m": 34
      }
     ]
    },
    {
     "name": "MUSCULOSKELETAL SYSTEM",
     "topics": [
      {
       "s": 36,
       "n": "Musculoskeletal Disorders",
       "m": 12
      }
     ]
    },
    {
     "name": "PAEDIATRIC RHEUMATOLOGY",
     "topics": [
      {
       "s": 37,
       "n": "Paediatric Rheumatology",
       "m": 15
      }
     ]
    },
    {
     "name": "HEMATOLOGY",
     "topics": [
      {
       "s": 38,
       "n": "Paediatric Hematology - Introduction, Bleeding, and Clotting Disorders",
       "m": 18
      },
      {
       "s": 39,
       "n": "Paediatric Anemias",
       "m": 24
      }
     ]
    }
   ]
  },
  {
   "name": "Orthopedics",
   "id": "orthopaedics",
   "units": [
    {
     "name": "FRACTURE AND ITS COMPLICATIONS",
     "topics": [
      {
       "s": 1,
       "n": "Basics of fracture and its management",
       "m": 19
      },
      {
       "s": 2,
       "n": "Complications of fracture",
       "m": 18
      }
     ]
    },
    {
     "name": "NECK",
     "topics": [
      {
       "s": 3,
       "n": "Regional conditions of neck",
       "m": 14
      }
     ]
    },
    {
     "name": "UPPER LIMB",
     "topics": [
      {
       "s": 4,
       "n": "Injuries of clavicle, shoulder and arm",
       "m": 19
      },
      {
       "s": 5,
       "n": "Injuries of elbow and forearm",
       "m": 18
      },
      {
       "s": 6,
       "n": "Injuries of hand",
       "m": 12
      },
      {
       "s": 7,
       "n": "Regional conditions of the upper limb",
       "m": 12
      }
     ]
    },
    {
     "name": "LOWER LIMB",
     "topics": [
      {
       "s": 8,
       "n": "Dislocations of the Hip joint",
       "m": 12
      },
      {
       "s": 9,
       "n": "Fractures of femur",
       "m": 22
      },
      {
       "s": 10,
       "n": "Injuries of knee, leg and foot",
       "m": 18
      },
      {
       "s": 11,
       "n": "AVN and Regional conditions of lower limb",
       "m": 14
      }
     ]
    },
    {
     "name": "SPINE & PELVIS",
     "topics": [
      {
       "s": 12,
       "n": "Injuries of spine",
       "m": 23
      },
      {
       "s": 13,
       "n": "Regional Conditions of Spine",
       "m": 12
      },
      {
       "s": 14,
       "n": "Spondylolisthesis & IVDP",
       "m": 15
      },
      {
       "s": 15,
       "n": "Injuries of Pelvis",
       "m": 9
      }
     ]
    },
    {
     "name": "BONE AND JOINT INFECTIONS & PEDIATRIC ORTHOPAEDICS",
     "topics": [
      {
       "s": 16,
       "n": "Pyogenic and Tubercular Infections",
       "m": 19
      },
      {
       "s": 17,
       "n": "Congenital and Developmental Conditions of Hip",
       "m": 13
      },
      {
       "s": 18,
       "n": "Congenital deformities of Foot and Skeletal Dysplasias",
       "m": 12
      },
      {
       "s": 19,
       "n": "Metabolic and Endocrine Bone Diseases",
       "m": 13
      }
     ]
    },
    {
     "name": "ARTHRITIS AND DEGENERATIVE DISORDERS",
     "topics": [
      {
       "s": 20,
       "n": "Osteoarthritis",
       "m": 19
      },
      {
       "s": 21,
       "n": "Rheumatoid Arthritis and Ankylosing Spondylitis",
       "m": 11
      },
      {
       "s": 22,
       "n": "Neuropathic Joints and Complex Regional Pain Syndrome",
       "m": 15
      },
      {
       "s": 23,
       "n": "Cerebral Palsy and Poliomyelitis",
       "m": 17
      },
      {
       "s": 24,
       "n": "Miscellaneous Orthopaedic Disorders",
       "m": 15
      },
      {
       "s": 25,
       "n": "Spondyloarthropathies and Crystal arthropathies",
       "m": 13
      }
     ]
    },
    {
     "name": "NERVE INJURIES",
     "topics": [
      {
       "s": 26,
       "n": "Nerve Injuries",
       "m": 18
      }
     ]
    },
    {
     "name": "BONE TUMORS",
     "topics": [
      {
       "s": 27,
       "n": "Benign Tumors Of Bone",
       "m": 29
      },
      {
       "s": 28,
       "n": "Malignant Tumors of Bone",
       "m": 27
      }
     ]
    },
    {
     "name": "INSTRUMENTS, TRAUMA & ADVANCED ORTHOPAEDICS",
     "topics": [
      {
       "s": 29,
       "n": "Implants, splints and traction",
       "m": 14
      },
      {
       "s": 30,
       "n": "Trauma amputations, prosthetics and joint replacement surgery",
       "m": 19
      },
      {
       "s": 31,
       "n": "Sports Injury",
       "m": 10
      }
     ]
    }
   ]
  },
  {
   "name": "Dermatology",
   "id": "dermatology",
   "units": [
    {
     "name": "THE SKIN",
     "topics": [
      {
       "s": 1,
       "n": "Anatomy & Physiology of Skin",
       "m": 25
      }
     ]
    },
    {
     "name": "CLINICAL DERMATOLOGY",
     "topics": [
      {
       "s": 2,
       "n": "Dermatopathology of Skin Lesions",
       "m": 12
      },
      {
       "s": 3,
       "n": "Morphology and Investigations of Skin Lesions",
       "m": 29
      }
     ]
    },
    {
     "name": "ADNEXA AND APPENDAGES",
     "topics": [
      {
       "s": 4,
       "n": "Acne, Rosacea and Others",
       "m": 21
      }
     ]
    },
    {
     "name": "HAIR AND NAILS",
     "topics": [
      {
       "s": 5,
       "n": "Disorders of Hair and Nails",
       "m": 30
      }
     ]
    },
    {
     "name": "SKIN PIGMENTATION",
     "topics": [
      {
       "s": 6,
       "n": "Disorders of Skin Pigmentation",
       "m": 30
      }
     ]
    },
    {
     "name": "ALLERGIC DISORDERS & DERMATITIS",
     "topics": [
      {
       "s": 7,
       "n": "Dermatitis",
       "m": 23
      },
      {
       "s": 8,
       "n": "Urticaria & Angioedema",
       "m": 14
      },
      {
       "s": 9,
       "n": "Reactive Skin Diseases and Drug Eruptions",
       "m": 13
      }
     ]
    },
    {
     "name": "PAPULOSQUAMOUS DISORDERS",
     "topics": [
      {
       "s": 10,
       "n": "Papulosquamous Disorders",
       "m": 15
      },
      {
       "s": 11,
       "n": "Psoriasis",
       "m": 21
      }
     ]
    },
    {
     "name": "VESICULOBULLOUS DISORDERS",
     "topics": [
      {
       "s": 12,
       "n": "Vesiculobullous Diseases",
       "m": 31
      }
     ]
    },
    {
     "name": "SKIN INFECTIONS & INFESTATIONS",
     "topics": [
      {
       "s": 13,
       "n": "Mycobacterial Infections",
       "m": 31
      },
      {
       "s": 14,
       "n": "Bacterial Infections",
       "m": 20
      },
      {
       "s": 15,
       "n": "Viral Infections",
       "m": 22
      },
      {
       "s": 16,
       "n": "Fungal and Protozoal Infections",
       "m": 29
      },
      {
       "s": 17,
       "n": "Arthropod and Parasitic Infections",
       "m": 17
      }
     ]
    },
    {
     "name": "SEXUALLY TRANSMITTED INFECTIONS",
     "topics": [
      {
       "s": 18,
       "n": "Syphilis",
       "m": 16
      },
      {
       "s": 19,
       "n": "Non Syphilitic Sexually Transmitted Diseases",
       "m": 20
      }
     ]
    },
    {
     "name": "GENODERMATOSES & NUTRITIONAL DISORDERS",
     "topics": [
      {
       "s": 20,
       "n": "Genodermatoses & Nutritional Disorders",
       "m": 22
      }
     ]
    },
    {
     "name": "CONNECTIVE TISSUE DISORDERS",
     "topics": [
      {
       "s": 21,
       "n": "Connective Tissue Disorders",
       "m": 21
      }
     ]
    },
    {
     "name": "SKIN MALIGNANCIES",
     "topics": [
      {
       "s": 22,
       "n": "Skin Malignancies",
       "m": 24
      }
     ]
    },
    {
     "name": "SKIN IN SYSTEMIC DISORDERS",
     "topics": [
      {
       "s": 23,
       "n": "Systemic Diseases and Skin",
       "m": 24
      }
     ]
    }
   ]
  },
  {
   "name": "Psychiatry",
   "id": "psychiatry",
   "units": [
    {
     "name": "GENERAL PSYCHIATRY",
     "topics": [
      {
       "s": 1,
       "n": "Signs and Symptoms in Psychiatry",
       "m": 26
      },
      {
       "s": 2,
       "n": "Psychiatric Classification and History Taking",
       "m": 13
      },
      {
       "s": 3,
       "n": "Psychological Theories and Therapies",
       "m": 14
      },
      {
       "s": 4,
       "n": "Psychopharmacology",
       "m": 22
      }
     ]
    },
    {
     "name": "SCHIZOPHRENIA AND OTHER PSYCHOTIC DISORDERS",
     "topics": [
      {
       "s": 5,
       "n": "Schizophrenia - Clinical Features and Diagnosis",
       "m": 14
      },
      {
       "s": 6,
       "n": "Schizophrenia - Treatment and Other Psychotic Disorders",
       "m": 26
      },
      {
       "s": 7,
       "n": "Acute and Transient Psychotic Disorders",
       "m": 10
      }
     ]
    },
    {
     "name": "NEUROCOGNITIVE DISORDERS",
     "topics": [
      {
       "s": 8,
       "n": "Delirium",
       "m": 9
      },
      {
       "s": 9,
       "n": "Dementia",
       "m": 17
      },
      {
       "s": 10,
       "n": "Amnestic Disorders and Other Neurocognitive Disorders",
       "m": 7
      }
     ]
    },
    {
     "name": "MOOD DISORDERS",
     "topics": [
      {
       "s": 11,
       "n": "Depressive Disorders",
       "m": 30
      },
      {
       "s": 12,
       "n": "Bipolar and Related Disorders",
       "m": 14
      }
     ]
    },
    {
     "name": "SUBSTANCE-RELATED DISORDERS",
     "topics": [
      {
       "s": 13,
       "n": "Alcohol-Related Disorders",
       "m": 14
      },
      {
       "s": 14,
       "n": "Other Substance Use Disorders",
       "m": 15
      }
     ]
    },
    {
     "name": "NEUROSIS AND STRESS-RELATED DISORDERS",
     "topics": [
      {
       "s": 15,
       "n": "Anxiety Disorders",
       "m": 14
      },
      {
       "s": 16,
       "n": "Obsessive-Compulsive and Related Disorders",
       "m": 17
      },
      {
       "s": 17,
       "n": "Trauma- and Stressor-Related Disorders",
       "m": 13
      },
      {
       "s": 18,
       "n": "Somatic Symptom and Related Disorders",
       "m": 12
      },
      {
       "s": 19,
       "n": "Dissociative Disorders",
       "m": 7
      }
     ]
    },
    {
     "name": "PHYSIOLOGICAL AND DEVELOPMENTAL DISORDERS",
     "topics": [
      {
       "s": 20,
       "n": "Feeding and Eating Disorders",
       "m": 7
      },
      {
       "s": 21,
       "n": "Sleep-Wake Disorders",
       "m": 10
      },
      {
       "s": 22,
       "n": "Sexual Dysfunctions and Gender Dysphoria",
       "m": 19
      },
      {
       "s": 23,
       "n": "Personality Disorders",
       "m": 13
      },
      {
       "s": 24,
       "n": "Intellectual Disabilities and Autism Spectrum Disorder",
       "m": 7
      },
      {
       "s": 25,
       "n": "ADHD and Other Childhood Disorders",
       "m": 12
      }
     ]
    },
    {
     "name": "SPECIAL TOPICS IN PSYCHIATRY",
     "topics": [
      {
       "s": 26,
       "n": "Suicide and Self-Harm",
       "m": 11
      },
      {
       "s": 27,
       "n": "Psychiatric Emergencies",
       "m": 9
      },
      {
       "s": 28,
       "n": "Forensic Psychiatry and Mental Healthcare Act",
       "m": 9
      },
      {
       "s": 29,
       "n": "Psychiatry in Special Populations",
       "m": 6
      },
      {
       "s": 30,
       "n": "Consultation-Liaison Psychiatry",
       "m": 10
      },
      {
       "s": 31,
       "n": "Community Psychiatry and Rehabilitation",
       "m": 8
      },
      {
       "s": 32,
       "n": "Electroconvulsive Therapy and Neuromodulation",
       "m": 9
      },
      {
       "s": 33,
       "n": "Miscellaneous Conditions in Psychiatry",
       "m": 8
      }
     ]
    }
   ]
  },
  {
   "name": "Anaesthesia",
   "id": "anaesthesia",
   "units": [
    {
     "name": "PREOPERATIVE EVALUATION AND MONITORING",
     "topics": [
      {
       "s": 1,
       "n": "History and Ethical Aspects of Anaesthesia",
       "m": 10
      },
      {
       "s": 2,
       "n": "Preoperative Evaluation",
       "m": 23
      },
      {
       "s": 3,
       "n": "CNS and CVS Monitoring in Anaesthesia",
       "m": 25
      },
      {
       "s": 4,
       "n": "Respiratory Monitoring in Anaesthesia",
       "m": 15
      }
     ]
    },
    {
     "name": "AIRWAY MANAGEMENT AND RESUSCITATION",
     "topics": [
      {
       "s": 5,
       "n": "Airway Devices",
       "m": 12
      },
      {
       "s": 6,
       "n": "Intubation",
       "m": 23
      },
      {
       "s": 7,
       "n": "Breathing Systems",
       "m": 13
      },
      {
       "s": 8,
       "n": "Anaesthesia Workstation",
       "m": 31
      },
      {
       "s": 9,
       "n": "BLS and PALS",
       "m": 20
      },
      {
       "s": 10,
       "n": "ACLS",
       "m": 24
      },
      {
       "s": 11,
       "n": "Ventilation and O2 Delivery Systems",
       "m": 10
      }
     ]
    },
    {
     "name": "MUSCLE RELAXANTS",
     "topics": [
      {
       "s": 12,
       "n": "Depolarising Muscle Relaxants",
       "m": 25
      },
      {
       "s": 13,
       "n": "Non-Depolarising Muscle Relaxants",
       "m": 28
      }
     ]
    },
    {
     "name": "GENERAL ANAESTHESIA",
     "topics": [
      {
       "s": 14,
       "n": "Inhaled Anaesthetics - Properties, N2O and Halothane",
       "m": 25
      },
      {
       "s": 15,
       "n": "Inhaled Anaesthetics - Fluorinated Agents, Inert Agents and Therapeutic Gases",
       "m": 22
      },
      {
       "s": 16,
       "n": "Intravenous Anaesthesia - Barbiturates, Benzodiazepines & Propofol",
       "m": 28
      },
      {
       "s": 17,
       "n": "Intravenous Anaesthesia - Etomidate, Ketamine and Daycare Surgery",
       "m": 27
      }
     ]
    },
    {
     "name": "LOCAL AND REGIONAL ANAESTHESIA",
     "topics": [
      {
       "s": 18,
       "n": "Local Anaesthetics - General Properties",
       "m": 20
      },
      {
       "s": 19,
       "n": "Local Anaesthetics - Specific Drugs",
       "m": 24
      },
      {
       "s": 20,
       "n": "Regional Anaesthesia: Techniques",
       "m": 22
      },
      {
       "s": 21,
       "n": "Regional Anaesthesia: Complications and Contraindications",
       "m": 23
      },
      {
       "s": 22,
       "n": "Peripheral Nerve Blocks",
       "m": 12
      }
     ]
    },
    {
     "name": "ANAESTHESIA IN SPECIFIC CONDITIONS",
     "topics": [
      {
       "s": 23,
       "n": "Anaesthetic Implication of Concurrent Diseases",
       "m": 32
      },
      {
       "s": 24,
       "n": "Paediatric and Obstetric Anaesthesia",
       "m": 26
      }
     ]
    },
    {
     "name": "COMPLICATIONS OF ANAESTHESIA",
     "topics": [
      {
       "s": 25,
       "n": "Complications of Anaesthesia",
       "m": 29
      }
     ]
    }
   ]
  },
  {
   "name": "Radiology",
   "id": "radiology",
   "units": [
    {
     "name": "FUNDAMENTALS OF RADIOLOGY",
     "topics": [
      {
       "s": 1,
       "n": "Fundamentals of Imaging",
       "m": 17
      },
      {
       "s": 2,
       "n": "Radiation - Exposure and Protection",
       "m": 15
      },
      {
       "s": 3,
       "n": "Contrast Media and Patient Preparation",
       "m": 9
      },
      {
       "s": 4,
       "n": "Imaging Modalities - Identification",
       "m": 15
      }
     ]
    },
    {
     "name": "DIAGNOSTIC RADIOLOGY",
     "topics": [
      {
       "s": 5,
       "n": "Basics of Chest Imaging",
       "m": 15
      },
      {
       "s": 6,
       "n": "Chest Imaging - Lung Diseases",
       "m": 25
      },
      {
       "s": 7,
       "n": "Chest Imaging - Pleural and Mediastinal Conditions",
       "m": 12
      },
      {
       "s": 8,
       "n": "Chest Imaging - Cardiovascular Diseases",
       "m": 21
      },
      {
       "s": 9,
       "n": "Neuroimaging - Neurovascular Disorders, Trauma & CT Brain",
       "m": 12
      },
      {
       "s": 10,
       "n": "Neuroimaging - CNS Tumors, Infections & Neurocutaneous Syndromes",
       "m": 20
      },
      {
       "s": 11,
       "n": "Neuroimaging - MRI Brain in Neurodegenerative & Other CNS Disorders",
       "m": 14
      },
      {
       "s": 12,
       "n": "Head and Neck Imaging",
       "m": 6
      },
      {
       "s": 13,
       "n": "GI Imaging - Upper GI Disorders & Pneumoperitoneum",
       "m": 17
      },
      {
       "s": 14,
       "n": "GI Imaging - Lower GI Disorders",
       "m": 18
      },
      {
       "s": 15,
       "n": "Hepatobiliary and Pancreatic Imaging",
       "m": 23
      },
      {
       "s": 16,
       "n": "Renal Imaging",
       "m": 26
      },
      {
       "s": 17,
       "n": "Women's Imaging",
       "m": 15
      },
      {
       "s": 18,
       "n": "Musculoskeletal Imaging",
       "m": 26
      }
     ]
    },
    {
     "name": "RADIONUCLIDE IMAGING AND RADIATION ONCOLOGY",
     "topics": [
      {
       "s": 19,
       "n": "Radionuclide Imaging",
       "m": 21
      },
      {
       "s": 20,
       "n": "Radiotherapy",
       "m": 16
      }
     ]
    },
    {
     "name": "EMERGENCY AND INTERVENTIONAL RADIOLOGY",
     "topics": [
      {
       "s": 21,
       "n": "Emergency and Interventional Radiology",
       "m": 9
      }
     ]
    }
   ]
  }
 ]
};
})();
