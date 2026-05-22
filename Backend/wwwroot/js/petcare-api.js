const API_BASE = 'http://localhost:5000/api';

// ======================================================
// LOGIN
// ======================================================

async function petcareLogin(login, senha, perfil){

    try{

        const response = await fetch(
            `${API_BASE}/Auth/login`,
            {
                method:'POST',

                headers:{
                    'Content-Type':'application/json'
                },

                body:JSON.stringify({
                    login: login,
                    senha: senha,
                    perfil: perfil
                })
            }
        );

        const data = await response.json();

        console.log('LOGIN RESPONSE:', data);

        return data;

    }catch(error){

        console.error('ERRO LOGIN:', error);

        return {
            sucesso:false,
            mensagem:'Servidor offline ou inacessível.'
        };
    }
}

// ======================================================
// SESSÃO
// ======================================================

function petcareSetSession(
    token,
    usuarioId,
    nome,
    login,
    perfil
){

    localStorage.setItem(
        'petcare_token',
        token
    );

    localStorage.setItem(
        'petcare_usuarioId',
        usuarioId
    );

    localStorage.setItem(
        'petcare_nome',
        nome
    );

    localStorage.setItem(
        'petcare_login',
        login
    );

    localStorage.setItem(
        'petcare_perfil',
        perfil
    );
}

// ======================================================
// GET SESSION
// ======================================================

function petcareGetSession(){

    return {

        token:
            localStorage.getItem('petcare_token'),

        usuarioId:
            localStorage.getItem('petcare_usuarioId'),

        nome:
            localStorage.getItem('petcare_nome'),

        login:
            localStorage.getItem('petcare_login'),

        perfil:
            localStorage.getItem('petcare_perfil')
    };
}

// ======================================================
// TOKEN
// ======================================================

function petcareGetToken(){

    return localStorage.getItem(
        'petcare_token'
    );
}

// ======================================================
// PERFIL
// ======================================================

function petcareGetPerfil(){

    return localStorage.getItem(
        'petcare_perfil'
    );
}

// ======================================================
// AUTH GUARD
// ======================================================

function petcareRequireAuth(perfilEsperado){

    const token =
        petcareGetToken();

    const perfil =
        petcareGetPerfil();

    if(!token){

        window.location.href =
            'index.html';

        return false;
    }

    if(
        perfilEsperado &&
        perfil !== perfilEsperado
    ){

        window.location.href =
            'index.html';

        return false;
    }

    return true;
}

// ======================================================
// LOGOUT
// ======================================================

function petcareLogout(){

    localStorage.removeItem('petcare_token');
    localStorage.removeItem('petcare_usuarioId');
    localStorage.removeItem('petcare_nome');
    localStorage.removeItem('petcare_login');
    localStorage.removeItem('petcare_perfil');

    window.location.href =
        'index.html';
}

// ======================================================
// RECUPERAÇÃO SENHA
// ======================================================

function abrirRecuperacaoSenha(){

    window.location.href =
        'recuperar-senha.html';
}
// ======================================================
// ALTERAR SENHA
// ======================================================

async function petcareAlterarSenha(
    login,
    novaSenha
){

    try{

        const response = await fetch(
            `${API_BASE}/Auth/nova-senha`,
            {
                method:'POST',

                headers:{
                    'Content-Type':'application/json'
                },

                body:JSON.stringify({
                    login: login,
                    novaSenha: novaSenha
                })
            }
        );

        return await response.json();

    }catch(error){

        console.error(
            'ERRO ALTERAR SENHA:',
            error
        );

        return {
            sucesso:false,
            mensagem:'Erro ao conectar com servidor.'
        };
    }
    
}
