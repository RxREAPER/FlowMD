import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

ophthalmology_dataset_js = """    ophthalmology: {
      id: 'ophthalmology',
      name: 'Ophthalmology',
      faculty: 'Dr. Utsav Bansal',
      accentColor: '#06b6d4',
      chapters: [
        {
          id: 'opth_basics_of_ophthalmology',
          name: 'BASICS OF OPHTHALMOLOGY',
          topics: [
            {
              id: 'opth_t1_anatomy_development_eye',
              name: 'Anatomy and Development of Eye',
              rating: 4.4,
              mcqCount: 23,
              isPro: true,
              image: 'ophthalmology',
              questions: [
                {
                  id: 'opth_q1_1',
                  questionNumber: 1,
                  text: 'Which embryological germ layer is primarily responsible for the development of the crystalline lens and corneal epithelium?',
                  options: [
                    { id: 'A', text: 'Surface ectoderm' },
                    { id: 'B', text: 'Neural ectoderm' },
                    { id: 'C', text: 'Neural crest cells' },
                    { id: 'D', text: 'Paraxial mesoderm' }
                  ],
                  correctOption: 'A',
                  explanation: 'Surface ectoderm gives rise to: Lens, Corneal epithelium, Conjunctival epithelium, Lacrimal gland, and Eyelid skin/glands. Neural ectoderm gives rise to: Retina, RPE, Optic nerve, Ciliary body epithelium, and Sphincter/Dilator pupillae muscles.',
                  keyConcept: 'Ocular Embryology: Surface ectoderm -> Lens & Corneal epithelium; Neural ectoderm -> Retina, RPE, Optic nerve, Iris muscles; Neural crest -> Corneal stroma/endothelium, Sclera, Trabecular meshwork.'
                },
                {
                  id: 'opth_q1_2',
                  questionNumber: 2,
                  text: 'What is the average normal anteroposterior (axial) length of the adult human eyeball?',
                  options: [
                    { id: 'A', text: '24 mm' },
                    { id: 'B', text: '20 mm' },
                    { id: 'C', text: '28 mm' },
                    { id: 'D', text: '18 mm' }
                  ],
                  correctOption: 'A',
                  explanation: 'The average adult human eye has an axial length of approximately 24 mm (range: 23-24.5 mm). At birth, the axial length is ~17-18 mm. An increase of 1 mm in axial length corresponds to approximately -3.00 Diopters of axial myopia.',
                  keyConcept: 'Axial Length: Adult eye = 24 mm; Newborn = 17.5 mm. 1 mm change in axial length = ~3 D refractive change.'
                }
              ]
            },
            {
              id: 'opth_t2_elementary_optics_and_physiology_of_vision',
              name: 'Elementary Optics and Physiology of Vision',
              rating: 4.4,
              mcqCount: 30,
              isPro: false,
              image: 'ophthalmology',
              questions: [
                {
                  id: 'opth_q2_1',
                  questionNumber: 1,
                  text: 'What is the total refractive power of the standard Gullstrand schematic relaxed emmetropic human eye, and which anatomical structure contributes the majority (+43 to +45 D)?',
                  options: [
                    { id: 'A', text: '+60 Diopters total; Anterior surface of the Cornea' },
                    { id: 'B', text: '+40 Diopters total; Crystalline Lens' },
                    { id: 'C', text: '+75 Diopters total; Vitreous humor' },
                    { id: 'D', text: '+50 Diopters total; Posterior corneal surface' }
                  ],
                  correctOption: 'A',
                  explanation: 'Total refractive power of the emmetropic eye is +60 Diopters (Gullstrand model). The Cornea contributes ~+43 to +45 D (over 70% of total convergence power due to the large refractive index difference between air 1.0 and corneal tear film 1.376). The relaxed crystalline lens contributes the remaining ~+15 to +18 D.',
                  keyConcept: 'Ocular Optics: Total eye power = +60 D (Cornea = +43 to +45 D; Lens = +15 to +18 D).'
                }
              ]
            }
          ]
        },
        {
          id: 'opth_errors_in_optics',
          name: 'ERRORS IN OPTICS',
          topics: [
            {
              id: 'opth_t3_myopia_and_hypermetropia',
              name: 'Myopia and Hypermetropia',
              rating: 4.5,
              mcqCount: 21,
              isPro: false,
              image: 'ophthalmology',
              questions: [
                {
                  id: 'opth_q3_1',
                  questionNumber: 1,
                  text: 'A 14-year-old school student complains of blurred distant vision but clear near vision. Retinoscopy reveals parallel rays of light from infinity are focused anterior to the retina with accommodation relaxed. What type of lens is used for optical correction?',
                  options: [
                    { id: 'A', text: 'Concave spherical lens (minus / diverging lens)' },
                    { id: 'B', text: 'Convex spherical lens (plus / converging lens)' },
                    { id: 'C', text: 'Cylindrical lens with axis at 90 degrees' },
                    { id: 'D', text: 'Prismatic lens base-in' }
                  ],
                  correctOption: 'A',
                  explanation: 'Myopia (short-sightedness) occurs when light rays focus in front of the neurosensory retina due to excessive axial length or increased corneal/lenticular curvature. It is optically neutralized using a diverging concave spherical lens (minus lens) to diverge incoming rays and move the focal point back onto the retina.',
                  keyConcept: 'Refractive Errors: Myopia = Focus in front of retina (Corrected by Concave/Minus lens); Hypermetropia = Focus behind retina (Corrected by Convex/Plus lens).'
                }
              ]
            },
            {
              id: 'opth_t4_astigmatism_and_errors_of_accomodation',
              name: 'Astigmatism and Errors of Accomodation',
              rating: 4.6,
              mcqCount: 20,
              isPro: true,
              image: 'ophthalmology',
              questions: [
                {
                  id: 'opth_q4_1',
                  questionNumber: 1,
                  text: 'In With-the-Rule (WTR) astigmatism, which corneal meridian possesses the greatest curvature and refractive power?',
                  options: [
                    { id: 'A', text: 'Vertical meridian (90° +/- 30°)' },
                    { id: 'B', text: 'Horizontal meridian (180° +/- 30°)' },
                    { id: 'C', text: 'Oblique meridian (45°)' },
                    { id: 'D', text: 'Oblique meridian (135°)' }
                  ],
                  correctOption: 'A',
                  explanation: 'With-the-rule (WTR) astigmatism is the most common physiological type where the vertical meridian is steeper and has greater refractive power than the horizontal meridian (pressure from upper eyelid). Corrected by a plus cylinder at 90° or minus cylinder at 180°.',
                  keyConcept: 'Astigmatism: With-the-rule = Vertical meridian steeper; Against-the-rule = Horizontal meridian steeper (common in elderly).'
                }
              ]
            }
          ]
        },
        {
          id: 'opth_conjunctiva',
          name: 'CONJUNCTIVA',
          topics: [
            {
              id: 'opth_t5_conjunctiva',
              name: 'Conjunctiva',
              rating: 4.4,
              mcqCount: 29,
              isPro: true,
              image: 'ophthalmology',
              questions: [
                {
                  id: 'opth_q5_1',
                  questionNumber: 1,
                  text: 'Which pathognomonic clinical feature on the upper palpebral conjunctiva and limbus is characteristic of Spring Catarrh (Vernal Keratoconjunctivitis / VKC)?',
                  options: [
                    { id: 'A', text: 'Cobblestone / Giant papillae on upper tarsus and Horner-Trantas dots at the limbus' },
                    { id: 'B', text: 'Arlt line on lower palpebral conjunctiva' },
                    { id: 'C', text: 'Herbert pits at the upper limbus' },
                    { id: 'D', text: 'Koplik spots on bulbar conjunctiva' }
                  ],
                  correctOption: 'A',
                  explanation: 'Vernal Keratoconjunctivitis (VKC / Spring catarrh) is an IgE and cell-mediated allergic conjunctivitis in young boys presenting with intense itching, ropy discharge, "cobblestone" giant papillae on the upper tarsal conjunctiva (palpebral form), and Horner-Trantas dots (gelatinous eosinophil/epithelial cell clumps) at the limbus (bulbar form).',
                  keyConcept: 'VKC (Spring Catarrh): Cobblestone giant papillae + Horner-Trantas dots + Shield ulcers. Rx: Dual acting mast cell stabilizer + antihistamine (Olopatadine), brief pulse topical steroids for flares.'
                }
              ]
            }
          ]
        },
        {
          id: 'opth_sclera',
          name: 'SCLERA',
          topics: [
            {
              id: 'opth_t6_sclera',
              name: 'Sclera',
              rating: 4.4,
              mcqCount: 15,
              isPro: true,
              image: 'ophthalmology',
              questions: [
                {
                  id: 'opth_q6_1',
                  questionNumber: 1,
                  text: 'Which clinical sign reliably differentiates deep necrotizing Scleritis from superficial Episcleritis during slit-lamp biomicroscopy?',
                  options: [
                    { id: 'A', text: 'Failure of deep vascular engorgement to blanch following topical 10% phenylephrine instillation, accompanied by severe boring nocturnal pain' },
                    { id: 'B', text: 'Complete rapid blanching of red vessels with 2.5% phenylephrine within 15 minutes' },
                    { id: 'C', text: 'Painless mobile conjunctival vessel displacement with a cotton swab' },
                    { id: 'D', text: 'Presence of corneal dendritic ulcers' }
                  ],
                  correctOption: 'A',
                  explanation: 'Phenylephrine 10% test blanches the superficial episcleral vascular plexus in Episcleritis but fails to blanch the deep episcleral/scleral plexus in Scleritis. Scleritis is characterized by severe, boring ocular pain radiating to the brow/jaw and is strongly associated with systemic autoimmune diseases (Rheumatoid Arthritis, Granulomatosis with Polyangiitis).',
                  keyConcept: 'Scleritis vs Episcleritis: Scleritis = Severe boring pain + 10% Phenylephrine does NOT blanch deep plexus + systemic collagen vascular disease (RA #1). Episcleritis = Mild discomfort + Phenylephrine blanches.'
                }
              ]
            }
          ]
        },
        {
          id: 'opth_cornea',
          name: 'CORNEA',
          topics: [
            {
              id: 'opth_t7_basics_cornea_infectious_keratitis',
              name: 'Basics of Cornea and Infectious Keratitis',
              rating: 4.5,
              mcqCount: 25,
              isPro: true,
              image: 'ophthalmology',
              questions: [
                {
                  id: 'opth_q7_1',
                  questionNumber: 1,
                  text: 'A 45-year-old agricultural laborer presents with eye pain, photophobia, and blurred vision 5 days after trauma with vegetative matter (sugarcane leaf). Slit-lamp examination shows a dry, elevated corneal ulcer with feathery hyphated margins, satellite lesions, and an immobile hypopyon. What is the diagnosis and topical drug of choice?',
                  options: [
                    { id: 'A', text: 'Fungal Keratitis (Mycotic corneal ulcer); Topical Natamycin 5% suspension' },
                    { id: 'B', text: 'Bacterial Keratitis; Topical Moxifloxacin 0.5%' },
                    { id: 'C', text: 'Herpes Simplex Keratitis; Topical Acyclovir 3% ointment' },
                    { id: 'D', text: 'Acanthamoeba Keratitis; Topical Polyhexamethylene biguanide (PHMB)' }
                  ],
                  correctOption: 'A',
                  explanation: 'Trauma with vegetative matter leading to a dry, grayish-white ulcer with feathery/crenated margins, satellite infiltrates, and thick, fixed hypopyon is pathognomonic for Fungal Keratitis (commonly Fusarium or Aspergillus). First-line antifungal of choice for filamentous fungal keratitis is Natamycin 5% topical suspension.',
                  keyConcept: 'Fungal Corneal Ulcer: Vegetative trauma -> Feathery borders + Satellite lesions + Fixed hypopyon. Rx: Natamycin 5% suspension (1st line) or Voriconazole 1%.'
                }
              ]
            },
            {
              id: 'opth_t8_non_infectious_disorders_of_cornea',
              name: 'Non-infectious Disorders of Cornea',
              rating: 4.4,
              mcqCount: 26,
              isPro: false,
              image: 'ophthalmology',
              questions: [
                {
                  id: 'opth_q8_1',
                  questionNumber: 1,
                  text: 'Which clinical and topographical signs are classic hallmarks of progressive Keratoconus?',
                  options: [
                    { id: 'A', text: 'Munson sign, Fleischer iron ring, Vogt striae, and scissors reflex on retinoscopy' },
                    { id: 'B', text: 'Arlt line, Herbert pits, and pannus' },
                    { id: 'C', text: 'Krukenberg spindle and iris transillumination' },
                    { id: 'D', text: 'Kayser-Fleischer ring and sunflower cataract' }
                  ],
                  correctOption: 'A',
                  explanation: 'Keratoconus is a bilateral, progressive non-inflammatory ectasia of the cornea. Classic signs include: Fleischer ring (epithelial iron deposition at the base of the cone), Vogt striae (fine vertical tension lines in deep stroma), Munson sign (V-shaped indentation of lower lid on downgaze), and scissors reflex on shadow test. Corneal collagen cross-linking (C3R) halts progression.',
                  keyConcept: 'Keratoconus Hallmarks: Munson sign + Fleischer ring (iron) + Vogt striae + Irregular astigmatism. Treatment: C3R to halt progression; RGP/Scleral contact lenses for visual rehab; Penetrating/Deep anterior lamellar keratoplasty (DALK) for advanced scarring.'
                }
              ]
            }
          ]
        },
        {
          id: 'opth_retina_and_vitreous',
          name: 'RETINA AND VITREOUS',
          topics: [
            {
              id: 'opth_t9_retinal_vascular_disorders_detachment',
              name: 'Retinal vascular disorders and Retinal detachment',
              rating: 4.4,
              mcqCount: 35,
              isPro: false,
              image: 'ophthalmology',
              questions: [
                {
                  id: 'opth_q9_1',
                  questionNumber: 1,
                  text: 'A 65-year-old hypertensive male awakens with sudden, painless, complete loss of vision in his right eye. Fundoscopy reveals a milky-white edematous retina with a prominent "Cherry-Red Spot" at the fovea and segmentation of blood columns ("cattle-trucking"). What is the diagnosis?',
                  options: [
                    { id: 'A', text: 'Central Retinal Artery Occlusion (CRAO)' },
                    { id: 'B', text: 'Central Retinal Vein Occlusion (CRVO / "Blood and thunder" fundus)' },
                    { id: 'C', text: 'Rhegmatogenous Retinal Detachment' },
                    { id: 'D', text: 'Non-arteritic Anterior Ischemic Optic Neuropathy (NAION)' }
                  ],
                  correctOption: 'A',
                  explanation: 'Sudden, painless, catastrophic unilateral visual loss with a milky-white ischemic retina and cherry-red spot at the fovea (where thin foveola allows underlying vascular choroid to show through) is diagnostic of Central Retinal Artery Occlusion (CRAO). True ophthalmic emergency (irreversible retinal necrosis occurs within 90-100 minutes of ischemia).',
                  keyConcept: 'Retinal Vascular Emergencies: CRAO = Milky white retina + Cherry-red spot + Cattle-trucking; CRVO = "Blood & Thunder" fundus (diffuse flame hemorrhages, disc edema, cotton wool spots).'
                }
              ]
            },
            {
              id: 'opth_t10_macular_disorders_dystrophies_vitreal',
              name: 'Macular disorders, Retinal dystrophies, and Vitreal disorders',
              rating: 4.4,
              mcqCount: 31,
              isPro: false,
              image: 'ophthalmology',
              questions: [
                {
                  id: 'opth_q10_1',
                  questionNumber: 1,
                  text: 'Which visual electrophysiological test is the gold standard diagnostic modality for confirming Retinitis Pigmentosa even before fundoscopic bone-spicule pigmentary changes become visible?',
                  options: [
                    { id: 'A', text: 'Full-field Electroretinogram (ERG - shows flat / extinguished scotopic rod response)' },
                    { id: 'B', text: 'Visual Evoked Potential (VEP)' },
                    { id: 'C', text: 'Electrooculogram (EOG)' },
                    { id: 'D', text: 'Optical Coherence Tomography Angiography (OCTA)' }
                  ],
                  correctOption: 'A',
                  explanation: 'Retinitis Pigmentosa (RP) is a progressive hereditary rod-cone dystrophy presenting with nyctalopia (night blindness) and concentric visual field constriction ("tunnel vision"). Full-field ERG is the gold standard investigation, showing a markedly reduced or flat (extinguished) scotopic rod response early in the disease.',
                  keyConcept: 'Retinitis Pigmentosa: Nyctalopia + Bone-spicule pigmentation + Waxy disc pallor + Attenuated retinal vessels. Diagnostic Gold Standard: Full-field ERG (Extinguished/Flat response).'
                }
              ]
            }
          ]
        },
        {
          id: 'opth_lens',
          name: 'LENS',
          topics: [
            {
              id: 'opth_t11_lens_cataract_types_features',
              name: 'Lens - Introduction, Types of Cataract and Clinical Features',
              rating: 4.6,
              mcqCount: 23,
              isPro: true,
              image: 'ophthalmology',
              questions: [
                {
                  id: 'opth_q11_1',
                  questionNumber: 1,
                  text: 'Which morphological subtype of cataract is classically associated with long-term systemic or topical corticosteroid therapy and causes profound glare / diminished vision in bright sunlight?',
                  options: [
                    { id: 'A', text: 'Posterior Subcapsular Cataract (PSC)' },
                    { id: 'B', text: 'Nuclear sclerotic cataract' },
                    { id: 'C', text: 'Cortical cuneiform cataract' },
                    { id: 'D', text: 'Anterior polar cataract' }
                  ],
                  correctOption: 'A',
                  explanation: 'Posterior Subcapsular Cataract (PSC) is located right in front of the posterior lens capsule at the nodal point of the optical system. It causes disproportionate visual handicap and glare in bright sunlight due to pupillary constriction. It is the classic cataract induced by corticosteroids, radiation, and chronic uveitis.',
                  keyConcept: 'Cataract Associations: Steroids / Chronic Uveitis = Posterior Subcapsular Cataract; Diabetes mellitus = "Snowflake" cataract; Wilson disease = "Sunflower" cataract; Myotonic dystrophy = "Christmas tree" cataract.'
                }
              ]
            },
            {
              id: 'opth_t12_lens_cataract_surgery_complications_iols',
              name: 'Lens - Cataract Surgery, Complications and IOLs',
              rating: 4.6,
              mcqCount: 22,
              isPro: true,
              image: 'ophthalmology',
              questions: [
                {
                  id: 'opth_q12_1',
                  questionNumber: 1,
                  text: 'What is the single most common late complication of modern Phacoemulsification with in-the-bag intraocular lens (IOL) implantation, and what is its non-invasive office management?',
                  options: [
                    { id: 'A', text: 'Posterior Capsule Opacification (PCO / "After-cataract"); Nd:YAG Laser Capsulotomy' },
                    { id: 'B', text: 'Pseudophakic bullous keratopathy; Penetrating keratoplasty' },
                    { id: 'C', text: 'Endophthalmitis; Intravitreal vancomycin' },
                    { id: 'D', text: 'IOL dislocation; Pars plana vitrectomy' }
                  ],
                  correctOption: 'A',
                  explanation: 'Posterior Capsule Opacification (PCO) occurs in 20-40% of patients months-to-years after cataract surgery due to proliferation and migration of residual lens epithelial cells (Elschnig pearls / Soemmerring ring). The gold standard, non-invasive definitive treatment is Nd:YAG Laser Capsulotomy.',
                  keyConcept: 'PCO (After-cataract): Elschnig pearls/fibrosis on posterior capsule. Definitive treatment: Nd:YAG Laser Capsulotomy (complications: IOP spike, retinal detachment, IOL pitting).'
                }
              ]
            }
          ]
        },
        {
          id: 'opth_glaucoma',
          name: 'GLAUCOMA',
          topics: [
            {
              id: 'opth_t13_glaucoma',
              name: 'Glaucoma',
              rating: 4.5,
              mcqCount: 34,
              isPro: false,
              image: 'ophthalmology',
              questions: [
                {
                  id: 'opth_q13_1',
                  questionNumber: 1,
                  text: 'Which class of topical ocular hypotensive agents is considered first-line medical therapy for Primary Open-Angle Glaucoma (POAG) due to once-daily dosing and maximum IOP reduction via uveoscleral outflow enhancement?',
                  options: [
                    { id: 'A', text: 'Prostaglandin Analogs (e.g., Latanoprost, Bimatoprost, Travoprost)' },
                    { id: 'B', text: 'Beta-blockers (Timolol maleate 0.5%)' },
                    { id: 'C', text: 'Carbonic anhydrase inhibitors (Dorzolamide)' },
                    { id: 'D', text: 'Cholinergic agonists (Pilocarpine)' }
                  ],
                  correctOption: 'A',
                  explanation: 'Prostaglandin F2-alpha analogs (Latanoprost 0.005%, Bimatoprost, Travoprost) are the first-line pharmacotherapy for POAG. They lower IOP by 25-35% primarily by remodeling the extracellular matrix of the ciliary muscle to enhance unconventional (uveoscleral) outflow. Side effects include iris hyperpigmentation, eyelash hypertrichosis, and periorbital fat atrophy.',
                  keyConcept: 'Glaucoma Pharmacology: Prostaglandin analogs = Increase Uveoscleral outflow (#1 1st line); Beta-blockers / CAIs / Alpha-2 agonists = Decrease Aqueous production; Pilocarpine = Increases Trabecular outflow via ciliary muscle contraction.'
                }
              ]
            }
          ]
        },
        {
          id: 'opth_uveal_tract',
          name: 'UVEAL TRACT',
          topics: [
            {
              id: 'opth_t14_uveitis_anterior_and_intermediate',
              name: 'Uveitis - Anterior and Intermediate',
              rating: 4.5,
              mcqCount: 18,
              isPro: true,
              image: 'ophthalmology',
              questions: [
                {
                  id: 'opth_q14_1',
                  questionNumber: 1,
                  text: 'Which systemic human leukocyte antigen (HLA) allele is most strongly linked with acute recurrent non-granulomatous anterior uveitis and seronegative spondyloarthropathies (Ankylosing Spondylitis)?',
                  options: [
                    { id: 'A', text: 'HLA-B27' },
                    { id: 'B', text: 'HLA-B51' },
                    { id: 'C', text: 'HLA-A29' },
                    { id: 'D', text: 'HLA-DR4' }
                  ],
                  correctOption: 'A',
                  explanation: 'HLA-B27 is associated with >50% of acute anterior uveitis (iritis/iridocyclitis), frequently presenting in young males with Ankylosing Spondylitis, Reactive Arthritis (Reiter syndrome), Psoriatic arthritis, or Inflammatory Bowel Disease.',
                  keyConcept: 'HLA & Uveitis Associations: HLA-B27 = Acute Anterior Uveitis / Ankylosing Spondylitis; HLA-B51 = Behçet disease; HLA-A29 = Birdshot chorioretinopathy; HLA-DR4 = Vogt-Koyanagi-Harada (VKH) syndrome.'
                }
              ]
            },
            {
              id: 'opth_t15_uveitis_posterior_and_panuveitis',
              name: 'Uveitis - Posterior and Panuveitis',
              rating: 4.5,
              mcqCount: 16,
              isPro: true,
              image: 'ophthalmology',
              questions: [
                {
                  id: 'opth_q15_1',
                  questionNumber: 1,
                  text: 'A 28-year-old patient presents with floaters and blurred vision. Fundoscopy reveals a focal creamy-yellow active necrotizing retinochoroiditis lesion adjacent to an old pigmented chorioretinal scar, with dense overlying vitritis producing a "Headlight in the Fog" appearance. What is the etiology?',
                  options: [
                    { id: 'A', text: 'Ocular Toxoplasmosis (Toxoplasma gondii)' },
                    { id: 'B', text: 'Cytomegalovirus (CMV) retinitis' },
                    { id: 'C', text: 'Ocular Histoplasmosis syndrome' },
                    { id: 'D', text: 'Acute Retinal Necrosis (HSV-1)' }
                  ],
                  correctOption: 'A',
                  explanation: 'Ocular Toxoplasmosis is the most common cause of infectious posterior uveitis worldwide. It typically presents as a recurrence at the border of a congenital pigmented chorioretinal scar, showing active focal necrotizing retinitis with severe overlying vitreous haze ("headlight in the fog"). Standard treatment: Pyrimethamine + Sulfadiazine + Folinic acid + oral steroids.',
                  keyConcept: 'Ocular Toxoplasmosis: Focal necrotizing retinitis adjacent to old scar + "Headlight in the fog" vitritis. Rx: Pyrimethamine + Sulfadiazine + Folinic acid.'
                }
              ]
            }
          ]
        },
        {
          id: 'opth_lid_and_lacrimal_apparatus',
          name: 'LID AND LACRIMAL APPARATUS',
          topics: [
            {
              id: 'opth_t16_disorders_of_the_eyelid',
              name: 'Disorders of the Eyelid',
              rating: 4.4,
              mcqCount: 22,
              isPro: false,
              image: 'ophthalmology',
              questions: [
                {
                  id: 'opth_q16_1',
                  questionNumber: 1,
                  text: 'A Chalazion is a chronic, non-tender, sterile lipogranulomatous inflammatory swelling caused by obstruction of which eyelid glands?',
                  options: [
                    { id: 'A', text: 'Meibomian glands (modified tarsal sebaceous glands)' },
                    { id: 'B', text: 'Glands of Zeis (sebaceous ciliary glands)' },
                    { id: 'C', text: 'Glands of Moll (modified apocrine sweat glands)' },
                    { id: 'D', text: 'Glands of Krause (accessory lacrimal glands)' }
                  ],
                  correctOption: 'A',
                  explanation: 'A Chalazion (tarsal cyst) is a chronic sterile granulomatous inflammation of a Meibomian gland resulting from ductal obstruction and retention of sebum. In contrast, External Hordeolum (Stye) is an acute suppurative staphylococcal infection of a Zeis or Moll gland at the eyelid margin.',
                  keyConcept: 'Eyelid Lumps: Chalazion = Chronic painless granuloma of Meibomian gland (Rx: Warm compress -> Incision & Curettage through tarsal conjunctiva vertically); External Hordeolum (Stye) = Acute painful abscess of Gland of Zeis/Moll.'
                }
              ]
            },
            {
              id: 'opth_t17_disorders_of_lacrimal_apparatus_and_glands',
              name: 'Disorders of Lacrimal Apparatus and Glands of the Eye',
              rating: 4.6,
              mcqCount: 18,
              isPro: true,
              image: 'ophthalmology',
              questions: [
                {
                  id: 'opth_q17_1',
                  questionNumber: 1,
                  text: 'What is the single most common site of congenital nasolacrimal duct obstruction causing tearing and mucoid discharge in neonates and infants?',
                  options: [
                    { id: 'A', text: 'Valve of Hasner (at inferior meatus opening)' },
                    { id: 'B', text: 'Valve of Rosenmüller' },
                    { id: 'C', text: 'Common canaliculus' },
                    { id: 'D', text: 'Lacrimal sac fundus' }
                  ],
                  correctOption: 'A',
                  explanation: 'Congenital Nasolacrimal Duct Obstruction (CNLDO) is most commonly caused by non-canalization/imperforation of the membrane (Valve of Hasner) at the lower end of the nasolacrimal duct where it enters the inferior meatus. Initial management is Crigler hydrostatic massage (downward pressure over sac); >90% resolve spontaneously by 1 year of age.',
                  keyConcept: 'Congenital NLDO: Membrane over Valve of Hasner (#1 site). Management: Crigler lacrimal sac massage x 1 year -> Lacrimal probing (if persists > 12-18 months) -> DCR if failed.'
                }
              ]
            }
          ]
        },
        {
          id: 'opth_orbit',
          name: 'ORBIT',
          topics: [
            {
              id: 'opth_t18_orbit_anatomy_and_ocular_injuries',
              name: 'Orbit Anatomy and Ocular Injuries',
              rating: 4.5,
              mcqCount: 14,
              isPro: false,
              image: 'ophthalmology',
              questions: [
                {
                  id: 'opth_q18_1',
                  questionNumber: 1,
                  text: 'Which wall of the bony orbit is most commonly fractured in a classic "Blowout fracture" of the orbit following blunt trauma from a cricket or tennis ball?',
                  options: [
                    { id: 'A', text: 'Orbital floor (maxillary bone medial to infraorbital groove) followed by medial wall (lamina papyracea)' },
                    { id: 'B', text: 'Orbital roof (frontal bone)' },
                    { id: 'C', text: 'Lateral orbital wall (zygomatic bone)' },
                    { id: 'D', text: 'Lesser wing of sphenoid' }
                  ],
                  correctOption: 'A',
                  explanation: 'In a hydraulic blowout fracture, increased intraorbital pressure fractures the weakest bones: the Orbital Floor (maxillary bone, postero-medial to infraorbital canal) and the Medial Wall (thin lamina papyracea of ethmoid). Classic findings: Enophthalmos, Diplopia on upgaze (inferior rectus and orbital fat entrapment), and numbness over cheek/upper lip (infraorbital nerve hypoesthesia).',
                  keyConcept: 'Blowout Fracture: Floor (#1) and Medial wall (#2) fracture. Triad: Enophthalmos + Diplopia on upgaze (Inferior rectus entrapment) + Infraorbital nerve anesthesia.'
                }
              ]
            },
            {
              id: 'opth_t19_diseases_of_the_orbit',
              name: 'Diseases of the Orbit',
              rating: 4.5,
              mcqCount: 22,
              isPro: true,
              image: 'ophthalmology',
              questions: [
                {
                  id: 'opth_q19_1',
                  questionNumber: 1,
                  text: 'Which is the single most common cause of both unilateral and bilateral proptosis (exophthalmos) in adult patients?',
                  options: [
                    { id: 'A', text: 'Thyroid Eye Disease (Graves Orbitopathy / Thyroid-associated ophthalmopathy)' },
                    { id: 'B', text: 'Orbital Cavernous Hemangioma' },
                    { id: 'C', text: 'Orbital pseudotumor (Idiopathic orbital inflammation)' },
                    { id: 'D', text: 'Carotid-cavernous fistula' }
                  ],
                  correctOption: 'A',
                  explanation: 'Thyroid Eye Disease (TED / Graves Orbitopathy) is the #1 cause of both unilateral and bilateral proptosis in adults. Autoantibodies against TSH receptors stimulate orbital fibroblasts to produce glycosaminoglycans, causing dramatic muscle belly enlargement with tendon sparing (Inferior rectus > Medial rectus > Superior rectus > Lateral rectus - "I M SLOW").',
                  keyConcept: 'Thyroid Eye Disease: #1 cause of adult proptosis. Extraocular muscle involvement: Inferior > Medial > Superior > Lateral rectus ("I M SLOW"). Tendons are spared (unlike idiopathic orbital myositis).'
                }
              ]
            }
          ]
        },
        {
          id: 'opth_specific_disorders_of_the_eye',
          name: 'SPECIFIC DISORDERS OF THE EYE',
          topics: [
            {
              id: 'opth_t20_strabismus_intro_symptomatology_evaluation',
              name: 'Strabismus - Introduction, Symptomatology, and Evaluation',
              rating: 4.4,
              mcqCount: 21,
              isPro: true,
              image: 'ophthalmology',
              questions: [
                {
                  id: 'opth_q20_1',
                  questionNumber: 1,
                  text: 'On Hirschberg corneal reflex testing, corneal light reflection falls on the temporal pupillary margin in the deviating eye. What is the approximate degree and direction of strabismus?',
                  options: [
                    { id: 'A', text: '15 degrees (approx 30 prism diopters) of Esotropia (convergent squint)' },
                    { id: 'B', text: '15 degrees of Exotropia (divergent squint)' },
                    { id: 'C', text: '45 degrees of Hypertropia' },
                    { id: 'D', text: 'Orthophoria' }
                  ],
                  correctOption: 'A',
                  explanation: 'Hirschberg corneal reflection test: Each 1 mm of displacement from the pupillary center corresponds to approx 7-8 degrees (15 prism diopters) of deviation. If the reflex is at the temporal pupillary border (2 mm displacement), it indicates ~15 degrees (~30 PD) of Esotropia (eye is turned inwards, displacing the light reflex temporally).',
                  keyConcept: 'Hirschberg Test: Temporal reflex = Esotropia (inward eye); Nasal reflex = Exotropia (outward eye). 1 mm displacement ~ 7-8 degrees ~ 15 Prism Diopters.'
                }
              ]
            },
            {
              id: 'opth_t21_strabismus_types_and_treatment',
              name: 'Strabismus - Types and Treatment',
              rating: 4.5,
              mcqCount: 25,
              isPro: true,
              image: 'ophthalmology',
              questions: [
                {
                  id: 'opth_q21_1',
                  questionNumber: 1,
                  text: 'A 3-year-old child presents with intermittent crossing of the eyes when focusing on near toys. Cycloplegic refraction with 1% atropine reveals +4.50 D hypermetropia in both eyes. Full spectacle correction completely eliminates the esotropia. What is the diagnosis?',
                  options: [
                    { id: 'A', text: 'Fully Accommodative Esotropia' },
                    { id: 'B', text: 'Infantile (Congenital) Esotropia' },
                    { id: 'C', text: 'Paralytic 6th cranial nerve palsy' },
                    { id: 'D', text: 'Sensory deprivation esotropia' }
                  ],
                  correctOption: 'A',
                  explanation: 'Accommodative Esotropia is caused by excessive accommodation to overcome uncorrected hypermetropia, which triggers excessive accommodative convergence via the AC/A ratio. In fully accommodative esotropia, full optical correction of hypermetropia completely straightens the ocular alignment.',
                  keyConcept: 'Accommodative Esotropia: Caused by uncorrected hypermetropia (+4 to +6 D). Treatment is full cycloplegic optical correction (glasses), NOT surgery.'
                }
              ]
            },
            {
              id: 'opth_t22_disorders_visual_pathway_pupillary_reflexes',
              name: 'Disorders of Visual Pathway and Pupillary Reflexes',
              rating: 4.4,
              mcqCount: 24,
              isPro: false,
              image: 'ophthalmology',
              questions: [
                {
                  id: 'opth_q22_1',
                  questionNumber: 1,
                  text: 'Which visual field defect is characteristically produced by a pituitary macroadenoma compressing the center of the optic chiasm from below?',
                  options: [
                    { id: 'A', text: 'Bitemporal Hemianopia (superior bitemporal quadrantinopia initially)' },
                    { id: 'B', text: 'Homonymous Hemianopia' },
                    { id: 'C', text: 'Homonymous Superior Quadrantinopia ("Pie in the sky")' },
                    { id: 'D', text: 'Central scotoma in one eye only' }
                  ],
                  correctOption: 'A',
                  explanation: 'The crossing nasal retinal fibers (which perceive the temporal visual field) decussate in the central optic chiasm. Compression of the chiasm from below (e.g., Pituitary Adenoma) damages these fibers, producing Bitemporal Hemianopia (typically beginning in the upper temporal quadrants).',
                  keyConcept: 'Visual Field Defects: Optic Chiasm = Bitemporal Hemianopia (Pituitary adenoma from below; Craniopharyngioma from above); Optic Tract / Radiations = Contralateral Homonymous Hemianopia; Temporal lobe (Meyer loop) = "Pie in the sky"; Parietal lobe = "Pie on the floor".'
                }
              ]
            },
            {
              id: 'opth_t23_disorders_optic_nerve_gaze_palsies',
              name: 'Disorders of Optic Nerve and Gaze Palsies',
              rating: 4.5,
              mcqCount: 27,
              isPro: true,
              image: 'ophthalmology',
              questions: [
                {
                  id: 'opth_q23_1',
                  questionNumber: 1,
                  text: 'A 26-year-old female presents with subacute unilateral painful loss of vision that worsens with eye movements, reduced color vision (red desaturation), and a Marcus Gunn pupil (Relative Afferent Pupillary Defect / RAPD). Fundus appears completely normal. What is the diagnosis and classic MRI brain association?',
                  options: [
                    { id: 'A', text: 'Retrobulbar Neuritis (Optic Neuritis); Multiple Sclerosis (periventricular demyelinating plaques)' },
                    { id: 'B', text: 'Papilledema; Idiopathic intracranial hypertension' },
                    { id: 'C', text: 'Anterior Ischemic Optic Neuropathy; Giant Cell Arteritis' },
                    { id: 'D', text: 'Leber Hereditary Optic Neuropathy; Mitochondrial DNA mutation' }
                  ],
                  correctOption: 'A',
                  explanation: 'Retrobulbar Neuritis presents with painful visual loss, red desaturation, Marcus Gunn pupil (RAPD), and a normal optic disc ("patient sees nothing and doctor sees nothing"). It is strongly associated with demyelinating disease (Multiple Sclerosis). According to the ONTT trial, treatment is IV Methylprednisolone (1 g/day x 3 days) followed by oral prednisone taper. Oral prednisone alone is contraindicated due to high recurrence rates.',
                  keyConcept: 'Optic Neuritis: Pain on eye movement + Marcus Gunn pupil + Red desaturation. Strongly linked to Multiple Sclerosis. ONTT Rule: IV Methylprednisolone accelerates visual recovery; Oral steroids alone increase recurrence.'
                }
              ]
            },
            {
              id: 'opth_t24_tumors_of_eye',
              name: 'Tumors of Eye',
              rating: 4.4,
              mcqCount: 18,
              isPro: true,
              image: 'ophthalmology',
              questions: [
                {
                  id: 'opth_q24_1',
                  questionNumber: 1,
                  text: 'What is the most common primary intraocular malignant tumor of childhood, and what is its classic presenting sign?',
                  options: [
                    { id: 'A', text: 'Retinoblastoma; Leukocoria ("Amaurotic cat’s eye" white pupillary reflex in 60%)' },
                    { id: 'B', text: 'Uveal Melanoma; Proptosis' },
                    { id: 'C', text: 'Medulloepithelioma; Microphthalmos' },
                    { id: 'D', text: 'Capillary hemangioma; Strabismus only' }
                  ],
                  correctOption: 'A',
                  explanation: 'Retinoblastoma (RB1 tumor suppressor gene mutation on chromosome 13q14) is the most common primary pediatric intraocular malignancy. The most common presenting sign is Leukocoria (white pupillary reflex, 60%), followed by Strabismus (20%). Histology reveals Flexner-Wintersteiner rosettes and Homer Wright rosettes with calcification.',
                  keyConcept: 'Retinoblastoma: RB1 gene (13q14). Most common sign = Leukocoria (#1) & Strabismus (#2). Histology = Flexner-Wintersteiner rosettes (photoreceptor differentiation) & calcification.'
                }
              ]
            }
          ]
        },
        {
          id: 'opth_practical_ophthalmology',
          name: 'PRACTICAL OPHTHALMOLOGY',
          topics: [
            {
              id: 'opth_t25_practical_ophthalmology',
              name: 'Practical Ophthalmology',
              rating: 4.4,
              mcqCount: 25,
              isPro: true,
              image: 'ophthalmology',
              questions: [
                {
                  id: 'opth_q25_1',
                  questionNumber: 1,
                  text: 'Which clinical test is the gold standard for measuring the rate of aqueous tear production to diagnose Aqueous-Deficient Dry Eye (Keratoconjunctivitis Sicca)?',
                  options: [
                    { id: 'A', text: 'Schirmer-I test without topical anesthesia (< 5.0 mm wetting in 5 minutes is diagnostic)' },
                    { id: 'B', text: 'Tear Break-up Time (TBUT > 10 seconds)' },
                    { id: 'C', text: 'Rose Bengal staining of cornea only' },
                    { id: 'D', text: 'Fluorescein clearance test' }
                  ],
                  correctOption: 'A',
                  explanation: 'Schirmer-I test (using Whatman 41 filter paper strip 5x35 mm placed in lower conjunctival fornix for 5 minutes) measures total tear secretion (basal + reflex). Wetting < 5 mm in 5 minutes indicates severe aqueous deficiency (as in Sjögren syndrome). Normal is >= 15 mm.',
                  keyConcept: 'Dry Eye Evaluation: Schirmer-I test (<5 mm in 5 min = Aqueous deficient dry eye); Tear Break-Up Time / TBUT (<10 sec = Evaporative dry eye / MGD).'
                }
              ]
            }
          ]
        },
        {
          id: 'opth_systemic_ophthalmology',
          name: 'SYSTEMIC OPHTHALMOLOGY',
          topics: [
            {
              id: 'opth_t26_eye_signs_in_systemic_disease',
              name: 'Eye Signs in Systemic Disease',
              rating: 4.5,
              mcqCount: 15,
              isPro: true,
              image: 'ophthalmology',
              questions: [
                {
                  id: 'opth_q26_1',
                  questionNumber: 1,
                  text: 'In Wilson disease (Hepatolenticular degeneration), copper deposition in which layer of the peripheral cornea produces the characteristic greenish-brown "Kayser-Fleischer (KF) Ring"?',
                  options: [
                    { id: 'A', text: 'Descemet membrane' },
                    { id: 'B', text: 'Bowman layer' },
                    { id: 'C', text: 'Corneal epithelium' },
                    { id: 'D', text: 'Corneal stroma' }
                  ],
                  correctOption: 'A',
                  explanation: 'In Wilson disease (ATP7B mutation on chromosome 13 causing defective copper excretion in bile), excess copper accumulates in Descemet’s membrane of the peripheral cornea, producing the diagnostic Kayser-Fleischer (KF) ring. It is best visualized using gonioscopy or slit lamp and disappears with D-penicillamine chelation.',
                  keyConcept: 'Kayser-Fleischer Ring: Copper deposition in Descemet membrane in Wilson disease. Sunflower cataract is copper in anterior lens capsule.'
                }
              ]
            }
          ]
        },
        {
          id: 'opth_community_ophthalmology',
          name: 'COMMUNITY OPHTHALMOLOGY',
          topics: [
            {
              id: 'opth_t27_community_ophthalmology',
              name: 'Community Ophthalmology',
              rating: 4.5,
              mcqCount: 11,
              isPro: false,
              image: 'ophthalmology',
              questions: [
                {
                  id: 'opth_q27_1',
                  questionNumber: 1,
                  text: 'According to the National Programme for Control of Blindness and Visual Impairment (NPCBVI) and WHO criteria, blindness is defined as presenting visual acuity of less than what threshold in the better eye with available correction?',
                  options: [
                    { id: 'A', text: '< 3/60 (or visual field < 10 degrees around fixation)' },
                    { id: 'B', text: '< 6/60' },
                    { id: 'C', text: '< 6/18' },
                    { id: 'D', text: 'No light perception (NLP) only' }
                  ],
                  correctOption: 'A',
                  explanation: 'Under WHO and updated NPCBVI guidelines: Blindness is defined as presenting Visual Acuity < 3/60 in the better eye (or visual field constriction to < 10 degrees). Visual Impairment is defined as presenting VA < 6/12 to 6/60. Cataract remains the single leading cause of avoidable blindness in India (>60%).',
                  keyConcept: 'NPCBVI / WHO Blindness Definition: Presenting visual acuity < 3/60 in the better eye. #1 cause of blindness in India = Cataract; #1 cause of visual impairment = Refractive errors.'
                }
              ]
            }
          ]
        },
        {
          id: 'opth_instruments',
          name: 'INSTRUMENTS',
          topics: [
            {
              id: 'opth_t28_instruments_in_ophthalmology',
              name: 'Instruments in Ophthalmology',
              rating: 4.5,
              mcqCount: 23,
              isPro: false,
              image: 'ophthalmology',
              questions: [
                {
                  id: 'opth_q28_1',
                  questionNumber: 1,
                  text: 'Which instrument is considered the international gold standard for accurate measurement of Intraocular Pressure (IOP) based on the Imbert-Fick principle?',
                  options: [
                    { id: 'A', text: 'Goldmann Applanation Tonometer (GAT)' },
                    { id: 'B', text: 'Schiotz Indentation Tonometer' },
                    { id: 'C', text: 'Non-contact air-puff tonometer' },
                    { id: 'D', text: 'Perkins hand-held tonometer' }
                  ],
                  correctOption: 'A',
                  explanation: 'Goldmann Applanation Tonometry (GAT) is the gold standard for measuring IOP. It is based on the Imbert-Fick law (P = F/A), which states that the pressure inside an ideal sphere equals the force required to flatten a specific surface area (GAT flattens a standard corneal diameter of 3.06 mm where capillary tear film attraction exactly balances corneal rigidity resistance).',
                  keyConcept: 'Tonometry Gold Standard: Goldmann Applanation Tonometer (GAT). Flattens 3.06 mm diameter of central cornea. Calibrated for central corneal thickness (CCT) of 520-540 um.'
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

# Replace ophthalmology block
oph_start = full_text.find('ophthalmology:')
if oph_start == -1:
    print("Could not find ophthalmology in js/core/qbank-data.js")
    sys.exit(1)

# Find end of ophthalmology block
# It is followed by `otorhinolaryngology__ent_:` or `dermatology:`
next_match = re.search(r'\n    [a-zA-Z0-9_]+:\s*\{', full_text[oph_start+20:])
if not next_match:
    print("Could not find next subject after ophthalmology")
    sys.exit(1)

oph_end = oph_start + 20 + next_match.start()

new_content = full_text[:oph_start] + ophthalmology_dataset_js.strip() + '\n\n  ' + full_text[oph_end:]

with open('js/core/qbank-data.js', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Successfully replaced ophthalmology block in js/core/qbank-data.js")
