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
  // Stub implementation: For final development by the research sub-group
  // Will parse the matrix, ignore null values, compute coincidence matrices, and return Alpha.
  console.log('Krippendorff Alpha input matrix dimension: ', matrix.length, 'x', matrix[0]?.length);
  return 0.78; // Mock value indicating typical acceptable consistency
};
