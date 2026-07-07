/**
 * Statistical Formula Library
 * Common statistical formulas in LaTeX format for Doc Rat
 */

export interface FormulaDefinition {
  name: string;
  latex: string;
  description: string;
  variables: string[];
}

export const STATISTICAL_FORMULAS: Record<string, FormulaDefinition> = {
  mean: {
    name: 'Mean (Arithmetic Average)',
    latex: '\\bar{x} = \\frac{1}{n}\\sum_{i=1}^{n}x_i',
    description: 'The average of all values in a dataset',
    variables: ['n', 'x_i']
  },
  median: {
    name: 'Median',
    latex: '\\text{Median} = \\begin{cases} x_{(n+1)/2} & \\text{if } n \\text{ is odd} \\\\ \\frac{x_{n/2} + x_{n/2+1}}{2} & \\text{if } n \\text{ is even} \\end{cases}',
    description: 'The middle value when data is sorted',
    variables: ['n', 'x']
  },
  standardDeviation: {
    name: 'Standard Deviation',
    latex: '\\sigma = \\sqrt{\\frac{1}{n}\\sum_{i=1}^{n}(x_i - \\bar{x})^2}',
    description: 'Measure of data dispersion around the mean',
    variables: ['n', 'x_i', '\\bar{x}']
  },
  variance: {
    name: 'Variance',
    latex: '\\sigma^2 = \\frac{1}{n}\\sum_{i=1}^{n}(x_i - \\bar{x})^2',
    description: 'Square of standard deviation, measures spread',
    variables: ['n', 'x_i', '\\bar{x}']
  },
  correlation: {
    name: 'Pearson Correlation Coefficient',
    latex: 'r = \\frac{\\sum(x_i - \\bar{x})(y_i - \\bar{y})}{\\sqrt{\\sum(x_i - \\bar{x})^2\\sum(y_i - \\bar{y})^2}}',
    description: 'Measures linear relationship between two variables',
    variables: ['x_i', 'y_i', '\\bar{x}', '\\bar{y}']
  },
  tTest: {
    name: 'T-Test Statistic',
    latex: 't = \\frac{\\bar{x} - \\mu_0}{s/\\sqrt{n}}',
    description: 'Tests if sample mean differs from population mean',
    variables: ['\\bar{x}', '\\mu_0', 's', 'n']
  },
  anovaF: {
    name: 'ANOVA F-Statistic',
    latex: 'F = \\frac{\\text{MS}_{between}}{\\text{MS}_{within}} = \\frac{\\text{SS}_{between}/(k-1)}{\\text{SS}_{within}/(N-k)}',
    description: 'Tests if means of multiple groups are equal',
    variables: ['k', 'N', 'SS']
  },
  regressionSlope: {
    name: 'Linear Regression Slope',
    latex: 'b_1 = \\frac{\\sum(x_i - \\bar{x})(y_i - \\bar{y})}{\\sum(x_i - \\bar{x})^2}',
    description: 'Slope coefficient in linear regression',
    variables: ['x_i', 'y_i', '\\bar{x}', '\\bar{y}']
  },
  regressionIntercept: {
    name: 'Linear Regression Intercept',
    latex: 'b_0 = \\bar{y} - b_1\\bar{x}',
    description: 'Y-intercept in linear regression',
    variables: ['\\bar{y}', 'b_1', '\\bar{x}']
  },
  rSquared: {
    name: 'R-Squared (Coefficient of Determination)',
    latex: 'R^2 = 1 - \\frac{\\sum(y_i - \\hat{y}_i)^2}{\\sum(y_i - \\bar{y})^2}',
    description: 'Proportion of variance explained by the model',
    variables: ['y_i', '\\hat{y}_i', '\\bar{y}']
  },
  chiSquare: {
    name: 'Chi-Square Statistic',
    latex: '\\chi^2 = \\sum\\frac{(O_i - E_i)^2}{E_i}',
    description: 'Tests independence between categorical variables',
    variables: ['O_i', 'E_i']
  },
  zScore: {
    name: 'Z-Score',
    latex: 'z = \\frac{x - \\mu}{\\sigma}',
    description: 'Number of standard deviations from the mean',
    variables: ['x', '\\mu', '\\sigma']
  },
  confidenceInterval: {
    name: '95% Confidence Interval',
    latex: 'CI = \\bar{x} \\pm 1.96 \\times \\frac{\\sigma}{\\sqrt{n}}',
    description: 'Range containing true population mean with 95% confidence',
    variables: ['\\bar{x}', '\\sigma', 'n']
  },
  effectSizeCohenD: {
    name: "Cohen's d (Effect Size)",
    latex: 'd = \\frac{\\bar{x}_1 - \\bar{x}_2}{s_{pooled}}',
    description: 'Standardized difference between two means',
    variables: ['\\bar{x}_1', '\\bar{x}_2', 's_{pooled}']
  }
};

/**
 * Get formula by key
 */
export function getFormula(key: string): FormulaDefinition | undefined {
  return STATISTICAL_FORMULAS[key];
}

/**
 * Get all formulas
 */
export function getAllFormulas(): FormulaDefinition[] {
  return Object.values(STATISTICAL_FORMULAS);
}

/**
 * Search formulas by name or description
 */
export function searchFormulas(query: string): FormulaDefinition[] {
  const lowerQuery = query.toLowerCase();
  return Object.values(STATISTICAL_FORMULAS).filter(formula =>
    formula.name.toLowerCase().includes(lowerQuery) ||
    formula.description.toLowerCase().includes(lowerQuery)
  );
}

