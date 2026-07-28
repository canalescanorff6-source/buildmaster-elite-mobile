export type PrintQualityIssue = {
  code: string;
  severity: 'review' | 'block';
  message: string;
};

export type PrintQualityState = 'ready' | 'review' | 'blocked';

export type PrintQualityMetrics = {
  width: number;
  height: number;
  sharpness: number;
  brightness: number;
  contrast: number;
  laplacianVariance: number;
  darkClipRatio: number;
  lightClipRatio: number;
  glareRatio: number;
  blockiness: number;
  textEdgeDensity: number;
};

export type PrintQualityReport = PrintQualityMetrics & {
  score: number;
  state: PrintQualityState;
  issues: PrintQualityIssue[];
  recommendations: string[];
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

export function buildPrintQualityReport(metrics: PrintQualityMetrics): PrintQualityReport {
  const issues: PrintQualityIssue[] = [];
  const recommendations: string[] = [];
  const shortest = Math.min(metrics.width, metrics.height);
  const longest = Math.max(metrics.width, metrics.height);

  if (shortest < 640 || longest < 900) {
    issues.push({ code: 'VERY_LOW_RESOLUTION', severity: 'block', message: 'Resolução insuficiente para leitura rígida. Use o print original, sem captura de aplicativo de mensagens.' });
    recommendations.push('Envie a captura original em resolução maior, sem redimensionar.');
  } else if (shortest < 800 || longest < 1200) {
    issues.push({ code: 'LOW_RESOLUTION', severity: 'review', message: 'Resolução abaixo do ideal: nomes pequenos e habilidades podem exigir confirmação.' });
    recommendations.push('Prefira o print direto do jogo em tela cheia.');
  }

  if (metrics.sharpness < 6 || metrics.laplacianVariance < 18) {
    issues.push({ code: 'SEVERE_BLUR', severity: 'block', message: 'Imagem desfocada demais para aceitar nome, números e habilidades automaticamente.' });
    recommendations.push('Refaça a captura sem movimento e sem zoom digital.');
  } else if (metrics.sharpness < 10 || metrics.laplacianVariance < 38) {
    issues.push({ code: 'LOW_SHARPNESS', severity: 'review', message: 'Nitidez baixa: o scanner fará mais passagens e manterá campos críticos em revisão.' });
    recommendations.push('Use a imagem original e evite enviar por aplicativos que comprimem o arquivo.');
  }

  if (metrics.brightness < 32 || metrics.brightness > 228) {
    issues.push({ code: 'SEVERE_EXPOSURE', severity: 'block', message: 'Exposição extrema: partes da carta perderam detalhes importantes.' });
    recommendations.push('Desative filtros de brilho, modo noturno e reflexos antes de capturar.');
  } else if (metrics.brightness < 48 || metrics.brightness > 212) {
    issues.push({ code: 'BAD_BRIGHTNESS', severity: 'review', message: 'Brilho fora da faixa ideal para textos pequenos.' });
  }

  if (metrics.contrast < 16) {
    issues.push({ code: 'VERY_LOW_CONTRAST', severity: 'block', message: 'Contraste insuficiente para separar texto, números e fundo.' });
    recommendations.push('Use a captura sem filtro e com a interface do jogo totalmente visível.');
  } else if (metrics.contrast < 25) {
    issues.push({ code: 'LOW_CONTRAST', severity: 'review', message: 'Contraste baixo: valores próximos podem ser confundidos.' });
  }

  if (metrics.glareRatio > 0.18 || metrics.lightClipRatio > 0.30) {
    issues.push({ code: 'STRONG_GLARE', severity: 'block', message: 'Reflexo ou áreas estouradas cobrem uma parte relevante da tela.' });
    recommendations.push('Se for foto da tela, mude o ângulo e reduza o brilho do aparelho fotografado.');
  } else if (metrics.glareRatio > 0.075 || metrics.lightClipRatio > 0.16) {
    issues.push({ code: 'GLARE', severity: 'review', message: 'Há reflexos ou brancos estourados que podem apagar letras.' });
  }

  if (metrics.darkClipRatio > 0.62 && metrics.contrast < 34) {
    issues.push({ code: 'DARK_CLIPPING', severity: 'review', message: 'Muitas áreas ficaram totalmente escuras e com pouco contraste.' });
  }

  if (metrics.blockiness > 19) {
    issues.push({ code: 'HEAVY_COMPRESSION', severity: 'review', message: 'Compressão forte detectada: bordas de letras e números ficaram quadriculadas.' });
    recommendations.push('Evite prints recebidos por WhatsApp, Instagram ou redes sociais; use o arquivo original.');
  }

  if (metrics.textEdgeDensity < 0.018 && metrics.contrast < 30) {
    issues.push({ code: 'LOW_TEXT_DETAIL', severity: 'review', message: 'Poucos detalhes finos foram detectados; o texto pode estar pequeno ou suavizado.' });
  }

  const resolutionScore = clamp((shortest / 900) * 55 + (longest / 1600) * 45);
  const sharpnessScore = clamp(metrics.sharpness * 5.8 + Math.sqrt(Math.max(0, metrics.laplacianVariance)) * 4.2);
  const contrastScore = clamp(metrics.contrast * 2.8);
  const exposureScore = clamp(100 - Math.abs(metrics.brightness - 132) * 0.72 - metrics.glareRatio * 170 - metrics.lightClipRatio * 85);
  const compressionScore = clamp(100 - metrics.blockiness * 2.7);
  const penalty = issues.reduce((sum, issue) => sum + (issue.severity === 'block' ? 17 : 6), 0);
  const score = Math.round(clamp(
    resolutionScore * 0.20
      + sharpnessScore * 0.29
      + contrastScore * 0.20
      + exposureScore * 0.19
      + compressionScore * 0.12
      - penalty
  ));
  const state: PrintQualityState = issues.some((issue) => issue.severity === 'block') ? 'blocked' : issues.length ? 'review' : 'ready';

  return {
    ...metrics,
    score,
    state,
    issues,
    recommendations: Array.from(new Set(recommendations))
  };
}
