import { Router, type RequestHandler } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma.js";
import { authenticate, authorize } from "../../middleware/auth.js";
import { localeConfig } from "../../lib/localization.js";
import { sendSuccess } from "../../utils/response.js";
import { BadRequestError, ConflictError, NotFoundError } from "../../utils/errors.js";
import type { AuthenticatedRequest } from "../../types/index.js";
const router=Router();
router.use(authenticate as unknown as RequestHandler);
router.get("/",async(req,res,next)=>{try{
 const locale=await localeConfig();
 const p=await prisma.propertyDeveloper.findFirst({where:{userId:(req as AuthenticatedRequest).user.userId,deletedAt:null},select:{id:true,businessName:true,cityId:true,phoneNumber:true,whatsappNumber:true,publicEmail:true,sellerStatus:true,updatedAt:true,translations:{where:{languageCode:locale.requested}}}});
 sendSuccess(res,p?{...p,translations:undefined,contentLanguage:locale.requested,bio:p.translations[0]?.bio??"",specialization:p.translations[0]?.specialization??""}:null);
}catch(error){next(error)}});
const patch=z.object({businessName:z.string().trim().min(1).max(120),cityId:z.string().min(1),phoneNumber:z.string().trim().regex(/^\+[1-9]\d{6,14}$/),whatsappNumber:z.string().trim().regex(/^\+[1-9]\d{6,14}$/),publicEmail:z.union([z.email(),z.literal(""),z.null()]),bio:z.string().max(5000),specialization:z.string().max(500),contentLanguage:z.enum(["en","fr"]),expectedUpdatedAt:z.iso.datetime()}).strict();
router.patch("/",authorize("PROPERTY_DEVELOPER") as unknown as RequestHandler,async(req,res,next)=>{try{
 const input=patch.parse(req.body),actor=(req as AuthenticatedRequest).user;
 const result=await prisma.$transaction(async tx=>{
  await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${"profile:"+actor.userId},0))::text`;
  const profile=await tx.propertyDeveloper.findFirst({where:{id:actor.developerId,userId:actor.userId,deletedAt:null}});
  if(!profile)throw new NotFoundError("Profile not found");
  if(profile.updatedAt.toISOString()!==input.expectedUpdatedAt)throw new ConflictError("Profile changed. Reload before saving.");
  const city=await tx.city.findFirst({where:{id:input.cityId,isActive:true}});if(!city)throw new BadRequestError("City not found");
  const updated=await tx.propertyDeveloper.update({where:{id:profile.id},data:{businessName:input.businessName,cityId:city.id,city:city.name,phoneNumber:input.phoneNumber,whatsappNumber:input.whatsappNumber,publicEmail:input.publicEmail||null,sourceLanguageCode:profile.sourceLanguageCode??input.contentLanguage},select:{updatedAt:true}});
  await tx.propertyDeveloperTranslation.upsert({where:{developerId_languageCode:{developerId:profile.id,languageCode:input.contentLanguage}},create:{developerId:profile.id,languageCode:input.contentLanguage,bio:input.bio,specialization:input.specialization},update:{bio:input.bio,specialization:input.specialization}});
  return {id:profile.id,updatedAt:updated.updatedAt};
 });sendSuccess(res,result);
}catch(error){next(error)}});
export default router;
