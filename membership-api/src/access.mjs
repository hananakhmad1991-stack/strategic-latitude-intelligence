// One verified identity per account. Enterprise team seats require an approved contract.
export const PLANS=Object.freeze({
 open:Object.freeze({sessions:1,rank:0,export:false}),
 pro:Object.freeze({sessions:1,rank:1,export:true}), // Professional Rp249,000/month
 intelligence_pro:Object.freeze({sessions:3,rank:2,export:true}), // Rp749,000/month
 enterprise:Object.freeze({sessions:1,rank:3,export:true}) // one session PER named seat; no shared logins
});
export function effectivePlan(row,now=Date.now()){
 if(!row||!['active','trialing'].includes(row.status))return 'open';
 const expiration=Date.parse(row.access_until||'');
 if(!Number.isFinite(expiration)||expiration<=now)return 'open';
 return Object.hasOwn(PLANS,row.plan)?row.plan:'open';
}
export function canAccess(plan,feature){
 const p=PLANS[plan]||PLANS.open;
 if(['download','export','embed','provincial','research','scenario'].includes(feature))return p.rank>=1;
 if(['alerts','weekly_personalized','deep_research'].includes(feature))return p.rank>=2;
 if(['team','custom_contract'].includes(feature))return p.rank>=3;
 return ['overview','sources','glossary','sector_summary'].includes(feature);
}
