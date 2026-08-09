/* ============================================================
   FlowMD Core — Subject Helpers
   Pure lookup helpers for subject metadata. Depends on
   FlowMD.constants (SUBJECT_ICONS / SUBJECT_SVG_ICONS /
   SUBJECT_COLORS / SUBJECT_FACULTY).
   ============================================================ */
(function () {
  'use strict';

  const {
    SUBJECT_ICONS,
    SUBJECT_SVG_ICONS,
    SUBJECT_COLORS,
    SUBJECT_FACULTY
  } = window.FlowMD.constants;

  function normalizeKey(subjectIdOrName) {
    if (!subjectIdOrName) return '';
    return subjectIdOrName.toLowerCase().trim().replace(/[^a-z0-9_]/g, '_');
  }

  function getSubjectIconSrc(subjectIdOrName) {
    if (!subjectIdOrName) return 'icons/medicine.png';
    const key = normalizeKey(subjectIdOrName);
    if (SUBJECT_ICONS[key]) return SUBJECT_ICONS[key];
    for (const [id, src] of Object.entries(SUBJECT_ICONS)) {
      if (key.includes(id) || id.includes(key)) return src;
    }
    return 'icons/medicine.png';
  }

  function getSubjectSvgIcon(subjectIdOrName) {
    if (!subjectIdOrName) return SUBJECT_SVG_ICONS.medicine;
    const key = normalizeKey(subjectIdOrName);
    if (SUBJECT_SVG_ICONS[key]) return SUBJECT_SVG_ICONS[key];
    for (const [id, svg] of Object.entries(SUBJECT_SVG_ICONS)) {
      if (key.includes(id) || id.includes(key)) return svg;
    }
    return SUBJECT_SVG_ICONS.medicine;
  }

  function getSubjectAccentColor(subjectIdOrName) {
    if (!subjectIdOrName) return '#6c3baa';
    const key = normalizeKey(subjectIdOrName);
    if (SUBJECT_COLORS[key]) return SUBJECT_COLORS[key];
    for (const [id, c] of Object.entries(SUBJECT_COLORS)) {
      if (key.includes(id) || id.includes(key)) return c;
    }
    return '#6c3baa';
  }

  function getSubjectFaculty(subjectIdOrName) {
    if (!subjectIdOrName) return 'Marrow Faculty';
    const key = normalizeKey(subjectIdOrName);
    if (SUBJECT_FACULTY[key]) return SUBJECT_FACULTY[key];
    for (const [id, faculty] of Object.entries(SUBJECT_FACULTY)) {
      if (key.includes(id) || id.includes(key)) return faculty;
    }
    return 'Marrow Faculty';
  }

  function getSubjectColor(subjectIdOrName) {
    if (!subjectIdOrName) return '#6c3baa';
    const key = normalizeKey(subjectIdOrName);
    if (SUBJECT_COLORS[key]) return SUBJECT_COLORS[key];
    for (const [id, c] of Object.entries(SUBJECT_COLORS)) {
      if (key.includes(id) || id.includes(key)) return c;
    }
    return '#6c3baa';
  }

  function getSubjectName(subjectIdOrName) {
    if (!subjectIdOrName) return '';
    const key = normalizeKey(subjectIdOrName);
    const subjectNames = {
      anatomy: 'Anatomy',
      physiology: 'Physiology',
      biochemistry: 'Biochemistry',
      pathology: 'Pathology',
      pharmacology: 'Pharmacology',
      microbiology: 'Microbiology',
      community_medicine: 'Community Medicine',
      forensic_medicine: 'Forensic Medicine',
      ophthalmology: 'Ophthalmology',
      otorhinolaryngology__ent_: 'ENT',
      anaesthesia: 'Anaesthesia',
      dermatology: 'Dermatology',
      psychiatry: 'Psychiatry',
      radiology: 'Radiology',
      medicine: 'Medicine',
      surgery: 'Surgery',
      orthopaedics: 'Orthopaedics',
      paediatrics: 'Paediatrics',
      obstetrics___gynaecology: 'Obstetrics & Gynaecology',
      revision_videos: 'Revision Videos'
    };
    return subjectNames[key] || subjectIdOrName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  window.FlowMD.subjects = {
    getSubjectIconSrc,
    getSubjectSvgIcon,
    getSubjectAccentColor,
    getSubjectFaculty,
    getSubjectColor,
    getSubjectName
  };
})();
