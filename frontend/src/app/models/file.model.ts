export interface PatientFile {
    id: string;
    patientId: string;
    fileName: string;
    originalName: string;
    storedPath?: string;
    filePath?: string;
    mimeType: string;
    fileSize: number;
    size?: number; // Legacy support
    category: 'radiografia' | 'ecografia' | 'analitica' | 'informe' | 'otro';
    description?: string;
    uploadDate: string;
    createdAt?: string; // Legacy support
    checksum?: string | null;
}

export interface FileUploadData {
    file: File;
    category: string;
    description?: string;
}
