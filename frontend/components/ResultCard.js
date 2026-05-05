'use client';
import styles from './ResultCard.module.css';

const GRADE_COLORS = ['#22c55e', '#84cc16', '#f59e0b', '#f97316', '#ef4444'];
const GRADE_LABELS = ['No DR', 'Mild DR', 'Moderate DR', 'Severe DR', 'Proliferative DR'];

const SEVERITY_TO_INDEX = {
  'No DR': 0,
  'Mild DR': 1,
  'Moderate DR': 2,
  'Severe DR': 3,
  'Proliferative DR': 4,
};

export default function ResultCard({ result, imagePreview, onReset }) {
  const {
    grade,
    confidence,
    probabilities,
    remedy,
    diagnosisLabel,
    diagnosisSeverity,
  } = result;

  const noDrProbPct = (probabilities?.[0] ?? 0) * 100;
  const isPositiveByThreshold = noDrProbPct < 50;
  const isPositiveByLabel =
    diagnosisLabel === 'Positive' || diagnosisLabel === 'Yes';
  const isPositive = isPositiveByThreshold || isPositiveByLabel;

  const fallbackProbIndex = [2, 3, 4].reduce((best, i) => {
    const bestVal = probabilities?.[best] ?? 0;
    const currentVal = probabilities?.[i] ?? 0;
    return currentVal > bestVal ? i : best;
  }, 1);

  const numericGrade = Number.isFinite(Number(grade)) ? Number(grade) : 0;
  const fallbackPositiveIndex = numericGrade > 0 ? numericGrade : fallbackProbIndex;
  const resolvedPositiveIndex =
    SEVERITY_TO_INDEX[diagnosisSeverity] ?? fallbackPositiveIndex;
  const resolvedSeverity = GRADE_LABELS[resolvedPositiveIndex] ?? 'Diabetic Retinopathy';

  const displayIndex = isPositive
    ? resolvedPositiveIndex
    : 0;
  const color = GRADE_COLORS[displayIndex];
  const displayGradeNum = displayIndex;
  const displayGradeName = isPositive ? resolvedSeverity : 'No DR';
  const displayConfidence =
    ((probabilities?.[displayIndex] ?? (Number(confidence) / 100)) * 100);

  const assessmentText = isPositive
    ? `Your retinal scan shows signs of ${resolvedSeverity}.`
    : 'Your retinal scan shows no signs of diabetic retinopathy.';

  const badgeText = isPositive ? resolvedSeverity : 'No Diabetic Retinopathy';

  return (
    <div className={styles.card}>

      {result.demo && (
        <div className={styles.demoBanner}>
          ⚡ DEMO MODE — Results are simulated for presentation purposes only
        </div>
      )}

      <div className={styles.topRow}>
        <div className={styles.imageThumb}>
          <img src={imagePreview} alt="Analyzed retina" />
        </div>

        <div className={styles.gradeBlock} style={{ '--grade-color': color }}>
          <span className={styles.gradeLabel}>DR Grade</span>
          <span className={styles.gradeNum}>{displayGradeNum}</span>
          <span className={styles.gradeName}>{displayGradeName}</span>
          <span className={styles.confidence}>{displayConfidence.toFixed(1)}% confidence</span>
        </div>

        <div className={styles.adviceBlock}>
          <span className={styles.adviceTitle}>Assessment</span>
          <p className={styles.adviceText}>{assessmentText}</p>
          <div className={styles.urgencyBadge} style={{ '--grade-color': color }}>
            {badgeText}
          </div>
        </div>
      </div>

      <div className={styles.barsSection}>
        <p className={styles.barsTitle}>Probability Distribution</p>
        <div className={styles.bars}>
          {GRADE_LABELS.map((label, i) => (
            <div key={i} className={styles.barRow}>
              <span className={styles.barLabel}>
                <span className={styles.barGradeNum}>{i}</span>
                {label}
              </span>
              <div className={styles.barTrack}>
                <div
                  className={styles.barFill}
                  style={{
                    width: `${(probabilities[i] * 100).toFixed(1)}%`,
                    background: i === displayIndex ? color : 'rgba(255,255,255,0.1)',
                  }}
                />
              </div>
              <span className={styles.barPct}>{(probabilities[i] * 100).toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>

      {remedy.recommendations?.length > 0 && (
        <div className={styles.remedySection}>
          <p className={styles.barsTitle}>Recommendations</p>
          <ul className={styles.remedyList}>
            {remedy.recommendations.map((rec, i) => (
              <li key={i} className={styles.remedyItem}>
                <span className={styles.remedyDot} style={{ background: color }} />
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className={styles.actions}>
        <button className={styles.resetBtn} onClick={onReset}>
          ← Analyze another image
        </button>
        <button className={styles.printBtn} onClick={() => window.print()}>
          Print Report
        </button>
      </div>

      <p className={styles.disclaimer}>
        ⚠ This is an AI-assisted screening tool only. Always consult a qualified ophthalmologist for diagnosis and treatment.
      </p>
    </div>
  );
}