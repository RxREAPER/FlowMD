import json, re

cm_dataset_js = """    community_medicine: {
      id: 'community_medicine',
      name: 'Community Medicine',
      faculty: 'Dr. Mukhmohit Singh',
      accentColor: '#14b8a6',
      chapters: [
        {
          id: 'cm_history_of_medicine',
          name: 'HISTORY OF MEDICINE',
          topics: [
            { id: 'cm_t1_history_of_medicine', name: 'History of Medicine', rating: 4.4, mcqCount: 24, isPro: true, image: 'community_medicine', questions: [] }
          ]
        },
        {
          id: 'cm_concepts_of_health_disease',
          name: 'CONCEPTS OF HEALTH AND DISEASE',
          topics: [
            { id: 'cm_t2_health_determinants_indicators', name: 'Health Determinants and Indicators', rating: 4.4, mcqCount: 22, isPro: true, image: 'community_medicine', questions: [] },
            { id: 'cm_t3_concepts_disease_prevention', name: 'Concepts of Disease and Prevention', rating: 4.4, mcqCount: 26, isPro: true, image: 'community_medicine', questions: [] }
          ]
        },
        {
          id: 'cm_epidemiology',
          name: 'EPIDEMIOLOGY',
          topics: [
            { id: 'cm_t4_principles_of_epidemiology', name: 'Principles of Epidemiology', rating: 4.5, mcqCount: 31, isPro: true, image: 'community_medicine', questions: [] },
            { id: 'cm_t5_descriptive_epidemiology', name: 'Descriptive Epidemiology', rating: 4.5, mcqCount: 17, isPro: true, image: 'community_medicine', questions: [] },
            { id: 'cm_t6_analytical_epidemiology', name: 'Analytical Epidemiology', rating: 4.5, mcqCount: 33, isPro: true, image: 'community_medicine', questions: [] },
            { id: 'cm_t7_experimental_epidemiology', name: 'Experimental Epidemiology', rating: 4.5, mcqCount: 19, isPro: true, image: 'community_medicine', questions: [] },
            { id: 'cm_t8_definitions_infectious_disease', name: 'Basic Definitions in Infectious Disease Epidemiology', rating: 4.5, mcqCount: 15, isPro: true, image: 'community_medicine', questions: [] },
            { id: 'cm_t9_dynamics_disease_transmission', name: 'Dynamics of Disease Transmission', rating: 4.6, mcqCount: 20, isPro: true, image: 'community_medicine', questions: [] },
            { id: 'cm_t10_principles_immunization_vaccination', name: 'Principles of Immunization and Vaccination', rating: 4.5, mcqCount: 25, isPro: true, image: 'community_medicine', questions: [] },
            { id: 'cm_t11_vaccine_production_storage', name: 'Vaccine Production and Storage', rating: 4.6, mcqCount: 17, isPro: true, image: 'community_medicine', questions: [] },
            { id: 'cm_t12_sterilization_disinfection', name: 'Sterilization and Disinfection', rating: 4.5, mcqCount: 23, isPro: true, image: 'community_medicine', questions: [] }
          ]
        },
        {
          id: 'cm_screening',
          name: 'SCREENING',
          topics: [
            { id: 'cm_t13_screening', name: 'Screening', rating: 4.5, mcqCount: 32, isPro: true, image: 'community_medicine', questions: [] }
          ]
        },
        {
          id: 'cm_communicable_diseases',
          name: 'EPIDEMIOLOGY OF COMMUNICABLE DISEASES',
          topics: [
            { id: 'cm_t14_viral_respiratory_infections', name: 'Viral Respiratory Infections', rating: 4.4, mcqCount: 18, isPro: true, image: 'community_medicine', questions: [] },
            { id: 'cm_t15_bacterial_respiratory_infections', name: 'Bacterial Respiratory Infections', rating: 4.5, mcqCount: 23, isPro: true, image: 'community_medicine', questions: [] },
            { id: 'cm_t16_intestinal_infections', name: 'Intestinal Infections', rating: 4.4, mcqCount: 31, isPro: true, image: 'community_medicine', questions: [] },
            { id: 'cm_t17_arthropod_borne_infections', name: 'Arthropod-Borne Infections', rating: 4.4, mcqCount: 22, isPro: true, image: 'community_medicine', questions: [] },
            { id: 'cm_t18_zoonotic_infections_viral', name: 'Zoonotic Infections - Viral', rating: 4.5, mcqCount: 18, isPro: true, image: 'community_medicine', questions: [] },
            { id: 'cm_t19_zoonotic_infections_bacterial_parasitic', name: 'Zoonotic Infections - Bacterial & Parasitic', rating: 4.6, mcqCount: 12, isPro: true, image: 'community_medicine', questions: [] },
            { id: 'cm_t20_stds_surface_infections', name: 'STDs and Surface Infections', rating: 4.4, mcqCount: 30, isPro: true, image: 'community_medicine', questions: [] }
          ]
        },
        {
          id: 'cm_non_communicable_diseases',
          name: 'EPIDEMIOLOGY OF NON-COMMUNICABLE DISEASES',
          topics: [
            { id: 'cm_t21_ncd_cvd_diabetes', name: 'Non-Communicable Diseases - Cardiovascular Diseases and Diabetes', rating: 4.4, mcqCount: 21, isPro: true, image: 'community_medicine', questions: [] },
            { id: 'cm_t22_ncd_cancer_obesity_blindness', name: 'Non-Communicable Diseases - Cancer, Obesity and Blindness', rating: 4.5, mcqCount: 18, isPro: true, image: 'community_medicine', questions: [] }
          ]
        },
        {
          id: 'cm_indian_health_programmes',
          name: 'INDIAN HEALTH PROGRAMMES',
          topics: [
            { id: 'cm_t23_health_programmes_nvbdcp', name: 'National Health Programmes I - NVBDCP', rating: 4.4, mcqCount: 18, isPro: true, image: 'community_medicine', questions: [] },
            { id: 'cm_t24_health_programmes_nlep_ntep_naco', name: 'National Health Programmes II - NLEP, NTEP & NACO', rating: 4.5, mcqCount: 24, isPro: true, image: 'community_medicine', questions: [] },
            { id: 'cm_t25_health_programmes_nis_jsy_rbsk', name: 'National Health Programmes III - NIS, JSY, RBSK and Others', rating: 4.5, mcqCount: 39, isPro: true, image: 'community_medicine', questions: [] }
          ]
        },
        {
          id: 'cm_demography_family_planning',
          name: 'DEMOGRAPHY AND FAMILY PLANNING',
          topics: [
            { id: 'cm_t26_demography_growth_rate_pyramid', name: 'Demography I: Demographic Cycle, Annual Growth Rate and Age Pyramid', rating: 4.5, mcqCount: 16, isPro: true, image: 'community_medicine', questions: [] },
            { id: 'cm_t27_demography_indicators', name: 'Demography II: Demographic indicators', rating: 4.5, mcqCount: 23, isPro: true, image: 'community_medicine', questions: [] },
            { id: 'cm_t28_family_planning', name: 'Family Planning', rating: 4.5, mcqCount: 21, isPro: true, image: 'community_medicine', questions: [] }
          ]
        },
        {
          id: 'cm_preventive_obs_paeds_geriatrics',
          name: 'PREVENTIVE OBSTETRICS, PAEDIATRICS AND GERIATRICS',
          topics: [
            { id: 'cm_t29_preventive_obs_paeds_geriatrics', name: 'Preventive Obstetrics, Paediatrics and Geriatrics', rating: 4.5, mcqCount: 28, isPro: true, image: 'community_medicine', questions: [] }
          ]
        },
        {
          id: 'cm_nutrition_and_health',
          name: 'NUTRITION AND HEALTH',
          topics: [
            { id: 'cm_t30_energy_metabolism_macronutrients', name: 'Energy Metabolism and Macronutrients', rating: 4.4, mcqCount: 16, isPro: true, image: 'community_medicine', questions: [] },
            { id: 'cm_t31_micronutrients_and_water', name: 'Micronutrients and Water', rating: 4.3, mcqCount: 16, isPro: true, image: 'community_medicine', questions: [] },
            { id: 'cm_t32_food_quality_and_processing', name: 'Food Quality and Processing', rating: 4.5, mcqCount: 9, isPro: true, image: 'community_medicine', questions: [] }
          ]
        },
        {
          id: 'cm_medicine_and_social_sciences',
          name: 'MEDICINE AND SOCIAL SCIENCES',
          topics: [
            { id: 'cm_t33_concepts_sociology_psychology', name: 'Concepts of Sociology and Psychology', rating: 4.5, mcqCount: 20, isPro: true, image: 'community_medicine', questions: [] },
            { id: 'cm_t34_social_organization_economics', name: 'Social Organization and Economics', rating: 4.4, mcqCount: 24, isPro: true, image: 'community_medicine', questions: [] }
          ]
        },
        {
          id: 'cm_environment_and_health',
          name: 'ENVIRONMENT AND HEALTH',
          topics: [
            { id: 'cm_t35_water_sources_purification', name: 'Water - I: Sources and purification of water', rating: 4.4, mcqCount: 28, isPro: true, image: 'community_medicine', questions: [] },
            { id: 'cm_t36_water_disinfection', name: 'Water- II: Disinfection of water', rating: 4.5, mcqCount: 15, isPro: true, image: 'community_medicine', questions: [] },
            { id: 'cm_t37_water_quality_standards', name: 'Water - III: Water Quality and Standards', rating: 4.5, mcqCount: 22, isPro: true, image: 'community_medicine', questions: [] },
            { id: 'cm_t38_environmental_meteorology', name: 'Environmental Meteorology', rating: 4.5, mcqCount: 24, isPro: true, image: 'community_medicine', questions: [] },
            { id: 'cm_t39_housing_and_ventilation', name: 'Housing and Ventilation', rating: 4.4, mcqCount: 14, isPro: true, image: 'community_medicine', questions: [] },
            { id: 'cm_t40_light_sound_radiation', name: 'Light, Sound and Radiation', rating: 4.4, mcqCount: 19, isPro: true, image: 'community_medicine', questions: [] },
            { id: 'cm_t41_waste_sewage_disposal', name: 'Waste and Sewage Disposal', rating: 4.4, mcqCount: 22, isPro: true, image: 'community_medicine', questions: [] },
            { id: 'cm_t42_entomology_mosquitoes_flies', name: 'Medical Entomology - Mosquitoes and Flies', rating: 4.5, mcqCount: 22, isPro: true, image: 'community_medicine', questions: [] },
            { id: 'cm_t43_entomology_ticks_fleas_mites', name: 'Medical Entomology - Ticks, Fleas and Mites', rating: 4.5, mcqCount: 19, isPro: true, image: 'community_medicine', questions: [] },
            { id: 'cm_t44_methods_of_pest_control', name: 'Methods of Pest Control', rating: 4.4, mcqCount: 18, isPro: true, image: 'community_medicine', questions: [] }
          ]
        },
        {
          id: 'cm_occupational_health',
          name: 'OCCUPATIONAL HEALTH',
          topics: [
            { id: 'cm_t45_occupational_hazards_pneumoconiosis', name: 'Pneumoconioses and Occupational Hazards', rating: 4.5, mcqCount: 24, isPro: true, image: 'community_medicine', questions: [] },
            { id: 'cm_t46_occupational_health_legislation', name: 'Occupational Health Legislation & Factories Act', rating: 4.4, mcqCount: 18, isPro: true, image: 'community_medicine', questions: [] }
          ]
        },
        {
          id: 'cm_health_planning_management',
          name: 'HEALTHCARE PLANNING & INTERNATIONAL HEALTH',
          topics: [
            { id: 'cm_t47_health_planning_committees', name: 'Health Planning, Management and Committees in India', rating: 4.5, mcqCount: 24, isPro: true, image: 'community_medicine', questions: [] },
            { id: 'cm_t48_primary_health_care_system', name: 'Primary Health Care and Health Delivery System', rating: 4.5, mcqCount: 22, isPro: true, image: 'community_medicine', questions: [] },
            { id: 'cm_t49_international_health_agencies', name: 'International Health Agencies (WHO, UNICEF, UNFPA)', rating: 4.6, mcqCount: 19, isPro: true, image: 'community_medicine', questions: [] }
          ]
        },
        {
          id: 'cm_biostatistics',
          name: 'BIOSTATISTICS',
          topics: [
            { id: 'cm_t50_descriptive_stats_normal_distribution', name: 'Descriptive Statistics, Probability & Normal Distribution', rating: 4.5, mcqCount: 28, isPro: true, image: 'community_medicine', questions: [] },
            { id: 'cm_t51_sampling_tests_of_significance', name: 'Sampling, Tests of Significance & Standard Error', rating: 4.5, mcqCount: 26, isPro: true, image: 'community_medicine', questions: [] }
          ]
        },
        {
          id: 'cm_biomedical_waste_disaster',
          name: 'BIOMEDICAL WASTE & DISASTER MANAGEMENT',
          topics: [
            { id: 'cm_t52_biomedical_waste_management_rules', name: 'Biomedical Waste Management Guidelines', rating: 4.6, mcqCount: 24, isPro: true, image: 'community_medicine', questions: [] },
            { id: 'cm_t53_disaster_management_triage', name: 'Disaster Management and Triage', rating: 4.5, mcqCount: 18, isPro: true, image: 'community_medicine', questions: [] }
          ]
        }
      ]
    }"""

def main():
    with open('js/core/qbank-data.js', 'r', encoding='utf-8') as f:
        content = f.read()

    start_pos = content.find("    community_medicine: {")
    end_pos = content.find("    ophthalmology: {", start_pos)

    if start_pos == -1 or end_pos == -1:
        print("Could not find community_medicine range in qbank-data.js")
        return

    new_content = content[:start_pos] + cm_dataset_js + ",\n" + content[end_pos:]

    # Add psm / comm_med aliases
    alias_str = "  CURATED_QBANKS.psm = CURATED_QBANKS.community_medicine;\n  CURATED_QBANKS.spm = CURATED_QBANKS.community_medicine;\n"
    if "CURATED_QBANKS.psm" not in new_content:
        target_alias = "  CURATED_QBANKS.biochem = CURATED_QBANKS.biochemistry;\n"
        pos = new_content.find(target_alias)
        if pos != -1:
            new_content = new_content[:pos + len(target_alias)] + alias_str + new_content[pos + len(target_alias):]

    with open('js/core/qbank-data.js', 'w', encoding='utf-8') as f:
        f.write(new_content)

    print("Successfully updated Community Medicine QBank with all 53 topics across 16 chapters!")

if __name__ == '__main__':
    main()
