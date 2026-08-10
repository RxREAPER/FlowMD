/* ============================================================
   FlowMD Core — Subject Helpers
   Pure lookup helpers for subject metadata.

   Lookup priority for every field:
     1. Inline field on the subject object from the data file
        (e.g. subject.color, subject.faculty, subject.svgIcon)
     2. Static map in constants.js (SUBJECT_COLORS, SUBJECT_FACULTY, …)
     3. Fuzzy-match scan of the static map
     4. Hard-coded default

   This means a new data source can carry its own metadata inline
   and it will work without touching constants.js at all.
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

  // Resolve a subject object from either an ID string or a subject object.
  // Callers may pass a raw string (legacy) or the full subject object from
  // the dataset (when iterating subjects). Either form works.
  function resolveSubjectObj(subjectIdOrObj) {
    if (!subjectIdOrObj) return { id: '', obj: null };
    if (typeof subjectIdOrObj === 'object') {
      return { id: subjectIdOrObj.id || '', obj: subjectIdOrObj };
    }
    return { id: subjectIdOrObj, obj: null };
  }

  function getSubjectIconSrc(subjectIdOrObj) {
    const { id, obj } = resolveSubjectObj(subjectIdOrObj);
    if (obj && obj.iconSrc) return obj.iconSrc;
    if (!id) return 'icons/medicine.png';
    const key = normalizeKey(id);
    if (SUBJECT_ICONS[key]) return SUBJECT_ICONS[key];
    for (const [k, src] of Object.entries(SUBJECT_ICONS)) {
      if (key.includes(k) || k.includes(key)) return src;
    }
    return 'icons/medicine.png';
  }

  function getSubjectSvgIcon(subjectIdOrObj) {
    const { id, obj } = resolveSubjectObj(subjectIdOrObj);
    if (obj && obj.svgIcon) return obj.svgIcon;
    if (!id) return SUBJECT_SVG_ICONS.medicine;
    const key = normalizeKey(id);
    if (SUBJECT_SVG_ICONS[key]) return SUBJECT_SVG_ICONS[key];
    for (const [k, svg] of Object.entries(SUBJECT_SVG_ICONS)) {
      if (key.includes(k) || k.includes(key)) return svg;
    }
    return SUBJECT_SVG_ICONS.medicine;
  }

  // Single canonical color lookup — getSubjectColor is an alias kept for
  // back-compat so existing call sites don't need to change.
  function getSubjectAccentColor(subjectIdOrObj) {
    const { id, obj } = resolveSubjectObj(subjectIdOrObj);
    if (obj && obj.color) return obj.color;
    if (!id) return '#6c3baa';
    const key = normalizeKey(id);
    if (SUBJECT_COLORS[key]) return SUBJECT_COLORS[key];
    for (const [k, c] of Object.entries(SUBJECT_COLORS)) {
      if (key.includes(k) || k.includes(key)) return c;
    }
    return '#6c3baa';
  }

  // Alias — kept for back-compat; both functions are identical in behaviour.
  const getSubjectColor = getSubjectAccentColor;

  function getSubjectFaculty(subjectIdOrObj) {
    const { id, obj } = resolveSubjectObj(subjectIdOrObj);
    if (obj && obj.faculty) return obj.faculty;
    if (!id) return 'Marrow Faculty';
    const key = normalizeKey(id);
    if (SUBJECT_FACULTY[key]) return SUBJECT_FACULTY[key];
    for (const [k, faculty] of Object.entries(SUBJECT_FACULTY)) {
      if (key.includes(k) || k.includes(key)) return faculty;
    }
    return 'Marrow Faculty';
  }

  function getSubjectName(subjectIdOrObj) {
    const { id, obj } = resolveSubjectObj(subjectIdOrObj);
    // Inline display name from the data file takes priority
    if (obj && obj.subject) return obj.subject;
    if (!id) return '';
    const key = normalizeKey(id);
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
    return subjectNames[key] || id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  window.FlowMD.subjects = {
    getSubjectIconSrc,
    getSubjectSvgIcon,
    getSubjectAccentColor,
    getSubjectColor,
    getSubjectFaculty,
    getSubjectName
  };
})();
