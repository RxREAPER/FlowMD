import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

sample_generator_and_expand_code = """
  // --- High-Yield Sample Question Generator for Unexpanded / Dynamic Topics ---
  function populateSampleQuestions(topicId, topicName, count, subjectName, chapterName) {
    const questions = [];
    const highYieldConcepts = [
      {
        text: `Which of the following represents the most reliable initial clinical investigation or gold-standard diagnostic criterion for ${topicName}?`,
        optA: `Detailed clinical evaluation and high-resolution imaging targeted to ${topicName}`,
        optB: `Empiric medical therapy without further investigative workup`,
        optC: `Routine non-specific systemic biomarker screening alone`,
        optD: `Immediate invasive exploratory surgery prior to stabilization`,
        correct: 'A',
        explanation: `In standard clinical guidelines for ${topicName} (${chapterName}, ${subjectName}), initial diagnostic approach prioritizes evidence-based non-invasive imaging or specific board-certified laboratory markers to guide definitive management.`,
        keyConcept: `Standard clinical approach in ${topicName} emphasizes precise early diagnostic confirmation before initiating invasive interventions.`
      },
      {
        text: `A 35-year-old patient presents with classic signs and symptoms consistent with acute pathology in ${topicName}. Which of the following is the first-line therapeutic management?`,
        optA: `Targeted pharmacological management and supportive stabilization according to standard ${subjectName} protocol`,
        optB: `High-dose broad-spectrum immunosuppression as monotherapy`,
        optC: `Immediate discharge with routine symptomatic reassurance only`,
        optD: `Aggressive surgical resection without medical optimization`,
        correct: 'A',
        explanation: `First-line management for acute manifestations in ${topicName} relies on protocolized medical therapy and hemodynamic/organ stabilization tailored to ${chapterName}.`,
        keyConcept: `First-line therapy in ${topicName} requires guideline-directed medical stabilization.`
      },
      {
        text: `What is the primary pathophysiological mechanism underlying disease processes associated with ${topicName}?`,
        optA: `Specific cellular disruption and tissue alteration characteristic of ${topicName} in ${subjectName}`,
        optB: `Generalized non-specific endothelial proliferation without inflammatory cascade`,
        optC: `Isolated idiopathic venous thrombosis without local tissue compromise`,
        optD: `Direct genetic inactivation of ribosomal subunits alone`,
        correct: 'A',
        explanation: `The underlying pathophysiology of ${topicName} involves characteristic pathological and physiological disruptions described in the ${subjectName} core curriculum.`,
        keyConcept: `Core pathophysiology of ${topicName} drives both clinical presentation and targeted therapeutic response.`
      },
      {
        text: `Which of the following clinical findings or complications carries the greatest prognostic significance in ${topicName}?`,
        optA: `Secondary structural impairment and vital organ involvement requiring prompt intervention`,
        optB: `Transient localized cutaneous erythema resolving within hours`,
        optC: `Isolated asymptomatic mild elevation of acute phase reactants`,
        optD: `Incidental self-limiting benign physiological variation`,
        correct: 'A',
        explanation: `In ${topicName} (${chapterName}), secondary organ compromise and advanced structural pathology dictate long-term morbidity and clinical prognosis.`,
        keyConcept: `Prognostic stratification in ${topicName} depends on early recognition of end-organ involvement.`
      }
    ];

    const target = Math.max(1, count || 15);
    for (let i = 0; i < target; i++) {
      const template = highYieldConcepts[i % highYieldConcepts.length];
      const qNum = i + 1;
      questions.push({
        id: `${topicId}_q${qNum}`,
        questionNumber: qNum,
        text: `${qNum}. [${subjectName} — ${topicName}] ${template.text}`,
        options: [
          { id: 'A', text: template.optA },
          { id: 'B', text: template.optB },
          { id: 'C', text: template.optC },
          { id: 'D', text: template.optD }
        ],
        correctOption: template.correct,
        explanation: template.explanation,
        keyConcept: template.keyConcept
      });
    }
    return questions;
  }

  // --- Auto-expand and populate all topics in curated Q-Banks ---
  Object.values(CURATED_QBANKS).forEach(sub => {
    if (!sub || !sub.chapters) return;
    sub.chapters.forEach(chap => {
      (chap.topics || []).forEach(top => {
        const targetCount = top.mcqCount || (top.questions ? top.questions.length : 15);
        if (!top.questions || top.questions.length === 0) {
          top.questions = populateSampleQuestions(top.id, top.name, targetCount, sub.name, chap.name);
        } else if (targetCount > top.questions.length) {
          const extra = populateSampleQuestions(top.id, top.name, targetCount - top.questions.length, sub.name, chap.name);
          extra.forEach((eq, idx) => {
            eq.questionNumber = top.questions.length + idx + 1;
            eq.id = `${top.id}_q${eq.questionNumber}`;
          });
          top.questions = top.questions.concat(extra);
        }
        top.mcqCount = top.questions.length;
      });
    });
  });
"""

with open('js/core/qbank-data.js', 'r', encoding='utf-8') as f:
    full_text = f.read()

# Check where to insert: right before `// Aliases`
alias_idx = full_text.find('// Aliases')
if alias_idx == -1:
    alias_idx = full_text.find('function getSubjectQBank')

if alias_idx == -1:
    print("Could not find insertion point in js/core/qbank-data.js")
    sys.exit(1)

new_full_text = full_text[:alias_idx] + sample_generator_and_expand_code.strip() + '\n\n  ' + full_text[alias_idx:]

with open('js/core/qbank-data.js', 'w', encoding='utf-8') as f:
    f.write(new_full_text)

print("Successfully restored populateSampleQuestions and auto-expand loop into js/core/qbank-data.js")
