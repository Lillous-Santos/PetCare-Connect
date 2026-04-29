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
    petId: Number(aviso?.petId) || 0,
    tutor: aviso?.tutor || "",
    vet: aviso?.vet || "",
    lido: Boolean(aviso?.lido),
    lidoPor: Array.isArray(aviso?.lidoPor) ? aviso.lidoPor : []
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

function petcareIsValidIsoDate(isoDate){
  if(!isoDate || typeof isoDate !== "string") return false;

  const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if(!match) return false;

  const ano = Number(match[1]);
  const mes = Number(match[2]);
  const dia = Number(match[3]);

  if(mes < 1 || mes > 12) return false;
  if(dia < 1) return false;

  const diasNoMes = new Date(ano, mes, 0).getDate();
  return dia <= diasNoMes;
}

function petcareIsFutureDate(isoDate){
  if(!petcareIsValidIsoDate(isoDate)) return false;

  const hoje = new Date();
  hoje.setHours(0,0,0,0);

  const data = new Date(isoDate + "T00:00:00");
  return data > hoje;
}

function petcareCreateAviso({
  titulo,
  texto,
  tipo = "geral",
  petId = 0,
  tutor = "",
  vet = ""
}){
  return {
    id: 0,
    titulo: titulo || "",
    texto: texto || "",
    tipo,
    petId: Number(petId) || 0,
    tutor: tutor || "",
    vet: vet || "",
    lido: false,
    lidoPor: []
  };
}

function petcareViewerKey(user, role){
  return `${role}::${user}`;
}

function petcareAvisoVisibleTo(aviso, user, role, data){
  if(!aviso) return false;

  if(role === "Administração") return true;

  if(aviso.tipo === "geral") return true;

  if(role === "Tutor(a)"){
    if(aviso.tipo === "tutor" && aviso.tutor === user) return true;

    if(aviso.tipo === "pet"){
      const pet = petcareGetPetById(data, aviso.petId);
      return pet && pet.tutor === user;
    }

    if(aviso.tipo === "consulta"){
      const pet = petcareGetPetById(data, aviso.petId);
      return pet && pet.tutor === user;
    }
  }

  if(role === "Veterinário(a)"){
    if(aviso.tipo === "vet" && aviso.vet === user) return true;
    if(aviso.tipo === "consulta" && aviso.vet === user) return true;
  }

  return false;
}

function petcareGetVisibleAvisos(data, user, role){
  return (data?.avisos || []).filter(aviso => petcareAvisoVisibleTo(aviso, user, role, data));
}

function petcareIsAvisoLidoPor(aviso, user, role){
  const key = petcareViewerKey(user, role);
  return Array.isArray(aviso?.lidoPor) && aviso.lidoPor.includes(key);
}

function petcareMarkAvisosAsRead(data, user, role){
  const key = petcareViewerKey(user, role);
  let changed = false;

  (data?.avisos || []).forEach(aviso => {
    if(petcareAvisoVisibleTo(aviso, user, role, data)){
      if(!Array.isArray(aviso.lidoPor)) aviso.lidoPor = [];
      if(!aviso.lidoPor.includes(key)){
        aviso.lidoPor.push(key);
        changed = true;
      }
    }
  });

  return changed;
}

function petcareCountUnreadAvisos(data, user, role){
  return petcareGetVisibleAvisos(data, user, role)
    .filter(aviso => !petcareIsAvisoLidoPor(aviso, user, role))
    .length;
}

function petcareResetAll(){
  localStorage.removeItem(PETCARE_DB_KEY);
  localStorage.removeItem(PETCARE_SESSION_KEY);
}