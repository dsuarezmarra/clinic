const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const prisma = require('../services/database');
// Helper: prefer injected Supabase shim (req.prisma) otherwise fallback to Prisma
const getDb = (req) => req.prisma || prisma;

const router = express.Router();

// Configurar multer para subida de archivos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../../uploads');

        // Crear directorio si no existe
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Generar nombre único para el archivo
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + extension);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    },
    fileFilter: function (req, file, cb) {
        // Tipos de archivo permitidos
        const allowedMimes = [
            'image/jpeg',
            'image/png',
            'image/gif',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];

        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Tipo de archivo no permitido'), false);
        }
    }
});

// Obtener archivos de un paciente
router.get('/patient/:patientId', async (req, res) => {
    try {
        const { patientId } = req.params;

        const files = await getDb(req).patientFile.findMany({
            where: {
                patientId: patientId
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Mapear los campos para coincidir con el modelo del frontend
        const mappedFiles = files.map(file => ({
            id: file.id,
            patientId: file.patientId,
            fileName: file.originalName,
            originalName: file.originalName,
            fileSize: file.size,
            mimeType: file.mimeType,
            category: file.category,
            description: file.description,
            uploadDate: file.createdAt instanceof Date ? file.createdAt.toISOString() : file.createdAt,
            filePath: file.storedPath
        }));

        res.json(mappedFiles);
    } catch (error) {
        console.error('Error fetching patient files:', error);
        res.status(500).json({ error: 'Error al obtener los archivos del paciente' });
    }
});

// Subir archivo para un paciente
router.post('/patient/:patientId', upload.single('file'), async (req, res) => {
    try {
        const { patientId } = req.params;
        const { category, description } = req.body;

        if (!req.file) {
            return res.status(400).json({ error: 'No se recibió ningún archivo' });
        }

        // Verificar que el paciente existe
        const patient = await getDb(req).patients.findUnique({
            where: { id: patientId }
        });

        if (!patient) {
            // Eliminar el archivo subido si el paciente no existe
            fs.unlinkSync(req.file.path);
            return res.status(404).json({ error: 'Paciente no encontrado' });
        }

        // Calcular checksum del archivo
        const fileBuffer = fs.readFileSync(req.file.path);
        const checksum = crypto.createHash('md5').update(fileBuffer).digest('hex');

        // Guardar información del archivo en la base de datos
        const patientFile = await getDb(req).patientFile.create({
            data: {
                patientId: patientId,
                originalName: req.file.originalname,
                storedPath: req.file.path,
                mimeType: req.file.mimetype,
                size: req.file.size,
                category: category || 'otro',
                description: description || null,
                checksum: checksum
            }
        });

        // Mapear la respuesta
        const response = {
            id: patientFile.id,
            patientId: patientFile.patientId,
            fileName: patientFile.originalName,
            originalName: patientFile.originalName,
            fileSize: patientFile.size,
            mimeType: patientFile.mimeType,
            category: patientFile.category,
            description: patientFile.description,
            uploadDate: patientFile.createdAt instanceof Date ? patientFile.createdAt.toISOString() : patientFile.createdAt,
            filePath: patientFile.storedPath
        };

        res.status(201).json(response);
    } catch (error) {
        console.error('Error uploading file:', error);

        // Eliminar el archivo si hay error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({ error: 'Error al subir el archivo' });
    }
});

// Descargar archivo
router.get('/:fileId/download', async (req, res) => {
    try {
        const { fileId } = req.params;

        const file = await getDb(req).patientFile.findUnique({
            where: { id: fileId }
        });

        if (!file) {
            return res.status(404).json({ error: 'Archivo no encontrado' });
        }

        if (!fs.existsSync(file.storedPath)) {
            return res.status(404).json({ error: 'El archivo físico no existe' });
        }

        res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
        res.setHeader('Content-Type', file.mimeType);

        const fileStream = fs.createReadStream(file.storedPath);
        fileStream.pipe(res);
    } catch (error) {
        console.error('Error downloading file:', error);
        res.status(500).json({ error: 'Error al descargar el archivo' });
    }
});

// Vista previa de archivo (para imágenes)
router.get('/:fileId/preview', async (req, res) => {
    try {
        const { fileId } = req.params;

        const file = await getDb(req).patientFile.findUnique({
            where: { id: fileId }
        });

        if (!file) {
            return res.status(404).json({ error: 'Archivo no encontrado' });
        }

        if (!fs.existsSync(file.storedPath)) {
            return res.status(404).json({ error: 'El archivo físico no existe' });
        }

        res.setHeader('Content-Type', file.mimeType);

        const fileStream = fs.createReadStream(file.storedPath);
        fileStream.pipe(res);
    } catch (error) {
        console.error('Error serving file preview:', error);
        res.status(500).json({ error: 'Error al mostrar la vista previa' });
    }
});

// Eliminar archivo
router.delete('/:fileId', async (req, res) => {
    try {
        const { fileId } = req.params;

        const file = await getDb(req).patientFile.findUnique({
            where: { id: fileId }
        });

        if (!file) {
            return res.status(404).json({ error: 'Archivo no encontrado' });
        }

        // Eliminar archivo físico
        if (fs.existsSync(file.storedPath)) {
            fs.unlinkSync(file.storedPath);
        }

        // Eliminar registro de la base de datos
        await getDb(req).patientFile.delete({
            where: { id: fileId }
        });

        res.status(204).send();
    } catch (error) {
        console.error('Error deleting file:', error);
        res.status(500).json({ error: 'Error al eliminar el archivo' });
    }
});

module.exports = router;
