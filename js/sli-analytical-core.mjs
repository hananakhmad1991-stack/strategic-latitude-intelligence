/* SLI Research AI: curated methods are methodological capabilities, not claims of executed estimators. */
export const METHODS=Object.freeze([{"id":"descriptive","name":"Descriptive statistics","group":"Statistics","status":"local","requires":"Numeric columns; complete observation definitions"},{"id":"pearson","name":"Pearson correlation","group":"Statistics","status":"local","requires":"Two numeric variables, paired observations"},{"id":"ols","name":"Simple OLS regression","group":"Econometrics","status":"local","requires":"At least three paired numerical observations"},{"id":"multivariate_ols","name":"Multiple regression · HC1 robust OLS","group":"Econometrics","status":"local","requires":"Numeric Y and 1–5 predictors; minimum 12 residual observations, rank and diagnostics"},{"id":"ahp","name":"Analytic Hierarchy Process (AHP)","group":"Decision science","status":"local","requires":"Reciprocal positive pairwise criterion matrix"},{"id":"stock_flow","name":"Stock-flow simulation (Euler)","group":"System dynamics","status":"local","requires":"Initial stock, period inflows, outflow rate and number of periods"},{"id":"anova","name":"ANOVA","group":"Statistics","status":"design","requires":"Numeric outcome and categorical group"},{"id":"chi_square","name":"Chi-square association","group":"Statistics","status":"design","requires":"Categorical contingency counts"},{"id":"logit","name":"Logistic regression","group":"Econometrics","status":"design","requires":"Binary outcome, features, observation-level data"},{"id":"panel_fe","name":"Panel fixed effects (cluster robust)","group":"Econometrics","status":"local","requires":"Entity-year panel with >=8 units and >=3 years, repeated observations and within-variation"},{"id":"panel_re","name":"Panel random effects","group":"Econometrics","status":"design","requires":"Panel with valid random-effect assumptions"},{"id":"did","name":"Difference-in-differences","group":"Causal inference","status":"design","requires":"Treatment and comparable control with pre/post data, parallel-trends assessment"},{"id":"event_study","name":"Event study","group":"Causal inference","status":"design","requires":"Dated treatment, outcome time series and control baseline"},{"id":"iv_2sls","name":"Instrumental variables / 2SLS","group":"Causal inference","status":"design","requires":"Identifiable instrument with relevance and exclusion argument"},{"id":"rdd","name":"Regression discontinuity design","group":"Causal inference","status":"design","requires":"Running variable, cutoff and continuity assumptions"},{"id":"psm","name":"Propensity score matching","group":"Causal inference","status":"design","requires":"Treatment/control, observed confounders and common support"},{"id":"synthetic_control","name":"Synthetic control","group":"Causal inference","status":"design","requires":"Pre-treatment outcomes and suitable donor units"},{"id":"ardl","name":"ARDL / ECM","group":"Time series","status":"design","requires":"Time series with compatible integration orders and cointegration diagnostics"},{"id":"var","name":"VAR / impulse responses","group":"Time series","status":"design","requires":"Multivariate stationary series or transformed series"},{"id":"arima","name":"ARIMA / SARIMA","group":"Time series","status":"design","requires":"Dated, sufficiently long time series and diagnostics"},{"id":"garch","name":"GARCH volatility model","group":"Time series","status":"design","requires":"Long returns series and heteroskedasticity diagnostics"},{"id":"bayesian","name":"Bayesian inference","group":"Statistics","status":"design","requires":"Explicit likelihood, prior and data-generating assumptions"},{"id":"monte_carlo","name":"Monte Carlo simulation","group":"Uncertainty modeling","status":"design","requires":"Calibrated parameter distributions, dependence and reproducible random seed"},{"id":"sobol","name":"Sobol sensitivity analysis","group":"Uncertainty modeling","status":"design","requires":"Computable forward model and parameter distributions"},{"id":"scenario","name":"Scenario / stress testing","group":"Uncertainty modeling","status":"design","requires":"Explicit baseline, shocks, horizons and transmission assumptions"},{"id":"input_output","name":"Leontief input-output multipliers","group":"Economic modeling","status":"design","requires":"Compatible official inter-industry matrix and sector output definitions"},{"id":"sam_cge","name":"SAM / CGE","group":"Economic modeling","status":"design","requires":"Balanced social accounting matrix and behavioural closure assumptions"},{"id":"sfc","name":"Stock-flow consistent macro model","group":"Economic modeling","status":"design","requires":"Sectoral balance-sheet identities and behavioural equations"},{"id":"system_dynamics","name":"System dynamics / feedback loops","group":"System dynamics","status":"design","requires":"Stock-flow structure, calibrated delays, feedback and validation"},{"id":"agent_based","name":"Agent-based modeling","group":"System dynamics","status":"design","requires":"Agent rules, calibration data and validation targets"},{"id":"optimization","name":"Linear / mixed-integer optimization","group":"Operations research","status":"design","requires":"Objective, constraints and feasible decision variables"},{"id":"dea","name":"Data envelopment analysis","group":"Decision science","status":"design","requires":"Comparable decision-making units, common inputs/outputs"},{"id":"topsis","name":"TOPSIS","group":"Decision science","status":"design","requires":"Decision matrix, directions and explicit weights"},{"id":"promethee","name":"PROMETHEE","group":"Decision science","status":"design","requires":"Criteria preferences, calibrated thresholds and weights"},{"id":"swot","name":"SWOT / TOWS","group":"Qualitative strategy","status":"design","requires":"Traceable evidence on strengths, weaknesses, opportunities and threats"},{"id":"pestel","name":"PESTEL analysis","group":"Qualitative strategy","status":"design","requires":"Dated political, economic, social, technological, environmental and legal evidence"},{"id":"porter","name":"Porter five forces","group":"Qualitative strategy","status":"design","requires":"Industry boundary and substantiated market relationships"},{"id":"stakeholder","name":"Stakeholder / power-interest mapping","group":"Qualitative strategy","status":"design","requires":"Named institutions, verifiable roles, mandates and incentives"},{"id":"process_tracing","name":"Process tracing","group":"Qualitative research","status":"design","requires":"Chronology, causal mechanism and competing hypotheses"},{"id":"thematic","name":"Thematic analysis / grounded coding","group":"Qualitative research","status":"design","requires":"Permissioned interviews, codebook, citations and audit trail"},{"id":"delphi","name":"Delphi expert elicitation","group":"Qualitative research","status":"design","requires":"Independent expert rounds and controlled consensus process"},{"id":"case_study","name":"Comparative case study","group":"Qualitative research","status":"design","requires":"Explicit case selection and comparable evidence"},{"id":"qca","name":"Qualitative comparative analysis (QCA)","group":"Mixed methods","status":"design","requires":"Calibrated set membership and comparable cases"},{"id":"fsqca","name":"Fuzzy-set QCA","group":"Mixed methods","status":"design","requires":"Causal conditions with documented fuzzy calibrations"},{"id":"mixed_methods","name":"Triangulated mixed methods","group":"Mixed methods","status":"design","requires":"Compatible quantitative and qualitative sources and integration plan"},{"id":"mcda","name":"Multicriteria decision analysis","group":"Decision science","status":"design","requires":"Alternatives, criteria, weights and transparency checks"},{"id":"geo_spatial","name":"Spatial regression / GIS","group":"Spatial analysis","status":"design","requires":"Validated geometries, weights matrix and geocoded observations"},{"id":"shift_share","name":"Shift-share decomposition","group":"Regional economics","status":"design","requires":"Consistent region-sector employment/output across time"},{"id":"lq","name":"Location quotient (LQ)","group":"Regional economics","status":"design","requires":"Comparable industry shares at regional and reference level"}]);
export function getMethod(id){return METHODS.find(m=>m.id===id)||null}
export const METHOD_PLAYBOOKS=Object.freeze({
 multivariate_ols:"Fit intercept and up to 5 predictors using twice-reorthogonalized QR, HC1 robust standard errors and approximate t intervals; check rank, Cook influence, residuals and identification. No causal inference.",
 ols:"Specify dependent and independent variables, units, functional form, sample selection; examine residual patterns, leverage, multicollinearity if extended, robust errors and potential endogeneity. Bivariate OLS is descriptive, not causal.",
 ahp:"Collect independently justified Saaty reciprocal pairwise judgments; compute normalized priority weights and CR = CI/RI, compare CR <= 0.10 with caution; conduct weight and ranking sensitivity. Do not present subjective weights as empirical causal coefficients.",
 stock_flow:"State stock unit, initial stock, inflow unit/time, outflow fraction per time, simulation step and boundary conditions. Compare trajectories under scenario inputs; this small Euler stock-flow is not a calibrated feedback model.",
 system_dynamics:"Draw causal-loop and stock-flow diagrams, validate dimensional consistency, calibrate delays and nonlinear feedback, test extreme conditions, sensitivity and policy resistance before forecasts.",
 panel_fe:"Define panel unit and year/quarter, remove duplicates, specify unit and time fixed effects, cluster SE by entity, check within-unit variation, parallel shocks and confounders. No coefficient unless estimation executes.",
 did:"Define treated units, untreated comparison, policy timing, event windows; test pre-trends and spillovers, adopt staggered-treatment robust estimators when necessary. Parallel-trends assumption is not proven by post-treatment fit.",
 iv_2sls:"Argue instrument relevance, exclusion, independence and monotonicity where needed; estimate first-stage strength and weak-instrument-robust inference. Do not infer validity from correlation.",
 ardl:"Check integration order (exclude I(2) when conventional bounds applies), lags, stability, cointegration bounds and residual serial correlation. Distinguish short-run from long-run coefficients.",
 arima:"Establish data frequency and stationarity/differencing, seasonality, training/test windows, residual autocorrelation and honest out-of-sample forecast errors.",
 monte_carlo:"Define scenario variables, reproducible seed, distribution shape, correlation/dependence, convergence and tail sensitivity; output quantiles, not unsupported risk probabilities.",
 input_output:"Use a dated input-output technical coefficients matrix by compatible sector classification; Leontief inverse (I-A)^-1 estimates gross output effects under fixed coefficients, not automatically GDP or jobs.",
 sam_cge:"Calibrate balanced social-accounting data, behavioural elasticities, closure rules, trade and factor markets; record scenarios and welfare sensitivity. A CGE baseline is not a measured treatment effect.",
 qca:"Define causal cases, truth table, calibration thresholds, necessity/sufficiency consistency and robustness to thresholds; no statistical coefficient claims.",
 fsqca:"Document anchors for full inclusion, crossover, full exclusion, case diversity and solution consistency/coverage; inspect contradictory configurations.",
 topsis:"Specify normalized beneficial/cost criteria, ex-ante weights, distance metric and rank sensitivity. A closeness score is preference-based, not a return forecast.",
 geo_spatial:"Validate geographic joins and administrative boundary versions, spatial weights, Moran residual diagnostics and spatial spillovers; avoid attributing neighbour correlations to causal spillovers.",
 descriptive:"Display N, missingness, measurement units, mean/median, variance and skew/outlier considerations, and distinguish sample from population.",
 pearson:"Use paired complete observations, inspect scatter and outliers, avoid trending nonstationary-series spurious correlation; never claim causality.",
 scenario:"State explicit shock sizes, baseline, behavioural transmission channels, timeline and sensitivity; no invented probability or precise effect.",
 swot:"Evidence-tag each claim, separate internal capabilities from external exposures, prioritise actions using TOWS, attach uncertainty and ownership.",
 pestel:"Trace policy and market changes through political, economic, social, technological, environmental and legal mechanisms with dated sources.",
 delphi:"Use independent expert panels, blinded structured rounds and explicit convergence/nonconsensus reporting; do not claim expert consensus without rounds.",
 thematic:"Document source consent, coding units, inter-coder/audit trail and counterexamples, while preserving confidentiality.",
 process_tracing:"Specify temporal sequence, rival explanations, process observations and smoking-gun/hoop evidence tests; do not equate chronology with identification."
});
export function getMethodAdvice(id){return METHOD_PLAYBOOKS[id]||getMethod(id)?.requires||"Specify method assumptions, data demands, feasibility, robustness and what can or cannot be inferred."}
export function inferMethod(question){
 const q=String(question||"").toLowerCase();
 const patterns=[
 ["ahp",/\\bahp\\b|analytic hierarchy/],
 ["system_dynamics",/system dynamics|sistem dinamis|model dinamika sistem|causal.loop/],
 ["stock_flow",/stock.flow|stock flow|stok.aliran/],
 ["panel_fe",/panel data|fixed effects|efek tetap/],
 ["did",/difference.in.differences|\\bdid\\b|double difference/],
 ["input_output",/input.output|leontief|multiplier effect|pengganda ekonomi/],
 ["sam_cge",/\\bcge\\b|social accounting matrix|keseimbangan umum/],
 ["monte_carlo",/monte carlo/],
 ["ardl",/\\bardl\\b|error correction model/],
 ["arima",/\\barima\\b|time.series forecast/],
 ["pearson",/korelasi pearson|pearson correlation/],
 ["ols",/\\bols\\b|regresi linear sederhana|simple linear regression/],
 ["topsis",/topsis/],["qca",/\\bqca\\b|qualitative comparative analysis/],
 ["swot",/swot/],["pestel",/pestel/],["delphi",/delphi/]
 ];
 return patterns.find(([,pattern])=>pattern.test(q))?.[0]||"auto";
}
const finite=x=>typeof x==="number"&&Number.isFinite(x);
const round=x=>finite(x)?Math.round(x*1e6)/1e6:null;
export function parseCsv(content){
 if(typeof content!=="string"||content.length>1100000)throw Error("CSV exceeds 1 MB limit");
 const data=[];let row=[],field="",quoted=false;
 for(let i=0;i<content.length;i++){
  const c=content[i];
  if(c==='"'){if(quoted&&content[i+1]==='"'){field+='"';i++}else if(!field||quoted)quoted=!quoted;else throw Error("Invalid CSV quotation")}
  else if(c===","&&!quoted){row.push(field);field=""}
  else if((c==="\n"||c==="\r")&&!quoted){if(c==="\r"&&content[i+1]==="\n")i++;row.push(field);if(row.some(v=>v.trim()))data.push(row);row=[];field="";if(data.length>3002)throw Error("More than 3,000 data rows")}
  else field+=c;
 }
 if(quoted)throw Error("Unclosed CSV quoted field");
 row.push(field);if(row.some(v=>v.trim()))data.push(row);
 if(data.length<2)throw Error("CSV needs header and data rows");
 const header=data.shift().map((v,i)=>v.trim().slice(0,65)||("column_"+(i+1)));
 if(header.length>30||new Set(header).size!==header.length)throw Error("CSV must have <=30 unique named columns");
 return data.map(values=>Object.fromEntries(header.map((key,i)=>[key,(values[i]||"").trim().slice(0,200)])));
}
export function toRows(raw){
 if(!Array.isArray(raw)||!raw.length||raw.length>3000||raw.some(r=>!r||typeof r!=="object"||Array.isArray(r)))throw Error("Expected 1–3,000 JSON object rows");
 const cols=Object.keys(raw[0]);if(cols.length<1||cols.length>30)throw Error("Use 1–30 columns");
 if(cols.some(c=>c.length>65||!c))throw Error("Invalid column name");
 return raw.map(r=>Object.fromEntries(cols.map(c=>[c,typeof r[c]==="string"?r[c].slice(0,200):r[c]])));
}
function numeric(v){if(v===null||v===undefined||String(v).trim()==="")return null;const n=Number(v);return finite(n)?n:null}
export function describe(rows){
 const data=toRows(rows),keys=Object.keys(data[0]);
 return keys.map(key=>{
  const obs=data.map(r=>numeric(r[key])).filter(finite).sort((a,b)=>a-b);
  if(!obs.length)return {column:key,n:0,missing:data.length,mean:null,median:null,sd:null,min:null,max:null};
  const n=obs.length,mean=obs.reduce((a,b)=>a+b,0)/n;
  const variance=n>1?obs.reduce((s,x)=>s+(x-mean)**2,0)/(n-1):0;
  return {column:key,n,missing:data.length-n,mean:round(mean),median:round(n%2?obs[(n-1)/2]:(obs[n/2]+obs[n/2-1])/2),sd:round(Math.sqrt(variance)),min:round(obs[0]),max:round(obs[n-1])};
 });
}
function paired(rows,x,y){
 if(!x||!y||x===y||!Object.hasOwn(rows[0]||{},x)||!Object.hasOwn(rows[0]||{},y))throw Error("Select two different existing variables");
 return rows.map(r=>[numeric(r[x]),numeric(r[y])]).filter(([a,b])=>finite(a)&&finite(b));
}
export function correlation(rows,x,y){
 const p=paired(toRows(rows),x,y);if(p.length<3)throw Error("Correlation needs at least 3 complete pairs");
 const n=p.length,mx=p.reduce((s,r)=>s+r[0],0)/n,my=p.reduce((s,r)=>s+r[1],0)/n;
 const xx=p.reduce((s,r)=>s+(r[0]-mx)**2,0),yy=p.reduce((s,r)=>s+(r[1]-my)**2,0),xy=p.reduce((s,r)=>s+(r[0]-mx)*(r[1]-my),0);
 if(!xx||!yy)throw Error("No variance in selected variables");
 return {method:"pearson",x,y,n,r:round(Math.max(-1,Math.min(1,xy/Math.sqrt(xx*yy)))),limitation:"Association is not causation; evaluate missingness, outliers and time-series dependence."};
}
export function ols(rows,x,y){
 const p=paired(toRows(rows),x,y);if(p.length<3)throw Error("OLS needs at least 3 complete pairs");
 const n=p.length,mx=p.reduce((s,r)=>s+r[0],0)/n,my=p.reduce((s,r)=>s+r[1],0)/n;
 const xx=p.reduce((s,r)=>s+(r[0]-mx)**2,0),xy=p.reduce((s,r)=>s+(r[0]-mx)*(r[1]-my),0),yy=p.reduce((s,r)=>s+(r[1]-my)**2,0);
 if(xx<=0)throw Error("Predictor has no variation");
 const slope=xy/xx,intercept=my-slope*mx,sse=p.reduce((s,r)=>s+(r[1]-intercept-slope*r[0])**2,0);
 return {method:"ols",x,y,n,slope:round(slope),intercept:round(intercept),r_squared:round(yy?Math.max(0,1-sse/yy):1),rmse:round(Math.sqrt(sse/n)),limitation:"Descriptive bivariate fit only: no causal inference, heteroskedasticity checks, p-values or robust standard errors."};
}
export function ahp(payload){
 const criteria=payload?.criteria,m=payload?.pairwise;
 if(!Array.isArray(criteria)||criteria.length<2||criteria.length>10||new Set(criteria).size!==criteria.length||criteria.some(c=>typeof c!=="string"||!c||c.length>80))throw Error("AHP expects 2–10 unique criteria");
 const n=criteria.length;if(!Array.isArray(m)||m.length!==n||m.some(r=>!Array.isArray(r)||r.length!==n))throw Error("AHP matrix size mismatch");
 for(let i=0;i<n;i++)for(let j=0;j<n;j++){
  if(!finite(m[i][j])||m[i][j]<1/9-1e-8||m[i][j]>9+1e-8)throw Error("AHP judgments outside Saaty scale 1/9–9");
  if(Math.abs(m[i][j]*m[j][i]-1)>0.025)throw Error("AHP judgments must be reciprocal");
  if(i===j&&Math.abs(m[i][j]-1)>0.025)throw Error("AHP diagonal must be 1");
 }
 const gm=m.map(r=>Math.exp(r.reduce((s,v)=>s+Math.log(v),0)/n)),total=gm.reduce((s,v)=>s+v,0),w=gm.map(v=>v/total);
 const lambda=w.reduce((s,wi,i)=>s+m[i].reduce((t,v,j)=>t+v*w[j],0)/wi,0)/n;
 const ri=[0,0,0,.58,.90,1.12,1.24,1.32,1.41,1.45,1.49][n];
 const cr=n<=2?null:(lambda-n)/((n-1)*ri);
 return {method:"ahp",criteria:criteria.map((name,i)=>({name,weight:round(w[i])})),lambda_max:round(lambda),consistency_ratio:round(cr),acceptable:cr===null||cr<=.1,limitation:"Weights reflect supplied subjective judgements; consistency ratio below 0.10 does not validate the criteria or underlying evidence."};
}
export function stockFlow(p){
 const initial=Number(p?.initial_stock),inflow=Number(p?.inflow_per_period),outflow=Number(p?.outflow_rate),periods=Number(p?.periods);
 if(![initial,inflow,outflow,periods].every(finite)||initial<0||inflow<0||outflow<0||outflow>1||!Number.isInteger(periods)||periods<1||periods>120)throw Error("Model requires nonnegative stock/inflow, outflow rate 0–1, and 1–120 periods");
 let stock=initial;const trajectory=[{period:0,stock:round(stock)}];
 for(let i=1;i<=periods;i++){stock=stock+inflow-outflow*stock;if(stock<0)stock=0;trajectory.push({period:i,stock:round(stock)})}
 return {method:"stock_flow",initial_stock:initial,inflow_per_period:inflow,outflow_rate:outflow,periods,final_stock:round(stock),trajectory,limitation:"Simplified discrete stock-flow identity with fixed parameters, not a calibrated system dynamics forecast or causal estimate."};
}
export function evaluate({method,rows,x,y,model}){
 if(method==="ahp")return ahp(model);
 if(method==="stock_flow")return stockFlow(model);
 if(method==="descriptive")return {method:"descriptive",rows:rows?.length||0,columns:describe(rows),limitation:"Observed sample summaries, not population or forward-looking estimates."};
 if(method==="pearson")return correlation(rows,x,y);
 if(method==="ols")return ols(rows,x,y);
 throw Error("Method is catalogued for research design, not executable by this browser workbench");
}
