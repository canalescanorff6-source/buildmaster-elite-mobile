import { createEfhubCardPreview, createSmartCardPreview, createManualEfhubCardPreview, type CardCropResult } from './cardArtCrop';
import type {ReaderV2Zone} from '../card-reader-v2/readerV2Types';
import { inspectSinglePrintGeometry } from './singlePrintPro';
import { applyRememberedCardBox, findBestOcrTemplateCalibration } from './templateCalibration';

/** R130 — criação isolada do preview da carta; sem estado de UI. */
export async function createPlayerCardPreviewR130(file: File, calibrationZones?:ReaderV2Zone[]): Promise<CardCropResult | null> {
  try {
    let frame:import('../card-reader-v2/readerV2Frame').ReaderV2Frame|undefined;
    try{
      const {openReaderV2ImageSession}=await import('../card-reader-v2/readerV2ImageSession');
      const session=await openReaderV2ImageSession(file);
      try{frame=session.frame}finally{session.close()}
    }catch{/* Other layouts retain the established photo detector. */}
    if(calibrationZones||frame&&(frame.w<.94||frame.h<.92)){
      const {READER_V2_DEFAULT_ZONES,resolveReaderV2FrameZones}=await import('../card-reader-v2/readerV2ZoneProfile');
      const card=resolveReaderV2FrameZones(calibrationZones??READER_V2_DEFAULT_ZONES,frame).find(zone=>zone.key==='cardType'&&zone.enabled);
      if(card)return await (calibrationZones?createManualEfhubCardPreview(file,card):createEfhubCardPreview(file,card));
    }
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
