import { createEfhubCardPreview, createSmartCardPreview, type CardCropResult } from './cardArtCrop';
import { inspectSinglePrintGeometry } from './singlePrintPro';
import { applyRememberedCardBox, findBestOcrTemplateCalibration } from './templateCalibration';

/** R130 — criação isolada do preview da carta; sem estado de UI. */
export async function createPlayerCardPreviewR130(file: File): Promise<CardCropResult | null> {
  try {
    const geometry = await inspectSinglePrintGeometry(file);
    const calibration = await findBestOcrTemplateCalibration(geometry.template, geometry.width, geometry.height);
    const remembered = applyRememberedCardBox(geometry.cardArtZone, calibration);
    return geometry.template === 'detailed-profile'
      ? await createEfhubCardPreview(file, remembered)
      : await createSmartCardPreview(file, remembered);
  } catch {
    return null;
  }
}
