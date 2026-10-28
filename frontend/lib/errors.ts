import {isAxiosError} from "axios";
import {getStoredLanguage} from "@/lib/locale";
import {translateUi} from "@/lib/ui-text";
import type {ApiResponse} from "@/types";
const messages:Record<string,[string,string]>={
 AUTH_UNAVAILABLE:["Authentication is temporarily unavailable. Try again later.","L’authentification est temporairement indisponible. Réessayez plus tard."],INVALID_CREDENTIALS:["Invalid email or password.","Adresse e-mail ou mot de passe incorrect."],UNAUTHORIZED:["Please sign in again.","Veuillez vous reconnecter."],FORBIDDEN:["You do not have permission for this action.","Vous n’avez pas l’autorisation d’effectuer cette action."],NOT_FOUND:["This resource is no longer available.","Cette ressource n’est plus disponible."],CONFLICT:["This record changed or already exists. Refresh and try again.","Cet élément a été modifié ou existe déjà. Actualisez puis réessayez."],VALIDATION_ERROR:["Check the form fields and try again.","Vérifiez les champs du formulaire et réessayez."],BAD_REQUEST:["Check your request and try again.","Vérifiez votre demande et réessayez."],INVALID_TRANSITION:["This status change is not allowed.","Ce changement de statut n’est pas autorisé."],INVALID_TOKEN:["This link is invalid or expired. Request a new one.","Ce lien est invalide ou expiré. Demandez-en un nouveau."],RATE_LIMITED:["Too many requests. Please try again later.","Trop de demandes. Veuillez réessayer plus tard."],INVALID_BODY:["The request is invalid or too large.","La demande est invalide ou trop volumineuse."],FILE_TOO_LARGE:["The file is too large.","Le fichier est trop volumineux."],INVALID_VIEWING_DATE:["Choose a future time within 180 days.","Choisissez une date future dans les 180 prochains jours."],SESSION_REVOCATION_FAILED:["We could not end the server session. Try signing out again.","La session serveur n’a pas pu être fermée. Réessayez de vous déconnecter."],REGISTRATION_FAILED:["Unable to create the account. Check the details and try again.","Impossible de créer le compte. Vérifiez les informations et réessayez."],UNSUPPORTED_LANGUAGE:["This language is not supported.","Cette langue n’est pas prise en charge."],INVALID_IMAGE:["Upload a valid JPEG, PNG or WebP image.","Choisissez une image JPEG, PNG ou WebP valide."],STORAGE_UNAVAILABLE:["Media storage is temporarily unavailable.","Le stockage des images est temporairement indisponible."]};
/** Stable API codes localize errors without displaying provider or database internals. */
export function getErrorMessage(error:unknown):string{
 const lang=getStoredLanguage(),fr=lang==="fr";
 if(isAxiosError<ApiResponse<unknown>>(error)){
  if(!error.response)return fr?"Connexion impossible. Vérifiez votre connexion et réessayez.":"Unable to connect. Check your connection and try again.";
  const code=(error.response.data as {code?:string})?.code;if(code&&messages[code])return messages[code][fr?1:0];
  if(error.response.status>=500)return fr?"Le service est temporairement indisponible. Réessayez plus tard.":"The service is temporarily unavailable. Try again later.";
  return fr?"La demande a échoué. Vérifiez les informations et réessayez.":"The request failed. Check the details and try again.";
 }
 if(error instanceof Error)return translateUi(error.message,lang);
 return fr?"Une erreur est survenue. Veuillez réessayer.":"Something went wrong. Please try again.";
}
