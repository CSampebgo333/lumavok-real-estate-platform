import {api} from "@/lib/api";
import type {ApiResponse,Appointment,PaginatedResult} from "@/types";
export interface SellerProfile{id:string;businessName:string;cityId:string;phoneNumber:string;whatsappNumber:string;publicEmail:string|null;sellerStatus:string;updatedAt:string;bio:string;specialization:string;contentLanguage:"en"|"fr"}
export interface SellerRequest{businessName:string;cityId:string;phoneNumber:string;whatsappNumber:string}
export type ProfilePatch=SellerRequest&{publicEmail:string|null;bio:string;specialization:string;contentLanguage:"en"|"fr";expectedUpdatedAt:string};
export interface PendingSeller{id:string;businessName:string;city:string;createdAt:string}
export const accountService={
 getProfile:(lang:"en"|"fr")=>api.get<ApiResponse<SellerProfile|null>>("/sellers/me",{params:{lang}}).then(r=>r.data.data),
 requestSeller:(input:SellerRequest)=>api.post<ApiResponse<SellerProfile>>("/sellers/request",input).then(r=>r.data.data),
 updateProfile:(input:ProfilePatch)=>api.patch<ApiResponse<{id:string;updatedAt:string}>>("/sellers/me",input).then(r=>r.data.data),
 pendingSellers:(page=1)=>api.get<ApiResponse<PaginatedResult<PendingSeller>>>("/sellers/pending",{params:{page,pageSize:20}}).then(r=>r.data.data),
 activateSeller:(id:string)=>api.post<ApiResponse<{id:string;sellerStatus:string}>>(`/sellers/${encodeURIComponent(id)}/activate`).then(r=>r.data.data),
 requestViewing:(propertyId:string,scheduledFor:string)=>api.post<ApiResponse<{id:string;status:string}>>("/viewings",{propertyId,scheduledFor}).then(r=>r.data.data),
 myViewings:(page=1)=>api.get<ApiResponse<PaginatedResult<Appointment>>>("/viewings",{params:{page,pageSize:10}}).then(r=>r.data.data),
};
