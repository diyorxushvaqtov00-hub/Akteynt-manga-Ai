export type PageStatus =
  | "pending" | "processing" | "translated"
  | "failed" | "failed_retryable" | "failed_hard";

export type PipelineStage =
  | "UPLOADED" | "EXTRACTED" | "NORMALIZED" | "DETECTED" | "OCR_DONE"
  | "ANALYZED" | "TRANSLATED" | "TRANSLATION_QA" | "CLEAN_PLAN_READY"
  | "CLEANED" | "CLEAN_QA" | "TYPESET" | "VISUAL_QA" | "READY";

export interface MangaPage {
  id:string; jobId:string; pageNumber:number; status:PageStatus;
  stage?:PipelineStage; originalImagePath:string|null;
  translatedImagePath:string|null; error:string|null;
}

export function createPageRecords(jobId:string,totalPages:number):MangaPage[]{
  return Array.from({length:totalPages},(_,index)=>({
    id:crypto.randomUUID(),jobId,pageNumber:index+1,status:"pending",
    stage:"UPLOADED",originalImagePath:null,translatedImagePath:null,error:null
  }));
}
export function calculateProgress(pages:MangaPage[]){
  if(!pages.length)return 0;
  return Math.round((pages.filter(p=>p.stage==="READY").length/pages.length)*100);
}
export function assertStageOrder(current:PipelineStage,next:PipelineStage){
  const order:PipelineStage[]=["UPLOADED","EXTRACTED","NORMALIZED","DETECTED","OCR_DONE","ANALYZED","TRANSLATED","TRANSLATION_QA","CLEAN_PLAN_READY","CLEANED","CLEAN_QA","TYPESET","VISUAL_QA","READY"];
  if(order.indexOf(next)<order.indexOf(current)) throw new Error("PIPELINE_STAGE_REGRESSION: "+current+" -> "+next);
}