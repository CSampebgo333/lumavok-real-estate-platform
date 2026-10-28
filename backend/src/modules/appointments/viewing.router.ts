import { Router, type RequestHandler } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma.js";
import { authenticate } from "../../middleware/auth.js";
import { sendSuccess } from "../../utils/response.js";
import { BadRequestError, ConflictError, NotFoundError } from "../../utils/errors.js";
import { localeConfig } from "../../lib/localization.js";
import { appointmentInclude, mapAppointment } from "./appointment.service.js";
import { parsePagination, paginateResult } from "../../utils/pagination.js";
import type { AuthenticatedRequest } from "../../types/index.js";
const router=Router();router.use(authenticate as unknown as RequestHandler);
router.get("/",async(req,res,next)=>{try{
 const {page,pageSize,skip,take}=parsePagination({page:Number(req.query.page??1),pageSize:Number(req.query.pageSize??10)});
 const where={clientUserId:(req as AuthenticatedRequest).user.userId},locale=await localeConfig();
 const [rows,total]=await Promise.all([prisma.appointment.findMany({where,skip,take,orderBy:[{createdAt:"desc"},{id:"asc"}],include:appointmentInclude}),prisma.appointment.count({where})]);
 sendSuccess(res,paginateResult(rows.map(a=>mapAppointment(a,locale)),total,page,pageSize));
}catch(error){next(error)}});
router.post("/",async(req,res,next)=>{try{
 const input=z.object({propertyId:z.string().min(1).max(100),scheduledFor:z.iso.datetime({offset:true})}).strict().parse(req.body);
 const date=new Date(input.scheduledFor),now=Date.now();if(date.getTime()<=now||date.getTime()>now+180*86400000)throw new BadRequestError("Choose a future time within 180 days","INVALID_VIEWING_DATE");
 const actor=(req as AuthenticatedRequest).user;
 const result=await prisma.$transaction(async tx=>{
  await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${"viewing:"+actor.userId+":"+input.propertyId},0))::text`;
  const property=await tx.property.findFirst({where:{id:input.propertyId,status:"ACTIVE",deletedAt:null},select:{id:true,propertyDeveloperId:true}});if(!property)throw new NotFoundError("Property not available");
  if(property.propertyDeveloperId===actor.developerId)throw new BadRequestError("Cannot request a viewing of your own property");
  const duplicate=await tx.appointment.findFirst({where:{propertyId:property.id,clientUserId:actor.userId,status:{in:["REQUESTED","CONFIRMED","RESCHEDULED"]}},select:{id:true}});if(duplicate)throw new ConflictError("An open viewing request already exists");
  const account=await tx.user.findUniqueOrThrow({where:{id:actor.userId},select:{fullName:true}});
  const a=await tx.appointment.create({data:{propertyId:property.id,propertyDeveloperId:property.propertyDeveloperId,clientUserId:actor.userId,clientName:account.fullName??"Client",scheduledFor:date}});
  await tx.appointmentHistory.create({data:{appointmentId:a.id,type:"APPOINTMENT_REQUESTED",message:"Viewing requested."}});return {id:a.id,status:a.status,scheduledFor:a.scheduledFor};
 });sendSuccess(res,result,201);
}catch(error){next(error)}});
export default router;
