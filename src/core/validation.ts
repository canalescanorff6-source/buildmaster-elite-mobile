export type PrintQualityIssue = {
  code: string;
  severity: 'review' | 'block';
  message: string;
};

export type PrintQualityReport = {
  width: number;
  height: number;
  sharpness: number;
  brightness: number;
  contrast: number;
  issues: PrintQualityIssue[];
};
