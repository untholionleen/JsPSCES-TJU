import {SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,SITE_URL,ENABLE_CLOUD_AUTH,HISTORY_LIMIT} from '../config.js';
const TOKEN_KEY='tju_thermohub_auth_v1';
let session=null, user=null;
const headers=(token)=>({'apikey':SUPABASE_PUBLISHABLE_KEY,'Content-Type':'application/json',...(token?{'Authorization':`Bearer ${token}`}:{})});
async function request(path,{method='GET',body,token,prefer}={}){
 const res=await fetch(`${SUPABASE_URL}${path}`,{method,headers:{...headers(token),...(prefer?{'Prefer':prefer}:{})},body:body===undefined?undefined:JSON.stringify(body)});
 const text=await res.text();let data=null;try{data=text?JSON.parse(text):null;}catch{data=text;}
 if(!res.ok){const msg=data?.msg||data?.message||data?.error_description||data?.error||`HTTP ${res.status}`;throw new Error(msg);}
 return data;
}
export function cloudEnabled(){return ENABLE_CLOUD_AUTH;}
export function getSession(){return session;}
export function getUser(){return user;}
export async function initAuth(){
 if(!ENABLE_CLOUD_AUTH)return null;
 const hash=new URLSearchParams(location.hash.replace(/^#/,'?'));
 const access=hash.get('access_token'),refresh=hash.get('refresh_token');
 if(access){session={access_token:access,refresh_token:refresh,expires_at:Number(hash.get('expires_at')||0)};localStorage.setItem(TOKEN_KEY,JSON.stringify(session));history.replaceState({},document.title,location.pathname+location.search+'#/home');}
 const saved=localStorage.getItem(TOKEN_KEY);if(!session&&saved){try{session=JSON.parse(saved);}catch{localStorage.removeItem(TOKEN_KEY);}}
 if(session?.access_token){try{user=await request('/auth/v1/user',{token:session.access_token});return user;}catch{if(session.refresh_token){try{const d=await request('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:{refresh_token:session.refresh_token}});setSession(d);user=d.user;return user;}catch{}}clearSession();}}
 return null;
}
function setSession(data){session=data;user=data.user||user;localStorage.setItem(TOKEN_KEY,JSON.stringify(data));}
function clearSession(){session=null;user=null;localStorage.removeItem(TOKEN_KEY);}
export async function signUp({email,password,displayName}){
 const data=await request('/auth/v1/signup?redirect_to='+encodeURIComponent(SITE_URL),{method:'POST',body:{email,password,data:{display_name:displayName,full_name:displayName}},token:null});
 return data;
}
export async function verifySignupOtp({email,token}){
 const data=await request('/auth/v1/verify',{method:'POST',body:{type:'signup',email,token}});if(data.access_token)setSession(data);return data;
}
export async function resendSignupOtp(email){return request('/auth/v1/resend',{method:'POST',body:{type:'signup',email}});}
export async function signIn({email,password}){const data=await request('/auth/v1/token?grant_type=password',{method:'POST',body:{email,password}});setSession(data);return data.user;}
export async function requestPasswordReset(email){return request('/auth/v1/recover?redirect_to='+encodeURIComponent(SITE_URL+'?auth=recovery'),{method:'POST',body:{email}});}
export async function updatePassword(password){if(!session?.access_token)throw new Error('Please sign in again using the password-reset email link.');const data=await request('/auth/v1/user',{method:'PUT',body:{password},token:session.access_token});user=data;return data;}
export async function signOut(){if(session?.access_token){try{await request('/auth/v1/logout',{method:'POST',token:session.access_token});}finally{clearSession();}}else clearSession();}
export async function updateDisplayName(displayName){if(!session?.access_token||!user)throw new Error('Please sign in first.');await request('/rest/v1/thermo_profiles?id=eq.'+encodeURIComponent(user.id),{method:'PATCH',body:{display_name:displayName,updated_at:new Date().toISOString()},token:session.access_token,prefer:'return=minimal'});}
export async function saveCalculation(record){if(!session?.access_token||!user)throw new Error('Sign in to save calculation history to the cloud.');const payload={user_id:user.id,calculation_type:record.type,model_key:record.model||null,input_data:record.input||{},result_data:record.result||{},source_info:record.source||{app_version:'13.1.0'}};return request('/rest/v1/thermo_calculation_history',{method:'POST',body:payload,token:session.access_token,prefer:'return=representation'});}
export async function listHistory(){if(!session?.access_token||!user)return [];const q=`/rest/v1/thermo_calculation_history?select=id,calculation_type,model_key,input_data,result_data,source_info,created_at&user_id=eq.${encodeURIComponent(user.id)}&order=created_at.desc&limit=${HISTORY_LIMIT}`;return request(q,{token:session.access_token})||[];}
export async function deleteHistory(id){if(!session?.access_token||!user)throw new Error('Sign in first.');return request(`/rest/v1/thermo_calculation_history?id=eq.${encodeURIComponent(id)}&user_id=eq.${encodeURIComponent(user.id)}`,{method:'DELETE',token:session.access_token,prefer:'return=minimal'});}
