/* SLI Investor Research: SVG plots and exportable analytical report using computed data only. */
const ns="http://www.w3.org/2000/svg";
const round=v=>typeof v==="number"&&Number.isFinite(v)?new Intl.NumberFormat("id-ID",{maximumFractionDigits:3}).format(v):"—";
const S=(name,attrs={},value="")=>{const el=document.createElementNS(ns,name);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,String(v));if(value)el.textContent=value;return el};
export function scatterPlot(fit,alternate=null){
 const rows=fit?.observations||[];if(!rows.length)return null;
 const simple=fit.predictors.length===1,xx=r=>simple?r.x[0]:r.fitted;
 const range=a=>{const lo=Math.min(...a),hi=Math.max(...a),pad=(hi-lo||1)*.09;return [lo-pad,hi+pad]};
 const [xmin,xmax]=range(rows.map(xx)),[ymin,ymax]=range([...rows.map(r=>r.y),...rows.map(r=>r.fitted)]);
 const W=740,H=370,L=84,T=27,B=65,R=23;
 const X=v=>L+(v-xmin)/(xmax-xmin)*(W-L-R),Y=v=>H-B-(v-ymin)/(ymax-ymin)*(H-B-T);
 const svg=S("svg",{viewBox:"0 0 740 370",role:"img","aria-label":simple?"Province scatter plot with full and sensitivity regression lines":"Observed versus fitted regression with flagged observations"});
 svg.append(S("title",{},simple?"SLI provincial regression and Cook-distance outliers":"SLI observed versus fitted values"));
 for(let i=0;i<=4;i++){
  const a=xmin+(xmax-xmin)*i/4,b=ymin+(ymax-ymin)*i/4;
  svg.append(S("line",{x1:X(a),y1:T,x2:X(a),y2:H-B,stroke:"#e2e9f0"}));
  svg.append(S("line",{x1:L,y1:Y(b),x2:W-R,y2:Y(b),stroke:"#e2e9f0"}));
  svg.append(S("text",{x:X(a),y:H-B+18,fill:"#405c70","font-size":11,"text-anchor":"middle"},round(a)));
  svg.append(S("text",{x:L-8,y:Y(b)+4,fill:"#405c70","font-size":11,"text-anchor":"end"},round(b)));
 }
 svg.append(S("line",{x1:L,y1:H-B,x2:W-R,y2:H-B,stroke:"#436078"}),S("line",{x1:L,y1:T,x2:L,y2:H-B,stroke:"#436078"}));
 const line=(f,color,dash)=>{
  if(simple){
   const intercept=f.coefficient_terms.find(t=>t.name==="Intercept")?.estimate||0,slope=f.coefficient_terms.find(t=>t.name===fit.predictors[0])?.estimate||0;
   svg.append(S("line",{x1:X(xmin),y1:Y(intercept+slope*xmin),x2:X(xmax),y2:Y(intercept+slope*xmax),stroke:color,"stroke-width":3,...(dash?{"stroke-dasharray":"9 6"}:{})}));
  }else{
   const a=Math.max(xmin,ymin),b=Math.min(xmax,ymax);
   svg.append(S("line",{x1:X(a),y1:Y(a),x2:X(b),y2:Y(b),stroke:color,"stroke-width":3,"stroke-dasharray":"8 5"}));
  }
 };
 line(fit,"#1a6299");if(alternate?.coefficient_terms)line(alternate,"#bf8534",true);
 for(const row of rows){
  const mark=S("circle",{cx:X(xx(row)),cy:Y(row.y),r:row.influential?6:4,fill:row.influential?"#b44939":"#387fb4",stroke:"#fff","stroke-width":1.2,opacity:.88});
  mark.append(S("title",{},row.name+": X="+round(xx(row))+"; Y="+round(row.y)+"; fitted="+round(row.fitted)+(row.influential?" · influential diagnostic":"")));
  svg.append(mark);
  if(row.influential)svg.append(S("text",{x:X(xx(row))+8,y:Y(row.y)-6,fill:"#943e2f","font-size":11,"font-weight":700},row.name.slice(0,24)));
 }
 svg.append(S("text",{x:390,y:355,"text-anchor":"middle",fill:"#2c4c65","font-size":13,"font-weight":700},simple?fit.predictors[0]:"Fitted Y"));
 svg.append(S("text",{x:18,y:182,transform:"rotate(-90 18 182)","text-anchor":"middle",fill:"#2c4c65","font-size":13,"font-weight":700},fit.outcome));
 return svg;
}
export function investorMarkdown(fit,filename,sensitivity){
 const f=v=>round(v),panel=fit.method==="panel_fe",terms=panel?fit.coefficients:fit.coefficient_terms,diagnostics=fit.residual_diagnostics||{};
 const row=c=>"| "+[c.name,f(c.estimate),f(c.std_error_hc1),f(c.ci95_low),f(c.ci95_high),f(c.p_value_approx)].join(" | ")+" |";
 const impact=terms.filter(t=>t.name!=="Intercept").map(t=>"- **"+t.name+"**: koefisien "+f(t.estimate)+", interval kepercayaan 95% ["+f(t.ci95_low)+", "+f(t.ci95_high)+"]. Hubungan ini tidak membuktikan kausalitas.").join("\n");
 const flags=(diagnostics.flagged||[]).map(t=>"- "+(fit.observations?.[t.index-1]?.name||("Observasi ke-"+t.index))+"; Cook D "+f(t.cook_d)+"; residual terstandardisasi "+f(t.standardized_residual)).join("\n");
 const coeffTable=["| Variable | Estimate | Std error | 95% CI lower | 95% CI upper | Approx. p |","|---|---:|---:|---:|---:|---:|",...terms.map(row)].join("\n");
 const sen=sensitivity?.reduced?"\n## Uji sensitivitas\n\nR² seluruh observasi: "+f(sensitivity.full.r_squared)+" (n="+sensitivity.full.n+"). Setelah mengecualikan pertumbuhan di luar −15% hingga +15% secara **ilustratif**: R² "+f(sensitivity.reduced.r_squared)+" (n="+sensitivity.reduced.n+"). Baris dikecualikan sementara: "+sensitivity.excluded_rows.join(", ")+". Bukan alasan untuk menghapus nilai ekstrem tanpa justifikasi.\n":"";
 return [
 "# Strategic Latitude Intelligence — Investor Analytical Report",
 "**Tanggal:** "+new Date().toISOString().slice(0,10)+"  ",
 "**Dataset:** "+(filename||"Unggahan lokal / tanpa verifikasi")+"  ",
 "**Estimator:** "+fit.method+"  ",
 "**Observasi digunakan:** "+(fit.rows_used||fit.n)+"  ",
 "**Outcome (Y):** "+fit.outcome+"  ",
 "**Prediktor (X):** "+fit.predictors.join(", "),
 "## Executive assessment",
 "Model ini mengidentifikasi asosiasi statistik dalam sampel yang ditentukan pengguna. Estimasi tidak mewakili multiplier effect, prediksi pasti, maupun hubungan sebab-akibat. "+(panel?"Panel mencakup "+fit.unit_count+" unit dan "+fit.time_count+" periode; "+(fit.two_way_fe?"unit dan year effects":"unit effects")+" dikontrol.":"R² sampel: "+f(fit.r_squared)+"."),
 "## Results · estimates and uncertainty",
 coeffTable,
 "**Variance estimator:** "+fit.se_type+". Confidence intervals and p-values are model-based approximations subject to identification and sampling assumptions.",
 "## Economic interpretation",
 impact,
 sen,
 "## Residual and outlier diagnostics",
 "- Residual standard deviation: "+f(fit.residual_sd),
 "- RMSE: "+f(fit.rmse),
 "- Cook D reference: "+f(diagnostics.leverage_cook_threshold),
 "- Influential observations flagged: "+(diagnostics.flagged_count||0),
 flags||"- No observations crossed the screening threshold.",
 "- "+(diagnostics.note||"Check ordering and serial dependence assumptions."),
 "## Investor risk and opportunity assessment",
 "1. **Model uncertainty:** structural drivers and omitted factors can change estimated relationships; avoid interpreting cross-sectional slopes as treatment effects.",
 "2. **Data comparability:** reconcile PDRB nominal/real, PMTB expenditure versus BKPM realised investment, province codes, units and reference years.",
 "3. **Sector opportunities:** follow up province-specific energy availability, sector output, logistics and project commissioning with dated primary sources.",
 "4. **Stress tests:** inspect unusual provincial growth, consider alternative functional forms and use genuine entity–year panel data for fixed effects.",
 "## Limitations and recommendation",
 fit.limitations,
 "Proceed to a sector-specific panel and independent data verification before making any investment allocation. News headlines require separate fact checking; this report does not assert a current event.",
 "**Research prototype — based on user-uploaded data, not independently verified by SLI. Not investment advice.**"
 ].join("\n\n");
}
export function downloadMarkdown(content){
 const blob=new Blob([content],{type:"text/markdown;charset=utf-8"}),url=URL.createObjectURL(blob);
 const a=document.createElement("a");a.href=url;a.download="SLI-Investor-Analytical-Report.md";document.body.append(a);a.click();a.remove();URL.revokeObjectURL(url);
}
