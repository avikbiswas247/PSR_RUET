import ParticipationForm from "./participation-form";
export default async function Page({params}:{params:Promise<{type:string;targetId:string}>}){const {type,targetId}=await params;return <ParticipationForm type={type} targetId={targetId}/>;}
