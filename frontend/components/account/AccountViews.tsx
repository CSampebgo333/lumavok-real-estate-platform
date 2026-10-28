"use client";
import Link from "next/link";
import {useState,useEffect} from "react";
import {useQuery,useMutation,useQueryClient} from "@tanstack/react-query";
import {useUi} from "@/components/common/UiText";
import {useContentLocale} from "@/hooks/useContentLocale";
import {useLocations} from "@/hooks/useLocations";
import {useAuthStore} from "@/store/authStore";
import {accountService,type SellerProfile} from "@/services/account.service";
import {getErrorMessage} from "@/lib/errors";
import {formatDate,formatDateTime} from "@/lib/formatters";
import {FormField} from "@/components/ui/form-field";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Loading} from "@/components/common/Loading";
import {PageHeader} from "@/components/common/PageHeader";
import {Pagination} from "@/components/common/Pagination";
import {AppointmentStatusBadge} from "@/components/dashboard/StatusBadge";

export function SellerProfileView(){
 const ui=useUi(),{language}=useContentLocale(),id=useAuthStore(s=>s.user?.id),role=useAuthStore(s=>s.user?.role);
 const [contentLanguage,setContentLanguage]=useState<"en"|"fr">(language),[dirty,setDirty]=useState(false);
 const query=useQuery({queryKey:["seller-profile",id,contentLanguage],queryFn:()=>accountService.getProfile(contentLanguage),refetchOnWindowFocus:false});
 useEffect(()=>{if(!dirty)return;const warn=(e:BeforeUnloadEvent)=>e.preventDefault();window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn)},[dirty]);
 return <div className="container-page w-full max-w-3xl py-8"><PageHeader title={ui("Seller profile")} lede={ui("Manage your public business details and translations.")}/>
 <label className="my-5 block">{ui("Content language")} <select className="border-border rounded border p-2" value={contentLanguage} onChange={e=>{if(dirty&&!window.confirm(ui("Leave without saving?")))return;setDirty(false);setContentLanguage(e.target.value as "en"|"fr")}}><option value="fr">Français</option><option value="en">English</option></select></label>
 {query.isLoading?<Loading/>:query.isError?<p role="alert">{getErrorMessage(query.error)} <Button onClick={()=>query.refetch()}>{ui("Retry")}</Button></p>:query.data?.sellerStatus==="PENDING"?<p role="status">{ui("Your seller application is awaiting administrator approval.")}</p>:role==="ADMIN"?<Link href="/admin">{ui("Seller approvals")}</Link>:query.data&&query.data.sellerStatus!=="ACTIVE"?<p role="status">{ui("Your seller account is unavailable. Contact the platform team.")}</p>:<ProfileForm key={`${contentLanguage}-${query.data?.updatedAt??"new"}`} profile={query.data??null} contentLanguage={contentLanguage} onDirty={setDirty}/>}
 </div>;
}
function ProfileForm({profile,contentLanguage,onDirty}:{profile:SellerProfile|null;contentLanguage:"en"|"fr";onDirty:(value:boolean)=>void}){
 const ui=useUi(),cities=useLocations(),cache=useQueryClient();const [busy,setBusy]=useState(false),[error,setError]=useState<string|null>(null);
 async function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();if(!e.currentTarget.reportValidity())return;const f=new FormData(e.currentTarget),val=(key:string)=>String(f.get(key)??"").trim();setBusy(true);setError(null);try{
  const base={businessName:val('businessName'),cityId:val('cityId'),phoneNumber:val('phoneNumber'),whatsappNumber:val('whatsappNumber')};
  if(profile)await accountService.updateProfile({...base,publicEmail:val('publicEmail')||null,bio:val('bio'),specialization:val('specialization'),contentLanguage,expectedUpdatedAt:profile.updatedAt});else await accountService.requestSeller(base);
  onDirty(false);await cache.invalidateQueries({queryKey:['seller-profile']});await cache.invalidateQueries({queryKey:['developers']});
 }catch(err){setError(getErrorMessage(err))}finally{setBusy(false)}}
 return <form method="post" onSubmit={submit} onChange={()=>onDirty(true)} className="mt-5 flex flex-col gap-4">
 <FormField label={ui("Business name")} htmlFor="businessName"><Input id="businessName" name="businessName" defaultValue={profile?.businessName??''} required maxLength={120}/></FormField>
 <FormField label={ui("City")} htmlFor="cityId"><select id="cityId" name="cityId" required defaultValue={profile?.cityId??''} className="border-border rounded border p-2"><option value="">{ui("Choose a city…")}</option>{cities.data?.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></FormField>
 {cities.isError&&<p role="alert">{ui("Cities could not be loaded.")}</p>}
 <FormField label={ui("Phone number (international format)")} htmlFor="phoneNumber"><Input type="tel" id="phoneNumber" name="phoneNumber" placeholder="+22670000000" defaultValue={profile?.phoneNumber??''} required pattern="\+[1-9][0-9]{6,14}"/></FormField>
 <FormField label={ui("WhatsApp number (international format)")} htmlFor="whatsappNumber"><Input type="tel" id="whatsappNumber" name="whatsappNumber" placeholder="+22670000000" defaultValue={profile?.whatsappNumber??''} required pattern="\+[1-9][0-9]{6,14}"/></FormField>
 {profile&&<><FormField label={ui("Public contact email (optional)")} htmlFor="publicEmail"><Input type="email" id="publicEmail" name="publicEmail" defaultValue={profile.publicEmail??''}/></FormField><p className="text-muted-foreground text-sm">{ui("Only this contact email is public. Your sign-in email stays private.")}</p>
 <FormField label={ui("Biography")} htmlFor="bio"><textarea id="bio" name="bio" defaultValue={profile.bio} maxLength={5000} rows={5} className="border-border rounded border p-2"/></FormField>
 <FormField label={ui("Specialization")} htmlFor="specialization"><Input id="specialization" name="specialization" defaultValue={profile.specialization} maxLength={500}/></FormField><p className="text-muted-foreground text-sm">{ui("This editor shows only the selected translation. Save before switching languages.")}</p></>}
 {error&&<p role="alert" className="text-destructive">{error}</p>}<Button disabled={busy||!cities.data?.length} type="submit">{ui(busy?"Saving…":profile?"Save changes":"Apply to become a seller")}</Button></form>;
}
export function SellerApprovals(){
 const ui=useUi(),cache=useQueryClient(),[page,setPage]=useState(1);const query=useQuery({queryKey:['seller-approvals',page],queryFn:()=>accountService.pendingSellers(page)});const approve=useMutation({mutationFn:accountService.activateSeller,onSuccess:()=>cache.invalidateQueries({queryKey:['seller-approvals']})});
 return <div className="container-page w-full py-8"><PageHeader title={ui("Seller approvals")} lede={ui("Approve a seller only after reviewing their identity and business information.")}/>{query.isLoading?<Loading/>:query.isError?<p role="alert">{getErrorMessage(query.error)}</p>:<>{query.data?.items.length===0&&<p className="py-8">{ui("No pending applications.")}</p>}<ul className="my-6 flex flex-col gap-3">{query.data?.items.map(p=><li key={p.id} className="border-border flex flex-wrap items-center justify-between gap-4 rounded border p-4"><div><h2 className="font-semibold">{p.businessName}</h2><p>{p.city} · {formatDate(p.createdAt)}</p></div><Button disabled={approve.isPending} onClick={()=>approve.mutate(p.id)}>{ui("Activate seller")}</Button></li>)}</ul>{query.data&&<Pagination page={page} totalPages={query.data.totalPages} onPageChange={setPage}/>}</>}{approve.isError&&<p role="alert">{getErrorMessage(approve.error)}</p>}</div>;
}
export function ViewingRequest({propertyId}:{propertyId:string}){
 const ui=useUi(),authenticated=useAuthStore(s=>s.isAuthenticated);const [busy,setBusy]=useState(false),[sent,setSent]=useState(false),[error,setError]=useState<string|null>(null);
 if(!authenticated)return <p><Link className="text-primary underline" href="/login">{ui("Sign in to request a viewing")}</Link></p>;
 if(sent)return <p role="status">{ui("Viewing requested. The seller will confirm the time.")} <Link href="/my-viewings" className="underline">{ui("My viewings")}</Link></p>;
 async function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();const f=new FormData(e.currentTarget),date=new Date(String(f.get('date')));if(!Number.isFinite(date.getTime()))return;setBusy(true);setError(null);try{await accountService.requestViewing(propertyId,date.toISOString());setSent(true)}catch(err){setError(getErrorMessage(err))}finally{setBusy(false)}}
 return <form method="post" onSubmit={submit} className="flex flex-col gap-3"><FormField label={ui("Preferred viewing time")} htmlFor="viewing-date"><Input type="datetime-local" id="viewing-date" name="date" required/></FormField><p className="text-muted-foreground text-xs">{ui("Times use your device's timezone. A request is not a confirmed booking.")}</p>{error&&<p role="alert" className="text-destructive">{error}</p>}<Button disabled={busy} type="submit">{ui(busy?"Sending…":"Request a viewing")}</Button></form>;
}
export function MyViewings(){const ui=useUi(),[page,setPage]=useState(1),{language}=useContentLocale(),id=useAuthStore(s=>s.user?.id);const query=useQuery({queryKey:['my-viewings',id,language,page],queryFn:()=>accountService.myViewings(page)});
 return <div className="container-page w-full py-8"><PageHeader title={ui("My viewings")}/>{query.isLoading?<Loading/>:query.isError?<p role="alert">{getErrorMessage(query.error)}</p>:<>{query.data?.items.length===0&&<p className="py-8">{ui("No appointments yet")}</p>}<ul className="my-6 flex flex-col gap-3">{query.data?.items.map(a=><li key={a.id} className="border-border rounded border p-4"><h2 className="font-semibold">{a.propertyTitle}</h2><p>{formatDateTime(a.scheduledFor)}</p><AppointmentStatusBadge status={a.status}/></li>)}</ul>{query.data&&<Pagination page={page} totalPages={query.data.totalPages} onPageChange={setPage}/>}</>}</div>;
}
