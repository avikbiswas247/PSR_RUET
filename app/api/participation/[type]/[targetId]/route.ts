import { getForm, submitRequest, hasSubmission, type ParticipationField } from "@/lib/repositories/participation.repository";
import { handleApiError, jsonOk, readJson } from "@/lib/api/http";

type Params = { params: Promise<{type:string;targetId:string}> };
export async function GET(_: Request, {params}: Params) {
  try { const {type,targetId}=await params; if(type!=="event"&&type!=="exhibition") return jsonOk({message:"Invalid registration type."},404); const form=await getForm(type,targetId); if(!form||!form.enabled) return jsonOk({message:"Registration is not available."},404); return jsonOk(form); } catch(e) { return handleApiError(e); }
}
export async function POST(request: Request, {params}: Params) {
  try {
    const {type,targetId}=await params; const form=await getForm(type,targetId); if(!form||!form.enabled) return jsonOk({message:"Registration is not available."},404);
    const body=await readJson<{fullName?:string;email?:string;phone?:string;department?:string;answers?:Record<string,string>;transactionNumber?:string;photoUrls?:string[]}>(request);
    const fullName=body.fullName?.trim(), email=body.email?.trim().toLowerCase(), phone=body.phone?.trim(), department=body.department?.trim();
    if(!fullName||!email||!phone||!department||!/^\S+@\S+\.\S+$/.test(email)) return jsonOk({message:"Name, valid email, phone, and department are required."},422);
    const answers=body.answers??{}; for(const field of (form.fields as ParticipationField[])) if(field.required&&!String(answers[field.id]??"").trim()) return jsonOk({message:`${field.label} is required.`},422);
    if(form.is_paid&&!body.transactionNumber?.trim()) return jsonOk({message:"Enter your bKash transaction number to submit."},422);
    if(await hasSubmission(form.id,email)) return jsonOk({message:"A request with this email has already been submitted."},409);
    const photos=(body.photoUrls??[]).map(x=>String(x).trim()).filter(x=>/^https:\/\//.test(x)).slice(0,100);
    return jsonOk(await submitRequest(form.id,{full_name:fullName,email,phone,department,answers,transaction_number:body.transactionNumber?.trim()||null,photo_urls:photos}),201);
  } catch(e) { return handleApiError(e); }
}
