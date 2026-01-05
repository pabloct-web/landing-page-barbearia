const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = 3000;

// Configurar middleware para ler JSON e servir arquivos estáticos (HTML/CSS)
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '.')));

// Configurar Banco de Dados SQLite
const db = new sqlite3.Database('./barbearia.db', (err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err.message);
    } else {
        console.log('Conectado ao banco de dados SQLite.');
        // Criar tabela se não existir
        db.serialize(() => {
            // Tabela de Agendamentos
            db.run(`CREATE TABLE IF NOT EXISTS agendamentos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT,
                telefone TEXT,
                servico TEXT,
                profissional TEXT,
                data TEXT,
                horario TEXT
            )`);

            // Tabela de Profissionais
            db.run(`CREATE TABLE IF NOT EXISTS profissionais (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT,
                especialidade TEXT,
                foto TEXT
            )`);

            // Inserir dados iniciais de profissionais se a tabela estiver vazia
            db.get("SELECT count(*) as count FROM profissionais", (err, row) => {
                if (row.count === 0) {
                    const stmt = db.prepare("INSERT INTO profissionais (nome, especialidade, foto) VALUES (?, ?, ?)");
                    stmt.run("Carlos Silva", "Especialista em Cortes Clássicos", "https://images.unsplash.com/photo-1580894732444-8ecded7900cd?w=400&q=80");
                    stmt.run("Marcos Oliveira", "Barba e Pigmentação", "https://images.unsplash.com/photo-1618077360395-f3068be8e001?w=400&q=80");
                    stmt.run("André Santos", "Cortes Modernos e Freestyle", "https://images.unsplash.com/photo-1534308143481-c55f00be8bd7?w=400&q=80");
                    stmt.finalize();
                    console.log("Dados de profissionais inseridos.");
                }
            });
        });
    }
});

// Rota para listar profissionais
app.get('/api/profissionais', (req, res) => {
    db.all("SELECT * FROM profissionais", [], (err, rows) => {
        if (err) {
            return res.status(400).json({ "error": err.message });
        }
        res.json({ "data": rows });
    });
});

// Rota para salvar agendamento
app.post('/agendar', (req, res) => {
    const { nome, telefone, servico, profissional, data, horario } = req.body;
    
    if (!nome || !telefone || !data || !horario || !profissional) {
        return res.status(400).json({ error: "Preencha todos os campos obrigatórios." });
    }

    const sql = `INSERT INTO agendamentos (nome, telefone, servico, profissional, data, horario) VALUES (?, ?, ?, ?, ?, ?)`;
    const params = [nome, telefone, servico, profissional, data, horario];

    db.run(sql, params, function(err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({
            "message": "Agendamento realizado com sucesso!",
            "id": this.lastID
        });
    });
});

// Rota para ver agendamentos (apenas para teste)
app.get('/api/agendamentos', (req, res) => {
    db.all("SELECT * FROM agendamentos", [], (err, rows) => {
        if (err) {
            res.status(400).json({"error":err.message});
            return;
        }
        res.json({ "data": rows });
    });
});

// Rota para Newsletter (Simples)
app.post('/newsletter', (req, res) => {
    // Aqui você salvaria o email no banco
    res.redirect('/#contato');
});

// Rota para acessar o Painel Admin
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Rota de Login (Simples)
app.post('/api/login', (req, res) => {
    const { user, pass } = req.body;
    // Em um sistema real, use banco de dados e hash para senhas
    if (user === 'admin' && pass === '1234') {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false });
    }
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});