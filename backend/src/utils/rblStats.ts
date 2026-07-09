/**
 * Utility functions for calculating Inter-Rater Reliability (IRR) statistics.
 * These are used to analyze judge scoring consistency.
 */

interface ScoreStats {
  mean: number;
  variance: number;
  stdDev: number;
}

/**
 * Calculates mean, variance, and standard deviation for a simple list of numbers.
 */
export const calculateStats = (scores: number[]): ScoreStats => {
  if (scores.length === 0) {
    return { mean: 0, variance: 0, stdDev: 0 };
  }

  const n = scores.length;
  const mean = scores.reduce((sum, val) => sum + val, 0) / n;
  
  if (n === 1) {
    return { mean, variance: 0, stdDev: 0 };
  }

  const variance = scores.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (n - 1);
  const stdDev = Math.sqrt(variance);

  return { mean, variance, stdDev };
};

/**
 * Calculates Intraclass Correlation Coefficient ICC(2,1) for absolute agreement.
 * @param matrix A 2D array of size N (submissions) x K (judges), representing ratings.
 *               Assumes no missing values.
 */
export const calculateICC = (matrix: number[][]): number => {
  const n = matrix.length; // Number of items (submissions)
  if (n <= 1) return 0;
  
  const k = matrix[0].length; // Number of raters (judges)
  if (k <= 1) return 0;

  // 1. Calculate Grand Mean
  let totalSum = 0;
  let totalCount = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < k; j++) {
      totalSum += matrix[i][j];
      totalCount++;
    }
  }
  const grandMean = totalSum / totalCount;

  // 2. Row Means (Mean score for each submission)
  const rowMeans = matrix.map(row => row.reduce((s, v) => s + v, 0) / k);

  // 3. Column Means (Mean score for each judge)
  const colMeans: number[] = Array(k).fill(0);
  for (let j = 0; j < k; j++) {
    let colSum = 0;
    for (let i = 0; i < n; i++) {
      colSum += matrix[i][j];
    }
    colMeans[j] = colSum / n;
  }

  // 4. Calculate Sum of Squares
  // Total Sum of Squares (SST)
  let sst = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < k; j++) {
      sst += Math.pow(matrix[i][j] - grandMean, 2);
    }
  }

  // Between-subjects Sum of Squares (SSR)
  let ssr = 0;
  for (let i = 0; i < n; i++) {
    ssr += Math.pow(rowMeans[i] - grandMean, 2);
  }
  ssr = ssr * k;

  // Between-raters Sum of Squares (SSC)
  let ssc = 0;
  for (let j = 0; j < k; j++) {
    ssc += Math.pow(colMeans[j] - grandMean, 2);
  }
  ssc = ssc * n;

  // Error Sum of Squares (SSE)
  const sse = sst - ssr - ssc;

  // 5. Calculate Mean Squares
  const msr = ssr / (n - 1);
  const msc = ssc / (k - 1);
  const mse = sse / ((n - 1) * (k - 1));

  // 6. Calculate ICC(2,1)
  // ICC(2,1) = (MS_R - MS_E) / (MS_R + (k-1)*MS_E + (k/n)*(MS_C - MS_E))
  const numerator = msr - mse;
  const denominator = msr + (k - 1) * mse + (k / n) * (msc - mse);

  if (denominator === 0) return 0;
  const icc = numerator / denominator;

  return icc;
};

/**
 * Calculates Krippendorff's Alpha for interval data.
 * This can handle missing values (indicated by null).
 * @param matrix A 2D array of size N (submissions) x K (judges).
 */
export const calculateKrippendorffAlpha = (matrix: (number | null)[][]): number => {
  const n = matrix.length;
  if (n === 0) return 0;
  const k = matrix[0]?.length || 0;
  if (k === 0) return 0;

  // 1. Compute Observed Disagreement (Do)
  let sumObserved = 0;
  let sumPairsCount = 0;

  for (let i = 0; i < n; i++) {
    const row = matrix[i];
    const validScores = row.filter((v): v is number => v !== null);
    const mi = validScores.length;
    if (mi < 2) continue; // Skip units with less than 2 ratings

    let rowDiffSum = 0;
    for (let j = 0; j < mi; j++) {
      for (let l = j + 1; l < mi; l++) {
        rowDiffSum += Math.pow(validScores[j] - validScores[l], 2);
      }
    }
    // observed disagreement for unit i is: sum of squared differences divided by (mi - 1)
    sumObserved += rowDiffSum / (mi - 1);
    sumPairsCount += mi;
  }

  if (sumPairsCount === 0) {
    return 0; // Not enough overlapping ratings to compute agreement
  }

  const Do = sumObserved / sumPairsCount;

  // 2. Compute Expected Disagreement (De)
  const allScores = matrix.flatMap(row => row.filter((v): v is number => v !== null));
  const M = allScores.length;
  if (M < 2) return 0;

  let sumSq = 0;
  let sum = 0;
  for (let g = 0; g < M; g++) {
    const val = allScores[g];
    sumSq += val * val;
    sum += val;
  }

  // De is the sum of squared differences of all pairs divided by M * (M - 1)
  // De = \sum_{g < h} (y_g - y_h)^2 / (M * (M - 1) / 2) = (M * sumSq - sum * sum) / (M * (M - 1))
  const sumExpected = M * sumSq - sum * sum;
  const De = sumExpected / (M * (M - 1));

  if (De === 0) {
    // If there is zero expected variance (all ratings are identical),
    // and observed disagreement is also zero, agreement is perfect (1.0).
    return Do === 0 ? 1 : 0;
  }

  const alpha = 1 - (Do / De);
  return Math.round(alpha * 1000) / 1000;
};

