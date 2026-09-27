/**
 * Error Metrics
 *
 * Computes reconstruction error between the original continuous signal
 * and the reconstructed signal at the same evaluation points.
 */

/**
 * Compute error metrics given two parallel arrays of {t, value}.
 * Both arrays must have the same length and matching t values.
 *
 * @returns {{
 *   rmsError: number,
 *   maxAbsError: number,
 *   relativeError: number,   // rmsError / rmsOriginal (0 → 1 scale)
 *   errorCurve: Array<{t: number, value: number}>
 * }}
 */
export function computeErrorMetrics(originalPoints, reconstructedPoints) {
  if (!originalPoints || !reconstructedPoints || originalPoints.length === 0) {
    return { rmsError: 0, maxAbsError: 0, relativeError: 0, errorCurve: [] };
  }

  const n = Math.min(originalPoints.length, reconstructedPoints.length);
  let sumSqError = 0;
  let sumSqOrig = 0;
  let maxAbsError = 0;
  const errorCurve = [];

  for (let i = 0; i < n; i++) {
    const orig = originalPoints[i].value;
    const rec = reconstructedPoints[i].value;
    const err = orig - rec;
    sumSqError += err * err;
    sumSqOrig += orig * orig;
    if (Math.abs(err) > maxAbsError) maxAbsError = Math.abs(err);
    errorCurve.push({ t: originalPoints[i].t, value: err });
  }

  const rmsError = Math.sqrt(sumSqError / n);
  const rmsOrig = Math.sqrt(sumSqOrig / n);
  const relativeError = rmsOrig > 1e-12 ? rmsError / rmsOrig : 0;

  return {
    rmsError: Math.round(rmsError * 10000) / 10000,
    maxAbsError: Math.round(maxAbsError * 10000) / 10000,
    relativeError: Math.round(relativeError * 10000) / 10000,
    errorCurve,
  };
}
