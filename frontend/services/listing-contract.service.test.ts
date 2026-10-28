import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/api";
import { AxiosError, AxiosHeaders } from "axios";
import { setStoredLanguage } from "@/lib/locale";
import { useAuthStore } from "@/store/authStore";
const calls: { method?: string; url?: string; params: Record<string, unknown>; body: unknown }[] = [];
let response: unknown;
let failure: number | undefined;
const originalAdapter = api.defaults.adapter;
beforeEach(() => {
  calls.length = 0;
  response = { id: "canonical-id" };
  failure = undefined;
  useAuthStore.getState().clearAuth();
  api.defaults.adapter = async config => {
    calls.push({ method: config.method, url: config.url, params: config.params, body: config.data ? JSON.parse(config.data) : undefined });
    if (failure) throw new AxiosError("Request failed", "ERR_BAD_RESPONSE", config, undefined, { status: failure, statusText: "Failed", data: { success: false, code: "CONFLICT" }, headers: new AxiosHeaders(), config });
    return { data: { success: true, data: response }, status: 200, statusText: "OK", headers: new AxiosHeaders(), config };
  };
});
afterEach(() => { api.defaults.adapter = originalAdapter; vi.restoreAllMocks(); });
import { listingService } from "./listing.service";

type Case = [string, () => Promise<unknown>, string, string, unknown?, Record<string, unknown>?];
const cases: Case[] = [
 ["list", () => listingService.getListings(), "get", "/developers/me/listings", undefined, {page:1,pageSize:10}],
 ["all filters", () => listingService.getListings({page:2,pageSize:5,q:"Maison",status:"DRAFT",category:"house",listingType:"RENT",sort:"price_asc"}), "get", "/developers/me/listings", undefined, {page:2,pageSize:5,q:"Maison",status:"DRAFT",category:"house",listingType:"RENT",sort:"price_asc"}],
 ["counts", () => listingService.getStatusCounts(), "get", "/developers/me/listings/counts"],
 ["edit exact language", () => listingService.getListingForEdit("p1","fr"), "get", "/developers/me/listings/p1",undefined,{lang:"fr"}],
 ["create canonical IDs", () => listingService.createListing({contentLanguage:"fr",cityId:"c1",districtId:"d1",featureIds:["f1"],title:"Maison",price:150000,currencyCode:"XOF",listingType:"RENT",rentPeriod:"MONTH"}), "post", "/developers/me/listings", {contentLanguage:"fr",cityId:"c1",districtId:"d1",featureIds:["f1"],title:"Maison",price:150000,currencyCode:"XOF",listingType:"RENT",rentPeriod:"MONTH"}],
 ["versioned PATCH", () => listingService.updateListing("p1",{rowVersion:4,contentLanguage:"en",title:"House"}), "patch", "/developers/me/listings/p1",{rowVersion:4,contentLanguage:"en",title:"House"}],
 ["status", () => listingService.updateListingStatus("p1","ACTIVE"), "patch", "/developers/me/listings/p1/status",{status:"ACTIVE"}],
 ["delete", () => listingService.deleteListing("p1"), "delete", "/developers/me/listings/p1"],
 ["bulk status", () => listingService.bulkUpdateStatus(["p1","p2"],"SUSPENDED"), "patch", "/developers/me/listings/bulk-status",{ids:["p1","p2"],status:"SUSPENDED"}],
 ["bulk delete", () => listingService.bulkDelete(["p1","p2"]), "post", "/developers/me/listings/bulk-delete",{ids:["p1","p2"]}],
];
describe("HTTP adapter contract", () => {
 it.each(cases)("%s", async (_name, call, method, url, body, params) => {
   const result = await call();
   expect(calls).toHaveLength(1);
   expect(calls[0]).toEqual({ method, url, body, params: {lang:"en", ...params} });
   if (method !== "delete") expect(result).toEqual(response);
 });
 it.each([400,403,404,409,500,503])("propagates HTTP %s for visible error handling", async status => {
   failure = status;
   await expect(cases[0][1]()).rejects.toMatchObject({response:{status}});
 });
 it("sends the selected French language", async () => {
   setStoredLanguage("fr"); await cases[0][1]();
   expect(calls[0].params.lang).toBe("fr");
 });
});
