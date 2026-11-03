/* Deterministic teaching models and DOM diagrams; no network or animation library. */
(function () {
  'use strict';
  const fmt = x => Number(x.toFixed(3)).toString();
  function zero(p) {
    return [
      {name:'DP',detail:'完整副本',formula:'16N',parts:[2,2,12]},
      {name:'ZeRO-1',detail:'分片优化器状态',formula:'4N + 12N/p',parts:[2,2,12/p]},
      {name:'ZeRO-2',detail:'再分片梯度',formula:'2N + 14N/p',parts:[2,2/p,12/p]},
      {name:'ZeRO-3',detail:'再分片参数',formula:'16N/p',parts:[2/p,2/p,12/p]}
    ].map(x=>({...x,total:x.parts.reduce((a,b)=>a+b,0)}));
  }
  function kv(phase) {
    const a=[{id:5,n:4},{id:1,n:2}];
    const b=phase===0?[{id:5,n:4},{id:1,n:2}]:[{id:5,n:4},{id:3,n:phase===1?3:4}];
    if(phase===3)b.push({id:7,n:1});
    const pool=Array.from({length:8},(_,id)=>({id,n:0,owners:[]}));
    for(const [name,map] of [['A',a],['B',b]])for(const x of map){pool[x.id].n=x.n;pool[x.id].owners.push(name);}
    return {a,b,pool};
  }
  function moe(logits=[Math.log(3),0,-2,-3],k=2,outputs=[2,6,10,14]) {
    const selected=logits.map((x,i)=>i).sort((a,b)=>logits[b]-logits[a]).slice(0,k);
    const max=Math.max(...selected.map(i=>logits[i]));
    const den=selected.reduce((s,i)=>s+Math.exp(logits[i]-max),0);
    const weights=logits.map((x,i)=>selected.includes(i)?Math.exp(x-max)/den:0);
    return {selected,weights,output:weights.reduce((s,w,i)=>s+w*outputs[i],0)};
  }
  function spec(p=[.2,.5,.3],q=[.6,.3,.1]) {
    const accepted=p.map((x,i)=>Math.min(x,q[i]));
    const deficit=p.map((x,i)=>Math.max(0,x-q[i]));
    const rejection=deficit.reduce((a,b)=>a+b,0);
    return {p,q,accepted,rejection,residual:deficit.map(x=>rejection?x/rejection:0),final:accepted.map((x,i)=>x+deficit[i])};
  }
  const texts={
    kv:[['共享前缀','同一请求分出 A、B 两条续写。它们共享 P5 和未写满的 P1，引用计数均为 2。'],['写前复制','B 要写第 7 个 token：先把共享尾块 P1 的两个条目复制到空闲 P3，再追加。A 的缓存保持不变。'],['填满尾块','B 的第 8 个 token 写进 P3 剩余位置。无需重新分配或搬动前面的整条序列。'],['追加物理块','B 的第 9 个 token 分配到 P7。逻辑块连续，物理块 P5 → P3 → P7 可以不连续。']],
    moe:[['给专家打分','一个 token 的门控 logits 为 [ln 3, 0, −2, −3]。四个专家的参数仍然存在。'],['选出 top-2','保留 E0、E1，再对保留的 logits 做 softmax：权重为 0.75、0.25，另两个为 0。'],['派发并计算','同一个 token 分发给两个选中专家。用标量输出 2 和 6 代替真实向量，便于手算。'],['加权合并','按门控权重合并专家输出：0.75 × 2 + 0.25 × 6 = 3。未选专家不参与本 token 的 FFN 计算。']],
    spec:[['草稿提出候选','固定一个前缀，草稿分布为 q，目标分布为 p。下面展示可复核的采样分支，随机数是教学设定。'],['计算接受阈值','接受概率为 min(1, p(x)/q(x))。比较同一次采样的随机数 u 与这个阈值。'],['作出接受判断','首次拒绝后，后续草稿的前缀不再成立，必须丢弃；不能跳过坏 token 后继续接收原草稿。'],['恢复目标分布','拒绝时从正残差 normalize(max(p−q,0)) 补采样。不是直接重新从 p 抽一个 token。']]
  };
  const steps={kv:['共享','复制','写入','扩容'],moe:['打分','选择','计算','合并'],spec:['提议','阈值','判断','补采样']};
  function progress(kind,phase){return '<ol class="core-steps">'+steps[kind].map((s,i)=>'<li'+(i===phase?' aria-current="step"':'')+'><span>'+String(i+1).padStart(2,'0')+'</span>'+s+'</li>').join('')+'</ol>';}
  function render(kind,phase=0,choice='reject') {
    if(kind==='zero')return '<div class="zero-rows">'+zero(+choice||4).map(row=>'<div class="zero-row"><div class="zero-label"><b>'+row.name+'</b><span>'+row.detail+'</span></div><div class="zero-plot"><div class="zero-bar" role="img" aria-label="参数 '+fmt(row.parts[0])+' GB，梯度 '+fmt(row.parts[1])+' GB，优化器 '+fmt(row.parts[2])+' GB">'+row.parts.map((x,i)=>'<span class="zero-segment zero-'+i+'" style="width:'+x/16*100+'%"></span>').join('')+'</div><span class="zero-formula">'+row.formula+'</span></div><div class="zero-total">'+fmt(row.total)+'<small> GB / 卡</small></div></div>').join('')+'</div>';
    let body='';
    if(kind==='kv'){
      const s=kv(phase);
      const map=(name,items)=>'<div class="kv-map"><b>分支 '+name+'</b><div>'+Array.from({length:3},(_,i)=>'<span class="kv-map-entry">L'+i+' <span aria-hidden="true">→</span> '+(items[i]?'P'+items[i].id+' · '+items[i].n+'/4':'未分配')+'</span>').join('')+'</div></div>';
      body='<div class="kv-maps">'+map('A',s.a)+map('B',s.b)+'</div><div class="core-subheading">物理块池 <span>每块容纳 4 个 token 的 K/V</span></div><div class="kv-pool">'+s.pool.map(p=>'<div class="kv-block" data-used="'+!!p.owners.length+'" data-block="'+p.id+'"><div><b>P'+p.id+'</b><span>'+ (p.owners.length?'引用 '+p.owners.length+' · '+p.owners.join(' / '):'空闲')+'</span></div><div class="kv-cells" aria-label="已用 '+p.n+' / 4">'+Array.from({length:4},(_,i)=>'<span data-filled="'+(i<p.n)+'"></span>').join('')+'</div></div>').join('')+'</div>';
    }else if(kind==='moe'){
      const s=moe();body='<div class="moe-input"><span class="core-token">token x</span><span>同一个输入，按需送往专家</span></div><div class="moe-experts">'+['ln 3','0','−2','−3'].map((x,i)=>'<div class="moe-expert" data-selected="'+(phase>0&&i<2)+'"><div><b>E'+i+'</b><span>'+(phase===0?'待路由':i<2?'选中':'本次跳过')+'</span></div><p>logit '+x+'</p><p>'+(phase>0?'权重 '+fmt(s.weights[i]):'权重待计算')+'</p><p>'+(phase>=2&&i<2?'输出 '+[2,6][i]:'—')+'</p></div>').join('')+'</div><div class="core-equation">'+(phase===3?'y = 0.75 × 2 + 0.25 × 6 = <strong>3</strong>':'y = Σ gᵢ · Eᵢ(x)')+'</div>';
    }else{
      const s=spec(),index=choice==='accept-b'?1:0,u=choice==='reject'?.7:choice==='accept-b'?.8:.2;
      const threshold=Math.min(1,s.p[index]/s.q[index]),accepted=u<threshold;
      body='<div class="spec-table" role="table" aria-label="同一前缀下的概率分布"><div role="row"><b role="columnheader">Token</b><b role="columnheader">草稿 q</b><b role="columnheader">目标 p</b></div>'+['A','B','C'].map((x,i)=>'<div role="row" data-candidate="'+(i===index)+'"><b role="rowheader">'+x+'</b><span role="cell">'+fmt(s.q[i])+'</span><span role="cell">'+fmt(s.p[i])+'</span></div>').join('')+'</div><div class="core-equation">'+(phase===0?'候选 '+['A','B','C'][index]+'，u = '+u:phase===1?'接受阈值 = '+fmt(threshold)+'；u = '+u:phase===2?(accepted?'接受候选 '+['A','B'][index]:'0.7 > 1/3，拒绝候选 A'):(accepted?'保留 '+['A','B'][index]+'，继续验证下一位置':'正残差 [0, 0.2, 0.2] → [0, 0.5, 0.5]<br>补采随机数 0.25 → 输出 B'))+'</div><div class="spec-mass"><b>全部分支的概率账本</b><p>接受质量 [0.2, 0.3, 0.1]<br>＋拒绝质量 0.4 × [0, 0.5, 0.5]<br>＝最终分布 [0.2, 0.5, 0.3] = p</p></div>';
    }
    return progress(kind,phase)+'<div class="core-stage-copy"><b>'+texts[kind][phase][0]+'</b><p>'+texts[kind][phase][1]+'</p></div>'+body;
  }
  const api={zero,kv,moe,spec,render};
  if(typeof module!=='undefined')module.exports=api;
  if(typeof document==='undefined')return;
  window.PaiCore=api;
  document.querySelectorAll('[data-core-visual]').forEach(root=>{
    const kind=root.dataset.coreVisual,stage=root.querySelector('.core-stage');
    const select=root.querySelector('select');
    if(kind==='zero'){
      select.addEventListener('change',()=>{stage.innerHTML=render(kind,0,select.value);});return;
    }
    let phase=0,elapsed=0,playing=false,last='';
    const button=root.querySelector('.ppx-play');
    function reset(){phase=0;elapsed=0;playing=false;button.textContent='播放';}
    button.addEventListener('click',()=>{if(phase===3){phase=0;elapsed=0;}playing=!playing;button.textContent=playing?'暂停':'播放';});
    root.querySelector('[data-core-reset]').addEventListener('click',reset);
    if(select)select.addEventListener('change',reset);
    function step(dt,manual){
      elapsed+=dt;
      if(manual||elapsed>=1.5){phase=Math.min(3,phase+1);elapsed=0;}
      if(phase===3){playing=false;button.textContent='播放';}
    }
    function draw(){
      const choice=select?select.value:'reject',key=phase+':'+choice;
      if(key===last)return;
      stage.innerHTML=render(kind,phase,choice);last=key;root.dataset.corePhase=String(phase);
      root.dataset.corePaints=String(+(root.dataset.corePaints||0)+1);
    }
    PaiMotion.mount(root,step,draw,()=>playing,{fps:4});
  });
})();
