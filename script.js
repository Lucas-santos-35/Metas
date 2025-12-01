let metas = JSON.parse(localStorage.getItem("metas")) || [];
let metaAtiva = JSON.parse(localStorage.getItem("metaAtiva")) || null;
let grafico;
let editando = false;
let editId = null;

const formatar = v => new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(v);

function salvar() {
  localStorage.setItem("metas", JSON.stringify(metas));
  localStorage.setItem("metaAtiva", JSON.stringify(metaAtiva));
}

function mostrar(tela){
  document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));
  document.getElementById(tela).classList.add("active");
  document.querySelectorAll(".nav button").forEach(b=>b.classList.remove("active"));
  document.getElementById("btn"+tela.charAt(0).toUpperCase()+tela.slice(1))?.classList.add("active");

  if(tela==="metas") atualizarListaMetas();
  if(tela==="progresso") atualizarProgresso();
  if(tela==="adicionar") atualizarRecentes();
}

function atualizarListaMetas(){
  const div = document.getElementById("listaMetas"); div.innerHTML="";
  metas.forEach(m=>{
    div.innerHTML+=`<div class="history-item">
      <span onclick="selecionarMeta(${m.id})">${m.nome}</span>
      <span>
        <button onclick="editarMeta(${m.id})">✏️</button>
        <button onclick="excluirMeta(${m.id})">🗑️</button>
      </span>
    </div>`;
  });
}

function selecionarMeta(id){ metaAtiva=id; salvar(); mostrar("progresso"); }

function cadastrarMeta(){
  const nome=document.getElementById("metaNome").value;
  const valorTotal=+document.getElementById("metaValor").value;
  const prazoMeses=+document.getElementById("metaPrazo").value;
  const dataInicio=document.getElementById("metaDataInicio").value;

  if(!nome || valorTotal<=0) return alert("Preencha todos os campos corretamente.");

  if(editando){
    const meta = metas.find(m=>m.id===editId);
    meta.nome=nome; meta.valorTotal=valorTotal; meta.prazoMeses=prazoMeses; meta.dataInicio=dataInicio;
    editando=false; editId=null;
  } else {
    const meta = {id:Date.now(), nome, valorTotal, prazoMeses, dataInicio, valorAcumulado:0, contribuicoes:[]};
    metas.push(meta); metaAtiva=meta.id;
  }

  salvar();
  document.getElementById("metaNome").value="";
  document.getElementById("metaValor").value="";
  mostrar("progresso");
}

function editarMeta(id){
  editando=true; editId=id;
  const meta = metas.find(m=>m.id===id);
  document.getElementById("metaNome").value=meta.nome;
  document.getElementById("metaValor").value=meta.valorTotal;
  document.getElementById("metaPrazo").value=meta.prazoMeses;
  document.getElementById("metaDataInicio").value=meta.dataInicio;
  mostrar("cadastro");
}

function cancelarEdicao(){ editando=false; editId=null; mostrar("metas"); }

function excluirMeta(id){
  if(!confirm("Deseja realmente excluir esta meta?")) return;
  metas=metas.filter(m=>m.id!==id);
  if(metaAtiva===id) metaAtiva=null;
  salvar(); atualizarListaMetas();
}

function atualizarProgresso(){
  const meta = metas.find(m=>m.id===metaAtiva); if(!meta) return;
  const pct=(meta.valorAcumulado/meta.valorTotal)*100;
  document.getElementById("percentual").innerText=pct.toFixed(1)+"%";
  document.getElementById("circle").style.background=`conic-gradient(var(--color-secondary) ${pct}%, transparent 0%)`;
  document.getElementById("valorAcumulado").innerText=formatar(meta.valorAcumulado);
  document.getElementById("valorFaltante").innerText=`Faltam ${formatar(meta.valorTotal-meta.valorAcumulado)} para ${formatar(meta.valorTotal)}`;

  const extrato=document.getElementById("listaExtrato"); extrato.innerHTML="";
  meta.contribuicoes.forEach(c=>extrato.innerHTML+=`<div class="history-item"><span>${c.data} ${c.hora}</span><strong>${formatar(c.valor)}</strong></div>`);

  atualizarGrafico(meta);
}

function atualizarGrafico(meta){
  const ctx=document.getElementById("graficoContribuicoes");
  const meses={};
  meta.contribuicoes.forEach(c=>{const mes=c.data.slice(3); meses[mes]=(meses[mes]||0)+c.valor;});
  const labels=Object.keys(meses); const valores=Object.values(meses);
  if(grafico) grafico.destroy();
  grafico=new Chart(ctx,{type:"bar",data:{labels,datasets:[{label:"Contribuições",data:valores,backgroundColor:"rgba(99,102,241,.5)",borderColor:"#6366f1",borderWidth:2}]}})
}

function adicionar(){
  const meta=metas.find(m=>m.id===metaAtiva); if(!meta) return;
  const v=+document.getElementById("addValor").value; if(v<=0) return;
  meta.valorAcumulado+=v;
  meta.contribuicoes.unshift({valor:v,data:new Date().toLocaleDateString(),hora:new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})});
  salvar(); document.getElementById("addValor").value="";
  mostrar("progresso");
}

function atualizarRecentes(){
  const meta=metas.find(m=>m.id===metaAtiva); const div=document.getElementById("recentes"); div.innerHTML="";
  if(!meta) return;
  meta.contribuicoes.slice(0,5).forEach(c=>div.innerHTML+=`<div class="history-item"><span>${c.data} ${c.hora}</span><strong>${formatar(c.valor)}</strong></div>`);
}

function alternarTema(){
  document.documentElement.classList.toggle("dark-theme");
  localStorage.setItem("temaDark", document.documentElement.classList.contains("dark-theme"));
}

(function initTema(){
  const saved = localStorage.getItem("temaDark");
  if(saved==="true") document.documentElement.classList.add("dark-theme");
})();
