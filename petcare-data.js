const PETCARE_KEY = "petcare_db";
const PETCARE_SESSION_KEY = "petcare_session";

const petcareDefaultData = () => ({
  usuarios: [],
  pets: [],
  consultas: [],
  avisos: [],
  versao: 1
});

function petcareLoad(){
  try{
    const raw = localStorage.getItem(PETCARE_KEY);
    if(!raw) return petcareDefaultData();

    const data = JSON.parse(raw);
    return {
      usuarios: Array.isArray(data.usuarios) ? data.usuarios : [],
      pets: Array.isArray(data.pets) ? data.pets : [],
      consultas: Array.isArray(data.consultas) ? data.consultas : [],
      avisos: Array.isArray(data.avisos) ? data.avisos : [],
      versao: data.versao || 1
    };
  }catch{
    return petcareDefaultData();
  }
}

function petcareSave(data){
  localStorage.setItem(PETCARE_KEY, JSON.stringify(data));
}

function petcareReset(){
  petcareSave(petcareDefaultData());
}

function petcareSetSession(user, role){
  localStorage.setItem(PETCARE_SESSION_KEY, JSON.stringify({ user, role }));
}

function petcareGetSession(){
  try{
    return JSON.parse(localStorage.getItem(PETCARE_SESSION_KEY)) || {};
  }catch{
    return {};
  }
}

function petcareClearSession(){
  localStorage.removeItem(PETCARE_SESSION_KEY);
}

function petcareNextId(list){
  if(!Array.isArray(list) || !list.length) return 1;
  return Math.max(...list.map(item => Number(item.id) || 0)) + 1;
}

function petcareBrDate(isoDate){
  if(!isoDate) return "";
  const [y,m,d] = isoDate.split("-");
  if(!y || !m || !d) return isoDate;
  return `${d}/${m}/${y}`;
}

function petcareIsoFromBr(brDate){
  if(!brDate) return "";
  const [d,m,y] = brDate.split("/");
  if(!d || !m || !y) return "";
  return `${y}-${m.padStart(2,"0")}-${d.padStart(2,"0")}`;
}

function petcareGetPetById(data, petId){
  return (data.pets || []).find(p => String(p.id) === String(petId)) || null;
}

function petcareGetVets(data){
  const lista = (data.usuarios || []).filter(u => u.perfil === "Veterinário(a)");
  const unicos = [];
  const nomes = new Set();

  lista.forEach(v => {
    const nome = String(v.nome || "").trim();
    if(nome && !nomes.has(nome)){
      nomes.add(nome);
      unicos.push(v);
    }
  });

  return unicos;
}

function petcareAvailableHours(data, vet, isoDate){
  const horasBase = [
    "08:00","09:00","10:00","11:00",
    "13:00","14:00","15:00","16:00","17:00"
  ];

  if(!vet || !isoDate) return horasBase;

  const dataBr = petcareBrDate(isoDate);
  const ocupados = new Set(
    (data.consultas || [])
      .filter(c =>
        c.vet === vet &&
        c.data === dataBr &&
        c.status !== "Concluída" &&
        c.status !== "Cancelada"
      )
      .map(c => c.hora)
  );

  return horasBase.filter(h => !ocupados.has(h));
}