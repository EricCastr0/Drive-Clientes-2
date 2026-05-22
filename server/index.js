const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');

const app = express();
const PORT = 3002;
const STORAGE_PATH = path.join(__dirname, '../storage');

app.use(cors());
app.use(express.json());

// Garantir que a pasta de storage existe
fs.ensureDirSync(STORAGE_PATH);

// Configuração do Multer para upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, STORAGE_PATH);
    },
    filename: (req, file, cb) => {
        const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
        cb(null, originalName);
    }
});
const upload = multer({ storage });

// Helper para atualizar metadados
const updateMetadata = async (folderPath, fileName, data, isDelete = false) => {
    const absoluteFolder = path.join(STORAGE_PATH, folderPath);
    const metadataPath = path.join(absoluteFolder, '.metadata.json');

    try {
        await fs.ensureDir(absoluteFolder);
        let metadata = {};
        if (await fs.pathExists(metadataPath)) {
            metadata = await fs.readJson(metadataPath);
        }

        if (isDelete) {
            delete metadata[fileName];
        } else {
            metadata[fileName] = { ...metadata[fileName], ...data };
        }

        await fs.writeJson(metadataPath, metadata, { spaces: 2 });
    } catch (e) {
        console.error('Erro ao atualizar metadados:', e);
    }
};

// Rota para listar arquivos
app.get('/api/files', async (req, res) => {
    const folderPath = req.query.folder || '';
    const absolutePath = path.join(STORAGE_PATH, folderPath);

    if (!absolutePath.startsWith(STORAGE_PATH)) {
        return res.status(403).json({ error: 'Acesso negado' });
    }

    try {
        if (!await fs.pathExists(absolutePath)) {
            return res.status(404).json({ error: 'Pasta não encontrada' });
        }

        // Carregar metadados se existirem
        const metadataPath = path.join(absolutePath, '.metadata.json');
        let metadata = {};
        if (await fs.pathExists(metadataPath)) {
            try {
                metadata = await fs.readJson(metadataPath);
            } catch (e) {
                console.error('Erro ao ler metadados:', e);
            }
        }

        const files = await fs.readdir(absolutePath);
        const fileDetails = await Promise.all(files
            .filter(file => file !== '.metadata.json') // Esconder arquivo de metadados
            .map(async (file) => {
                const stats = await fs.stat(path.join(absolutePath, file));
                return {
                    name: file,
                    size: stats.size,
                    createdAt: stats.birthtime && stats.birthtime.getTime() > 0 ? stats.birthtime : stats.mtime,
                    isDirectory: stats.isDirectory(),
                    owner: metadata[file]?.owner || 'Sistema'
                };
            }));
        res.json(fileDetails);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao listar arquivos' });
    }
});

// Rota para upload
app.post('/api/upload', (req, res, next) => {
    console.log(`[UPLOAD ROUTE HIT] Recebendo requisição de upload. Folder: ${req.query.folder}, Owner: ${req.query.owner}`);
    // Definir destino dinâmico baseado na query
    const folderPath = req.query.folder || '';
    const absolutePath = path.join(STORAGE_PATH, folderPath);

    if (!absolutePath.startsWith(STORAGE_PATH)) {
        console.error('[UPLOAD ERROR] Acesso negado. Caminho absoluto fora do storage.');
        return res.status(403).json({ error: 'Acesso negado' });
    }

    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            fs.ensureDirSync(absolutePath);
            cb(null, absolutePath);
        },
        filename: (req, file, cb) => {
            const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
            cb(null, originalName);
        }
    });
    const upload = multer({ storage }).array('files');

    upload(req, res, async (err) => {
        if (err) {
            console.error('[UPLOAD ERROR] Multer Error:', err);
            return res.status(500).json({ error: 'Erro no upload' });
        }

        // Salvar metadados do proprietário
        const owner = req.query.owner || 'Anônimo';
        if (req.files && req.files.length > 0) {
            const absoluteFolder = path.join(STORAGE_PATH, folderPath);
            const metadataPath = path.join(absoluteFolder, '.metadata.json');

            try {
                await fs.ensureDir(absoluteFolder);
                let metadata = {};
                if (await fs.pathExists(metadataPath)) {
                    metadata = await fs.readJson(metadataPath);
                }

                req.files.forEach(file => {
                    metadata[file.filename] = { ...metadata[file.filename], owner };
                });

                await fs.writeJson(metadataPath, metadata, { spaces: 2 });
            } catch (e) {
                console.error('Erro ao atualizar metadados em lote:', e);
            }
        }

        res.json({ message: 'Arquivos enviados com sucesso', files: req.files });
    });
});

// Rota para criar pasta
app.post('/api/mkdir', async (req, res) => {
    const { name, folder } = req.body;
    const folderPath = folder || '';
    const absolutePath = path.resolve(STORAGE_PATH, folderPath, name);

    if (!absolutePath.startsWith(STORAGE_PATH)) {
        return res.status(403).json({ error: 'Acesso negado' });
    }

    try {
        await fs.ensureDir(absolutePath);

        // Salvar metadados do proprietário
        const owner = req.body.owner || 'Anônimo';
        await updateMetadata(folderPath, name, { owner });

        res.json({ message: 'Pasta criada com sucesso' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao criar pasta' });
    }
});

// Função auxiliar para calcular tamanho da pasta recursivamente
const getDirSize = async (dirPath) => {
    let size = 0;
    try {
        const absoluteDirPath = path.resolve(dirPath);
        const files = await fs.readdir(absoluteDirPath);

        for (const file of files) {
            const filePath = path.join(absoluteDirPath, file);
            try {
                const stats = await fs.stat(filePath);
                if (stats.isDirectory()) {
                    size += await getDirSize(filePath);
                } else {
                    size += stats.size;
                }
            } catch (statError) {
                console.warn(`Erro ao obter stats de ${filePath}:`, statError.message);
            }
        }
    } catch (readdirError) {
        console.error(`Erro ao ler diretório ${dirPath}:`, readdirError.message);
    }
    return size;
};

// Rota para informações de armazenamento
app.get('/api/storage-info', async (req, res) => {
    try {
        const totalUsed = await getDirSize(STORAGE_PATH);
        const limit = 10 * 1024 * 1024 * 1024; // 10 GB
        console.log(`Calculado armazenamento: ${totalUsed} bytes de ${limit} bytes`);
        res.json({
            used: totalUsed,
            limit: limit,
            percent: Math.min((totalUsed / limit) * 100, 100)
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao calcular armazenamento' });
    }
});

// Rota para baixar arquivo
app.get('/api/download', async (req, res) => {
    const logFile = path.join(__dirname, 'debug.log');
    const log = (msg) => {
        const line = `[${new Date().toISOString()}] ${msg}\n`;
        fs.appendFileSync(logFile, line);
        console.log(msg);
    };

    try {
        const { file, folder } = req.query;
        if (!file) {
            log('Erro: Nome do arquivo ausente');
            return res.status(400).json({ error: 'Nome do arquivo não fornecido' });
        }

        const normalizedFolder = (folder || '').replace(/\\/g, '/');
        const absolutePath = path.resolve(STORAGE_PATH, normalizedFolder, file);
        const rootPath = path.resolve(STORAGE_PATH);

        log(`Solicitação: folder="${folder}", file="${file}"`);
        log(`Caminho resolvido: ${absolutePath}`);

        if (!absolutePath.startsWith(rootPath)) {
            log('Erro: Tentativa de acesso fora do storage');
            return res.status(403).json({ error: 'Acesso negado' });
        }

        if (await fs.pathExists(absolutePath)) {
            log('Sucesso: Iniciando download');
            return res.download(absolutePath);
        } else {
            log(`Erro: Arquivo não encontrado: ${absolutePath}`);
            // Listar arquivos no diretório para depuração
            const dirToLog = path.dirname(absolutePath);
            if (await fs.pathExists(dirToLog)) {
                const filesInDir = await fs.readdir(dirToLog);
                log(`Arquivos no diretório ${dirToLog}: ${filesInDir.join(', ')}`);
            } else {
                log(`Diretório pai não existe: ${dirToLog}`);
            }
            return res.status(404).json({ error: 'Arquivo não encontrado' });
        }
    } catch (error) {
        log(`Erro crítico: ${error.message}`);
        res.status(500).json({ error: 'Erro ao processar download' });
    }
});

// Rota para renomear
app.post('/api/rename', async (req, res) => {
    const { oldName, newName, folder } = req.body;
    const folderPath = folder || '';
    const oldAbsolutePath = path.join(STORAGE_PATH, folderPath, oldName);
    const newAbsolutePath = path.join(STORAGE_PATH, folderPath, newName);

    if (!oldAbsolutePath.startsWith(STORAGE_PATH) || !newAbsolutePath.startsWith(STORAGE_PATH)) {
        return res.status(403).json({ error: 'Acesso negado' });
    }

    try {
        await fs.rename(oldAbsolutePath, newAbsolutePath);

        // Atualizar metadados (mover entrada do antigo para o novo nome)
        const absoluteFolder = path.join(STORAGE_PATH, folderPath);
        const metadataPath = path.join(absoluteFolder, '.metadata.json');
        if (await fs.pathExists(metadataPath)) {
            const metadata = await fs.readJson(metadataPath);
            if (metadata[oldName]) {
                metadata[newName] = metadata[oldName];
                delete metadata[oldName];
                await fs.writeJson(metadataPath, metadata, { spaces: 2 });
            }
        }

        res.json({ message: 'Renomeado com sucesso' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao renomear' });
    }
});

// Rota para excluir
app.post('/api/delete', async (req, res) => {
    const { name, folder } = req.body;
    const absolutePath = path.resolve(STORAGE_PATH, folder || '', name);
    const rootPath = path.resolve(STORAGE_PATH);

    if (!absolutePath.startsWith(rootPath) || absolutePath === rootPath) {
        return res.status(403).json({ error: 'Acesso negado ou operação inválida' });
    }

    try {
        await fs.remove(absolutePath);

        // Remover dos metadados
        await updateMetadata(folder || '', name, null, true);

        res.json({ message: 'Excluído com sucesso' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao excluir' });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    const interfaces = os.networkInterfaces();
    let localIp = 'localhost';
    
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                localIp = iface.address;
                break;
            }
        }
    }

    console.log(`\n🚀 InfoDrive Backend`);
    console.log(`- Local:   http://localhost:${PORT}`);
    console.log(`- Network: http://${localIp}:${PORT}\n`);
});
