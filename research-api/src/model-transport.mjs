/* Fixed-route optional Cloudflare AI Gateway OpenAI Responses transport.
 * Never allow a client or raw env URL to choose a provider endpoint for an API key.
 */
export function openAITransport(env){
 const headers={'authorization':'Bearer '+env.OPENAI_API_KEY,'content-type':'application/json'};
 if(env.CF_AI_GATEWAY_ENABLED!=='true')return {endpoint:'https://api.openai.com/v1/responses',headers,route:'direct_openai'};
 const account=String(env.CF_AI_GATEWAY_ACCOUNT_ID||''),gateway=String(env.CF_AI_GATEWAY_ID||'');
 if(!/^[a-f0-9]{32}$/i.test(account)||!/^[a-z0-9][a-z0-9_-]{0,62}$/i.test(gateway))
  throw Error('ai_gateway_configuration_invalid');
 if(env.CF_AI_GATEWAY_TOKEN)headers['cf-aig-authorization']='Bearer '+env.CF_AI_GATEWAY_TOKEN;
 return {endpoint:'https://gateway.ai.cloudflare.com/v1/'+account+'/'+gateway+'/openai/responses',headers,route:'cloudflare_ai_gateway'};
}
