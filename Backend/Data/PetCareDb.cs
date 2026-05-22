using System.Data;
using Dapper;
using Microsoft.Data.SqlClient;
using PetCareConnect.API.Models;

namespace PetCareConnect.API.Data;

public class PetCareDb
{
    private readonly IConfiguration _config;

    public PetCareDb(IConfiguration config)
    {
        _config = config;
    }

    private IDbConnection Connection =>
        new SqlConnection(
            _config.GetConnectionString("DefaultConnection")
        );

    // =====================================================
    // USUÁRIOS
    // =====================================================

    public async Task<Usuario?> BuscarUsuarioPorLoginAsync(string login)
    {
        using var conn = Connection;

        var sql = @"
            SELECT *
            FROM Usuarios
            WHERE Login = @login
        ";

        return await conn.QueryFirstOrDefaultAsync<Usuario>(
            sql,
            new { login }
        );
    }

    public async Task<Usuario?> BuscarPorLoginAsync(string login)
    {
        return await BuscarUsuarioPorLoginAsync(login);
    }

    public async Task<IEnumerable<Usuario>> ListarUsuariosAsync(string? perfil = null)
    {
        using var conn = Connection;

        var sql = @"
            SELECT *
            FROM Usuarios
        ";

        if (!string.IsNullOrEmpty(perfil))
        {
            sql += " WHERE Perfil = @perfil";
        }

        return await conn.QueryAsync<Usuario>(
            sql,
            new { perfil }
        );
    }

    public async Task<int> CriarUsuarioAsync(Usuario usuario)
    {
        using var conn = Connection;

        var sql = @"
            INSERT INTO Usuarios
            (
                Nome,
                Login,
                Email,
                SenhaHash,
                Perfil,
                Ativo,
                CriadoEm
            )
            VALUES
            (
                @Nome,
                @Login,
                @Email,
                @SenhaHash,
                @Perfil,
                1,
                GETDATE()
            );

            SELECT CAST(SCOPE_IDENTITY() as int);
        ";

        return await conn.ExecuteScalarAsync<int>(
            sql,
            usuario
        );
    }

    public async Task<bool> ToggleAtivoAsync(int id, bool ativo)
    {
        using var conn = Connection;

        var sql = @"
            UPDATE Usuarios
            SET Ativo = @ativo
            WHERE Id = @id
        ";

        var rows = await conn.ExecuteAsync(
            sql,
            new { id, ativo }
        );

        return rows > 0;
    }

    // =====================================================
    // PETS
    // =====================================================

    public async Task<IEnumerable<Pet>> ListarPetsAsync(int? tutorId = null)
    {
        using var conn = Connection;

        var sql = @"
            SELECT
                p.*,
                u.Nome AS TutorNome
            FROM Pets p
            INNER JOIN Usuarios u
                ON u.Id = p.TutorId
        ";

        if (tutorId.HasValue)
        {
            sql += " WHERE p.TutorId = @tutorId";
        }

        return await conn.QueryAsync<Pet>(
            sql,
            new { tutorId }
        );
    }

    public async Task<Pet?> BuscarPetPorIdAsync(int id)
    {
        using var conn = Connection;

        var sql = @"
            SELECT
                p.*,
                u.Nome AS TutorNome
            FROM Pets p
            INNER JOIN Usuarios u
                ON u.Id = p.TutorId
            WHERE p.Id = @id
        ";

        return await conn.QueryFirstOrDefaultAsync<Pet>(
            sql,
            new { id }
        );
    }

    public async Task<int> CriarPetAsync(Pet pet)
    {
        using var conn = Connection;

        var sql = @"
            INSERT INTO Pets
            (
                Nome,
                Tipo,
                Idade,
                Peso,
                TutorId
            )
            VALUES
            (
                @Nome,
                @Tipo,
                @Idade,
                @Peso,
                @TutorId
            );

            SELECT CAST(SCOPE_IDENTITY() as int);
        ";

        return await conn.ExecuteScalarAsync<int>(
            sql,
            pet
        );
    }

    public async Task AtualizarPetAsync(int id, int idade, decimal peso)
    {
        using var conn = Connection;

        var sql = @"
            UPDATE Pets
            SET
                Idade = @idade,
                Peso = @peso
            WHERE Id = @id
        ";

        await conn.ExecuteAsync(
            sql,
            new { id, idade, peso }
        );
    }

    public async Task RemoverPetAsync(int id)
    {
        using var conn = Connection;

        var sql = @"
            DELETE FROM Pets
            WHERE Id = @id
        ";

        await conn.ExecuteAsync(
            sql,
            new { id }
        );
    }

    // =====================================================
    // CONSULTAS
    // =====================================================

    public async Task<IEnumerable<Consulta>> ListarConsultasAsync(
        int? petId,
        int? vetId,
        int? tutorId)
    {
        using var conn = Connection;

        var sql = @"
            SELECT c.*
            FROM Consultas c
            INNER JOIN Pets p
                ON p.Id = c.PetId
            WHERE 1=1
        ";

        if (petId.HasValue)
            sql += " AND c.PetId = @petId";

        if (vetId.HasValue)
            sql += " AND c.VeterinarioId = @vetId";

        if (tutorId.HasValue)
            sql += " AND p.TutorId = @tutorId";

        return await conn.QueryAsync<Consulta>(
            sql,
            new { petId, vetId, tutorId }
        );
    }

    public async Task<bool> VerificarConflitoHorarioAsync(
        int vetId,
        DateTime data,
        TimeSpan hora)
    {
        using var conn = Connection;

        var sql = @"
            SELECT COUNT(*)
            FROM Consultas
            WHERE VeterinarioId = @vetId
            AND Data = @data
            AND Hora = @hora
        ";

        var total = await conn.ExecuteScalarAsync<int>(
            sql,
            new { vetId, data, hora }
        );

        return total > 0;
    }

    public async Task<int> CriarConsultaAsync(Consulta consulta)
    {
        using var conn = Connection;

        var sql = @"
            INSERT INTO Consultas
            (
                PetId,
                VeterinarioId,
                Data,
                Hora,
                Status
            )
            VALUES
            (
                @PetId,
                @VeterinarioId,
                @Data,
                @Hora,
                @Status
            );

            SELECT CAST(SCOPE_IDENTITY() as int);
        ";

        return await conn.ExecuteScalarAsync<int>(
            sql,
            consulta
        );
    }

    public async Task<bool> AtualizarStatusConsultaAsync(
        int id,
        string status,
        string? obs)
    {
        using var conn = Connection;

        var sql = @"
            UPDATE Consultas
            SET
                Status = @status,
                Observacoes = @obs
            WHERE Id = @id
        ";

        var rows = await conn.ExecuteAsync(
            sql,
            new { id, status, obs }
        );

        return rows > 0;
    }

    // =====================================================
    // VACINAS
    // =====================================================

    public async Task<IEnumerable<Vacina>> ListarVacinasPorPetAsync(int petId)
    {
        using var conn = Connection;

        return await conn.QueryAsync<Vacina>(
            "SELECT * FROM Vacinas WHERE PetId = @petId",
            new { petId }
        );
    }

    public async Task<int> CriarVacinaAsync(Vacina vacina)
    {
        using var conn = Connection;

        var sql = @"
            INSERT INTO Vacinas
            (
                PetId,
                Nome,
                DataAplicacao,
                Observacao,
                Aplicada
            )
            VALUES
            (
                @PetId,
                @Nome,
                @DataAplicacao,
                @Observacao,
                @Aplicada
            );

            SELECT CAST(SCOPE_IDENTITY() as int);
        ";

        return await conn.ExecuteScalarAsync<int>(
            sql,
            vacina
        );
    }

    public async Task<bool> AplicarVacinaAsync(
        int id,
        DateTime data,
        string? obs)
    {
        using var conn = Connection;

        var sql = @"
            UPDATE Vacinas
            SET
                Aplicada = 1,
                DataAplicacao = @data,
                Observacao = @obs
            WHERE Id = @id
        ";

        var rows = await conn.ExecuteAsync(
            sql,
            new { id, data, obs }
        );

        return rows > 0;
    }

    // =====================================================
    // HISTÓRICO
    // =====================================================

    public async Task<IEnumerable<Historico>> ListarHistoricoPorPetAsync(int petId)
    {
        using var conn = Connection;

        return await conn.QueryAsync<Historico>(
            "SELECT * FROM Historicos WHERE PetId = @petId",
            new { petId }
        );
    }

    public async Task<int> AdicionarHistoricoAsync(Historico historico)
    {
        using var conn = Connection;

        var sql = @"
            INSERT INTO Historicos
            (
                PetId,
                Descricao,
                DataEvento
            )
            VALUES
            (
                @PetId,
                @Descricao,
                @DataEvento
            );

            SELECT CAST(SCOPE_IDENTITY() as int);
        ";

        return await conn.ExecuteScalarAsync<int>(
            sql,
            historico
        );
    }

    // =====================================================
    // AVISOS
    // =====================================================

    public async Task<IEnumerable<Aviso>> ListarAvisosAsync(
        int userId,
        string perfil,
        int tutorId)
    {
        using var conn = Connection;

        var sql = perfil == "Tutor"
            ? "SELECT * FROM Avisos WHERE TutorId = @tutorId"
            : "SELECT * FROM Avisos";

        return await conn.QueryAsync<Aviso>(
            sql,
            new { tutorId }
        );
    }

    public async Task<int> CriarAvisoAsync(Aviso aviso)
    {
        using var conn = Connection;

        var sql = @"
            INSERT INTO Avisos
            (
                Titulo,
                Texto,
                Tipo,
                TutorId,
                PetId
            )
            VALUES
            (
                @Titulo,
                @Texto,
                @Tipo,
                @TutorId,
                @PetId
            );

            SELECT CAST(SCOPE_IDENTITY() as int);
        ";

        return await conn.ExecuteScalarAsync<int>(
            sql,
            aviso
        );
    }

    public async Task MarcarAvisoComoLidoAsync(
        int id,
        int userId)
    {
        using var conn = Connection;

        var sql = @"
            UPDATE Avisos
            SET Lido = 1
            WHERE Id = @id
        ";

        await conn.ExecuteAsync(
            sql,
            new { id }
        );
    }

    // =====================================================
    // RELATÓRIOS
    // =====================================================

    public async Task<IEnumerable<Relatorio>> ListarRelatoriosAsync(
        int? petId,
        int? tutorId)
    {
        using var conn = Connection;

        var sql = @"
            SELECT r.*
            FROM Relatorios r
            INNER JOIN Pets p
                ON p.Id = r.PetId
            WHERE 1=1
        ";

        if (petId.HasValue)
            sql += " AND r.PetId = @petId";

        if (tutorId.HasValue)
            sql += " AND p.TutorId = @tutorId";

        return await conn.QueryAsync<Relatorio>(
            sql,
            new { petId, tutorId }
        );
    }

    public async Task UpsertRelatorioAsync(
        int petId,
        string texto)
    {
        using var conn = Connection;

        var sql = @"
            IF EXISTS(SELECT 1 FROM Relatorios WHERE PetId = @petId)
                UPDATE Relatorios
                SET Texto = @texto
                WHERE PetId = @petId
            ELSE
                INSERT INTO Relatorios(PetId, Texto)
                VALUES(@petId, @texto)
        ";

        await conn.ExecuteAsync(
            sql,
            new { petId, texto }
        );
    }

    // =====================================================
    // ESTATÍSTICAS
    // =====================================================

    public async Task<Dictionary<string, int>> EstatisticasAsync()
    {
        using var conn = Connection;

        var stats = new Dictionary<string, int>();

        stats["usuarios"] =
            await conn.ExecuteScalarAsync<int>(
                "SELECT COUNT(*) FROM Usuarios"
            );

        stats["pets"] =
            await conn.ExecuteScalarAsync<int>(
                "SELECT COUNT(*) FROM Pets"
            );

        stats["consultas"] =
            await conn.ExecuteScalarAsync<int>(
                "SELECT COUNT(*) FROM Consultas"
            );

        return stats;
    }
    public async Task<Usuario?> BuscarUsuarioPorEmailAsync(
    string email)
{
    using var conn = Connection;

    var sql = @"
        SELECT *
        FROM Usuarios
        WHERE Email = @email
    ";

    return await conn.QueryFirstOrDefaultAsync<Usuario>(
        sql,
        new { email }
    );
}
// =====================================================
// SENHA
// =====================================================

    public async Task<bool> AtualizarSenhaAsync(
        int usuarioId,
        string novaHash)
    {
        using var conn = Connection;

        var sql = @"
            UPDATE Usuarios
            SET SenhaHash = @novaHash
            WHERE Id = @usuarioId
        ";

        var rows = await conn.ExecuteAsync(
            sql,
            new
            {
                usuarioId,
                novaHash
            }
        );

        return rows > 0;
    }
    // =====================================================
// ALTERAR SENHA POR LOGIN
// =====================================================

public async Task<bool> AtualizarSenhaPorLoginAsync(
    string login,
    string novaHash)
{
    using var conn = Connection;

    var sql = @"
        UPDATE Usuarios
        SET SenhaHash = @novaHash
        WHERE Login = @login
    ";

    var rows = await conn.ExecuteAsync(
        sql,
        new
        {
            login,
            novaHash
        }
    );

    return rows > 0;
}
}