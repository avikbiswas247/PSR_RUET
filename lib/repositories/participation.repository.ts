import { many, one } from "./_shared";

export type ParticipationField = { id: string; label: string; type: "text" | "textarea" | "number" | "select" | "email" | "tel"; required: boolean; options?: string[] };
export type ParticipationForm = { id: string; target_type: "event" | "exhibition"; target_id: string; title: string; fields: ParticipationField[]; is_paid: boolean; bkash_numbers: string[]; enabled: boolean };
export type ParticipationRequest = { id: string; form_id: string; full_name: string; email: string; phone: string; department: string; answers: Record<string,string>; transaction_number: string|null; photo_urls: string[]; selected_photo_urls: string[]; status: "PENDING"|"ACCEPTED"|"DECLINED"; is_selected: boolean; submitted_at: string };

export async function getForm(type: string, id: string) {
  return one<ParticipationForm>(`SELECT f.*, COALESCE(e.title, x.title, 'Registration') AS title FROM participation_forms f LEFT JOIN events e ON f.target_type='event' AND e.id=f.target_id LEFT JOIN exhibitions x ON f.target_type='exhibition' AND x.id=f.target_id WHERE f.target_type=$1 AND f.target_id=$2`, [type,id]);
}
export async function saveForm(type: "event"|"exhibition", id: string, fields: ParticipationField[], isPaid: boolean, numbers: string[], enabled: boolean) {
  return one<ParticipationForm>(`INSERT INTO participation_forms(target_type,target_id,fields,is_paid,bkash_numbers,enabled) VALUES($1,$2,$3::jsonb,$4,$5,$6) ON CONFLICT(target_type,target_id) DO UPDATE SET fields=EXCLUDED.fields,is_paid=EXCLUDED.is_paid,bkash_numbers=EXCLUDED.bkash_numbers,enabled=EXCLUDED.enabled,updated_at=NOW() RETURNING *`, [type,id,JSON.stringify(fields),isPaid,numbers,enabled]);
}
export async function submitRequest(formId: string, input: Omit<ParticipationRequest,"id"|"form_id"|"status"|"is_selected"|"submitted_at"|"selected_photo_urls">) {
  return one<ParticipationRequest>(`INSERT INTO participation_requests(form_id,full_name,email,phone,department,answers,transaction_number,photo_urls) VALUES($1,$2,$3,$4,$5,$6::jsonb,$7,$8) RETURNING *`, [formId,input.full_name,input.email,input.phone,input.department,JSON.stringify(input.answers),input.transaction_number,input.photo_urls]);
}
export async function listRequests(formId: string) {
  return many<ParticipationRequest>(`SELECT * FROM participation_requests WHERE form_id=$1 ORDER BY submitted_at DESC`, [formId]);
}
export async function reviewRequest(id: string, status: "ACCEPTED"|"DECLINED") {
  return one<ParticipationRequest>(`UPDATE participation_requests SET status=$2,reviewed_at=NOW() WHERE id=$1 RETURNING *`,[id,status]);
}
export async function selectRequest(id: string, selected: boolean) {
  return one<ParticipationRequest>(`UPDATE participation_requests SET is_selected=$2 WHERE id=$1 RETURNING *`,[id,selected]);
}
export async function selectPhoto(id:string,url:string,selected:boolean) {
  return one<ParticipationRequest>(`UPDATE participation_requests SET selected_photo_urls=CASE WHEN $3 THEN (SELECT ARRAY(SELECT DISTINCT x FROM unnest(selected_photo_urls || ARRAY[$2]::text[]) x)) ELSE array_remove(selected_photo_urls,$2) END WHERE id=$1 RETURNING *`,[id,url,selected]);
}
export async function getRequest(id: string) { return one<ParticipationRequest>(`SELECT * FROM participation_requests WHERE id=$1`,[id]); }
export async function hasSubmission(formId: string,email: string) { return one<{id:string}>(`SELECT id FROM participation_requests WHERE form_id=$1 AND lower(email)=lower($2)`,[formId,email]); }
