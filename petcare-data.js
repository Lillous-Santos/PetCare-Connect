const PETCARE_DB_KEY = "petcare_db";
const PETCARE_SESSION_KEY = "petcare_session";
const PETCARE_DEFAULT_HOURS = ["09:00","10:00","11:00","14:00","15:00","16:00"];

function petcareBaseData(){
  return {
    usuarios: [],
    pets: [],
    consultas: [],
    avisos: []
  };
}

function petcareCreateAviso(aviso){
  return {
    titulo: aviso?.titulo || "",
    texto: aviso?.texto || "",
    tipo: aviso?.tipo || "geral",
    tutor: aviso?.tutor || "",
    vet: aviso?.vet || "",
    petId: Number(aviso?.petId) || 0,
    lidoPor: Array.isArray(aviso?.lidoPor) ? aviso.lidoPor : []
  };
}

function petcareNormalizeUser(user){
  const normalized = {
    id: Number(user?.id) || 0,
    nome: user?.nome || "",
    perfil: user?.perfil || "",
    email: user?.email || "",
    telefone: user?.telefone || ""
  };

  if(normalized.perfil === "Tutor(a)"){
    normalized.endereco = user?.endereco || "";
    normalized.convenioStatus = user?.convenioStatus || "Pendente";
  }

  if(normalized.perfil === "Veterinário(a)"){
    normalized.registro = user?.registro || "";
  }

  return normalized;
}

function petcareNormalizePet(pet){
  return {
    id: Number(pet?.id) || 0,
    nome: pet?.nome || "",
    tutor: pet?.tutor || "",
    tipo: pet?.tipo || "",
    idade: Number(pet?.idade) || 0,
    peso: pet?.peso || "",
    vacinasAplicadas: Array.isArray(pet?.vacinasAplicadas) ? pet.vacinasAplicadas : [],
    vacinasDisponiveis: Array.isArray(pet?.vacinasDisponiveis) ? pet.vacinasDisponiveis : [],
    historico: Array.isArray(pet?.historico) ? pet.historico : [],
    medicacoes: Array.isArray(pet?.medicacoes) ? pet.medicacoes : [],
    relatorio: pet?.relatorio || "",
    relatorioAtualizacao: pet?.relatorioAtualizacao || ""
  };
}

function petcareNormalizeConsulta(consulta){
  return {
    id: Number(consulta?.id) || 0,
    petId: Number(consulta?.petId) || 0,
    vet: consulta?.vet || "",
    data: consulta?.data || "",
    hora: consulta?.hora || "",
    status: consulta?.status || "Marcada"
  };
}

function petcareNormalizeAviso(aviso){
  return {
    id: Number(aviso?.id) || 0,
    titulo: aviso?.titulo || "",
    texto: aviso?.texto || "",
    tipo: aviso?.tipo || "geral",
    tutor: aviso?.tutor || "",
    vet: aviso?.vet || "",
    petId: Number(aviso?.petId) || 0,
    lidoPor: Array.isArray(aviso?.lidoPor)
      ? aviso.lidoPor.filter(item => typeof item === "string" && item.trim() !== "")
      : []
  };
}

function petcareNormalizeData(data){
  return {
    usuarios: Array.isArray(data?.usuarios) ? data.usuarios.map(petcareNormalizeUser) : [],
    pets: Array.isArray(data?.pets) ? data.pets.map(petcareNormalizePet) : [],
    consultas: Array.isArray(data?.consultas) ? data.consultas.map(petcareNormalizeConsulta) : [],
    avisos: Array.isArray(data?.avisos) ? data.avisos.map(petcareNormalizeAviso) : []
  };
}

function petcareLoad(){
  try{
    const raw = localStorage.getItem(PETCARE_DB_KEY);

    if(!raw){
      const base = petcareBaseData();
      localStorage.setItem(PETCARE_DB_KEY, JSON.stringify(base));
      return base;
    }

    const parsed = JSON.parse(raw);
    const normalized = petcareNormalizeData(parsed);
    localStorage.setItem(PETCARE_DB_KEY, JSON.stringify(normalized));
    return normalized;
  }catch{
    const base = petcareBaseData();
    localStorage.setItem(PETCARE_DB_KEY, JSON.stringify(base));
    return base;
  }
}

function petcareSave(data){
  const normalized = petcareNormalizeData(data);
  localStorage.setItem(PETCARE_DB_KEY, JSON.stringify(normalized));
}

function petcareNextId(list){
  if(!Array.isArray(list) || !list.length) return 1;
  return Math.max(...list.map(item => Number(item?.id) || 0)) + 1;
}

function petcareSetSession(user, role){
  localStorage.setItem(PETCARE_SESSION_KEY, JSON.stringify({
    user: user || "",
    role: role || ""
  }));
}

function petcareGetSession(){
  try{
    const raw = localStorage.getItem(PETCARE_SESSION_KEY);
    if(!raw) return { user:"", role:"" };

    const parsed = JSON.parse(raw);
    return {
      user: parsed?.user || "",
      role: parsed?.role || ""
    };
  }catch{
    return { user:"", role:"" };
  }
}

function petcareClearSession(){
  localStorage.removeItem(PETCARE_SESSION_KEY);
}

function petcareBrDate(isoDate){
  if(!isoDate || typeof isoDate !== "string") return "";
  const [year, month, day] = isoDate.split("-");
  if(!year || !month || !day) return isoDate;
  return `${day}/${month}/${year}`;
}

function petcareIsoDate(brDate){
  if(!brDate || typeof brDate !== "string") return "";
  const [day, month, year] = brDate.split("/");
  if(!day || !month || !year) return brDate;
  return `${year}-${month}-${day}`;
}

function petcareIsValidIsoDate(isoDate){
  if(!isoDate || typeof isoDate !== "string") return false;

  const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if(!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function petcareIsFutureDate(isoDate){
  if(!petcareIsValidIsoDate(isoDate)) return false;

  const [year, month, day] = isoDate.split("-").map(Number);
  const selected = new Date(year, month - 1, day);
  selected.setHours(0,0,0,0);

  const today = new Date();
  today.setHours(0,0,0,0);

  return selected > today;
}

function petcareGetPetById(data, petId){
  if(!data || !Array.isArray(data.pets)) return null;
  return data.pets.find(p => Number(p.id) === Number(petId)) || null;
}

function petcareGetUserById(data, userId){
  if(!data || !Array.isArray(data.usuarios)) return null;
  return data.usuarios.find(u => Number(u.id) === Number(userId)) || null;
}

function petcareGetVets(data){
  if(!data || !Array.isArray(data.usuarios)) return [];
  return data.usuarios.filter(u => u.perfil === "Veterinário(a)");
}

function petcareGetTutors(data){
  if(!data || !Array.isArray(data.usuarios)) return [];
  return data.usuarios.filter(u => u.perfil === "Tutor(a)");
}

function petcareAvailableHours(data, vetName, isoDate){
  if(!vetName || !isoDate) return PETCARE_DEFAULT_HOURS.slice();

  const taken = (data?.consultas || [])
    .filter(c =>
      c.vet === vetName &&
      petcareIsoDate(c.data) === isoDate &&
      c.status !== "Cancelada"
    )
    .map(c => c.hora);

  return PETCARE_DEFAULT_HOURS.filter(h => !taken.includes(h));
}

function petcareResetAll(){
  localStorage.removeItem(PETCARE_DB_KEY);
  localStorage.removeItem(PETCARE_SESSION_KEY);
}